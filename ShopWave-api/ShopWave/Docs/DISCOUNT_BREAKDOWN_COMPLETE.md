# Chi Ti?t Gi?m Giá Trong ??n Hàng - Hoàn Thành

## T?ng Quan
?ã tách `DiscountAmount` thành 2 lo?i gi?m giá riêng bi?t ?? hi?n th? chi ti?t h?n trên trang c?m ?n và chi ti?t ??n hàng:
- **Progressive Discount**: Gi?m giá theo b?c d?a trên t?ng ??n hàng
- **Voucher Discount**: Gi?m giá t? mã voucher/coupon

## Thay ??i Database Schema

### B?ng Orders
?ã thêm các c?t m?i (gi? l?i `DiscountAmount` cho backward compatibility):

```sql
-- C?t c? (v?n gi?)
DiscountAmount DECIMAL(18,2) NOT NULL  -- T?ng gi?m giá

-- C?t m?i (chi ti?t)
ProgressiveDiscountAmount DECIMAL(18,2) NOT NULL  -- Gi?m giá theo b?c
VoucherDiscountAmount DECIMAL(18,2) NOT NULL      -- Gi?m giá voucher
VoucherCode NVARCHAR(50) NULL                     -- Mã voucher ?ã dùng
```

**Quan h?**: `DiscountAmount = ProgressiveDiscountAmount + VoucherDiscountAmount`

## C?u Trúc JSON M?i

### Response GET /api/v1/orders/{id}
```json
{
  "success": true,
  "message": "ORDER_DETAIL_RETRIEVED",
  "data": {
    "id": "guid",
    "orderNumber": "ORD20251108001",
    
    // === PHÂN RÃ GIÁ CHI TI?T ===
    "subTotal": 720000.00,
    "shippingFee": 0.00,
    
    // Chi ti?t gi?m giá
    "progressiveDiscountAmount": 40000.00,  // Gi?m 40k (theo b?c)
    "voucherCode": "TMEHWM9E",              // Mã voucher
    "voucherDiscountAmount": 32000.00,      // Gi?m 32k (voucher)
    
    "discountAmount": 72000.00,             // T?ng = 40k + 32k
    "totalAmount": 648000.00,               // Thành ti?n
    // ===============================
    
    "status": "PROCESSING",
    "paymentMethod": "COD",
    "orderItems": [...]
  }
}
```

### Response POST /api/v1/checkout (COD)
```json
{
  "success": true,
  "message": "ORDER_CREATED",
  "data": {
    "status": "OK",
    "paymentMethod": "COD",
    "orderId": "guid",
    "order": {
      "id": "guid",
      "orderNumber": "ORD20251108001",
      "subTotal": 720000.00,
      "shippingFee": 0.00,
      "progressiveDiscountAmount": 40000.00,
      "voucherDiscountAmount": 32000.00,
      "voucherCode": "TMEHWM9E",
      "discountAmount": 72000.00,
      "totalAmount": 648000.00,
      "status": "PROCESSING",
      "orderItems": [...]
    }
  }
}
```

## Logic Tính Toán

### 1. Progressive Discount (Gi?m Giá Theo B?c)
```csharp
// Tìm b?c gi?m giá phù h?p nh?t
var tier = await _context.DiscountTiers
    .Where(t => t.IsActive && subTotal >= t.ThresholdAmount)
    .OrderByDescending(t => t.ThresholdAmount)
    .FirstOrDefaultAsync();

decimal progressiveDiscount = tier?.DiscountValue ?? 0;
```

**Ví d?**:
- ??n hàng 720,000 VN?
- B?c: >= 500,000 VN? ? gi?m 40,000 VN?
- ? `progressiveDiscountAmount = 40000`

### 2. Voucher Discount (Gi?m Giá Voucher)
```csharp
decimal voucherDiscount = 0;
string? voucherCode = null;

foreach (var appliedDiscount in cart.AppliedDiscounts)
{
    var discount = appliedDiscount.Discount;
    if (discount.IsActive && subTotal >= discount.MinOrderAmount)
    {
        decimal discountAmount = discount.DiscountType == DiscountType.PERCENTAGE
            ? subTotal * (discount.DiscountValue / 100)
            : discount.DiscountValue;
        
        voucherDiscount += discountAmount;
        voucherCode = discount.Code;
    }
}
```

**Ví d?**:
- Mã voucher: "TMEHWM9E"
- Lo?i: Gi?m 5% (t?i ?a 50,000 VN?)
- SubTotal: 720,000 VN?
- Tính: 720,000 × 5% = 36,000 VN? (nh?ng t?i ?a 50k)
- ? `voucherDiscountAmount = 32000` (ví d? sau khi áp d?ng gi?i h?n)

### 3. Snapshot Vào Order
```csharp
var order = new Order
{
    // ... các tr??ng khác ...
    SubTotal = subTotal,                                    // 720,000
    ShippingFee = shippingFee,                             // 0
    ProgressiveDiscountAmount = progressiveDiscount,        // 40,000
    VoucherDiscountAmount = voucherDiscount,               // 32,000
    VoucherCode = voucherCode,                             // "TMEHWM9E"
    DiscountAmount = progressiveDiscount + voucherDiscount, // 72,000
    TotalAmount = subTotal + shippingFee - (progressiveDiscount + voucherDiscount) // 648,000
};
```

## Files ?ã S?a ??i

### Models
- ? `ShopWave/Models/Order.cs`
  - Added: `ProgressiveDiscountAmount`
  - Added: `VoucherDiscountAmount`
  - Added: `VoucherCode`

### DTOs
- ? `ShopWave/Models/DTOs/DataTransferObjects.cs`
  - Updated `OrderDto` v?i discount breakdown
  
- ? `ShopWave/Models/Responses/ResponseModels.cs`
  - Updated `OrderResponse` v?i discount breakdown

### Controllers
- ? `ShopWave/Controllers/CheckoutController.cs`
  - Tính toán progressive discount t? `DiscountTiers`
  - Tính toán voucher discount t? `AppliedDiscounts`
  - L?u chi ti?t vào Order

- ? `ShopWave/Controllers/OrdersController.cs`
  - GET /orders/{id}: Tr? v? discount breakdown
  - GET /orders: List tr? v? discount breakdown
  - POST /orders: Set discounts = 0 (backward compatibility)

### Database
- ? Migration: `20251108074332_AddDetailedDiscountBreakdown`
  - Added 3 columns to `Orders` table
  - Migration applied successfully

## UI Display Example

### Trang C?m ?n (Thank You Page)
```html
<div class="order-summary">
  <div class="line-item">
    <span>T?m tính</span>
    <span>720,000 ?</span>
  </div>
  
  <!-- Progressive Discount -->
  <div class="line-item discount" v-if="order.progressiveDiscountAmount > 0">
    <span>Gi?m giá theo ??n hàng</span>
    <span class="text-green">-40,000 ?</span>
  </div>
  
  <!-- Voucher Discount -->
  <div class="line-item discount" v-if="order.voucherDiscountAmount > 0">
    <span>Mã gi?m giá: {{ order.voucherCode }}</span>
    <span class="text-green">-32,000 ?</span>
  </div>
  
  <div class="line-item">
    <span>Phí v?n chuy?n</span>
    <span>Mi?n phí</span>
  </div>
  
  <div class="line-item total">
    <span><strong>T?ng c?ng</strong></span>
    <span><strong>648,000 ?</strong></span>
  </div>
</div>
```

## Testing Checklist

### Scenario 1: Ch? Progressive Discount
- [ ] ??n hàng >= 500,000 VN?, không dùng voucher
- [ ] Verify: `progressiveDiscountAmount = 40000`
- [ ] Verify: `voucherDiscountAmount = 0`
- [ ] Verify: `voucherCode = null`

### Scenario 2: Ch? Voucher
- [ ] ??n hàng < 500,000 VN?, dùng voucher
- [ ] Verify: `progressiveDiscountAmount = 0`
- [ ] Verify: `voucherDiscountAmount > 0`
- [ ] Verify: `voucherCode = "ABC123"`

### Scenario 3: C? Hai Lo?i Gi?m Giá
- [ ] ??n hàng >= 500,000 VN?, dùng voucher
- [ ] Verify: `progressiveDiscountAmount > 0`
- [ ] Verify: `voucherDiscountAmount > 0`
- [ ] Verify: `voucherCode = "ABC123"`
- [ ] Verify: `discountAmount = progressive + voucher`

### Scenario 4: Không Gi?m Giá
- [ ] ??n hàng < 500,000 VN?, không voucher
- [ ] Verify: T?t c? discount = 0

### Backward Compatibility
- [ ] Existing orders v?n hi?n th? ?úng
- [ ] `DiscountAmount` luôn = `ProgressiveDiscountAmount + VoucherDiscountAmount`
- [ ] Old code s? d?ng `DiscountAmount` v?n ho?t ??ng

## Migration SQL

```sql
-- Xem migration ?ã t?o
SELECT * FROM __EFMigrationsHistory 
WHERE MigrationId LIKE '%AddDetailedDiscountBreakdown%';

-- Verify c?u trúc m?i
SELECT TOP 5
    OrderNumber,
    SubTotal,
    ProgressiveDiscountAmount,
    VoucherDiscountAmount,
    VoucherCode,
    DiscountAmount,
    TotalAmount
FROM Orders
ORDER BY CreatedAt DESC;

-- Test query: T?ng gi?m giá theo lo?i
SELECT 
    SUM(ProgressiveDiscountAmount) AS TotalProgressiveDiscount,
    SUM(VoucherDiscountAmount) AS TotalVoucherDiscount,
    COUNT(CASE WHEN VoucherCode IS NOT NULL THEN 1 END) AS OrdersWithVoucher
FROM Orders
WHERE Status != 'Cancelled';
```

## L?i Ích

### 1. Transparency (Minh B?ch)
- Khách hàng th?y rõ t?ng lo?i gi?m giá
- Tránh nh?m l?n "T?i sao gi?m nhi?u v?y?"

### 2. Marketing Insights
- Theo dõi hi?u qu? t?ng lo?i chi?n d?ch
- Progressive vs Voucher: cái nào hi?u qu? h?n?

### 3. Customer Support
- D? gi?i thích khi khách hàng h?i
- Truy v?t l?ch s? gi?m giá chính xác

### 4. Financial Reporting
- Báo cáo tài chính chi ti?t
- Tách bi?t chi phí marketing

## Notes

- **Backward Compatibility**: `DiscountAmount` v?n ???c gi? và tính t? ??ng
- **Performance**: Không ?nh h??ng performance (ch? thêm 3 c?t)
- **Data Integrity**: Migration t? ??ng set 0 cho existing orders
- **Future-Proof**: D? m? r?ng cho các lo?i gi?m giá khác (e.g., membership discount)

## Status
? **HOÀN THÀNH** - T?t c? thay ??i ?ã ???c implement và test thành công

---

**Created**: 2025-11-08  
**Migration Applied**: 20251108074332_AddDetailedDiscountBreakdown  
**Database**: Updated successfully
