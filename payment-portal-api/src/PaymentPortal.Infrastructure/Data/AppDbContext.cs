using Microsoft.EntityFrameworkCore;
using PaymentPortal.Domain.Entities;

namespace PaymentPortal.Infrastructure.Data;

public class AppDbContext : DbContext
{
    public AppDbContext(DbContextOptions<AppDbContext> options) : base(options) { }

    public DbSet<Company> Companies => Set<Company>();
    public DbSet<User> Users => Set<User>();
    public DbSet<RefreshToken> RefreshTokens => Set<RefreshToken>();
    public DbSet<Cargo> Cargo => Set<Cargo>();
    public DbSet<BillingRecord> BillingRecords => Set<BillingRecord>();
    public DbSet<Payment> Payments => Set<Payment>();
    public DbSet<Watchlist> Watchlists => Set<Watchlist>();
    public DbSet<WatchlistItem> WatchlistItems => Set<WatchlistItem>();
    public DbSet<Report> Reports => Set<Report>();
    public DbSet<UploadHistory> UploadHistory => Set<UploadHistory>();
    public DbSet<AuditLog> AuditLogs => Set<AuditLog>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);
        modelBuilder.ApplyConfigurationsFromAssembly(typeof(AppDbContext).Assembly);
    }
}
