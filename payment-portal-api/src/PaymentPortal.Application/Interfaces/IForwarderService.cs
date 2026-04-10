using PaymentPortal.Application.DTOs.Common;
using PaymentPortal.Application.DTOs.Forwarder;

namespace PaymentPortal.Application.Interfaces;

public interface IForwarderService
{
    Task<ForwarderDashboardDto> GetDashboardAsync(int userId);
    Task<List<PendingPaymentDto>> GetPendingPaymentsAsync(int userId);
    Task<PagedResult<CompletedPaymentDto>> GetPaymentHistoryAsync(int userId, int page = 1, int pageSize = 10, string? search = null);
    Task<List<TransactionChartDto>> GetTransactionChartDataAsync(int userId);
    Task<byte[]> ExportReportAsync(int userId, string format);
    Task<WatchlistDto> GetWatchlistAsync(int userId);
    Task<WatchlistItemDto> AddWatchlistItemAsync(int userId, string awbNumber);
    Task RemoveWatchlistItemAsync(int userId, int itemId);
    Task<List<CompanyUserDto>> GetCompanyUsersAsync(int userId);
    Task<CompanyUserDto> CreateCompanyUserAsync(int userId, CreateCompanyUserRequest request);
    Task<CompanyUserDto> UpdateCompanyUserAsync(int userId, int targetUserId, UpdateCompanyUserRequest request);
    Task DeleteCompanyUserAsync(int userId, int targetUserId);
}
