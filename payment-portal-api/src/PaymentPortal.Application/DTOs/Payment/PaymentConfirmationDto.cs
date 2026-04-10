namespace PaymentPortal.Application.DTOs.Payment;

public class PaymentConfirmationDto
{
    public string ConfirmationNumber { get; set; } = string.Empty;
    public string AwbNumber { get; set; } = string.Empty;
    public decimal Amount { get; set; }
    public string PaymentDate { get; set; } = string.Empty;
    public string PaymentMethod { get; set; } = string.Empty;
}
