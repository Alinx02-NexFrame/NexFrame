using AutoMapper;
using Microsoft.EntityFrameworkCore;
using PaymentPortal.Application.DTOs.Cargo;
using PaymentPortal.Application.Interfaces;
using PaymentPortal.Infrastructure.Data;

namespace PaymentPortal.Infrastructure.Services;

public class CargoService : ICargoService
{
    private readonly AppDbContext _db;
    private readonly IMapper _mapper;

    public CargoService(AppDbContext db, IMapper mapper)
    {
        _db = db;
        _mapper = mapper;
    }

    public async Task<CargoDto?> SearchByAwbAsync(string awbNumber)
    {
        var cargo = await _db.Cargo.FirstOrDefaultAsync(c => c.AwbNumber == awbNumber);
        return cargo == null ? null : _mapper.Map<CargoDto>(cargo);
    }
}
