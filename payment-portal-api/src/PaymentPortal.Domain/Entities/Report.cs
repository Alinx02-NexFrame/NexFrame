using PaymentPortal.Domain.Enums;

namespace PaymentPortal.Domain.Entities;

public class Report
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public ReportType ReportType { get; set; }
    public ReportFormat Format { get; set; }
    /// <summary>
    /// Public URL where clients can download the report (e.g. /api/gha/reports/{id}/download).
    /// </summary>
    public string? FileUrl { get; set; }
    /// <summary>
    /// Absolute path to the generated file on the server's filesystem.
    /// Used by the download endpoint to read the file bytes.
    /// </summary>
    public string? FilePath { get; set; }
    /// <summary>
    /// Size of the generated file in bytes (for display / metadata).
    /// </summary>
    public long FileSizeBytes { get; set; }
    public int GeneratedById { get; set; }
    public DateTime GeneratedAt { get; set; } = DateTime.UtcNow;

    public User GeneratedBy { get; set; } = null!;
}
