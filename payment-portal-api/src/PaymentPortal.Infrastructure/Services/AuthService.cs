using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Security.Cryptography;
using System.Text;
using AutoMapper;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;
using Microsoft.IdentityModel.Tokens;
using PaymentPortal.Application.DTOs.Auth;
using PaymentPortal.Application.Interfaces;
using PaymentPortal.Domain.Entities;
using PaymentPortal.Domain.Enums;
using PaymentPortal.Infrastructure.Data;

namespace PaymentPortal.Infrastructure.Services;

public class AuthService : IAuthService
{
    private readonly AppDbContext _db;
    private readonly JwtSettings _jwt;
    private readonly IMapper _mapper;
    private readonly IAuditLogService _audit;

    public AuthService(AppDbContext db, IOptions<JwtSettings> jwt, IMapper mapper, IAuditLogService audit)
    {
        _db = db;
        _jwt = jwt.Value;
        _mapper = mapper;
        _audit = audit;
    }

    public async Task<AuthResponse> RegisterAsync(RegisterRequest request)
    {
        if (await _db.Users.AnyAsync(u => u.Username == request.Username))
            throw new InvalidOperationException("Username already taken.");
        if (await _db.Users.AnyAsync(u => u.Email == request.Email))
            throw new InvalidOperationException("Email already registered.");

        var company = new Company
        {
            Name = request.CompanyName,
            Email = request.CompanyEmail ?? request.Email,
            TaxId = request.TaxId,
            AccountCredit = 0
        };
        _db.Companies.Add(company);
        await _db.SaveChangesAsync();

        var user = new User
        {
            Username = request.Username,
            Email = request.Email,
            PasswordHash = BCrypt.Net.BCrypt.HashPassword(request.Password),
            FullName = request.FullName,
            Role = UserRole.Forwarder,
            CompanyId = company.Id,
            CompanyRole = Domain.Enums.CompanyRole.Admin
        };
        _db.Users.Add(user);
        await _db.SaveChangesAsync();

        user.Company = company;

        await _audit.LogAsync(user.Id, "Register", "User", user.Id.ToString(), $"username={user.Username}, email={user.Email}");

        return await GenerateAuthResponse(user);
    }

    public async Task<AuthResponse> LoginAsync(LoginRequest request)
    {
        var user = await _db.Users.Include(u => u.Company).FirstOrDefaultAsync(u => u.Username == request.Username);
        if (user == null || !BCrypt.Net.BCrypt.Verify(request.Password, user.PasswordHash))
        {
            await _audit.LogAsync(null, "LoginFailed", "User", null, $"username={request.Username}");
            throw new UnauthorizedAccessException("Invalid username or password.");
        }

        if (!user.IsActive)
        {
            await _audit.LogAsync(user.Id, "LoginFailed", "User", user.Id.ToString(), $"username={request.Username}, reason=deactivated");
            throw new UnauthorizedAccessException("Account is deactivated.");
        }

        await _audit.LogAsync(user.Id, "Login", "User", user.Id.ToString(), $"username={user.Username}");

        return await GenerateAuthResponse(user);
    }

    public async Task<AuthResponse> RefreshTokenAsync(string refreshToken)
    {
        var stored = await _db.RefreshTokens
            .Include(r => r.User).ThenInclude(u => u.Company)
            .FirstOrDefaultAsync(r => r.Token == refreshToken && !r.IsRevoked);

        if (stored == null || stored.ExpiresAt < DateTime.UtcNow)
            throw new UnauthorizedAccessException("Invalid or expired refresh token.");

        stored.IsRevoked = true;
        await _db.SaveChangesAsync();

        await _audit.LogAsync(stored.User.Id, "TokenRefresh", "User", stored.User.Id.ToString());

        return await GenerateAuthResponse(stored.User);
    }

    public async Task<UserDto> GetCurrentUserAsync(int userId)
    {
        var user = await _db.Users.Include(u => u.Company).FirstOrDefaultAsync(u => u.Id == userId)
            ?? throw new KeyNotFoundException("User not found.");
        return _mapper.Map<UserDto>(user);
    }

    private async Task<AuthResponse> GenerateAuthResponse(User user)
    {
        var expiresAt = DateTime.UtcNow.AddMinutes(_jwt.AccessTokenExpirationMinutes);
        var accessToken = GenerateAccessToken(user, expiresAt);
        var refreshToken = await GenerateRefreshToken(user.Id);

        return new AuthResponse
        {
            AccessToken = accessToken,
            RefreshToken = refreshToken,
            ExpiresAt = expiresAt,
            User = _mapper.Map<UserDto>(user)
        };
    }

    private string GenerateAccessToken(User user, DateTime expiresAt)
    {
        var claims = new[]
        {
            new Claim(ClaimTypes.NameIdentifier, user.Id.ToString()),
            new Claim(ClaimTypes.Email, user.Email),
            new Claim(ClaimTypes.Role, user.Role == UserRole.Forwarder ? "forwarder" : "gha_admin"),
            new Claim("companyId", user.CompanyId?.ToString() ?? "")
        };

        var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(_jwt.SecretKey));
        var creds = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

        var token = new JwtSecurityToken(
            issuer: _jwt.Issuer,
            audience: _jwt.Audience,
            claims: claims,
            expires: expiresAt,
            signingCredentials: creds
        );

        return new JwtSecurityTokenHandler().WriteToken(token);
    }

    private async Task<string> GenerateRefreshToken(int userId)
    {
        var token = Convert.ToBase64String(RandomNumberGenerator.GetBytes(64));
        _db.RefreshTokens.Add(new RefreshToken
        {
            UserId = userId,
            Token = token,
            ExpiresAt = DateTime.UtcNow.AddDays(_jwt.RefreshTokenExpirationDays)
        });
        await _db.SaveChangesAsync();
        return token;
    }
}
