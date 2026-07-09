using Microsoft.EntityFrameworkCore;
using meeyland_be.Models;

namespace meeyland_be.Data;

public class ChatDbContext : DbContext
{
    public ChatDbContext(DbContextOptions<ChatDbContext> options) : base(options)
    {
    }

    public DbSet<User> Users { get; set; } = null!;
    public DbSet<Contact> Contacts { get; set; } = null!;
    public DbSet<ChatRoom> ChatRooms { get; set; } = null!;
    public DbSet<RoomMember> RoomMembers { get; set; } = null!;
    public DbSet<ChatMessage> ChatMessages { get; set; } = null!;

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        // User: unique username
        modelBuilder.Entity<User>()
            .HasIndex(u => u.Username)
            .IsUnique();

        // Contact: unique pair (owner + contact)
        modelBuilder.Entity<Contact>()
            .HasIndex(c => new { c.OwnerId, c.ContactUserId })
            .IsUnique();

        // Contact → Owner (restrict delete to avoid cascade cycles)
        modelBuilder.Entity<Contact>()
            .HasOne(c => c.Owner)
            .WithMany(u => u.Contacts)
            .HasForeignKey(c => c.OwnerId)
            .OnDelete(DeleteBehavior.Restrict);

        // Contact → ContactUser
        modelBuilder.Entity<Contact>()
            .HasOne(c => c.ContactUser)
            .WithMany()
            .HasForeignKey(c => c.ContactUserId)
            .OnDelete(DeleteBehavior.Restrict);

        // ChatRoom → CreatedBy
        modelBuilder.Entity<ChatRoom>()
            .HasOne(r => r.CreatedBy)
            .WithMany()
            .HasForeignKey(r => r.CreatedByUserId)
            .OnDelete(DeleteBehavior.Restrict);

        // RoomMember → ChatRoom
        modelBuilder.Entity<RoomMember>()
            .HasOne(rm => rm.ChatRoom)
            .WithMany(r => r.Members)
            .HasForeignKey(rm => rm.ChatRoomId)
            .OnDelete(DeleteBehavior.Cascade);

        // RoomMember → User
        modelBuilder.Entity<RoomMember>()
            .HasOne(rm => rm.User)
            .WithMany(u => u.RoomMemberships)
            .HasForeignKey(rm => rm.UserId)
            .OnDelete(DeleteBehavior.Restrict);

        // Unique membership per room
        modelBuilder.Entity<RoomMember>()
            .HasIndex(rm => new { rm.ChatRoomId, rm.UserId })
            .IsUnique();

        // ChatMessage → ChatRoom
        modelBuilder.Entity<ChatMessage>()
            .HasOne(m => m.ChatRoom)
            .WithMany(r => r.Messages)
            .HasForeignKey(m => m.ChatRoomId)
            .OnDelete(DeleteBehavior.Cascade);

        // ChatMessage → Sender
        modelBuilder.Entity<ChatMessage>()
            .HasOne(m => m.Sender)
            .WithMany(u => u.Messages)
            .HasForeignKey(m => m.SenderId)
            .OnDelete(DeleteBehavior.Restrict);
    }
}
