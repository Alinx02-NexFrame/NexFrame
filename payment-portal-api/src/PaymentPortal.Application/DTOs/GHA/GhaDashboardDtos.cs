namespace PaymentPortal.Application.DTOs.GHA;

public class RevenueStatsDto
{
    public decimal TotalRevenue { get; set; }
    public decimal ProcessingFeeRevenue { get; set; }
    public decimal StorageFeeRevenue { get; set; }
    public int TransactionCount { get; set; }
    public string Period { get; set; } = string.Empty;
}

public class MonthlyTrendDto
{
    public string Month { get; set; } = string.Empty;
    public decimal Revenue { get; set; }
    public int Transactions { get; set; }
}

public class RevenueBreakdownDto
{
    public string Category { get; set; } = string.Empty;
    public decimal Amount { get; set; }
    public decimal Percentage { get; set; }
}

public class SettlementDto
{
    public decimal TotalProcessingFees { get; set; }
    public decimal SettlementAmount { get; set; }
    public decimal SettlementRate { get; set; } = 0.75m;
}

public class TopCustomerDto
{
    public string CompanyName { get; set; } = string.Empty;
    public int TransactionCount { get; set; }
    public decimal TotalSpent { get; set; }
}

public class CustomerDto
{
    public string Id { get; set; } = string.Empty;
    public string CompanyName { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public int TotalTransactions { get; set; }
    public string? LastPaymentDate { get; set; }
    public decimal TotalSpent { get; set; }
}

public class ActivityDto
{
    public string Type { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public string Timestamp { get; set; } = string.Empty;
}

public class GenerateReportRequest
{
    public string Name { get; set; } = string.Empty;
    public string ReportType { get; set; } = string.Empty;
    public string Format { get; set; } = string.Empty;
}

public class ReportDto
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string ReportType { get; set; } = string.Empty;
    public string Format { get; set; } = string.Empty;
    public string? FileUrl { get; set; }
    public string GeneratedAt { get; set; } = string.Empty;
}

public class MonthlyInsightsDto
{
    public decimal RevenueGrowthPercent { get; set; }
    public int NewCustomersThisMonth { get; set; }
    public string TopCustomerName { get; set; } = string.Empty;
    public decimal TopCustomerSpent { get; set; }
}
