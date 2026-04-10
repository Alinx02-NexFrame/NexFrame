namespace PaymentPortal.Domain.Entities;

public class Watchlist
{
    public int Id { get; set; }
    public int CompanyId { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public Company Company { get; set; } = null!;
    public ICollection<WatchlistItem> Items { get; set; } = new List<WatchlistItem>();
}
