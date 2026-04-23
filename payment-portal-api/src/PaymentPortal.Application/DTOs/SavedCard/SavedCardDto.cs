namespace PaymentPortal.Application.DTOs.SavedCard;

public class SavedCardDto
{
    public int Id { get; set; }
    public string CardLast4 { get; set; } = string.Empty;
    public string CardBrand { get; set; } = string.Empty;
    public string CardHolderName { get; set; } = string.Empty;
    public int ExpiryMonth { get; set; }
    public int ExpiryYear { get; set; }
    public bool IsDefault { get; set; }
    public string CreatedAt { get; set; } = string.Empty;
}

public class AddSavedCardRequest
{
    public string CardNumber { get; set; } = string.Empty;
    public string CardBrand { get; set; } = string.Empty;
    public string CardHolderName { get; set; } = string.Empty;
    public int ExpiryMonth { get; set; }
    public int ExpiryYear { get; set; }
    public bool IsDefault { get; set; }
}
