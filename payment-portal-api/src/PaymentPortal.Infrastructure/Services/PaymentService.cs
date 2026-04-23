using AutoMapper;
using Microsoft.EntityFrameworkCore;
using PaymentPortal.Application.DTOs.Payment;
using PaymentPortal.Application.Interfaces;
using PaymentPortal.Domain.Entities;
using PaymentPortal.Domain.Enums;
using PaymentPortal.Domain.Services;
using PaymentPortal.Infrastructure.Data;
using QuestPDF.Fluent;
using QuestPDF.Helpers;
using QuestPDF.Infrastructure;

namespace PaymentPortal.Infrastructure.Services;

public class PaymentService : IPaymentService
{
    private readonly AppDbContext _db;
    private readonly BillingCalculationService _calc;
    private readonly IMapper _mapper;
    private readonly IAuditLogService _audit;
    private readonly ICartService _cart;

    public PaymentService(AppDbContext db, BillingCalculationService calc, IMapper mapper, IAuditLogService audit, ICartService cart)
    {
        _db = db;
        _calc = calc;
        _mapper = mapper;
        _audit = audit;
        _cart = cart;
    }

    public async Task<PaymentConfirmationDto> ProcessPaymentAsync(CreatePaymentRequest request, int? userId = null, Guid? batchId = null)
    {
        var cargo = await _db.Cargo.FirstOrDefaultAsync(c => c.AwbNumber == request.AwbNumber)
            ?? throw new KeyNotFoundException($"Cargo not found for AWB: {request.AwbNumber}");

        var billing = _calc.Calculate(cargo);
        var method = ParsePaymentMethod(request.PaymentMethod);

        User? user = userId.HasValue
            ? await _db.Users.Include(u => u.Company).FirstOrDefaultAsync(u => u.Id == userId.Value)
            : null;

        // Resolve card last4: prefer SavedCard, fall back to raw CardNumber.
        string? cardLast4 = null;
        if (request.SavedCardId.HasValue && user?.CompanyId != null)
        {
            var savedCard = await _db.SavedCards
                .FirstOrDefaultAsync(c => c.Id == request.SavedCardId.Value && c.CompanyId == user.CompanyId)
                ?? throw new KeyNotFoundException("Saved card not found for your company.");
            cardLast4 = savedCard.CardLast4;
            // TODO: pass savedCard.GatewayToken to real payment gateway (Stripe etc.)
        }
        else if (request.CardNumber?.Length >= 4)
        {
            cardLast4 = request.CardNumber[^4..];
        }

        var payment = new Payment
        {
            ConfirmationNumber = $"PMT-{DateTime.UtcNow:yyyyMMddHHmmss}{Random.Shared.Next(100, 999)}",
            AwbNumber = request.AwbNumber,
            Amount = billing.Total,
            ProcessingFee = billing.ProcessingFee,
            PaymentMethod = method,
            PaymentStatus = PaymentStatus.Completed,
            Email = request.Email,
            CardLast4 = cardLast4,
            UserId = userId,
            CompanyId = user?.CompanyId,
            CargoId = cargo.Id,
            PaymentDate = DateTime.UtcNow,
            BatchId = batchId
        };

        _db.Payments.Add(payment);

        // Update billing record status
        var existingBilling = await _db.BillingRecords.FirstOrDefaultAsync(b => b.CargoId == cargo.Id);
        if (existingBilling != null)
        {
            existingBilling.Status = BillingStatus.Paid;
            existingBilling.UpdatedAt = DateTime.UtcNow;
        }

        // Associate cargo with the paying company (first payment wins — keeps
        // legacy CompanyId stable if paid again later).
        if (cargo.CompanyId == null && user?.CompanyId != null)
        {
            cargo.CompanyId = user.CompanyId;
        }

        await _db.SaveChangesAsync();

        await _audit.LogAsync(
            userId,
            "Payment",
            "Payment",
            payment.ConfirmationNumber,
            $"awb={payment.AwbNumber}, amount={payment.Amount}, method={payment.PaymentMethod}");

        if (userId.HasValue)
            await _cart.RemoveByAwbAsync(userId.Value, request.AwbNumber);

        return _mapper.Map<PaymentConfirmationDto>(payment);
    }

    public async Task<PaymentConfirmationDto> ProcessAuthenticatedPaymentAsync(CreatePaymentRequest request, int userId)
    {
        // ProcessPaymentAsync already writes a "Payment" audit entry.
        return await ProcessPaymentAsync(request, userId);
    }

    public async Task<List<PaymentConfirmationDto>> ProcessBulkPaymentAsync(BulkPaymentRequest request, int userId)
    {
        // Resolve effective receipt email once: explicit override wins, else fall back to user's account email.
        var fallbackEmail = (await _db.Users.FindAsync(userId))?.Email ?? "";
        var email = !string.IsNullOrWhiteSpace(request.Email) ? request.Email! : fallbackEmail;

        // One BatchId per submission — stamped on every Payment row in this
        // bulk call so the bulk-receipt endpoint can look them up with a
        // single indexed WHERE instead of a confirmation-list IN(...).
        var batchId = Guid.NewGuid();

        var results = new List<PaymentConfirmationDto>();
        foreach (var awb in request.AwbNumbers)
        {
            var paymentRequest = new CreatePaymentRequest
            {
                AwbNumber = awb,
                PaymentMethod = request.PaymentMethod,
                Email = email
            };
            var result = await ProcessPaymentAsync(paymentRequest, userId, batchId);
            results.Add(result);
        }

        var totalAmount = results.Sum(r => r.Amount);
        await _audit.LogAsync(
            userId,
            "BulkPayment",
            "Payment",
            batchId.ToString(),
            $"count={results.Count}, totalAmount={totalAmount}, batchId={batchId}");

        return results;
    }

    public async Task<byte[]> GenerateReceiptPdfAsync(string confirmationNumber)
    {
        var payment = await _db.Payments
            .Include(p => p.Cargo)
            .Include(p => p.Company)
            .FirstOrDefaultAsync(p => p.ConfirmationNumber == confirmationNumber)
            ?? throw new KeyNotFoundException($"Payment not found: {confirmationNumber}");

        QuestPDF.Settings.License = LicenseType.Community;

        // US receipt conventions: MM/dd/yyyy h:mm tt format, USD, US English labels.
        var paymentDateLocal = TimeZoneInfo.ConvertTimeFromUtc(
            DateTime.SpecifyKind(payment.PaymentDate, DateTimeKind.Utc),
            TimeZoneInfo.FindSystemTimeZoneById(OperatingSystem.IsWindows() ? "Eastern Standard Time" : "America/New_York"));
        var paymentDateStr = $"{paymentDateLocal:MM/dd/yyyy h:mm tt} ET";

        var totalCharged = payment.Amount + payment.ProcessingFee;
        var paymentMethodDisplay = payment.PaymentMethod switch
        {
            PaymentMethod.CreditCard => payment.CardLast4 != null ? $"Credit Card ending in ****{payment.CardLast4}" : "Credit Card",
            PaymentMethod.ACH => "ACH Bank Transfer",
            PaymentMethod.InternationalWire => "International Wire Transfer",
            _ => payment.PaymentMethod.ToString()
        };
        var statusText = payment.PaymentStatus.ToString();

        var document = Document.Create(container =>
        {
            container.Page(page =>
            {
                page.Size(PageSizes.Letter);  // US standard
                page.Margin(50);
                page.DefaultTextStyle(t => t.FontSize(10).FontColor(Colors.Grey.Darken4));

                // Header: merchant identity
                page.Header().Column(headerCol =>
                {
                    headerCol.Item().Text("GHA Payment Portal").FontSize(20).Bold().FontColor(Colors.Blue.Darken3);
                    headerCol.Item().Text("Ground Handling Agent Cargo Services").FontSize(9).Italic();
                    headerCol.Item().Text("support@ghapaymentportal.com").FontSize(9);
                    headerCol.Item().PaddingTop(8).LineHorizontal(1).LineColor(Colors.Grey.Medium);
                });

                page.Content().PaddingVertical(15).Column(col =>
                {
                    col.Spacing(12);

                    // Title + status badge
                    col.Item().Row(row =>
                    {
                        row.RelativeItem().Text("PAYMENT RECEIPT").FontSize(18).Bold();
                        row.ConstantItem(120).AlignRight().Background(Colors.Green.Lighten4)
                            .Padding(6).Text(statusText.ToUpper()).FontSize(11).Bold().FontColor(Colors.Green.Darken3);
                    });

                    // Receipt meta
                    col.Item().Row(row =>
                    {
                        row.RelativeItem().Column(c =>
                        {
                            c.Item().Text("Confirmation Number").FontSize(8).FontColor(Colors.Grey.Darken1);
                            c.Item().Text(payment.ConfirmationNumber).FontSize(11).Bold();
                        });
                        row.RelativeItem().Column(c =>
                        {
                            c.Item().Text("Receipt Date").FontSize(8).FontColor(Colors.Grey.Darken1);
                            c.Item().Text(paymentDateStr).FontSize(11);
                        });
                    });

                    // Bill-to / Customer
                    col.Item().PaddingTop(6).Background(Colors.Grey.Lighten3).Padding(10).Column(c =>
                    {
                        c.Item().Text("BILL TO").FontSize(8).Bold().FontColor(Colors.Grey.Darken2);
                        if (payment.Company != null)
                            c.Item().Text(payment.Company.Name).FontSize(11).Bold();
                        c.Item().Text(payment.Email).FontSize(10);
                    });

                    // Cargo details
                    if (payment.Cargo != null)
                    {
                        col.Item().PaddingTop(4).Column(c =>
                        {
                            c.Item().Text("CARGO DETAILS").FontSize(9).Bold();
                            c.Item().PaddingTop(4).Border(1).BorderColor(Colors.Grey.Lighten1).Padding(8).Column(inner =>
                            {
                                inner.Item().Row(row =>
                                {
                                    row.RelativeItem().Text($"AWB: {payment.AwbNumber}").FontSize(10);
                                    row.RelativeItem().Text($"Flight Date: {payment.Cargo.FlightDate:MM/dd/yyyy}").FontSize(10);
                                });
                                inner.Item().PaddingTop(2).Row(row =>
                                {
                                    row.RelativeItem().Text($"Origin: {payment.Cargo.Origin}").FontSize(10);
                                    row.RelativeItem().Text($"Destination: {payment.Cargo.Destination}").FontSize(10);
                                });
                                inner.Item().PaddingTop(2).Row(row =>
                                {
                                    row.RelativeItem().Text($"Pieces: {payment.Cargo.Pieces}").FontSize(10);
                                    row.RelativeItem().Text($"Weight: {payment.Cargo.Weight:N1} lbs").FontSize(10);
                                });
                            });
                        });
                    }
                    else
                    {
                        col.Item().Text($"AWB: {payment.AwbNumber}").FontSize(10);
                    }

                    // Payment breakdown table
                    col.Item().PaddingTop(8).Column(c =>
                    {
                        c.Item().Text("PAYMENT BREAKDOWN").FontSize(9).Bold();
                        c.Item().PaddingTop(4).Table(table =>
                        {
                            table.ColumnsDefinition(cols =>
                            {
                                cols.RelativeColumn(3);
                                cols.RelativeColumn(1);
                            });

                            table.Cell().PaddingVertical(4).Text("Service Charges").FontSize(10);
                            table.Cell().PaddingVertical(4).AlignRight().Text($"${payment.Amount:N2}").FontSize(10);

                            table.Cell().PaddingVertical(4).Text("Processing Fee").FontSize(10);
                            table.Cell().PaddingVertical(4).AlignRight().Text($"${payment.ProcessingFee:N2}").FontSize(10);

                            table.Cell().BorderTop(1).BorderColor(Colors.Grey.Darken1).PaddingTop(6)
                                .Text("TOTAL CHARGED (USD)").FontSize(11).Bold();
                            table.Cell().BorderTop(1).BorderColor(Colors.Grey.Darken1).PaddingTop(6).AlignRight()
                                .Text($"${totalCharged:N2}").FontSize(11).Bold();
                        });
                    });

                    // Payment method
                    col.Item().PaddingTop(8).Background(Colors.Blue.Lighten5).Padding(10).Column(c =>
                    {
                        c.Item().Text("PAYMENT METHOD").FontSize(8).Bold().FontColor(Colors.Blue.Darken3);
                        c.Item().Text(paymentMethodDisplay).FontSize(11);
                    });
                });

                page.Footer().Column(footerCol =>
                {
                    footerCol.Item().LineHorizontal(0.5f).LineColor(Colors.Grey.Medium);
                    footerCol.Item().PaddingTop(6).AlignCenter().Text("Thank you for your payment. This receipt is your proof of payment.")
                        .FontSize(9).FontColor(Colors.Grey.Darken2);
                    footerCol.Item().AlignCenter().Text("Questions? Contact support@ghapaymentportal.com").FontSize(8).FontColor(Colors.Grey.Darken1);
                    footerCol.Item().AlignCenter().Text(t =>
                    {
                        t.DefaultTextStyle(s => s.FontSize(8).FontColor(Colors.Grey.Medium));
                        t.Span("Page ");
                        t.CurrentPageNumber();
                        t.Span(" of ");
                        t.TotalPages();
                    });
                });
            });
        });

        return document.GeneratePdf();
    }

    public async Task<byte[]> GenerateBulkReceiptPdfByBatchAsync(Guid batchId, int userId)
    {
        // Look up the batch via the indexed BatchId column, authorize the
        // owner, then delegate to the confirmation-number path so the PDF
        // rendering stays in one place.
        var confirmations = await _db.Payments
            .AsNoTracking()
            .Where(p => p.BatchId == batchId)
            .Select(p => new { p.ConfirmationNumber, p.UserId })
            .ToListAsync();

        if (confirmations.Count == 0)
            throw new KeyNotFoundException("No payments found for this batch.");

        if (confirmations.Any(c => c.UserId != userId))
            throw new KeyNotFoundException("No payments found for this batch."); // leak-resistant 404

        return await GenerateBulkReceiptPdfAsync(confirmations.Select(c => c.ConfirmationNumber), userId);
    }

    public async Task<byte[]> GenerateBulkReceiptPdfAsync(IEnumerable<string> confirmationNumbers, int userId)
    {
        var ids = confirmationNumbers?.Distinct().ToList() ?? new List<string>();
        if (ids.Count == 0)
            throw new KeyNotFoundException("No confirmation numbers provided.");

        // Single-confirmation case: reuse the existing single-receipt renderer for layout consistency.
        // Still enforce the auth check before delegating.
        if (ids.Count == 1)
        {
            var single = await _db.Payments
                .AsNoTracking()
                .FirstOrDefaultAsync(p => p.ConfirmationNumber == ids[0])
                ?? throw new KeyNotFoundException($"Payment not found: {ids[0]}");
            if (single.UserId != userId)
                throw new KeyNotFoundException($"Payment not found: {ids[0]}"); // security through obscurity
            return await GenerateReceiptPdfAsync(ids[0]);
        }

        var payments = await _db.Payments
            .Include(p => p.Cargo)
            .Include(p => p.Company)
            .Where(p => ids.Contains(p.ConfirmationNumber))
            .ToListAsync();

        if (payments.Count == 0)
            throw new KeyNotFoundException("No matching payments found.");

        // Authorization: every payment must belong to the requesting user.
        // Mismatch (or missing rows) is treated as not-found to avoid leaking existence.
        if (payments.Any(p => p.UserId != userId) || payments.Count != ids.Count)
            throw new KeyNotFoundException("No matching payments found.");

        // Order by PaymentDate ascending so the "first" payment used for meta is deterministic.
        payments = payments.OrderBy(p => p.PaymentDate).ThenBy(p => p.Id).ToList();
        var first = payments[0];

        QuestPDF.Settings.License = LicenseType.Community;

        var tz = TimeZoneInfo.FindSystemTimeZoneById(OperatingSystem.IsWindows() ? "Eastern Standard Time" : "America/New_York");
        var firstDateLocal = TimeZoneInfo.ConvertTimeFromUtc(
            DateTime.SpecifyKind(first.PaymentDate, DateTimeKind.Utc), tz);
        var paymentDateStr = $"{firstDateLocal:MM/dd/yyyy h:mm tt} ET";

        var batchId = $"BATCH-{first.ConfirmationNumber}-{payments.Count}";

        var totalServiceCharges = payments.Sum(p => p.Amount - p.ProcessingFee);
        var totalProcessingFees = payments.Sum(p => p.ProcessingFee);
        var grandTotal = payments.Sum(p => p.Amount);

        var paymentMethodDisplay = first.PaymentMethod switch
        {
            PaymentMethod.CreditCard => first.CardLast4 != null ? $"Credit Card ending in ****{first.CardLast4}" : "Credit Card",
            PaymentMethod.ACH => "ACH Bank Transfer",
            PaymentMethod.InternationalWire => "International Wire Transfer",
            _ => first.PaymentMethod.ToString()
        };
        var statusText = first.PaymentStatus.ToString();

        var document = Document.Create(container =>
        {
            container.Page(page =>
            {
                page.Size(PageSizes.Letter);  // US standard
                page.Margin(50);
                page.DefaultTextStyle(t => t.FontSize(10).FontColor(Colors.Grey.Darken4));

                // Header (same as single receipt)
                page.Header().Column(headerCol =>
                {
                    headerCol.Item().Text("GHA Payment Portal").FontSize(20).Bold().FontColor(Colors.Blue.Darken3);
                    headerCol.Item().Text("Ground Handling Agent Cargo Services").FontSize(9).Italic();
                    headerCol.Item().Text("support@ghapaymentportal.com").FontSize(9);
                    headerCol.Item().PaddingTop(8).LineHorizontal(1).LineColor(Colors.Grey.Medium);
                });

                page.Content().PaddingVertical(15).Column(col =>
                {
                    col.Spacing(12);

                    // Title + status badge + count
                    col.Item().Row(row =>
                    {
                        row.RelativeItem().Column(c =>
                        {
                            c.Item().Text("PAYMENT RECEIPT").FontSize(18).Bold();
                            c.Item().Text($"Bulk receipt for {payments.Count} payments").FontSize(9).Italic().FontColor(Colors.Grey.Darken1);
                        });
                        row.ConstantItem(120).AlignRight().Background(Colors.Green.Lighten4)
                            .Padding(6).Text(statusText.ToUpper()).FontSize(11).Bold().FontColor(Colors.Green.Darken3);
                    });

                    // Receipt meta: batch id + first conf (+N more) + first payment date
                    col.Item().Row(row =>
                    {
                        row.RelativeItem().Column(c =>
                        {
                            c.Item().Text("Batch ID").FontSize(8).FontColor(Colors.Grey.Darken1);
                            c.Item().Text(batchId).FontSize(11).Bold();
                            c.Item().PaddingTop(2).Text($"{first.ConfirmationNumber} (+{payments.Count - 1} more)")
                                .FontSize(9).FontColor(Colors.Grey.Darken2);
                        });
                        row.RelativeItem().Column(c =>
                        {
                            c.Item().Text("Receipt Date").FontSize(8).FontColor(Colors.Grey.Darken1);
                            c.Item().Text(paymentDateStr).FontSize(11);
                        });
                    });

                    // Bill-to / Customer (all payments share the same user/company)
                    col.Item().PaddingTop(6).Background(Colors.Grey.Lighten3).Padding(10).Column(c =>
                    {
                        c.Item().Text("BILL TO").FontSize(8).Bold().FontColor(Colors.Grey.Darken2);
                        if (first.Company != null)
                            c.Item().Text(first.Company.Name).FontSize(11).Bold();
                        c.Item().Text(first.Email).FontSize(10);
                    });

                    // Cargo details table — one row per payment
                    col.Item().PaddingTop(4).Column(c =>
                    {
                        c.Item().Text("CARGO DETAILS").FontSize(9).Bold();
                        c.Item().PaddingTop(4).Table(table =>
                        {
                            table.ColumnsDefinition(cols =>
                            {
                                cols.RelativeColumn(2.4f); // AWB
                                cols.RelativeColumn(1.0f); // Origin
                                cols.RelativeColumn(1.2f); // Destination
                                cols.RelativeColumn(1.6f); // Flight Date
                                cols.RelativeColumn(0.9f); // Pieces
                                cols.RelativeColumn(1.3f); // Weight
                                cols.RelativeColumn(1.5f); // Service
                                cols.RelativeColumn(1.5f); // Processing
                                cols.RelativeColumn(1.5f); // Subtotal
                            });

                            // Header row
                            table.Header(header =>
                            {
                                static QuestPDF.Infrastructure.IContainer HeaderCellStyle(QuestPDF.Infrastructure.IContainer x) =>
                                    x.DefaultTextStyle(s => s.FontSize(8).Bold().FontColor(Colors.Grey.Darken2))
                                     .PaddingVertical(4).BorderBottom(1).BorderColor(Colors.Grey.Darken1);

                                header.Cell().Element(HeaderCellStyle).Text("AWB");
                                header.Cell().Element(HeaderCellStyle).Text("Origin");
                                header.Cell().Element(HeaderCellStyle).Text("Destination");
                                header.Cell().Element(HeaderCellStyle).Text("Flight Date");
                                header.Cell().Element(HeaderCellStyle).AlignRight().Text("Pieces");
                                header.Cell().Element(HeaderCellStyle).AlignRight().Text("Weight (lbs)");
                                header.Cell().Element(HeaderCellStyle).AlignRight().Text("Service");
                                header.Cell().Element(HeaderCellStyle).AlignRight().Text("Processing");
                                header.Cell().Element(HeaderCellStyle).AlignRight().Text("Subtotal");
                            });

                            static QuestPDF.Infrastructure.IContainer BodyCell(QuestPDF.Infrastructure.IContainer x) =>
                                x.PaddingVertical(3).BorderBottom(0.5f).BorderColor(Colors.Grey.Lighten2);

                            foreach (var p in payments)
                            {
                                var serviceCharges = p.Amount - p.ProcessingFee;
                                var origin = p.Cargo?.Origin ?? "-";
                                var destination = p.Cargo?.Destination ?? "-";
                                var flightDate = p.Cargo != null ? $"{p.Cargo.FlightDate:MM/dd/yyyy}" : "-";
                                var pieces = p.Cargo != null ? $"{p.Cargo.Pieces:N0}" : "-";
                                var weight = p.Cargo != null ? $"{p.Cargo.Weight:N1}" : "-";

                                table.Cell().Element(BodyCell).Text(p.AwbNumber).FontSize(9);
                                table.Cell().Element(BodyCell).Text(origin).FontSize(9);
                                table.Cell().Element(BodyCell).Text(destination).FontSize(9);
                                table.Cell().Element(BodyCell).Text(flightDate).FontSize(9);
                                table.Cell().Element(BodyCell).AlignRight().Text(pieces).FontSize(9);
                                table.Cell().Element(BodyCell).AlignRight().Text(weight).FontSize(9);
                                table.Cell().Element(BodyCell).AlignRight().Text($"${serviceCharges:N2}").FontSize(9);
                                table.Cell().Element(BodyCell).AlignRight().Text($"${p.ProcessingFee:N2}").FontSize(9);
                                table.Cell().Element(BodyCell).AlignRight().Text($"${p.Amount:N2}").FontSize(9).SemiBold();
                            }
                        });
                    });

                    // Payment method (all payments share the same method)
                    col.Item().PaddingTop(8).Background(Colors.Blue.Lighten5).Padding(10).Column(c =>
                    {
                        c.Item().Text("PAYMENT METHOD").FontSize(8).Bold().FontColor(Colors.Blue.Darken3);
                        c.Item().Text(paymentMethodDisplay).FontSize(11);
                    });

                    // Totals
                    col.Item().PaddingTop(8).Column(c =>
                    {
                        c.Item().Text("TOTALS").FontSize(9).Bold();
                        c.Item().PaddingTop(4).Table(table =>
                        {
                            table.ColumnsDefinition(cols =>
                            {
                                cols.RelativeColumn(3);
                                cols.RelativeColumn(1);
                            });

                            table.Cell().PaddingVertical(4).Text("Total Service Charges").FontSize(10);
                            table.Cell().PaddingVertical(4).AlignRight().Text($"${totalServiceCharges:N2}").FontSize(10);

                            table.Cell().PaddingVertical(4).Text("Total Processing Fees").FontSize(10);
                            table.Cell().PaddingVertical(4).AlignRight().Text($"${totalProcessingFees:N2}").FontSize(10);

                            table.Cell().BorderTop(1).BorderColor(Colors.Grey.Darken1).PaddingTop(6)
                                .Text("GRAND TOTAL (USD)").FontSize(11).Bold();
                            table.Cell().BorderTop(1).BorderColor(Colors.Grey.Darken1).PaddingTop(6).AlignRight()
                                .Text($"${grandTotal:N2}").FontSize(11).Bold();
                        });
                    });
                });

                // Footer (same as single receipt)
                page.Footer().Column(footerCol =>
                {
                    footerCol.Item().LineHorizontal(0.5f).LineColor(Colors.Grey.Medium);
                    footerCol.Item().PaddingTop(6).AlignCenter().Text("Thank you for your payment. This receipt is your proof of payment.")
                        .FontSize(9).FontColor(Colors.Grey.Darken2);
                    footerCol.Item().AlignCenter().Text("Questions? Contact support@ghapaymentportal.com").FontSize(8).FontColor(Colors.Grey.Darken1);
                    footerCol.Item().AlignCenter().Text(t =>
                    {
                        t.DefaultTextStyle(s => s.FontSize(8).FontColor(Colors.Grey.Medium));
                        t.Span("Page ");
                        t.CurrentPageNumber();
                        t.Span(" of ");
                        t.TotalPages();
                    });
                });
            });
        });

        return document.GeneratePdf();
    }

    private static PaymentMethod ParsePaymentMethod(string method) => method switch
    {
        "Credit Card" => PaymentMethod.CreditCard,
        "ACH" => PaymentMethod.ACH,
        "International Wire" => PaymentMethod.InternationalWire,
        _ => throw new ArgumentException($"Invalid payment method: {method}")
    };
}
