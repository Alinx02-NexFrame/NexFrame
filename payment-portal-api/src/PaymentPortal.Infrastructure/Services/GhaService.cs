using AutoMapper;
using ClosedXML.Excel;
using Microsoft.EntityFrameworkCore;
using PaymentPortal.Application.DTOs.Common;
using PaymentPortal.Application.DTOs.GHA;
using PaymentPortal.Application.Interfaces;
using PaymentPortal.Domain.Entities;
using PaymentPortal.Domain.Enums;
using PaymentPortal.Infrastructure.Data;
using QuestPDF.Fluent;
using QuestPDF.Helpers;
using QuestPDF.Infrastructure;

namespace PaymentPortal.Infrastructure.Services;

public class GhaService : IGhaService
{
    private readonly AppDbContext _db;
    private readonly IMapper _mapper;

    public GhaService(AppDbContext db, IMapper mapper)
    {
        _db = db;
        _mapper = mapper;
    }

    public async Task<RevenueStatsDto> GetRevenueStatsAsync()
    {
        var now = DateTime.UtcNow;

        // Show all-time stats (not filtered by current month) so dashboard always has data
        var payments = await _db.Payments
            .Where(p => p.PaymentStatus == PaymentStatus.Completed)
            .ToListAsync();

        return new RevenueStatsDto
        {
            TotalRevenue = payments.Sum(p => p.Amount),
            ProcessingFeeRevenue = payments.Sum(p => p.ProcessingFee),
            StorageFeeRevenue = await _db.BillingRecords.Where(b => b.Status == BillingStatus.Paid).SumAsync(b => b.StorageFee),
            TransactionCount = payments.Count,
            Period = now.ToString("MMMM yyyy")
        };
    }

    public async Task<List<MonthlyTrendDto>> GetMonthlyTrendAsync()
    {
        var twelveMonthsAgo = DateTime.UtcNow.AddMonths(-12);
        var payments = await _db.Payments
            .Where(p => p.PaymentStatus == PaymentStatus.Completed && p.PaymentDate >= twelveMonthsAgo)
            .ToListAsync();

        return payments
            .GroupBy(p => p.PaymentDate.ToString("yyyy-MM"))
            .OrderBy(g => g.Key)
            .Select(g => new MonthlyTrendDto
            {
                Month = g.Key,
                Revenue = g.Sum(p => p.Amount),
                Transactions = g.Count()
            }).ToList();
    }

    public async Task<List<RevenueBreakdownDto>> GetRevenueBreakdownAsync()
    {
        var billings = await _db.BillingRecords.Where(b => b.Status == BillingStatus.Paid).ToListAsync();
        var totalService = billings.Sum(b => b.ServiceFee);
        var totalStorage = billings.Sum(b => b.StorageFee);
        var totalProcessing = billings.Sum(b => b.ProcessingFee);
        var totalOther = billings.Sum(b => b.OtherCharge);
        var grandTotal = totalService + totalStorage + totalProcessing + totalOther;

        if (grandTotal == 0) grandTotal = 1;

        return new List<RevenueBreakdownDto>
        {
            new() { Category = "Service Fee", Amount = totalService, Percentage = Math.Round(totalService / grandTotal * 100, 1) },
            new() { Category = "Storage Fee", Amount = totalStorage, Percentage = Math.Round(totalStorage / grandTotal * 100, 1) },
            new() { Category = "Processing Fee", Amount = totalProcessing, Percentage = Math.Round(totalProcessing / grandTotal * 100, 1) },
            new() { Category = "Other Charges", Amount = totalOther, Percentage = Math.Round(totalOther / grandTotal * 100, 1) },
        };
    }

    public async Task<SettlementDto> GetSettlementAsync()
    {
        var totalProcessingFees = await _db.Payments
            .Where(p => p.PaymentStatus == PaymentStatus.Completed)
            .SumAsync(p => p.ProcessingFee);

        return new SettlementDto
        {
            TotalProcessingFees = totalProcessingFees,
            SettlementAmount = totalProcessingFees * 0.75m,
            SettlementRate = 0.75m
        };
    }

    public async Task<List<TopCustomerDto>> GetTopCustomersAsync(int count = 5)
    {
        var customers = await _db.Payments
            .Where(p => p.PaymentStatus == PaymentStatus.Completed && p.CompanyId != null)
            .GroupBy(p => p.CompanyId)
            .Select(g => new
            {
                CompanyId = g.Key,
                TransactionCount = g.Count(),
                TotalSpent = g.Sum(p => p.Amount)
            })
            .OrderByDescending(x => x.TotalSpent)
            .Take(count)
            .ToListAsync();

        var result = new List<TopCustomerDto>();
        foreach (var c in customers)
        {
            var company = await _db.Companies.FindAsync(c.CompanyId);
            result.Add(new TopCustomerDto
            {
                CompanyName = company?.Name ?? "Unknown",
                TransactionCount = c.TransactionCount,
                TotalSpent = c.TotalSpent
            });
        }
        return result;
    }

    public async Task<PagedResult<CustomerDto>> GetCustomersAsync(int page = 1, int pageSize = 10, string? search = null)
    {
        var query = _db.Companies.AsQueryable();
        if (!string.IsNullOrWhiteSpace(search))
            query = query.Where(c => c.Name.Contains(search) || c.Email.Contains(search));

        var totalCount = await query.CountAsync();
        var companies = await query
            .OrderBy(c => c.Name)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync();

        var items = new List<CustomerDto>();
        foreach (var company in companies)
        {
            var payments = await _db.Payments
                .Where(p => p.CompanyId == company.Id && p.PaymentStatus == PaymentStatus.Completed)
                .ToListAsync();

            items.Add(new CustomerDto
            {
                Id = company.Id.ToString(),
                CompanyName = company.Name,
                Email = company.Email,
                TotalTransactions = payments.Count,
                LastPaymentDate = payments.OrderByDescending(p => p.PaymentDate).FirstOrDefault()?.PaymentDate.ToString("yyyy-MM-dd"),
                TotalSpent = payments.Sum(p => p.Amount)
            });
        }

        return new PagedResult<CustomerDto>
        {
            Items = items,
            TotalCount = totalCount,
            Page = page,
            PageSize = pageSize
        };
    }

    public async Task<List<ActivityDto>> GetRecentActivityAsync(int count = 20)
    {
        var payments = await _db.Payments
            .OrderByDescending(p => p.PaymentDate)
            .Take(count)
            .ToListAsync();

        return payments.Select(p => new ActivityDto
        {
            Type = "payment",
            Description = $"Payment {p.ConfirmationNumber} - AWB {p.AwbNumber} - ${p.Amount:N2}",
            Timestamp = p.PaymentDate.ToString("yyyy-MM-dd HH:mm")
        }).ToList();
    }

    public async Task<ReportDto> GenerateReportAsync(GenerateReportRequest request, int userId)
    {
        var report = new Report
        {
            Name = request.Name,
            ReportType = Enum.Parse<ReportType>(request.ReportType, true),
            Format = Enum.Parse<ReportFormat>(request.Format, true),
            GeneratedById = userId,
            FileUrl = $"/api/gha/reports/{DateTime.UtcNow:yyyyMMddHHmmss}"
        };

        _db.Reports.Add(report);
        await _db.SaveChangesAsync();
        return _mapper.Map<ReportDto>(report);
    }

    public async Task<List<ReportDto>> GetReportsListAsync(int count = 10)
    {
        var reports = await _db.Reports
            .OrderByDescending(r => r.GeneratedAt)
            .Take(count)
            .ToListAsync();

        return reports.Select(r => _mapper.Map<ReportDto>(r)).ToList();
    }

    public async Task<MonthlyInsightsDto> GetMonthlyInsightsAsync()
    {
        var now = DateTime.UtcNow;
        var currentMonthStart = new DateTime(now.Year, now.Month, 1);
        var prevMonthStart = currentMonthStart.AddMonths(-1);

        var payments = await _db.Payments
            .Where(p => p.PaymentStatus == PaymentStatus.Completed && p.PaymentDate >= prevMonthStart)
            .ToListAsync();

        var currentRevenue = payments.Where(p => p.PaymentDate >= currentMonthStart).Sum(p => p.Amount);
        var prevRevenue = payments.Where(p => p.PaymentDate < currentMonthStart).Sum(p => p.Amount);
        var growth = prevRevenue > 0 ? Math.Round((currentRevenue - prevRevenue) / prevRevenue * 100, 1) : 0;

        var newCustomers = await _db.Companies
            .CountAsync(c => c.CreatedAt >= currentMonthStart);

        var topCustomer = (await GetTopCustomersAsync(1)).FirstOrDefault();

        return new MonthlyInsightsDto
        {
            RevenueGrowthPercent = growth,
            NewCustomersThisMonth = newCustomers,
            TopCustomerName = topCustomer?.CompanyName ?? "N/A",
            TopCustomerSpent = topCustomer?.TotalSpent ?? 0
        };
    }

    public async Task<int> UploadDataAsync(Stream fileStream, string fileName, int userId)
    {
        var upload = new UploadHistory
        {
            FileName = fileName,
            Status = UploadStatus.Completed,
            RecordCount = 0,
            UploadedById = userId
        };

        // Parse file based on extension
        var ext = Path.GetExtension(fileName).ToLowerInvariant();
        if (ext == ".xlsx" || ext == ".xls")
        {
            using var workbook = new XLWorkbook(fileStream);
            var ws = workbook.Worksheets.First();
            upload.RecordCount = ws.RowsUsed().Count() - 1; // exclude header
        }
        else
        {
            using var reader = new StreamReader(fileStream);
            var content = await reader.ReadToEndAsync();
            upload.RecordCount = content.Split('\n', StringSplitOptions.RemoveEmptyEntries).Length - 1;
        }

        _db.UploadHistory.Add(upload);
        await _db.SaveChangesAsync();
        return upload.RecordCount;
    }
}
