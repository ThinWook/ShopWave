# API Documentation - Database Seeding

## Overview
API endpoints ?? qu?n lý vi?c seed d? li?u ??a gi?i hành chính Vi?t Nam (Provinces, Districts, Wards).

## Base URL
```
https://localhost:5001/api/admin/seed
```

---

## 1. Seed Location Data

Seed d? li?u ??a gi?i hành chính t? JSON files.

### Endpoint
```http
POST /api/admin/seed/locations
```

### Description
- ??c d? li?u t? các file JSON trong folder `NewFolder/`
- Seed Provinces (63 t?nh/thành)
- Seed Districts (~711 qu?n/huy?n)
- Seed Wards (~11,000 ph??ng/xã)
- **T? ??ng b? qua n?u d? li?u ?ã t?n t?i**

### Request
```bash
curl -X POST https://localhost:5001/api/admin/seed/locations
```

### Response (Success)
```json
{
  "success": true,
  "message": "Location data seeded successfully",
  "data": {
    "provinceCount": 63,
    "districtCount": 711,
    "wardCount": 11162
  },
  "timestamp": "2025-01-07T12:00:00Z"
}
```

### Response (Already Seeded)
```json
{
  "success": true,
  "message": "Location data seeded successfully",
  "data": {
    "provinceCount": 63,
    "districtCount": 711,
    "wardCount": 11162
  },
  "timestamp": "2025-01-07T12:00:00Z"
}
```

### Response (Error)
```json
{
  "success": false,
  "error": "Province data file not found at: /path/to/file",
  "timestamp": "2025-01-07T12:00:00Z"
}
```

---

## 2. Get Location Statistics

L?y th?ng kê d? li?u ??a gi?i hành chính hi?n t?i.

### Endpoint
```http
GET /api/admin/seed/locations/stats
```

### Description
Tr? v? s? l??ng Provinces, Districts, Wards trong database.

### Request
```bash
curl https://localhost:5001/api/admin/seed/locations/stats
```

### Response
```json
{
  "success": true,
  "data": {
    "provinceCount": 63,
    "districtCount": 711,
    "wardCount": 11162,
    "hasData": true
  },
  "timestamp": "2025-01-07T12:00:00Z"
}
```

---

## 3. Clear Location Data

?? **C?NH BÁO**: Xóa toàn b? d? li?u ??a gi?i hành chính!

### Endpoint
```http
DELETE /api/admin/seed/locations
```

### Description
Xóa t?t c? d? li?u Provinces, Districts, Wards. **S? d?ng c?n th?n!**

### Request
```bash
curl -X DELETE https://localhost:5001/api/admin/seed/locations
```

### Response
```json
{
  "success": true,
  "message": "All location data cleared",
  "timestamp": "2025-01-07T12:00:00Z"
}
```

---

## 4. Re-seed Location Data

?? **C?NH BÁO**: Xóa và t?o l?i toàn b? d? li?u!

### Endpoint
```http
POST /api/admin/seed/locations/reseed
```

### Description
- Xóa t?t c? d? li?u hi?n t?i
- Seed l?i t? ??u
- **S? d?ng khi mu?n refresh data**

### Request
```bash
curl -X POST https://localhost:5001/api/admin/seed/locations/reseed
```

### Response
```json
{
  "success": true,
  "message": "Location data re-seeded successfully",
  "data": {
    "provinceCount": 63,
    "districtCount": 711,
    "wardCount": 11162
  },
  "timestamp": "2025-01-07T12:00:00Z"
}
```

---

## Usage Examples

### PowerShell
```powershell
# Seed locations
Invoke-RestMethod -Uri "https://localhost:5001/api/admin/seed/locations" -Method POST

# Get stats
Invoke-RestMethod -Uri "https://localhost:5001/api/admin/seed/locations/stats"

# Clear data (c?n th?n!)
Invoke-RestMethod -Uri "https://localhost:5001/api/admin/seed/locations" -Method DELETE

# Re-seed (c?n th?n!)
Invoke-RestMethod -Uri "https://localhost:5001/api/admin/seed/locations/reseed" -Method POST
```

### JavaScript (Fetch)
```javascript
// Seed locations
const seedLocations = async () => {
  const response = await fetch('https://localhost:5001/api/admin/seed/locations', {
    method: 'POST'
  });
  const data = await response.json();
  console.log(data);
};

// Get stats
const getStats = async () => {
  const response = await fetch('https://localhost:5001/api/admin/seed/locations/stats');
  const data = await response.json();
  console.log(data);
};
```

### C# (HttpClient)
```csharp
using var client = new HttpClient();

// Seed locations
var response = await client.PostAsync(
    "https://localhost:5001/api/admin/seed/locations", 
    null
);
var result = await response.Content.ReadAsStringAsync();
Console.WriteLine(result);

// Get stats
var stats = await client.GetStringAsync(
    "https://localhost:5001/api/admin/seed/locations/stats"
);
Console.WriteLine(stats);
```

---

## Testing

### Swagger UI
Truy c?p: `https://localhost:5001/swagger`

Tìm section **SeedController** và test các endpoints.

### Manual Testing Steps

1. **Ki?m tra stats ban ??u**
   ```bash
   GET /api/admin/seed/locations/stats
   ```
   ? K?t qu?: `hasData: false`

2. **Seed d? li?u l?n ??u**
   ```bash
   POST /api/admin/seed/locations
   ```
   ? K?t qu?: Success v?i count

3. **Ki?m tra stats sau khi seed**
   ```bash
   GET /api/admin/seed/locations/stats
   ```
   ? K?t qu?: `hasData: true`, v?i counts chính xác

4. **Th? seed l?i (should skip)**
   ```bash
   POST /api/admin/seed/locations
   ```
   ? K?t qu?: V?n success nh?ng không seed l?i

5. **Clear và re-seed**
   ```bash
   POST /api/admin/seed/locations/reseed
   ```
   ? K?t qu?: Success v?i counts m?i

---

## Expected Data Counts

| Table | Expected Count | Description |
|-------|---------------|-------------|
| **Provinces** | 63 | 63 t?nh/thành ph? |
| **Districts** | ~711 | Qu?n/huy?n/th? xã |
| **Wards** | ~11,162 | Ph??ng/xã/th? tr?n |

---

## Error Codes

| Status Code | Meaning |
|------------|---------|
| 200 | Success |
| 400 | Bad Request - File not found ho?c invalid data |
| 500 | Internal Server Error - Database error |

---

## Security Considerations

?? **Production Environment:**

1. **Thêm Authorization**: Yêu c?u Admin role
   ```csharp
   [Authorize(Roles = "Admin")]
   public class SeedController : ControllerBase
   ```

2. **Rate Limiting**: Gi?i h?n s? l?n g?i API

3. **Audit Logging**: Log t?t c? các hành ??ng seed/delete

4. **Confirmation**: Yêu c?u confirmation tr??c khi delete/reseed

---

## Troubleshooting

### File not found
```
Province data file not found at: /path/to/file
```
**Gi?i pháp**: ??m b?o các file JSON t?n t?i trong `ShopWave/NewFolder/`

### Database connection error
```
Error during database seeding
```
**Gi?i pháp**: Ki?m tra connection string và database ?ã ???c migrate

### Foreign key constraint
```
DELETE statement conflicted with REFERENCE constraint
```
**Gi?i pháp**: Xóa theo th? t?: Wards ? Districts ? Provinces

---

## Best Practices

1. **First Time Setup**: S? d?ng `POST /locations` ?? seed
2. **Check Data**: Luôn check stats tr??c khi seed
3. **Backup**: Backup database tr??c khi clear/reseed
4. **Production**: Disable ho?c protect các endpoints nguy hi?m
5. **Monitoring**: Log và monitor t?t c? seeding operations
