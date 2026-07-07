using Microsoft.AspNetCore.SignalR;
using meeyland_be.Data;
using meeyland_be.Models;

namespace meeyland_be.Hubs;

public class ChatHub : Hub
{
    private readonly ChatDbContext _dbContext;

    public ChatHub(ChatDbContext dbContext)
    {
        _dbContext = dbContext;
    }

    public async Task SendMessage(string senderName, string content, string? attachmentUrl)
    {
        var message = new ChatMessage
        {
            SenderName = senderName,
            Content = content,
            AttachmentUrl = attachmentUrl,
            CreatedAt = DateTime.UtcNow
        };

        _dbContext.ChatMessages.Add(message);
        await _dbContext.SaveChangesAsync();

        await Clients.All.SendAsync("ReceiveMessage", message);
    }
}
