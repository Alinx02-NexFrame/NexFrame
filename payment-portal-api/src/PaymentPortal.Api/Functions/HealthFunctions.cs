using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Azure.Functions.Worker;
using PaymentPortal.Infrastructure.Data;

namespace PaymentPortal.Api.Functions;

public class HealthFunctions
{
    private readonly AppDbContext _db;
    public HealthFunctions(AppDbContext db) => _db = db;

    [Function("sellas-health")]
    public IActionResult Health(
        [HttpTrigger(AuthorizationLevel.Anonymous, "get", Route = "Health")] HttpRequest req)
        => new OkObjectResult(new { status = "Healthy", timestamp = DateTime.UtcNow });

    [Function("sellas-health-ready")]
    public async Task<IActionResult> Ready(
        [HttpTrigger(AuthorizationLevel.Anonymous, "get", Route = "Health/ready")] HttpRequest req)
    {
        try
        {
            var canConnect = await _db.Database.CanConnectAsync();
            if (!canConnect)
                return new ObjectResult(new { status = "Unhealthy", reason = "Database unreachable", timestamp = DateTime.UtcNow }) { StatusCode = 503 };
            return new OkObjectResult(new { status = "Ready", database = "Connected", timestamp = DateTime.UtcNow });
        }
        catch (Exception ex)
        {
            return new ObjectResult(new { status = "Unhealthy", reason = ex.Message, timestamp = DateTime.UtcNow }) { StatusCode = 503 };
        }
    }
}
