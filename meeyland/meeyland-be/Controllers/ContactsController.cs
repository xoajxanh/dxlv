using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;
using meeyland_be.Data;
using meeyland_be.Models;

namespace meeyland_be.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class ContactsController : ControllerBase
{
    private readonly ChatDbContext _db;

    public ContactsController(ChatDbContext db)
    {
        _db = db;
    }

    private int CurrentUserId =>
        int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);

    // GET /api/contacts — list my contacts
    [HttpGet]
    public async Task<IActionResult> GetContacts()
    {
        var contacts = await _db.Contacts
            .Where(c => c.OwnerId == CurrentUserId)
            .Include(c => c.ContactUser)
            .Select(c => new
            {
                contactId = c.Id,
                userId = c.ContactUser.Id,
                username = c.ContactUser.Username,
                displayName = c.ContactUser.DisplayName,
                avatarUrl = c.ContactUser.AvatarUrl,
                addedAt = c.AddedAt
            })
            .ToListAsync();

        return Ok(contacts);
    }

    // GET /api/contacts/search?q=alice — search users by username or display name
    [HttpGet("search")]
    public async Task<IActionResult> SearchUsers([FromQuery] string q)
    {
        if (string.IsNullOrWhiteSpace(q)) return BadRequest(new { message = "Query is required." });

        var lower = q.ToLower().Trim();
        var results = await _db.Users
            .Where(u => u.Id != CurrentUserId &&
                        (u.Username.Contains(lower) || u.DisplayName.ToLower().Contains(lower)))
            .Take(20)
            .Select(u => new
            {
                userId = u.Id,
                username = u.Username,
                displayName = u.DisplayName,
                avatarUrl = u.AvatarUrl
            })
            .ToListAsync();

        return Ok(results);
    }

    // POST /api/contacts — add a contact
    [HttpPost]
    public async Task<IActionResult> AddContact([FromBody] AddContactRequest req)
    {
        if (req.UserId == CurrentUserId)
            return BadRequest(new { message = "You cannot add yourself." });

        var targetUser = await _db.Users.FindAsync(req.UserId);
        if (targetUser == null) return NotFound(new { message = "User not found." });

        var exists = await _db.Contacts
            .AnyAsync(c => c.OwnerId == CurrentUserId && c.ContactUserId == req.UserId);
        if (exists) return Conflict(new { message = "Contact already added." });

        var contact = new Contact
        {
            OwnerId = CurrentUserId,
            ContactUserId = req.UserId
        };

        _db.Contacts.Add(contact);
        await _db.SaveChangesAsync();

        return Ok(new { message = "Contact added.", contactId = contact.Id });
    }

    // DELETE /api/contacts/{contactId} — remove a contact
    [HttpDelete("{contactId:int}")]
    public async Task<IActionResult> RemoveContact(int contactId)
    {
        var contact = await _db.Contacts
            .FirstOrDefaultAsync(c => c.Id == contactId && c.OwnerId == CurrentUserId);

        if (contact == null) return NotFound(new { message = "Contact not found." });

        _db.Contacts.Remove(contact);
        await _db.SaveChangesAsync();

        return Ok(new { message = "Contact removed." });
    }
}

public record AddContactRequest(int UserId);
