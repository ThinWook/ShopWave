# Fix Progressive Discount Returning Null Values

## Problem

The `progressiveDiscount` fields in the cart API response are returning `null`:

```json
{
  "progressiveDiscount": {
    "currentDiscountValue": 0,
    "nextDiscountThreshold": null,
    "nextDiscountValue": null,
    "amountToNext": null
  }
}
```

## Root Cause

The `DiscountTiers` table in the database is **empty**. The `CalculateProgressiveDiscountAsync` method in `CartController.cs` queries this table:

```csharp
var allTiers = await _context.DiscountTiers
    .Where(t => t.IsActive)
    .OrderBy(t => t.ThresholdAmount)
    .ToListAsync();

if (!allTiers.Any())
{
    return new ProgressiveDiscountDto(); // Returns empty DTO with null values
}
```

When no tiers exist, it returns an empty `ProgressiveDiscountDto` with default values (0 and nulls).

## Solution

Insert sample discount tiers into the database by running the provided SQL script.

### Step 1: Run the SQL Setup Script

Execute the SQL script located at: `ShopWave/Docs/SQL_ProgressiveDiscountSetup.sql`

This will insert 4 tier levels:
- **Tier 1**: Orders 599,000+ get 40,000 discount
- **Tier 2**: Orders 999,000+ get 70,000 discount  
- **Tier 3**: Orders 1,999,000+ get 150,000 discount
- **Tier 4**: Orders 2,999,000+ get 250,000 discount

### Step 2: Verify Tiers Were Created

Run this query to check:

```sql
SELECT 
    Id,
    ThresholdAmount as 'Ng??ng',
    DiscountValue as 'Gi?m giá',
    IsActive as 'Ho?t ??ng',
    Description,
    CreatedAt
FROM DiscountTiers
WHERE IsActive = 1
ORDER BY ThresholdAmount ASC;
```

You should see 4 rows with the tier configurations.

### Step 3: Test the Cart API

After inserting the tiers, test your cart API again:

```bash
GET https://localhost:5001/api/v1/cart
Headers: X-Session-Id: your-session-id
```

**Expected Response** (with cart subtotal of 648,000):

```json
{
  "success": true,
  "message": "CART_RETRIEVED",
  "data": {
    "items": [...],
    "totalItems": 2,
    "subTotal": 648000.00,
    "shippingFee": 0,
    "total": 608000.00,
    "progressiveDiscount": {
      "currentDiscountValue": 40000,      // Applied tier 1 discount
      "nextDiscountThreshold": 999000,    // Next tier threshold
      "nextDiscountValue": 70000,         // Next tier discount
      "amountToNext": 351000              // Amount needed to reach tier 2
    }
  }
}
```

## Test Scenarios

### Scenario 1: Cart Below First Tier (SubTotal: 250,000)
```json
{
  "currentDiscountValue": 0,
  "nextDiscountThreshold": 599000,
  "nextDiscountValue": 40000,
  "amountToNext": 349000
}
```

### Scenario 2: Cart at First Tier (SubTotal: 648,000)
```json
{
  "currentDiscountValue": 40000,
  "nextDiscountThreshold": 999000,
  "nextDiscountValue": 70000,
  "amountToNext": 351000
}
```

### Scenario 3: Cart Between Tiers (SubTotal: 878,000)
```json
{
  "currentDiscountValue": 40000,
  "nextDiscountThreshold": 999000,
  "nextDiscountValue": 70000,
  "amountToNext": 121000
}
```

### Scenario 4: Cart at Highest Tier (SubTotal: 3,500,000)
```json
{
  "currentDiscountValue": 250000,
  "nextDiscountThreshold": null,
  "nextDiscountValue": null,
  "amountToNext": null
}
```

## Alternative: Check Database Connection

If the SQL script was already run, verify your database connection string:

1. Open `appsettings.json` or `appsettings.Development.json`
2. Check the `ConnectionStrings:DefaultConnection` value
3. Ensure it points to the correct database where DiscountTiers table exists

```json
{
  "ConnectionStrings": {
    "DefaultConnection": "Server=(localdb)\\mssqllocaldb;Database=ShopWaveDb;Trusted_Connection=true;MultipleActiveResultSets=true"
  }
}
```

## Admin Management (Future Enhancement)

To allow admins to manage discount tiers without SQL:

1. Create `Controllers/Admin/DiscountTiersAdminController.cs`
2. Add CRUD endpoints with `[Authorize(Roles = "Admin")]`
3. Create admin UI similar to vouchers management

## Summary

The issue is caused by an empty `DiscountTiers` table. After running the SQL setup script, the progressive discount feature will work correctly and return proper values to the frontend.

**Files Involved:**
- Backend Logic: `ShopWave/Controllers/CartController.cs` (line ~65-95)
- DTO: `ShopWave/Models/DTOs/DataTransferObjects.cs` (ProgressiveDiscountDto)
- Database: `DiscountTiers` table
- SQL Script: `ShopWave/Docs/SQL_ProgressiveDiscountSetup.sql`

**Status**: ? Solution provided - Run SQL script to populate tiers
