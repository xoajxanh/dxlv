using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;
using meeyland_be.Data;

namespace meeyland_be.Controllers;

[ApiController]
[Route("api/chatrooms/{roomId:int}/messages")]
[Authorize]
public class MessagesController : ControllerBase
{
    private readonly ChatDbContext _db;

    public MessagesController(ChatDbContext db)
    {
        _db = db;
    }

    private int CurrentUserId =>
        int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);

    // GET /api/chatrooms/{roomId}/messages?before=&limit=
    [HttpGet]
    public async Task<IActionResult> GetMessages(
        int roomId,
        [FromQuery] int limit = 50,
        [FromQuery] int? before = null)
    {
        var isMember = await _db.RoomMembers
            .AnyAsync(rm => rm.ChatRoomId == roomId && rm.UserId == CurrentUserId);
        if (!isMember) return Forbid();

        var room = await _db.ChatRooms
            .Include(r => r.Members)
            .FirstOrDefaultAsync(r => r.Id == roomId);
        if (room == null) return NotFound();

        var directOtherReadMessageId = room.IsGroup
            ? null
            : room.Members
                .Where(m => m.UserId != CurrentUserId)
                .Select(m => m.LastReadMessageId)
                .FirstOrDefault();

        var query = _db.ChatMessages
            .Where(m => m.ChatRoomId == roomId)
            .AsQueryable();

        if (before.HasValue)
            query = query.Where(m => m.Id < before.Value);

        var messages = await query
            .OrderByDescending(m => m.CreatedAt)
            .Take(Math.Min(limit, 100))
            .Include(m => m.Sender)
            .OrderBy(m => m.CreatedAt)
            .Select(m => new
            {
                id = m.Id,
                content = m.Content,
                attachmentUrl = m.AttachmentUrl,
                createdAt = m.CreatedAt,
                isReadByOther = !room.IsGroup &&
                    m.SenderId == CurrentUserId &&
                    directOtherReadMessageId.HasValue &&
                    directOtherReadMessageId.Value >= m.Id,
                sender = new
                {
                    userId = m.Sender.Id,
                    username = m.Sender.Username,
                    displayName = m.Sender.DisplayName,
                    avatarUrl = m.Sender.AvatarUrl
                }
            })
            .ToListAsync();

        return Ok(messages);
    }
}
