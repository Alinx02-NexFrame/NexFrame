using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using PaymentPortal.Application.DTOs.Cart;
using PaymentPortal.Application.Interfaces;

namespace PaymentPortal.Api.Controllers;

[ApiController]
[Route("api/forwarder/cart")]
[Authorize(Roles = "forwarder")]
public class CartController : ControllerBase
{
    private readonly ICartService _cart;

    public CartController(ICartService cart) => _cart = cart;

    private int UserId => int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);

    [HttpGet]
    public async Task<ActionResult<CartDto>> GetCart()
        => Ok(await _cart.GetCartAsync(UserId));

    [HttpPost]
    public async Task<ActionResult<CartItemDto>> AddItem([FromBody] AddCartItemRequest request)
        => Ok(await _cart.AddItemAsync(UserId, request));

    [HttpDelete("{itemId}")]
    public async Task<IActionResult> RemoveItem(int itemId)
    {
        await _cart.RemoveItemAsync(UserId, itemId);
        return NoContent();
    }

    [HttpDelete]
    public async Task<IActionResult> Clear()
    {
        await _cart.ClearAsync(UserId);
        return NoContent();
    }
}
