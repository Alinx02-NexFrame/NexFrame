using FluentValidation;
using PaymentPortal.Application.DTOs.Payment;

namespace PaymentPortal.Application.Validators;

public class CreatePaymentRequestValidator : AbstractValidator<CreatePaymentRequest>
{
    private static readonly string[] ValidMethods = { "Credit Card", "ACH", "International Wire" };

    public CreatePaymentRequestValidator()
    {
        RuleFor(x => x.AwbNumber).NotEmpty().Matches(@"^\d{3}-\d{8}$").WithMessage("AWB number format: XXX-XXXXXXXX");
        RuleFor(x => x.PaymentMethod).NotEmpty().Must(m => ValidMethods.Contains(m)).WithMessage("Invalid payment method");
        RuleFor(x => x.Email).NotEmpty().EmailAddress();

        When(x => x.PaymentMethod == "Credit Card", () =>
        {
            RuleFor(x => x.CardNumber).NotEmpty();
            RuleFor(x => x.CardExpiry).NotEmpty();
            RuleFor(x => x.CardCVV).NotEmpty();
        });

        When(x => x.PaymentMethod == "ACH", () =>
        {
            RuleFor(x => x.AccountNumber).NotEmpty();
            RuleFor(x => x.RoutingNumber).NotEmpty();
        });
    }
}
