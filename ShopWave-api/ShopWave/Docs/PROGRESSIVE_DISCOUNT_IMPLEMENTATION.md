# Progressive Discount Implementation Guide

## Overview

This document describes the progressive discount feature implementation based on the `DiscountTiers` table. This feature automatically calculates and applies discounts based on the cart subtotal, providing incentive information to encourage customers to increase their order value.

## Architecture

### Database Structure

The feature uses the existing `DiscountTiers` table:

```sql
CREATE TABLE DiscountTiers (
    Id uniqueidentifier PRIMARY KEY,
    ThresholdAmount decimal(18,2) NOT NULL,
    DiscountValue decimal(18,2) NOT NULL,
    IsActive bit NOT NULL DEFAULT 1,
    Description nvarchar(500) NULL,
    CreatedAt datetime2 NOT NULL,
    UpdatedAt datetime2 NOT NULL
)
```

### Backend Components

#### 1. ProgressiveDiscountDto (`Models/DTOs/DataTransferObjects.cs`)

```csharp
public class ProgressiveDiscountDto
{
    // Current discount being applied (e.g., 40000)
    public decimal CurrentDiscountValue { get; set; } = 0;

    // Next tier threshold (e.g., 999000)
    // Null if already at highest tier
    public decimal? NextDiscountThreshold { get; set; }

    // Discount value for next tier (e.g., 70000)
    // Null if already at highest tier
    public decimal? NextDiscountValue { get; set; }

    // Amount needed to reach next tier (e.g., 121000)
    // Null if already at highest tier
    public decimal? AmountToNext { get; set; }
}
```

#### 2. CartResponse Update (`Models/Responses/ResponseModels.cs`)

Added `ProgressiveDiscount` property to `CartResponse`:

```csharp
public class CartResponse
{
    public List<CartItemDto> Items { get; set; } = new List<CartItemDto>();
    public int TotalItems { get; set; }
    public decimal SubTotal { get; set; }
    public decimal ShippingFee { get; set; }
    public decimal Total { get; set; }
    public ProgressiveDiscountDto? ProgressiveDiscount { get; set; }
}
```

#### 3. CartController Logic (`Controllers/CartController.cs`)

##### CalculateProgressiveDiscountAsync Method

```csharp
private async Task<ProgressiveDiscountDto> CalculateProgressiveDiscountAsync(decimal subTotal)
{
    // 1. Fetch all active discount tiers, ordered by threshold
    var allTiers = await _context.DiscountTiers
        .Where(t => t.IsActive)
        .OrderBy(t => t.ThresholdAmount)
        .ToListAsync();

    if (!allTiers.Any())
    {
        return new ProgressiveDiscountDto(); // Empty if no tiers
    }

    // 2. Find highest tier user has reached (subtotal >= threshold)
    var currentTier = allTiers
        .Where(t => subTotal >= t.ThresholdAmount)
        .OrderByDescending(t => t.ThresholdAmount)
        .FirstOrDefault();

    // 3. Find next tier user hasn't reached (subtotal < threshold)
    var nextTier = allTiers
        .Where(t => subTotal < t.ThresholdAmount)
        .OrderBy(t => t.ThresholdAmount)
        .FirstOrDefault();

    // 4. Build DTO with current and next tier info
    var dto = new ProgressiveDiscountDto();

    if (currentTier != null)
    {
        dto.CurrentDiscountValue = currentTier.DiscountValue;
    }

    if (nextTier != null)
    {
        dto.NextDiscountThreshold = nextTier.ThresholdAmount;
        dto.NextDiscountValue = nextTier.DiscountValue;
        dto.AmountToNext = nextTier.ThresholdAmount - subTotal;
    }

    return dto;
}
```

##### Integration in Cart Endpoints

The method is called in:
- `GetCart()` - Main cart retrieval
- `ApplyVoucher()` - When applying a voucher
- `RemoveVoucher()` - When removing a voucher

Example from `GetCart()`:

```csharp
var subTotal = cartItems.Sum(ci => ci.TotalPrice);

// Calculate progressive discount
var progressiveDiscount = await CalculateProgressiveDiscountAsync(subTotal);

var shipping = CalculateShippingFee(subTotal);

// Apply discount to total
var total = subTotal - progressiveDiscount.CurrentDiscountValue + shipping;

var resp = new CartResponse
{
    Items = cartItems,
    TotalItems = cartItems.Sum(ci => ci.Quantity),
    SubTotal = subTotal,
    ShippingFee = shipping,
    Total = total,
    ProgressiveDiscount = progressiveDiscount
};
```

## Example API Response

### Scenario 1: User at 878,000 (has tier at 599,000, next at 999,000)

```json
{
  "success": true,
  "message": "CART_RETRIEVED",
  "data": {
    "items": [...],
    "totalItems": 5,
    "subTotal": 878000,
    "shippingFee": 0,
    "total": 838000,
    "progressiveDiscount": {
      "currentDiscountValue": 40000,
      "nextDiscountThreshold": 999000,
      "nextDiscountValue": 70000,
      "amountToNext": 121000
    }
  }
}
```

### Scenario 2: User below first tier (subtotal 250,000, first tier at 599,000)

```json
{
  "success": true,
  "message": "CART_RETRIEVED",
  "data": {
    "items": [...],
    "totalItems": 2,
    "subTotal": 250000,
    "shippingFee": 30000,
    "total": 280000,
    "progressiveDiscount": {
      "currentDiscountValue": 0,
      "nextDiscountThreshold": 599000,
      "nextDiscountValue": 40000,
      "amountToNext": 349000
    }
  }
}
```

### Scenario 3: User at highest tier (subtotal 1,200,000, highest tier at 999,000)

```json
{
  "success": true,
  "message": "CART_RETRIEVED",
  "data": {
    "items": [...],
    "totalItems": 10,
    "subTotal": 1200000,
    "shippingFee": 0,
    "total": 1130000,
    "progressiveDiscount": {
      "currentDiscountValue": 70000,
      "nextDiscountThreshold": null,
      "nextDiscountValue": null,
      "amountToNext": null
    }
  }
}
```

## Client Integration (Frontend)

The client can use the `progressiveDiscount` object to:

1. **Display current savings**: Show `currentDiscountValue` prominently
2. **Encourage more purchases**: Display "Add X more to save Y" using `amountToNext` and `nextDiscountValue`
3. **Show progress bar**: Visual indicator of progress toward next tier

Example UI logic:

```typescript
interface ProgressiveDiscount {
  currentDiscountValue: number;
  nextDiscountThreshold?: number;
  nextDiscountValue?: number;
  amountToNext?: number;
}

function renderProgressiveDiscount(discount: ProgressiveDiscount) {
  if (discount.currentDiscountValue > 0) {
    console.log(`You're saving ${discount.currentDiscountValue}!`);
  }
  
  if (discount.amountToNext && discount.nextDiscountValue) {
    console.log(`Add ${discount.amountToNext} more to save ${discount.nextDiscountValue}!`);
  }
}
```

## Management

### No Controller Needed

Unlike vouchers (Discounts table), the DiscountTiers table does NOT have a client-facing API controller. The tiers are:

1. **Managed by admins** through database or admin panel
2. **Automatically applied** by the backend based on cart subtotal
3. **Read-only for clients** - they only receive the calculated values

### Admin Management (Future)

To add admin UI for managing discount tiers:

1. Create `Admin/DiscountTiersAdminController.cs`
2. Add CRUD endpoints with `[Authorize(Roles = "Admin")]`
3. Create admin UI similar to vouchers management

## Testing

### Sample Discount Tiers Data

```sql
INSERT INTO DiscountTiers (Id, ThresholdAmount, DiscountValue, IsActive, Description, CreatedAt, UpdatedAt)
VALUES 
  (NEWID(), 599000, 40000, 1, 'Tier 1: Save 40k on orders 599k+', GETUTCDATE(), GETUTCDATE()),
  (NEWID(), 999000, 70000, 1, 'Tier 2: Save 70k on orders 999k+', GETUTCDATE(), GETUTCDATE()),
  (NEWID(), 1999000, 150000, 1, 'Tier 3: Save 150k on orders 1999k+', GETUTCDATE(), GETUTCDATE());
```

### Test Cases

1. **Empty cart**: Returns `currentDiscountValue: 0` with first tier as next
2. **Below first tier**: Returns `currentDiscountValue: 0` with correct `amountToNext`
3. **At tier boundary**: Applies tier discount exactly
4. **Between tiers**: Applies current tier, shows next tier
5. **At highest tier**: Applies highest discount, nulls for next tier info
6. **No active tiers**: Returns all zeros/nulls

### Manual Testing

```bash
# 1. Get cart (should include progressive discount)
GET http://localhost:5000/api/v1/cart

# 2. Add items to reach different tiers
POST http://localhost:5000/api/v1/cart/add
{
  "variantId": "...",
  "quantity": 5
}

# 3. Verify progressive discount updates in response
```

## Benefits

1. **Automatic**: No client action needed, calculated server-side
2. **Transparent**: Client receives all info to display incentives
3. **Scalable**: Works with any number of tiers
4. **Flexible**: Admins can adjust tiers without code changes
5. **Cumulative**: Works alongside voucher discounts

## Future Enhancements

1. **Tier names**: Add `Name` field to DiscountTiers for display
2. **Category-specific tiers**: Different tiers for different product categories
3. **Time-based tiers**: Special tiers during promotional periods
4. **User tier history**: Track when users reach each tier
5. **A/B testing**: Test different tier structures

## Summary

The progressive discount feature is fully implemented in the backend and requires no client-side controller. It automatically calculates discounts based on cart subtotal and the `DiscountTiers` table configuration, returning the information in the cart API responses for client-side display and UX enhancements.
