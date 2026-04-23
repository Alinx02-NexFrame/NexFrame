namespace PaymentPortal.Application.DTOs.Cart;

public class CartDto
{
    public int Id { get; set; }
    public List<CartItemDto> Items { get; set; } = new();
}

public class CartItemDto
{
    public int Id { get; set; }
    public string AwbNumber { get; set; } = string.Empty;
    public decimal Amount { get; set; }
    public string AddedAt { get; set; } = string.Empty;
}

public class AddCartItemRequest
{
    public string AwbNumber { get; set; } = string.Empty;
    public decimal Amount { get; set; }
}
