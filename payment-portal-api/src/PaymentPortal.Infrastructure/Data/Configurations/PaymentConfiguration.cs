using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using PaymentPortal.Domain.Entities;

namespace PaymentPortal.Infrastructure.Data.Configurations;

public class PaymentConfiguration : IEntityTypeConfiguration<Payment>
{
    public void Configure(EntityTypeBuilder<Payment> builder)
    {
        builder.HasKey(p => p.Id);
        builder.Property(p => p.ConfirmationNumber).HasMaxLength(50).IsRequired();
        builder.HasIndex(p => p.ConfirmationNumber).IsUnique();
        builder.Property(p => p.AwbNumber).HasMaxLength(20).IsRequired();
        builder.Property(p => p.Amount).HasColumnType("decimal(18,2)");
        builder.Property(p => p.ProcessingFee).HasColumnType("decimal(18,2)");
        builder.Property(p => p.PaymentMethod).HasConversion<string>().HasMaxLength(30);
        builder.Property(p => p.PaymentStatus).HasConversion<string>().HasMaxLength(20);
        builder.Property(p => p.Email).HasMaxLength(200).IsRequired();
        builder.Property(p => p.CardLast4).HasMaxLength(4);

        builder.HasOne(p => p.User)
            .WithMany(u => u.Payments)
            .HasForeignKey(p => p.UserId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne(p => p.Company)
            .WithMany(c => c.Payments)
            .HasForeignKey(p => p.CompanyId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne(p => p.Cargo)
            .WithMany(c => c.Payments)
            .HasForeignKey(p => p.CargoId)
            .OnDelete(DeleteBehavior.Restrict);
    }
}
