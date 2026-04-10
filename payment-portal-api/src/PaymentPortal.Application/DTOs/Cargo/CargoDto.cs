namespace PaymentPortal.Application.DTOs.Cargo;

public class CargoDto
{
    public string AwbNumber { get; set; } = string.Empty;
    public string Origin { get; set; } = string.Empty;
    public string Destination { get; set; } = string.Empty;
    public string FlightDate { get; set; } = string.Empty;
    public string ArrivalDate { get; set; } = string.Empty;
    public string ArrivalTime { get; set; } = string.Empty;
    public string BreakdownStatus { get; set; } = string.Empty;
    public string CustomsStatus { get; set; } = string.Empty;
    public string StorageStartDate { get; set; } = string.Empty;
    public int FreeTimeDays { get; set; }
    public int Pieces { get; set; }
    public decimal Weight { get; set; }
    public string Description { get; set; } = string.Empty;
    public string Consignee { get; set; } = string.Empty;
    public bool ReadyToPickup { get; set; }
}
