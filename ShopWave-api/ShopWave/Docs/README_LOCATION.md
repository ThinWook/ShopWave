# ?? Location & Shipping System - Implementation Complete!

## ? What You Now Have

### ??? Database (4 New Tables)
1. **Provinces** - T?nh/Thành ph? c?a Vi?t Nam
2. **Districts** - Qu?n/Huy?n
3. **Wards** - Ph??ng/Xã
4. **ShippingRates** - Phí v?n chuy?n theo t?nh

### ?? API Endpoints (7 Total)
**Public (4):**
- `GET /api/v1/provinces` - L?y danh sách t?nh
- `GET /api/v1/districts?provinceId={id}` - L?y qu?n/huy?n
- `GET /api/v1/wards?districtId={id}` - L?y ph??ng/xã
- `GET /api/v1/shipping-fee?province={name}` - Tính phí ship

**Admin (3):**
- `GET /api/v1/admin/shipping-rates` - Xem t?t c? phí ship
- `POST /api/v1/admin/shipping-rates` - T?o/c?p nh?t phí
- `DELETE /api/v1/admin/shipping-rates/{id}` - Xóa phí

### ?? Models Created
- `Province.cs` - Model cho t?nh/thành
- `District.cs` - Model cho qu?n/huy?n
- `Ward.cs` - Model cho ph??ng/xã
- `ShippingRate.cs` - Model cho phí v?n chuy?n

### ?? DTOs Created
- `LocationDto.cs` - DTO cho ??a ?i?m và phí ship

### ?? Controllers Created
- `LocationController.cs` - Public endpoints
- `ShippingRatesAdminController.cs` - Admin endpoints

### ?? Documentation Created
- `LOCATION_SHIPPING_GUIDE.md` - H??ng d?n chi ti?t
- `LOCATION_QUICK_START.md` - Quick start guide
- `LOCATION_IMPLEMENTATION_SUMMARY.md` - T?ng k?t implementation
- `SQL_SeedLocationData.sql` - Script seed d? li?u m?u
- `SQL_VerifyLocationSetup.sql` - Script ki?m tra setup
- `README_LOCATION.md` - File này

## ?? B?t ??u (Quick Start)

### B??c 1: T?o Migration
```bash
cd ShopWave
dotnet ef migrations add AddLocationAndShippingTables
```

### B??c 2: Update Database
```bash
dotnet ef database update
```

### B??c 3: Seed D? Li?u
Ch?y file `SQL_SeedLocationData.sql` trong SSMS ho?c:
```bash
sqlcmd -S (localdb)\MSSQLLocalDB -d ShopWaveDb -i Docs\SQL_SeedLocationData.sql
```

### B??c 4: Verify
Ch?y file `SQL_VerifyLocationSetup.sql` ?? ki?m tra:
```bash
sqlcmd -S (localdb)\MSSQLLocalDB -d ShopWaveDb -i Docs\SQL_VerifyLocationSetup.sql
```

### B??c 5: Test API
```bash
# Test l?y danh sách t?nh
curl http://localhost:5000/api/v1/provinces

# Test l?y qu?n/huy?n c?a H? Chí Minh (provinceId=50)
curl "http://localhost:5000/api/v1/districts?provinceId=50"

# Test l?y ph??ng/xã c?a Qu?n 2 (districtId=761)
curl "http://localhost:5000/api/v1/wards?districtId=761"

# Test tính phí ship
curl "http://localhost:5000/api/v1/shipping-fee?province=H?%20Chí%20Minh"
```

## ?? Cách Ho?t ??ng

### Lu?ng Ch?n ??a Ch? (Frontend)
```
1. User ch?n T?nh/Thành
   ?? API: GET /api/v1/provinces
   
2. User ch?n Qu?n/Huy?n
   ?? API: GET /api/v1/districts?provinceId=50
   
3. User ch?n Ph??ng/Xã
   ?? API: GET /api/v1/wards?districtId=761
   
4. T? ??ng tính phí ship
   ?? API: GET /api/v1/shipping-fee?province=H? Chí Minh
```

### Lu?ng Admin Qu?n Lý Phí Ship
```
1. Admin xem t?t c? phí
   ?? API: GET /api/v1/admin/shipping-rates
   
2. Admin t?o/c?p nh?t phí
   ?? API: POST /api/v1/admin/shipping-rates
   Body: {"province": "Bình D??ng", "fee": 22000}
   
3. Admin xóa phí
   ?? API: DELETE /api/v1/admin/shipping-rates/{id}
   (Không th? xóa "DEFAULT")
```

### Logic Tính Phí Ship
```
1. Tìm phí cho t?nh c? th? (exact match)
   ?? Tìm th?y: Return phí ?ó
   ?? Không tìm th?y: ?
   
2. Tìm phí DEFAULT
   ?? Tìm th?y: Return DEFAULT (30,000 VND)
   ?? Không tìm th?y: ?
   
3. Return Error 500
   (Admin ch?a config phí DEFAULT)
```

## ?? D? Li?u M?u

### T?nh/Thành (10)
- H? Chí Minh (ID: 50)
- Hà N?i (ID: 1)
- ?à N?ng (ID: 48)
- Và 7 t?nh khác...

### Qu?n/Huy?n (39)
- 24 qu?n/huy?n c?a H? Chí Minh
- 15 qu?n/huy?n c?a Hà N?i

### Ph??ng/Xã (34)
- 10 ph??ng c?a Qu?n 1, HCM
- 10 ph??ng c?a Qu?n 2, HCM
- 14 ph??ng c?a Ba ?ình, HN

### Phí V?n Chuy?n (9)
- DEFAULT: 30,000 VND (dùng cho t?nh không config)
- H? Chí Minh: 20,000 VND
- Hà N?i: 20,000 VND
- ?à N?ng: 25,000 VND
- Và các t?nh khác...

## ?? Frontend Integration

### HTML Form Example
```html
<form>
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
```

### JavaScript Example
```javascript
// Load provinces on page load
async function loadProvinces() {
  const res = await fetch('/api/v1/provinces');
  const data = await res.json();
  const select = document.getElementById('province');
  data.data.forEach(p => {
    select.add(new Option(p.name, p.id));
  });
}

// Load districts when province selected
async function loadDistricts() {
  const provinceId = document.getElementById('province').value;
  const provinceName = document.getElementById('province').selectedOptions[0].text;
  
  // Load districts
  const res = await fetch(`/api/v1/districts?provinceId=${provinceId}`);
  const data = await res.json();
  const select = document.getElementById('district');
  select.innerHTML = '<option value="">-- Ch?n Qu?n/Huy?n --</option>';
  data.data.forEach(d => {
    select.add(new Option(d.name, d.id));
  });
  
  // Calculate shipping
  const feeRes = await fetch(`/api/v1/shipping-fee?province=${encodeURIComponent(provinceName)}`);
  const feeData = await feeRes.json();
  document.getElementById('shippingFee').textContent = 
    `Phí ship: ${feeData.data.fee.toLocaleString('vi-VN')} ?`;
}

// Load wards when district selected
async function loadWards() {
  const districtId = document.getElementById('district').value;
  const res = await fetch(`/api/v1/wards?districtId=${districtId}`);
  const data = await res.json();
  const select = document.getElementById('ward');
  select.innerHTML = '<option value="">-- Ch?n Ph??ng/Xã --</option>';
  data.data.forEach(w => {
    select.add(new Option(w.name, w.id));
  });
}

// Initialize
loadProvinces();
```

## ?? Tích H?p V?i Checkout

Khi t?o ??n hàng, frontend c?n:

1. **L?u tên t?nh/qu?n/ph??ng** (d?ng string) vào Order
2. **Tính phí ship** t? API `/api/v1/shipping-fee`
3. **C?ng phí ship** vào t?ng ??n hàng
4. **G?i Order** v?i ??y ?? thông tin ??a ch?

```javascript
// Khi user checkout
const order = {
  // ... other order fields
  shippingProvince: "H? Chí Minh",  // From dropdown
  shippingDistrict: "Qu?n 2",        // From dropdown
  shippingWard: "Ph??ng Th?o ?i?n",  // From dropdown
  shippingStreet: "123 Nguy?n V?n A",
  shippingFee: 20000,  // From API
  totalAmount: cartTotal + 20000
};
```

## ?? M? R?ng D? Li?u

### Thêm T?nh/Qu?n/Ph??ng

**Option 1: SQL Insert**
```sql
INSERT INTO Provinces (Id, Name, Code) VALUES (60, N'An Giang', 'AG');
INSERT INTO Districts (Id, Name, ProvinceId) VALUES (900, N'Huy?n An Phú', 60);
INSERT INTO Wards (Id, Name, DistrictId) VALUES (30000, N'Xã Khánh An', 900);
```

**Option 2: Import JSON**
Có nhi?u ngu?n data JSON hoàn ch?nh v? ??a gi?i hành chính VN trên GitHub.

**Option 3: API Integration**
Tích h?p v?i GHN, GHTK API ?? l?y data ??y ??.

### Thêm/S?a Phí Ship (Admin)

**Qua API:**
```bash
curl -X POST http://localhost:5000/api/v1/admin/shipping-rates \
  -H "Authorization: Bearer {admin_token}" \
  -H "Content-Type: application/json" \
  -d '{"province":"An Giang","fee":40000}'
```

**Qua SQL:**
```sql
-- Upsert logic
IF EXISTS (SELECT 1 FROM ShippingRates WHERE Province = N'An Giang')
  UPDATE ShippingRates SET Fee = 40000, UpdatedAt = GETUTCDATE() 
  WHERE Province = N'An Giang'
ELSE
  INSERT INTO ShippingRates (Id, Province, Fee, CreatedAt, UpdatedAt)
  VALUES (NEWID(), N'An Giang', 40000, GETUTCDATE(), GETUTCDATE())
```

## ?? L?u Ý Quan Tr?ng

1. **DEFAULT Rate B?t Bu?c**
   - Ph?i luôn có rate "DEFAULT" trong b?ng ShippingRates
   - N?u không có, API `/shipping-fee` s? tr? 500 error

2. **Province Name Ph?i Kh?p**
   - Tên t?nh trong Order.ShippingProvince ph?i kh?p v?i ShippingRates.Province
   - Case-sensitive (phân bi?t hoa th??ng)

3. **Admin Không Th? Xóa DEFAULT**
   - ?? b?o v? h? th?ng, không cho phép xóa rate DEFAULT

4. **Performance**
   - Các b?ng ??u có index trên FK ? Query nhanh
   - Unique constraint trên ShippingRates.Province

5. **Cascade Delete**
   - Xóa Province ? t? ??ng xóa Districts và Wards
   - Xóa District ? t? ??ng xóa Wards

## ?? Tài Li?u Chi Ti?t

1. **LOCATION_SHIPPING_GUIDE.md**
   - H??ng d?n ??y ?? nh?t
   - Chi ti?t v? database, API, frontend integration

2. **LOCATION_QUICK_START.md**
   - Quick reference
   - Các l?nh test nhanh

3. **LOCATION_IMPLEMENTATION_SUMMARY.md**
   - T?ng k?t implementation
   - Checklist verification

4. **SQL_SeedLocationData.sql**
   - Script seed d? li?u m?u
   - Ch?y m?t l?n sau khi migration

5. **SQL_VerifyLocationSetup.sql**
   - Script ki?m tra setup
   - Ch?y ?? verify m?i th? OK

## ?? Testing Checklist

- [ ] Migration thành công
- [ ] Seed data thành công
- [ ] API `/provinces` tr? v? danh sách
- [ ] API `/districts` l?c ?úng theo province
- [ ] API `/wards` l?c ?úng theo district
- [ ] API `/shipping-fee` tính ?úng cho t?nh có config
- [ ] API `/shipping-fee` fallback v? DEFAULT cho t?nh không có
- [ ] Admin API yêu c?u authorization
- [ ] Admin có th? t?o/s?a/xóa rates
- [ ] Không th? xóa DEFAULT rate
- [ ] Frontend cascading dropdowns ho?t ??ng

## ?? Hoàn T?t!

Bây gi? b?n có:
- ? Database structure hoàn ch?nh
- ? API endpoints ??y ??
- ? Sample data ?? test
- ? Documentation chi ti?t
- ? Frontend integration examples
- ? Admin management tools

**S?n sàng ?? ch?y migration và test!** ??

---

**Câu h?i?** Ki?m tra các file doc khác ho?c test theo các ví d? trong guide.
