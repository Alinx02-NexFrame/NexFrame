using AutoMapper;
using Microsoft.EntityFrameworkCore;
using PaymentPortal.Application.DTOs.Cart;
using PaymentPortal.Application.Interfaces;
using PaymentPortal.Domain.Entities;
using PaymentPortal.Infrastructure.Data;

namespace PaymentPortal.Infrastructure.Services;

public class CartService : ICartService
{
    private readonly AppDbContext _db;
    private readonly IMapper _mapper;
    private readonly IAuditLogService _audit;

    public CartService(AppDbContext db, IMapper mapper, IAuditLogService audit)
    {
        _db = db;
        _mapper = mapper;
        _audit = audit;
    }

    public async Task<CartDto> GetCartAsync(int userId)
    {
        var cart = await _db.Carts
            .Include(c => c.Items)
            .FirstOrDefaultAsync(c => c.UserId == userId);

        if (cart == null)
            return new CartDto { Id = 0, Items = new List<CartItemDto>() };

        return _mapper.Map<CartDto>(cart);
    }

    public async Task<CartItemDto> AddItemAsync(int userId, AddCartItemRequest request)
    {
        var cart = await _db.Carts
            .Include(c => c.Items)
            .FirstOrDefaultAsync(c => c.UserId == userId);

        if (cart == null)
        {
            cart = new Cart { UserId = userId };
            _db.Carts.Add(cart);
            await _db.SaveChangesAsync();
        }

        if (cart.Items.Any(i => i.AwbNumber == request.AwbNumber))
            throw new InvalidOperationException("AWB already in cart.");

        var item = new CartItem
        {
            CartId = cart.Id,
            AwbNumber = request.AwbNumber,
            Amount = request.Amount
        };
        _db.CartItems.Add(item);
        await _db.SaveChangesAsync();

        await _audit.LogAsync(userId, "CartAdd", "CartItem", item.Id.ToString(), $"awb={request.AwbNumber}, amount={request.Amount}");

        return _mapper.Map<CartItemDto>(item);
    }

    public async Task RemoveItemAsync(int userId, int itemId)
    {
        var item = await _db.CartItems
            .Include(i => i.Cart)
            .FirstOrDefaultAsync(i => i.Id == itemId && i.Cart.UserId == userId)
            ?? throw new KeyNotFoundException("Cart item not found.");

        _db.CartItems.Remove(item);
        await _db.SaveChangesAsync();

        await _audit.LogAsync(userId, "CartRemove", "CartItem", itemId.ToString());
    }

    public async Task RemoveByAwbAsync(int userId, string awbNumber)
    {
        var item = await _db.CartItems
            .Include(i => i.Cart)
            .FirstOrDefaultAsync(i => i.Cart.UserId == userId && i.AwbNumber == awbNumber);

        if (item == null) return;

        _db.CartItems.Remove(item);
        await _db.SaveChangesAsync();

        await _audit.LogAsync(userId, "CartRemoveAfterPayment", "CartItem", item.Id.ToString(), $"awb={awbNumber}");
    }

    public async Task ClearAsync(int userId)
    {
        var items = await _db.CartItems
            .Include(i => i.Cart)
            .Where(i => i.Cart.UserId == userId)
            .ToListAsync();

        if (items.Count == 0) return;

        _db.CartItems.RemoveRange(items);
        await _db.SaveChangesAsync();

        await _audit.LogAsync(userId, "CartClear", "Cart", null, $"removedCount={items.Count}");
    }
}
