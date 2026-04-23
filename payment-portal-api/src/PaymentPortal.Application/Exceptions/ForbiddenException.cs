namespace PaymentPortal.Application.Exceptions;

/// <summary>
/// Thrown when an authenticated user lacks the required permission to perform
/// the requested action (e.g., non-admin attempting admin-only operations).
/// Mapped to HTTP 403 by ExceptionMiddleware.
/// </summary>
public class ForbiddenException : Exception
{
    public ForbiddenException(string message) : base(message) { }
}
