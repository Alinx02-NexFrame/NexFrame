using PaymentPortal.Domain.Enums;

namespace PaymentPortal.Domain.Entities;

public class Cargo
{
    public int Id { get; set; }
    public string AwbNumber { get; set; } = string.Empty;
    public string Origin { get; set; } = string.Empty;
    public string Destination { get; set; } = string.Empty;
    public DateTime FlightDate { get; set; }
    public DateTime ArrivalDate { get; set; }
    public string ArrivalTime { get; set; } = string.Empty;
    public BreakdownStatus BreakdownStatus { get; set; }
    public CustomsStatus CustomsStatus { get; set; }
    public DateTime StorageStartDate { get; set; }
    public int FreeTimeDays { get; set; }
    public int Pieces { get; set; }
    public decimal Weight { get; set; }
    public string Description { get; set; } = string.Empty;
    public string Consignee { get; set; } = string.Empty;
    public bool ReadyToPickup { get; set; }

    public BillingRecord? BillingRecord { get; set; }
    public ICollection<Payment> Payments { get; set; } = new List<Payment>();
}
