using Microsoft.AspNetCore.Mvc;
using Livekit.Server.Sdk.Dotnet;
using meeyland_be.Models;

namespace meeyland_be.Controllers;

[ApiController]
[Route("api/[controller]")]
public class TokenController : ControllerBase
{
    private readonly IConfiguration _configuration;

    public TokenController(IConfiguration configuration)
    {
        _configuration = configuration;
    }

    [HttpGet("livekit")]
    public IActionResult GetToken([FromQuery] string roomName, [FromQuery] string participantName)
    {
        var apiKey = _configuration["LiveKit:ApiKey"] ?? "devkey";
        var apiSecret = _configuration["LiveKit:ApiSecret"] ?? "secret";

        // Generate a token
        var token = new AccessToken(apiKey, apiSecret)
            .WithIdentity(participantName)
            .WithName(participantName)
            .WithGrants(new VideoGrants 
            { 
                RoomJoin = true, 
                Room = roomName,
                CanPublish = true,
                CanSubscribe = true
            });

        return Ok(new { token = token.ToJwt() });
    }
}
