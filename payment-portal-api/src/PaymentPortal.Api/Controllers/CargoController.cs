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

    [HttpGet("search")]
    public async Task<ActionResult<CargoDto>> Search([FromQuery] string awbNumber)
    {
        var result = await _cargo.SearchByAwbAsync(awbNumber);
        if (result == null) return NotFound(new { error = $"No cargo found for AWB number \"{awbNumber}\"." });
        return Ok(result);
    }
}
