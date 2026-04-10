namespace PaymentPortal.Domain.Entities;

public class Company
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string? TaxId { get; set; }
    public decimal AccountCredit { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public ICollection<User> Users { get; set; } = new List<User>();
    public ICollection<Payment> Payments { get; set; } = new List<Payment>();
    public ICollection<Watchlist> Watchlists { get; set; } = new List<Watchlist>();
}
