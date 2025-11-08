using System.Text.Json;
using Microsoft.EntityFrameworkCore;
using ShopWave.Models;

namespace ShopWave_api.Data
{
    /// <summary>
    /// Class để seed dữ liệu ban đầu cho CSDL
    /// </summary>
    public class DbSeeder
    {
        private readonly ShopWaveDbContext _context;
        private readonly IWebHostEnvironment _environment;
        private readonly ILogger<DbSeeder> _logger;

        public DbSeeder(
            ShopWaveDbContext context, 
            IWebHostEnvironment environment,
            ILogger<DbSeeder> logger)
        {
            _context = context;
            _environment = environment;
            _logger = logger;
        }

        /// <summary>
        /// Seed toàn bộ dữ liệu: Provinces, Districts, Wards
        /// </summary>
        public async Task SeedAsync()
        {
            try
            {
                // Đảm bảo CSDL tồn tại
                await _context.Database.EnsureCreatedAsync();
                _logger.LogInformation("Database ensured created");

                // Kiểm tra xem dữ liệu đã tồn tại chưa
                if (await _context.Provinces.AnyAsync())
                {
                    _logger.LogInformation("Location data already exists. Skipping seed.");
                    return; // Đã seed, không làm gì cả
                }

                _logger.LogInformation("Starting location data seeding...");

                // Seed theo thứ tự: Provinces -> Districts -> Wards
                await SeedProvincesAsync();
                await SeedDistrictsAsync();
                await SeedWardsAsync();

                _logger.LogInformation("Location data seeding completed successfully");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error during database seeding");
                throw;
            }
        }

        /// <summary>
        /// Seed Tỉnh/Thành phố từ tinh_tp.json
        /// </summary>
        private async Task SeedProvincesAsync()
        {
            // Lấy đường dẫn file (sử dụng NewFolder nơi chứa các file JSON)
            var filePath = Path.Combine(_environment.ContentRootPath, "NewFolder", "tinh_tp.json");
            
            if (!File.Exists(filePath))
            {
                _logger.LogWarning("Province data file not found at: {FilePath}", filePath);
                return;
            }

            // Đọc file JSON
            var provinceJson = await File.ReadAllTextAsync(filePath);
            
            // Deserialize nó thành Dictionary<string, LocationDto>
            var provinceData = JsonSerializer.Deserialize<Dictionary<string, LocationDto>>(
                provinceJson, 
                new JsonSerializerOptions { PropertyNameCaseInsensitive = true });

            if (provinceData == null || !provinceData.Any())
            {
                _logger.LogWarning("No province data found in JSON file");
                return;
            }

            // Chuyển đổi từ Dictionary sang List<Province>
            var provinces = provinceData.Select(p =>
            {
                // Parse code to int for Id
                if (!int.TryParse(p.Value.Code, out var id))
                {
                    _logger.LogWarning("Invalid province code: {Code}", p.Value.Code);
                    return null;
                }

                return new Province
                {
                    Id = id,
                    Name = p.Value.Name,
                    Code = p.Value.Code
                };
            })
            .Where(p => p != null)
            .ToList()!;

            // Thêm vào database
            await _context.Provinces.AddRangeAsync(provinces);
            await _context.SaveChangesAsync();

            _logger.LogInformation("Seeded {Count} provinces", provinces.Count);
        }

        /// <summary>
        /// Seed Quận/Huyện từ quan_huyen.json
        /// </summary>
        private async Task SeedDistrictsAsync()
        {
            // Lấy đường dẫn file
            var filePath = Path.Combine(_environment.ContentRootPath, "NewFolder", "quan_huyen.json");
            
            if (!File.Exists(filePath))
            {
                _logger.LogWarning("District data file not found at: {FilePath}", filePath);
                return;
            }

            // Đọc file JSON
            var districtJson = await File.ReadAllTextAsync(filePath);
            
            // Deserialize
            var districtData = JsonSerializer.Deserialize<Dictionary<string, LocationDto>>(
                districtJson, 
                new JsonSerializerOptions { PropertyNameCaseInsensitive = true });

            if (districtData == null || !districtData.Any())
            {
                _logger.LogWarning("No district data found in JSON file");
                return;
            }

            // Chuyển đổi sang List<District>
            var districts = districtData.Select(p =>
            {
                // Parse code to int for Id
                if (!int.TryParse(p.Value.Code, out var id))
                {
                    _logger.LogWarning("Invalid district code: {Code}", p.Value.Code);
                    return null;
                }

                // Parse parent_code to int for ProvinceId
                if (!int.TryParse(p.Value.ParentCode, out var provinceId))
                {
                    _logger.LogWarning("Invalid parent code for district {Code}", p.Value.Code);
                    return null;
                }

                return new District
                {
                    Id = id,
                    Name = p.Value.Name,
                    ProvinceId = provinceId
                };
            })
            .Where(d => d != null)
            .ToList()!;

            // Thêm vào database
            await _context.Districts.AddRangeAsync(districts);
            await _context.SaveChangesAsync();

            _logger.LogInformation("Seeded {Count} districts", districts.Count);
        }

        /// <summary>
        /// Seed Phường/Xã từ xa_phuong.json
        /// </summary>
        private async Task SeedWardsAsync()
        {
            // Lấy đường dẫn file
            var filePath = Path.Combine(_environment.ContentRootPath, "NewFolder", "xa_phuong.json");
            
            if (!File.Exists(filePath))
            {
                _logger.LogWarning("Ward data file not found at: {FilePath}", filePath);
                return;
            }

            // Đọc file JSON
            var wardJson = await File.ReadAllTextAsync(filePath);
            
            // Deserialize
            var wardData = JsonSerializer.Deserialize<Dictionary<string, LocationDto>>(
                wardJson, 
                new JsonSerializerOptions { PropertyNameCaseInsensitive = true });

            if (wardData == null || !wardData.Any())
            {
                _logger.LogWarning("No ward data found in JSON file");
                return;
            }

            // Xử lý theo batch để tránh vấn đề memory với dữ liệu lớn
            var batchSize = 1000;
            var wards = new List<Ward>();

            foreach (var p in wardData)
            {
                // Parse code to int for Id
                if (!int.TryParse(p.Value.Code, out var id))
                {
                    _logger.LogWarning("Invalid ward code: {Code}", p.Value.Code);
                    continue;
                }

                // Parse parent_code to int for DistrictId
                if (!int.TryParse(p.Value.ParentCode, out var districtId))
                {
                    _logger.LogWarning("Invalid parent code for ward {Code}", p.Value.Code);
                    continue;
                }

                wards.Add(new Ward
                {
                    Id = id,
                    Name = p.Value.Name,
                    DistrictId = districtId
                });

                // Save in batches
                if (wards.Count >= batchSize)
                {
                    await _context.Wards.AddRangeAsync(wards);
                    await _context.SaveChangesAsync();
                    _logger.LogInformation("Processed {Count} wards...", wards.Count);
                    wards.Clear();
                }
            }

            // Save remaining wards
            if (wards.Any())
            {
                await _context.Wards.AddRangeAsync(wards);
                await _context.SaveChangesAsync();
            }

            _logger.LogInformation("Seeded all wards successfully");
        }

        #region DTO Classes
        /// <summary>
        /// DTO để đọc dữ liệu từ JSON files
        /// Cấu trúc JSON là Dictionary<string, LocationDto>
        /// </summary>
        private class LocationDto
        {
            public string Name { get; set; } = string.Empty;
            public string Type { get; set; } = string.Empty;
            public string Code { get; set; } = string.Empty;
            public string Parent_Code { get; set; } = string.Empty;
            
            // Alias property for case-insensitive deserialization
            public string ParentCode
            {
                get => Parent_Code;
                set => Parent_Code = value;
            }
        }
        #endregion
    }
}
