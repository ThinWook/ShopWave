# DbSeeder Usage Examples

## CÁCH 1: Seed t? ??ng khi kh?i ??ng ?ng d?ng

Thêm ?o?n code này vào `Program.cs`, sau khi `var app = builder.Build();`

```csharp
try
{
    using var scope = app.Services.CreateScope();
    var context = scope.ServiceProvider.GetRequiredService<ShopWaveDbContext>();
    var environment = scope.ServiceProvider.GetRequiredService<IWebHostEnvironment>();
    var loggerFactory = scope.ServiceProvider.GetRequiredService<ILoggerFactory>();
    var dbSeederLogger = loggerFactory.CreateLogger<ShopWave_api.Data.DbSeeder>();
    
    var dbSeeder = new ShopWave_api.Data.DbSeeder(context, environment, dbSeederLogger);
    await dbSeeder.SeedAsync();
    
    var logger = scope.ServiceProvider.GetRequiredService<ILogger<Program>>();
    logger.LogInformation("? Database seeding completed");
}
catch (Exception ex)
{
    var logger = app.Services.GetRequiredService<ILogger<Program>>();
    logger.LogError(ex, "? Error seeding database");
}
```

---

## CÁCH 2: ??ng ký DbSeeder nh? m?t Service và s? d?ng trong Controller

### Trong Program.cs (tr??c khi build app):

```csharp
builder.Services.AddScoped<ShopWave_api.Data.DbSeeder>();
```

### T?o m?t Admin Controller ?? trigger seed:

```csharp
using Microsoft.AspNetCore.Mvc;
using ShopWave_api.Data;

namespace ShopWave.Controllers
{
    [ApiController]
    [Route("api/admin")]
    public class AdminSeedController : ControllerBase
    {
        private readonly DbSeeder _dbSeeder;
        private readonly ILogger<AdminSeedController> _logger;

        public AdminSeedController(DbSeeder dbSeeder, ILogger<AdminSeedController> logger)
        {
            _dbSeeder = dbSeeder;
            _logger = logger;
        }

        /// <summary>
        /// Seed location data (Provinces, Districts, Wards)
        /// POST /api/admin/seed-locations
        /// </summary>
        [HttpPost("seed-locations")]
        public async Task<IActionResult> SeedLocations()
        {
            try
            {
                _logger.LogInformation("Seeding location data...");
                await _dbSeeder.SeedAsync();
                
                return Ok(new
                {
                    Success = true,
                    Message = "Location data seeded successfully",
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
    }
}
```

---

## CÁCH 3: S? d?ng trong Migration ho?c Database Setup

T?o extension method trong `DatabaseExtensions.cs`:

```csharp
public static async Task SeedLocationsAsync(this IApplicationBuilder app)
{
    using var scope = app.ApplicationServices.CreateScope();
    var context = scope.ServiceProvider.GetRequiredService<ShopWaveDbContext>();
    var environment = scope.ServiceProvider.GetRequiredService<IWebHostEnvironment>();
    var loggerFactory = scope.ServiceProvider.GetRequiredService<ILoggerFactory>();
    var dbSeederLogger = loggerFactory.CreateLogger<ShopWave_api.Data.DbSeeder>();
    
    var dbSeeder = new ShopWave_api.Data.DbSeeder(context, environment, dbSeederLogger);
    await dbSeeder.SeedAsync();
}
```

S? d?ng trong `Program.cs`:

```csharp
await app.SeedLocationsAsync();
```

---

## K?T QU? MONG ??I

Sau khi ch?y seed, b?n s? th?y logs nh? sau:

```
[12:00:00 INF] Database ensured created
[12:00:00 INF] Starting location data seeding...
[12:00:01 INF] Seeded 63 provinces
[12:00:02 INF] Seeded 711 districts
[12:00:03 INF] Processed 1000 wards...
[12:00:04 INF] Processed 2000 wards...
...
[12:00:15 INF] Seeded all wards successfully
[12:00:15 INF] Location data seeding completed successfully
[12:00:15 INF] ? Database seeding completed
```

---

## KI?M TRA D? LI?U SAU KHI SEED

S? d?ng SQL ?? verify:

```sql
SELECT COUNT(*) AS ProvinceCount FROM Provinces;
-- K?t qu?: 63

SELECT COUNT(*) AS DistrictCount FROM Districts;
-- K?t qu?: ~711

SELECT COUNT(*) AS WardCount FROM Wards;
-- K?t qu?: ~11,000

-- Ki?m tra relationships
SELECT 
    p.Name AS Province,
    COUNT(DISTINCT d.Id) AS DistrictCount,
    COUNT(w.Id) AS WardCount
FROM Provinces p
LEFT JOIN Districts d ON d.ProvinceId = p.Id
LEFT JOIN Wards w ON w.DistrictId = d.Id
GROUP BY p.Name
ORDER BY p.Name;
```

---

## API Endpoints (N?u s? d?ng SeedController)

```bash
# Seed locations
POST https://localhost:5001/api/admin/seed/locations

# Get stats
GET https://localhost:5001/api/admin/seed/locations/stats

# Clear data (c?n th?n!)
DELETE https://localhost:5001/api/admin/seed/locations

# Re-seed (c?n th?n!)
POST https://localhost:5001/api/admin/seed/locations/reseed
```
