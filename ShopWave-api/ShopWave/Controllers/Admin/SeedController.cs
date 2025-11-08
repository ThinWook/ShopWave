using Microsoft.AspNetCore.Mvc;
using ShopWave.Models;
using ShopWave_api.Data;
using Microsoft.EntityFrameworkCore;

namespace ShopWave.Controllers.Admin
{
    /// <summary>
    /// Admin controller ?? qu?n lý database seeding
    /// </summary>
    [ApiController]
    [Route("api/admin/seed")]
    public class SeedController : ControllerBase
    {
        private readonly ShopWaveDbContext _context;
        private readonly IWebHostEnvironment _environment;
        private readonly ILogger<SeedController> _logger;
        private readonly ILoggerFactory _loggerFactory;

        public SeedController(
            ShopWaveDbContext context,
            IWebHostEnvironment environment,
            ILogger<SeedController> logger,
            ILoggerFactory loggerFactory)
        {
            _context = context;
            _environment = environment;
            _logger = logger;
            _loggerFactory = loggerFactory;
        }

        /// <summary>
        /// Seed location data (Provinces, Districts, Wards)
        /// POST /api/admin/seed/locations
        /// </summary>
        [HttpPost("locations")]
        public async Task<IActionResult> SeedLocations()
        {
            try
            {
                _logger.LogInformation("Manual location seeding triggered");
                
                var dbSeederLogger = _loggerFactory.CreateLogger<DbSeeder>();
                var seeder = new DbSeeder(_context, _environment, dbSeederLogger);
                await seeder.SeedAsync();
                
                // Get statistics
                var stats = new
                {
                    ProvinceCount = await _context.Provinces.CountAsync(),
                    DistrictCount = await _context.Districts.CountAsync(),
                    WardCount = await _context.Wards.CountAsync()
                };
                
                return Ok(new
                {
                    Success = true,
                    Message = "Location data seeded successfully",
                    Data = stats,
                    Timestamp = DateTime.UtcNow
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error seeding location data");
                return BadRequest(new
                {
                    Success = false,
                    Error = ex.Message,
                    Timestamp = DateTime.UtcNow
                });
            }
        }

        /// <summary>
        /// Get location data statistics
        /// GET /api/admin/seed/locations/stats
        /// </summary>
        [HttpGet("locations/stats")]
        public async Task<IActionResult> GetLocationStats()
        {
            try
            {
                var stats = new
                {
                    ProvinceCount = await _context.Provinces.CountAsync(),
                    DistrictCount = await _context.Districts.CountAsync(),
                    WardCount = await _context.Wards.CountAsync(),
                    HasData = await _context.Provinces.AnyAsync()
                };
                
                return Ok(new
                {
                    Success = true,
                    Data = stats,
                    Timestamp = DateTime.UtcNow
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting location stats");
                return BadRequest(new
                {
                    Success = false,
                    Error = ex.Message,
                    Timestamp = DateTime.UtcNow
                });
            }
        }

        /// <summary>
        /// Clear all location data
        /// DELETE /api/admin/seed/locations
        /// ?? WARNING: This will delete all location data!
        /// </summary>
        [HttpDelete("locations")]
        public async Task<IActionResult> ClearLocations()
        {
            try
            {
                _logger.LogWarning("Clearing all location data");
                
                // Delete in reverse order due to foreign key constraints
                await _context.Database.ExecuteSqlRawAsync("DELETE FROM Wards");
                await _context.Database.ExecuteSqlRawAsync("DELETE FROM Districts");
                await _context.Database.ExecuteSqlRawAsync("DELETE FROM Provinces");
                
                return Ok(new
                {
                    Success = true,
                    Message = "All location data cleared",
                    Timestamp = DateTime.UtcNow
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error clearing location data");
                return BadRequest(new
                {
                    Success = false,
                    Error = ex.Message,
                    Timestamp = DateTime.UtcNow
                });
            }
        }

        /// <summary>
        /// Re-seed location data (clear then seed)
        /// POST /api/admin/seed/locations/reseed
        /// ?? WARNING: This will delete and re-create all location data!
        /// </summary>
        [HttpPost("locations/reseed")]
        public async Task<IActionResult> ReseedLocations()
        {
            try
            {
                _logger.LogWarning("Re-seeding location data");
                
                // Clear existing data
                await _context.Database.ExecuteSqlRawAsync("DELETE FROM Wards");
                await _context.Database.ExecuteSqlRawAsync("DELETE FROM Districts");
                await _context.Database.ExecuteSqlRawAsync("DELETE FROM Provinces");
                
                // Seed new data
                var dbSeederLogger = _loggerFactory.CreateLogger<DbSeeder>();
                var seeder = new DbSeeder(_context, _environment, dbSeederLogger);
                await seeder.SeedAsync();
                
                // Get statistics
                var stats = new
                {
                    ProvinceCount = await _context.Provinces.CountAsync(),
                    DistrictCount = await _context.Districts.CountAsync(),
                    WardCount = await _context.Wards.CountAsync()
                };
                
                return Ok(new
                {
                    Success = true,
                    Message = "Location data re-seeded successfully",
                    Data = stats,
                    Timestamp = DateTime.UtcNow
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error re-seeding location data");
                return BadRequest(new
                {
                    Success = false,
                    Error = ex.Message,
                    Timestamp = DateTime.UtcNow
                });
            }
        }
    }
}
