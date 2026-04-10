using PaymentPortal.Domain.Entities;
using PaymentPortal.Domain.Enums;
using PaymentPortal.Domain.Services;

namespace PaymentPortal.Tests;

public class BillingCalculationServiceTests
{
    private readonly BillingCalculationService _sut = new();

    /// <summary>
    /// AWB 020-12345678: Released, arrived 2026-01-08, freeTime=3, weight=1250.5
    /// As of 2026-01-09 (1 day stored, within free time) → storageFee = 0
    /// serviceFee = 250, otherCharge = 0 (Released), subtotal = 250
    /// processingFee = 250 * 0.025 = 6.25, total = 256.25
    /// </summary>
    [Fact]
    public void Calculate_ReleasedCargo_WithinFreeTime_NoStorageFee()
    {
        var cargo = CreateCargo("020-12345678", CustomsStatus.Released, new DateTime(2026, 1, 8), 3, 1250.5m);
        var asOf = new DateTime(2026, 1, 9);

        var result = _sut.Calculate(cargo, asOf);

        Assert.Equal(250.00m, result.ServiceFee);
        Assert.Equal(0m, result.StorageFee);
        Assert.Equal(0m, result.OtherCharge);
        Assert.Equal(250.00m, result.Subtotal);
        Assert.Equal(6.25m, result.ProcessingFee);
        Assert.Equal(256.25m, result.Total);
    }

    /// <summary>
    /// AWB 020-87654321: Hold, arrived 2026-01-07, freeTime=3, weight=3500
    /// As of 2026-01-09 (2 days stored, within free time) → storageFee = 0
    /// But Hold → otherCharge = 150
    /// subtotal = 250 + 0 + 150 = 400, processingFee = 10, total = 410
    /// </summary>
    [Fact]
    public void Calculate_HoldCargo_AddsOtherCharge()
    {
        var cargo = CreateCargo("020-87654321", CustomsStatus.Hold, new DateTime(2026, 1, 7), 3, 3500.0m);
        var asOf = new DateTime(2026, 1, 9);

        var result = _sut.Calculate(cargo, asOf);

        Assert.Equal(250.00m, result.ServiceFee);
        Assert.Equal(0m, result.StorageFee);
        Assert.Equal(150.00m, result.OtherCharge);
        Assert.Equal(400.00m, result.Subtotal);
        Assert.Equal(10.00m, result.ProcessingFee);
        Assert.Equal(410.00m, result.Total);
    }

    /// <summary>
    /// Cargo stored beyond free time should incur storage fees.
    /// Arrived 2026-01-01, freeTime=3, weight=2000, asOf = 2026-01-09 (8 days total, 5 chargeable)
    /// storageFee = 5 * 50 * (2000/1000) = 500
    /// </summary>
    [Fact]
    public void Calculate_BeyondFreeTime_ChargesStorageFee()
    {
        var cargo = CreateCargo("020-99999999", CustomsStatus.Released, new DateTime(2026, 1, 1), 3, 2000.0m);
        var asOf = new DateTime(2026, 1, 9);

        var result = _sut.Calculate(cargo, asOf);

        Assert.Equal(250.00m, result.ServiceFee);
        Assert.Equal(500.00m, result.StorageFee);
        Assert.Equal(0m, result.OtherCharge);
        Assert.Equal(750.00m, result.Subtotal);
        Assert.Equal(18.75m, result.ProcessingFee);
        Assert.Equal(768.75m, result.Total);
    }

    /// <summary>
    /// AWB 020-11223344: PNF, arrived 2026-01-09, freeTime=5, weight=2100
    /// As of 2026-01-09 (0 days) → storageFee = 0, otherCharge = 0 (PNF)
    /// </summary>
    [Fact]
    public void Calculate_PnfCargo_SameDayArrival()
    {
        var cargo = CreateCargo("020-11223344", CustomsStatus.PNF, new DateTime(2026, 1, 9), 5, 2100.0m);
        var asOf = new DateTime(2026, 1, 9);

        var result = _sut.Calculate(cargo, asOf);

        Assert.Equal(250.00m, result.ServiceFee);
        Assert.Equal(0m, result.StorageFee);
        Assert.Equal(0m, result.OtherCharge);
        Assert.Equal(250.00m, result.Subtotal);
        Assert.Equal(6.25m, result.ProcessingFee);
        Assert.Equal(256.25m, result.Total);
    }

    [Fact]
    public void Calculate_DueDate_Is7DaysFromAsOfDate()
    {
        var cargo = CreateCargo("020-00000000", CustomsStatus.Released, new DateTime(2026, 1, 1), 3, 1000m);
        var asOf = new DateTime(2026, 1, 10);

        var result = _sut.Calculate(cargo, asOf);

        Assert.Equal(new DateTime(2026, 1, 17), result.DueDate);
    }

    private static Cargo CreateCargo(string awb, CustomsStatus customs, DateTime storageStart, int freeTimeDays, decimal weight) => new()
    {
        Id = 1,
        AwbNumber = awb,
        Origin = "TEST",
        Destination = "TEST",
        ArrivalDate = storageStart,
        ArrivalTime = "12:00",
        BreakdownStatus = BreakdownStatus.Completed,
        CustomsStatus = customs,
        StorageStartDate = storageStart,
        FreeTimeDays = freeTimeDays,
        Pieces = 10,
        Weight = weight,
        Description = "Test"
    };
}
