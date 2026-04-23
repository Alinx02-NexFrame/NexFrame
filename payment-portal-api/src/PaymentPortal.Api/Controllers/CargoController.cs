using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using PaymentPortal.Application.DTOs.Cargo;
using PaymentPortal.Application.Interfaces;

namespace PaymentPortal.Api.Controllers;

[ApiController]
[Route("api/cargo")]
public class CargoController : ControllerBase
{
    private readonly ICargoService _cargo;

    public CargoController(ICargoService cargo) => _cargo = cargo;

    private int? CurrentUserId
    {
        get
        {
            var raw = User.FindFirstValue(ClaimTypes.NameIdentifier);
            return int.TryParse(raw, out var id) ? id : (int?)null;
        }
    }

    [HttpGet("search")]
    public async Task<ActionResult<CargoDto>> Search([FromQuery] string awbNumber)
    {
        var result = await _cargo.SearchByAwbAsync(awbNumber);
        if (result == null) return NotFound(new { error = $"No cargo found for AWB number \"{awbNumber}\"." });
        return Ok(result);
    }

    [HttpPost]
    [Authorize(Roles = "gha_admin")]
    public async Task<ActionResult<CargoDto>> Create([FromBody] CargoCreateDto dto)
    {
        var created = await _cargo.CreateAsync(dto, CurrentUserId);
        return CreatedAtAction(nameof(Search), new { awbNumber = created.AwbNumber }, created);
    }

    [HttpPut("{awbNumber}")]
    [Authorize(Roles = "gha_admin")]
    public async Task<ActionResult<CargoDto>> Update(string awbNumber, [FromBody] CargoUpdateDto dto)
    {
        var updated = await _cargo.UpdateAsync(awbNumber, dto, CurrentUserId);
        return Ok(updated);
    }

    [HttpDelete("{awbNumber}")]
    [Authorize(Roles = "gha_admin")]
    public async Task<IActionResult> Delete(string awbNumber)
    {
        await _cargo.DeleteAsync(awbNumber, CurrentUserId);
        return NoContent();
    }
}
