using PaymentPortal.Application.DTOs.Auth;

namespace PaymentPortal.Application.Interfaces;

public interface IAuthService
{
    Task<AuthResponse> RegisterAsync(RegisterRequest request);
    Task<AuthResponse> LoginAsync(LoginRequest request);
    Task<AuthResponse> RefreshTokenAsync(string refreshToken);
    Task<UserDto> GetCurrentUserAsync(int userId);
}
