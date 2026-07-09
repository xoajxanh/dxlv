namespace meeyland_be.Models;

public class RoomMember
{
    public int Id { get; set; }
    public int ChatRoomId { get; set; }
    public int UserId { get; set; }
    public bool IsAdmin { get; set; } = false;
    public DateTime JoinedAt { get; set; } = DateTime.UtcNow;
    public int? LastReadMessageId { get; set; }
    public DateTime? LastReadAt { get; set; }

    // Navigation
    public ChatRoom ChatRoom { get; set; } = null!;
    public User User { get; set; } = null!;
}
