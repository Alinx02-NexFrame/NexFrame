using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Azure.Functions.Worker;
using PaymentPortal.Application.Interfaces;

namespace PaymentPortal.Api.Functions;

public class BillingFunctions
{
    private readonly IBillingService _billing;
    public BillingFunctions(IBillingService billing) => _billing = billing;

    [Function("sellas-billing-get")]
    public async Task<IActionResult> Get(
        [HttpTrigger(AuthorizationLevel.Anonymous, "get", Route = "api/billing/{awbNumber}")] HttpRequest req,
        string awbNumber)
    {
        var result = await _billing.GetBillingByAwbAsync(awbNumber);
        if (result == null) return new NotFoundObjectResult(new { error = $"No billing info for AWB: {awbNumber}" });
        return new OkObjectResult(result);
    }
}
