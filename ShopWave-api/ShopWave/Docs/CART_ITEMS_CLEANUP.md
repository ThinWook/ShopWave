# CartItems Table Cleanup - Redundancy Removal

## Overview
This document describes the cleanup of redundant columns in the `CartItems` table to follow proper database normalization principles.

## Problem Identified

The `CartItems` table had redundant foreign keys:
- **UserId**: Pointing to Users table
- **ProductId**: Pointing to Products table

### Why This Was Redundant

1. **UserId Redundancy**:
   - `CartItems` ? `CartId` ? `Cart` ? `UserId`
   - The `Cart` table already knows which user owns the cart
   - Storing `UserId` in both `Cart` and `CartItem` violates DRY principle
   - Complicated "merge cart on login" logic (had to update multiple rows)

2. **ProductId Redundancy**:
   - `CartItems` ? `ProductVariantId` ? `ProductVariant` ? `ProductId`
   - The `ProductVariant` table already knows which product it belongs to
   - Storing `ProductId` in both `ProductVariant` and `CartItem` is unnecessary duplication

## Solution

### Database Changes

**Before:**
```
CartItems
??? Id (PK)
??? CartId (FK ? Carts)          ? Keep
??? UserId (FK ? Users)           ? Remove (redundant)
??? ProductId (FK ? Products)     ? Remove (redundant)
??? ProductVariantId (FK ? ProductVariants, nullable)  ? Make required
??? Quantity
??? UnitPrice
??? CreatedAt
??? UpdatedAt
```

**After:**
```
CartItems
??? Id (PK)
??? CartId (FK ? Carts)          ? Required
??? ProductVariantId (FK ? ProductVariants)  ? Required (was nullable)
??? Quantity
??? UnitPrice
??? CreatedAt
??? UpdatedAt
```

### Code Changes

#### 1. Model Updates

**CartItem.cs**
- Removed `UserId` property
- Removed `ProductId` property
- Removed `User` navigation property
- Removed `Product` navigation property
- Made `ProductVariantId` required (non-nullable)
- Made `ProductVariant` navigation property required

**User.cs**
- Removed `CartItems` navigation property

**Product.cs**
- Removed `CartItems` navigation property

**ShopWaveDbContext.cs**
- Removed CartItem ? User relationship configuration
- Removed CartItem ? Product relationship configuration

#### 2. Controller Updates

**CartController.cs**
- Updated to access `Product` through `ProductVariant.Product` navigation
- Updated all LINQ queries to use `.Include(ci => ci.ProductVariant).ThenInclude(v => v.Product)`
- Updated `AddToCart` to only set `CartId` and `ProductVariantId`
- Removed all references to `ci.Product` and `ci.ProductId`

**OrdersController.cs**
- Changed cart items query from `UserId`-based to `CartId`-based
- Updated to get cart first: `_context.Carts.FirstOrDefaultAsync(c => c.UserId == userId)`
- Updated to access product info through `ProductVariant.Product`

## Migration

**Migration Name:** `20251106155416_RemoveRedundantCartItemColumns`

**What it does:**
1. Drops foreign key constraints (`FK_CartItems_Products_ProductId`, `FK_CartItems_Users_UserId`)
2. Drops indexes (`IX_CartItems_ProductId`, `IX_CartItems_UserId`)
3. Drops columns (`ProductId`, `UserId`)
4. Makes `ProductVariantId` required (non-nullable)

**Applied:** Successfully applied to database

## Benefits

1. **Cleaner Schema**: Follows proper normalization (3NF)
2. **Simpler "Merge Cart on Login"**: Only need to update one row (Cart.UserId)
3. **No Data Duplication**: Single source of truth for relationships
4. **Reduced Storage**: Fewer columns = smaller table
5. **Better Maintainability**: Changes to Product or User don't require CartItem updates

## Testing Checklist

- [x] Build succeeds with no errors
- [x] Migration created successfully
- [x] Migration applied to database
- [ ] Cart retrieval works (GET /api/v1/cart)
- [ ] Add to cart works (POST /api/v1/cart/add)
- [ ] Update cart item works (PUT /api/v1/cart/{id})
- [ ] Remove from cart works (DELETE /api/v1/cart/{id})
- [ ] Clear cart works (DELETE /api/v1/cart/clear)
- [ ] Apply voucher works (POST /api/v1/cart/voucher)
- [ ] Remove voucher works (DELETE /api/v1/cart/voucher)
- [ ] Create order works (POST /api/v1/orders)
- [ ] Progressive discounts still calculate correctly

## Data Access Pattern

### Before (Redundant)
```csharp
var cartItems = await _context.CartItems
    .Include(ci => ci.Product)     // Direct access
    .Include(ci => ci.User)         // Direct access
    .Where(ci => ci.UserId == userId)
    .ToListAsync();

var productName = cartItem.Product.Name;  // Direct
var productId = cartItem.ProductId;        // Direct
```

### After (Clean)
```csharp
var cart = await _context.Carts.FirstOrDefaultAsync(c => c.UserId == userId);
var cartItems = await _context.CartItems
    .Include(ci => ci.ProductVariant)
        .ThenInclude(v => v.Product)  // Through relationship
    .Where(ci => ci.CartId == cart.Id)
    .ToListAsync();

var productName = cartItem.ProductVariant.Product.Name;  // Through relationship
var productId = cartItem.ProductVariant.ProductId;        // Through relationship
```

## Rollback Instructions

If needed, the migration can be rolled back:

```bash
dotnet ef database update 20251105175842_MakeCartItemUserIdNullable --project ShopWave\ShopWave-api.csproj
dotnet ef migrations remove --project ShopWave\ShopWave-api.csproj
```

Then revert the code changes in Git:
```bash
git checkout HEAD -- ShopWave/Models/CartItem.cs
git checkout HEAD -- ShopWave/Models/User.cs
git checkout HEAD -- ShopWave/Models/Product.cs
git checkout HEAD -- ShopWave/Models/ShopWaveDbContext.cs
git checkout HEAD -- ShopWave/Controllers/CartController.cs
git checkout HEAD -- ShopWave/Controllers/OrdersController.cs
```

## Related Documentation

- [CART_DISCOUNT_GUIDE.md](CART_DISCOUNT_GUIDE.md) - Cart and discount system overview
- [MIGRATION_GUIDE.md](MIGRATION_GUIDE.md) - Database migration procedures

## Conclusion

The `CartItems` table is now properly normalized with no redundant foreign keys. This cleanup improves data consistency, simplifies cart merge logic, and follows database design best practices.
