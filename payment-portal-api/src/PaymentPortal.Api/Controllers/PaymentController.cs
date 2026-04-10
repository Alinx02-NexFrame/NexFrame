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
}
