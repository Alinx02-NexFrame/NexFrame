namespace PaymentPortal.Application.DTOs.Forwarder;

public class ForwarderDashboardDto
{
    public decimal AccountCredit { get; set; }
    public int PendingCount { get; set; }
    public int OverdueCount { get; set; }
    public decimal TotalPendingAmount { get; set; }
}

public class PendingPaymentDto
{
    public string AwbNumber { get; set; } = string.Empty;
    public string DueDate { get; set; } = string.Empty;
    public decimal Amount { get; set; }
    public string Status { get; set; } = string.Empty;
}

public class CompletedPaymentDto
{
    public string Id { get; set; } = string.Empty;
    public string AwbNumber { get; set; } = string.Empty;
    public string PaymentDate { get; set; } = string.Empty;
    public decimal Amount { get; set; }
    public decimal ProcessingFee { get; set; }
    public string ReceiptUrl { get; set; } = string.Empty;
}

public class TransactionChartDto
{
    public string Month { get; set; } = string.Empty;
    public decimal Amount { get; set; }
    public int Count { get; set; }
}

public class WatchlistDto
{
    public int Id { get; set; }
    public List<WatchlistItemDto> Items { get; set; } = new();
}

public class WatchlistItemDto
{
    public int Id { get; set; }
    public string AwbNumber { get; set; } = string.Empty;
    public string AddedAt { get; set; } = string.Empty;
}

public class AddWatchlistRequest
{
    public string AwbNumber { get; set; } = string.Empty;
}

public class CompanyUserDto
{
    public int Id { get; set; }
    public string Email { get; set; } = string.Empty;
    public string FullName { get; set; } = string.Empty;
    public string? CompanyRole { get; set; }
    public bool IsActive { get; set; }
}

public class CreateCompanyUserRequest
{
    public string Email { get; set; } = string.Empty;
    public string FullName { get; set; } = string.Empty;
    public string Password { get; set; } = string.Empty;
    public string? CompanyRole { get; set; }
}

public class UpdateCompanyUserRequest
{
    public string? FullName { get; set; }
    public string? CompanyRole { get; set; }
    public bool? IsActive { get; set; }
}
