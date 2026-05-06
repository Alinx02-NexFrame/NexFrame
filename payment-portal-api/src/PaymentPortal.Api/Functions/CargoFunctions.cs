using System.Text.Json;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Azure.Functions.Worker;
using PaymentPortal.Api.Helpers;
using PaymentPortal.Application.DTOs.Cargo;
using PaymentPortal.Application.Interfaces;

namespace PaymentPortal.Api.Functions;

public class CargoFunctions
{
    private static readonly JsonSerializerOptions Json = new(JsonSerializerDefaults.Web)
    {
        Converters = { new System.Text.Json.Serialization.JsonStringEnumConverter() }
    };

    private readonly ICargoService _cargo;
    private readonly JwtAuthHelper _jwt;
    public CargoFunctions(ICargoService cargo, JwtAuthHelper jwt) { _cargo = cargo; _jwt = jwt; }

    [Function("sellas-cargo-search")]
    public async Task<IActionResult> Search(
        [HttpTrigger(AuthorizationLevel.Anonymous, "get", Route = "api/cargo/search")] HttpRequest req)
    {
        var awb = req.Query["awbNumber"].ToString();
        var result = await _cargo.SearchByAwbAsync(awb);
        if (result == null) return new NotFoundObjectResult(new { error = $"No cargo found for AWB number \"{awb}\"." });
        return new OkObjectResult(result);
    }

    [Function("sellas-cargo-create")]
    public async Task<IActionResult> Create(
        [HttpTrigger(AuthorizationLevel.Anonymous, "post", Route = "api/cargo")] HttpRequest req)
    {
        var p = _jwt.Validate(req);
        if (p == null) return new UnauthorizedResult();
        if (!_jwt.HasRole(p, "gha_admin")) return new ForbidResult();
        var dto = await JsonSerializer.DeserializeAsync<CargoCreateDto>(req.Body, Json);
        var created = await _cargo.CreateAsync(dto!, _jwt.UserId(p));
        return new ObjectResult(created) { StatusCode = StatusCodes.Status201Created };
    }

    [Function("sellas-cargo-update")]
    public async Task<IActionResult> Update(
        [HttpTrigger(AuthorizationLevel.Anonymous, "put", Route = "api/cargo/{awbNumber}")] HttpRequest req,
        string awbNumber)
    {
        var p = _jwt.Validate(req);
        if (p == null) return new UnauthorizedResult();
        if (!_jwt.HasRole(p, "gha_admin")) return new ForbidResult();
        var dto = await JsonSerializer.DeserializeAsync<CargoUpdateDto>(req.Body, Json);
        var updated = await _cargo.UpdateAsync(awbNumber, dto!, _jwt.UserId(p));
        return new OkObjectResult(updated);
    }

    [Function("sellas-cargo-delete")]
    public async Task<IActionResult> Delete(
        [HttpTrigger(AuthorizationLevel.Anonymous, "delete", Route = "api/cargo/{awbNumber}")] HttpRequest req,
        string awbNumber)
    {
        var p = _jwt.Validate(req);
        if (p == null) return new UnauthorizedResult();
        if (!_jwt.HasRole(p, "gha_admin")) return new ForbidResult();
        await _cargo.DeleteAsync(awbNumber, _jwt.UserId(p));
        return new NoContentResult();
    }
}
