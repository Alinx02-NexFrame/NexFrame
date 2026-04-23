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
    private readonly IAuditLogService _audit;

    public GhaService(AppDbContext db, IMapper mapper, IAuditLogService audit)
    {
        _db = db;
        _mapper = mapper;
        _audit = audit;
    }

    public async Task<RevenueStatsDto> GetRevenueStatsAsync()
    {
        var now = DateTime.UtcNow;

        // Show all-time stats (not filtered by current month) so dashboard always has data
        var payments = await _db.Payments
            .Where(p => p.PaymentStatus == PaymentStatus.Completed)
            .ToListAsync();

        var storageFees = await _db.BillingRecords
            .Where(b => b.Status == BillingStatus.Paid)
            .Select(b => b.StorageFee)
            .ToListAsync();

        return new RevenueStatsDto
        {
            TotalRevenue = payments.Sum(p => p.Amount),
            ProcessingFeeRevenue = payments.Sum(p => p.ProcessingFee),
            StorageFeeRevenue = storageFees.Sum(),
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
        // Materialize then aggregate in memory (works for any provider).
        var processingFees = await _db.Payments
            .Where(p => p.PaymentStatus == PaymentStatus.Completed)
            .Select(p => p.ProcessingFee)
            .ToListAsync();

        var totalProcessingFees = processingFees.Sum();

        return new SettlementDto
        {
            TotalProcessingFees = totalProcessingFees,
            SettlementAmount = totalProcessingFees * 0.75m,
            SettlementRate = 0.75m
        };
    }

    public async Task<List<TopCustomerDto>> GetTopCustomersAsync(int count = 5)
    {
        // Materialize then group in memory (works for any provider).
        var rows = await _db.Payments
            .Where(p => p.PaymentStatus == PaymentStatus.Completed && p.CompanyId != null)
            .Select(p => new { p.CompanyId, p.Amount })
            .ToListAsync();

        var customers = rows
            .GroupBy(p => p.CompanyId!.Value)
            .Select(g => new
            {
                CompanyId = g.Key,
                TransactionCount = g.Count(),
                TotalSpent = g.Sum(p => p.Amount)
            })
            .OrderByDescending(x => x.TotalSpent)
            .Take(count)
            .ToList();

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
        var reportType = Enum.Parse<ReportType>(request.ReportType, true);
        var format = Enum.Parse<ReportFormat>(request.Format, true);

        // Persist metadata first to obtain the report ID for the file name.
        var report = new Report
        {
            Name = request.Name,
            ReportType = reportType,
            Format = format,
            GeneratedById = userId,
            GeneratedAt = DateTime.UtcNow
        };

        _db.Reports.Add(report);
        await _db.SaveChangesAsync();

        // Build the report payload depending on type.
        var payload = await BuildReportPayloadAsync(reportType);

        // Render bytes using the requested format.
        var fileBytes = format switch
        {
            ReportFormat.PDF => RenderPdf(report, payload),
            ReportFormat.Excel => RenderExcel(report, payload),
            _ => throw new InvalidOperationException($"Unsupported report format: {format}")
        };

        // Save to disk under reports/{Year}/{Month}/{ReportId}-{Slug}.{ext}
        var ext = format == ReportFormat.PDF ? "pdf" : "xlsx";
        var slug = Slugify(request.Name);
        var year = report.GeneratedAt.Year.ToString("D4");
        var month = report.GeneratedAt.Month.ToString("D2");

        var dir = Path.Combine(AppContext.BaseDirectory, "reports", year, month);
        Directory.CreateDirectory(dir);

        var fileName = $"{report.Id}-{slug}.{ext}";
        var fullPath = Path.Combine(dir, fileName);
        await File.WriteAllBytesAsync(fullPath, fileBytes);

        // Update entity with file location info.
        report.FilePath = fullPath;
        report.FileSizeBytes = fileBytes.LongLength;
        report.FileUrl = $"/api/gha/reports/{report.Id}/download";
        await _db.SaveChangesAsync();

        await _audit.LogAsync(userId, "ReportGenerate", "Report", report.Id.ToString(),
            $"type={report.ReportType}, format={report.Format}, size={report.FileSizeBytes}");

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

    public async Task<(byte[] Content, string ContentType, string FileName)> GetReportFileAsync(int reportId)
    {
        var report = await _db.Reports.FirstOrDefaultAsync(r => r.Id == reportId)
            ?? throw new KeyNotFoundException($"Report not found: {reportId}");

        if (string.IsNullOrWhiteSpace(report.FilePath) || !File.Exists(report.FilePath))
            throw new FileNotFoundException($"Report file is missing on disk for report {reportId}.", report.FilePath);

        var bytes = await File.ReadAllBytesAsync(report.FilePath);
        var contentType = report.Format == ReportFormat.PDF
            ? "application/pdf"
            : "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";
        var ext = report.Format == ReportFormat.PDF ? "pdf" : "xlsx";
        var fileName = $"{report.ReportType}_{report.GeneratedAt:yyyyMMdd}.{ext}";

        return (bytes, contentType, fileName);
    }

    // ---------------------------------------------------------------------
    // Report data assembly
    // ---------------------------------------------------------------------

    private async Task<ReportPayload> BuildReportPayloadAsync(ReportType reportType)
    {
        return reportType switch
        {
            ReportType.Revenue => await BuildRevenuePayloadAsync(),
            ReportType.Transaction => await BuildTransactionPayloadAsync(),
            ReportType.Customer => await BuildCustomerPayloadAsync(),
            _ => throw new InvalidOperationException($"Unsupported report type: {reportType}")
        };
    }

    private async Task<ReportPayload> BuildRevenuePayloadAsync()
    {
        var stats = await GetRevenueStatsAsync();
        var monthly = await GetMonthlyTrendAsync();
        var breakdown = await GetRevenueBreakdownAsync();
        var topCustomers = await GetTopCustomersAsync(10);

        var summary = new List<KeyValuePair<string, string>>
        {
            new("Period", stats.Period),
            new("Total Revenue", $"${stats.TotalRevenue:N2}"),
            new("Processing Fee Revenue", $"${stats.ProcessingFeeRevenue:N2}"),
            new("Storage Fee Revenue", $"${stats.StorageFeeRevenue:N2}"),
            new("Transaction Count", stats.TransactionCount.ToString("N0"))
        };

        var sections = new List<ReportSection>
        {
            new(
                Title: "Monthly Trend (last 12 months)",
                Columns: new[] { "Month", "Revenue", "Transactions" },
                Rows: monthly
                    .Select(m => new object[] { m.Month, m.Revenue, m.Transactions })
                    .ToList(),
                CurrencyColumns: new[] { 1 }),
            new(
                Title: "Revenue Breakdown by Category",
                Columns: new[] { "Category", "Amount", "Percentage" },
                Rows: breakdown
                    .Select(b => new object[] { b.Category, b.Amount, $"{b.Percentage:N1}%" })
                    .ToList(),
                CurrencyColumns: new[] { 1 }),
            new(
                Title: "Top Customers",
                Columns: new[] { "Customer", "Transactions", "Total Spent" },
                Rows: topCustomers
                    .Select(c => new object[] { c.CompanyName, c.TransactionCount, c.TotalSpent })
                    .ToList(),
                CurrencyColumns: new[] { 2 })
        };

        return new ReportPayload("Revenue Report", summary, sections);
    }

    private async Task<ReportPayload> BuildTransactionPayloadAsync()
    {
        // Pull recent payments (cap at 1000 to keep file size sane).
        var payments = await _db.Payments
            .OrderByDescending(p => p.PaymentDate)
            .Take(1000)
            .ToListAsync();

        var totalAmount = payments.Sum(p => p.Amount);
        var totalProcessing = payments.Sum(p => p.ProcessingFee);

        var summary = new List<KeyValuePair<string, string>>
        {
            new("Transaction Count", payments.Count.ToString("N0")),
            new("Total Amount", $"${totalAmount:N2}"),
            new("Total Processing Fees", $"${totalProcessing:N2}"),
            new("Date Range", payments.Count > 0
                ? $"{payments.Min(p => p.PaymentDate):MM/dd/yyyy} - {payments.Max(p => p.PaymentDate):MM/dd/yyyy}"
                : "N/A")
        };

        var rows = payments
            .Select(p => new object[]
            {
                p.PaymentDate.ToString("MM/dd/yyyy h:mm tt"),
                p.ConfirmationNumber,
                p.AwbNumber,
                FormatPaymentMethod(p.PaymentMethod),
                p.PaymentStatus.ToString(),
                p.Amount,
                p.ProcessingFee
            })
            .ToList();

        var sections = new List<ReportSection>
        {
            new(
                Title: "Payment Transactions",
                Columns: new[] { "Date", "Confirmation #", "AWB", "Method", "Status", "Amount", "Processing Fee" },
                Rows: rows,
                CurrencyColumns: new[] { 5, 6 })
        };

        return new ReportPayload("Transaction Report", summary, sections);
    }

    private async Task<ReportPayload> BuildCustomerPayloadAsync()
    {
        var companies = await _db.Companies.OrderBy(c => c.Name).ToListAsync();
        var allPayments = await _db.Payments
            .Where(p => p.CompanyId != null && p.PaymentStatus == PaymentStatus.Completed)
            .Select(p => new { p.CompanyId, p.Amount, p.PaymentDate })
            .ToListAsync();

        var byCompany = allPayments
            .GroupBy(p => p.CompanyId!.Value)
            .ToDictionary(g => g.Key, g => g.ToList());

        var rows = new List<object[]>();
        foreach (var c in companies)
        {
            var paymentsForCompany = byCompany.TryGetValue(c.Id, out var list) ? list : new();
            var totalSpent = paymentsForCompany.Sum(p => p.Amount);
            var lastPaymentDate = paymentsForCompany
                .OrderByDescending(p => p.PaymentDate)
                .FirstOrDefault()?.PaymentDate;

            rows.Add(new object[]
            {
                c.Name,
                c.Email,
                paymentsForCompany.Count,
                lastPaymentDate.HasValue ? lastPaymentDate.Value.ToString("MM/dd/yyyy") : "N/A",
                totalSpent
            });
        }

        var summary = new List<KeyValuePair<string, string>>
        {
            new("Total Customers", companies.Count.ToString("N0")),
            new("Active Customers", byCompany.Count.ToString("N0")),
            new("Total Revenue (Completed)", $"${allPayments.Sum(p => p.Amount):N2}")
        };

        var sections = new List<ReportSection>
        {
            new(
                Title: "Customers",
                Columns: new[] { "Customer", "Email", "Transactions", "Last Payment", "Total Spent" },
                Rows: rows,
                CurrencyColumns: new[] { 4 })
        };

        return new ReportPayload("Customer Report", summary, sections);
    }

    // ---------------------------------------------------------------------
    // PDF rendering (QuestPDF)
    // ---------------------------------------------------------------------

    private static byte[] RenderPdf(Report report, ReportPayload payload)
    {
        QuestPDF.Settings.License = LicenseType.Community;

        var generatedLocal = TimeZoneInfo.ConvertTimeFromUtc(
            DateTime.SpecifyKind(report.GeneratedAt, DateTimeKind.Utc),
            TimeZoneInfo.FindSystemTimeZoneById(OperatingSystem.IsWindows() ? "Eastern Standard Time" : "America/New_York"));
        var generatedStr = $"{generatedLocal:MM/dd/yyyy h:mm tt} ET";

        var document = Document.Create(container =>
        {
            container.Page(page =>
            {
                page.Size(PageSizes.Letter);
                page.Margin(40);
                page.DefaultTextStyle(t => t.FontSize(10).FontColor(Colors.Grey.Darken4));

                // Header
                page.Header().Column(headerCol =>
                {
                    headerCol.Item().Row(row =>
                    {
                        row.RelativeItem().Column(c =>
                        {
                            c.Item().Text("GHA Payment Portal").FontSize(18).Bold().FontColor(Colors.Blue.Darken3);
                            c.Item().Text("Ground Handling Agent Cargo Services").FontSize(9).Italic();
                        });
                        row.RelativeItem().AlignRight().Column(c =>
                        {
                            c.Item().Text(payload.Title.ToUpper()).FontSize(14).Bold();
                            c.Item().Text(report.Name).FontSize(10);
                            c.Item().Text($"Generated: {generatedStr}").FontSize(9).FontColor(Colors.Grey.Darken1);
                        });
                    });
                    headerCol.Item().PaddingTop(8).LineHorizontal(1).LineColor(Colors.Grey.Medium);
                });

                page.Content().PaddingVertical(15).Column(col =>
                {
                    col.Spacing(14);

                    // Summary block
                    col.Item().Background(Colors.Grey.Lighten3).Padding(10).Column(c =>
                    {
                        c.Item().Text("SUMMARY").FontSize(9).Bold().FontColor(Colors.Grey.Darken2);
                        c.Item().PaddingTop(4).Table(table =>
                        {
                            table.ColumnsDefinition(cols =>
                            {
                                cols.RelativeColumn(2);
                                cols.RelativeColumn(3);
                            });
                            foreach (var kv in payload.Summary)
                            {
                                table.Cell().PaddingVertical(2).Text(kv.Key).FontSize(10).Bold();
                                table.Cell().PaddingVertical(2).Text(kv.Value).FontSize(10);
                            }
                        });
                    });

                    // Sections
                    foreach (var section in payload.Sections)
                    {
                        col.Item().Column(c =>
                        {
                            c.Item().Text(section.Title.ToUpper()).FontSize(10).Bold();
                            c.Item().PaddingTop(4).Table(table =>
                            {
                                table.ColumnsDefinition(cols =>
                                {
                                    foreach (var _ in section.Columns)
                                        cols.RelativeColumn();
                                });

                                // Header row
                                foreach (var col2 in section.Columns)
                                {
                                    table.Cell().Background(Colors.Blue.Lighten4).PaddingVertical(4).PaddingHorizontal(4)
                                        .Text(col2).FontSize(9).Bold().FontColor(Colors.Blue.Darken3);
                                }

                                // Data rows
                                if (section.Rows.Count == 0)
                                {
                                    foreach (var _ in section.Columns)
                                        table.Cell().PaddingVertical(4).PaddingHorizontal(4).Text("—").FontSize(9).Italic();
                                }
                                else
                                {
                                    foreach (var row in section.Rows)
                                    {
                                        for (var i = 0; i < row.Length; i++)
                                        {
                                            var cellText = section.CurrencyColumns.Contains(i) && row[i] is decimal d
                                                ? $"${d:N2}"
                                                : row[i]?.ToString() ?? string.Empty;
                                            var cell = table.Cell().BorderBottom(0.5f).BorderColor(Colors.Grey.Lighten2)
                                                .PaddingVertical(3).PaddingHorizontal(4);
                                            if (section.CurrencyColumns.Contains(i))
                                                cell.AlignRight().Text(cellText).FontSize(9);
                                            else
                                                cell.Text(cellText).FontSize(9);
                                        }
                                    }
                                }
                            });
                        });
                    }
                });

                page.Footer().Column(footerCol =>
                {
                    footerCol.Item().LineHorizontal(0.5f).LineColor(Colors.Grey.Medium);
                    footerCol.Item().PaddingTop(4).Row(row =>
                    {
                        row.RelativeItem().Text("GHA Payment Portal | support@ghapaymentportal.com")
                            .FontSize(8).FontColor(Colors.Grey.Darken1);
                        row.RelativeItem().AlignRight().Text(t =>
                        {
                            t.DefaultTextStyle(s => s.FontSize(8).FontColor(Colors.Grey.Medium));
                            t.Span("Page ");
                            t.CurrentPageNumber();
                            t.Span(" of ");
                            t.TotalPages();
                        });
                    });
                });
            });
        });

        return document.GeneratePdf();
    }

    // ---------------------------------------------------------------------
    // Excel rendering (ClosedXML)
    // ---------------------------------------------------------------------

    private static byte[] RenderExcel(Report report, ReportPayload payload)
    {
        using var workbook = new XLWorkbook();

        // Sheet 1: Summary
        var summarySheet = workbook.Worksheets.Add("Summary");
        summarySheet.Cell(1, 1).Value = "GHA Payment Portal";
        summarySheet.Cell(1, 1).Style.Font.Bold = true;
        summarySheet.Cell(1, 1).Style.Font.FontSize = 16;

        summarySheet.Cell(2, 1).Value = payload.Title;
        summarySheet.Cell(2, 1).Style.Font.Bold = true;
        summarySheet.Cell(2, 1).Style.Font.FontSize = 13;

        summarySheet.Cell(3, 1).Value = $"Report: {report.Name}";
        summarySheet.Cell(4, 1).Value = $"Generated (UTC): {report.GeneratedAt:MM/dd/yyyy h:mm tt}";

        var row = 6;
        summarySheet.Cell(row, 1).Value = "Metric";
        summarySheet.Cell(row, 2).Value = "Value";
        var headerRange = summarySheet.Range(row, 1, row, 2);
        headerRange.Style.Font.Bold = true;
        headerRange.Style.Fill.BackgroundColor = XLColor.LightBlue;
        row++;

        foreach (var kv in payload.Summary)
        {
            summarySheet.Cell(row, 1).Value = kv.Key;
            summarySheet.Cell(row, 2).Value = kv.Value;
            row++;
        }

        summarySheet.Columns().AdjustToContents();

        // Sheet 2+: Detail sections
        foreach (var section in payload.Sections)
        {
            var sheetName = TruncateSheetName(section.Title);
            var sheet = workbook.Worksheets.Add(sheetName);

            // Header row
            for (var i = 0; i < section.Columns.Count; i++)
            {
                sheet.Cell(1, i + 1).Value = section.Columns[i];
            }
            var hdr = sheet.Range(1, 1, 1, section.Columns.Count);
            hdr.Style.Font.Bold = true;
            hdr.Style.Fill.BackgroundColor = XLColor.LightBlue;
            hdr.Style.Border.BottomBorder = XLBorderStyleValues.Thin;

            // Data rows
            for (var r = 0; r < section.Rows.Count; r++)
            {
                var dataRow = section.Rows[r];
                for (var c = 0; c < dataRow.Length; c++)
                {
                    var cell = sheet.Cell(r + 2, c + 1);
                    var value = dataRow[c];
                    switch (value)
                    {
                        case decimal dec:
                            cell.Value = dec;
                            if (section.CurrencyColumns.Contains(c))
                                cell.Style.NumberFormat.Format = "$#,##0.00";
                            else
                                cell.Style.NumberFormat.Format = "#,##0.00";
                            break;
                        case int intVal:
                            cell.Value = intVal;
                            cell.Style.NumberFormat.Format = "#,##0";
                            break;
                        case long longVal:
                            cell.Value = longVal;
                            cell.Style.NumberFormat.Format = "#,##0";
                            break;
                        case DateTime dt:
                            cell.Value = dt;
                            cell.Style.DateFormat.Format = "mm/dd/yyyy hh:mm AM/PM";
                            break;
                        default:
                            cell.Value = value?.ToString() ?? string.Empty;
                            break;
                    }
                }
            }

            sheet.Columns().AdjustToContents();
        }

        using var ms = new MemoryStream();
        workbook.SaveAs(ms);
        return ms.ToArray();
    }

    // ---------------------------------------------------------------------
    // Helpers
    // ---------------------------------------------------------------------

    private static string Slugify(string input)
    {
        if (string.IsNullOrWhiteSpace(input))
            return "report";
        var invalid = Path.GetInvalidFileNameChars();
        var cleaned = new string(input.Trim().Select(c => invalid.Contains(c) || c == ' ' ? '-' : c).ToArray());
        // Collapse multiple dashes.
        while (cleaned.Contains("--"))
            cleaned = cleaned.Replace("--", "-");
        return cleaned.Trim('-').ToLowerInvariant();
    }

    private static string TruncateSheetName(string name)
    {
        // Excel sheet names: max 31 chars, no [ ] : * ? / \
        var invalid = new[] { '[', ']', ':', '*', '?', '/', '\\' };
        var cleaned = new string(name.Select(c => invalid.Contains(c) ? '-' : c).ToArray());
        return cleaned.Length > 31 ? cleaned[..31] : cleaned;
    }

    private static string FormatPaymentMethod(PaymentMethod method) => method switch
    {
        PaymentMethod.CreditCard => "Credit Card",
        PaymentMethod.ACH => "ACH",
        PaymentMethod.InternationalWire => "International Wire",
        _ => method.ToString()
    };

    private record ReportPayload(
        string Title,
        IReadOnlyList<KeyValuePair<string, string>> Summary,
        IReadOnlyList<ReportSection> Sections);

    private record ReportSection(
        string Title,
        IReadOnlyList<string> Columns,
        IReadOnlyList<object[]> Rows,
        IReadOnlyList<int> CurrencyColumns);

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

    // ---------------------------------------------------------------------
    // Cargo bulk upload (Excel / CSV)
    // ---------------------------------------------------------------------

    private static readonly System.Text.RegularExpressions.Regex AwbRegex =
        new(@"^\d{3}-\d{8}$", System.Text.RegularExpressions.RegexOptions.Compiled);

    /// <summary>
    /// Parse an uploaded .xlsx or .csv file into Cargo rows, validate each row,
    /// insert valid rows in a single transaction, and persist an UploadHistory record.
    /// </summary>
    public async Task<CargoUploadResultDto> UploadDataAsync(Stream fileStream, string fileName, int userId)
    {
        var ext = Path.GetExtension(fileName).ToLowerInvariant();
        if (ext != ".xlsx" && ext != ".csv")
            throw new ArgumentException($"Unsupported file extension '{ext}'. Only .xlsx and .csv are accepted.");

        // Always create the UploadHistory row first so we have a stable id even on failure.
        var upload = new UploadHistory
        {
            FileName = fileName,
            Status = UploadStatus.Processing,
            RecordCount = 0,
            UploadedById = userId,
            UploadedAt = DateTime.UtcNow
        };
        _db.UploadHistory.Add(upload);
        await _db.SaveChangesAsync();

        var result = new CargoUploadResultDto
        {
            UploadId = upload.Id,
            FileName = fileName
        };

        List<List<string>> rows;
        List<string> headers;
        try
        {
            (headers, rows) = ext == ".xlsx"
                ? ReadExcelRows(fileStream)
                : ReadCsvRows(fileStream);
        }
        catch (Exception ex)
        {
            upload.Status = UploadStatus.Failed;
            upload.RecordCount = 0;
            upload.ErrorMessage = $"Failed to parse file: {ex.Message}";
            await _db.SaveChangesAsync();

            await _audit.LogAsync(userId, "DataUpload", "Cargo", null,
                $"fileName={fileName}, parseError={ex.Message}");

            result.Status = "Failed";
            result.RecordCount = 0;
            result.SuccessCount = 0;
            result.ErrorCount = 0;
            result.Errors.Add(new CargoUploadErrorDto { Row = 0, Reason = $"File could not be parsed: {ex.Message}" });
            return result;
        }

        var headerMap = BuildHeaderMap(headers);
        var requiredHeaders = new[] { "awbnumber", "origin", "destination", "flightdate", "arrivaldate", "pieces", "weight" };
        var missingHeaders = requiredHeaders.Where(h => !headerMap.ContainsKey(h)).ToList();
        if (missingHeaders.Count > 0)
        {
            var msg = $"Missing required column(s): {string.Join(", ", missingHeaders)}";
            upload.Status = UploadStatus.Failed;
            upload.RecordCount = 0;
            upload.ErrorMessage = msg;
            await _db.SaveChangesAsync();

            await _audit.LogAsync(userId, "DataUpload", "Cargo", null, $"fileName={fileName}, {msg}");

            result.Status = "Failed";
            result.Errors.Add(new CargoUploadErrorDto { Row = 1, Reason = msg });
            return result;
        }

        // Snapshot existing AWBs once to keep per-row checks O(1) and avoid repeated DB hits.
        var existingAwbs = new HashSet<string>(
            await _db.Cargo.Select(c => c.AwbNumber).ToListAsync(),
            StringComparer.OrdinalIgnoreCase);

        var validCargo = new List<Domain.Entities.Cargo>();
        var pendingAwbsThisFile = new HashSet<string>(StringComparer.OrdinalIgnoreCase);
        var errors = new List<CargoUploadErrorDto>();

        for (var i = 0; i < rows.Count; i++)
        {
            var rowNumber = i + 2; // header is row 1
            var row = rows[i];
            if (row.All(string.IsNullOrWhiteSpace)) continue;

            string Get(string key) => headerMap.TryGetValue(key, out var idx) && idx < row.Count
                ? (row[idx] ?? string.Empty).Trim()
                : string.Empty;

            var awb = Get("awbnumber");

            try
            {
                // AWB format
                if (string.IsNullOrWhiteSpace(awb))
                    throw new FormatException("AwbNumber is required.");
                if (!AwbRegex.IsMatch(awb))
                    throw new FormatException($"Invalid AWB format '{awb}'. Expected NNN-NNNNNNNN.");

                // Duplicate detection (DB or earlier row in this file).
                if (existingAwbs.Contains(awb))
                    throw new InvalidOperationException("Duplicate AWB (already exists in database).");
                if (!pendingAwbsThisFile.Add(awb))
                    throw new InvalidOperationException("Duplicate AWB within the uploaded file.");

                var origin = RequireNonEmpty(Get("origin"), "Origin");
                var destination = RequireNonEmpty(Get("destination"), "Destination");
                var flightDate = ParseDate(RequireNonEmpty(Get("flightdate"), "FlightDate"), "FlightDate");
                var arrivalDate = ParseDate(RequireNonEmpty(Get("arrivaldate"), "ArrivalDate"), "ArrivalDate");
                var pieces = ParseInt(RequireNonEmpty(Get("pieces"), "Pieces"), "Pieces");
                var weight = ParseDecimal(RequireNonEmpty(Get("weight"), "Weight"), "Weight");

                var breakdown = ParseBreakdownStatus(Get("breakdownstatus"));
                var customs = ParseCustomsStatus(Get("customsstatus"));
                var freeTimeRaw = Get("freetimedays");
                var freeTime = string.IsNullOrWhiteSpace(freeTimeRaw) ? 0 : ParseInt(freeTimeRaw, "FreeTimeDays");
                var ready = ParseBool(Get("readytopickup"));

                validCargo.Add(new Domain.Entities.Cargo
                {
                    AwbNumber = awb,
                    Origin = origin,
                    Destination = destination,
                    FlightDate = flightDate,
                    ArrivalDate = arrivalDate,
                    ArrivalTime = string.Empty,
                    BreakdownStatus = breakdown,
                    CustomsStatus = customs,
                    StorageStartDate = arrivalDate,
                    FreeTimeDays = freeTime,
                    Pieces = pieces,
                    Weight = weight,
                    Description = string.Empty,
                    Consignee = string.Empty,
                    ReadyToPickup = ready
                });
            }
            catch (Exception ex)
            {
                errors.Add(new CargoUploadErrorDto
                {
                    Row = rowNumber,
                    Awb = string.IsNullOrWhiteSpace(awb) ? null : awb,
                    Reason = ex.Message
                });
            }
        }

        // Persist valid rows in a single batch (single SaveChanges = single transaction).
        if (validCargo.Count > 0)
        {
            try
            {
                _db.Cargo.AddRange(validCargo);
                await _db.SaveChangesAsync();
            }
            catch (Exception ex)
            {
                // Roll back the in-memory tracker and mark the whole upload failed.
                foreach (var c in validCargo) _db.Entry(c).State = EntityState.Detached;

                upload.Status = UploadStatus.Failed;
                upload.RecordCount = 0;
                upload.ErrorMessage = $"Database insert failed: {ex.Message}";
                await _db.SaveChangesAsync();

                await _audit.LogAsync(userId, "DataUpload", "Cargo", null,
                    $"fileName={fileName}, dbError={ex.Message}");

                result.Status = "Failed";
                result.RecordCount = 0;
                result.SuccessCount = 0;
                result.ErrorCount = rows.Count;
                result.Errors.Add(new CargoUploadErrorDto { Row = 0, Reason = $"Database insert failed: {ex.Message}" });
                return result;
            }
        }

        var successCount = validCargo.Count;
        var errorCount = errors.Count;
        var status = (errorCount, successCount) switch
        {
            (0, _) when successCount > 0 => UploadStatus.Completed,
            ( > 0, 0) => UploadStatus.Failed,
            ( > 0, > 0) => UploadStatus.PartialSuccess,
            _ => UploadStatus.Completed // empty file (no data rows)
        };

        upload.Status = status;
        upload.RecordCount = successCount;
        if (errors.Count > 0)
        {
            // Keep the message bounded — first 10 errors is enough for ops triage.
            var preview = errors.Take(10).Select(e =>
                $"row {e.Row}{(e.Awb != null ? $" (AWB {e.Awb})" : "")}: {e.Reason}");
            upload.ErrorMessage = string.Join(" | ", preview);
            if (errors.Count > 10)
                upload.ErrorMessage += $" | ... and {errors.Count - 10} more";
        }
        else
        {
            upload.ErrorMessage = null;
        }
        await _db.SaveChangesAsync();

        await _audit.LogAsync(userId, "DataUpload", "Cargo", null,
            $"fileName={fileName}, success={successCount}, errors={errorCount}, status={status}");

        result.Status = status.ToString();
        result.RecordCount = successCount;
        result.SuccessCount = successCount;
        result.ErrorCount = errorCount;
        // Cap returned errors to keep the response payload small.
        result.Errors = errors.Take(50).ToList();
        return result;
    }

    // ---------------------------------------------------------------------
    // Upload helpers — file readers
    // ---------------------------------------------------------------------

    private static (List<string> headers, List<List<string>> rows) ReadExcelRows(Stream fileStream)
    {
        using var workbook = new XLWorkbook(fileStream);
        var ws = workbook.Worksheets.First();
        var used = ws.RangeUsed();
        if (used == null)
            return (new List<string>(), new List<List<string>>());

        var rows = used.RowsUsed().ToList();
        if (rows.Count == 0)
            return (new List<string>(), new List<List<string>>());

        var firstRow = rows[0];
        var colCount = firstRow.CellCount();
        var headers = new List<string>(colCount);
        for (var c = 1; c <= colCount; c++)
            headers.Add(firstRow.Cell(c).GetString().Trim());

        var dataRows = new List<List<string>>(rows.Count - 1);
        for (var i = 1; i < rows.Count; i++)
        {
            var r = rows[i];
            var cells = new List<string>(colCount);
            for (var c = 1; c <= colCount; c++)
            {
                var cell = r.Cell(c);
                // Preserve dates as ISO so downstream parsers handle them uniformly.
                if (cell.DataType == XLDataType.DateTime && cell.TryGetValue<DateTime>(out var dt))
                    cells.Add(dt.ToString("yyyy-MM-dd"));
                else
                    cells.Add(cell.GetString().Trim());
            }
            dataRows.Add(cells);
        }
        return (headers, dataRows);
    }

    private static (List<string> headers, List<List<string>> rows) ReadCsvRows(Stream fileStream)
    {
        using var reader = new StreamReader(fileStream);
        var lines = new List<string>();
        string? line;
        while ((line = reader.ReadLine()) != null)
            lines.Add(line);

        // Drop trailing blank lines but keep blanks in middle (caller skips all-empty rows).
        while (lines.Count > 0 && string.IsNullOrWhiteSpace(lines[^1]))
            lines.RemoveAt(lines.Count - 1);

        if (lines.Count == 0) return (new List<string>(), new List<List<string>>());

        var headers = SplitCsvLine(lines[0]).Select(h => h.Trim()).ToList();
        var data = new List<List<string>>(Math.Max(0, lines.Count - 1));
        for (var i = 1; i < lines.Count; i++)
            data.Add(SplitCsvLine(lines[i]));
        return (headers, data);
    }

    /// <summary>
    /// Minimal RFC-4180-ish splitter: handles quoted fields containing commas
    /// and "" escape sequences. No multi-line field support (sufficient for our schema).
    /// </summary>
    private static List<string> SplitCsvLine(string line)
    {
        var fields = new List<string>();
        var sb = new System.Text.StringBuilder();
        var inQuotes = false;
        for (var i = 0; i < line.Length; i++)
        {
            var ch = line[i];
            if (inQuotes)
            {
                if (ch == '"')
                {
                    if (i + 1 < line.Length && line[i + 1] == '"')
                    {
                        sb.Append('"');
                        i++;
                    }
                    else
                    {
                        inQuotes = false;
                    }
                }
                else
                {
                    sb.Append(ch);
                }
            }
            else
            {
                if (ch == ',')
                {
                    fields.Add(sb.ToString());
                    sb.Clear();
                }
                else if (ch == '"' && sb.Length == 0)
                {
                    inQuotes = true;
                }
                else
                {
                    sb.Append(ch);
                }
            }
        }
        fields.Add(sb.ToString());
        return fields;
    }

    /// <summary>
    /// Build a normalized header lookup. Keys are lowercase with spaces/underscores stripped.
    /// Aliases are folded onto the canonical key (e.g. "AWB", "AWB Number" → "awbnumber").
    /// </summary>
    private static Dictionary<string, int> BuildHeaderMap(List<string> headers)
    {
        var map = new Dictionary<string, int>(StringComparer.OrdinalIgnoreCase);
        for (var i = 0; i < headers.Count; i++)
        {
            var raw = headers[i] ?? string.Empty;
            var key = NormalizeHeader(raw);
            if (string.IsNullOrEmpty(key)) continue;

            // Canonical aliases.
            var canonical = key switch
            {
                "awb" => "awbnumber",
                "awbno" => "awbnumber",
                "airwaybill" => "awbnumber",
                "airwaybillnumber" => "awbnumber",
                "from" => "origin",
                "to" => "destination",
                "qty" => "pieces",
                "quantity" => "pieces",
                "weightlbs" => "weight",
                "ready" => "readytopickup",
                "readyforpickup" => "readytopickup",
                _ => key
            };

            // First occurrence wins so duplicate header names don't override.
            map.TryAdd(canonical, i);
        }
        return map;
    }

    private static string NormalizeHeader(string s)
    {
        var sb = new System.Text.StringBuilder(s.Length);
        foreach (var ch in s)
        {
            if (char.IsLetterOrDigit(ch))
                sb.Append(char.ToLowerInvariant(ch));
        }
        return sb.ToString();
    }

    // ---------------------------------------------------------------------
    // Upload helpers — value parsers
    // ---------------------------------------------------------------------

    private static string RequireNonEmpty(string value, string fieldName)
    {
        if (string.IsNullOrWhiteSpace(value))
            throw new FormatException($"{fieldName} is required.");
        return value;
    }

    private static DateTime ParseDate(string value, string fieldName)
    {
        // Try common US + ISO formats; fall back to invariant general parsing.
        var formats = new[]
        {
            "yyyy-MM-dd", "yyyy-MM-ddTHH:mm:ss", "yyyy-MM-dd HH:mm:ss",
            "MM/dd/yyyy", "M/d/yyyy", "MM-dd-yyyy",
            "yyyy/MM/dd", "dd-MMM-yyyy"
        };
        if (DateTime.TryParseExact(value, formats, System.Globalization.CultureInfo.InvariantCulture,
                System.Globalization.DateTimeStyles.AssumeUniversal | System.Globalization.DateTimeStyles.AdjustToUniversal,
                out var exact))
            return DateTime.SpecifyKind(exact, DateTimeKind.Utc);
        if (DateTime.TryParse(value, System.Globalization.CultureInfo.InvariantCulture,
                System.Globalization.DateTimeStyles.AssumeUniversal | System.Globalization.DateTimeStyles.AdjustToUniversal,
                out var any))
            return DateTime.SpecifyKind(any, DateTimeKind.Utc);
        throw new FormatException($"{fieldName} '{value}' is not a recognized date.");
    }

    private static int ParseInt(string value, string fieldName)
    {
        if (int.TryParse(value, System.Globalization.NumberStyles.Integer, System.Globalization.CultureInfo.InvariantCulture, out var i))
            return i;
        throw new FormatException($"{fieldName} '{value}' is not a valid integer.");
    }

    private static decimal ParseDecimal(string value, string fieldName)
    {
        // Strip thousand separators that Excel sometimes writes when GetString() is used.
        var cleaned = value.Replace(",", string.Empty);
        if (decimal.TryParse(cleaned, System.Globalization.NumberStyles.Float, System.Globalization.CultureInfo.InvariantCulture, out var d))
            return d;
        throw new FormatException($"{fieldName} '{value}' is not a valid number.");
    }

    private static bool ParseBool(string value)
    {
        if (string.IsNullOrWhiteSpace(value)) return false;
        var v = value.Trim().ToLowerInvariant();
        return v switch
        {
            "true" or "yes" or "y" or "1" => true,
            "false" or "no" or "n" or "0" or "" => false,
            _ => false
        };
    }

    private static BreakdownStatus ParseBreakdownStatus(string value)
    {
        if (string.IsNullOrWhiteSpace(value)) return BreakdownStatus.InProgress;
        var normalized = value.Replace(" ", string.Empty);
        if (Enum.TryParse<BreakdownStatus>(normalized, ignoreCase: true, out var parsed))
            return parsed;
        // Tolerate the synonyms the spec mentions even though the enum doesn't define them.
        return normalized.ToLowerInvariant() switch
        {
            "pending" or "hold" or "onhold" => BreakdownStatus.InProgress,
            "complete" or "done" or "finished" => BreakdownStatus.Completed,
            _ => throw new FormatException($"Invalid BreakdownStatus '{value}'. Allowed: InProgress, Completed.")
        };
    }

    private static CustomsStatus ParseCustomsStatus(string value)
    {
        if (string.IsNullOrWhiteSpace(value)) return CustomsStatus.PNF;
        var normalized = value.Replace(" ", string.Empty);
        if (Enum.TryParse<CustomsStatus>(normalized, ignoreCase: true, out var parsed))
            return parsed;
        return normalized.ToLowerInvariant() switch
        {
            "pending" or "notfiled" => CustomsStatus.PNF,
            "cleared" or "clear" => CustomsStatus.Released,
            _ => throw new FormatException($"Invalid CustomsStatus '{value}'. Allowed: PNF, Hold, Released.")
        };
    }
}
