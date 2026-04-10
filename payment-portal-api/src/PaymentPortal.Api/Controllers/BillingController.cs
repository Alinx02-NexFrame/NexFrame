using Microsoft.AspNetCore.Mvc;
using PaymentPortal.Application.DTOs.Billing;
using PaymentPortal.Application.Interfaces;

namespace PaymentPortal.Api.Controllers;

[ApiController]
[Route("api/billing")]
public class BillingController : ControllerBase
{
    private readonly IBillingService _billing;

    public BillingController(IBillingService billing) => _billing = billing;

    [HttpGet("{awbNumber}")]
    public async Task<ActionResult<BillingDto>> GetBilling(string awbNumber)
    {
        var result = await _billing.GetBillingByAwbAsync(awbNumber);
        if (result == null) return NotFound(new { error = $"No billing info for AWB: {awbNumber}" });
        return Ok(result);
    }
}
