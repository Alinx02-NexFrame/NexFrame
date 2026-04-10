namespace PaymentPortal.Domain.Entities;

public class WatchlistItem
{
    public int Id { get; set; }
    public int WatchlistId { get; set; }
    public string AwbNumber { get; set; } = string.Empty;
    public DateTime AddedAt { get; set; } = DateTime.UtcNow;

    public Watchlist Watchlist { get; set; } = null!;
}
