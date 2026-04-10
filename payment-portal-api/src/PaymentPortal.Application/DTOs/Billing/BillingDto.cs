namespace PaymentPortal.Application.DTOs.Billing;

public class BillingDto
{
    public string AwbNumber { get; set; } = string.Empty;
    public decimal ServiceFee { get; set; }
    public decimal StorageFee { get; set; }
    public decimal OtherCharge { get; set; }
    public decimal Subtotal { get; set; }
    public decimal ProcessingFee { get; set; }
    public decimal Total { get; set; }
}
