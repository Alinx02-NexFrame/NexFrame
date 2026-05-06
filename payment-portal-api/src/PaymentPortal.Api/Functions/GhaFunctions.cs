using System.Text.Json;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Azure.Functions.Worker;
using PaymentPortal.Api.Helpers;
using PaymentPortal.Application.DTOs.GHA;
using PaymentPortal.Application.Interfaces;

namespace PaymentPortal.Api.Functions;

public class GhaFunctions
{
    private static readonly JsonSerializerOptions Json = new(JsonSerializerDefaults.Web)
    {
        Converters = { new System.Text.Json.Serialization.JsonStringEnumConverter() }
    };

    private readonly IGhaService _g;
    private readonly JwtAuthHelper _jwt;
    public GhaFunctions(IGhaService g, JwtAuthHelper jwt) { _g = g; _jwt = jwt; }

    private (int? uid, IActionResult? deny) Auth(HttpRequest req)
    {
        var p = _jwt.Validate(req);
        if (p == null) return (null, new UnauthorizedResult());
        if (!_jwt.HasRole(p, "gha_admin")) return (null, new ForbidResult());
        var uid = _jwt.UserId(p);
        if (uid == null) return (null, new UnauthorizedResult());
        return (uid, null);
    }

    [Function("sellas-gha-revenue")]
    public async Task<IActionResult> Revenue(
        [HttpTrigger(AuthorizationLevel.Anonymous, "get", Route = "api/gha/revenue")] HttpRequest req)
    {
        var (_, deny) = Auth(req); if (deny != null) return deny;
        return new OkObjectResult(await _g.GetRevenueStatsAsync());
    }

    [Function("sellas-gha-revenue-monthly-trend")]
    public async Task<IActionResult> MonthlyTrend(
        [HttpTrigger(AuthorizationLevel.Anonymous, "get", Route = "api/gha/revenue/monthly-trend")] HttpRequest req)
    {
        var (_, deny) = Auth(req); if (deny != null) return deny;
        return new OkObjectResult(await _g.GetMonthlyTrendAsync());
    }

    [Function("sellas-gha-revenue-breakdown")]
    public async Task<IActionResult> Breakdown(
        [HttpTrigger(AuthorizationLevel.Anonymous, "get", Route = "api/gha/revenue/breakdown")] HttpRequest req)
    {
        var (_, deny) = Auth(req); if (deny != null) return deny;
        return new OkObjectResult(await _g.GetRevenueBreakdownAsync());
    }

    [Function("sellas-gha-revenue-settlement")]
    public async Task<IActionResult> Settlement(
        [HttpTrigger(AuthorizationLevel.Anonymous, "get", Route = "api/gha/revenue/settlement")] HttpRequest req)
    {
        var (_, deny) = Auth(req); if (deny != null) return deny;
        return new OkObjectResult(await _g.GetSettlementAsync());
    }

    [Function("sellas-gha-revenue-top-customers")]
    public async Task<IActionResult> TopCustomers(
        [HttpTrigger(AuthorizationLevel.Anonymous, "get", Route = "api/gha/revenue/top-customers")] HttpRequest req)
    {
        var (_, deny) = Auth(req); if (deny != null) return deny;
        int.TryParse(req.Query["count"], out var count); if (count <= 0) count = 5;
        return new OkObjectResult(await _g.GetTopCustomersAsync(count));
    }

    [Function("sellas-gha-customers")]
    public async Task<IActionResult> Customers(
        [HttpTrigger(AuthorizationLevel.Anonymous, "get", Route = "api/gha/customers")] HttpRequest req)
    {
        var (_, deny) = Auth(req); if (deny != null) return deny;
        int.TryParse(req.Query["page"], out var page); if (page <= 0) page = 1;
        int.TryParse(req.Query["pageSize"], out var pageSize); if (pageSize <= 0) pageSize = 10;
        var search = req.Query["search"].ToString();
        return new OkObjectResult(await _g.GetCustomersAsync(page, pageSize, string.IsNullOrEmpty(search) ? null : search));
    }

    [Function("sellas-gha-customers-activity")]
    public async Task<IActionResult> Activity(
        [HttpTrigger(AuthorizationLevel.Anonymous, "get", Route = "api/gha/customers/activity")] HttpRequest req)
    {
        var (_, deny) = Auth(req); if (deny != null) return deny;
        int.TryParse(req.Query["count"], out var count); if (count <= 0) count = 20;
        return new OkObjectResult(await _g.GetRecentActivityAsync(count));
    }

    [Function("sellas-gha-reports-generate")]
    public async Task<IActionResult> GenerateReport(
        [HttpTrigger(AuthorizationLevel.Anonymous, "post", Route = "api/gha/reports/generate")] HttpRequest req)
    {
        var (uid, deny) = Auth(req); if (deny != null) return deny;
        var body = await JsonSerializer.DeserializeAsync<GenerateReportRequest>(req.Body, Json);
        return new OkObjectResult(await _g.GenerateReportAsync(body!, uid!.Value));
    }

    [Function("sellas-gha-reports-list")]
    public async Task<IActionResult> ReportsList(
        [HttpTrigger(AuthorizationLevel.Anonymous, "get", Route = "api/gha/reports/list")] HttpRequest req)
    {
        var (_, deny) = Auth(req); if (deny != null) return deny;
        int.TryParse(req.Query["count"], out var count); if (count <= 0) count = 10;
        return new OkObjectResult(await _g.GetReportsListAsync(count));
    }

    [Function("sellas-gha-reports-download")]
    public async Task<IActionResult> ReportDownload(
        [HttpTrigger(AuthorizationLevel.Anonymous, "get", Route = "api/gha/reports/{id:int}/download")] HttpRequest req,
        int id)
    {
        var (_, deny) = Auth(req); if (deny != null) return deny;
        var (content, contentType, fileName) = await _g.GetReportFileAsync(id);
        return new FileContentResult(content, contentType) { FileDownloadName = fileName };
    }

    [Function("sellas-gha-insights-monthly")]
    public async Task<IActionResult> InsightsMonthly(
        [HttpTrigger(AuthorizationLevel.Anonymous, "get", Route = "api/gha/insights/monthly")] HttpRequest req)
    {
        var (_, deny) = Auth(req); if (deny != null) return deny;
        return new OkObjectResult(await _g.GetMonthlyInsightsAsync());
    }

    [Function("sellas-gha-data-upload")]
    public async Task<IActionResult> DataUpload(
        [HttpTrigger(AuthorizationLevel.Anonymous, "post", Route = "api/gha/data/upload")] HttpRequest req)
    {
        var (uid, deny) = Auth(req); if (deny != null) return deny;
        if (!req.HasFormContentType)
            return new BadRequestObjectResult(new { error = "multipart/form-data required" });
        var form = await req.ReadFormAsync();
        var file = form.Files.GetFile("file") ?? form.Files.FirstOrDefault();
        if (file == null || file.Length == 0)
            return new BadRequestObjectResult(new { error = "No file uploaded." });
        if (file.Length > 10 * 1024 * 1024)
            return new BadRequestObjectResult(new { error = "File exceeds the 10 MB upload limit." });
        var ext = System.IO.Path.GetExtension(file.FileName).ToLowerInvariant();
        if (ext != ".xlsx" && ext != ".csv")
            return new BadRequestObjectResult(new { error = $"Unsupported file extension '{ext}'. Only .xlsx and .csv are accepted." });
        await using var stream = file.OpenReadStream();
        var result = await _g.UploadDataAsync(stream, file.FileName, uid!.Value);
        return new OkObjectResult(result);
    }
}
