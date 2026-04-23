using PaymentPortal.Application.DTOs.Cargo;

namespace PaymentPortal.Application.Interfaces;

public interface ICargoService
{
    Task<CargoDto?> SearchByAwbAsync(string awbNumber);

    /// <summary>Create a new Cargo. Throws ConflictException on duplicate AWB.</summary>
    Task<CargoDto> CreateAsync(CargoCreateDto dto, int? actingUserId);

    /// <summary>Update an existing Cargo. Throws KeyNotFoundException if missing.</summary>
    Task<CargoDto> UpdateAsync(string awbNumber, CargoUpdateDto dto, int? actingUserId);

    /// <summary>
    /// Delete a Cargo by AWB. Throws KeyNotFoundException if missing,
    /// ConflictException if dependent BillingRecord/Payment rows exist.
    /// </summary>
    Task DeleteAsync(string awbNumber, int? actingUserId);
}
