using PaymentPortal.Domain.Enums;

namespace PaymentPortal.Domain.Entities;

public class UploadHistory
{
    public int Id { get; set; }
    public string FileName { get; set; } = string.Empty;
    public UploadStatus Status { get; set; }
    public int RecordCount { get; set; }
    public int? CompanyId { get; set; }
    public int UploadedById { get; set; }
    public DateTime UploadedAt { get; set; } = DateTime.UtcNow;
    public string? ErrorMessage { get; set; }

    public User UploadedBy { get; set; } = null!;
}
