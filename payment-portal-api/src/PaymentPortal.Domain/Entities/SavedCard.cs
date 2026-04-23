namespace PaymentPortal.Domain.Entities;

/// <summary>
/// Company-scoped stored payment card. Shared by all forwarder users within
/// the same Company — typical use case is Accounts Payable registering a
/// corporate card once for the whole team.
///
/// PCI: never store raw PAN or CVV. Only the gateway-issued token is
/// persisted, plus the last-four digits for display.
/// </summary>
public class SavedCard
{
    public int Id { get; set; }
    public int CompanyId { get; set; }
    public string CardLast4 { get; set; } = string.Empty;
    public string CardBrand { get; set; } = string.Empty;
    public string CardHolderName { get; set; } = string.Empty;
    public int ExpiryMonth { get; set; }
    public int ExpiryYear { get; set; }
    public string GatewayToken { get; set; } = string.Empty;
    public bool IsDefault { get; set; }
    public int CreatedByUserId { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public Company Company { get; set; } = null!;
}
