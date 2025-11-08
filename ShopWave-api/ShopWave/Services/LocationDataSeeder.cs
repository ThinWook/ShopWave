using System.Text.Json;
using Microsoft.EntityFrameworkCore;
using ShopWave.Models;

namespace ShopWave.Services
{
    /// <summary>
    /// Service ?? seed d? li?u ??a gi?i hành chính Vi?t Nam t? JSON files
    /// </summary>
    public class LocationDataSeeder
    {
        private readonly ShopWaveDbContext _context;
        private readonly ILogger<LocationDataSeeder> _logger;
        private readonly string _dataPath;

        public LocationDataSeeder(
            ShopWaveDbContext context, 
            ILogger<LocationDataSeeder> logger,
            IWebHostEnvironment env)
        {
            _context = context;
            _logger = logger;
            _dataPath = Path.Combine(env.ContentRootPath, "NewFolder");
        }

        /// <summary>
        /// Seed toàn b? d? li?u ??a gi?i hành chính (Provinces, Districts, Wards)
        /// </summary>
        public async Task<LocationSeedResult> SeedAllAsync()
        {
            var result = new LocationSeedResult();
            var startTime = DateTime.UtcNow;

            try
            {
                _logger.LogInformation("Starting location data seeding...");

                // Check if data already exists
                var existingProvinces = await _context.Provinces.AnyAsync();
                if (existingProvinces)
                {
                    _logger.LogWarning("Location data already exists. Skipping seed.");
                    result.Message = "Location data already exists";
                    result.Success = false;
                    return result;
                }

                // Seed in order: Provinces -> Districts -> Wards
                result.ProvincesAdded = await SeedProvincesAsync();
                result.DistrictsAdded = await SeedDistrictsAsync();
                result.WardsAdded = await SeedWardsAsync();

                result.Success = true;
                result.Duration = DateTime.UtcNow - startTime;
                result.Message = "Location data seeded successfully";

                _logger.LogInformation(
                    "Location seeding completed: {Provinces} provinces, {Districts} districts, {Wards} wards in {Duration}ms",
                    result.ProvincesAdded,
                    result.DistrictsAdded,
                    result.WardsAdded,
                    result.Duration.TotalMilliseconds
                );

                return result;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error seeding location data");
                result.Success = false;
                result.Message = $"Error: {ex.Message}";
                result.Duration = DateTime.UtcNow - startTime;
                throw;
            }
        }

        /// <summary>
        /// Seed Provinces from tinh_tp.json
        /// </summary>
        private async Task<int> SeedProvincesAsync()
        {
            var filePath = Path.Combine(_dataPath, "tinh_tp.json");
            _logger.LogInformation("Seeding provinces from {FilePath}", filePath);

            if (!File.Exists(filePath))
            {
                throw new FileNotFoundException($"Province data file not found: {filePath}");
            }

            var jsonText = await File.ReadAllTextAsync(filePath);
            var provinceData = JsonSerializer.Deserialize<Dictionary<string, ProvinceJson>>(jsonText);

            if (provinceData == null || !provinceData.Any())
            {
                throw new InvalidOperationException("No province data found in JSON file");
            }

            var provinces = new List<Province>();
            foreach (var kvp in provinceData)
            {
                var data = kvp.Value;
                if (!int.TryParse(data.Code, out var id))
                {
                    _logger.LogWarning("Invalid province code: {Code}", data.Code);
                    continue;
                }

                provinces.Add(new Province
                {
                    Id = id,
                    Name = data.Name,
                    Code = data.Code
                });
            }

            await _context.Provinces.AddRangeAsync(provinces);
            await _context.SaveChangesAsync();

            _logger.LogInformation("Added {Count} provinces", provinces.Count);
            return provinces.Count;
        }

        /// <summary>
        /// Seed Districts from quan_huyen.json
        /// </summary>
        private async Task<int> SeedDistrictsAsync()
        {
            var filePath = Path.Combine(_dataPath, "quan_huyen.json");
            _logger.LogInformation("Seeding districts from {FilePath}", filePath);

            if (!File.Exists(filePath))
            {
                throw new FileNotFoundException($"District data file not found: {filePath}");
            }

            var jsonText = await File.ReadAllTextAsync(filePath);
            var districtData = JsonSerializer.Deserialize<Dictionary<string, DistrictJson>>(jsonText);

            if (districtData == null || !districtData.Any())
            {
                throw new InvalidOperationException("No district data found in JSON file");
            }

            var districts = new List<District>();
            foreach (var kvp in districtData)
            {
                var data = kvp.Value;
                if (!int.TryParse(data.Code, out var id))
                {
                    _logger.LogWarning("Invalid district code: {Code}", data.Code);
                    continue;
                }

                if (!int.TryParse(data.ParentCode, out var provinceId))
                {
                    _logger.LogWarning("Invalid parent code for district {Code}: {ParentCode}", data.Code, data.ParentCode);
                    continue;
                }

                districts.Add(new District
                {
                    Id = id,
                    Name = data.Name,
                    ProvinceId = provinceId
                });
            }

            await _context.Districts.AddRangeAsync(districts);
            await _context.SaveChangesAsync();

            _logger.LogInformation("Added {Count} districts", districts.Count);
            return districts.Count;
        }

        /// <summary>
        /// Seed Wards from xa_phuong.json
        /// </summary>
        private async Task<int> SeedWardsAsync()
        {
            var filePath = Path.Combine(_dataPath, "xa_phuong.json");
            _logger.LogInformation("Seeding wards from {FilePath}", filePath);

            if (!File.Exists(filePath))
            {
                throw new FileNotFoundException($"Ward data file not found: {filePath}");
            }

            var jsonText = await File.ReadAllTextAsync(filePath);
            var wardData = JsonSerializer.Deserialize<Dictionary<string, WardJson>>(jsonText);

            if (wardData == null || !wardData.Any())
            {
                throw new InvalidOperationException("No ward data found in JSON file");
            }

            var wards = new List<Ward>();
            var batchSize = 1000; // Process in batches to avoid memory issues
            var batch = new List<Ward>();

            foreach (var kvp in wardData)
            {
                var data = kvp.Value;
                if (!int.TryParse(data.Code, out var id))
                {
                    _logger.LogWarning("Invalid ward code: {Code}", data.Code);
                    continue;
                }

                if (!int.TryParse(data.ParentCode, out var districtId))
                {
                    _logger.LogWarning("Invalid parent code for ward {Code}: {ParentCode}", data.Code, data.ParentCode);
                    continue;
                }

                batch.Add(new Ward
                {
                    Id = id,
                    Name = data.Name,
                    DistrictId = districtId
                });

                if (batch.Count >= batchSize)
                {
                    await _context.Wards.AddRangeAsync(batch);
                    await _context.SaveChangesAsync();
                    wards.AddRange(batch);
                    _logger.LogInformation("Processed {Count} wards...", wards.Count);
                    batch.Clear();
                }
            }

            // Save remaining batch
            if (batch.Any())
            {
                await _context.Wards.AddRangeAsync(batch);
                await _context.SaveChangesAsync();
                wards.AddRange(batch);
            }

            _logger.LogInformation("Added {Count} wards", wards.Count);
            return wards.Count;
        }

        /// <summary>
        /// Clear all location data (for re-seeding)
        /// </summary>
        public async Task ClearAllAsync()
        {
            _logger.LogWarning("Clearing all location data...");

            // Delete in reverse order due to foreign key constraints
            await _context.Database.ExecuteSqlRawAsync("DELETE FROM Wards");
            await _context.Database.ExecuteSqlRawAsync("DELETE FROM Districts");
            await _context.Database.ExecuteSqlRawAsync("DELETE FROM Provinces");

            _logger.LogInformation("All location data cleared");
        }

        /// <summary>
        /// Get current location data statistics
        /// </summary>
        public async Task<LocationStats> GetStatsAsync()
        {
            return new LocationStats
            {
                ProvinceCount = await _context.Provinces.CountAsync(),
                DistrictCount = await _context.Districts.CountAsync(),
                WardCount = await _context.Wards.CountAsync()
            };
        }
    }

    #region JSON Models
    public class ProvinceJson
    {
        public string Name { get; set; } = string.Empty;
        public string Code { get; set; } = string.Empty;
        public string Slug { get; set; } = string.Empty;
        public string Type { get; set; } = string.Empty;
        public string Name_With_Type { get; set; } = string.Empty;
    }

    public class DistrictJson
    {
        public string Name { get; set; } = string.Empty;
        public string Code { get; set; } = string.Empty;
        public string Parent_Code { get; set; } = string.Empty;
        public string Slug { get; set; } = string.Empty;
        public string Type { get; set; } = string.Empty;
        public string Name_With_Type { get; set; } = string.Empty;
        public string Path { get; set; } = string.Empty;
        public string Path_With_Type { get; set; } = string.Empty;

        // Property aliases for case-insensitive deserialization
        public string ParentCode
        {
            get => Parent_Code;
            set => Parent_Code = value;
        }
    }

    public class WardJson
    {
        public string Name { get; set; } = string.Empty;
        public string Code { get; set; } = string.Empty;
        public string Parent_Code { get; set; } = string.Empty;
        public string Slug { get; set; } = string.Empty;
        public string Type { get; set; } = string.Empty;
        public string Name_With_Type { get; set; } = string.Empty;
        public string Path { get; set; } = string.Empty;
        public string Path_With_Type { get; set; } = string.Empty;

        // Property alias for case-insensitive deserialization
        public string ParentCode
        {
            get => Parent_Code;
            set => Parent_Code = value;
        }
    }
    #endregion

    #region Result Models
    public class LocationSeedResult
    {
        public bool Success { get; set; }
        public string Message { get; set; } = string.Empty;
        public int ProvincesAdded { get; set; }
        public int DistrictsAdded { get; set; }
        public int WardsAdded { get; set; }
        public TimeSpan Duration { get; set; }
    }

    public class LocationStats
    {
        public int ProvinceCount { get; set; }
        public int DistrictCount { get; set; }
        public int WardCount { get; set; }
    }
    #endregion
}
