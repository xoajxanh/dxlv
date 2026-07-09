namespace meeyland_be.Models;

public class Contact
{
    public int Id { get; set; }
    public int OwnerId { get; set; }
    public int ContactUserId { get; set; }
    public DateTime AddedAt { get; set; } = DateTime.UtcNow;

    // Navigation
    public User Owner { get; set; } = null!;
    public User ContactUser { get; set; } = null!;
}
