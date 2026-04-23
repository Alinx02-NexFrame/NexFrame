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
        // SQLite cannot aggregate decimal on the DB side, so materialize first.
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
        // SQLite cannot aggregate decimal on the DB side, so materialize first
        // and group in memory.
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
