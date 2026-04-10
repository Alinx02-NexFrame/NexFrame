namespace PaymentPortal.Application.DTOs.Payment;

public class CreatePaymentRequest
{
    public string AwbNumber { get; set; } = string.Empty;
    public string PaymentMethod { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string? CardNumber { get; set; }
    public string? CardExpiry { get; set; }
    public string? CardCVV { get; set; }
    public string? AccountNumber { get; set; }
    public string? RoutingNumber { get; set; }
}

public class BulkPaymentRequest
{
    public List<string> AwbNumbers { get; set; } = new();
    public string PaymentMethod { get; set; } = string.Empty;
}
