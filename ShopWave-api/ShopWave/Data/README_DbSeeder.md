# DbSeeder - H??ng d?n s? d?ng

## Mô t?
`DbSeeder` là class dùng ?? seed (gieo) d? li?u ban ??u cho CSDL. Hi?n t?i nó seed d? li?u ??a gi?i hành chính Vi?t Nam (T?nh/Thành ph?, Qu?n/Huy?n, Ph??ng/Xã) t? các file JSON.

## C?u trúc
```
ShopWave/
  ??? Data/
  ?   ??? DbSeeder.cs          # Class chính ?? seed data
  ??? NewFolder/                # Th? m?c ch?a file JSON
      ??? tinh_tp.json         # 63 t?nh/thành ph?
      ??? quan_huyen.json      # Các qu?n/huy?n
      ??? xa_phuong.json       # Các ph??ng/xã
```

## Cách s? d?ng

### 1. S? d?ng trong Program.cs (Startup)

Thêm vào `Program.cs` ?? t? ??ng seed khi ?ng d?ng kh?i ??ng:

```csharp
// Trong Program.cs, sau khi build app
var app = builder.Build();

// Seed database on startup
try
{
    using var scope = app.Services.CreateScope();
    var context = scope.ServiceProvider.GetRequiredService<ShopWaveDbContext>();
    var environment = scope.ServiceProvider.GetRequiredService<IWebHostEnvironment>();
    var logger = scope.ServiceProvider.GetRequiredService<ILogger<Program>>();
    
    var seeder = new ShopWave_api.Data.DbSeeder(context, environment, logger);
    await seeder.SeedAsync();
}
catch (Exception ex)
{
    var logger = app.Services.GetRequiredService<ILogger<Program>>();
    logger.LogError(ex, "Error seeding database");
}
```

### 2. S? d?ng qua Controller/Service

B?n có th? inject và s? d?ng DbSeeder nh? m?t service:

**a) ??ng ký service trong Program.cs:**

```csharp
builder.Services.AddScoped<ShopWave_api.Data.DbSeeder>();
```

**b) S? d?ng trong Controller:**

```csharp
[ApiController]
[Route("api/[controller]")]
public class AdminController : ControllerBase
{
    private readonly DbSeeder _dbSeeder;

    public AdminController(DbSeeder dbSeeder)
    {
        _dbSeeder = dbSeeder;
    }

    [HttpPost("seed-locations")]
    public async Task<IActionResult> SeedLocations()
    {
        try
        {
            await _dbSeeder.SeedAsync();
            return Ok(new { message = "Location data seeded successfully" });
        }
        catch (Exception ex)
        {
            return BadRequest(new { error = ex.Message });
        }
    }
}
```

### 3. S? d?ng tr?c ti?p (Manual)

```csharp
using var scope = app.Services.CreateScope();
var context = scope.ServiceProvider.GetRequiredService<ShopWaveDbContext>();
var environment = scope.ServiceProvider.GetRequiredService<IWebHostEnvironment>();
var logger = scope.ServiceProvider.GetRequiredService<ILogger<Program>>();

var seeder = new ShopWave_api.Data.DbSeeder(context, environment, logger);
await seeder.SeedAsync();
```

## Chi ti?t ho?t ??ng

### Quy trình Seed:

1. **Ki?m tra CSDL**: `Database.EnsureCreatedAsync()` ??m b?o database t?n t?i
2. **Ki?m tra d? li?u ?ã có**: N?u `Provinces` table ?ã có data ? Skip
3. **Seed theo th? t?**:
   - **Provinces** (63 t?nh/thành) t? `tinh_tp.json`
   - **Districts** (711 qu?n/huy?n) t? `quan_huyen.json`
   - **Wards** (~11,000 ph??ng/xã) t? `xa_phuong.json`

### C?u trúc JSON:

JSON files có d?ng Dictionary v?i key là code và value là object:

```json
{
  "01": {
    "name": "Thành ph? Hà N?i",
    "type": "Thành ph? Trung ??ng",
    "code": "01",
    "parent_code": null
  }
}
```

### Batch Processing:

- Wards ???c x? lý theo batch (1000 records/l?n) ?? tránh v?n ?? memory
- Sau m?i batch, data ???c save vào database

## Các ?i?m quan tr?ng

### 1. Id Generation:
- `Id` ???c l?y t? field `code` trong JSON (parse sang int)
- Entity s? d?ng `DatabaseGeneratedOption.None` (không t? sinh Id)

### 2. Foreign Keys:
- `District.ProvinceId` = province's `code`
- `Ward.DistrictId` = district's `code`

### 3. Logging:
- M?i b??c ??u có logging chi ti?t
- Warning khi file không tìm th?y ho?c data invalid
- Info log s? l??ng records ???c seed

### 4. Error Handling:
- File không t?n t?i ? Log warning và continue
- Invalid code ? Log warning và skip record ?ó
- Exception ? Throw và log error

## Ki?m tra k?t qu?

Sau khi seed, b?n có th? ki?m tra b?ng SQL:

```sql
SELECT COUNT(*) FROM Provinces;  -- K?t qu?: 63
SELECT COUNT(*) FROM Districts;  -- K?t qu?: ~711
SELECT COUNT(*) FROM Wards;      -- K?t qu?: ~11,000

-- Ki?m tra m?i quan h?
SELECT p.Name, COUNT(d.Id) as DistrictCount
FROM Provinces p
LEFT JOIN Districts d ON d.ProvinceId = p.Id
GROUP BY p.Name;
```

## Tích h?p v?i LocationDataSeeder

N?u b?n ?ã có `LocationDataSeeder` service, b?n có th?:

1. **S? d?ng `DbSeeder`** cho seeding ??n gi?n
2. **S? d?ng `LocationDataSeeder`** cho seeding nâng cao v?i statistics và clear data

C? hai ??u ho?t ??ng t?t, ch? khác v? cách t? ch?c code và features b? sung.

## Troubleshooting

### File không tìm th?y
```
Province data file not found at: /path/to/file
```
? Ki?m tra file có t?n t?i trong folder `ShopWave/NewFolder/`

### Invalid code
```
Invalid province code: XX
```
? Có record trong JSON có code không ph?i s? nguyên h?p l?

### Data already exists
```
Location data already exists. Skipping seed.
```
? Database ?ã có data. N?u mu?n re-seed, xóa data trong Provinces table tr??c.

## Tóm t?t

`DbSeeder` cung c?p cách ??n gi?n và hi?u qu? ?? seed d? li?u ??a gi?i hành chính Vi?t Nam vào database. Class ???c thi?t k? ??:
- ? T? ??ng ki?m tra và b? qua n?u ?ã có data
- ? X? lý batch cho performance t?t
- ? Logging chi ti?t
- ? Error handling t?t
- ? D? tích h?p vào startup ho?c API endpoint
