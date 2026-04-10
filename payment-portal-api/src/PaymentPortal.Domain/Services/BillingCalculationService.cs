using PaymentPortal.Domain.Entities;
using PaymentPortal.Domain.Enums;

namespace PaymentPortal.Domain.Services;

public class BillingCalculationService
{
    private const decimal ServiceFee = 250.00m;
    private const decimal StorageRatePerDay = 50.00m;
    private const decimal HoldCharge = 150.00m;
    private const decimal ProcessingFeeRate = 0.025m; // 2.5%

    public BillingRecord Calculate(Cargo cargo, DateTime? asOfDate = null)
    {
        var today = asOfDate ?? DateTime.UtcNow.Date;
        var arrivalDate = cargo.StorageStartDate.Date;

        var totalDays = (int)Math.Floor((today - arrivalDate).TotalDays);
        var chargeableDays = Math.Max(0, totalDays - cargo.FreeTimeDays);

        var storageFee = chargeableDays > 0
            ? chargeableDays * StorageRatePerDay * (cargo.Weight / 1000m)
            : 0m;

        var otherCharge = cargo.CustomsStatus == CustomsStatus.Hold ? HoldCharge : 0m;

        var subtotal = ServiceFee + storageFee + otherCharge;
        var processingFee = subtotal * ProcessingFeeRate;
        var total = subtotal + processingFee;

        return new BillingRecord
        {
            CargoId = cargo.Id,
            ServiceFee = Math.Round(ServiceFee, 2),
            StorageFee = Math.Round(storageFee, 2),
            OtherCharge = Math.Round(otherCharge, 2),
            Subtotal = Math.Round(subtotal, 2),
            ProcessingFee = Math.Round(processingFee, 2),
            Total = Math.Round(total, 2),
            DueDate = today.AddDays(7),
            Status = BillingStatus.Pending
        };
    }
}
