using AutoMapper;
using Microsoft.EntityFrameworkCore;
using PaymentPortal.Application.DTOs.SavedCard;
using PaymentPortal.Application.Exceptions;
using PaymentPortal.Application.Interfaces;
using PaymentPortal.Domain.Entities;
using PaymentPortal.Infrastructure.Data;

namespace PaymentPortal.Infrastructure.Services;

public class SavedCardService : ISavedCardService
{
    private readonly AppDbContext _db;
    private readonly IMapper _mapper;
    private readonly IAuditLogService _audit;

    public SavedCardService(AppDbContext db, IMapper mapper, IAuditLogService audit)
    {
        _db = db;
        _mapper = mapper;
        _audit = audit;
    }

    public async Task<List<SavedCardDto>> ListAsync(int userId)
    {
        var user = await _db.Users.FindAsync(userId) ?? throw new KeyNotFoundException("User not found.");

        var cards = await _db.SavedCards
            .Where(c => c.CompanyId == user.CompanyId)
            .OrderByDescending(c => c.IsDefault)
            .ThenByDescending(c => c.CreatedAt)
            .ToListAsync();

        return cards.Select(c => _mapper.Map<SavedCardDto>(c)).ToList();
    }

    public async Task<SavedCardDto> AddAsync(int userId, AddSavedCardRequest request)
    {
        var user = await RequireCompanyAdminAsync(userId);

        // PCI: never store the raw PAN — only Last4 + a gateway token. Until
        // a real gateway is wired up, synthesize a placeholder token so the
        // column contract is satisfied; downstream Stripe integration should
        // replace this with the gateway's response.
        var last4 = request.CardNumber.Length >= 4
            ? request.CardNumber[^4..]
            : throw new InvalidOperationException("Card number must have at least 4 digits.");
        var gatewayToken = $"TOK-{Guid.NewGuid():N}";

        // If this card is marked default, unset other defaults in the same company.
        if (request.IsDefault)
        {
            var currentDefaults = await _db.SavedCards
                .Where(c => c.CompanyId == user.CompanyId && c.IsDefault)
                .ToListAsync();
            foreach (var c in currentDefaults) c.IsDefault = false;
        }

        var card = new SavedCard
        {
            CompanyId = user.CompanyId,
            CardLast4 = last4,
            CardBrand = request.CardBrand,
            CardHolderName = request.CardHolderName,
            ExpiryMonth = request.ExpiryMonth,
            ExpiryYear = request.ExpiryYear,
            GatewayToken = gatewayToken,
            IsDefault = request.IsDefault,
            CreatedByUserId = userId
        };
        _db.SavedCards.Add(card);
        await _db.SaveChangesAsync();

        await _audit.LogAsync(userId, "SavedCardAdd", "SavedCard", card.Id.ToString(), $"last4={last4}, brand={request.CardBrand}");

        return _mapper.Map<SavedCardDto>(card);
    }

    public async Task SetDefaultAsync(int userId, int cardId)
    {
        var user = await RequireCompanyAdminAsync(userId);

        var target = await _db.SavedCards
            .FirstOrDefaultAsync(c => c.Id == cardId && c.CompanyId == user.CompanyId)
            ?? throw new KeyNotFoundException("Saved card not found.");

        var currentDefaults = await _db.SavedCards
            .Where(c => c.CompanyId == user.CompanyId && c.IsDefault && c.Id != cardId)
            .ToListAsync();
        foreach (var c in currentDefaults) c.IsDefault = false;

        target.IsDefault = true;
        await _db.SaveChangesAsync();

        await _audit.LogAsync(userId, "SavedCardSetDefault", "SavedCard", cardId.ToString());
    }

    public async Task RemoveAsync(int userId, int cardId)
    {
        var user = await RequireCompanyAdminAsync(userId);

        var card = await _db.SavedCards
            .FirstOrDefaultAsync(c => c.Id == cardId && c.CompanyId == user.CompanyId)
            ?? throw new KeyNotFoundException("Saved card not found.");

        _db.SavedCards.Remove(card);
        await _db.SaveChangesAsync();

        await _audit.LogAsync(userId, "SavedCardRemove", "SavedCard", cardId.ToString());
    }

    private async Task<User> RequireCompanyAdminAsync(int userId)
    {
        var user = await _db.Users.FindAsync(userId) ?? throw new KeyNotFoundException("User not found.");
        if (user.CompanyRole != Domain.Enums.CompanyRole.Admin)
            throw new ForbiddenException("Only company admins can manage saved cards.");
        return user;
    }
}
