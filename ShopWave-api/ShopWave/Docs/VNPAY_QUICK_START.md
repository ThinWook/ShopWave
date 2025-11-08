# ?? VNPay Quick Start Guide

## ? In 5 Minutes

### 1. Configuration (Already Done ?)
```json
// appsettings.json
{
  "VNPay": {
    "TmnCode": "EHVSLSY9",
    "HashSecret": "NVAYQUKO2NSIX03LKWF651S44FOSVIT3",
    "Url": "https://sandbox.vnpayment.vn/paymentv2/vpcpay.html",
    "PaymentBackReturnUrl": "http://localhost:5001/api/v1/payments/return"
  }
}
```

### 2. Test Flow

#### Client calls checkout API:
```bash
POST http://localhost:5001/api/v1/checkout
Content-Type: application/json

{
  "paymentMethod": "VNPAY",
  "shippingAddress": {
    "fullName": "Test User",
    "phone": "0901234567",
    "address": "123 Test St",
    "ward": "Ward 1",
    "district": "District 1",
    "city": "Ho Chi Minh"
  }
}
```

#### Response:
```json
{
  "success": true,
  "data": {
    "paymentUrl": "https://sandbox.vnpayment.vn/paymentv2/vpcpay.html?...",
    "orderId": "guid",
    "transactionId": "guid"
  }
}
```

#### Redirect user to `paymentUrl`

#### Test Card (VNPay Sandbox):
```
Bank: NCB
Card: 9704198526191432198
Name: NGUYEN VAN A
Expiry: 07/15
OTP: 123456
```

---

## ?? API Endpoints

| Method | Endpoint | Purpose | Auth |
|--------|----------|---------|------|
| POST | `/api/v1/checkout` | Create order & payment URL | Optional |
| GET/POST | `/api/v1/payments/webhook/vnpay` | VNPay IPN callback | None |
| GET | `/api/v1/payments/return` | User redirect (UX only) | None |

---

## ?? Key Points

### ? What Happens on Checkout?
1. Order created with `Status = "PENDING_PAYMENT"`
2. Transaction created with `Status = "PENDING"`
3. Payment URL generated
4. **Stock NOT reduced** (waits for webhook)
5. **Cart NOT deleted** (waits for webhook)

### ? What Happens on Webhook?
1. Validate VNPay signature
2. Check idempotency (prevent double-processing)
3. If `vnp_ResponseCode = "00"`:
   - Transaction `Status = "SUCCESS"`
   - Order `Status = "PROCESSING"`, `PaymentStatus = "PAID"`
   - **Stock reduced NOW**
   - **Cart deleted NOW**
4. Else:
   - Transaction `Status = "FAILED"`
   - Order `Status = "CANCELLED"`

### ? Response Codes
- `00` = Success ?
- `24` = User cancelled ?
- `51` = Insufficient funds ?
- Other = Failed ?

---

## ?? Testing Checklist

- [ ] Can create order with VNPAY method
- [ ] Payment URL is generated correctly
- [ ] Can complete payment in sandbox
- [ ] Webhook updates order status to "PROCESSING"
- [ ] Transaction status becomes "SUCCESS"
- [ ] Stock is reduced after webhook
- [ ] Cart is deleted after webhook
- [ ] Failed payment cancels order
- [ ] Idempotency prevents duplicate processing

---

## ?? Troubleshooting

### Payment URL not working?
- Check VNPay configuration in `appsettings.json`
- Verify signature generation (check logs)
- Ensure `TmnCode` and `HashSecret` are correct

### Webhook not called?
- VNPay sandbox may have delays (5-30 seconds)
- Check if order is still `PENDING_PAYMENT`
- Manually test webhook endpoint

### Stock not reduced?
- Webhook must be called first
- Check transaction status (should be "SUCCESS")
- Verify logs for webhook processing

### Signature validation failed?
- Ensure `HashSecret` matches VNPay config
- Check HMAC-SHA512 implementation
- Verify parameter ordering

---

## ?? Full Documentation
See: `ShopWave/Docs/VNPAY_INTEGRATION_COMPLETE.md`

---

**Status:** ? Ready to Test
