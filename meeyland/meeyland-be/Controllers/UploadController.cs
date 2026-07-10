using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

namespace meeyland_be.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class UploadController : ControllerBase
{
    private readonly IWebHostEnvironment _env;
    private const long DefaultChunkSize = 5 * 1024 * 1024; // 5 MB chunks

    public UploadController(IWebHostEnvironment env)
    {
        _env = env;
    }

    private string WebRootPath => _env.WebRootPath ?? Path.Combine(_env.ContentRootPath, "wwwroot");
    private string UploadsFolder => Path.Combine(WebRootPath, "uploads");
    private string TempFolder => Path.Combine(UploadsFolder, "temp");

    public class InitiateRequest
    {
        public string FileName { get; set; } = string.Empty;
        public long FileSize { get; set; }
        public string ContentType { get; set; } = string.Empty;
    }

    // POST /api/upload/initiate
    [HttpPost("initiate")]
    public IActionResult Initiate([FromBody] InitiateRequest req)
    {
        if (string.IsNullOrWhiteSpace(req.FileName))
            return BadRequest(new { message = "FileName is required." });

        if (req.FileSize <= 0)
            return BadRequest(new { message = "FileSize must be greater than 0." });

        var uploadId = Guid.NewGuid().ToString();
        var totalChunks = (int)Math.Ceiling((double)req.FileSize / DefaultChunkSize);

        // Ensure temp folder for this upload session exists
        var sessionTempPath = Path.Combine(TempFolder, uploadId);
        if (!Directory.Exists(sessionTempPath))
            Directory.CreateDirectory(sessionTempPath);

        return Ok(new
        {
            uploadId,
            chunkSize = DefaultChunkSize,
            totalChunks
        });
    }

    // GET /api/upload/status?uploadId={uploadId}
    [HttpGet("status")]
    public IActionResult GetStatus([FromQuery] string uploadId)
    {
        if (string.IsNullOrWhiteSpace(uploadId))
            return BadRequest(new { message = "uploadId is required." });

        var sessionTempPath = Path.Combine(TempFolder, uploadId);
        if (!Directory.Exists(sessionTempPath))
            return NotFound(new { message = "Upload session not found." });

        var uploadedChunks = Directory.GetFiles(sessionTempPath, "*.part")
            .Select(Path.GetFileNameWithoutExtension)
            .Select(name => int.TryParse(name, out var idx) ? (int?)idx : null)
            .Where(idx => idx.HasValue)
            .Select(idx => idx!.Value)
            .OrderBy(idx => idx)
            .ToList();

        return Ok(new { uploadedChunks });
    }

    // POST /api/upload/chunk
    [HttpPost("chunk")]
    [DisableRequestSizeLimit] // Disable ASP.NET limit since we enforce chunk limits or chunk-based sizing
    public async Task<IActionResult> UploadChunk(
        [FromForm] string uploadId,
        [FromForm] int chunkIndex,
        IFormFile chunk)
    {
        if (string.IsNullOrWhiteSpace(uploadId))
            return BadRequest(new { message = "uploadId is required." });

        if (chunk == null || chunk.Length == 0)
            return BadRequest(new { message = "Chunk file is empty." });

        var sessionTempPath = Path.Combine(TempFolder, uploadId);
        if (!Directory.Exists(sessionTempPath))
            return NotFound(new { message = "Upload session not found." });

        var chunkFilePath = Path.Combine(sessionTempPath, $"{chunkIndex}.part");

        // Write the chunk to file
        using (var stream = new FileStream(chunkFilePath, FileMode.Create, FileAccess.Write, FileShare.None))
        {
            await chunk.CopyToAsync(stream);
        }

        return Ok(new { message = $"Chunk {chunkIndex} uploaded successfully." });
    }

    public class CompleteRequest
    {
        public string UploadId { get; set; } = string.Empty;
        public string FileName { get; set; } = string.Empty;
        public int TotalChunks { get; set; }
    }

    // POST /api/upload/complete
    [HttpPost("complete")]
    public async Task<IActionResult> Complete([FromBody] CompleteRequest req)
    {
        if (string.IsNullOrWhiteSpace(req.UploadId))
            return BadRequest(new { message = "UploadId is required." });

        if (string.IsNullOrWhiteSpace(req.FileName))
            return BadRequest(new { message = "FileName is required." });

        var sessionTempPath = Path.Combine(TempFolder, req.UploadId);
        if (!Directory.Exists(sessionTempPath))
            return NotFound(new { message = "Upload session not found or already completed." });

        // Sanitize the filename to prevent directory traversal
        var safeFileName = Path.GetFileName(req.FileName);
        foreach (var c in Path.GetInvalidFileNameChars())
        {
            safeFileName = safeFileName.Replace(c, '_');
        }

        var finalFileName = $"{req.UploadId}_{safeFileName}";
        var finalFilePath = Path.Combine(UploadsFolder, finalFileName);

        // Verify all chunks exist
        for (int i = 0; i < req.TotalChunks; i++)
        {
            var chunkPath = Path.Combine(sessionTempPath, $"{i}.part");
            if (!System.IO.File.Exists(chunkPath))
            {
                return BadRequest(new { message = $"Missing chunk {i}. Cannot complete upload." });
            }
        }

        // Merge the chunks into the final file in a memory-efficient manner
        using (var outputStream = new FileStream(finalFilePath, FileMode.Create, FileAccess.Write, FileShare.None))
        {
            for (int i = 0; i < req.TotalChunks; i++)
            {
                var chunkPath = Path.Combine(sessionTempPath, $"{i}.part");
                using (var inputStream = new FileStream(chunkPath, FileMode.Open, FileAccess.Read, FileShare.Read))
                {
                    await inputStream.CopyToAsync(outputStream);
                }
            }
        }

        // Cleanup temporary chunk folder
        try
        {
            Directory.Delete(sessionTempPath, true);
        }
        catch (Exception ex)
        {
            // Log warning but don't fail the upload
            Console.WriteLine($"Warning: Failed to delete temp upload directory {sessionTempPath}: {ex.Message}");
        }

        var attachmentUrl = $"/uploads/{finalFileName}";

        return Ok(new { attachmentUrl });
    }
}
