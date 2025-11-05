# H??ng D?n S? D?ng H? Th?ng Cart, Discount & Voucher

## T?ng Quan
H? th?ng ?ã ???c thêm 5 b?ng m?i ?? qu?n lý gi? hàng, mã gi?m giá và các b?c gi?m giá:

1. **Carts** - Gi? hàng (h? tr? c? user ?ã ??ng nh?p và khách vãng lai)
2. **CartItems** - Các s?n ph?m trong gi? hàng (?ã c?p nh?t ?? liên k?t v?i Cart)
3. **Discounts** - Qu?n lý mã voucher (NOV15, NOV40, v.v.)
4. **AppliedDiscounts** - L?u tr? voucher ?ã áp d?ng vào gi? hàng
5. **DiscountTiers** - Qu?n lý các b?c "mua X gi?m Y"

---

## 1. B?ng Carts

### Schema
```csharp
public class Cart
{
    public Guid Id { get; set; }
    public Guid? UserId { get; set; }        // NULL cho khách vãng lai
    public string? SessionId { get; set; }   // Dùng cho khách vãng lai
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
}
```

### Use Cases

#### 1.1 T?o gi? hàng cho User ?ã ??ng nh?p
```csharp
var cart = new Cart
{
    UserId = currentUserId,
    SessionId = null
};
await _context.Carts.AddAsync(cart);
await _context.SaveChangesAsync();
```

#### 1.2 T?o gi? hàng cho khách vãng lai
```csharp
var sessionId = HttpContext.Session.Id;
var cart = new Cart
{
    UserId = null,
    SessionId = sessionId
};
await _context.Carts.AddAsync(cart);
await _context.SaveChangesAsync();
```

#### 1.3 Tìm ho?c t?o gi? hàng
```csharp
public async Task<Cart> GetOrCreateCartAsync(Guid? userId, string? sessionId)
{
    var cart = await _context.Carts
        .Include(c => c.CartItems)
            .ThenInclude(ci => ci.ProductVariant)
        .FirstOrDefaultAsync(c => 
            (userId.HasValue && c.UserId == userId) || 
            (!userId.HasValue && c.SessionId == sessionId));
    
    if (cart == null)
    {
        cart = new Cart
        {
            UserId = userId,
            SessionId = sessionId
        };
        await _context.Carts.AddAsync(cart);
        await _context.SaveChangesAsync();
    }
    
    return cart;
}
```

---

## 2. B?ng CartItems (?ã C?p Nh?t)

### Schema
```csharp
public class CartItem
{
    public Guid Id { get; set; }
    public Guid CartId { get; set; }            // M?I - liên k?t v?i Cart
    public Guid UserId { get; set; }
    public Guid ProductId { get; set; }
    public Guid? ProductVariantId { get; set; } // Quan tr?ng!
    public int Quantity { get; set; }
    public decimal UnitPrice { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
}
```

### Use Cases

#### 2.1 Thêm s?n ph?m vào gi?
```csharp
var cartItem = new CartItem
{
    CartId = cart.Id,
    UserId = currentUserId,
    ProductId = productId,
    ProductVariantId = variantId,  // N?u ch?n variant c? th?
    Quantity = quantity,
    UnitPrice = variant.Price
};
await _context.CartItems.AddAsync(cartItem);
await _context.SaveChangesAsync();
```

#### 2.2 C?p nh?t s? l??ng s?n ph?m
```csharp
var cartItem = await _context.CartItems
    .FirstOrDefaultAsync(ci => ci.Id == cartItemId);

if (cartItem != null)
{
    cartItem.Quantity = newQuantity;
    cartItem.UpdatedAt = DateTime.UtcNow;
    await _context.SaveChangesAsync();
}
```

#### 2.3 Tính t?ng giá tr? gi? hàng
```csharp
public async Task<decimal> CalculateCartTotalAsync(Guid cartId)
{
    var total = await _context.CartItems
        .Where(ci => ci.CartId == cartId)
        .SumAsync(ci => ci.Quantity * ci.UnitPrice);
    
    return total;
}
```

---

## 3. B?ng Discounts

### Schema
```csharp
public enum DiscountType
{
    FIXED_AMOUNT,  // Gi?m s? ti?n c? ??nh
    PERCENTAGE     // Gi?m theo ph?n tr?m
}

public class Discount
{
    public Guid Id { get; set; }
    public string Code { get; set; }              // "NOV40"
    public string? Description { get; set; }      // "Gi?m 40K ??n t? 599K"
    public DiscountType DiscountType { get; set; }
    public decimal DiscountValue { get; set; }    // 40000 ho?c 15 (%)
    public decimal MinOrderAmount { get; set; }   // 599000
    public DateTime? StartDate { get; set; }
    public DateTime? EndDate { get; set; }
    public int? UsageLimit { get; set; }          // Gi?i h?n s? l?n dùng
    public int UsageCount { get; set; }           // ?ã dùng bao nhiêu l?n
    public bool IsActive { get; set; }
}
```

### Use Cases

#### 3.1 T?o voucher gi?m giá c? ??nh
```csharp
var discount = new Discount
{
    Code = "NOV40",
    Description = "Gi?m 40K cho ??n hàng t? 599K",
    DiscountType = DiscountType.FIXED_AMOUNT,
    DiscountValue = 40000,
    MinOrderAmount = 599000,
    StartDate = new DateTime(2024, 11, 1),
    EndDate = new DateTime(2024, 11, 30),
    UsageLimit = 1000,
    IsActive = true
};
await _context.Discounts.AddAsync(discount);
await _context.SaveChangesAsync();
```

#### 3.2 T?o voucher gi?m theo ph?n tr?m
```csharp
var discount = new Discount
{
    Code = "NOV15",
    Description = "Gi?m 15% cho ??n hàng t? 299K",
    DiscountType = DiscountType.PERCENTAGE,
    DiscountValue = 15,  // 15%
    MinOrderAmount = 299000,
    StartDate = new DateTime(2024, 11, 1),
    EndDate = new DateTime(2024, 11, 30),
    UsageLimit = null,  // Không gi?i h?n
    IsActive = true
};
await _context.Discounts.AddAsync(discount);
await _context.SaveChangesAsync();
```

#### 3.3 Validate và áp d?ng voucher
```csharp
public async Task<(bool isValid, string message, decimal discountAmount)> ValidateAndCalculateDiscountAsync(
    string code, decimal orderTotal)
{
    var discount = await _context.Discounts
        .FirstOrDefaultAsync(d => d.Code == code && d.IsActive);
    
    if (discount == null)
        return (false, "Mã gi?m giá không t?n t?i", 0);
    
    // Check th?i gian hi?u l?c
    var now = DateTime.UtcNow;
    if (discount.StartDate.HasValue && now < discount.StartDate.Value)
        return (false, "Mã gi?m giá ch?a có hi?u l?c", 0);
    
    if (discount.EndDate.HasValue && now > discount.EndDate.Value)
        return (false, "Mã gi?m giá ?ã h?t h?n", 0);
    
    // Check s? l?n s? d?ng
    if (discount.UsageLimit.HasValue && discount.UsageCount >= discount.UsageLimit.Value)
        return (false, "Mã gi?m giá ?ã h?t l??t s? d?ng", 0);
    
    // Check ??n t?i thi?u
    if (orderTotal < discount.MinOrderAmount)
        return (false, $"??n hàng ph?i t? {discount.MinOrderAmount:N0}?", 0);
    
    // Tính giá tr? gi?m
    decimal discountAmount = discount.DiscountType == DiscountType.FIXED_AMOUNT
        ? discount.DiscountValue
        : orderTotal * (discount.DiscountValue / 100);
    
    // ??m b?o không gi?m quá t?ng ??n hàng
    discountAmount = Math.Min(discountAmount, orderTotal);
    
    return (true, "Mã gi?m giá h?p l?", discountAmount);
}
```

---

## 4. B?ng AppliedDiscounts

### Schema
```csharp
public class AppliedDiscount
{
    public Guid Id { get; set; }
    public Guid CartId { get; set; }
    public Guid DiscountId { get; set; }
    public decimal DiscountAmountApplied { get; set; }
    public DateTime AppliedAt { get; set; }
}
```

### Use Cases

#### 4.1 Áp d?ng voucher vào gi? hàng
```csharp
public async Task<bool> ApplyDiscountToCartAsync(Guid cartId, string discountCode)
{
    // L?y gi? hàng và tính t?ng
    var cart = await _context.Carts
        .Include(c => c.CartItems)
        .Include(c => c.AppliedDiscounts)
        .FirstOrDefaultAsync(c => c.Id == cartId);
    
    if (cart == null) return false;
    
    var orderTotal = cart.CartItems.Sum(ci => ci.Quantity * ci.UnitPrice);
    
    // Validate voucher
    var (isValid, message, discountAmount) = 
        await ValidateAndCalculateDiscountAsync(discountCode, orderTotal);
    
    if (!isValid)
    {
        throw new Exception(message);
    }
    
    // Xóa voucher c? n?u có
    var existingDiscount = cart.AppliedDiscounts.FirstOrDefault();
    if (existingDiscount != null)
    {
        _context.AppliedDiscounts.Remove(existingDiscount);
    }
    
    // Áp d?ng voucher m?i
    var discount = await _context.Discounts
        .FirstOrDefaultAsync(d => d.Code == discountCode);
    
    var appliedDiscount = new AppliedDiscount
    {
        CartId = cartId,
        DiscountId = discount.Id,
        DiscountAmountApplied = discountAmount
    };
    
    await _context.AppliedDiscounts.AddAsync(appliedDiscount);
    
    // T?ng usage count
    discount.UsageCount++;
    
    await _context.SaveChangesAsync();
    
    return true;
}
```

#### 4.2 Xóa voucher kh?i gi? hàng
```csharp
public async Task RemoveDiscountFromCartAsync(Guid cartId)
{
    var appliedDiscount = await _context.AppliedDiscounts
        .FirstOrDefaultAsync(ad => ad.CartId == cartId);
    
    if (appliedDiscount != null)
    {
        // Gi?m usage count
        var discount = await _context.Discounts
            .FindAsync(appliedDiscount.DiscountId);
        if (discount != null)
        {
            discount.UsageCount--;
        }
        
        _context.AppliedDiscounts.Remove(appliedDiscount);
        await _context.SaveChangesAsync();
    }
}
```

#### 4.3 Tính t?ng ??n hàng sau gi?m giá
```csharp
public async Task<(decimal subtotal, decimal discountAmount, decimal total)> 
    GetCartTotalAsync(Guid cartId)
{
    var cart = await _context.Carts
        .Include(c => c.CartItems)
        .Include(c => c.AppliedDiscounts)
        .FirstOrDefaultAsync(c => c.Id == cartId);
    
    var subtotal = cart.CartItems.Sum(ci => ci.Quantity * ci.UnitPrice);
    var discountAmount = cart.AppliedDiscounts.Sum(ad => ad.DiscountAmountApplied);
    var total = subtotal - discountAmount;
    
    return (subtotal, discountAmount, total);
}
```

---

## 5. B?ng DiscountTiers

### Schema
```csharp
public class DiscountTier
{
    public Guid Id { get; set; }
    public decimal ThresholdAmount { get; set; }  // 299000, 599000, 999000
    public decimal DiscountValue { get; set; }    // 15000, 40000, 70000
    public bool IsActive { get; set; }
    public string? Description { get; set; }
}
```

### Use Cases

#### 5.1 T?o các b?c gi?m giá
```csharp
var tiers = new List<DiscountTier>
{
    new DiscountTier
    {
        ThresholdAmount = 299000,
        DiscountValue = 15000,
        Description = "Gi?m 15K cho ??n t? 299K",
        IsActive = true
    },
    new DiscountTier
    {
        ThresholdAmount = 599000,
        DiscountValue = 40000,
        Description = "Gi?m 40K cho ??n t? 599K",
        IsActive = true
    },
    new DiscountTier
    {
        ThresholdAmount = 999000,
        DiscountValue = 70000,
        Description = "Gi?m 70K cho ??n t? 999K",
        IsActive = true
    }
};

await _context.DiscountTiers.AddRangeAsync(tiers);
await _context.SaveChangesAsync();
```

#### 5.2 Tính gi?m giá theo b?c
```csharp
public async Task<(decimal tierDiscount, DiscountTier? appliedTier, DiscountTier? nextTier)> 
    GetTierDiscountAsync(decimal orderTotal)
{
    var tiers = await _context.DiscountTiers
        .Where(t => t.IsActive)
        .OrderByDescending(t => t.ThresholdAmount)
        .ToListAsync();
    
    // Tìm b?c cao nh?t mà user ??t ???c
    var appliedTier = tiers
        .FirstOrDefault(t => orderTotal >= t.ThresholdAmount);
    
    // Tìm b?c ti?p theo (?? hi?n th? "Mua thêm X ?? gi?m Y")
    var nextTier = tiers
        .Where(t => t.ThresholdAmount > orderTotal)
        .OrderBy(t => t.ThresholdAmount)
        .FirstOrDefault();
    
    var discount = appliedTier?.DiscountValue ?? 0;
    
    return (discount, appliedTier, nextTier);
}
```

#### 5.3 Hi?n th? "Mua thêm ?? gi?m giá"
```csharp
public async Task<string> GetTierPromptAsync(decimal currentTotal)
{
    var (_, appliedTier, nextTier) = await GetTierDiscountAsync(currentTotal);
    
    if (nextTier != null)
    {
        var amountNeeded = nextTier.ThresholdAmount - currentTotal;
        return $"Mua thêm {amountNeeded:N0}? ?? gi?m {nextTier.DiscountValue:N0}?";
    }
    
    if (appliedTier != null)
    {
        return $"B?n ?ang ???c gi?m {appliedTier.DiscountValue:N0}?";
    }
    
    var lowestTier = await _context.DiscountTiers
        .Where(t => t.IsActive)
        .OrderBy(t => t.ThresholdAmount)
        .FirstOrDefaultAsync();
    
    if (lowestTier != null)
    {
        var amountNeeded = lowestTier.ThresholdAmount - currentTotal;
        return $"Mua thêm {amountNeeded:N0}? ?? gi?m {lowestTier.DiscountValue:N0}?";
    }
    
    return "";
}
```

---

## 6. Workflow Hoàn Ch?nh

### 6.1 Thêm s?n ph?m vào gi?
```csharp
[HttpPost("cart/add")]
public async Task<IActionResult> AddToCart(AddToCartRequest request)
{
    var userId = GetCurrentUserId(); // ho?c null n?u ch?a ??ng nh?p
    var sessionId = HttpContext.Session.Id;
    
    // 1. Tìm ho?c t?o gi? hàng
    var cart = await GetOrCreateCartAsync(userId, sessionId);
    
    // 2. Ki?m tra variant t?n t?i và còn hàng
    var variant = await _context.ProductVariants
        .FirstOrDefaultAsync(v => v.Id == request.VariantId);
    
    if (variant == null || variant.Stock < request.Quantity)
        return BadRequest("S?n ph?m không kh? d?ng");
    
    // 3. Ki?m tra ?ã có trong gi? ch?a
    var existingItem = await _context.CartItems
        .FirstOrDefaultAsync(ci => 
            ci.CartId == cart.Id && 
            ci.ProductVariantId == request.VariantId);
    
    if (existingItem != null)
    {
        existingItem.Quantity += request.Quantity;
        existingItem.UpdatedAt = DateTime.UtcNow;
    }
    else
    {
        var cartItem = new CartItem
        {
            CartId = cart.Id,
            UserId = userId ?? Guid.Empty,
            ProductId = variant.ProductId,
            ProductVariantId = variant.Id,
            Quantity = request.Quantity,
            UnitPrice = variant.Price
        };
        await _context.CartItems.AddAsync(cartItem);
    }
    
    cart.UpdatedAt = DateTime.UtcNow;
    await _context.SaveChangesAsync();
    
    return Ok(new { message = "?ã thêm vào gi? hàng" });
}
```

### 6.2 Xem gi? hàng v?i gi?m giá
```csharp
[HttpGet("cart")]
public async Task<IActionResult> GetCart()
{
    var userId = GetCurrentUserId();
    var sessionId = HttpContext.Session.Id;
    
    var cart = await _context.Carts
        .Include(c => c.CartItems)
            .ThenInclude(ci => ci.Product)
        .Include(c => c.CartItems)
            .ThenInclude(ci => ci.ProductVariant)
        .Include(c => c.AppliedDiscounts)
            .ThenInclude(ad => ad.Discount)
        .FirstOrDefaultAsync(c => 
            (userId.HasValue && c.UserId == userId) || 
            (!userId.HasValue && c.SessionId == sessionId));
    
    if (cart == null)
        return Ok(new { items = new List<object>(), total = 0 });
    
    // Tính subtotal
    var subtotal = cart.CartItems.Sum(ci => ci.Quantity * ci.UnitPrice);
    
    // Tính tier discount
    var (tierDiscount, appliedTier, nextTier) = await GetTierDiscountAsync(subtotal);
    
    // Tính voucher discount
    var voucherDiscount = cart.AppliedDiscounts.Sum(ad => ad.DiscountAmountApplied);
    
    // T?ng gi?m giá
    var totalDiscount = tierDiscount + voucherDiscount;
    
    // T?ng thanh toán
    var total = subtotal - totalDiscount;
    
    // Message "Mua thêm ?? gi?m"
    var tierPrompt = await GetTierPromptAsync(subtotal);
    
    return Ok(new
    {
        items = cart.CartItems.Select(ci => new
        {
            ci.Id,
            productName = ci.Product.Name,
            variantSku = ci.ProductVariant?.Sku,
            ci.Quantity,
            ci.UnitPrice,
            totalPrice = ci.TotalPrice
        }),
        subtotal,
        tierDiscount,
        voucherDiscount,
        totalDiscount,
        total,
        appliedVoucher = cart.AppliedDiscounts.FirstOrDefault()?.Discount.Code,
        tierPrompt,
        nextTier = nextTier != null ? new
        {
            threshold = nextTier.ThresholdAmount,
            discount = nextTier.DiscountValue,
            amountNeeded = nextTier.ThresholdAmount - subtotal
        } : null
    });
}
```

### 6.3 Áp d?ng voucher
```csharp
[HttpPost("cart/apply-voucher")]
public async Task<IActionResult> ApplyVoucher(ApplyVoucherRequest request)
{
    var userId = GetCurrentUserId();
    var sessionId = HttpContext.Session.Id;
    
    var cart = await _context.Carts
        .Include(c => c.CartItems)
        .Include(c => c.AppliedDiscounts)
        .FirstOrDefaultAsync(c => 
            (userId.HasValue && c.UserId == userId) || 
            (!userId.HasValue && c.SessionId == sessionId));
    
    if (cart == null)
        return NotFound("Gi? hàng không t?n t?i");
    
    try
    {
        await ApplyDiscountToCartAsync(cart.Id, request.Code);
        return Ok(new { message = "Áp d?ng mã gi?m giá thành công" });
    }
    catch (Exception ex)
    {
        return BadRequest(new { message = ex.Message });
    }
}
```

---

## 7. Migration

Migration ?ã ???c t?o tên: `AddCartDiscountTables`

### ?? apply migration:
```bash
cd C:\Users\HasHisShuU\source\repos\ShopWave\ShopWave-api\ShopWave
dotnet ef database update --no-build
```

### ?? rollback:
```bash
dotnet ef database update <previous-migration-name>
```

### ?? remove migration ch?a apply:
```bash
dotnet ef migrations remove
```

---

## 8. Testing Checklist

- [ ] T?o gi? hàng cho user ?ã ??ng nh?p
- [ ] T?o gi? hàng cho khách vãng lai (dùng SessionId)
- [ ] Thêm s?n ph?m vào gi?
- [ ] C?p nh?t s? l??ng s?n ph?m
- [ ] Xóa s?n ph?m kh?i gi?
- [ ] T?o voucher FIXED_AMOUNT
- [ ] T?o voucher PERCENTAGE
- [ ] Áp d?ng voucher vào gi?
- [ ] Validate voucher (th?i gian, usage limit, min order)
- [ ] Xóa voucher kh?i gi?
- [ ] T?o discount tiers
- [ ] Tính discount theo tier
- [ ] Hi?n th? "Mua thêm X ?? gi?m Y"
- [ ] Tính t?ng ??n hàng v?i c? tier discount và voucher discount
- [ ] Chuy?n ??i gi? hàng t? session sang user khi ??ng nh?p

---

## 9. API Endpoints Suggestions

```
POST   /api/cart/add                  - Thêm s?n ph?m vào gi?
GET    /api/cart                      - Xem gi? hàng
PUT    /api/cart/items/{id}           - C?p nh?t s? l??ng
DELETE /api/cart/items/{id}           - Xóa s?n ph?m
POST   /api/cart/apply-voucher        - Áp d?ng voucher
DELETE /api/cart/remove-voucher       - Xóa voucher
GET    /api/cart/summary              - T?ng quan gi? hàng + discounts

POST   /api/admin/discounts           - T?o voucher m?i
GET    /api/admin/discounts           - Danh sách voucher
PUT    /api/admin/discounts/{id}      - C?p nh?t voucher
DELETE /api/admin/discounts/{id}      - Xóa voucher

POST   /api/admin/discount-tiers      - T?o b?c gi?m giá
GET    /api/admin/discount-tiers      - Danh sách b?c
PUT    /api/admin/discount-tiers/{id} - C?p nh?t b?c
DELETE /api/admin/discount-tiers/{id} - Xóa b?c
```

---

## 10. Notes

- **Quan tr?ng**: `CartItem.ProductVariantId` không ???c NULL n?u s?n ph?m có variants
- Khi user ??ng nh?p, merge gi? hàng session vào gi? hàng user
- Voucher và tier discount có th? dùng cùng lúc
- C?n validate stock tr??c khi checkout
- C?p nh?t `UsageCount` khi apply voucher, gi?m khi remove
- Xóa gi? hàng c? (>30 ngày) ??nh k? ?? ti?t ki?m storage
