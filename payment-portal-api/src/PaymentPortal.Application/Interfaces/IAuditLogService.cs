namespace PaymentPortal.Application.Interfaces;

public interface IAuditLogService
{
    Task LogAsync(int? userId, string action, string entityType, string? entityId = null, string? details = null);
}
