using AutoMapper;
using PaymentPortal.Application.DTOs.Auth;
using PaymentPortal.Application.DTOs.Billing;
using PaymentPortal.Application.DTOs.Cargo;
using PaymentPortal.Application.DTOs.Forwarder;
using PaymentPortal.Application.DTOs.GHA;
using PaymentPortal.Application.DTOs.Payment;
using PaymentPortal.Domain.Entities;
using PaymentPortal.Domain.Enums;

namespace PaymentPortal.Application.Mappings;

public class MappingProfile : Profile
{
    public MappingProfile()
    {
        // Cargo
        CreateMap<Domain.Entities.Cargo, CargoDto>()
            .ForMember(d => d.FlightDate, o => o.MapFrom(s => s.FlightDate.ToString("yyyy-MM-dd")))
            .ForMember(d => d.ArrivalDate, o => o.MapFrom(s => s.ArrivalDate.ToString("yyyy-MM-dd")))
            .ForMember(d => d.StorageStartDate, o => o.MapFrom(s => s.StorageStartDate.ToString("yyyy-MM-dd")))
            .ForMember(d => d.BreakdownStatus, o => o.MapFrom(s => FormatBreakdownStatus(s.BreakdownStatus)))
            .ForMember(d => d.CustomsStatus, o => o.MapFrom(s => s.CustomsStatus.ToString()));

        // BillingRecord -> BillingDto
        CreateMap<BillingRecord, BillingDto>()
            .ForMember(d => d.AwbNumber, o => o.MapFrom(s => s.Cargo.AwbNumber));

        // Payment -> PaymentConfirmationDto
        CreateMap<Domain.Entities.Payment, PaymentConfirmationDto>()
            .ForMember(d => d.PaymentDate, o => o.MapFrom(s => s.PaymentDate.ToString("yyyy-MM-dd HH:mm")))
            .ForMember(d => d.PaymentMethod, o => o.MapFrom(s => FormatPaymentMethod(s.PaymentMethod)));

        // Payment -> CompletedPaymentDto
        CreateMap<Domain.Entities.Payment, CompletedPaymentDto>()
            .ForMember(d => d.Id, o => o.MapFrom(s => s.ConfirmationNumber))
            .ForMember(d => d.PaymentDate, o => o.MapFrom(s => s.PaymentDate.ToString("yyyy-MM-dd")))
            .ForMember(d => d.ReceiptUrl, o => o.MapFrom(s => $"/api/payments/{s.ConfirmationNumber}/receipt"));

        // User -> UserDto
        CreateMap<User, UserDto>()
            .ForMember(d => d.CompanyName, o => o.MapFrom(s => s.Company != null ? s.Company.Name : ""))
            .ForMember(d => d.Role, o => o.MapFrom(s => s.Role == UserRole.Forwarder ? "forwarder" : "gha_admin"));

        // User -> CompanyUserDto
        CreateMap<User, CompanyUserDto>();

        // WatchlistItem -> WatchlistItemDto
        CreateMap<WatchlistItem, WatchlistItemDto>()
            .ForMember(d => d.AddedAt, o => o.MapFrom(s => s.AddedAt.ToString("yyyy-MM-dd HH:mm")));

        // Watchlist -> WatchlistDto
        CreateMap<Watchlist, WatchlistDto>();

        // Company -> CustomerDto
        CreateMap<Company, CustomerDto>()
            .ForMember(d => d.CompanyName, o => o.MapFrom(s => s.Name));

        // Report -> ReportDto
        CreateMap<Report, ReportDto>()
            .ForMember(d => d.ReportType, o => o.MapFrom(s => s.ReportType.ToString()))
            .ForMember(d => d.Format, o => o.MapFrom(s => s.Format.ToString()))
            .ForMember(d => d.GeneratedAt, o => o.MapFrom(s => s.GeneratedAt.ToString("yyyy-MM-dd HH:mm")));
    }

    private static string FormatBreakdownStatus(BreakdownStatus status) => status switch
    {
        BreakdownStatus.InProgress => "In Progress",
        BreakdownStatus.Completed => "Completed",
        _ => status.ToString()
    };

    private static string FormatPaymentMethod(PaymentMethod method) => method switch
    {
        PaymentMethod.CreditCard => "Credit Card",
        PaymentMethod.ACH => "ACH",
        PaymentMethod.InternationalWire => "International Wire",
        _ => method.ToString()
    };
}
