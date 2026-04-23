using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using PaymentPortal.Application.DTOs.Payment;
using PaymentPortal.Application.Interfaces;

namespace PaymentPortal.Api.Controllers;

[ApiController]
[Route("api/payments")]
public class PaymentController : ControllerBase
{
    private readonly IPaymentService _payment;

    public PaymentController(IPaymentService payment) => _payment = payment;

    [HttpPost]
    public async Task<ActionResult<PaymentConfirmationDto>> ProcessPayment([FromBody] CreatePaymentRequest request)
    {
        var result = await _payment.ProcessPaymentAsync(request);
        return Ok(result);
    }

    [HttpPost("authenticated")]
    [Authorize]
    public async Task<ActionResult<PaymentConfirmationDto>> ProcessAuthenticatedPayment([FromBody] CreatePaymentRequest request)
    {
        var userId = int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
        var result = await _payment.ProcessAuthenticatedPaymentAsync(request, userId);
        return Ok(result);
    }

    [HttpPost("bulk")]
    [Authorize(Roles = "forwarder")]
    public async Task<ActionResult<List<PaymentConfirmationDto>>> ProcessBulkPayment([FromBody] BulkPaymentRequest request)
    {
        var userId = int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
        var result = await _payment.ProcessBulkPaymentAsync(request, userId);
        return Ok(result);
    }

    [HttpGet("{confirmationNumber}/receipt")]
    public async Task<IActionResult> GetReceipt(string confirmationNumber)
    {
        var pdf = await _payment.GenerateReceiptPdfAsync(confirmationNumber);
        return File(pdf, "application/pdf", $"{confirmationNumber}.pdf");
    }

    /// <summary>
    /// Combined PDF receipt for a bulk payment. Pass the confirmation numbers as a
    /// comma-separated query parameter (e.g. ?confirmations=PMT-1,PMT-2,PMT-3).
    /// </summary>
    [HttpGet("bulk-receipt")]
    [Authorize]
    public async Task<IActionResult> DownloadBulkReceipt([FromQuery] string confirmations)
    {
        var ids = confirmations?.Split(',', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries)
                  ?? Array.Empty<string>();
        if (ids.Length == 0)
            return BadRequest(new { error = "confirmations query parameter required" });
        if (ids.Length > 100)
            return BadRequest(new { error = "Maximum 100 confirmations per request" });

        var userId = int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
        var pdf = await _payment.GenerateBulkReceiptPdfAsync(ids, userId);
        var filename = $"BulkReceipt-{DateTime.UtcNow:yyyyMMdd-HHmmss}.pdf";
        return File(pdf, "application/pdf", filename);
    }
}
