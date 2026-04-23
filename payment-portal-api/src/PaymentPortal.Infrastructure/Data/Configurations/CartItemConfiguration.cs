using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using PaymentPortal.Domain.Entities;

namespace PaymentPortal.Infrastructure.Data.Configurations;

public class CartItemConfiguration : IEntityTypeConfiguration<CartItem>
{
    public void Configure(EntityTypeBuilder<CartItem> builder)
    {
        builder.HasKey(i => i.Id);
        builder.Property(i => i.AwbNumber).HasMaxLength(50).IsRequired();
        builder.Property(i => i.Amount).HasColumnType("decimal(18,2)");
        builder.HasIndex(i => new { i.CartId, i.AwbNumber }).IsUnique();
    }
}
