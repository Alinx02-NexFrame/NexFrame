using PaymentPortal.Domain.Enums;

namespace PaymentPortal.Domain.Entities;

public class BillingRecord
{
    public int Id { get; set; }
    public int CargoId { get; set; }
    public decimal ServiceFee { get; set; }
    public decimal StorageFee { get; set; }
    public decimal OtherCharge { get; set; }
    public decimal Subtotal { get; set; }
    public decimal ProcessingFee { get; set; }
    public decimal Total { get; set; }
    public DateTime DueDate { get; set; }
    public BillingStatus Status { get; set; } = BillingStatus.Pending;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

    public Cargo Cargo { get; set; } = null!;
}
