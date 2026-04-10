using PaymentPortal.Application.DTOs.Cargo;

namespace PaymentPortal.Application.Interfaces;

public interface ICargoService
{
    Task<CargoDto?> SearchByAwbAsync(string awbNumber);
}
