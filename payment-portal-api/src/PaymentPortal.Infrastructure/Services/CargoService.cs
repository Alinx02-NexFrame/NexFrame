using AutoMapper;
using Microsoft.EntityFrameworkCore;
using PaymentPortal.Application.DTOs.Cargo;
using PaymentPortal.Application.Exceptions;
using PaymentPortal.Application.Interfaces;
using PaymentPortal.Domain.Enums;
using PaymentPortal.Infrastructure.Data;

namespace PaymentPortal.Infrastructure.Services;

public class CargoService : ICargoService
{
    private readonly AppDbContext _db;
    private readonly IMapper _mapper;
    private readonly IAuditLogService _audit;

    public CargoService(AppDbContext db, IMapper mapper, IAuditLogService audit)
    {
        _db = db;
        _mapper = mapper;
        _audit = audit;
    }

    public async Task<CargoDto?> SearchByAwbAsync(string awbNumber)
    {
        var cargo = await _db.Cargo.FirstOrDefaultAsync(c => c.AwbNumber == awbNumber);
        return cargo == null ? null : _mapper.Map<CargoDto>(cargo);
    }

    public async Task<CargoDto> CreateAsync(CargoCreateDto dto, int? actingUserId)
    {
        var exists = await _db.Cargo.AnyAsync(c => c.AwbNumber == dto.AwbNumber);
        if (exists)
            throw new ConflictException($"Cargo with AWB number \"{dto.AwbNumber}\" already exists.");

        var cargo = new Domain.Entities.Cargo
        {
            AwbNumber = dto.AwbNumber,
            Origin = dto.Origin,
            Destination = dto.Destination,
            FlightDate = dto.FlightDate,
            ArrivalDate = dto.ArrivalDate,
            ArrivalTime = dto.ArrivalTime,
            BreakdownStatus = ParseBreakdownStatus(dto.BreakdownStatus),
            CustomsStatus = ParseCustomsStatus(dto.CustomsStatus),
            StorageStartDate = dto.StorageStartDate,
            FreeTimeDays = dto.FreeTimeDays,
            Pieces = dto.Pieces,
            Weight = dto.Weight,
            Description = dto.Description,
            Consignee = dto.Consignee,
            ReadyToPickup = dto.ReadyToPickup
        };

        _db.Cargo.Add(cargo);
        await _db.SaveChangesAsync();

        await _audit.LogAsync(
            actingUserId,
            action: "CargoCreate",
            entityType: "Cargo",
            entityId: cargo.AwbNumber,
            details: $"origin={cargo.Origin}, dest={cargo.Destination}");

        return _mapper.Map<CargoDto>(cargo);
    }

    public async Task<CargoDto> UpdateAsync(string awbNumber, CargoUpdateDto dto, int? actingUserId)
    {
        var cargo = await _db.Cargo.FirstOrDefaultAsync(c => c.AwbNumber == awbNumber)
            ?? throw new KeyNotFoundException($"Cargo with AWB number \"{awbNumber}\" was not found.");

        cargo.Origin = dto.Origin;
        cargo.Destination = dto.Destination;
        cargo.FlightDate = dto.FlightDate;
        cargo.ArrivalDate = dto.ArrivalDate;
        cargo.ArrivalTime = dto.ArrivalTime;
        cargo.BreakdownStatus = ParseBreakdownStatus(dto.BreakdownStatus);
        cargo.CustomsStatus = ParseCustomsStatus(dto.CustomsStatus);
        cargo.StorageStartDate = dto.StorageStartDate;
        cargo.FreeTimeDays = dto.FreeTimeDays;
        cargo.Pieces = dto.Pieces;
        cargo.Weight = dto.Weight;
        cargo.Description = dto.Description;
        cargo.Consignee = dto.Consignee;
        cargo.ReadyToPickup = dto.ReadyToPickup;

        await _db.SaveChangesAsync();

        await _audit.LogAsync(
            actingUserId,
            action: "CargoUpdate",
            entityType: "Cargo",
            entityId: cargo.AwbNumber,
            details: $"origin={cargo.Origin}, dest={cargo.Destination}");

        return _mapper.Map<CargoDto>(cargo);
    }

    public async Task DeleteAsync(string awbNumber, int? actingUserId)
    {
        var cargo = await _db.Cargo.FirstOrDefaultAsync(c => c.AwbNumber == awbNumber)
            ?? throw new KeyNotFoundException($"Cargo with AWB number \"{awbNumber}\" was not found.");

        // Block deletion if dependent records exist (BillingRecord on CargoId, Payment on CargoId or AwbNumber).
        var hasBilling = await _db.BillingRecords.AnyAsync(b => b.CargoId == cargo.Id);
        var hasPayment = await _db.Payments.AnyAsync(p => p.CargoId == cargo.Id || p.AwbNumber == cargo.AwbNumber);
        if (hasBilling || hasPayment)
        {
            throw new ConflictException(
                $"Cannot delete cargo \"{awbNumber}\" because related billing or payment records exist.");
        }

        _db.Cargo.Remove(cargo);
        await _db.SaveChangesAsync();

        await _audit.LogAsync(
            actingUserId,
            action: "CargoDelete",
            entityType: "Cargo",
            entityId: cargo.AwbNumber,
            details: $"origin={cargo.Origin}, dest={cargo.Destination}");
    }

    private static BreakdownStatus ParseBreakdownStatus(string value)
    {
        // Accept both "InProgress" and the display form "In Progress".
        var normalized = value.Replace(" ", string.Empty);
        if (Enum.TryParse<BreakdownStatus>(normalized, ignoreCase: true, out var parsed))
            return parsed;
        throw new ArgumentException($"Invalid BreakdownStatus value: {value}");
    }

    private static CustomsStatus ParseCustomsStatus(string value)
    {
        if (Enum.TryParse<CustomsStatus>(value, ignoreCase: true, out var parsed))
            return parsed;
        throw new ArgumentException($"Invalid CustomsStatus value: {value}");
    }
}
