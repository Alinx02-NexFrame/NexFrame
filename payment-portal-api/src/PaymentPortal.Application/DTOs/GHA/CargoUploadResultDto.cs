namespace PaymentPortal.Application.DTOs.GHA;

/// <summary>
/// Result returned by POST /api/gha/data/upload describing the outcome
/// of a cargo bulk upload (Excel or CSV).
/// </summary>
public class CargoUploadResultDto
{
    public int UploadId { get; set; }
    public string FileName { get; set; } = string.Empty;
    /// <summary>One of: Completed, PartialSuccess, Failed.</summary>
    public string Status { get; set; } = string.Empty;
    /// <summary>Total successfully inserted records.</summary>
    public int RecordCount { get; set; }
    /// <summary>Alias of RecordCount for caller convenience.</summary>
    public int SuccessCount { get; set; }
    /// <summary>Number of rows that failed validation or were skipped.</summary>
    public int ErrorCount { get; set; }
    /// <summary>First ~50 row-level errors. Empty when status == Completed.</summary>
    public List<CargoUploadErrorDto> Errors { get; set; } = new();
}

public class CargoUploadErrorDto
{
    /// <summary>1-based row number in the source file (header is row 1).</summary>
    public int Row { get; set; }
    /// <summary>The AWB value as read from the source row, or null if missing.</summary>
    public string? Awb { get; set; }
    public string Reason { get; set; } = string.Empty;
}
