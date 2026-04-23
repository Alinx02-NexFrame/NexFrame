using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using PaymentPortal.Application.DTOs.SavedCard;
using PaymentPortal.Application.Interfaces;

namespace PaymentPortal.Api.Controllers;

[ApiController]
[Route("api/forwarder/saved-cards")]
[Authorize(Roles = "forwarder")]
public class SavedCardController : ControllerBase
{
    private readonly ISavedCardService _cards;

    public SavedCardController(ISavedCardService cards) => _cards = cards;

    private int UserId => int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);

    [HttpGet]
    public async Task<ActionResult<List<SavedCardDto>>> List()
        => Ok(await _cards.ListAsync(UserId));

    [HttpPost]
    public async Task<ActionResult<SavedCardDto>> Add([FromBody] AddSavedCardRequest request)
        => Ok(await _cards.AddAsync(UserId, request));

    [HttpPost("{cardId}/default")]
    public async Task<IActionResult> SetDefault(int cardId)
    {
        await _cards.SetDefaultAsync(UserId, cardId);
        return NoContent();
    }

    [HttpDelete("{cardId}")]
    public async Task<IActionResult> Remove(int cardId)
    {
        await _cards.RemoveAsync(UserId, cardId);
        return NoContent();
    }
}
