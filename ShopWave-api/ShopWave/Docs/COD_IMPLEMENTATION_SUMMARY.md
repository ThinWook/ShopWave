# ? COD PAYMENT FLOW - IMPLEMENTATION SUMMARY

## ?? T?ng Quan

COD (Cash On Delivery) là ph??ng th?c thanh toán ??n gi?n nh?t, không c?n tích h?p c?ng thanh toán bên th? ba. Toàn b? quy trình x?y ra trong **1 l?n g?i API duy nh?t**.

---

## ?? Quy Trình COD (7 B??c)

```
Client ? POST /api/v1/checkout (paymentMethod: "COD")
    ?
1. L?y Gi? hàng (Cart + CartItems)
    ?
2. Ki?m tra T?n kho (Final Stock Check)
    ?
3. Tính toán (SubTotal + Shipping - Voucher)
    ?
4. T?o Order (Status: PROCESSING, PaymentStatus: UNPAID)
    ?
5. Sao chép Items (OrderItems with snapshot)
    ?
6. T?o Transaction Log (Gateway: COD, Status: PENDING)
    ?
7. Tr? Kho + D?n Gi? hàng + G?i Email
    ?
Client ? 201 Created (v?i chi ti?t ??n hàng)
```

---

## ?? Chi Ti?t T?ng B??c

### 1?? L?y Gi? Hàng
```csharp
var cart = await _context.Carts
    .Include(c => c.CartItems)
        .ThenInclude(ci => ci.ProductVariant)
            .ThenInclude(v => v.Product)
    .Include(c => c.AppliedDiscounts)
        .ThenInclude(ad => ad.Discount)
    .FirstOrDefaultAsync(c => c.UserId == userId);

if (cart == null || !cart.CartItems.Any())
{
    return BadRequest("Gi? hàng tr?ng");
}
```

**Ki?m tra:**
- ? Cart t?n t?i
- ? CartItems không r?ng
- ? Include ??y ?? relationships

---

### 2?? Ki?m Tra T?n Kho
```csharp
foreach (var cartItem in cart.CartItems)
{
    if (cartItem.ProductVariant.Stock < cartItem.Quantity)
    {
        return BadRequest($"S?n ph?m '{cartItem.ProductVariant.Product.Name}' ?ã h?t hàng");
    }
}
```

**Lý do:**
- T?n kho có th? thay ??i gi?a lúc thêm vào gi? và lúc checkout
- ?ây là **final check** tr??c khi t?o ??n hàng

---

### 3?? Tính Toán
```csharp
var subTotal = cart.CartItems.Sum(ci => ci.Quantity * ci.UnitPrice);
var shippingFee = CalculateShippingFee(subTotal);

// Áp d?ng voucher (n?u có)
decimal voucherDiscount = 0;
foreach (var appliedDiscount in cart.AppliedDiscounts)
{
    var discount = appliedDiscount.Discount;
    if (discount.IsActive && subTotal >= discount.MinOrderAmount)
    {
        decimal discountAmount = discount.DiscountType == DiscountType.PERCENTAGE
            ? subTotal * (discount.DiscountValue / 100)
            : discount.DiscountValue;
        voucherDiscount += discountAmount;
    }
}

var totalAmount = subTotal + shippingFee - voucherDiscount;
```

**Logic:**
- SubTotal = T?ng giá tr? s?n ph?m
- ShippingFee = 30,000 VND (ho?c free n?u SubTotal >= 500,000)
- VoucherDiscount = T?ng gi?m giá t? vouchers ?ã áp d?ng
- TotalAmount = SubTotal + ShippingFee - VoucherDiscount

---

### 4?? T?o Order
```csharp
var orderNumber = await GenerateOrderNumber(); // ORDyyyyMMddxxxx

var order = new Order
{
    UserId = userId,
    OrderNumber = orderNumber,
    TotalAmount = totalAmount,
    Status = "PROCESSING",          // ?? NOT "PENDING_PAYMENT"
    PaymentMethod = "COD",
    PaymentStatus = "UNPAID",       // S? ???c Admin update thành "PAID"
    ShippingFullName = request.ShippingAddress.FullName,
    ShippingPhone = request.ShippingAddress.Phone,
    ShippingStreet = request.ShippingAddress.Address,
    ShippingWard = request.ShippingAddress.Ward,
    ShippingDistrict = request.ShippingAddress.District,
    ShippingProvince = request.ShippingAddress.City,
    ShippingNotes = request.ShippingAddress.Notes,
    OrderDate = DateTime.UtcNow,
    CreatedAt = DateTime.UtcNow,
    UpdatedAt = DateTime.UtcNow
};

_context.Orders.Add(order);
await _context.SaveChangesAsync();
```

**?i?m Quan Tr?ng:**
- ? **Status = "PROCESSING"** ? ??n hàng s?n sàng cho kho x? lý ngay
- ? **PaymentStatus = "UNPAID"** ? Admin s? c?p nh?t sau khi shipper confirm
- ? **OrderNumber format:** `ORD{yyyyMMdd}{sequence}` (ví d?: ORD202501150001)

---

### 5?? Sao Chép Items (Snapshot)
```csharp
var orderItems = new List<OrderItem>();
foreach (var cartItem in cart.CartItems)
{
    var orderItem = new OrderItem
    {
        OrderId = order.Id,
        ProductVariantId = cartItem.ProductVariantId,
        ProductName = cartItem.ProductVariant.Product.Name, // Snapshot
        Quantity = cartItem.Quantity,
        UnitPrice = cartItem.UnitPrice,                    // Snapshot
        TotalPrice = cartItem.Quantity * cartItem.UnitPrice,
        CreatedAt = DateTime.UtcNow
    };
    orderItems.Add(orderItem);

    // TR? KHO ngay l?p t?c (CH? v?i COD)
    cartItem.ProductVariant.Stock -= cartItem.Quantity;
}
_context.OrderItems.AddRange(orderItems);
```

**Lý do Snapshot:**
- ProductName và UnitPrice có th? thay ??i sau này
- OrderItems l?u l?i giá tr? **t?i th?i ?i?m ??t hàng**

**Tr? Kho:**
- ? COD: Tr? kho **ngay l?p t?c**
- ? Online Payment: Ch? tr? khi webhook confirm thành công

---

### 6?? T?o Transaction Log
```csharp
var codTransaction = new Transaction
{
    OrderId = order.Id,
    Gateway = "COD",
    Amount = order.TotalAmount,
    Status = "PENDING",              // S? thành "SUCCESS" khi Admin confirm
    TransactionType = "PAYMENT",
    GatewayTransactionId = null,     // NULL cho COD
    GatewayResponse = null,          // NULL cho COD
    CreatedAt = DateTime.UtcNow,
    UpdatedAt = DateTime.UtcNow
};
_context.Transactions.Add(codTransaction);
```

**M?c ?ích:**
- Ghi log t?t c? giao d?ch thanh toán (k? c? COD)
- Giúp tracking và báo cáo d? dàng
- Status "PENDING" ? Admin c?p nh?t thành "SUCCESS" khi shipper confirm ?ã thu ti?n

---

### 7?? D?n Gi? Hàng + G?i Email
```csharp
// D?N D?P GI? HÀNG (B?T BU?C)
_context.CartItems.RemoveRange(cart.CartItems);
_context.AppliedDiscounts.RemoveRange(cart.AppliedDiscounts);
_context.Carts.Remove(cart); // ?? XÓA C? CART RECORD

await _context.SaveChangesAsync();
await transaction.CommitAsync();

// G?I EMAIL XÁC NH?N (TODO: Implement)
_logger.LogInformation(
    "Order {OrderNumber} created successfully for user {UserId}. Email confirmation should be sent.", 
    order.OrderNumber, userId);
// await _emailService.SendOrderConfirmationAsync(order);
```

**Quan Tr?ng:**
- ?? Ph?i xóa **C?** `Cart` record (không ch? `CartItems`)
- ?? Ph?i xóa `AppliedDiscounts` ?? không còn voucher c?
- ? Email service là TODO (ch?a implement)

---

## ?? Database Changes

### Orders Table
```sql
INSERT INTO Orders (
    Id, UserId, OrderNumber, TotalAmount, 
    Status, PaymentMethod, PaymentStatus,
    ShippingFullName, ShippingPhone, ShippingStreet,
    ShippingWard, ShippingDistrict, ShippingProvince,
    OrderDate, CreatedAt, UpdatedAt
) VALUES (
    NEWID(), '...', 'ORD202501150001', 230000,
    'PROCESSING', -- ? NOT PENDING_PAYMENT
    'COD',
    'UNPAID',     -- ? Correct
    'Nguy?n Test', '0912345678', '123 Test St',
    'Ph??ng 1', 'Qu?n 1', 'TP.HCM',
    GETUTCDATE(), GETUTCDATE(), GETUTCDATE()
);
```

### OrderItems Table
```sql
INSERT INTO OrderItems (
    Id, OrderId, ProductVariantId, 
    ProductName, Quantity, UnitPrice, TotalPrice, CreatedAt
) VALUES (
    NEWID(), '...', '...',
    'Test Product', -- Snapshot
    2, 
    100000,         -- Snapshot
    200000,
    GETUTCDATE()
);
```

### Transactions Table
```sql
INSERT INTO Transactions (
    Id, OrderId, Gateway, Amount, 
    Status, TransactionType, 
    GatewayTransactionId, GatewayResponse,
    CreatedAt, UpdatedAt
) VALUES (
    NEWID(), '...', 'COD', 230000,
    'PENDING',  -- ? Will be SUCCESS when Admin confirms
    'PAYMENT',
    NULL,       -- No gateway ID for COD
    NULL,       -- No gateway response
    GETUTCDATE(), GETUTCDATE()
);
```

### ProductVariants Table
```sql
UPDATE ProductVariants
SET Stock = Stock - 2  -- Tr? ?i quantity
WHERE Id = '...';
```

### Carts + CartItems Tables
```sql
DELETE FROM CartItems WHERE CartId = '...';
DELETE FROM AppliedDiscounts WHERE CartId = '...';
DELETE FROM Carts WHERE Id = '...';
```

---

## ?? Verification SQL

```sql
-- Run: ShopWave/Docs/SQL_VerifyCODTransactions.sql

-- Quick check
SELECT 
    o.OrderNumber,
    o.Status,           -- Should be 'PROCESSING'
    o.PaymentStatus,    -- Should be 'UNPAID'
    t.Gateway,          -- Should be 'COD'
    t.Status            -- Should be 'PENDING'
FROM Orders o
INNER JOIN Transactions t ON o.Id = t.OrderId
WHERE o.PaymentMethod = 'COD'
ORDER BY o.OrderDate DESC;
```

---

## ? Testing Checklist

Xem file: [COD_TESTING_CHECKLIST.md](./COD_TESTING_CHECKLIST.md)

**Key Tests:**
- ? COD order creation (happy path)
- ? Out of stock handling
- ? Empty cart handling
- ? Transaction log created
- ? Cart deleted
- ? Stock reduced
- ? 201 Created status code

---

## ?? Common Mistakes (?ã Fix)

### ? Mistake 1: Cart không b? xóa
**Before:**
```csharp
_context.CartItems.RemoveRange(cart.CartItems);
// Missing: _context.Carts.Remove(cart);
```

**After (Fixed):**
```csharp
_context.CartItems.RemoveRange(cart.CartItems);
_context.AppliedDiscounts.RemoveRange(cart.AppliedDiscounts);
_context.Carts.Remove(cart); // ? Added
```

### ? Mistake 2: Transaction log không ???c t?o
**Before:**
```csharp
// No transaction log for COD
```

**After (Fixed):**
```csharp
var codTransaction = new Transaction
{
    OrderId = order.Id,
    Gateway = "COD",
    Amount = order.TotalAmount,
    Status = "PENDING",
    TransactionType = "PAYMENT"
};
_context.Transactions.Add(codTransaction); // ? Added
```

### ? Mistake 3: Wrong Order Status
**Before:**
```csharp
Status = "PENDING_PAYMENT" // ? Wrong for COD
```

**After (Fixed):**
```csharp
Status = request.PaymentMethod == "COD" ? "PROCESSING" : "PENDING_PAYMENT" // ? Correct
```

### ? Mistake 4: Wrong HTTP Status Code
**Before:**
```csharp
return Ok(response); // 200 OK
```

**After (Fixed):**
```csharp
return StatusCode(201, response); // ? 201 Created
```

---

## ?? Related Documentation

- [CHECKOUT_PAYMENT_GUIDE.md](./CHECKOUT_PAYMENT_GUIDE.md) - Full guide
- [COD_TESTING_CHECKLIST.md](./COD_TESTING_CHECKLIST.md) - Test cases
- [SQL_VerifyCODTransactions.sql](./SQL_VerifyCODTransactions.sql) - Verification script
- [CHECKOUT_QUICK_START.md](./CHECKOUT_QUICK_START.md) - Quick reference

---

## ?? Next Steps

### For Backend:
- [ ] Implement Email Service
- [ ] Add Admin API ?? update PaymentStatus
- [ ] Add logging/monitoring

### For Testing:
- [ ] Test with real data
- [ ] Load testing
- [ ] Error scenario testing

### For Deployment:
- [ ] Environment configuration
- [ ] Database migration
- [ ] Monitoring setup

---

## ?? Support

N?u có v?n ??, ki?m tra:
1. Logs: `_logger.LogInformation/LogError`
2. Database: Run `SQL_VerifyCODTransactions.sql`
3. API Response: Check status code và error messages

---

**Status:** ? Implementation Complete  
**Updated:** 2025-01-15  
**Version:** 1.0
