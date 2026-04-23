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

    public PaymentService(AppDbContext db, BillingCalculationService calc, IMapper mapper, IAuditLogService audit)
    {
        _db = db;
        _calc = calc;
        _mapper = mapper;
        _audit = audit;
    }

    public async Task<PaymentConfirmationDto> ProcessPaymentAsync(CreatePaymentRequest request, int? userId = null)
    {
        var cargo = await _db.Cargo.FirstOrDefaultAsync(c => c.AwbNumber == request.AwbNumber)
            ?? throw new KeyNotFoundException($"Cargo not found for AWB: {request.AwbNumber}");

        var billing = _calc.Calculate(cargo);
        var method = ParsePaymentMethod(request.PaymentMethod);

        User? user = userId.HasValue
            ? await _db.Users.Include(u => u.Company).FirstOrDefaultAsync(u => u.Id == userId.Value)
            : null;

        var payment = new Payment
        {
            ConfirmationNumber = $"PMT-{DateTime.UtcNow:yyyyMMddHHmmss}{Random.Shared.Next(100, 999)}",
            AwbNumber = request.AwbNumber,
            Amount = billing.Total,
            ProcessingFee = billing.ProcessingFee,
            PaymentMethod = method,
            PaymentStatus = PaymentStatus.Completed,
            Email = request.Email,
            CardLast4 = request.CardNumber?.Length >= 4 ? request.CardNumber[^4..] : null,
            UserId = userId,
            CompanyId = user?.CompanyId,
            CargoId = cargo.Id,
            PaymentDate = DateTime.UtcNow
        };

        _db.Payments.Add(payment);

        // Update billing record status
        var existingBilling = await _db.BillingRecords.FirstOrDefaultAsync(b => b.CargoId == cargo.Id);
        if (existingBilling != null)
        {
            existingBilling.Status = BillingStatus.Paid;
            existingBilling.UpdatedAt = DateTime.UtcNow;
        }

        await _db.SaveChangesAsync();

        await _audit.LogAsync(
            userId,
            "Payment",
            "Payment",
            payment.ConfirmationNumber,
            $"awb={payment.AwbNumber}, amount={payment.Amount}, method={payment.PaymentMethod}");

        return _mapper.Map<PaymentConfirmationDto>(payment);
    }

    public async Task<PaymentConfirmationDto> ProcessAuthenticatedPaymentAsync(CreatePaymentRequest request, int userId)
    {
        // ProcessPaymentAsync already writes a "Payment" audit entry.
        return await ProcessPaymentAsync(request, userId);
    }

    public async Task<List<PaymentConfirmationDto>> ProcessBulkPaymentAsync(BulkPaymentRequest request, int userId)
    {
        var results = new List<PaymentConfirmationDto>();
        foreach (var awb in request.AwbNumbers)
        {
            var paymentRequest = new CreatePaymentRequest
            {
                AwbNumber = awb,
                PaymentMethod = request.PaymentMethod,
                Email = (await _db.Users.FindAsync(userId))?.Email ?? ""
            };
            var result = await ProcessPaymentAsync(paymentRequest, userId);
            results.Add(result);
        }

        var totalAmount = results.Sum(r => r.Amount);
        await _audit.LogAsync(
            userId,
            "BulkPayment",
            "Payment",
            null,
            $"count={results.Count}, totalAmount={totalAmount}");

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

    private static PaymentMethod ParsePaymentMethod(string method) => method switch
    {
        "Credit Card" => PaymentMethod.CreditCard,
        "ACH" => PaymentMethod.ACH,
        "International Wire" => PaymentMethod.InternationalWire,
        _ => throw new ArgumentException($"Invalid payment method: {method}")
    };
}
