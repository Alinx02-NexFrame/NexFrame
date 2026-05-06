using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Options;
using Microsoft.IdentityModel.Tokens;
using PaymentPortal.Infrastructure.Services;

namespace PaymentPortal.Api.Helpers;

public class JwtAuthHelper
{
    private readonly TokenValidationParameters _params;

    public JwtAuthHelper(IOptions<JwtSettings> jwt)
    {
        var s = jwt.Value;
        _params = new TokenValidationParameters
        {
            ValidateIssuer = true,
            ValidateAudience = true,
            ValidateLifetime = true,
            ValidateIssuerSigningKey = true,
            ValidIssuer = s.Issuer,
            ValidAudience = s.Audience,
            IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(s.SecretKey))
        };
    }

    public ClaimsPrincipal? Validate(HttpRequest req)
    {
        var auth = req.Headers["Authorization"].ToString();
        if (string.IsNullOrEmpty(auth) || !auth.StartsWith("Bearer ", StringComparison.OrdinalIgnoreCase))
            return null;
        var token = auth.Substring(7);
        try
        {
            var handler = new JwtSecurityTokenHandler();
            return handler.ValidateToken(token, _params, out _);
        }
        catch
        {
            return null;
        }
    }

    public bool HasRole(ClaimsPrincipal? p, string role) =>
        p?.Claims.Any(c => (c.Type == ClaimTypes.Role || c.Type == "role") && c.Value == role) == true;

    public int? UserId(ClaimsPrincipal? p)
    {
        var id = p?.FindFirstValue(ClaimTypes.NameIdentifier) ?? p?.FindFirstValue("sub");
        return int.TryParse(id, out var x) ? x : null;
    }
}
