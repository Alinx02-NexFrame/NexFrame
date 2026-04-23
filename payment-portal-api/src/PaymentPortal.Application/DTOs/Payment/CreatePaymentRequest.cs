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

    /// <summary>
    /// Optional — when set, the company's stored SavedCard is used instead
    /// of raw Card fields. PaymentService uses the saved card's GatewayToken
    /// and CardLast4; raw PAN is never required in this flow.
    /// </summary>
    public int? SavedCardId { get; set; }
}

public class BulkPaymentRequest
{
    public List<string> AwbNumbers { get; set; } = new();
    public string PaymentMethod { get; set; } = string.Empty;
    /// <summary>
    /// Optional override email for the receipt. Falls back to the authenticated user's email.
    /// Useful when the payer wants the receipt sent to a different address (e.g. accounting).
    /// </summary>
    public string? Email { get; set; }
}
