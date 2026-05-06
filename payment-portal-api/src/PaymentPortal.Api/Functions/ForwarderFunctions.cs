using System.Text.Json;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Azure.Functions.Worker;
using PaymentPortal.Api.Helpers;
using PaymentPortal.Application.DTOs.Forwarder;
using PaymentPortal.Application.Interfaces;

namespace PaymentPortal.Api.Functions;

public class ForwarderFunctions
{
    private static readonly JsonSerializerOptions Json = new(JsonSerializerDefaults.Web)
    {
        Converters = { new System.Text.Json.Serialization.JsonStringEnumConverter() }
    };

    private readonly IForwarderService _f;
    private readonly JwtAuthHelper _jwt;
    public ForwarderFunctions(IForwarderService f, JwtAuthHelper jwt) { _f = f; _jwt = jwt; }

    private (int? uid, IActionResult? deny) Auth(HttpRequest req)
    {
        var p = _jwt.Validate(req);
        if (p == null) return (null, new UnauthorizedResult());
        if (!_jwt.HasRole(p, "forwarder")) return (null, new ForbidResult());
        var uid = _jwt.UserId(p);
        if (uid == null) return (null, new UnauthorizedResult());
        return (uid, null);
    }

    [Function("sellas-forwarder-dashboard")]
    public async Task<IActionResult> Dashboard(
        [HttpTrigger(AuthorizationLevel.Anonymous, "get", Route = "api/forwarder/dashboard")] HttpRequest req)
    {
        var (uid, deny) = Auth(req); if (deny != null) return deny;
        return new OkObjectResult(await _f.GetDashboardAsync(uid!.Value));
    }

    [Function("sellas-forwarder-payments-pending")]
    public async Task<IActionResult> PendingPayments(
        [HttpTrigger(AuthorizationLevel.Anonymous, "get", Route = "api/forwarder/payments/pending")] HttpRequest req)
    {
        var (uid, deny) = Auth(req); if (deny != null) return deny;
        return new OkObjectResult(await _f.GetPendingPaymentsAsync(uid!.Value));
    }

    [Function("sellas-forwarder-payments-history")]
    public async Task<IActionResult> PaymentHistory(
        [HttpTrigger(AuthorizationLevel.Anonymous, "get", Route = "api/forwarder/payments/history")] HttpRequest req)
    {
        var (uid, deny) = Auth(req); if (deny != null) return deny;
        int.TryParse(req.Query["page"], out var page); if (page <= 0) page = 1;
        int.TryParse(req.Query["pageSize"], out var pageSize); if (pageSize <= 0) pageSize = 10;
        var search = req.Query["search"].ToString();
        return new OkObjectResult(await _f.GetPaymentHistoryAsync(uid!.Value, page, pageSize, string.IsNullOrEmpty(search) ? null : search));
    }

    [Function("sellas-forwarder-reports-transactions")]
    public async Task<IActionResult> TransactionChart(
        [HttpTrigger(AuthorizationLevel.Anonymous, "get", Route = "api/forwarder/reports/transactions")] HttpRequest req)
    {
        var (uid, deny) = Auth(req); if (deny != null) return deny;
        return new OkObjectResult(await _f.GetTransactionChartDataAsync(uid!.Value));
    }

    [Function("sellas-forwarder-reports-categories")]
    public async Task<IActionResult> FeeCategories(
        [HttpTrigger(AuthorizationLevel.Anonymous, "get", Route = "api/forwarder/reports/categories")] HttpRequest req)
    {
        var (uid, deny) = Auth(req); if (deny != null) return deny;
        return new OkObjectResult(await _f.GetFeeCategoryBreakdownAsync(uid!.Value));
    }

    [Function("sellas-forwarder-reports-summary")]
    public async Task<IActionResult> ReportSummary(
        [HttpTrigger(AuthorizationLevel.Anonymous, "get", Route = "api/forwarder/reports/summary")] HttpRequest req)
    {
        var (uid, deny) = Auth(req); if (deny != null) return deny;
        return new OkObjectResult(await _f.GetTransactionSummaryAsync(uid!.Value));
    }

    [Function("sellas-forwarder-reports-export")]
    public async Task<IActionResult> ExportReport(
        [HttpTrigger(AuthorizationLevel.Anonymous, "get", Route = "api/forwarder/reports/export")] HttpRequest req)
    {
        var (uid, deny) = Auth(req); if (deny != null) return deny;
        var format = req.Query["format"].ToString();
        if (string.IsNullOrEmpty(format)) format = "pdf";
        var bytes = await _f.ExportReportAsync(uid!.Value, format);
        var isExcel = format.Equals("excel", StringComparison.OrdinalIgnoreCase);
        var contentType = isExcel ? "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" : "application/pdf";
        var ext = isExcel ? "xlsx" : "pdf";
        return new FileContentResult(bytes, contentType) { FileDownloadName = $"report.{ext}" };
    }

    [Function("sellas-forwarder-watchlist-list")]
    public async Task<IActionResult> Watchlist(
        [HttpTrigger(AuthorizationLevel.Anonymous, "get", Route = "api/forwarder/watchlist")] HttpRequest req)
    {
        var (uid, deny) = Auth(req); if (deny != null) return deny;
        return new OkObjectResult(await _f.GetWatchlistAsync(uid!.Value));
    }

    [Function("sellas-forwarder-watchlist-add")]
    public async Task<IActionResult> WatchlistAdd(
        [HttpTrigger(AuthorizationLevel.Anonymous, "post", Route = "api/forwarder/watchlist")] HttpRequest req)
    {
        var (uid, deny) = Auth(req); if (deny != null) return deny;
        var body = await JsonSerializer.DeserializeAsync<AddWatchlistRequest>(req.Body, Json);
        return new OkObjectResult(await _f.AddWatchlistItemAsync(uid!.Value, body!.AwbNumber));
    }

    [Function("sellas-forwarder-watchlist-remove")]
    public async Task<IActionResult> WatchlistRemove(
        [HttpTrigger(AuthorizationLevel.Anonymous, "delete", Route = "api/forwarder/watchlist/{itemId:int}")] HttpRequest req,
        int itemId)
    {
        var (uid, deny) = Auth(req); if (deny != null) return deny;
        await _f.RemoveWatchlistItemAsync(uid!.Value, itemId);
        return new NoContentResult();
    }

    [Function("sellas-forwarder-users-list")]
    public async Task<IActionResult> UsersList(
        [HttpTrigger(AuthorizationLevel.Anonymous, "get", Route = "api/forwarder/users")] HttpRequest req)
    {
        var (uid, deny) = Auth(req); if (deny != null) return deny;
        return new OkObjectResult(await _f.GetCompanyUsersAsync(uid!.Value));
    }

    [Function("sellas-forwarder-users-add")]
    public async Task<IActionResult> UsersAdd(
        [HttpTrigger(AuthorizationLevel.Anonymous, "post", Route = "api/forwarder/users")] HttpRequest req)
    {
        var (uid, deny) = Auth(req); if (deny != null) return deny;
        var body = await JsonSerializer.DeserializeAsync<CreateCompanyUserRequest>(req.Body, Json);
        return new OkObjectResult(await _f.CreateCompanyUserAsync(uid!.Value, body!));
    }

    [Function("sellas-forwarder-users-update")]
    public async Task<IActionResult> UsersUpdate(
        [HttpTrigger(AuthorizationLevel.Anonymous, "put", Route = "api/forwarder/users/{targetUserId:int}")] HttpRequest req,
        int targetUserId)
    {
        var (uid, deny) = Auth(req); if (deny != null) return deny;
        var body = await JsonSerializer.DeserializeAsync<UpdateCompanyUserRequest>(req.Body, Json);
        return new OkObjectResult(await _f.UpdateCompanyUserAsync(uid!.Value, targetUserId, body!));
    }

    [Function("sellas-forwarder-users-delete")]
    public async Task<IActionResult> UsersDelete(
        [HttpTrigger(AuthorizationLevel.Anonymous, "delete", Route = "api/forwarder/users/{targetUserId:int}")] HttpRequest req,
        int targetUserId)
    {
        var (uid, deny) = Auth(req); if (deny != null) return deny;
        await _f.DeleteCompanyUserAsync(uid!.Value, targetUserId);
        return new NoContentResult();
    }
}
