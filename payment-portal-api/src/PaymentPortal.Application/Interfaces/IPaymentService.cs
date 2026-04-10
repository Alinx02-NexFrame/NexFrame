using PaymentPortal.Application.DTOs.Payment;

namespace PaymentPortal.Application.Interfaces;

public interface IPaymentService
{
    Task<PaymentConfirmationDto> ProcessPaymentAsync(CreatePaymentRequest request, int? userId = null);
    Task<PaymentConfirmationDto> ProcessAuthenticatedPaymentAsync(CreatePaymentRequest request, int userId);
    Task<List<PaymentConfirmationDto>> ProcessBulkPaymentAsync(BulkPaymentRequest request, int userId);
    Task<byte[]> GenerateReceiptPdfAsync(string confirmationNumber);
}
