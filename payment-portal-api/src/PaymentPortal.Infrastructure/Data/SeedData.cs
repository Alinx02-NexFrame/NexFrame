using Microsoft.EntityFrameworkCore;
using PaymentPortal.Domain.Entities;
using PaymentPortal.Domain.Enums;

namespace PaymentPortal.Infrastructure.Data;

public static class SeedData
{
    public static async Task InitializeAsync(AppDbContext context)
    {
        if (await context.Cargo.AnyAsync())
            return;

        // 1. Companies
        var globalFreight = new Company { Name = "Global Freight Solutions", Email = "contact@globalfreight.com", TaxId = "12-3456789", AccountCredit = 100000.00m };
        var pacificLog = new Company { Name = "Pacific Logistics Inc.", Email = "info@pacificlog.com", TaxId = "98-7654321", AccountCredit = 100000.00m };
        var expressAir = new Company { Name = "Express Air Cargo", Email = "support@expressair.com", TaxId = "55-1234567", AccountCredit = 100000.00m };
        var playwrightCo = new Company { Name = "Playwright Co.", Email = "contact@playwrite.test", TaxId = "00-0000001", AccountCredit = 100000.00m };
        context.Companies.AddRange(globalFreight, pacificLog, expressAir, playwrightCo);
        await context.SaveChangesAsync();

        // 2. Users (password: "1234")
        var passwordHash = BCrypt.Net.BCrypt.HashPassword("1234");
        var admin = new User { Username = "admin", Email = "admin@gha.com", PasswordHash = passwordHash, FullName = "GHA Administrator", Role = UserRole.GhaAdmin, IsActive = true };
        var john = new User { Username = "john", Email = "john@globalfreight.com", PasswordHash = passwordHash, FullName = "John Smith", Role = UserRole.Forwarder, Company = globalFreight, CompanyRole = Domain.Enums.CompanyRole.Manager, IsActive = true };
        var jane = new User { Username = "jane", Email = "jane@pacificlog.com", PasswordHash = passwordHash, FullName = "Jane Doe", Role = UserRole.Forwarder, Company = pacificLog, CompanyRole = Domain.Enums.CompanyRole.Admin, IsActive = true };
        var mike = new User { Username = "mike", Email = "mike@expressair.com", PasswordHash = passwordHash, FullName = "Mike Johnson", Role = UserRole.Forwarder, Company = expressAir, CompanyRole = Domain.Enums.CompanyRole.Manager, IsActive = true };
        var playwrite = new User { Username = "playwrite", Email = "playwrite@test.com", PasswordHash = passwordHash, FullName = "Playwright User", Role = UserRole.Forwarder, Company = playwrightCo, CompanyRole = Domain.Enums.CompanyRole.Admin, IsActive = true };
        context.Users.AddRange(admin, john, jane, mike, playwrite);
        await context.SaveChangesAsync();

        // 3. Cargo (26 AWBs, dates: Apr 10 ~ Apr 20, 2026)
        var cargo1 = new Cargo { AwbNumber = "020-12345678", Origin = "ICN (Seoul, Korea)", Destination = "LAX (Los Angeles, USA)", FlightDate = new DateTime(2026, 4, 10), ArrivalDate = new DateTime(2026, 4, 10), ArrivalTime = "14:30", BreakdownStatus = BreakdownStatus.Completed, CustomsStatus = CustomsStatus.Released, StorageStartDate = new DateTime(2026, 4, 10), FreeTimeDays = 3, Pieces = 45, Weight = 1250.5m, Description = "Electronic Components", Consignee = "Tech Solutions Inc.", ReadyToPickup = true };
        var cargo2 = new Cargo { AwbNumber = "020-98765432", Origin = "NRT (Tokyo, Japan)", Destination = "SFO (San Francisco, USA)", FlightDate = new DateTime(2026, 4, 10), ArrivalDate = new DateTime(2026, 4, 10), ArrivalTime = "16:20", BreakdownStatus = BreakdownStatus.Completed, CustomsStatus = CustomsStatus.Released, StorageStartDate = new DateTime(2026, 4, 10), FreeTimeDays = 3, Pieces = 32, Weight = 890.0m, Description = "Medical Equipment", Consignee = "HealthCare Logistics LLC", ReadyToPickup = true };
        var cargo3 = new Cargo { AwbNumber = "020-87654321", Origin = "PVG (Shanghai, China)", Destination = "JFK (New York, USA)", FlightDate = new DateTime(2026, 4, 11), ArrivalDate = new DateTime(2026, 4, 11), ArrivalTime = "09:15", BreakdownStatus = BreakdownStatus.Completed, CustomsStatus = CustomsStatus.Hold, StorageStartDate = new DateTime(2026, 4, 11), FreeTimeDays = 3, Pieces = 120, Weight = 3500.0m, Description = "Textile Products", Consignee = "Fashion Import Co.", ReadyToPickup = false };
        var cargo4 = new Cargo { AwbNumber = "020-11223344", Origin = "HKG (Hong Kong)", Destination = "ORD (Chicago, USA)", FlightDate = new DateTime(2026, 4, 11), ArrivalDate = new DateTime(2026, 4, 11), ArrivalTime = "11:45", BreakdownStatus = BreakdownStatus.InProgress, CustomsStatus = CustomsStatus.PNF, StorageStartDate = new DateTime(2026, 4, 11), FreeTimeDays = 5, Pieces = 80, Weight = 2100.0m, Description = "Auto Parts", Consignee = "Automotive Supply Group", ReadyToPickup = false };
        var cargo5 = new Cargo { AwbNumber = "020-55667788", Origin = "ICN (Seoul, Korea)", Destination = "LAX (Los Angeles, USA)", FlightDate = new DateTime(2026, 4, 12), ArrivalDate = new DateTime(2026, 4, 12), ArrivalTime = "13:15", BreakdownStatus = BreakdownStatus.Completed, CustomsStatus = CustomsStatus.Released, StorageStartDate = new DateTime(2026, 4, 12), FreeTimeDays = 3, Pieces = 25, Weight = 650.0m, Description = "Fashion Accessories", Consignee = "Fashion World Inc.", ReadyToPickup = true };
        var cargo6 = new Cargo { AwbNumber = "020-99887766", Origin = "SIN (Singapore)", Destination = "SEA (Seattle, USA)", FlightDate = new DateTime(2026, 4, 12), ArrivalDate = new DateTime(2026, 4, 12), ArrivalTime = "10:30", BreakdownStatus = BreakdownStatus.Completed, CustomsStatus = CustomsStatus.Released, StorageStartDate = new DateTime(2026, 4, 12), FreeTimeDays = 3, Pieces = 18, Weight = 420.0m, Description = "Computer Hardware", Consignee = "Tech Distribution LLC", ReadyToPickup = true };
        var cargo7 = new Cargo { AwbNumber = "020-44556677", Origin = "BKK (Bangkok, Thailand)", Destination = "MIA (Miami, USA)", FlightDate = new DateTime(2026, 4, 13), ArrivalDate = new DateTime(2026, 4, 13), ArrivalTime = "18:45", BreakdownStatus = BreakdownStatus.Completed, CustomsStatus = CustomsStatus.Released, StorageStartDate = new DateTime(2026, 4, 13), FreeTimeDays = 3, Pieces = 55, Weight = 1380.0m, Description = "Organic Food Products", Consignee = "Global Foods Inc.", ReadyToPickup = true };
        var cargo8 = new Cargo { AwbNumber = "020-22334455", Origin = "DEL (Delhi, India)", Destination = "DFW (Dallas, USA)", FlightDate = new DateTime(2026, 4, 13), ArrivalDate = new DateTime(2026, 4, 13), ArrivalTime = "22:10", BreakdownStatus = BreakdownStatus.Completed, CustomsStatus = CustomsStatus.Released, StorageStartDate = new DateTime(2026, 4, 13), FreeTimeDays = 3, Pieces = 95, Weight = 2450.0m, Description = "Pharmaceutical Products", Consignee = "MedSupply Co.", ReadyToPickup = true };
        var cargo9 = new Cargo { AwbNumber = "020-88776655", Origin = "TPE (Taipei, Taiwan)", Destination = "ATL (Atlanta, USA)", FlightDate = new DateTime(2026, 4, 14), ArrivalDate = new DateTime(2026, 4, 14), ArrivalTime = "15:20", BreakdownStatus = BreakdownStatus.Completed, CustomsStatus = CustomsStatus.Released, StorageStartDate = new DateTime(2026, 4, 14), FreeTimeDays = 3, Pieces = 40, Weight = 980.0m, Description = "Consumer Electronics", Consignee = "Electronics Hub LLC", ReadyToPickup = true };
        var cargo10 = new Cargo { AwbNumber = "020-33445566", Origin = "MNL (Manila, Philippines)", Destination = "LAX (Los Angeles, USA)", FlightDate = new DateTime(2026, 4, 14), ArrivalDate = new DateTime(2026, 4, 14), ArrivalTime = "08:30", BreakdownStatus = BreakdownStatus.Completed, CustomsStatus = CustomsStatus.Released, StorageStartDate = new DateTime(2026, 4, 14), FreeTimeDays = 3, Pieces = 30, Weight = 725.0m, Description = "Handicrafts", Consignee = "Arts & Crafts Import", ReadyToPickup = true };
        var cargo11 = new Cargo { AwbNumber = "020-66778899", Origin = "KUL (Kuala Lumpur, Malaysia)", Destination = "SFO (San Francisco, USA)", FlightDate = new DateTime(2026, 4, 14), ArrivalDate = new DateTime(2026, 4, 14), ArrivalTime = "12:40", BreakdownStatus = BreakdownStatus.Completed, CustomsStatus = CustomsStatus.Released, StorageStartDate = new DateTime(2026, 4, 14), FreeTimeDays = 3, Pieces = 22, Weight = 550.0m, Description = "Rubber Products", Consignee = "Industrial Supplies Inc.", ReadyToPickup = true };
        var cargo12 = new Cargo { AwbNumber = "020-55443322", Origin = "CGK (Jakarta, Indonesia)", Destination = "ORD (Chicago, USA)", FlightDate = new DateTime(2026, 4, 15), ArrivalDate = new DateTime(2026, 4, 15), ArrivalTime = "20:15", BreakdownStatus = BreakdownStatus.InProgress, CustomsStatus = CustomsStatus.PNF, StorageStartDate = new DateTime(2026, 4, 15), FreeTimeDays = 5, Pieces = 68, Weight = 1820.0m, Description = "Furniture Parts", Consignee = "Home Furnishing Co.", ReadyToPickup = false };
        var cargo13 = new Cargo { AwbNumber = "020-77665544", Origin = "HAN (Hanoi, Vietnam)", Destination = "JFK (New York, USA)", FlightDate = new DateTime(2026, 4, 15), ArrivalDate = new DateTime(2026, 4, 15), ArrivalTime = "17:50", BreakdownStatus = BreakdownStatus.Completed, CustomsStatus = CustomsStatus.Released, StorageStartDate = new DateTime(2026, 4, 15), FreeTimeDays = 3, Pieces = 50, Weight = 1150.0m, Description = "Textiles", Consignee = "Fashion Imports LLC", ReadyToPickup = true };
        var cargo14 = new Cargo { AwbNumber = "020-11009988", Origin = "BOM (Mumbai, India)", Destination = "IAH (Houston, USA)", FlightDate = new DateTime(2026, 4, 15), ArrivalDate = new DateTime(2026, 4, 15), ArrivalTime = "19:30", BreakdownStatus = BreakdownStatus.Completed, CustomsStatus = CustomsStatus.Released, StorageStartDate = new DateTime(2026, 4, 15), FreeTimeDays = 3, Pieces = 75, Weight = 1950.0m, Description = "Leather Goods", Consignee = "Luxury Imports Inc.", ReadyToPickup = true };
        var cargo15 = new Cargo { AwbNumber = "020-22119977", Origin = "PEK (Beijing, China)", Destination = "LAX (Los Angeles, USA)", FlightDate = new DateTime(2026, 4, 16), ArrivalDate = new DateTime(2026, 4, 16), ArrivalTime = "11:20", BreakdownStatus = BreakdownStatus.Completed, CustomsStatus = CustomsStatus.Released, StorageStartDate = new DateTime(2026, 4, 16), FreeTimeDays = 3, Pieces = 100, Weight = 2800.0m, Description = "Industrial Machinery", Consignee = "Heavy Equipment Co.", ReadyToPickup = true };
        var cargo16 = new Cargo { AwbNumber = "020-33221166", Origin = "SGN (Ho Chi Minh, Vietnam)", Destination = "SEA (Seattle, USA)", FlightDate = new DateTime(2026, 4, 16), ArrivalDate = new DateTime(2026, 4, 16), ArrivalTime = "14:05", BreakdownStatus = BreakdownStatus.Completed, CustomsStatus = CustomsStatus.Released, StorageStartDate = new DateTime(2026, 4, 16), FreeTimeDays = 3, Pieces = 35, Weight = 880.0m, Description = "Coffee Beans", Consignee = "Coffee Traders LLC", ReadyToPickup = true };
        var cargo17 = new Cargo { AwbNumber = "020-44332255", Origin = "KIX (Osaka, Japan)", Destination = "SFO (San Francisco, USA)", FlightDate = new DateTime(2026, 4, 16), ArrivalDate = new DateTime(2026, 4, 16), ArrivalTime = "10:45", BreakdownStatus = BreakdownStatus.Completed, CustomsStatus = CustomsStatus.Released, StorageStartDate = new DateTime(2026, 4, 16), FreeTimeDays = 3, Pieces = 28, Weight = 630.0m, Description = "Precision Instruments", Consignee = "Scientific Supply Inc.", ReadyToPickup = true };
        var cargo18 = new Cargo { AwbNumber = "020-55446633", Origin = "CAN (Guangzhou, China)", Destination = "MIA (Miami, USA)", FlightDate = new DateTime(2026, 4, 17), ArrivalDate = new DateTime(2026, 4, 17), ArrivalTime = "21:30", BreakdownStatus = BreakdownStatus.Completed, CustomsStatus = CustomsStatus.Hold, StorageStartDate = new DateTime(2026, 4, 17), FreeTimeDays = 3, Pieces = 85, Weight = 2250.0m, Description = "Toys & Games", Consignee = "Kids Products Inc.", ReadyToPickup = false };
        var cargo19 = new Cargo { AwbNumber = "020-66557744", Origin = "BNE (Brisbane, Australia)", Destination = "LAX (Los Angeles, USA)", FlightDate = new DateTime(2026, 4, 17), ArrivalDate = new DateTime(2026, 4, 17), ArrivalTime = "06:15", BreakdownStatus = BreakdownStatus.Completed, CustomsStatus = CustomsStatus.Released, StorageStartDate = new DateTime(2026, 4, 17), FreeTimeDays = 3, Pieces = 15, Weight = 380.0m, Description = "Wine & Spirits", Consignee = "Beverage Imports LLC", ReadyToPickup = true };
        var cargo20 = new Cargo { AwbNumber = "020-77668855", Origin = "AKL (Auckland, New Zealand)", Destination = "SFO (San Francisco, USA)", FlightDate = new DateTime(2026, 4, 18), ArrivalDate = new DateTime(2026, 4, 18), ArrivalTime = "07:50", BreakdownStatus = BreakdownStatus.Completed, CustomsStatus = CustomsStatus.Released, StorageStartDate = new DateTime(2026, 4, 18), FreeTimeDays = 3, Pieces = 20, Weight = 490.0m, Description = "Dairy Products", Consignee = "Food Distributors Inc.", ReadyToPickup = true };
        var cargo21 = new Cargo { AwbNumber = "020-88779966", Origin = "SYD (Sydney, Australia)", Destination = "ORD (Chicago, USA)", FlightDate = new DateTime(2026, 4, 18), ArrivalDate = new DateTime(2026, 4, 18), ArrivalTime = "16:40", BreakdownStatus = BreakdownStatus.Completed, CustomsStatus = CustomsStatus.Released, StorageStartDate = new DateTime(2026, 4, 18), FreeTimeDays = 3, Pieces = 42, Weight = 1050.0m, Description = "Sporting Goods", Consignee = "Sports Equipment Co.", ReadyToPickup = true };
        var cargo22 = new Cargo { AwbNumber = "020-99881122", Origin = "MEL (Melbourne, Australia)", Destination = "DFW (Dallas, USA)", FlightDate = new DateTime(2026, 4, 19), ArrivalDate = new DateTime(2026, 4, 19), ArrivalTime = "19:10", BreakdownStatus = BreakdownStatus.Completed, CustomsStatus = CustomsStatus.Released, StorageStartDate = new DateTime(2026, 4, 19), FreeTimeDays = 3, Pieces = 38, Weight = 920.0m, Description = "Beauty Products", Consignee = "Cosmetics Wholesale LLC", ReadyToPickup = true };
        var cargo23 = new Cargo { AwbNumber = "020-10293847", Origin = "DXB (Dubai, UAE)", Destination = "JFK (New York, USA)", FlightDate = new DateTime(2026, 4, 19), ArrivalDate = new DateTime(2026, 4, 19), ArrivalTime = "05:25", BreakdownStatus = BreakdownStatus.Completed, CustomsStatus = CustomsStatus.Released, StorageStartDate = new DateTime(2026, 4, 19), FreeTimeDays = 3, Pieces = 60, Weight = 1600.0m, Description = "Jewelry", Consignee = "Fine Jewelry Inc.", ReadyToPickup = true };
        var cargo24 = new Cargo { AwbNumber = "020-56473829", Origin = "DOH (Doha, Qatar)", Destination = "IAH (Houston, USA)", FlightDate = new DateTime(2026, 4, 19), ArrivalDate = new DateTime(2026, 4, 19), ArrivalTime = "23:40", BreakdownStatus = BreakdownStatus.Completed, CustomsStatus = CustomsStatus.Released, StorageStartDate = new DateTime(2026, 4, 19), FreeTimeDays = 3, Pieces = 48, Weight = 1180.0m, Description = "Perfumes", Consignee = "Fragrance Imports Co.", ReadyToPickup = true };
        var cargo25 = new Cargo { AwbNumber = "020-91827364", Origin = "IST (Istanbul, Turkey)", Destination = "ATL (Atlanta, USA)", FlightDate = new DateTime(2026, 4, 20), ArrivalDate = new DateTime(2026, 4, 20), ArrivalTime = "12:55", BreakdownStatus = BreakdownStatus.InProgress, CustomsStatus = CustomsStatus.PNF, StorageStartDate = new DateTime(2026, 4, 20), FreeTimeDays = 5, Pieces = 70, Weight = 1890.0m, Description = "Carpets & Rugs", Consignee = "Home Decor Imports", ReadyToPickup = false };
        var cargo26 = new Cargo { AwbNumber = "020-47382910", Origin = "LHR (London, UK)", Destination = "LAX (Los Angeles, USA)", FlightDate = new DateTime(2026, 4, 20), ArrivalDate = new DateTime(2026, 4, 20), ArrivalTime = "15:30", BreakdownStatus = BreakdownStatus.Completed, CustomsStatus = CustomsStatus.Released, StorageStartDate = new DateTime(2026, 4, 20), FreeTimeDays = 3, Pieces = 52, Weight = 1320.0m, Description = "Books & Publications", Consignee = "Educational Materials Inc.", ReadyToPickup = true };
        context.Cargo.AddRange(cargo1, cargo2, cargo3, cargo4, cargo5, cargo6, cargo7, cargo8, cargo9, cargo10, cargo11, cargo12, cargo13, cargo14, cargo15, cargo16, cargo17, cargo18, cargo19, cargo20, cargo21, cargo22, cargo23, cargo24, cargo25, cargo26);
        await context.SaveChangesAsync();

        // 4. BillingRecords for pending payments (from mockPendingPayments)
        context.BillingRecords.AddRange(
            new BillingRecord { Cargo = cargo1, ServiceFee = 250m, StorageFee = 0m, OtherCharge = 0m, Subtotal = 250m, ProcessingFee = 6.25m, Total = 256.25m, DueDate = new DateTime(2026, 3, 12), Status = BillingStatus.Pending },
            new BillingRecord { Cargo = cargo3, ServiceFee = 250m, StorageFee = 0m, OtherCharge = 150m, Subtotal = 400m, ProcessingFee = 10m, Total = 410m, DueDate = new DateTime(2026, 3, 10), Status = BillingStatus.Overdue },
            new BillingRecord { Cargo = cargo5, ServiceFee = 250m, StorageFee = 0m, OtherCharge = 0m, Subtotal = 250m, ProcessingFee = 6.25m, Total = 256.25m, DueDate = new DateTime(2026, 3, 15), Status = BillingStatus.Pending }
        );
        await context.SaveChangesAsync();

        // Cargo ownership: completed payments establish Company ownership.
        cargo6.Company = globalFreight;
        cargo7.Company = pacificLog;
        cargo10.Company = expressAir;
        cargo8.Company = globalFreight;

        // 5. Completed Payments (from mockCompletedPayments)
        context.Payments.AddRange(
            new Payment { ConfirmationNumber = "PMT-2026030801", AwbNumber = "020-99887766", Amount = 456.25m, ProcessingFee = 11.41m, PaymentMethod = PaymentMethod.CreditCard, PaymentStatus = PaymentStatus.Completed, Email = "john@globalfreight.com", User = john, Company = globalFreight, Cargo = cargo6, PaymentDate = new DateTime(2026, 3, 8, 10, 30, 0) },
            new Payment { ConfirmationNumber = "PMT-2026030701", AwbNumber = "020-44556677", Amount = 678.90m, ProcessingFee = 16.97m, PaymentMethod = PaymentMethod.ACH, PaymentStatus = PaymentStatus.Completed, Email = "jane@pacificlog.com", User = jane, Company = pacificLog, Cargo = cargo7, PaymentDate = new DateTime(2026, 3, 7, 14, 15, 0) },
            new Payment { ConfirmationNumber = "PMT-2026030601", AwbNumber = "020-33445566", Amount = 321.50m, ProcessingFee = 8.04m, PaymentMethod = PaymentMethod.CreditCard, PaymentStatus = PaymentStatus.Completed, Email = "mike@expressair.com", User = mike, Company = expressAir, Cargo = cargo10, PaymentDate = new DateTime(2026, 3, 6, 9, 0, 0) },
            new Payment { ConfirmationNumber = "PMT-2026030501", AwbNumber = "020-22334455", Amount = 892.00m, ProcessingFee = 22.30m, PaymentMethod = PaymentMethod.InternationalWire, PaymentStatus = PaymentStatus.Completed, Email = "john@globalfreight.com", User = john, Company = globalFreight, Cargo = cargo8, PaymentDate = new DateTime(2026, 3, 5, 11, 45, 0) }
        );
        await context.SaveChangesAsync();

        // 6. Watchlist for john (from watchlistState.ts - all 25 AWBs)
        var watchlist = new Watchlist { Company = globalFreight, CreatedAt = DateTime.UtcNow };
        context.Watchlists.Add(watchlist);
        await context.SaveChangesAsync();

        var watchlistAwbs = new[]
        {
            "020-12345678", "020-98765432", "020-11223344", "020-55667788",
            "020-99887766", "020-44556677", "020-22334455", "020-88776655",
            "020-33445566", "020-66778899", "020-55443322", "020-77665544",
            "020-11009988", "020-22119977", "020-33221166", "020-44332255",
            "020-55446633", "020-66557744", "020-77668855", "020-88779966",
            "020-99881122", "020-10293847", "020-56473829", "020-91827364",
            "020-47382910"
        };
        foreach (var awb in watchlistAwbs)
        {
            context.WatchlistItems.Add(new WatchlistItem { Watchlist = watchlist, AwbNumber = awb, AddedAt = DateTime.UtcNow });
        }
        await context.SaveChangesAsync();
    }
}
