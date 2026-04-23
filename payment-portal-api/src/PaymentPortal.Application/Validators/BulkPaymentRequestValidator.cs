using FluentValidation;
using PaymentPortal.Application.DTOs.Payment;

namespace PaymentPortal.Application.Validators;

public class BulkPaymentRequestValidator : AbstractValidator<BulkPaymentRequest>
{
    private static readonly string[] ValidMethods = { "Credit Card", "ACH", "International Wire" };

    public BulkPaymentRequestValidator()
    {
        RuleFor(x => x.AwbNumbers)
            .NotEmpty().WithMessage("At least one AWB number is required.");

        RuleForEach(x => x.AwbNumbers)
            .Matches(@"^\d{3}-\d{8}$").WithMessage("AWB number format: XXX-XXXXXXXX");

        RuleFor(x => x.PaymentMethod)
            .NotEmpty()
            .Must(m => ValidMethods.Contains(m)).WithMessage("Invalid payment method");

        // Email is optional; only validate format when provided.
        When(x => !string.IsNullOrWhiteSpace(x.Email), () =>
        {
            RuleFor(x => x.Email!).EmailAddress();
        });
    }
}
