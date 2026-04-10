using PaymentPortal.Application.DTOs.Billing;

namespace PaymentPortal.Application.Interfaces;

public interface IBillingService
{
    Task<BillingDto?> GetBillingByAwbAsync(string awbNumber);
}
