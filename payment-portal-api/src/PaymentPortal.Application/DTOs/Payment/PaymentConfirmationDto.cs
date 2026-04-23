namespace PaymentPortal.Application.DTOs.Payment;

public class PaymentConfirmationDto
{
    public string ConfirmationNumber { get; set; } = string.Empty;
    public string AwbNumber { get; set; } = string.Empty;
    public decimal Amount { get; set; }
    public string PaymentDate { get; set; } = string.Empty;
    public string PaymentMethod { get; set; } = string.Empty;

    /// <summary>
    /// Present only on rows that were part of a bulk payment submission.
    /// Clients use it to request the combined bulk receipt PDF.
    /// </summary>
    public Guid? BatchId { get; set; }
}
