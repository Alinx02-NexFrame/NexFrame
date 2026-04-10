using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using PaymentPortal.Domain.Entities;

namespace PaymentPortal.Infrastructure.Data.Configurations;

public class BillingRecordConfiguration : IEntityTypeConfiguration<BillingRecord>
{
    public void Configure(EntityTypeBuilder<BillingRecord> builder)
    {
        builder.HasKey(b => b.Id);
        builder.Property(b => b.ServiceFee).HasColumnType("decimal(18,2)");
        builder.Property(b => b.StorageFee).HasColumnType("decimal(18,2)");
        builder.Property(b => b.OtherCharge).HasColumnType("decimal(18,2)");
        builder.Property(b => b.Subtotal).HasColumnType("decimal(18,2)");
        builder.Property(b => b.ProcessingFee).HasColumnType("decimal(18,2)");
        builder.Property(b => b.Total).HasColumnType("decimal(18,2)");
        builder.Property(b => b.Status).HasConversion<string>().HasMaxLength(20);

        builder.HasOne(b => b.Cargo)
            .WithOne(c => c.BillingRecord)
            .HasForeignKey<BillingRecord>(b => b.CargoId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}
