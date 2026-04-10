using FluentValidation;
using PaymentPortal.Application.DTOs.Auth;

namespace PaymentPortal.Application.Validators;

public class RegisterRequestValidator : AbstractValidator<RegisterRequest>
{
    public RegisterRequestValidator()
    {
        RuleFor(x => x.Email).NotEmpty().EmailAddress();
        RuleFor(x => x.Password).NotEmpty().MinimumLength(8);
        RuleFor(x => x.FullName).NotEmpty().MaximumLength(100);
        RuleFor(x => x.CompanyName).NotEmpty().MaximumLength(200);
    }
}
