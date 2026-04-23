namespace PaymentPortal.Application.Exceptions;

/// <summary>
/// Thrown when a request conflicts with the current state of a resource
/// (e.g., duplicate key, or attempting to delete a resource that is still
/// referenced by other entities). Mapped to HTTP 409 by ExceptionMiddleware.
/// </summary>
public class ConflictException : Exception
{
    public ConflictException(string message) : base(message) { }
}
