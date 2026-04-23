using PaymentPortal.Application.DTOs.SavedCard;

namespace PaymentPortal.Application.Interfaces;

public interface ISavedCardService
{
    Task<List<SavedCardDto>> ListAsync(int userId);
    Task<SavedCardDto> AddAsync(int userId, AddSavedCardRequest request);
    Task SetDefaultAsync(int userId, int cardId);
    Task RemoveAsync(int userId, int cardId);
}
