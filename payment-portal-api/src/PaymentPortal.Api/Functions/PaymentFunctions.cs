using System.Text.Json;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Azure.Functions.Worker;
using PaymentPortal.Api.Helpers;
using PaymentPortal.Application.DTOs.Payment;
using PaymentPortal.Application.Interfaces;

namespace PaymentPortal.Api.Functions;

public class PaymentFunctions
{
    private static readonly JsonSerializerOptions Json = new(JsonSerializerDefaults.Web)
    {
        Converters = { new System.Text.Json.Serialization.JsonStringEnumConverter() }
    };

    private readonly IPaymentService _p;
    private readonly JwtAuthHelper _jwt;
    public PaymentFunctions(IPaymentService p, JwtAuthHelper jwt) { _p = p; _jwt = jwt; }

    [Function("sellas-payment-create")]
    public async Task<IActionResult> Create(
        [HttpTrigger(AuthorizationLevel.Anonymous, "post", Route = "api/payments")] HttpRequest req)
    {
        var body = await JsonSerializer.DeserializeAsync<CreatePaymentRequest>(req.Body, Json);
        return new OkObjectResult(await _p.ProcessPaymentAsync(body!));
    }

    [Function("sellas-payment-authenticated")]
    public async Task<IActionResult> Authenticated(
        [HttpTrigger(AuthorizationLevel.Anonymous, "post", Route = "api/payments/authenticated")] HttpRequest req)
    {
        var pr = _jwt.Validate(req);
        if (pr == null) return new UnauthorizedResult();
        var uid = _jwt.UserId(pr); if (uid == null) return new UnauthorizedResult();
        var body = await JsonSerializer.DeserializeAsync<CreatePaymentRequest>(req.Body, Json);
        return new OkObjectResult(await _p.ProcessAuthenticatedPaymentAsync(body!, uid.Value));
    }

    [Function("sellas-payment-bulk")]
    public async Task<IActionResult> Bulk(
        [HttpTrigger(AuthorizationLevel.Anonymous, "post", Route = "api/payments/bulk")] HttpRequest req)
    {
        var pr = _jwt.Validate(req);
        if (pr == null) return new UnauthorizedResult();
        if (!_jwt.HasRole(pr, "forwarder")) return new ForbidResult();
        var uid = _jwt.UserId(pr); if (uid == null) return new UnauthorizedResult();
        var body = await JsonSerializer.DeserializeAsync<BulkPaymentRequest>(req.Body, Json);
        return new OkObjectResult(await _p.ProcessBulkPaymentAsync(body!, uid.Value));
    }

    [Function("sellas-payment-receipt")]
    public async Task<IActionResult> Receipt(
        [HttpTrigger(AuthorizationLevel.Anonymous, "get", Route = "api/payments/{confirmationNumber}/receipt")] HttpRequest req,
        string confirmationNumber)
    {
        var pdf = await _p.GenerateReceiptPdfAsync(confirmationNumber);
        return new FileContentResult(pdf, "application/pdf") { FileDownloadName = $"{confirmationNumber}.pdf" };
    }

    [Function("sellas-payment-bulk-receipt")]
    public async Task<IActionResult> BulkReceipt(
        [HttpTrigger(AuthorizationLevel.Anonymous, "get", Route = "api/payments/bulk-receipt")] HttpRequest req)
    {
        var pr = _jwt.Validate(req);
        if (pr == null) return new UnauthorizedResult();
        var uid = _jwt.UserId(pr); if (uid == null) return new UnauthorizedResult();

        var batchIdRaw = req.Query["batchId"].ToString();
        var confirmations = req.Query["confirmations"].ToString();

        byte[] pdf;
        if (Guid.TryParse(batchIdRaw, out var batchId))
        {
            pdf = await _p.GenerateBulkReceiptPdfByBatchAsync(batchId, uid.Value);
        }
        else
        {
            var ids = string.IsNullOrEmpty(confirmations)
                ? Array.Empty<string>()
                : confirmations.Split(',', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries);
            if (ids.Length == 0)
                return new BadRequestObjectResult(new { error = "batchId or confirmations query parameter required" });
            if (ids.Length > 100)
                return new BadRequestObjectResult(new { error = "Maximum 100 confirmations per request" });
            pdf = await _p.GenerateBulkReceiptPdfAsync(ids, uid.Value);
        }

        var filename = $"BulkReceipt-{DateTime.UtcNow:yyyyMMdd-HHmmss}.pdf";
        return new FileContentResult(pdf, "application/pdf") { FileDownloadName = filename };
    }
}
