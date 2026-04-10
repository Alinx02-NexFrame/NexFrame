using PaymentPortal.Domain.Enums;

namespace PaymentPortal.Domain.Entities;

public class Payment
{
    public int Id { get; set; }
    public string ConfirmationNumber { get; set; } = string.Empty;
    public string AwbNumber { get; set; } = string.Empty;
    public decimal Amount { get; set; }
    public decimal ProcessingFee { get; set; }
    public PaymentMethod PaymentMethod { get; set; }
    public PaymentStatus PaymentStatus { get; set; } = PaymentStatus.Processing;
    public string Email { get; set; } = string.Empty;
    public string? CardLast4 { get; set; }
    public int? UserId { get; set; }
    public int? CompanyId { get; set; }
    public int? CargoId { get; set; }
    public DateTime PaymentDate { get; set; } = DateTime.UtcNow;

    public User? User { get; set; }
    public Company? Company { get; set; }
    public Cargo? Cargo { get; set; }
}
