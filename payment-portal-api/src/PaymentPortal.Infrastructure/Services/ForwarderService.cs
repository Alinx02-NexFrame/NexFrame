using AutoMapper;
using ClosedXML.Excel;
using Microsoft.EntityFrameworkCore;
using PaymentPortal.Application.DTOs.Common;
using PaymentPortal.Application.DTOs.Forwarder;
using PaymentPortal.Application.Exceptions;
using PaymentPortal.Application.Interfaces;
using PaymentPortal.Domain.Entities;
using PaymentPortal.Domain.Enums;
using PaymentPortal.Infrastructure.Data;
using QuestPDF.Fluent;
using QuestPDF.Helpers;
using QuestPDF.Infrastructure;

namespace PaymentPortal.Infrastructure.Services;

public class ForwarderService : IForwarderService
{
    private readonly AppDbContext _db;
    private readonly IMapper _mapper;
    private readonly IAuditLogService _audit;

    public ForwarderService(AppDbContext db, IMapper mapper, IAuditLogService audit)
    {
        _db = db;
        _mapper = mapper;
        _audit = audit;
    }

    public async Task<ForwarderDashboardDto> GetDashboardAsync(int userId)
    {
        var user = await _db.Users.FindAsync(userId) ?? throw new KeyNotFoundException("User not found.");
        var company = await _db.Companies.FindAsync(user.CompanyId);

        var pendingBillings = await _db.BillingRecords
            .Where(b => b.Status != BillingStatus.Paid)
            .ToListAsync();

        return new ForwarderDashboardDto
        {
            AccountCredit = company?.AccountCredit ?? 0,
            PendingCount = pendingBillings.Count(b => b.Status == BillingStatus.Pending),
            OverdueCount = pendingBillings.Count(b => b.Status == BillingStatus.Overdue),
            TotalPendingAmount = pendingBillings.Sum(b => b.Total)
        };
    }

    public async Task<List<PendingPaymentDto>> GetPendingPaymentsAsync(int userId)
    {
        var billings = await _db.BillingRecords
            .Include(b => b.Cargo)
            .Where(b => b.Status != BillingStatus.Paid)
            .OrderBy(b => b.DueDate)
            .ToListAsync();

        return billings.Select(b => new PendingPaymentDto
        {
            AwbNumber = b.Cargo.AwbNumber,
            DueDate = b.DueDate.ToString("yyyy-MM-dd"),
            Amount = b.Total,
            Status = b.Status == BillingStatus.Overdue ? "overdue" : "pending"
        }).ToList();
    }

    public async Task<PagedResult<CompletedPaymentDto>> GetPaymentHistoryAsync(int userId, int page = 1, int pageSize = 10, string? search = null)
    {
        var user = await _db.Users.FindAsync(userId) ?? throw new KeyNotFoundException("User not found.");

        var query = user.CompanyRole == Domain.Enums.CompanyRole.Admin
            ? _db.Payments.Where(p => p.CompanyId == user.CompanyId && p.PaymentStatus == PaymentStatus.Completed)
            : _db.Payments.Where(p => p.UserId == userId && p.PaymentStatus == PaymentStatus.Completed);

        if (!string.IsNullOrWhiteSpace(search))
            query = query.Where(p => p.AwbNumber.Contains(search) || p.ConfirmationNumber.Contains(search));

        var totalCount = await query.CountAsync();
        var items = await query
            .OrderByDescending(p => p.PaymentDate)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync();

        return new PagedResult<CompletedPaymentDto>
        {
            Items = items.Select(p => _mapper.Map<CompletedPaymentDto>(p)).ToList(),
            TotalCount = totalCount,
            Page = page,
            PageSize = pageSize
        };
    }

    public async Task<List<TransactionChartDto>> GetTransactionChartDataAsync(int userId)
    {
        var user = await _db.Users.FindAsync(userId) ?? throw new KeyNotFoundException("User not found.");
        EnsureReportAccess(user);

        var sixMonthsAgo = DateTime.UtcNow.AddMonths(-6);
        var payments = await _db.Payments
            .Where(p => p.CompanyId == user.CompanyId && p.PaymentStatus == PaymentStatus.Completed && p.PaymentDate >= sixMonthsAgo)
            .ToListAsync();

        return payments
            .GroupBy(p => p.PaymentDate.ToString("yyyy-MM"))
            .OrderBy(g => g.Key)
            .Select(g => new TransactionChartDto
            {
                Month = g.Key,
                Amount = g.Sum(p => p.Amount),
                Count = g.Count()
            }).ToList();
    }

    public async Task<List<FeeCategoryDto>> GetFeeCategoryBreakdownAsync(int userId)
    {
        var user = await _db.Users.FindAsync(userId) ?? throw new KeyNotFoundException("User not found.");
        EnsureReportAccess(user);

        var sixMonthsAgo = DateTime.UtcNow.AddMonths(-6);
        var billings = await _db.BillingRecords
            .Where(b => b.Status == BillingStatus.Paid
                && _db.Payments.Any(p => p.AwbNumber == b.Cargo.AwbNumber
                    && p.CompanyId == user.CompanyId
                    && p.PaymentStatus == PaymentStatus.Completed
                    && p.PaymentDate >= sixMonthsAgo))
            .ToListAsync();

        return new List<FeeCategoryDto>
        {
            new() { Name = "Service Fee", Value = billings.Sum(b => b.ServiceFee) },
            new() { Name = "Storage Fee", Value = billings.Sum(b => b.StorageFee) },
            new() { Name = "Processing Fee", Value = billings.Sum(b => b.ProcessingFee) },
            new() { Name = "Other Charges", Value = billings.Sum(b => b.OtherCharge) },
        };
    }

    public async Task<TransactionSummaryDto> GetTransactionSummaryAsync(int userId)
    {
        var user = await _db.Users.FindAsync(userId) ?? throw new KeyNotFoundException("User not found.");
        EnsureReportAccess(user);

        var now = DateTime.UtcNow;
        var currentMonthStart = new DateTime(now.Year, now.Month, 1);
        var prevMonthStart = currentMonthStart.AddMonths(-1);
        var sixMonthsAgo = now.AddMonths(-6);

        var payments = await _db.Payments
            .Where(p => p.CompanyId == user.CompanyId
                && p.PaymentStatus == PaymentStatus.Completed
                && p.PaymentDate >= sixMonthsAgo)
            .ToListAsync();

        var currentMonth = payments.Where(p => p.PaymentDate >= currentMonthStart).ToList();
        var prevMonth = payments.Where(p => p.PaymentDate >= prevMonthStart && p.PaymentDate < currentMonthStart).ToList();

        var currentTotal = currentMonth.Sum(p => p.Amount);
        var prevTotal = prevMonth.Sum(p => p.Amount);
        var totalGrowth = prevTotal > 0 ? Math.Round((currentTotal - prevTotal) / prevTotal * 100, 1) : 0;

        var currentCount = currentMonth.Count;
        var prevCount = prevMonth.Count;
        var countGrowth = prevCount > 0 ? Math.Round(((decimal)(currentCount - prevCount)) / prevCount * 100, 1) : 0;

        var periodTotal = payments.Sum(p => p.Amount);
        var periodCount = payments.Count;
        var avg = periodCount > 0 ? Math.Round(periodTotal / periodCount, 0) : 0;

        var startLabel = sixMonthsAgo.ToString("MMM yyyy");
        var endLabel = now.ToString("MMM yyyy");

        return new TransactionSummaryDto
        {
            MonthlyTotal = currentTotal,
            MonthlyTotalGrowthPercent = totalGrowth,
            TransactionCount = currentCount,
            TransactionCountGrowthPercent = countGrowth,
            AverageTransaction = avg,
            PeriodMonths = 6,
            PeriodLabel = $"{startLabel} - {endLabel}"
        };
    }

    public async Task<byte[]> ExportReportAsync(int userId, string format)
    {
        var user = await _db.Users.FindAsync(userId) ?? throw new KeyNotFoundException("User not found.");
        EnsureReportAccess(user);
        var payments = await _db.Payments
            .Where(p => p.CompanyId == user.CompanyId && p.PaymentStatus == PaymentStatus.Completed)
            .OrderByDescending(p => p.PaymentDate)
            .ToListAsync();

        if (format.Equals("excel", StringComparison.OrdinalIgnoreCase))
            return GenerateExcel(payments);

        return GenerateReportPdf(payments);
    }

    public async Task<WatchlistDto> GetWatchlistAsync(int userId)
    {
        var user = await _db.Users.FindAsync(userId) ?? throw new KeyNotFoundException("User not found.");
        var watchlist = await _db.Watchlists
            .Include(w => w.Items)
            .FirstOrDefaultAsync(w => w.CompanyId == user.CompanyId);

        if (watchlist == null)
            return new WatchlistDto { Items = new List<WatchlistItemDto>() };

        return _mapper.Map<WatchlistDto>(watchlist);
    }

    public async Task<WatchlistItemDto> AddWatchlistItemAsync(int userId, string awbNumber)
    {
        var user = await _db.Users.FindAsync(userId) ?? throw new KeyNotFoundException("User not found.");

        var watchlist = await _db.Watchlists
            .Include(w => w.Items)
            .FirstOrDefaultAsync(w => w.CompanyId == user.CompanyId);

        if (watchlist == null)
        {
            watchlist = new Watchlist { CompanyId = user.CompanyId!.Value };
            _db.Watchlists.Add(watchlist);
            await _db.SaveChangesAsync();
        }

        if (watchlist.Items.Any(i => i.AwbNumber == awbNumber))
            throw new InvalidOperationException("AWB already in watchlist.");

        var item = new WatchlistItem { WatchlistId = watchlist.Id, AwbNumber = awbNumber };
        _db.WatchlistItems.Add(item);
        await _db.SaveChangesAsync();

        await _audit.LogAsync(userId, "WatchlistAdd", "WatchlistItem", item.Id.ToString(), $"awb={awbNumber}");

        return _mapper.Map<WatchlistItemDto>(item);
    }

    public async Task RemoveWatchlistItemAsync(int userId, int itemId)
    {
        var user = await _db.Users.FindAsync(userId) ?? throw new KeyNotFoundException("User not found.");
        var item = await _db.WatchlistItems
            .Include(i => i.Watchlist)
            .FirstOrDefaultAsync(i => i.Id == itemId && i.Watchlist.CompanyId == user.CompanyId)
            ?? throw new KeyNotFoundException("Watchlist item not found.");

        _db.WatchlistItems.Remove(item);
        await _db.SaveChangesAsync();

        await _audit.LogAsync(userId, "WatchlistRemove", "WatchlistItem", itemId.ToString());
    }

    public async Task<List<CompanyUserDto>> GetCompanyUsersAsync(int userId)
    {
        var user = await _db.Users.FindAsync(userId) ?? throw new KeyNotFoundException("User not found.");
        var users = await _db.Users.Where(u => u.CompanyId == user.CompanyId).ToListAsync();
        return users.Select(u => _mapper.Map<CompanyUserDto>(u)).ToList();
    }

    public async Task<CompanyUserDto> CreateCompanyUserAsync(int userId, CreateCompanyUserRequest request)
    {
        var admin = await _db.Users.FindAsync(userId) ?? throw new KeyNotFoundException("User not found.");
        EnsureCompanyAdmin(admin);

        if (await _db.Users.AnyAsync(u => u.Email == request.Email))
            throw new InvalidOperationException("Email already registered.");

        var newUser = new User
        {
            Email = request.Email,
            PasswordHash = BCrypt.Net.BCrypt.HashPassword(request.Password),
            FullName = request.FullName,
            Role = UserRole.Forwarder,
            CompanyId = admin.CompanyId,
            CompanyRole = request.CompanyRole ?? Domain.Enums.CompanyRole.Member
        };
        _db.Users.Add(newUser);
        await _db.SaveChangesAsync();

        await _audit.LogAsync(userId, "UserCreate", "User", newUser.Id.ToString(), $"byUser={userId}, username={request.Email}");

        return _mapper.Map<CompanyUserDto>(newUser);
    }

    public async Task<CompanyUserDto> UpdateCompanyUserAsync(int userId, int targetUserId, UpdateCompanyUserRequest request)
    {
        var admin = await _db.Users.FindAsync(userId) ?? throw new KeyNotFoundException("Admin not found.");
        EnsureCompanyAdmin(admin);
        var target = await _db.Users.FirstOrDefaultAsync(u => u.Id == targetUserId && u.CompanyId == admin.CompanyId)
            ?? throw new KeyNotFoundException("User not found in your company.");

        if (request.FullName != null) target.FullName = request.FullName;
        if (request.CompanyRole.HasValue) target.CompanyRole = request.CompanyRole.Value;
        if (request.IsActive.HasValue) target.IsActive = request.IsActive.Value;

        await _db.SaveChangesAsync();

        await _audit.LogAsync(userId, "UserUpdate", "User", targetUserId.ToString(), $"byUser={userId}");

        return _mapper.Map<CompanyUserDto>(target);
    }

    public async Task DeleteCompanyUserAsync(int userId, int targetUserId)
    {
        var admin = await _db.Users.FindAsync(userId) ?? throw new KeyNotFoundException("Admin not found.");
        EnsureCompanyAdmin(admin);
        if (userId == targetUserId) throw new InvalidOperationException("Cannot delete yourself.");

        var target = await _db.Users.FirstOrDefaultAsync(u => u.Id == targetUserId && u.CompanyId == admin.CompanyId)
            ?? throw new KeyNotFoundException("User not found in your company.");

        target.IsActive = false;
        await _db.SaveChangesAsync();

        await _audit.LogAsync(userId, "UserDelete", "User", targetUserId.ToString(), $"byUser={userId}");
    }

    private static void EnsureCompanyAdmin(User user)
    {
        if (user.CompanyRole != Domain.Enums.CompanyRole.Admin)
            throw new ForbiddenException("Only company admins can manage users.");
    }

    private static void EnsureReportAccess(User user)
    {
        if (user.CompanyRole != Domain.Enums.CompanyRole.Admin)
            throw new ForbiddenException("Reports are available to company admins only.");
    }

    private static byte[] GenerateExcel(List<Payment> payments)
    {
        using var workbook = new XLWorkbook();
        var ws = workbook.Worksheets.Add("Transactions");

        ws.Cell(1, 1).Value = "Confirmation #";
        ws.Cell(1, 2).Value = "AWB Number";
        ws.Cell(1, 3).Value = "Date";
        ws.Cell(1, 4).Value = "Amount";
        ws.Cell(1, 5).Value = "Processing Fee";
        ws.Cell(1, 6).Value = "Method";
        ws.Row(1).Style.Font.Bold = true;

        for (int i = 0; i < payments.Count; i++)
        {
            var p = payments[i];
            ws.Cell(i + 2, 1).Value = p.ConfirmationNumber;
            ws.Cell(i + 2, 2).Value = p.AwbNumber;
            ws.Cell(i + 2, 3).Value = p.PaymentDate.ToString("yyyy-MM-dd");
            ws.Cell(i + 2, 4).Value = (double)p.Amount;
            ws.Cell(i + 2, 5).Value = (double)p.ProcessingFee;
            ws.Cell(i + 2, 6).Value = p.PaymentMethod.ToString();
        }

        ws.Columns().AdjustToContents();
        using var ms = new MemoryStream();
        workbook.SaveAs(ms);
        return ms.ToArray();
    }

    private static byte[] GenerateReportPdf(List<Payment> payments)
    {
        QuestPDF.Settings.License = LicenseType.Community;
        var document = Document.Create(container =>
        {
            container.Page(page =>
            {
                page.Size(PageSizes.A4);
                page.Margin(40);
                page.Header().Text("Transaction Report").FontSize(20).Bold().AlignCenter();

                page.Content().PaddingVertical(10).Table(table =>
                {
                    table.ColumnsDefinition(cols =>
                    {
                        cols.RelativeColumn(2);
                        cols.RelativeColumn(2);
                        cols.RelativeColumn(1.5f);
                        cols.RelativeColumn(1);
                        cols.RelativeColumn(1);
                    });

                    table.Header(header =>
                    {
                        header.Cell().Text("Confirmation").Bold();
                        header.Cell().Text("AWB").Bold();
                        header.Cell().Text("Date").Bold();
                        header.Cell().Text("Amount").Bold();
                        header.Cell().Text("Fee").Bold();
                    });

                    foreach (var p in payments)
                    {
                        table.Cell().Text(p.ConfirmationNumber);
                        table.Cell().Text(p.AwbNumber);
                        table.Cell().Text(p.PaymentDate.ToString("yyyy-MM-dd"));
                        table.Cell().Text($"${p.Amount:N2}");
                        table.Cell().Text($"${p.ProcessingFee:N2}");
                    }
                });

                page.Footer().AlignCenter().Text("GHA Payment Portal");
            });
        });

        return document.GeneratePdf();
    }
}
