using PaymentPortal.Domain.Enums;

namespace PaymentPortal.Domain.Entities;

public class Report
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public ReportType ReportType { get; set; }
    public ReportFormat Format { get; set; }
    public string? FileUrl { get; set; }
    public int GeneratedById { get; set; }
    public DateTime GeneratedAt { get; set; } = DateTime.UtcNow;

    public User GeneratedBy { get; set; } = null!;
}
