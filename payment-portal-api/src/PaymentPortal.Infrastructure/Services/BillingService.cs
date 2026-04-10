using AutoMapper;
using Microsoft.EntityFrameworkCore;
using PaymentPortal.Application.DTOs.Billing;
using PaymentPortal.Application.Interfaces;
using PaymentPortal.Domain.Services;
using PaymentPortal.Infrastructure.Data;

namespace PaymentPortal.Infrastructure.Services;

public class BillingService : IBillingService
{
    private readonly AppDbContext _db;
    private readonly BillingCalculationService _calc;
    private readonly IMapper _mapper;

    public BillingService(AppDbContext db, BillingCalculationService calc, IMapper mapper)
    {
        _db = db;
        _calc = calc;
        _mapper = mapper;
    }

    public async Task<BillingDto?> GetBillingByAwbAsync(string awbNumber)
    {
        var cargo = await _db.Cargo
            .Include(c => c.BillingRecord)
            .FirstOrDefaultAsync(c => c.AwbNumber == awbNumber);

        if (cargo == null) return null;

        // Always recalculate with current date
        var billing = _calc.Calculate(cargo);
        billing.Cargo = cargo;

        return _mapper.Map<BillingDto>(billing);
    }
}
