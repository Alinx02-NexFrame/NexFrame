using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using PaymentPortal.Infrastructure.Data;

namespace PaymentPortal.Api.Controllers;

[ApiController]
[Route("[controller]")]
public class HealthController : ControllerBase
{
    private readonly AppDbContext _db;

    public HealthController(AppDbContext db) => _db = db;

    // Liveness: process is up. Used by App Service Health Check.
    [HttpGet]
    public IActionResult Get() =>
        Ok(new { status = "Healthy", timestamp = DateTime.UtcNow });

    // Readiness: DB reachable too. Used by load balancers / probes.
    [HttpGet("ready")]
    public async Task<IActionResult> Ready()
    {
        try
        {
            var canConnect = await _db.Database.CanConnectAsync();
            if (!canConnect)
                return StatusCode(503, new { status = "Unhealthy", reason = "Database unreachable", timestamp = DateTime.UtcNow });
            return Ok(new { status = "Ready", database = "Connected", timestamp = DateTime.UtcNow });
        }
        catch (Exception ex)
        {
            return StatusCode(503, new { status = "Unhealthy", reason = ex.Message, timestamp = DateTime.UtcNow });
        }
    }
}
