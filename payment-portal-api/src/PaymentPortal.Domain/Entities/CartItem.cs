namespace PaymentPortal.Domain.Entities;

public class CartItem
{
    public int Id { get; set; }
    public int CartId { get; set; }
    public string AwbNumber { get; set; } = string.Empty;
    public decimal Amount { get; set; }
    public DateTime AddedAt { get; set; } = DateTime.UtcNow;

    public Cart Cart { get; set; } = null!;
}
