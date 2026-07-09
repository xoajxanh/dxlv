using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;
using Livekit.Server.Sdk.Dotnet;

namespace meeyland_be.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class TokenController : ControllerBase
{
    private readonly IConfiguration _configuration;

    public TokenController(IConfiguration configuration)
    {
        _configuration = configuration;
    }

    // GET /api/token/livekit?roomName=xyz
    // Uses the authenticated user's ID + display name so the frontend doesn't need to pass them
    [HttpGet("livekit")]
    public IActionResult GetToken([FromQuery] string roomName)
    {
        if (string.IsNullOrWhiteSpace(roomName))
            return BadRequest(new { message = "roomName is required." });

        var apiKey    = _configuration["LiveKit:ApiKey"]    ?? "devkey";
        var apiSecret = _configuration["LiveKit:ApiSecret"] ?? "secret";

        var userId      = User.FindFirstValue(ClaimTypes.NameIdentifier)!;
        var displayName = User.FindFirstValue("displayName") ?? User.FindFirstValue(ClaimTypes.Name) ?? userId;

        var token = new AccessToken(apiKey, apiSecret)
            .WithIdentity(userId)          // stable user ID as identity
            .WithName(displayName)         // display name shown in room
            .WithGrants(new VideoGrants
            {
                RoomJoin    = true,
                Room        = roomName,
                CanPublish  = true,
                CanSubscribe = true
            });

        return Ok(new
        {
            token       = token.ToJwt(),
            roomName,
            identity    = userId,
            displayName
        });
    }
}
