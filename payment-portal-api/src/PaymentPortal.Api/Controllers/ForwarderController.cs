using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using PaymentPortal.Application.DTOs.Common;
using PaymentPortal.Application.DTOs.Forwarder;
using PaymentPortal.Application.Interfaces;

namespace PaymentPortal.Api.Controllers;

[ApiController]
[Route("api/forwarder")]
[Authorize(Roles = "forwarder")]
public class ForwarderController : ControllerBase
{
    private readonly IForwarderService _forwarder;

    public ForwarderController(IForwarderService forwarder) => _forwarder = forwarder;

    private int UserId => int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);

    [HttpGet("dashboard")]
    public async Task<ActionResult<ForwarderDashboardDto>> GetDashboard()
        => Ok(await _forwarder.GetDashboardAsync(UserId));

    [HttpGet("payments/pending")]
    public async Task<ActionResult<List<PendingPaymentDto>>> GetPendingPayments()
        => Ok(await _forwarder.GetPendingPaymentsAsync(UserId));

    [HttpGet("payments/history")]
    public async Task<ActionResult<PagedResult<CompletedPaymentDto>>> GetPaymentHistory(
        [FromQuery] int page = 1, [FromQuery] int pageSize = 10, [FromQuery] string? search = null)
        => Ok(await _forwarder.GetPaymentHistoryAsync(UserId, page, pageSize, search));

    [HttpGet("reports/transactions")]
    public async Task<ActionResult<List<TransactionChartDto>>> GetTransactionChart()
        => Ok(await _forwarder.GetTransactionChartDataAsync(UserId));

    [HttpGet("reports/export")]
    public async Task<IActionResult> ExportReport([FromQuery] string format = "pdf")
    {
        var bytes = await _forwarder.ExportReportAsync(UserId, format);
        var contentType = format.Equals("excel", StringComparison.OrdinalIgnoreCase)
            ? "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
            : "application/pdf";
        var ext = format.Equals("excel", StringComparison.OrdinalIgnoreCase) ? "xlsx" : "pdf";
        return File(bytes, contentType, $"report.{ext}");
    }

    [HttpGet("watchlist")]
    public async Task<ActionResult<WatchlistDto>> GetWatchlist()
        => Ok(await _forwarder.GetWatchlistAsync(UserId));

    [HttpPost("watchlist")]
    public async Task<ActionResult<WatchlistItemDto>> AddWatchlistItem([FromBody] AddWatchlistRequest request)
        => Ok(await _forwarder.AddWatchlistItemAsync(UserId, request.AwbNumber));

    [HttpDelete("watchlist/{itemId}")]
    public async Task<IActionResult> RemoveWatchlistItem(int itemId)
    {
        await _forwarder.RemoveWatchlistItemAsync(UserId, itemId);
        return NoContent();
    }

    [HttpGet("users")]
    public async Task<ActionResult<List<CompanyUserDto>>> GetCompanyUsers()
        => Ok(await _forwarder.GetCompanyUsersAsync(UserId));

    [HttpPost("users")]
    public async Task<ActionResult<CompanyUserDto>> CreateCompanyUser([FromBody] CreateCompanyUserRequest request)
        => Ok(await _forwarder.CreateCompanyUserAsync(UserId, request));

    [HttpPut("users/{targetUserId}")]
    public async Task<ActionResult<CompanyUserDto>> UpdateCompanyUser(int targetUserId, [FromBody] UpdateCompanyUserRequest request)
        => Ok(await _forwarder.UpdateCompanyUserAsync(UserId, targetUserId, request));

    [HttpDelete("users/{targetUserId}")]
    public async Task<IActionResult> DeleteCompanyUser(int targetUserId)
    {
        await _forwarder.DeleteCompanyUserAsync(UserId, targetUserId);
        return NoContent();
    }
}
