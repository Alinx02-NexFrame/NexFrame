using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using PaymentPortal.Domain.Entities;

namespace PaymentPortal.Infrastructure.Data.Configurations;

public class CargoConfiguration : IEntityTypeConfiguration<Cargo>
{
    public void Configure(EntityTypeBuilder<Cargo> builder)
    {
        builder.HasKey(c => c.Id);
        builder.Property(c => c.AwbNumber).HasMaxLength(20).IsRequired();
        builder.HasIndex(c => c.AwbNumber).IsUnique();
        builder.Property(c => c.Origin).HasMaxLength(100).IsRequired();
        builder.Property(c => c.Destination).HasMaxLength(100).IsRequired();
        builder.Property(c => c.ArrivalTime).HasMaxLength(10);
        builder.Property(c => c.Weight).HasColumnType("decimal(18,2)");
        builder.Property(c => c.Description).HasMaxLength(500);
        builder.Property(c => c.BreakdownStatus).HasConversion<string>().HasMaxLength(20);
        builder.Property(c => c.CustomsStatus).HasConversion<string>().HasMaxLength(20);
    }
}
