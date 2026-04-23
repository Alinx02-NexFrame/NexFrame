using PaymentPortal.Application.DTOs.Cart;

namespace PaymentPortal.Application.Interfaces;

public interface ICartService
{
    Task<CartDto> GetCartAsync(int userId);
    Task<CartItemDto> AddItemAsync(int userId, AddCartItemRequest request);
    Task RemoveItemAsync(int userId, int itemId);
    Task RemoveByAwbAsync(int userId, string awbNumber);
    Task ClearAsync(int userId);
}
