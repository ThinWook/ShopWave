using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using ShopWave.DTOs;
using ShopWave.Models;
using ShopWave.Services;

namespace ShopWave.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class MediaController : ControllerBase
    {
        private readonly IMediaService _mediaService;
        private readonly ShopWaveDbContext _context;

        public MediaController(IMediaService mediaService, ShopWaveDbContext context)
        {
            _mediaService = mediaService;
            _context = context;
        }

        [HttpPost("upload")]
        [ProducesResponseType(typeof(MediaUploadDto), StatusCodes.Status201Created)]
        [ProducesResponseType(StatusCodes.Status400BadRequest)]
        public async Task<IActionResult> UploadMedia([FromForm] IFormFile file, [FromForm] string? category)
        {
            if (file == null || file.Length == 0)
            {
                return BadRequest("No file uploaded.");
            }

            try
            {
                var createdMedia = await _mediaService.UploadFileAsync(file, category);

                var result = new MediaUploadDto
                {
                    Id = createdMedia.Id,
                    Url = createdMedia.Url
                };

                return CreatedAtAction(nameof(GetMediaById), new { id = result.Id }, result);
            }
            catch (ArgumentException ex)
            {
                return BadRequest(ex.Message);
            }
            catch
            {
                return StatusCode(500, "An internal error occurred.");
            }
        }

        [HttpPost("upload-many")]
        [ProducesResponseType(typeof(IEnumerable<long>), StatusCodes.Status201Created)]
        [ProducesResponseType(StatusCodes.Status400BadRequest)]
        public async Task<IActionResult> UploadMany([FromForm] List<IFormFile> files, [FromForm] string? category)
        {
            if (files == null || files.Count == 0)
            {
                return BadRequest("No files uploaded.");
            }

            try
            {
                var created = await _mediaService.UploadFilesAsync(files, category);
                var ids = created.Select(m => m.Id).ToList();
                return StatusCode(StatusCodes.Status201Created, ids);
            }
            catch (ArgumentException ex)
            {
                return BadRequest(ex.Message);
            }
            catch
            {
                return StatusCode(500, "An internal error occurred.");
            }
        }

        [HttpGet("{id}")]
        [ProducesResponseType(typeof(MediaUploadDto), StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        public async Task<IActionResult> GetMediaById(long id)
        {
            var media = await _context.Media.FindAsync(id);
            if (media == null)
            {
                return NotFound();
            }

            var result = new MediaUploadDto
            {
                Id = media.Id,
                Url = media.Url
            };
            return Ok(result);
        }
    }
}
