using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.SignalR;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;
using meeyland_be.Data;
using meeyland_be.Models;

namespace meeyland_be.Hubs;

[Authorize]
public class ChatHub : Hub
{
    private readonly ChatDbContext _db;

    public ChatHub(ChatDbContext db)
    {
        _db = db;
    }

    private int CurrentUserId =>
        int.Parse(Context.User!.FindFirstValue(ClaimTypes.NameIdentifier)!);

    private string CurrentDisplayName =>
        Context.User!.FindFirstValue("displayName") ?? "Unknown";

    // ──────────────────────────────────────────────────────────
    //  Connection lifecycle — join each room as a SignalR group
    // ──────────────────────────────────────────────────────────
    public override async Task OnConnectedAsync()
    {
        var roomIds = await _db.RoomMembers
            .Where(rm => rm.UserId == CurrentUserId)
            .Select(rm => rm.ChatRoomId)
            .ToListAsync();

        foreach (var roomId in roomIds)
            await Groups.AddToGroupAsync(Context.ConnectionId, RoomGroup(roomId));

        // Track user presence by their userId as a personal group
        await Groups.AddToGroupAsync(Context.ConnectionId, UserGroup(CurrentUserId));

        await base.OnConnectedAsync();
    }

    public override async Task OnDisconnectedAsync(Exception? exception)
    {
        await base.OnDisconnectedAsync(exception);
    }

    // ──────────────────────────────────────────────────────────
    //  Send a text message to a chat room
    // ──────────────────────────────────────────────────────────
    public async Task SendMessage(int chatRoomId, string content, string? attachmentUrl = null)
    {
        var room = await _db.ChatRooms.FindAsync(chatRoomId);
        if (room == null) return;

        var memberIds = await _db.RoomMembers
            .Where(rm => rm.ChatRoomId == chatRoomId)
            .Select(rm => rm.UserId)
            .ToListAsync();
        if (!memberIds.Contains(CurrentUserId)) return;

        var message = new ChatMessage
        {
            ChatRoomId = chatRoomId,
            SenderId = CurrentUserId,
            Content = content,
            AttachmentUrl = attachmentUrl,
            CreatedAt = DateTime.UtcNow
        };

        _db.ChatMessages.Add(message);
        await _db.SaveChangesAsync();

        var membership = await _db.RoomMembers
            .FirstOrDefaultAsync(rm => rm.ChatRoomId == chatRoomId && rm.UserId == CurrentUserId);
        if (membership != null)
        {
            membership.LastReadMessageId = message.Id;
            membership.LastReadAt = DateTime.UtcNow;
            await _db.SaveChangesAsync();
        }

        var payload = new
        {
            id = message.Id,
            chatRoomId = message.ChatRoomId,
            content = message.Content,
            attachmentUrl = message.AttachmentUrl,
            createdAt = message.CreatedAt,
            isGroup = room.IsGroup,
            chatRoomName = room.Name,
            sender = new
            {
                userId = CurrentUserId,
                displayName = CurrentDisplayName
            }
        };

        await Clients.Groups(memberIds.Select(UserGroup)).SendAsync("ReceiveMessage", payload);
    }

    // ──────────────────────────────────────────────────────────
    //  Mark room messages as read
    // ──────────────────────────────────────────────────────────
    public async Task MarkRead(int chatRoomId, int? lastReadMessageId = null)
    {
        var membership = await _db.RoomMembers
            .FirstOrDefaultAsync(rm => rm.ChatRoomId == chatRoomId && rm.UserId == CurrentUserId);
        if (membership == null) return;

        var latestMessageId = await _db.ChatMessages
            .Where(m => m.ChatRoomId == chatRoomId)
            .OrderByDescending(m => m.Id)
            .Select(m => (int?)m.Id)
            .FirstOrDefaultAsync();

        var requestedMessageId = lastReadMessageId ?? latestMessageId;
        if (!requestedMessageId.HasValue) return;

        var nextReadId = latestMessageId.HasValue
            ? Math.Min(requestedMessageId.Value, latestMessageId.Value)
            : requestedMessageId.Value;

        if (membership.LastReadMessageId.HasValue && nextReadId <= membership.LastReadMessageId.Value)
            return;

        membership.LastReadMessageId = nextReadId;
        membership.LastReadAt = DateTime.UtcNow;
        await _db.SaveChangesAsync();

        var memberIds = await _db.RoomMembers
            .Where(rm => rm.ChatRoomId == chatRoomId)
            .Select(rm => rm.UserId)
            .ToListAsync();

        await Clients.Groups(memberIds.Select(UserGroup)).SendAsync("MessageRead", new
        {
            chatRoomId,
            userId = CurrentUserId,
            lastReadMessageId = membership.LastReadMessageId,
            lastReadAt = membership.LastReadAt
        });
    }

    // ──────────────────────────────────────────────────────────
    //  Typing indicator
    // ──────────────────────────────────────────────────────────
    public async Task Typing(int chatRoomId, bool isTyping)
    {
        var memberIds = await _db.RoomMembers
            .Where(rm => rm.ChatRoomId == chatRoomId)
            .Select(rm => rm.UserId)
            .ToListAsync();
        if (!memberIds.Contains(CurrentUserId)) return;

        await Clients.Groups(memberIds.Where(id => id != CurrentUserId).Select(UserGroup))
            .SendAsync("UserTyping", new
            {
                chatRoomId,
                userId = CurrentUserId,
                displayName = CurrentDisplayName,
                isTyping
            });
    }

    // ──────────────────────────────────────────────────────────
    //  Initiate a call — notify all group members
    // ──────────────────────────────────────────────────────────
    public async Task InitiateCall(int chatRoomId, string liveKitRoomName, bool isVideo)
    {
        var memberIds = await _db.RoomMembers
            .Where(rm => rm.ChatRoomId == chatRoomId)
            .Select(rm => rm.UserId)
            .ToListAsync();
        if (!memberIds.Contains(CurrentUserId)) return;

        var payload = new
        {
            chatRoomId,
            liveKitRoomName,
            isVideo,
            callerId = CurrentUserId,
            callerName = CurrentDisplayName
        };

        // Notify everyone else in the room, including members who joined after this socket connected.
        await Clients.Groups(memberIds.Where(id => id != CurrentUserId).Select(UserGroup))
            .SendAsync("IncomingCall", payload);
    }

    // ──────────────────────────────────────────────────────────
    //  Invite a specific group member to a live call
    //  (only members already in the group can be invited)
    // ──────────────────────────────────────────────────────────
    public async Task InviteToCall(int chatRoomId, int targetUserId, string liveKitRoomName)
    {
        // Verify the caller is a member
        var isMember = await _db.RoomMembers
            .AnyAsync(rm => rm.ChatRoomId == chatRoomId && rm.UserId == CurrentUserId);
        if (!isMember) return;

        // Verify the target is also a member of this group
        var targetIsMember = await _db.RoomMembers
            .AnyAsync(rm => rm.ChatRoomId == chatRoomId && rm.UserId == targetUserId);
        if (!targetIsMember) return;

        var payload = new
        {
            chatRoomId,
            liveKitRoomName,
            inviterId = CurrentUserId,
            inviterName = CurrentDisplayName
        };

        // Send only to the target user's personal group (all their connections)
        await Clients.Group(UserGroup(targetUserId))
            .SendAsync("IncomingCall", payload);
    }

    // ──────────────────────────────────────────────────────────
    //  Accept or decline call — notify the caller
    // ──────────────────────────────────────────────────────────
    public async Task RespondToCall(int callerId, bool accepted, string liveKitRoomName, string? reason = null)
    {
        await Clients.Group(UserGroup(callerId))
            .SendAsync("CallResponse", new
            {
                responderId = CurrentUserId,
                responderName = CurrentDisplayName,
                accepted,
                liveKitRoomName,
                reason
            });
    }

    // ──────────────────────────────────────────────────────────
    //  End call or cancel call — notify room members
    // ──────────────────────────────────────────────────────────
    public async Task EndCall(int chatRoomId, string liveKitRoomName)
    {
        var memberIds = await _db.RoomMembers
            .Where(rm => rm.ChatRoomId == chatRoomId)
            .Select(rm => rm.UserId)
            .ToListAsync();
        if (!memberIds.Contains(CurrentUserId)) return;

        await Clients.Groups(memberIds.Where(id => id != CurrentUserId).Select(UserGroup))
            .SendAsync("CallEnded", new
            {
                chatRoomId,
                liveKitRoomName,
                endedById = CurrentUserId
            });
    }

    // ──────────────────────────────────────────────────────────
    //  Helpers
    // ──────────────────────────────────────────────────────────
    private static string RoomGroup(int roomId) => $"room_{roomId}";
    private static string UserGroup(int userId) => $"user_{userId}";
}
