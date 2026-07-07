using Microsoft.EntityFrameworkCore;
using meeyland_be.Models;

namespace meeyland_be.Data;

public class ChatDbContext : DbContext
{
    public ChatDbContext(DbContextOptions<ChatDbContext> options) : base(options)
    {
    }

    public DbSet<ChatMessage> ChatMessages { get; set; } = null!;
}
