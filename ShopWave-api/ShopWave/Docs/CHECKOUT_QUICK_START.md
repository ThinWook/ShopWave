# ?? QUICK START: Checkout & Payment

## 1?? C?u Hình (5 phút)

### appsettings.json
```json
{
  "VNPay": {
    "TmnCode": "DEMO",
    "HashSecret": "DEMOHASHSECRET",
    "Url": "https://sandbox.vnpayment.vn/paymentv2/vpcpay.html"
  },
  "MoMo": {
    "PartnerCode": "MOMOPARTNER",
    "AccessKey": "ACCESSKEY",
    "SecretKey": "SECRETKEY",
    "Endpoint": "https://test-payment.momo.vn/v2/gateway/api/create",
    "IpnUrl": "https://your-ngrok-url.ngrok.io/api/v1/payments/webhook/momo"
  }
}
```

---

## 2?? API Calls

### COD Order
```bash
POST /api/v1/checkout
{
  "paymentMethod": "COD",
  "shippingAddress": {
    "fullName": "Nguy?n V?n A",
    "phone": "0912345678",
    "address": "123 ABC",
    "ward": "Ph??ng 1",
    "district": "Qu?n 1",
    "city": "TP.HCM"
  }
}
```

### Online Payment
```bash
POST /api/v1/checkout
{
  "paymentMethod": "VNPAY",
  "shippingAddress": { ... }
}

? Response: { "paymentUrl": "..." }
? Redirect user to paymentUrl
```

---

## 3?? VNPay Test Card
```
Ngân hàng: NCB
S? th?: 9704198526191432198
Tên: NGUYEN VAN A
Ngày: 07/15
OTP: 123456
```

---

## 4?? Webhook Testing with Ngrok

```bash
# Terminal 1: Run API
dotnet run

# Terminal 2: Run ngrok
ngrok http 5001

# Copy ngrok URL ? Update IpnUrl in appsettings.json
```

---

## 5?? Ki?m Tra K?t Qu?

### COD
```sql
SELECT * FROM Orders WHERE Status = 'PROCESSING' AND PaymentMethod = 'COD'
SELECT * FROM ProductVariants -- Check Stock ?ã tr?
SELECT * FROM CartItems -- Gi? ?ã xóa
```

### VNPay/MoMo
```sql
-- Before Payment
SELECT * FROM Orders WHERE Status = 'PENDING_PAYMENT'
SELECT * FROM Transactions WHERE Status = 'PENDING'

-- After Payment Success
SELECT * FROM Orders WHERE Status = 'PROCESSING' AND PaymentStatus = 'PAID'
SELECT * FROM Transactions WHERE Status = 'SUCCESS'
SELECT * FROM ProductVariants -- Stock ?ã tr?
SELECT * FROM CartItems -- Gi? ?ã xóa
```

---

## 6?? Common Issues

### ? "Invalid Signature"
? Check HashSecret/SecretKey
? Verify signature algorithm

### ? "Transaction already processed"
? Normal - webhook ???c g?i nhi?u l?n
? System ?ã handle idempotency

### ? "Webhook not called"
? Check ngrok URL
? Verify IpnUrl configuration
? Check VNPay/MoMo merchant settings

---

## 7?? Logs to Watch

```csharp
// CheckoutController
_logger.LogInformation("Creating order for user {UserId}", userId);

// PaymentWebhookController
_logger.LogInformation("VNPay webhook received: {Params}", ...);
_logger.LogInformation("Payment successful for Order: {OrderNumber}", ...);
_logger.LogWarning("Payment failed for Order: {OrderNumber}", ...);
```

---

## ?? Full Docs
- [CHECKOUT_PAYMENT_GUIDE.md](./CHECKOUT_PAYMENT_GUIDE.md)
- [CHECKOUT_PAYMENT_COMPLETE.md](./CHECKOUT_PAYMENT_COMPLETE.md)

---

**That's it! B?t ??u test ngay! ??**
