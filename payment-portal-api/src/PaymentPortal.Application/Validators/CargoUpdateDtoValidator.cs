using FluentValidation;
using PaymentPortal.Application.DTOs.Cargo;

namespace PaymentPortal.Application.Validators;

public class CargoUpdateDtoValidator : AbstractValidator<CargoUpdateDto>
{
    private static readonly string[] ValidBreakdownStatus = { "InProgress", "In Progress", "Completed" };
    private static readonly string[] ValidCustomsStatus = { "PNF", "Hold", "Released" };

    public CargoUpdateDtoValidator()
    {
        RuleFor(x => x.Origin).NotEmpty().MaximumLength(100);
        RuleFor(x => x.Destination).NotEmpty().MaximumLength(100);
        RuleFor(x => x.Pieces).GreaterThan(0);
        RuleFor(x => x.Weight).GreaterThan(0);
        RuleFor(x => x.FreeTimeDays).GreaterThanOrEqualTo(0);

        RuleFor(x => x.BreakdownStatus)
            .NotEmpty()
            .Must(s => ValidBreakdownStatus.Contains(s))
            .WithMessage("BreakdownStatus must be one of: InProgress, Completed");

        RuleFor(x => x.CustomsStatus)
            .NotEmpty()
            .Must(s => ValidCustomsStatus.Contains(s))
            .WithMessage("CustomsStatus must be one of: PNF, Hold, Released");
    }
}
