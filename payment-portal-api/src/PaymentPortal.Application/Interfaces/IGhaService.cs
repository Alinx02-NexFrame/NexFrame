using PaymentPortal.Application.DTOs.Common;
using PaymentPortal.Application.DTOs.GHA;

namespace PaymentPortal.Application.Interfaces;

public interface IGhaService
{
    Task<RevenueStatsDto> GetRevenueStatsAsync();
    Task<List<MonthlyTrendDto>> GetMonthlyTrendAsync();
    Task<List<RevenueBreakdownDto>> GetRevenueBreakdownAsync();
    Task<SettlementDto> GetSettlementAsync();
    Task<List<TopCustomerDto>> GetTopCustomersAsync(int count = 5);
    Task<PagedResult<CustomerDto>> GetCustomersAsync(int page = 1, int pageSize = 10, string? search = null);
    Task<List<ActivityDto>> GetRecentActivityAsync(int count = 20);
    Task<ReportDto> GenerateReportAsync(GenerateReportRequest request, int userId);
    Task<List<ReportDto>> GetReportsListAsync(int count = 10);
    Task<MonthlyInsightsDto> GetMonthlyInsightsAsync();
    Task<int> UploadDataAsync(Stream fileStream, string fileName, int userId);
}
