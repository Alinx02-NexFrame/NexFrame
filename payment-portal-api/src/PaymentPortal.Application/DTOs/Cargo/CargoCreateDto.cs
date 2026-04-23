namespace PaymentPortal.Application.DTOs.Cargo;

/// <summary>
/// Payload for creating a new Cargo record (GhaAdmin only).
/// AwbNumber is the natural key supplied by the caller.
/// Status fields accept the same string formats produced by CargoDto
/// (e.g. "In Progress", "Completed", "PNF", "Hold", "Released").
/// </summary>
public class CargoCreateDto
{
    public string AwbNumber { get; set; } = string.Empty;
    public string Origin { get; set; } = string.Empty;
    public string Destination { get; set; } = string.Empty;
    public DateTime FlightDate { get; set; }
    public DateTime ArrivalDate { get; set; }
    public string ArrivalTime { get; set; } = string.Empty;
    public string BreakdownStatus { get; set; } = "InProgress";
    public string CustomsStatus { get; set; } = "PNF";
    public DateTime StorageStartDate { get; set; }
    public int FreeTimeDays { get; set; }
    public int Pieces { get; set; }
    public decimal Weight { get; set; }
    public string Description { get; set; } = string.Empty;
    public string Consignee { get; set; } = string.Empty;
    public bool ReadyToPickup { get; set; }
}
