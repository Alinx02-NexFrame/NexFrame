using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using PaymentPortal.Domain.Entities;

namespace PaymentPortal.Infrastructure.Data.Configurations;

public class SavedCardConfiguration : IEntityTypeConfiguration<SavedCard>
{
    public void Configure(EntityTypeBuilder<SavedCard> builder)
    {
        builder.HasKey(c => c.Id);
        builder.Property(c => c.CardLast4).HasMaxLength(4).IsRequired();
        builder.Property(c => c.CardBrand).HasMaxLength(20).IsRequired();
        builder.Property(c => c.CardHolderName).HasMaxLength(100).IsRequired();
        builder.Property(c => c.GatewayToken).HasMaxLength(200).IsRequired();

        builder.HasOne(c => c.Company)
            .WithMany()
            .HasForeignKey(c => c.CompanyId)
            .OnDelete(DeleteBehavior.Cascade);

        // At most one default card per company (filtered unique index).
        builder.HasIndex(c => new { c.CompanyId, c.IsDefault })
            .IsUnique()
            .HasFilter("[IsDefault] = 1");

        builder.HasIndex(c => c.CompanyId);
    }
}
