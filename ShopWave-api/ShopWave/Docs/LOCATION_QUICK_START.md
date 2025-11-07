# ?? Location & Shipping - Quick Start Guide

## Step 1: Create Migration & Update Database

```bash
cd ShopWave
dotnet ef migrations add AddLocationAndShippingTables
dotnet ef database update
```

## Step 2: Seed Location Data

Execute the seed script:
```bash
sqlcmd -S (localdb)\MSSQLLocalDB -d ShopWaveDb -i Docs\SQL_SeedLocationData.sql
```

Or copy and run in SSMS: `Docs\SQL_SeedLocationData.sql`

## Step 3: Verify Data

```sql
-- Quick check
SELECT COUNT(*) AS ProvinceCount FROM Provinces;
SELECT COUNT(*) AS DistrictCount FROM Districts;
SELECT COUNT(*) AS WardCount FROM Wards;
SELECT * FROM ShippingRates ORDER BY Province;
```

Expected results:
- Provinces: 10
- Districts: 39
- Wards: 34
- ShippingRates: 9 (including DEFAULT)

## Step 4: Test API Endpoints

### Test 1: Get Provinces
```bash
curl http://localhost:5000/api/v1/provinces
```

### Test 2: Get Districts (HCM)
```bash
curl "http://localhost:5000/api/v1/districts?provinceId=50"
```

### Test 3: Get Wards (Qu?n 2)
```bash
curl "http://localhost:5000/api/v1/wards?districtId=761"
```

### Test 4: Get Shipping Fee
```bash
curl "http://localhost:5000/api/v1/shipping-fee?province=H?%20Chí%20Minh"
```

Expected: 20,000 VND

```bash
curl "http://localhost:5000/api/v1/shipping-fee?province=Unknown%20Province"
```

Expected: 30,000 VND (DEFAULT rate)

## Step 5: Test Admin Endpoints

First, login as admin to get token:
```bash
curl -X POST http://localhost:5000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@shopwave.com","password":"admin123"}'
```

Save the token, then test:

### Get All Rates
```bash
curl http://localhost:5000/api/v1/admin/shipping-rates \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Create/Update Rate
```bash
curl -X POST http://localhost:5000/api/v1/admin/shipping-rates \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"province":"Bình D??ng","fee":22000}'
```

### Delete Rate
```bash
curl -X DELETE http://localhost:5000/api/v1/admin/shipping-rates/{RATE_ID} \
  -H "Authorization: Bearer YOUR_TOKEN"
```

## Quick Integration Example

### Frontend: Address Selection Form

```html
<form id="addressForm">
  <select id="province" onchange="loadDistricts()">
    <option value="">-- Ch?n T?nh/Thành --</option>
  </select>
  
  <select id="district" onchange="loadWards()">
    <option value="">-- Ch?n Qu?n/Huy?n --</option>
  </select>
  
  <select id="ward">
    <option value="">-- Ch?n Ph??ng/Xã --</option>
  </select>
  
  <div id="shippingFee"></div>
</form>

<script>
// Load provinces on page load
fetch('/api/v1/provinces')
  .then(r => r.json())
  .then(data => {
    const select = document.getElementById('province');
    data.data.forEach(p => {
      select.add(new Option(p.name, p.id));
    });
  });

// Load districts when province changes
function loadDistricts() {
  const provinceId = document.getElementById('province').value;
  const provinceName = document.getElementById('province').selectedOptions[0].text;
  
  fetch(`/api/v1/districts?provinceId=${provinceId}`)
    .then(r => r.json())
    .then(data => {
      const select = document.getElementById('district');
      select.innerHTML = '<option value="">-- Ch?n Qu?n/Huy?n --</option>';
      data.data.forEach(d => {
        select.add(new Option(d.name, d.id));
      });
    });
  
  // Calculate shipping
  fetch(`/api/v1/shipping-fee?province=${encodeURIComponent(provinceName)}`)
    .then(r => r.json())
    .then(data => {
      document.getElementById('shippingFee').innerHTML = 
        `Phí v?n chuy?n: ${data.data.fee.toLocaleString('vi-VN')} ?`;
    });
}

// Load wards when district changes
function loadWards() {
  const districtId = document.getElementById('district').value;
  
  fetch(`/api/v1/wards?districtId=${districtId}`)
    .then(r => r.json())
    .then(data => {
      const select = document.getElementById('ward');
      select.innerHTML = '<option value="">-- Ch?n Ph??ng/Xã --</option>';
      data.data.forEach(w => {
        select.add(new Option(w.name, w.id));
      });
    });
}
</script>
```

## Common Issues & Solutions

### Issue 1: Seed script fails with "Cannot insert duplicate key"
**Solution**: Tables already have data. Either drop and recreate, or modify IDs in seed script.

### Issue 2: Shipping fee returns 500 error
**Solution**: Ensure DEFAULT shipping rate exists:
```sql
INSERT INTO ShippingRates (Id, Province, Fee, CreatedAt, UpdatedAt) 
VALUES (NEWID(), 'DEFAULT', 30000, GETUTCDATE(), GETUTCDATE());
```

### Issue 3: Districts endpoint returns empty array
**Solution**: Check provinceId is correct integer, not Guid.

### Issue 4: Admin endpoints return 401 Unauthorized
**Solution**: Include valid admin JWT token in Authorization header.

## Files Created

? Models:
- `ShopWave\Models\Province.cs`
- `ShopWave\Models\District.cs`
- `ShopWave\Models\Ward.cs`
- `ShopWave\Models\ShippingRate.cs`

? DTOs:
- `ShopWave\DTOs\LocationDto.cs`

? Controllers:
- `ShopWave\Controllers\LocationController.cs`
- `ShopWave\Controllers\Admin\ShippingRatesAdminController.cs`

? Documentation:
- `ShopWave\Docs\LOCATION_SHIPPING_GUIDE.md`
- `ShopWave\Docs\SQL_SeedLocationData.sql`
- `ShopWave\Docs\LOCATION_QUICK_START.md` (this file)

? Updated:
- `ShopWave\Models\ShopWaveDbContext.cs` (added DbSets and configurations)

## Next Steps

1. Run migration
2. Seed data
3. Test all endpoints
4. Integrate with checkout flow
5. Add more provinces/districts/wards as needed

---

**Ready to go!** ??
