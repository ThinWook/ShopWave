# Cart Applied Voucher Fix

## Problem Statement

When users applied a voucher to their cart using `POST /api/v1/cart/voucher`, the backend correctly stored the voucher information in the `AppliedDiscounts` table. However, when retrieving the cart via `GET /api/v1/cart`, the backend **forgot to query and return the applied voucher information**. This caused the checkout page to display incorrect totals because the frontend couldn't see which voucher was applied.

### User Symptoms
- Cart shows subtotal: 1,000,000 ?
- User applies voucher "NOV40" (40,000 ? discount)
- Cart shows new total: 960,000 ? ?
- User navigates to checkout page
- Checkout shows total: 1,000,000 ? ? (missing voucher discount)

### Root Cause

The `CartController.GetCart()` method was missing logic to:
1. Query the `AppliedDiscounts` table for vouchers applied to the current cart
2. Include this information in the `CartResponse` DTO
3. Apply the voucher discount to the final total calculation

## Solution Implemented

### 1. Created `AppliedVoucherDto` Class

**File:** `ShopWave/DTOs/Cart/AvailableVoucherDto.cs`

Added a new DTO to represent applied voucher information:

```csharp
public class AppliedVoucherDto
{
    public string Code { get; set; } = string.Empty;
    public decimal DiscountAmount { get; set; }
    public string? Description { get; set; }
}
```

### 2. Updated `CartResponse` Model

**File:** `ShopWave/Models/Responses/ResponseModels.cs`

Added `AppliedVoucher` property to the response:

```csharp
public class CartResponse
{
    public List<CartItemDto> Items { get; set; } = new List<CartItemDto>();
    public int TotalItems { get; set; }
    public decimal SubTotal { get; set; }
    public decimal ShippingFee { get; set; }
    public decimal Total { get; set; }
    public ProgressiveDiscountDto? ProgressiveDiscount { get; set; }
    public AppliedVoucherDto? AppliedVoucher { get; set; } // NEW
}
```

### 3. Added Helper Method in `CartController`

**File:** `ShopWave/Controllers/CartController.cs`

Created a reusable method to retrieve applied voucher information:

```csharp
private async Task<AppliedVoucherDto?> GetAppliedVoucherAsync(Guid cartId)
{
    var appliedDiscount = await _context.AppliedDiscounts
        .Include(ad => ad.Discount)
        .FirstOrDefaultAsync(ad => ad.CartId == cartId);

    if (appliedDiscount == null)
    {
        return null;
    }

    return new AppliedVoucherDto
    {
        Code = appliedDiscount.Discount.Code,
        DiscountAmount = appliedDiscount.DiscountAmountApplied,
        Description = appliedDiscount.Discount.Description
    };
}
```

### 4. Updated All Cart Response Methods

Modified the following endpoints to include applied voucher information:

#### `GET /api/v1/cart`
```csharp
var appliedVoucher = await GetAppliedVoucherAsync(cart.Id);
var voucherDiscount = appliedVoucher?.DiscountAmount ?? 0;
var total = subTotal - progressiveDiscount.CurrentDiscountValue - voucherDiscount + shipping;

var resp = new CartResponse
{
    // ...existing properties...
    AppliedVoucher = appliedVoucher
};
```

#### `POST /api/v1/cart/voucher`
```csharp
var appliedVoucher = await GetAppliedVoucherAsync(cart.Id);
var voucherDiscount = appliedVoucher?.DiscountAmount ?? 0;
var total = newSubTotal - progressiveDiscount.CurrentDiscountValue - voucherDiscount + shipping;

var response = new CartResponse
{
    // ...existing properties...
    AppliedVoucher = appliedVoucher
};
```

#### `DELETE /api/v1/cart/voucher`
```csharp
var appliedVoucher = await GetAppliedVoucherAsync(cart.Id); // Should be null
var total = newSubTotal - progressiveDiscount.CurrentDiscountValue + shipping;

var response = new CartResponse
{
    // ...existing properties...
    AppliedVoucher = appliedVoucher
};
```

## Example API Responses

### Before Fix (Missing Voucher)
```json
{
  "success": true,
  "message": "CART_RETRIEVED",
  "data": {
    "items": [...],
    "totalItems": 5,
    "subTotal": 1000000,
    "shippingFee": 0,
    "total": 960000,
    "progressiveDiscount": {...}
    // ? appliedVoucher: MISSING
  }
}
```

### After Fix (Includes Voucher)
```json
{
  "success": true,
  "message": "CART_RETRIEVED",
  "data": {
    "items": [...],
    "totalItems": 5,
    "subTotal": 1000000,
    "shippingFee": 0,
    "total": 960000,
    "progressiveDiscount": {...},
    "appliedVoucher": {
      "code": "NOV40",
      "discountAmount": 40000,
      "description": "Gi?m 40k cho ??n hàng 599k+"
    }
  }
}
```

## Total Calculation Flow

The cart total is now calculated correctly with all discounts:

```
Total = SubTotal 
      - ProgressiveDiscount.CurrentDiscountValue 
      - AppliedVoucher.DiscountAmount 
      + ShippingFee
```

Example:
```
SubTotal:              1,000,000 ?
Progressive Discount:    -40,000 ?  (tier discount)
Voucher Discount:        -40,000 ?  (NOV40)
Shipping Fee:                  0 ?  (free shipping)
-------------------------------------------
Total:                   920,000 ?
```

## Frontend Integration

The frontend can now reliably display applied vouchers:

```typescript
interface CartResponse {
  items: CartItem[];
  totalItems: number;
  subTotal: number;
  shippingFee: number;
  total: number;
  progressiveDiscount?: ProgressiveDiscount;
  appliedVoucher?: {
    code: string;
    discountAmount: number;
    description?: string;
  };
}

function renderAppliedVoucher(cart: CartResponse) {
  if (cart.appliedVoucher) {
    console.log(`Voucher: ${cart.appliedVoucher.code}`);
    console.log(`Discount: -${formatPrice(cart.appliedVoucher.discountAmount)}`);
  }
}
```

## Testing Checklist

- [x] Build succeeds with no errors
- [ ] Apply voucher: `POST /api/v1/cart/voucher` returns `appliedVoucher`
- [ ] Get cart: `GET /api/v1/cart` returns `appliedVoucher`
- [ ] Remove voucher: `DELETE /api/v1/cart/voucher` returns `appliedVoucher: null`
- [ ] Checkout page displays correct total with voucher
- [ ] Total calculation includes both progressive discount and voucher discount

## Related Files

- `ShopWave/DTOs/Cart/AvailableVoucherDto.cs` - DTO definitions
- `ShopWave/Models/Responses/ResponseModels.cs` - CartResponse model
- `ShopWave/Controllers/CartController.cs` - Cart API logic
- `ShopWave/Models/AppliedDiscount.cs` - Database model

## Summary

This fix ensures that when a voucher is applied to a cart, the backend:
1. ? Saves the voucher to `AppliedDiscounts` table
2. ? Queries `AppliedDiscounts` when returning cart data
3. ? Includes voucher information in `CartResponse.AppliedVoucher`
4. ? Applies voucher discount to the total calculation

The frontend can now correctly display applied vouchers on the checkout page and show accurate order totals.
