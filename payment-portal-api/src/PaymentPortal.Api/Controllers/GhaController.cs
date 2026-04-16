using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using PaymentPortal.Application.DTOs.Common;
using PaymentPortal.Application.DTOs.GHA;
using PaymentPortal.Application.Interfaces;

namespace PaymentPortal.Api.Controllers;

[ApiController]
[Route("api/gha")]
[Authorize(Roles = "gha_admin")]
public class GhaController : ControllerBase
{
    private readonly IGhaService _gha;

    public GhaController(IGhaService gha) => _gha = gha;

    private int UserId => int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);

    [HttpGet("revenue")]
    public async Task<ActionResult<RevenueStatsDto>> GetRevenue()
        => Ok(await _gha.GetRevenueStatsAsync());

    [HttpGet("revenue/monthly-trend")]
    public async Task<ActionResult<List<MonthlyTrendDto>>> GetMonthlyTrend()
        => Ok(await _gha.GetMonthlyTrendAsync());

    [HttpGet("revenue/breakdown")]
    public async Task<ActionResult<List<RevenueBreakdownDto>>> GetRevenueBreakdown()
        => Ok(await _gha.GetRevenueBreakdownAsync());

    [HttpGet("revenue/settlement")]
    public async Task<ActionResult<SettlementDto>> GetSettlement()
        => Ok(await _gha.GetSettlementAsync());

    [HttpGet("revenue/top-customers")]
    public async Task<ActionResult<List<TopCustomerDto>>> GetTopCustomers([FromQuery] int count = 5)
        => Ok(await _gha.GetTopCustomersAsync(count));

    [HttpGet("customers")]
    public async Task<ActionResult<PagedResult<CustomerDto>>> GetCustomers(
        [FromQuery] int page = 1, [FromQuery] int pageSize = 10, [FromQuery] string? search = null)
        => Ok(await _gha.GetCustomersAsync(page, pageSize, search));

    [HttpGet("customers/activity")]
    public async Task<ActionResult<List<ActivityDto>>> GetRecentActivity([FromQuery] int count = 20)
        => Ok(await _gha.GetRecentActivityAsync(count));

    [HttpPost("reports/generate")]
    public async Task<ActionResult<ReportDto>> GenerateReport([FromBody] GenerateReportRequest request)
        => Ok(await _gha.GenerateReportAsync(request, UserId));

    [HttpGet("reports/list")]
    public async Task<ActionResult<List<ReportDto>>> GetReportsList([FromQuery] int count = 10)
        => Ok(await _gha.GetReportsListAsync(count));

    [HttpGet("insights/monthly")]
    public async Task<ActionResult<MonthlyInsightsDto>> GetMonthlyInsights()
        => Ok(await _gha.GetMonthlyInsightsAsync());

    [HttpPost("data/upload")]
    public async Task<IActionResult> UploadData(IFormFile file)
    {
        if (file == null || file.Length == 0)
            return BadRequest(new { error = "No file uploaded." });

        using var stream = file.OpenReadStream();
        var recordCount = await _gha.UploadDataAsync(stream, file.FileName, UserId);
        return Ok(new { recordCount, fileName = file.FileName });
    }
}
