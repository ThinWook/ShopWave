using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using ShopWave.Models;
using ShopWave.Models.DTOs;
using ShopWave.Models.Responses;
using System.ComponentModel.DataAnnotations;
using System.Security.Cryptography;
using System.Text;
using BCrypt.Net;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;

namespace ShopWave.Controllers
{
    [ApiController]
    [Route("api/v1/[controller]")]
    public class UsersController : ControllerBase
    {
        private readonly ShopWaveDbContext _context;
        private readonly ILogger<UsersController> _logger;

        public UsersController(ShopWaveDbContext context, ILogger<UsersController> logger)
        {
            _context = context;
            _logger = logger;
        }

        [Authorize]
        [HttpGet("me")]
        public async Task<IActionResult> GetMyProfile()
        {
            Guid userId;
            try
            {
                var uid = User.FindFirstValue("uid") ?? User.FindFirstValue(ClaimTypes.NameIdentifier) ?? User.FindFirstValue(JwtRegisteredClaimNames.Sub);
                if (!Guid.TryParse(uid, out userId))
                {
                    return Unauthorized(EnvelopeBuilder.Fail<object>(HttpContext, "UNAUTHORIZED", new[] { new ErrorItem("auth", "Unauthorized", "UNAUTHORIZED") }, 401));
                }

                var user = await _context.Users
                    .Where(u => u.Id == userId && u.IsActive)
                    .Select(u => new UserProfileDto
                    {
                        Id = u.Id,
                        Email = u.Email,
                        FullName = u.FullName,
                        Phone = u.Phone,
                        MediaId = null,
                        Role = u.Role,
                        CreatedAt = u.CreatedAt,
                        TotalOrders = u.Orders.Count(),
                        TotalWishlistItems = u.WishlistItems.Count()
                    })
                    .FirstOrDefaultAsync();

                if (user == null)
                {
                    return NotFound(EnvelopeBuilder.Fail<object>(HttpContext, "NOT_FOUND", new[] { new ErrorItem("id", "User not found", "NOT_FOUND") }, 404));
                }

                return Ok(EnvelopeBuilder.Ok(HttpContext, "USER_PROFILE_RETRIEVED", user));
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving user profile");
                return StatusCode(500, EnvelopeBuilder.Fail<object>(HttpContext, "INTERNAL_ERROR", new[] { new ErrorItem("server", "Unexpected error", "INTERNAL_ERROR") }, 500));
            }
        }

        [Authorize]
        [HttpPut("me")]
        public async Task<IActionResult> UpdateMyProfile([FromBody] UpdateProfileRequest request)
        {
            try
            {
                var uid = User.FindFirstValue("uid") ?? User.FindFirstValue(ClaimTypes.NameIdentifier) ?? User.FindFirstValue(JwtRegisteredClaimNames.Sub);
                if (!Guid.TryParse(uid, out var userId))
                {
                    return Unauthorized(EnvelopeBuilder.Fail<object>(HttpContext, "UNAUTHORIZED", new[] { new ErrorItem("auth", "Unauthorized", "UNAUTHORIZED") }, 401));
                }

                var user = await _context.Users.FindAsync(userId);
                if (user == null || !user.IsActive)
                {
                    return NotFound(EnvelopeBuilder.Fail<object>(HttpContext, "NOT_FOUND", new[] { new ErrorItem("id", "User not found", "NOT_FOUND") }, 404));
                }

                user.FullName = request.FullName.Trim();
                user.Phone = request.Phone?.Trim();
                user.UpdatedAt = DateTime.UtcNow;
                await _context.SaveChangesAsync();

                var dto = new UserDto
                {
                    Id = user.Id,
                    Email = user.Email,
                    FullName = user.FullName,
                    Phone = user.Phone,
                    MediaId = null,
                    Role = user.Role,
                    IsActive = user.IsActive,
                    CreatedAt = user.CreatedAt
                };

                return Ok(EnvelopeBuilder.Ok(HttpContext, "USER_PROFILE_UPDATED", dto));
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error updating user profile");
                return StatusCode(500, EnvelopeBuilder.Fail<object>(HttpContext, "INTERNAL_ERROR", new[] { new ErrorItem("server", "Unexpected error", "INTERNAL_ERROR") }, 500));
            }
        }

        [Authorize]
        [HttpPut("me/password")]
        public async Task<IActionResult> ChangePassword([FromBody] ChangePasswordRequest request)
        {
            Guid userId;
            try
            {
                var uid = User.FindFirstValue("uid") ?? User.FindFirstValue(ClaimTypes.NameIdentifier) ?? User.FindFirstValue(JwtRegisteredClaimNames.Sub);
                if (!Guid.TryParse(uid, out userId))
                {
                    return Unauthorized(EnvelopeBuilder.Fail<object>(HttpContext, "UNAUTHORIZED", new[] { new ErrorItem("auth", "Unauthorized", "UNAUTHORIZED") }, 401));
                }

                var user = await _context.Users.FindAsync(userId);
                if (user == null || !user.IsActive)
                {
                    return NotFound(EnvelopeBuilder.Fail<object>(HttpContext, "NOT_FOUND", new[] { new ErrorItem("id", "User not found", "NOT_FOUND") }, 404));
                }

                if (!BCrypt.Net.BCrypt.Verify(request.CurrentPassword, user.PasswordHash))
                {
                    return BadRequest(EnvelopeBuilder.Fail<object>(HttpContext, "INVALID_CREDENTIALS", new[] { new ErrorItem("currentPassword", "Password incorrect", "PASSWORD_INCORRECT") }, 400));
                }

                user.PasswordHash = BCrypt.Net.BCrypt.HashPassword(request.NewPassword);
                user.UpdatedAt = DateTime.UtcNow;

                // revoke other sessions
                var otherSessions = await _context.UserSessions
                    .Where(s => s.UserId == userId)
                    .ToListAsync();
                if (otherSessions.Any()) _context.UserSessions.RemoveRange(otherSessions);
                await _context.SaveChangesAsync();

                return Ok(EnvelopeBuilder.Ok(HttpContext, "USER_PASSWORD_CHANGED", new { }));
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error changing password");
                return StatusCode(500, EnvelopeBuilder.Fail<object>(HttpContext, "INTERNAL_ERROR", new[] { new ErrorItem("server", "Unexpected error", "INTERNAL_ERROR") }, 500));
            }
        }

        [Authorize(Roles = "Admin")]
        [HttpGet("{id}")]
        public async Task<IActionResult> GetUserById(Guid id)
        {
            try
            {
                var user = await _context.Users
                    .Where(u => u.Id == id && u.IsActive)
                    .Select(u => new UserDto
                    {
                        Id = u.Id,
                        Email = u.Email,
                        FullName = u.FullName,
                        Phone = u.Phone,
                        MediaId = null,
                        Role = u.Role,
                        IsActive = u.IsActive,
                        CreatedAt = u.CreatedAt
                    })
                    .FirstOrDefaultAsync();

                if (user == null)
                {
                    return NotFound(EnvelopeBuilder.Fail<object>(HttpContext, "NOT_FOUND", new[] { new ErrorItem("id", "User not found", "NOT_FOUND") }, 404));
                }

                return Ok(EnvelopeBuilder.Ok(HttpContext, "USER_DETAIL_RETRIEVED", user));
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving user {UserId}", id);
                return StatusCode(500, EnvelopeBuilder.Fail<object>(HttpContext, "INTERNAL_ERROR", new[] { new ErrorItem("server", "Unexpected error", "INTERNAL_ERROR") }, 500));
            }
        }

        [Authorize(Roles = "Admin")]
        [HttpGet]
        public async Task<IActionResult> GetUsers([FromQuery] int page = 1, [FromQuery] int pageSize = 20, [FromQuery] string? search = null, [FromQuery] string? role = null)
        {
            try
            {
                if (page < 1) page = 1;
                if (pageSize <= 0 || pageSize > 100) pageSize = 20;

                var query = _context.Users.Where(u => u.IsActive);
                if (!string.IsNullOrWhiteSpace(search)) query = query.Where(u => u.FullName.Contains(search) || u.Email.Contains(search));
                if (!string.IsNullOrWhiteSpace(role)) query = query.Where(u => u.Role == role);

                var latestUpdated = await query.MaxAsync(u => (DateTime?)u.UpdatedAt) ?? DateTime.MinValue;
                var total = await query.CountAsync();
                var totalPages = total == 0 ? 0 : (int)Math.Ceiling(total / (double)pageSize);
                if (totalPages > 0 && page > totalPages) page = totalPages;
                
                var etagRaw = $"users-{total}-{latestUpdated:O}-{page}-{pageSize}-{search}-{role}";
                var etag = Convert.ToHexString(SHA256.HashData(Encoding.UTF8.GetBytes(etagRaw)));
                if (Request.Headers.TryGetValue("If-None-Match", out var inm) && inm == etag) return StatusCode(304);

                var items = await query
                    .OrderByDescending(u => u.CreatedAt)
                    .Skip((page - 1) * pageSize)
                    .Take(pageSize)
                    .Select(u => new UserDto
                    {
                        Id = u.Id,
                        Email = u.Email,
                        FullName = u.FullName,
                        Phone = u.Phone,
                        MediaId = null,
                        Role = u.Role,
                        IsActive = u.IsActive,
                        CreatedAt = u.CreatedAt
                    })
                    .ToListAsync();

                Response.Headers.ETag = etag;

                var paged = new PagedResult<UserDto>(
                    Data: items,
                    CurrentPage: page,
                    TotalPages: totalPages,
                    PageSize: pageSize,
                    TotalRecords: total,
                    HasPreviousPage: page > 1,
                    HasNextPage: page < totalPages,
                    AppliedFilters: new { search, role },
                    LastUpdatedAt: latestUpdated
                );
                return Ok(EnvelopeBuilder.Ok(HttpContext, "USER_LIST_RETRIEVED", paged));
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving users list");
                return StatusCode(500, EnvelopeBuilder.Fail<object>(HttpContext, "INTERNAL_ERROR", new[] { new ErrorItem("server", "Unexpected error", "INTERNAL_ERROR") }, 500));
            }
        }
    }

    public class UpdateProfileRequest
    {
        [Required]
        [MaxLength(255)]
        public string FullName { get; set; } = string.Empty;
        [Phone]
        [MaxLength(20)]
        public string? Phone { get; set; }
        [MaxLength(500)]
        public string? AvatarUrl { get; set; }
    }

    public class ChangePasswordRequest
    {
        [Required]
        public string CurrentPassword { get; set; } = string.Empty;
        [Required]
        [MinLength(8)]
        public string NewPassword { get; set; } = string.Empty;
        [Required]
        [Compare("NewPassword")]
        public string ConfirmPassword { get; set; } = string.Empty;
    }

    public class UserProfileDto : UserDto
    {
        public int TotalOrders { get; set; }
        public int TotalWishlistItems { get; set; }
    }
}