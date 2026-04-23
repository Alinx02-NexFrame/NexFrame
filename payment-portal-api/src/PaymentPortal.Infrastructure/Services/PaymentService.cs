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
        var payment = await _db.Payments.FirstOrDefaultAsync(p => p.ConfirmationNumber == confirmationNumber)
            ?? throw new KeyNotFoundException($"Payment not found: {confirmationNumber}");

        QuestPDF.Settings.License = LicenseType.Community;

        var document = Document.Create(container =>
        {
            container.Page(page =>
            {
                page.Size(PageSizes.A4);
                page.Margin(50);

                page.Header().Text("Payment Receipt").FontSize(24).Bold().AlignCenter();

                page.Content().PaddingVertical(20).Column(col =>
                {
                    col.Spacing(10);

                    col.Item().Text($"Confirmation: {payment.ConfirmationNumber}").FontSize(14);
                    col.Item().Text($"AWB Number: {payment.AwbNumber}").FontSize(12);
                    col.Item().Text($"Payment Date: {payment.PaymentDate:yyyy-MM-dd HH:mm}").FontSize(12);
                    col.Item().Text($"Payment Method: {payment.PaymentMethod}").FontSize(12);
                    col.Item().LineHorizontal(1);
                    col.Item().Text($"Amount: ${payment.Amount:N2}").FontSize(14).Bold();
                    col.Item().Text($"Processing Fee: ${payment.ProcessingFee:N2}").FontSize(12);
                    col.Item().LineHorizontal(1);
                    col.Item().Text($"Email: {payment.Email}").FontSize(12);
                });

                page.Footer().AlignCenter().Text("GHA Payment Portal - Thank you for your payment.");
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
