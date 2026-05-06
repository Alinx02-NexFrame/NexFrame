using System.Text.Json;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Azure.Functions.Worker;
using PaymentPortal.Api.Helpers;
using PaymentPortal.Application.DTOs.SavedCard;
using PaymentPortal.Application.Interfaces;

namespace PaymentPortal.Api.Functions;

public class SavedCardFunctions
{
    private static readonly JsonSerializerOptions Json = new(JsonSerializerDefaults.Web)
    {
        Converters = { new System.Text.Json.Serialization.JsonStringEnumConverter() }
    };

    private readonly ISavedCardService _c;
    private readonly JwtAuthHelper _jwt;
    public SavedCardFunctions(ISavedCardService c, JwtAuthHelper jwt) { _c = c; _jwt = jwt; }

    private (int? uid, IActionResult? deny) Auth(HttpRequest req)
    {
        var p = _jwt.Validate(req);
        if (p == null) return (null, new UnauthorizedResult());
        if (!_jwt.HasRole(p, "forwarder")) return (null, new ForbidResult());
        var uid = _jwt.UserId(p);
        if (uid == null) return (null, new UnauthorizedResult());
        return (uid, null);
    }

    [Function("sellas-saved-cards-list")]
    public async Task<IActionResult> List(
        [HttpTrigger(AuthorizationLevel.Anonymous, "get", Route = "api/forwarder/saved-cards")] HttpRequest req)
    {
        var (uid, deny) = Auth(req); if (deny != null) return deny;
        return new OkObjectResult(await _c.ListAsync(uid!.Value));
    }

    [Function("sellas-saved-cards-add")]
    public async Task<IActionResult> Add(
        [HttpTrigger(AuthorizationLevel.Anonymous, "post", Route = "api/forwarder/saved-cards")] HttpRequest req)
    {
        var (uid, deny) = Auth(req); if (deny != null) return deny;
        var body = await JsonSerializer.DeserializeAsync<AddSavedCardRequest>(req.Body, Json);
        return new OkObjectResult(await _c.AddAsync(uid!.Value, body!));
    }

    [Function("sellas-saved-cards-default")]
    public async Task<IActionResult> SetDefault(
        [HttpTrigger(AuthorizationLevel.Anonymous, "post", Route = "api/forwarder/saved-cards/{cardId:int}/default")] HttpRequest req,
        int cardId)
    {
        var (uid, deny) = Auth(req); if (deny != null) return deny;
        await _c.SetDefaultAsync(uid!.Value, cardId);
        return new NoContentResult();
    }

    [Function("sellas-saved-cards-delete")]
    public async Task<IActionResult> Delete(
        [HttpTrigger(AuthorizationLevel.Anonymous, "delete", Route = "api/forwarder/saved-cards/{cardId:int}")] HttpRequest req,
        int cardId)
    {
        var (uid, deny) = Auth(req); if (deny != null) return deny;
        await _c.RemoveAsync(uid!.Value, cardId);
        return new NoContentResult();
    }
}
