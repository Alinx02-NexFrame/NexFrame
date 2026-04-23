using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Logging;
using PaymentPortal.Application.Interfaces;
using PaymentPortal.Domain.Entities;
using PaymentPortal.Infrastructure.Data;

namespace PaymentPortal.Infrastructure.Services;

public class AuditLogService : IAuditLogService
{
    private readonly AppDbContext _db;
    private readonly IHttpContextAccessor _httpContextAccessor;
    private readonly ILogger<AuditLogService> _logger;

    public AuditLogService(AppDbContext db, IHttpContextAccessor httpContextAccessor, ILogger<AuditLogService> logger)
    {
        _db = db;
        _httpContextAccessor = httpContextAccessor;
        _logger = logger;
    }

    public async Task LogAsync(int? userId, string action, string entityType, string? entityId = null, string? details = null)
    {
        try
        {
            // Capture remote IP from current HttpContext (may be null in background work).
            string? ip = null;
            var ctx = _httpContextAccessor.HttpContext;
            if (ctx != null)
            {
                ip = ctx.Connection.RemoteIpAddress?.ToString();
                // Honor X-Forwarded-For when set (Azure App Service sets this).
                if (ctx.Request.Headers.TryGetValue("X-Forwarded-For", out var forwarded) && !string.IsNullOrWhiteSpace(forwarded))
                {
                    var first = forwarded.ToString().Split(',').FirstOrDefault()?.Trim();
                    if (!string.IsNullOrWhiteSpace(first)) ip = first;
                }
            }

            // EntityId in DB is int?; if the caller passes a non-numeric string
            // (e.g. ConfirmationNumber), keep it visible by prepending into details.
            int? entityIdInt = null;
            string? mergedDetails = details;
            if (!string.IsNullOrWhiteSpace(entityId))
            {
                if (int.TryParse(entityId, out var parsed))
                {
                    entityIdInt = parsed;
                }
                else
                {
                    mergedDetails = string.IsNullOrWhiteSpace(details)
                        ? $"entityId={entityId}"
                        : $"entityId={entityId}, {details}";
                }
            }

            var log = new AuditLog
            {
                UserId = userId,
                Action = action,
                EntityType = entityType,
                EntityId = entityIdInt,
                Details = mergedDetails,
                IpAddress = ip,
                Timestamp = DateTime.UtcNow
            };

            _db.AuditLogs.Add(log);
            await _db.SaveChangesAsync();
        }
        catch (Exception ex)
        {
            // Audit logging must never break business flow.
            // Serilog is wired as the ILogger provider in Program.cs, so this still flows to the Serilog sinks.
            _logger.LogWarning(ex, "Failed to write audit log: action={Action} entityType={EntityType} userId={UserId}", action, entityType, userId);
        }
    }
}
