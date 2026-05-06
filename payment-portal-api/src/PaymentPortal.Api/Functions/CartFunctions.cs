using System.Text.Json;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Azure.Functions.Worker;
using PaymentPortal.Api.Helpers;
using PaymentPortal.Application.DTOs.Cart;
using PaymentPortal.Application.Interfaces;

namespace PaymentPortal.Api.Functions;

public class CartFunctions
{
    private static readonly JsonSerializerOptions Json = new(JsonSerializerDefaults.Web)
    {
        Converters = { new System.Text.Json.Serialization.JsonStringEnumConverter() }
    };

    private readonly ICartService _cart;
    private readonly JwtAuthHelper _jwt;
    public CartFunctions(ICartService cart, JwtAuthHelper jwt) { _cart = cart; _jwt = jwt; }

    private (int? userId, IActionResult? deny) Auth(HttpRequest req)
    {
        var p = _jwt.Validate(req);
        if (p == null) return (null, new UnauthorizedResult());
        if (!_jwt.HasRole(p, "forwarder")) return (null, new ForbidResult());
        var uid = _jwt.UserId(p);
        if (uid == null) return (null, new UnauthorizedResult());
        return (uid, null);
    }

    [Function("sellas-cart-list")]
    public async Task<IActionResult> List(
        [HttpTrigger(AuthorizationLevel.Anonymous, "get", Route = "api/forwarder/cart")] HttpRequest req)
    {
        var (uid, deny) = Auth(req);
        if (deny != null) return deny;
        return new OkObjectResult(await _cart.GetCartAsync(uid!.Value));
    }

    [Function("sellas-cart-add")]
    public async Task<IActionResult> Add(
        [HttpTrigger(AuthorizationLevel.Anonymous, "post", Route = "api/forwarder/cart")] HttpRequest req)
    {
        var (uid, deny) = Auth(req);
        if (deny != null) return deny;
        var body = await JsonSerializer.DeserializeAsync<AddCartItemRequest>(req.Body, Json);
        return new OkObjectResult(await _cart.AddItemAsync(uid!.Value, body!));
    }

    [Function("sellas-cart-remove")]
    public async Task<IActionResult> Remove(
        [HttpTrigger(AuthorizationLevel.Anonymous, "delete", Route = "api/forwarder/cart/{itemId:int}")] HttpRequest req,
        int itemId)
    {
        var (uid, deny) = Auth(req);
        if (deny != null) return deny;
        await _cart.RemoveItemAsync(uid!.Value, itemId);
        return new NoContentResult();
    }

    [Function("sellas-cart-clear")]
    public async Task<IActionResult> Clear(
        [HttpTrigger(AuthorizationLevel.Anonymous, "delete", Route = "api/forwarder/cart")] HttpRequest req)
    {
        var (uid, deny) = Auth(req);
        if (deny != null) return deny;
        await _cart.ClearAsync(uid!.Value);
        return new NoContentResult();
    }
}
