using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.SignalR;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;
using System.Text.Json.Serialization;
using meeyland_be.Data;
using meeyland_be.Hubs;
using meeyland_be.Models;

namespace meeyland_be.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class ChatRoomsController : ControllerBase
{
    private readonly ChatDbContext _db;
    private readonly IHubContext<ChatHub> _hub;

    public ChatRoomsController(ChatDbContext db, IHubContext<ChatHub> hub)
    {
        _db = db;
        _hub = hub;
    }

    private int CurrentUserId =>
        int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);

    // GET /api/chatrooms — list all rooms I belong to
    [HttpGet]
    public async Task<IActionResult> GetMyRooms()
    {
        var memberships = await _db.RoomMembers
            .Where(rm => rm.UserId == CurrentUserId)
            .Include(rm => rm.ChatRoom)
                .ThenInclude(r => r.Members)
                    .ThenInclude(m => m.User)
            .Include(rm => rm.ChatRoom)
                .ThenInclude(r => r.Messages.OrderByDescending(msg => msg.CreatedAt).Take(1))
                    .ThenInclude(msg => msg.Sender)
            .ToListAsync();

        var roomIds = memberships.Select(rm => rm.ChatRoomId).ToList();
        var messageReadModels = await _db.ChatMessages
            .Where(m => roomIds.Contains(m.ChatRoomId) && m.SenderId != CurrentUserId)
            .Select(m => new { m.ChatRoomId, m.Id })
            .ToListAsync();

        var rooms = memberships.Select(rm =>
        {
            var room = rm.ChatRoom;
            var lastMessage = room.Messages.OrderByDescending(msg => msg.CreatedAt).FirstOrDefault();
            var lastReadMessageId = rm.LastReadMessageId ?? 0;
            var unreadCount = messageReadModels.Count(m =>
                m.ChatRoomId == room.Id && m.Id > lastReadMessageId);
            var directLastReadMessageId = room.IsGroup
                ? null
                : room.Members
                    .Where(m => m.UserId != CurrentUserId)
                    .Select(m => m.LastReadMessageId)
                    .FirstOrDefault();

            return new
            {
                roomId = room.Id,
                name = room.IsGroup
                    ? room.Name
                    : room.Members
                        .Where(m => m.UserId != CurrentUserId)
                        .Select(m => m.User.DisplayName)
                        .FirstOrDefault() ?? room.Name,
                isGroup = room.IsGroup,
                createdAt = room.CreatedAt,
                unreadCount,
                lastReadMessageId = rm.LastReadMessageId,
                directLastReadMessageId,
                members = room.Members.Select(m => new
                {
                    userId = m.User.Id,
                    username = m.User.Username,
                    displayName = m.User.DisplayName,
                    avatarUrl = m.User.AvatarUrl,
                    isAdmin = m.IsAdmin,
                    lastReadMessageId = m.LastReadMessageId,
                    lastReadAt = m.LastReadAt
                }),
                lastMessage = lastMessage == null
                    ? null
                    : new
                    {
                        id = lastMessage.Id,
                        content = lastMessage.Content,
                        senderId = lastMessage.SenderId,
                        senderName = lastMessage.Sender.DisplayName,
                        createdAt = lastMessage.CreatedAt
                    }
            };
        }).ToList();

        return Ok(rooms);
    }

    // GET /api/chatrooms/{id} — get a single room detail
    [HttpGet("{id:int}")]
    public async Task<IActionResult> GetRoom(int id)
    {
        var isMember = await _db.RoomMembers
            .AnyAsync(rm => rm.ChatRoomId == id && rm.UserId == CurrentUserId);
        if (!isMember) return Forbid();

        var room = await _db.ChatRooms
            .Include(r => r.Members).ThenInclude(m => m.User)
            .FirstOrDefaultAsync(r => r.Id == id);

        if (room == null) return NotFound();

        return Ok(new
        {
            roomId = room.Id,
            name = room.Name,
            isGroup = room.IsGroup,
            createdAt = room.CreatedAt,
            members = room.Members.Select(m => new
            {
                userId = m.User.Id,
                username = m.User.Username,
                displayName = m.User.DisplayName,
                avatarUrl = m.User.AvatarUrl,
                isAdmin = m.IsAdmin,
                lastReadMessageId = m.LastReadMessageId,
                lastReadAt = m.LastReadAt
            })
        });
    }

    // POST /api/chatrooms/direct — open or reuse a 1v1 chat with another user
    [HttpPost("direct")]
    public async Task<IActionResult> GetOrCreateDirect([FromBody] DirectChatRequest req)
    {
        if (req.OtherUserId == CurrentUserId)
            return BadRequest(new { message = "Cannot chat with yourself." });

        var otherUser = await _db.Users.FindAsync(req.OtherUserId);
        if (otherUser == null) return NotFound(new { message = "User not found." });

        // Find existing 1v1 room between the two users
        var existingRoomId = await _db.RoomMembers
            .Where(rm => rm.UserId == CurrentUserId)
            .Join(_db.RoomMembers.Where(rm => rm.UserId == req.OtherUserId),
                  a => a.ChatRoomId, b => b.ChatRoomId, (a, b) => a.ChatRoomId)
            .Join(_db.ChatRooms.Where(r => !r.IsGroup),
                  id => id, r => r.Id, (id, r) => r.Id)
            .FirstOrDefaultAsync();

        if (existingRoomId != 0)
            return Ok(new { roomId = existingRoomId, created = false });

        // Create new 1v1 room
        var room = new ChatRoom
        {
            Name = $"dm_{CurrentUserId}_{req.OtherUserId}",
            IsGroup = false,
            CreatedByUserId = CurrentUserId
        };
        _db.ChatRooms.Add(room);
        await _db.SaveChangesAsync();

        _db.RoomMembers.AddRange(
            new RoomMember { ChatRoomId = room.Id, UserId = CurrentUserId, IsAdmin = true },
            new RoomMember { ChatRoomId = room.Id, UserId = req.OtherUserId }
        );
        await _db.SaveChangesAsync();

        return Ok(new { roomId = room.Id, created = true });
    }

    // POST /api/chatrooms/group — create a group chat
    [HttpPost("group")]
    public async Task<IActionResult> CreateGroup([FromBody] CreateGroupRequest req)
    {
        if (string.IsNullOrWhiteSpace(req.Name))
            return BadRequest(new { message = "Group name is required." });

        var room = new ChatRoom
        {
            Name = req.Name.Trim(),
            IsGroup = true,
            CreatedByUserId = CurrentUserId
        };
        _db.ChatRooms.Add(room);
        await _db.SaveChangesAsync();

        // Always add creator as admin
        var memberIds = (req.MemberUserIds ?? Enumerable.Empty<int>())
            .Distinct()
            .Where(id => id != CurrentUserId)
            .ToList();

        var members = new List<RoomMember>
        {
            new RoomMember { ChatRoomId = room.Id, UserId = CurrentUserId, IsAdmin = true }
        };

        foreach (var uid in memberIds)
        {
            if (await _db.Users.AnyAsync(u => u.Id == uid))
                members.Add(new RoomMember { ChatRoomId = room.Id, UserId = uid });
        }

        _db.RoomMembers.AddRange(members);
        await _db.SaveChangesAsync();

        // Broadcast "RoomCreated" event to all group members so their sidebar updates in real-time
        var freshRoom = await _db.ChatRooms
            .AsNoTracking()
            .Include(r => r.Members)
                .ThenInclude(m => m.User)
            .FirstOrDefaultAsync(r => r.Id == room.Id);

        if (freshRoom != null)
        {
            var roomPayload = new
            {
                roomId = freshRoom.Id,
                name = freshRoom.Name,
                isGroup = freshRoom.IsGroup,
                createdAt = freshRoom.CreatedAt,
                unreadCount = 0,
                lastReadMessageId = (int?)null,
                directLastReadMessageId = (int?)null,
                members = freshRoom.Members.Select(m => new
                {
                    userId = m.User.Id,
                    username = m.User.Username,
                    displayName = m.User.DisplayName,
                    avatarUrl = m.User.AvatarUrl,
                    isAdmin = m.IsAdmin,
                    lastReadMessageId = m.LastReadMessageId,
                    lastReadAt = m.LastReadAt
                }),
                lastMessage = (object?)null
            };

            var allMemberIds = freshRoom.Members.Select(m => m.UserId).ToList();
            await _hub.Clients.Groups(allMemberIds.Select(id => $"user_{id}")).SendAsync("RoomCreated", roomPayload);
        }

        return Ok(new { roomId = room.Id, name = room.Name, memberCount = members.Count });
    }

    // POST /api/chatrooms/{id}/members — add a member to a group
    [HttpPost("{id:int}/members")]
    public async Task<IActionResult> AddMember(int id, [FromBody] AddMemberRequest req)
    {
        var room = await _db.ChatRooms.Include(r => r.Members).FirstOrDefaultAsync(r => r.Id == id);
        if (room == null) return NotFound();
        if (!room.IsGroup) return BadRequest(new { message = "Cannot add members to a direct chat." });

        var isAdmin = await _db.RoomMembers
            .AnyAsync(rm => rm.ChatRoomId == id && rm.UserId == CurrentUserId && rm.IsAdmin);
        if (!isAdmin) return Forbid();

        if (await _db.RoomMembers.AnyAsync(rm => rm.ChatRoomId == id && rm.UserId == req.UserId))
            return Conflict(new { message = "User is already a member." });

        var targetUser = await _db.Users.FindAsync(req.UserId);
        if (targetUser == null) return NotFound(new { message = "User not found." });

        _db.RoomMembers.Add(new RoomMember { ChatRoomId = id, UserId = req.UserId });
        await _db.SaveChangesAsync();

        // Retrieve the updated room with all members
        var freshRoom = await _db.ChatRooms
            .AsNoTracking()
            .Include(r => r.Members)
                .ThenInclude(m => m.User)
            .Include(r => r.Messages.OrderByDescending(msg => msg.CreatedAt).Take(1))
                .ThenInclude(msg => msg.Sender)
            .FirstOrDefaultAsync(r => r.Id == id);

        if (freshRoom != null)
        {
            var lastMessage = freshRoom.Messages.OrderByDescending(msg => msg.CreatedAt).FirstOrDefault();

            // 1. Notify the newly added user by sending the RoomCreated event so it appears in their sidebar
            var roomPayload = new
            {
                roomId = freshRoom.Id,
                name = freshRoom.Name,
                isGroup = freshRoom.IsGroup,
                createdAt = freshRoom.CreatedAt,
                unreadCount = 0,
                lastReadMessageId = (int?)null,
                directLastReadMessageId = (int?)null,
                members = freshRoom.Members.Select(m => new
                {
                    userId = m.User.Id,
                    username = m.User.Username,
                    displayName = m.User.DisplayName,
                    avatarUrl = m.User.AvatarUrl,
                    isAdmin = m.IsAdmin,
                    lastReadMessageId = m.LastReadMessageId,
                    lastReadAt = m.LastReadAt
                }),
                lastMessage = lastMessage == null
                    ? null
                    : new
                    {
                        id = lastMessage.Id,
                        content = lastMessage.Content,
                        senderId = lastMessage.SenderId,
                        senderName = lastMessage.Sender.DisplayName,
                        createdAt = lastMessage.CreatedAt
                    }
            };

            await _hub.Clients.Group($"user_{req.UserId}").SendAsync("RoomCreated", roomPayload);

            // 2. Notify all existing members that the room's members list was updated
            var membersPayload = freshRoom.Members.Select(m => new
            {
                userId = m.User.Id,
                username = m.User.Username,
                displayName = m.User.DisplayName,
                avatarUrl = m.User.AvatarUrl,
                isAdmin = m.IsAdmin,
                lastReadMessageId = m.LastReadMessageId,
                lastReadAt = m.LastReadAt
            }).ToList();

            var otherMemberIds = freshRoom.Members
                .Where(m => m.UserId != req.UserId)
                .Select(m => m.UserId)
                .ToList();

            await _hub.Clients.Groups(otherMemberIds.Select(uid => $"user_{uid}"))
                .SendAsync("RoomUpdated", new { roomId = freshRoom.Id, members = membersPayload });
        }

        return Ok(new { message = $"{targetUser.DisplayName} added to group." });
    }

    // POST /api/chatrooms/{id}/read — mark latest visible message as read
    [HttpPost("{id:int}/read")]
    public async Task<IActionResult> MarkRead(int id, [FromBody] MarkReadRequest? req)
    {
        var membership = await _db.RoomMembers
            .FirstOrDefaultAsync(rm => rm.ChatRoomId == id && rm.UserId == CurrentUserId);
        if (membership == null) return Forbid();

        var latestMessageId = await _db.ChatMessages
            .Where(m => m.ChatRoomId == id)
            .OrderByDescending(m => m.Id)
            .Select(m => (int?)m.Id)
            .FirstOrDefaultAsync();

        var requestedMessageId = req?.LastReadMessageId ?? latestMessageId;
        if (!requestedMessageId.HasValue)
            return Ok(new { chatRoomId = id, userId = CurrentUserId, lastReadMessageId = membership.LastReadMessageId, membership.LastReadAt });

        var nextReadId = latestMessageId.HasValue
            ? Math.Min(requestedMessageId.Value, latestMessageId.Value)
            : requestedMessageId.Value;

        if (!membership.LastReadMessageId.HasValue || nextReadId > membership.LastReadMessageId.Value)
        {
            membership.LastReadMessageId = nextReadId;
            membership.LastReadAt = DateTime.UtcNow;
            await _db.SaveChangesAsync();
        }

        var payload = new
        {
            chatRoomId = id,
            userId = CurrentUserId,
            lastReadMessageId = membership.LastReadMessageId,
            lastReadAt = membership.LastReadAt
        };

        // Notify all members of the room using UserGroups rather than RoomGroups
        var memberIds = await _db.RoomMembers
            .Where(rm => rm.ChatRoomId == id)
            .Select(rm => rm.UserId)
            .ToListAsync();

        await _hub.Clients.Groups(memberIds.Select(uid => $"user_{uid}")).SendAsync("MessageRead", payload);

        return Ok(payload);
    }
}

public record DirectChatRequest(
    [property: JsonPropertyName("otherUserId")] int OtherUserId
);

public record CreateGroupRequest(
    [property: JsonPropertyName("name")] string Name,
    [property: JsonPropertyName("memberUserIds")] IEnumerable<int>? MemberUserIds
);

public record AddMemberRequest(
    [property: JsonPropertyName("userId")] int UserId
);

public record MarkReadRequest(
    [property: JsonPropertyName("lastReadMessageId")] int? LastReadMessageId
);
