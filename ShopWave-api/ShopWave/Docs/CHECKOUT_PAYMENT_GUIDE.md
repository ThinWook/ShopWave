# ?? CHECKOUT & PAYMENT SYSTEM - IMPLEMENTATION GUIDE

## ?? T?ng Quan

H? th?ng checkout và thanh toán ???c chia thành **2 quy trình chính**:

### 1. ?? API Chính: T?o ??n hàng (POST /api/v1/checkout)
- Endpoint duy nh?t mà client (frontend) g?i khi nh?n nút "Hoàn t?t ??n hàng"
- X? lý logic khác nhau tùy theo `PaymentMethod`

### 2. ?? API Ph?: Webhook (POST /api/v1/payments/webhook/{gateway})
- Endpoint do c?ng thanh toán (VNPay/MoMo) g?i ?? thông báo k?t qu?
- Server-to-Server callback

---

## ?? C?u Trúc Th? M?c

```
ShopWave/
??? Controllers/
?   ??? CheckoutController.cs          # API chính - t?o ??n hàng
?   ??? PaymentWebhookController.cs    # API ph? - webhook t? payment gateway
??? Services/
?   ??? IPaymentGatewayService.cs      # Interface
?   ??? PaymentGatewayService.cs       # Implementation cho VNPay, MoMo
??? Docs/
    ??? CHECKOUT_PAYMENT_GUIDE.md      # File này
```

---

## ?? FLOW 1: Thanh Toán COD (Cash On Delivery)

### Request t? Client:
```json
POST /api/v1/checkout
Authorization: Bearer {token}

{
  "paymentMethod": "COD",
  "shippingAddress": {
    "fullName": "Nguy?n V?n A",
    "phone": "0912345678",
    "address": "123 ???ng ABC",
    "ward": "Ph??ng 1",
    "district": "Qu?n 1",
    "city": "TP. H? Chí Minh",
    "notes": "G?i tr??c khi giao"
  }
}
```

### Logic Backend (CheckoutController):

```csharp
// 1. L?Y GI? HÀNG
var cart = await _cartService.GetCartAsync(User, Request);

// 2. KI?M TRA T?N KHO (FINAL CHECK)
foreach (var cartItem in cart.Items)
{
    if (cartItem.ProductVariant.Stock < cartItem.Quantity)
        return BadRequest("M?t s?n ph?m trong gi? ?ã h?t hàng.");
}

// 3. TÍNH TOÁN
var subTotal = cart.Items.Sum(ci => ci.Quantity * ci.UnitPrice);
var shippingFee = CalculateShippingFee(subTotal);
var voucherDiscount = CalculateVoucherDiscount(cart.AppliedDiscounts, subTotal);
var totalAmount = subTotal + shippingFee - voucherDiscount;

// 4. T?O ??N HÀNG
var order = new Order
{
    Status = "PROCESSING",     // ? S?n sàng ?? kho x? lý
    PaymentStatus = "UNPAID",  // Ch?a thanh toán (COD)
    PaymentMethod = "COD",
    // ... ??a ch? và thông tin khác
};

// 5. SAO CHÉP (SNAPSHOT) ITEMS
foreach (var cartItem in cart.Items)
{
    var orderItem = new OrderItem
    {
        OrderId = order.Id,
        ProductVariantId = cartItem.ProductVariantId,
        ProductName = cartItem.ProductVariant.Product.Name, // Snapshot
        Quantity = cartItem.Quantity,
        UnitPrice = cartItem.UnitPrice,                    // Snapshot
        TotalPrice = cartItem.Quantity * cartItem.UnitPrice
    };
    _context.OrderItems.Add(orderItem);
    
    // TR? KHO
    cartItem.ProductVariant.Stock -= cartItem.Quantity;
}

// 6. T?O GIAO D?CH (Transaction Log)
var codTransaction = new Transaction
{
    OrderId = order.Id,
    Gateway = "COD",
    Amount = order.TotalAmount,
    Status = "PENDING", // S? ???c c?p nh?t thành SUCCESS khi shipper confirm
    TransactionType = "PAYMENT"
};
_context.Transactions.Add(codTransaction);

// 7. D?N D?P GI? HÀNG (B?T BU?C)
_context.CartItems.RemoveRange(cart.Items);
_context.AppliedDiscounts.RemoveRange(cart.AppliedDiscounts);
_context.Carts.Remove(cart); // ?? XÓA C? CART RECORD

// 8. L?U VÀ G?I EMAIL
await _context.SaveChangesAsync();
await _emailService.SendOrderConfirmationAsync(order); // TODO: Implement

// 9. TR? V? 201 CREATED
return StatusCode(201, new { status = "OK", data = orderDto });
```

### Response:
```json
HTTP/1.1 201 Created

{
  "success": true,
  "message": "ORDER_CREATED",
  "data": {
    "status": "OK",
    "paymentMethod": "COD",
    "order": {
      "id": "...",
      "orderNumber": "ORD202501150001",
      "totalAmount": 500000,
      "status": "PROCESSING",
      "paymentStatus": "UNPAID",
      "orderDate": "2025-01-15T10:30:00Z"
    }
  }
}
```

### Client Action:
- ? Chuy?n sang trang "C?m ?n" (`/checkout/success`)
- Hi?n th? thông tin ??n hàng

### ?i?m Quan Tr?ng:
1. ? **Transaction Log**: T?o record trong `Transactions` v?i Gateway="COD" và Status="PENDING"
2. ? **Xóa Cart**: Xóa c? `Cart` record (không ch? `CartItems`)
3. ? **Status**: Order.Status = "PROCESSING" (không ph?i "PENDING_PAYMENT")
4. ? **PaymentStatus**: "UNPAID" ? Admin s? c?p nh?t thành "PAID" sau khi shipper confirm
5. ? **Email**: G?i email xác nh?n ??n hàng (c?n implement service)
6. ? **HTTP Code**: Tr? v? 201 Created (không ph?i 200 OK)

---

## ?? FLOW 2: Thanh Toán Online (VNPay/MoMo)

### A. Request t? Client:
```json
POST /api/v1/checkout
Authorization: Bearer {token}

{
  "paymentMethod": "VNPAY",  // ho?c "MOMO"
  "shippingAddress": { ... }
}
```

### B. Logic Backend (CheckoutController):

```csharp
// 1-3. Gi?ng COD (l?y gi? hàng, ki?m tra, tính toán)

// 4. T?O ??N HÀNG
var order = new Order
{
    Status = "PENDING_PAYMENT",  // ? Kho KHÔNG x? lý
    PaymentStatus = "UNPAID",
    // ...
};

// 5. T?O GIAO D?CH (Transaction)
var transaction = new Transaction
{
    OrderId = order.Id,
    Gateway = "VNPAY",
    Amount = order.TotalAmount,
    Status = "PENDING",
    // ...
};

// 6. ? KHÔNG D?N GI? HÀNG (quan tr?ng!)
// Gi? hàng ch? ???c d?n khi webhook confirm thanh toán thành công

// 7. T?O URL THANH TOÁN
var paymentUrl = await _paymentGatewayService.CreatePaymentUrl(
    "VNPAY", order, transaction.Id, returnUrl
);

// 8. TR? V? URL
return Ok(new { status = "OK", data = new { paymentUrl } });
```

### C. Response:
```json
{
  "success": true,
  "message": "PAYMENT_URL_GENERATED",
  "data": {
    "status": "OK",
    "paymentMethod": "VNPAY",
    "paymentUrl": "https://sandbox.vnpayment.vn/paymentv2/vpcpay.html?vnp_Amount=..."
  }
}
```

### D. Client Action:
- ? Chuy?n h??ng user ??n `paymentUrl`
- User th?c hi?n thanh toán trên trang VNPay/MoMo

### E. Sau khi thanh toán, VNPay/MoMo g?i 2 endpoint:

#### 1. Return URL (cho client):
```
GET /api/v1/payments/return?gateway=vnpay&vnp_ResponseCode=00&...
```
- Backend redirect v? trang thành công/th?t b?i
- `window.location.href = "/checkout/success"` ho?c `"/checkout/failed"`

#### 2. Webhook (server-to-server):
```
POST /api/v1/payments/webhook/vnpay
```

---

## ?? FLOW 3: Webhook (VNPay/MoMo ? Backend)

### Logic Backend (PaymentWebhookController):

```csharp
[HttpPost("webhook/vnpay")]
public async Task<IActionResult> HandleVnpayWebhook()
{
    // 1. XÁC TH?C CH? KÝ (Security!)
    if (!_paymentGatewayService.ValidateVnpaySignature(queryParams))
        return BadRequest("Invalid Signature");

    // 2. TÌM GIAO D?CH & ??N HÀNG
    var transaction = await _context.Transactions
        .Include(t => t.Order)
            .ThenInclude(o => o.OrderItems)
        .FirstOrDefaultAsync(t => t.Id == transactionId);

    if (transaction.Status != "PENDING")
        return Ok("Already processed");

    // 3. C?P NH?T TR?NG THÁI
    transaction.GatewayTransactionId = vnpTransactionNo;
    transaction.GatewayResponse = JsonSerializer.Serialize(queryParams);

    // 4. THÀNH CÔNG?
    if (vnp_ResponseCode == "00")
    {
        // ? THANH TOÁN THÀNH CÔNG
        transaction.Status = "SUCCESS";
        transaction.Order.Status = "PROCESSING";  // S?n sàng cho kho
        transaction.Order.PaymentStatus = "PAID";

        // TR? KHO (Lúc này m?i tr?!)
        foreach (var orderItem in transaction.Order.OrderItems)
        {
            orderItem.ProductVariant.Stock -= orderItem.Quantity;
        }

        // D?N GI? HÀNG (NGAY BÂY GI?)
        var cart = await _context.Carts
            .Include(c => c.CartItems)
            .FirstOrDefaultAsync(c => c.UserId == transaction.Order.UserId);
        
        if (cart != null)
        {
            _context.CartItems.RemoveRange(cart.CartItems);
            cart.AppliedVoucherCode = null;
        }

        // G?i email xác nh?n
        await _emailService.SendOrderConfirmation(transaction.Order);
    }
    else
    {
        // ? TH?T B?I
        transaction.Status = "FAILED";
        transaction.Order.Status = "CANCELLED";
    }

    await _context.SaveChangesAsync();
    return Ok(new { RspCode = "00", Message = "Confirm Success" });
}
```

---

## ?? Security: Xác Th?c Ch? Ký

### VNPay:
```csharp
public bool ValidateVnpaySignature(Dictionary<string, string> queryParams)
{
    var vnp_SecureHash = queryParams["vnp_SecureHash"];
    
    // L?y t?t c? params tr? vnp_SecureHash
    var signData = string.Join("&", 
        queryParams.Where(x => x.Key != "vnp_SecureHash")
                  .OrderBy(x => x.Key)
                  .Select(x => $"{x.Key}={x.Value}")
    );
    
    var computedHash = HmacSHA512(vnp_HashSecret, signData);
    return computedHash.Equals(vnp_SecureHash, StringComparison.InvariantCultureIgnoreCase);
}
```

### MoMo:
```csharp
public bool ValidateMomoSignature(MomoWebhookPayload payload)
{
    var rawSignature = $"accessKey={accessKey}&amount={payload.Amount}&message={payload.Message}&orderId={payload.OrderId}&partnerCode={partnerCode}&resultCode={payload.ResultCode}&transId={payload.TransId}";
    
    var computedSignature = HmacSHA256(secretKey, rawSignature);
    return computedSignature.Equals(payload.Signature, StringComparison.InvariantCultureIgnoreCase);
}
```

---

## ?? Configuration (appsettings.json)

```json
{
  "VNPay": {
    "TmnCode": "YOUR_VNPAY_TMN_CODE",
    "HashSecret": "YOUR_VNPAY_HASH_SECRET",
    "Url": "https://sandbox.vnpayment.vn/paymentv2/vpcpay.html"
  },
  "MoMo": {
    "PartnerCode": "YOUR_MOMO_PARTNER_CODE",
    "AccessKey": "YOUR_MOMO_ACCESS_KEY",
    "SecretKey": "YOUR_MOMO_SECRET_KEY",
    "Endpoint": "https://test-payment.momo.vn/v2/gateway/api/create",
    "IpnUrl": "https://your-domain.com/api/v1/payments/webhook/momo"
  }
}
```

**?? L?u ý:**
- S? d?ng **User Secrets** cho development
- Dùng **Environment Variables** cho production
- KHÔNG commit các key này lên Git!

---

## ?? Testing

### 1. Test COD:
```bash
curl -X POST https://localhost:5001/api/v1/checkout \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "paymentMethod": "COD",
    "shippingAddress": {
      "fullName": "Test User",
      "phone": "0912345678",
      "address": "123 Test St",
      "ward": "Ward 1",
      "district": "District 1",
      "city": "Ho Chi Minh",
      "notes": "Test order"
    }
  }'
```

### 2. Test VNPay:
```bash
curl -X POST https://localhost:5001/api/v1/checkout \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "paymentMethod": "VNPAY",
    "shippingAddress": { ... }
  }'
```

**VNPay Sandbox Test Cards:**
- Ngân hàng: NCB
- S? th?: 9704198526191432198
- Tên ch? th?: NGUYEN VAN A
- Ngày phát hành: 07/15
- M?t kh?u OTP: 123456

### 3. Test Webhook:
S? d?ng **ngrok** ?? expose localhost:
```bash
ngrok http 5001
```

C?u hình IpnUrl trong MoMo:
```
https://your-ngrok-url.ngrok.io/api/v1/payments/webhook/momo
```

---

## ?? Database Schema

### Orders Table:
```sql
CREATE TABLE Orders (
    Id UNIQUEIDENTIFIER PRIMARY KEY,
    UserId UNIQUEIDENTIFIER,
    OrderNumber NVARCHAR(50),
    TotalAmount DECIMAL(18,2),
    Status NVARCHAR(50),        -- PENDING_PAYMENT (online), PROCESSING (COD/paid), SHIPPED, DELIVERED, CANCELLED
    PaymentMethod NVARCHAR(50), -- COD, VNPAY, MOMO
    PaymentStatus NVARCHAR(50), -- UNPAID, PAID
    ShippingFullName NVARCHAR(255),
    ShippingPhone NVARCHAR(20),
    ShippingStreet NVARCHAR(500),
    ShippingWard NVARCHAR(100),
    ShippingDistrict NVARCHAR(100),
    ShippingProvince NVARCHAR(100),
    -- ... (Billing fields t??ng t?)
    OrderDate DATETIME2,
    CreatedAt DATETIME2,
    UpdatedAt DATETIME2
);
```

### Transactions Table:
```sql
CREATE TABLE Transactions (
    Id UNIQUEIDENTIFIER PRIMARY KEY,
    OrderId UNIQUEIDENTIFIER,
    Gateway NVARCHAR(50),            -- VNPAY, MOMO, COD
    Amount DECIMAL(18,2),
    Status NVARCHAR(50),             -- PENDING, SUCCESS, FAILED
    TransactionType NVARCHAR(50),    -- PAYMENT, REFUND, CHARGEBACK
    GatewayTransactionId NVARCHAR(255), -- NULL for COD
    GatewayResponse NVARCHAR(MAX),      -- NULL for COD
    ErrorMessage NVARCHAR(1000),
    IpAddress NVARCHAR(50),
    CreatedAt DATETIME2,
    CompletedAt DATETIME2,          -- Set when shipper confirms (for COD)
    UpdatedAt DATETIME2
);
```

### Status Flow cho COD:
```sql
-- Khi t?o ??n COD
Orders.Status = 'PROCESSING'
Orders.PaymentStatus = 'UNPAID'
Transactions.Gateway = 'COD'
Transactions.Status = 'PENDING'

-- Khi shipper confirm ?ã thu ti?n (Admin c?p nh?t)
Orders.PaymentStatus = 'PAID'
Transactions.Status = 'SUCCESS'
Transactions.CompletedAt = GETUTCDATE()
