using PaymentPortal.Domain.Enums;

namespace PaymentPortal.Domain.Entities;

public class User
{
    public int Id { get; set; }
    public string Username { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string PasswordHash { get; set; } = string.Empty;
    public string FullName { get; set; } = string.Empty;
    public UserRole Role { get; set; }
    public int? CompanyId { get; set; }
    public CompanyRole? CompanyRole { get; set; }
    public bool IsActive { get; set; } = true;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public Company? Company { get; set; }
    public ICollection<RefreshToken> RefreshTokens { get; set; } = new List<RefreshToken>();
    public ICollection<Payment> Payments { get; set; } = new List<Payment>();
    public ICollection<Report> Reports { get; set; } = new List<Report>();
}
