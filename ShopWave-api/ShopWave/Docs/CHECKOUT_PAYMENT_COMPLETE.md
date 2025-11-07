# ? CHECKOUT & PAYMENT SYSTEM - IMPLEMENTATION COMPLETE

## ?? T?ng K?t Tri?n Khai

### ?? Nh?ng Gì ?ã Hoàn Thành

? **1. Controllers**
- `CheckoutController.cs` - API chính t?o ??n hàng v?i 2 flow (COD và Online Payment)
- `PaymentWebhookController.cs` - API ph? x? lý webhook t? VNPay/MoMo

? **2. Services**
- `IPaymentGatewayService.cs` - Interface ??nh ngh?a contract
- `PaymentGatewayService.cs` - Implementation cho VNPay và MoMo

? **3. Configuration**
- `appsettings.json` - C?u hình VNPay và MoMo (Sandbox)
- `Program.cs` - ??ng ký PaymentGatewayService vào DI container

? **4. Documentation**
- `CHECKOUT_PAYMENT_GUIDE.md` - H??ng d?n chi ti?t ??y ??

---

## ?? 2 Quy Trình Chính

### **Flow 1: COD (Cash On Delivery)**
```
Client ? POST /api/v1/checkout (paymentMethod: "COD")
    ?
Backend:
  1. L?y gi? hàng
  2. Ki?m tra t?n kho
  3. Tính toán (subTotal, shipping, voucher)
  4. T?o Order (Status: PROCESSING, PaymentStatus: UNPAID)
  5. Tr? kho ngay l?p t?c
  6. D?n gi? hàng
  7. Tr? v? chi ti?t ??n hàng
    ?
Client: Chuy?n sang trang "C?m ?n"
```

### **Flow 2: Online Payment (VNPay/MoMo)**
```
Client ? POST /api/v1/checkout (paymentMethod: "VNPAY"/"MOMO")
    ?
Backend:
  1. L?y gi? hàng
  2. Ki?m tra t?n kho
  3. Tính toán
  4. T?o Order (Status: PENDING_PAYMENT, PaymentStatus: UNPAID)
  5. T?o Transaction (Status: PENDING)
  6. KHÔNG d?n gi? hàng (quan tr?ng!)
  7. T?o Payment URL
  8. Tr? v? Payment URL
    ?
Client: Redirect user ??n VNPay/MoMo
    ?
User: Thanh toán trên trang VNPay/MoMo
    ?
VNPay/MoMo ? POST /api/v1/payments/webhook/vnpay (Server-to-Server)
    ?
Backend Webhook:
  1. Xác th?c ch? ký (Security!)
  2. Tìm Transaction và Order
  3. N?u thành công (ResponseCode = "00"):
     - Update Transaction.Status = "SUCCESS"
     - Update Order.Status = "PROCESSING"
     - Update Order.PaymentStatus = "PAID"
     - TR? KHO (lúc này m?i tr?)
     - D?N GI? HÀNG (lúc này m?i d?n)
     - G?i email xác nh?n
  4. N?u th?t b?i:
     - Update Transaction.Status = "FAILED"
     - Update Order.Status = "CANCELLED"
  5. Tr? v? 200 OK cho VNPay/MoMo
    ?
VNPay/MoMo ? Return URL (redirect user)
    ?
Client: Hi?n th? trang thành công/th?t b?i
```

---

## ?? API Endpoints

### 1. Checkout API (Main)
```http
POST /api/v1/checkout
Authorization: Bearer {token}
Content-Type: application/json

{
  "paymentMethod": "COD" | "VNPAY" | "MOMO",
  "shippingAddress": {
    "fullName": "Nguy?n V?n A",
    "phone": "0912345678",
    "address": "123 ???ng ABC",
    "ward": "Ph??ng 1",
    "district": "Qu?n 1",
    "city": "TP. H? Chí Minh",
    "notes": "G?i tr??c khi giao"
  },
  "billingAddress": { ... } // Optional
}
```

**Response (COD):**
```json
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
      "orderDate": "2025-01-15T10:30:00Z",
      "orderItems": [...]
    }
  }
}
```

**Response (Online):**
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

### 2. Webhook APIs (Payment Gateway Callbacks)
```http
POST /api/v1/payments/webhook/vnpay
GET  /api/v1/payments/webhook/vnpay
POST /api/v1/payments/webhook/momo
```

### 3. Return URL (User Redirect)
```http
GET /api/v1/payments/return?gateway=vnpay&vnp_ResponseCode=00&...
```

---

## ?? Security Features

### ? 1. Signature Validation (Xác Th?c Ch? Ký)
- **VNPay:** HMAC-SHA512
- **MoMo:** HMAC-SHA256

### ? 2. Transaction Idempotency
- Webhook ki?m tra `Transaction.Status != "PENDING"` ?? tránh x? lý trùng

### ? 3. Stock Locking
- COD: Tr? kho ngay khi t?o order
- Online: Tr? kho khi webhook confirm thành công

### ? 4. Cart Protection
- COD: D?n gi? ngay
- Online: Gi? gi? cho ??n khi thanh toán thành công

---

## ?? Configuration

### appsettings.json
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

### Program.cs
```csharp
builder.Services.AddScoped<IPaymentGatewayService, PaymentGatewayService>();
```

---

## ?? Testing Guide

### 1. Test COD Flow
```bash
curl -X POST https://localhost:5001/api/v1/checkout \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "paymentMethod": "COD",
    "shippingAddress": {
      "fullName": "Nguy?n V?n A",
      "phone": "0912345678",
      "address": "123 Test Street",
      "ward": "Ph??ng 1",
      "district": "Qu?n 1",
      "city": "TP. H? Chí Minh"
    }
  }'
```

**Expected:**
- ? Order t?o v?i Status = "PROCESSING"
- ? PaymentStatus = "UNPAID"
- ? Kho ?ã b? tr?
- ? Gi? hàng ?ã b? xóa

### 2. Test VNPay Flow

**Step 1: T?o Payment URL**
```bash
curl -X POST https://localhost:5001/api/v1/checkout \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "paymentMethod": "VNPAY",
    "shippingAddress": { ... }
  }'
```

**Expected:**
- ? Nh?n ???c `paymentUrl`
- ? Order t?o v?i Status = "PENDING_PAYMENT"
- ? Transaction t?o v?i Status = "PENDING"
- ? Kho ch?a b? tr?
- ? Gi? hàng v?n còn

**Step 2: Thanh Toán**
- Truy c?p `paymentUrl` trên trình duy?t
- S? d?ng th? test VNPay:
  ```
  Ngân hàng: NCB
  S? th?: 9704198526191432198
  Tên: NGUYEN VAN A
  Ngày phát hành: 07/15
  OTP: 123456
  ```

**Step 3: Webhook Callback**
- VNPay t? ??ng g?i `/api/v1/payments/webhook/vnpay`
- Check logs ?? verify

**Expected After Webhook:**
- ? Transaction.Status = "SUCCESS"
- ? Order.Status = "PROCESSING"
- ? Order.PaymentStatus = "PAID"
- ? Kho ?ã b? tr?
- ? Gi? hàng ?ã b? xóa

### 3. Test Webhook v?i Ngrok

```bash
# Cài ??t ngrok
ngrok http 5001

# Copy URL t? ngrok (vd: https://abc123.ngrok.io)
# C?p nh?t IpnUrl trong appsettings.json:
"IpnUrl": "https://abc123.ngrok.io/api/v1/payments/webhook/momo"
```

---

## ?? Database Schema

### Orders Table
```sql
Status: PENDING_PAYMENT | PROCESSING | SHIPPED | DELIVERED | CANCELLED
PaymentStatus: UNPAID | PAID
PaymentMethod: COD | VNPAY | MOMO
```

### Transactions Table
```sql
Status: PENDING | SUCCESS | FAILED
Gateway: VNPAY | MOMO | COD
```

---

## ?? Next Steps

### 1. Sandbox Registration
- [ ] ??ng ký VNPay Sandbox: https://sandbox.vnpayment.vn/
- [ ] ??ng ký MoMo Sandbox: https://developers.momo.vn/

### 2. Configuration
- [ ] L?y credentials t? VNPay/MoMo
- [ ] C?p nh?t `appsettings.json`
- [ ] Setup ngrok cho webhook testing

### 3. Frontend Integration
- [ ] T?o checkout page
- [ ] Handle payment redirect
- [ ] Create success/failure pages

### 4. Email Service
- [ ] Implement order confirmation email
- [ ] Integrate SendGrid/AWS SES

### 5. Production Deployment
- [ ] Chuy?n t? Sandbox sang Production
- [ ] C?u hình domain cho IpnUrl
- [ ] Setup monitoring & alerts
- [ ] Load testing

---

## ?? References

- [VNPay API Documentation](https://sandbox.vnpayment.vn/apis/)
- [MoMo API Documentation](https://developers.momo.vn/)
- [CHECKOUT_PAYMENT_GUIDE.md](./CHECKOUT_PAYMENT_GUIDE.md) - Chi ti?t ??y ??

---

## ? Checklist Hoàn Thành

- [x] CheckoutController.cs
- [x] PaymentWebhookController.cs
- [x] IPaymentGatewayService.cs
- [x] PaymentGatewayService.cs
- [x] appsettings.json configuration
- [x] Program.cs service registration
- [x] CHECKOUT_PAYMENT_GUIDE.md
- [x] Build successful
- [ ] ??ng ký VNPay/MoMo sandbox
- [ ] Test COD flow
- [ ] Test VNPay flow
- [ ] Test MoMo flow
- [ ] Frontend integration

---

**?? H? th?ng checkout và payment ?ã s?n sàng ?? test!**

**Made with ?? for ShopWave**
