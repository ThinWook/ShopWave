# ?? Location & Shipping Rate Implementation Guide

## ?? Overview
This guide covers the implementation of location-based services (Provinces, Districts, Wards) and shipping rates for ShopWave API.

## ??? Database Schema

### New Tables

#### 1. **Provinces** (T?nh/Thành ph?)
| Column | Type | Description |
|--------|------|-------------|
| Id | int (PK) | Unique identifier |
| Name | nvarchar(100) | Province name (e.g., "H? Chí Minh") |
| Code | nvarchar(20) | Province code (e.g., "HCM") |

#### 2. **Districts** (Qu?n/Huy?n)
| Column | Type | Description |
|--------|------|-------------|
| Id | int (PK) | Unique identifier |
| Name | nvarchar(100) | District name (e.g., "Qu?n 2") |
| ProvinceId | int (FK) | Reference to Provinces.Id |

#### 3. **Wards** (Ph??ng/Xã)
| Column | Type | Description |
|--------|------|-------------|
| Id | int (PK) | Unique identifier |
| Name | nvarchar(100) | Ward name (e.g., "Ph??ng Th?nh M? L?i") |
| DistrictId | int (FK) | Reference to Districts.Id |

#### 4. **ShippingRates** (Phí v?n chuy?n)
| Column | Type | Description |
|--------|------|-------------|
| Id | Guid (PK) | Unique identifier |
| Province | nvarchar(100) | Province name or "DEFAULT" |
| Fee | decimal(18,2) | Shipping fee in VND |
| CreatedAt | datetime | Creation timestamp |
| UpdatedAt | datetime | Last update timestamp |

## ?? API Endpoints

### Public Endpoints

#### 1. Get All Provinces
```http
GET /api/v1/provinces
```

**Response:**
```json
{
  "status": "OK",
  "code": "PROVINCES_RETRIEVED",
  "data": [
    { "id": 50, "name": "H? Chí Minh" },
    { "id": 1, "name": "Hà N?i" }
  ]
}
```

#### 2. Get Districts by Province
```http
GET /api/v1/districts?provinceId=50
```

**Response:**
```json
{
  "status": "OK",
  "code": "DISTRICTS_RETRIEVED",
  "data": [
    { "id": 760, "name": "Qu?n 1" },
    { "id": 761, "name": "Qu?n 2" }
  ]
}
```

#### 3. Get Wards by District
```http
GET /api/v1/wards?districtId=761
```

**Response:**
```json
{
  "status": "OK",
  "code": "WARDS_RETRIEVED",
  "data": [
    { "id": 27100, "name": "Ph??ng Th?o ?i?n" },
    { "id": 27101, "name": "Ph??ng An Phú" }
  ]
}
```

#### 4. Get Shipping Fee
```http
GET /api/v1/shipping-fee?province=H? Chí Minh
```

**Response:**
```json
{
  "status": "OK",
  "code": "SHIPPING_FEE_RETRIEVED",
  "data": {
    "province": "H? Chí Minh",
    "fee": 20000.00
  }
}
```

**Fallback Logic:**
- If specific province rate exists ? return that rate
- If not found ? return DEFAULT rate
- If DEFAULT not configured ? return 500 error

### Admin Endpoints (Requires Admin Role)

#### 1. Get All Shipping Rates
```http
GET /api/v1/admin/shipping-rates
Authorization: Bearer {admin_token}
```

**Response:**
```json
{
  "status": "OK",
  "code": "SHIPPING_RATES_RETRIEVED",
  "data": [
    {
      "id": "guid",
      "province": "DEFAULT",
      "fee": 30000.00,
      "createdAt": "2024-01-01T00:00:00Z",
      "updatedAt": "2024-01-01T00:00:00Z"
    },
    {
      "id": "guid",
      "province": "H? Chí Minh",
      "fee": 20000.00,
      "createdAt": "2024-01-01T00:00:00Z",
      "updatedAt": "2024-01-01T00:00:00Z"
    }
  ]
}
```

#### 2. Create or Update Shipping Rate
```http
POST /api/v1/admin/shipping-rates
Authorization: Bearer {admin_token}
Content-Type: application/json

{
  "province": "H? Chí Minh",
  "fee": 20000.00
}
```

**Response (New):**
```json
{
  "status": "OK",
  "code": "SHIPPING_RATE_CREATED",
  "data": { "id": "guid" }
}
```

**Response (Updated):**
```json
{
  "status": "OK",
  "code": "SHIPPING_RATE_UPDATED",
  "data": { "id": "guid" }
}
```

#### 3. Delete Shipping Rate
```http
DELETE /api/v1/admin/shipping-rates/{id}
Authorization: Bearer {admin_token}
```

**Response:**
```json
{
  "status": "OK",
  "code": "SHIPPING_RATE_DELETED",
  "data": { "id": "guid" }
}
```

**Note:** Cannot delete DEFAULT shipping rate (protected).

## ?? Setup Instructions

### 1. Add Migration

```bash
cd ShopWave
dotnet ef migrations add AddLocationAndShippingTables
```

### 2. Update Database

```bash
dotnet ef database update
```

### 3. Seed Data

Run the SQL script `SQL_SeedLocationData.sql`:

```bash
sqlcmd -S (localdb)\MSSQLLocalDB -d ShopWaveDb -i Docs\SQL_SeedLocationData.sql
```

Or execute directly in SQL Server Management Studio.

### 4. Verify Installation

Check the data:

```sql
SELECT COUNT(*) FROM Provinces;  -- Should have data
SELECT COUNT(*) FROM Districts;  -- Should have data
SELECT COUNT(*) FROM Wards;      -- Should have data
SELECT COUNT(*) FROM ShippingRates WHERE Province = 'DEFAULT'; -- Must have 1
```

## ?? Frontend Integration Example

### Cascading Dropdowns

```javascript
// 1. Load provinces on page load
async function loadProvinces() {
  const response = await fetch('/api/v1/provinces');
  const result = await response.json();
  
  const select = document.getElementById('province');
  result.data.forEach(p => {
    const option = new Option(p.name, p.id);
    select.add(option);
  });
}

// 2. Load districts when province changes
async function onProvinceChange(provinceId) {
  const response = await fetch(`/api/v1/districts?provinceId=${provinceId}`);
  const result = await response.json();
  
  const select = document.getElementById('district');
  select.innerHTML = '<option value="">-- Ch?n Qu?n/Huy?n --</option>';
  result.data.forEach(d => {
    const option = new Option(d.name, d.id);
    select.add(option);
  });
}

// 3. Load wards when district changes
async function onDistrictChange(districtId) {
  const response = await fetch(`/api/v1/wards?districtId=${districtId}`);
  const result = await response.json();
  
  const select = document.getElementById('ward');
  select.innerHTML = '<option value="">-- Ch?n Ph??ng/Xã --</option>';
  result.data.forEach(w => {
    const option = new Option(w.name, w.id);
    select.add(option);
  });
}

// 4. Calculate shipping fee
async function calculateShipping(provinceName) {
  const response = await fetch(`/api/v1/shipping-fee?province=${encodeURIComponent(provinceName)}`);
  const result = await response.json();
  
  document.getElementById('shippingFee').textContent = 
    result.data.fee.toLocaleString('vi-VN') + ' ?';
}
```

## ?? Sample Data Included

### Provinces (10)
- Hà N?i
- H? Chí Minh
- ?à N?ng
- H?i Phòng
- C?n Th?
- And more...

### Districts
- 24 districts for H? Chí Minh
- 15 districts for Hà N?i

### Wards
- 10 wards for Qu?n 1, HCM
- 10 wards for Qu?n 2, HCM
- 14 wards for Ba ?ình, Hà N?i

### Shipping Rates
- DEFAULT: 30,000 VND
- H? Chí Minh: 20,000 VND
- Hà N?i: 20,000 VND
- Others configured as needed

## ?? Expanding Data

To add more provinces, districts, and wards, you can:

1. **Manual Insert**: Use SQL INSERT statements
2. **Import from JSON**: Many open-source Vietnamese location datasets are available
3. **Use API Services**: Integrate with GHN, GHTK APIs for complete data

### Sample JSON Import Script (Node.js example)

```javascript
const data = require('./vietnam-provinces.json');
const sql = require('mssql');

async function seedData() {
  await sql.connect(config);
  
  for (const province of data.provinces) {
    await sql.query`
      INSERT INTO Provinces (Id, Name, Code) 
      VALUES (${province.id}, ${province.name}, ${province.code})`;
    
    for (const district of province.districts) {
      await sql.query`
        INSERT INTO Districts (Id, Name, ProvinceId) 
        VALUES (${district.id}, ${district.name}, ${province.id})`;
      
      for (const ward of district.wards) {
        await sql.query`
          INSERT INTO Wards (Id, Name, DistrictId) 
          VALUES (${ward.id}, ${ward.name}, ${district.id})`;
      }
    }
  }
}
```

## ?? Important Notes

1. **DEFAULT Shipping Rate**: Always maintain a DEFAULT rate for provinces without specific rates
2. **Province Names**: Must match exactly (case-sensitive) between Orders.ShippingProvince and ShippingRates.Province
3. **Cascading Deletes**: Deleting a Province will cascade delete Districts and Wards
4. **Performance**: All location tables have indexes on foreign keys for fast lookups
5. **Data Source**: Sample data is limited. For production, use complete Vietnamese location datasets

## ?? Testing Checklist

- [ ] Can retrieve all provinces
- [ ] Can retrieve districts filtered by province
- [ ] Can retrieve wards filtered by district
- [ ] Can get shipping fee for specific province
- [ ] Falls back to DEFAULT rate when province not found
- [ ] Admin can create new shipping rate
- [ ] Admin can update existing shipping rate
- [ ] Admin can delete shipping rate (except DEFAULT)
- [ ] Cannot delete DEFAULT shipping rate
- [ ] Frontend cascading dropdowns work correctly

## ?? Related Documentation

- Order structure: `ORDER_STRUCTURE_FIX.md`
- Checkout flow: `CHECKOUT_FINAL_SUMMARY.md`
- API responses: `ResponseModels.cs`

---

**Status**: ? Implementation Complete
**Last Updated**: 2024-01-15
