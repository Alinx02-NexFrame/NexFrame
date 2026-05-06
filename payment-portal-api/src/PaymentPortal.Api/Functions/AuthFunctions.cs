using System.Text.Json;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Azure.Functions.Worker;
using PaymentPortal.Api.Helpers;
using PaymentPortal.Application.DTOs.Auth;
using PaymentPortal.Application.Interfaces;

namespace PaymentPortal.Api.Functions;

public class AuthFunctions
{
    private static readonly JsonSerializerOptions Json = new(JsonSerializerDefaults.Web)
    {
        Converters = { new System.Text.Json.Serialization.JsonStringEnumConverter() }
    };

    private readonly IAuthService _auth;
    private readonly JwtAuthHelper _jwt;

    public AuthFunctions(IAuthService auth, JwtAuthHelper jwt) { _auth = auth; _jwt = jwt; }

    [Function("sellas-auth-register")]
    public async Task<IActionResult> Register(
        [HttpTrigger(AuthorizationLevel.Anonymous, "post", Route = "api/auth/register")] HttpRequest req)
    {
        var request = await JsonSerializer.DeserializeAsync<RegisterRequest>(req.Body, Json);
        var result = await _auth.RegisterAsync(request!);
        return new OkObjectResult(result);
    }

    [Function("sellas-auth-login")]
    public async Task<IActionResult> Login(
        [HttpTrigger(AuthorizationLevel.Anonymous, "post", Route = "api/auth/login")] HttpRequest req)
    {
        var request = await JsonSerializer.DeserializeAsync<LoginRequest>(req.Body, Json);
        var result = await _auth.LoginAsync(request!);
        return new OkObjectResult(result);
    }

    [Function("sellas-auth-refresh")]
    public async Task<IActionResult> Refresh(
        [HttpTrigger(AuthorizationLevel.Anonymous, "post", Route = "api/auth/refresh")] HttpRequest req)
    {
        var request = await JsonSerializer.DeserializeAsync<RefreshTokenRequest>(req.Body, Json);
        var result = await _auth.RefreshTokenAsync(request!.RefreshToken);
        return new OkObjectResult(result);
    }

    [Function("sellas-auth-me")]
    public async Task<IActionResult> Me(
        [HttpTrigger(AuthorizationLevel.Anonymous, "get", Route = "api/auth/me")] HttpRequest req)
    {
        var p = _jwt.Validate(req);
        var uid = _jwt.UserId(p);
        if (uid is null) return new UnauthorizedResult();
        var result = await _auth.GetCurrentUserAsync(uid.Value);
        return new OkObjectResult(result);
    }
}
