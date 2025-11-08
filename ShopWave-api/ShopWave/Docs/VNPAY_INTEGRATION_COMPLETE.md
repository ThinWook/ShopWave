# ?? VNPay Integration - Complete Implementation Guide

## ? Status: **IMPLEMENTATION COMPLETE**

---

## ?? Overview

This guide documents the complete VNPay payment gateway integration for ShopWave e-commerce platform. The implementation follows VNPay API v2.1.0 specifications and best practices for secure online payments.

---

## ??? Architecture

### Payment Flow

```
????????????                                                      ???????????
?  Client  ?                                                      ?  VNPay  ?
? (Next.js)?                                                      ? Gateway ?
????????????                                                      ???????????
     ?                                                                 ?
     ? 1. POST /api/v1/checkout (paymentMethod: "VNPAY")              ?
     ????????????????????????????????????????                         ?
     ?                                      ?                         ?
     ?                        ??????????????????????????????          ?
     ?                        ?   CheckoutController       ?          ?
     ?                        ?                            ?          ?
     ?                        ?  • Create Order            ?          ?
     ?                        ?    Status: PENDING_PAYMENT ?          ?
     ?                        ?  • Create Transaction      ?          ?
     ?                        ?    Status: PENDING         ?          ?
     ?                        ?  • Generate Payment URL    ?          ?
     ?                        ?    (VnPayService)          ?          ?
     ?                        ??????????????????????????????          ?
     ? 2. Response: { paymentUrl }          ?                         ?
     ?????????????????????????????????????????                        ?
     ?                                                                 ?
     ? 3. User redirects to paymentUrl                                ?
     ???????????????????????????????????????????????????????????????????
     ?                                                                 ?
     ?                           4. User pays                          ?
     ?                                                                 ?
     ?                           ???????????????????????????????????  ?
     ?                           ?   Two parallel callbacks:       ?  ?
     ?                           ?                                 ?  ?
     ?                           ?   A. IPN Webhook (Critical!)    ?  ?
     ?                           ?      ? Processes payment        ?  ?
     ?                           ?      ? Updates order status     ?  ?
     ?                           ?      ? Reduces stock            ?  ?
     ?                           ?      ? Deletes cart             ?  ?
     ?                           ?                                 ?  ?
     ?                           ?   B. Return URL (UX only)       ?  ?
     ?                           ?      ? Redirects to frontend    ?  ?
     ?                           ???????????????????????????????????  ?
     ?                                      ?                          ?
     ? 5. Webhook: POST /api/v1/payments/webhook/vnpay                ?
     ?                                      ????????????????????????????
     ?                                      ?                          
     ?                        ??????????????????????????????          
     ?                        ? PaymentWebhookController   ?          
     ?                        ?                            ?          
     ?                        ?  • Validate signature      ?          
     ?                        ?  • Check idempotency       ?          
     ?                        ?  • Update transaction      ?          
     ?                        ?  • Update order            ?          
     ?                        ?  • Reduce stock            ?          
     ?                        ?  • Delete cart             ?          
     ?                        ??????????????????????????????          
     ?                                                                 
     ? 6. Return: GET /api/v1/payments/return?vnp_ResponseCode=00     
     ??????????????????????????????????????????????????????????????????
     ?                                                                 
     ? 7. Redirect to frontend success page                           
     ?                                                                 
```

---

## ?? Files Implemented

### 1. Configuration
**File:** `ShopWave/appsettings.json`
```json
{
  "VNPay": {
    "TmnCode": "EHVSLSY9",
    "HashSecret": "NVAYQUKO2NSIX03LKWF651S44FOSVIT3",
    "Url": "https://sandbox.vnpayment.vn/paymentv2/vpcpay.html",
    "Version": "2.1.0",
    "Command": "pay",
    "CurrCode": "VND",
    "Locale": "vn",
    "TimeZoneId": "SE Asia Standard Time",
    "PaymentBackReturnUrl": "http://localhost:5001/api/v1/payments/return"
  }
}
```

### 2. Core Library
**File:** `ShopWave/Services/VnPayLibrary.cs`
- HMAC-SHA512 signature generation
- URL encoding/decoding utilities
- Signature validation
- IP address extraction

### 3. Service Layer
**File:** `ShopWave/Services/IVnPayService.cs`
```csharp
public interface IVnPayService
{
    string CreatePaymentUrl(PaymentInformationModel model, HttpContext context, Guid transactionId);
    PaymentResponseModel PaymentExecute(IQueryCollection collections);
}
```

**File:** `ShopWave/Services/VnPayService.cs`
- Payment URL generation with transaction ID as reference
- Callback processing with signature validation
- Error handling and logging

### 4. Models
**File:** `ShopWave/Models/PaymentInformationModel.cs`
```csharp
public class PaymentInformationModel
{
    public double Amount { get; set; }
    public string Name { get; set; }
    public string OrderDescription { get; set; }
    public string OrderType { get; set; }
}
```

**File:** `ShopWave/Services/VnPayService.cs` (PaymentResponseModel)
```csharp
public class PaymentResponseModel
{
    public bool Success { get; set; }
    public string PaymentMethod { get; set; }
    public string OrderDescription { get; set; }
    public string OrderId { get; set; }  // Transaction ID
    public string TransactionId { get; set; }  // VNPay transaction number
    public string Token { get; set; }
    public string VnPayResponseCode { get; set; }
}
```

### 5. Controllers
**File:** `ShopWave/Controllers/CheckoutController.cs`
- Integrated VnPayService for payment URL generation
- Creates order with `PENDING_PAYMENT` status
- Creates transaction record
- Does NOT reduce stock or delete cart (waits for webhook)

**File:** `ShopWave/Controllers/PaymentWebhookController.cs`
- **`HandleVnpayWebhook()`** - Critical IPN endpoint
  - Validates VNPay signature
  - Implements idempotency check
  - Updates transaction and order status
  - Reduces stock on success
  - Deletes cart on success
  
- **`PaymentReturn()`** - User redirect endpoint
  - Only for user experience
  - Redirects to frontend success/failed page

### 6. Dependency Injection
**File:** `ShopWave/Program.cs`
```csharp
builder.Services.AddScoped<IVnPayService, VnPayService>();
```

---

## ?? Security Features

### 1. Signature Validation (HMAC-SHA512)
```csharp
// In VnPayLibrary.cs
private string HmacSHA512(string key, string inputData)
{
    var hash = new StringBuilder();
    byte[] keyBytes = Encoding.UTF8.GetBytes(key);
    byte[] inputBytes = Encoding.UTF8.GetBytes(inputData);
    using (var hmac = new HMACSHA512(keyBytes))
    {
        byte[] hashValue = hmac.ComputeHash(inputBytes);
        foreach (var theByte in hashValue)
        {
            hash.Append(theByte.ToString("x2"));
        }
    }
    return hash.ToString();
}
```

### 2. Idempotency Check
```csharp
// In PaymentWebhookController.cs
if (transaction.Status != "PENDING")
{
    _logger.LogInformation("Transaction already processed: {TransactionId}", transactionId);
    return Ok(new { RspCode = "00", Message = "Already processed" });
}
```

### 3. Transaction ID as Reference
- Uses `Guid` transaction ID as `vnp_TxnRef`
- Ensures unique reference for each payment attempt
- Prevents duplicate processing

---

## ?? Database Changes

### Transaction Record (Enhanced)
```sql
Transactions
??? Id (Guid, PK) - Used as vnp_TxnRef
??? OrderId (FK to Orders)
??? Gateway = "VNPAY"
??? GatewayTransactionId - VNPay's transaction number
??? Amount
??? Status - PENDING ? SUCCESS/FAILED
??? GatewayResponse - Full callback JSON
??? IpAddress
??? UserAgent
??? CreatedAt
??? UpdatedAt
??? CompletedAt - Set when webhook processes
```

### Order Status Flow
```
PENDING_PAYMENT (created) 
    ? (webhook success)
PROCESSING (ready for shipping)
    ? (webhook failure)
CANCELLED
```

---

## ?? Testing Guide

### 1. VNPay Sandbox Credentials
```
TmnCode: EHVSLSY9
HashSecret: NVAYQUKO2NSIX03LKWF651S44FOSVIT3
URL: https://sandbox.vnpayment.vn/paymentv2/vpcpay.html
```

### 2. Test Payment Flow

**Step 1: Create Checkout**
```bash
curl -X POST http://localhost:5001/api/v1/checkout \
  -H "Content-Type: application/json" \
  -H "X-Session-Id: test-session-123" \
  -d '{
    "paymentMethod": "VNPAY",
    "shippingAddress": {
      "fullName": "Nguyen Van A",
      "phone": "0901234567",
      "address": "123 Nguyen Hue",
      "ward": "Ben Nghe",
      "district": "Quan 1",
      "city": "Ho Chi Minh"
    }
  }'
```

**Expected Response:**
```json
{
  "success": true,
  "message": "PAYMENT_URL_GENERATED",
  "data": {
    "status": "OK",
    "paymentMethod": "VNPAY",
    "paymentUrl": "https://sandbox.vnpayment.vn/paymentv2/vpcpay.html?vnp_Amount=...&vnp_TxnRef=<transaction-guid>&...",
    "orderId": "...",
    "transactionId": "..."
  }
}
```

**Step 2: Test Cards (VNPay Sandbox)**
```
Bank: NCB
Card Number: 9704198526191432198
Card Holder: NGUYEN VAN A
Expiry: 07/15
OTP: 123456
```

**Step 3: Verify Webhook**
```bash
# Check transaction status
curl http://localhost:5001/api/v1/transactions/<transaction-id> \
  -H "Authorization: Bearer <token>"

# Expected: Status = "SUCCESS", CompletedAt filled
```

**Step 4: Verify Order**
```bash
curl http://localhost:5001/api/v1/orders/<order-id> \
  -H "Authorization: Bearer <token>"

# Expected: 
# - Status = "PROCESSING"
# - PaymentStatus = "PAID"
# - Stock reduced
# - Cart deleted
```

### 3. Test Webhook Directly (Development)
```bash
curl -X GET "http://localhost:5001/api/v1/payments/webhook/vnpay?vnp_TxnRef=<transaction-guid>&vnp_TransactionNo=VNP12345&vnp_ResponseCode=00&vnp_Amount=150000000&vnp_SecureHash=..."
```

---

## ?? VNPay Response Codes

| Code | Meaning | Action |
|------|---------|--------|
| `00` | Success | Process order, reduce stock, delete cart |
| `07` | Suspicious transaction | Cancel order, log for review |
| `09` | Card not registered | Cancel order |
| `10` | Wrong authentication | Cancel order |
| `11` | Timeout | Cancel order, allow retry |
| `24` | User cancelled | Cancel order |
| `51` | Insufficient funds | Cancel order, allow retry |
| `65` | Transaction limit exceeded | Cancel order, notify user |

---

## ?? Logging

### Key Log Messages
```csharp
// Payment URL creation
_logger.LogInformation("VNPay payment URL created for transaction {TransactionId}", transactionId);

// Webhook received
_logger.LogInformation("VNPay webhook received: {Query}", Request.QueryString);

// Signature validation
_logger.LogWarning("Invalid VNPay signature or failed payment");

// Success processing
_logger.LogInformation("Payment SUCCESS for Order: {OrderNumber}, Transaction: {TransactionId}", 
    transaction.Order.OrderNumber, transactionId);

// Stock reduction
_logger.LogInformation("Stock reduced for variant {VariantId}: -{Quantity}", 
    orderItem.ProductVariantId, orderItem.Quantity);

// Cart deletion
_logger.LogInformation("Cart deleted for user {UserId}", transaction.Order.UserId);
```

---

## ?? Important Notes

### 1. Race Condition Handling
The webhook usually arrives **before** the user returns to the website. The implementation handles this with:
- Idempotency check (prevents duplicate processing)
- Status-based locking (`Status != "PENDING"`)
- Frontend polling for order status updates

### 2. Stock Reduction
- **COD:** Stock reduced immediately on order creation
- **VNPAY:** Stock reduced only when webhook confirms success
- **Failure:** Stock unchanged, order cancelled

### 3. Cart Deletion
- **COD:** Cart deleted immediately
- **VNPAY:** Cart deleted only when webhook confirms success
- **Failure:** Cart remains, user can retry payment

### 4. Frontend Integration
Frontend should:
1. Receive `paymentUrl` from checkout API
2. Redirect user to `paymentUrl`
3. After redirect back, poll order status API
4. Show success when `Status = "PROCESSING"` and `PaymentStatus = "PAID"`

---

## ?? Production Checklist

- [ ] Update VNPay credentials in production `appsettings.json`
- [ ] Set `PaymentBackReturnUrl` to production domain
- [ ] Configure webhook URL in VNPay merchant portal
- [ ] Enable HTTPS for all endpoints
- [ ] Set up IP whitelisting for webhook endpoint
- [ ] Configure monitoring and alerts for failed transactions
- [ ] Test signature validation with production keys
- [ ] Set up logging and error tracking (e.g., Sentry)
- [ ] Implement retry logic for failed webhooks
- [ ] Add rate limiting to webhook endpoint
- [ ] Document deployment process for team

---

## ?? Related Documentation

- **VNPay API Guide:** VNPay API v2.1.0 Documentation
- **Transactions Table:** `ShopWave/Docs/TRANSACTIONS_TABLE_GUIDE.md`
- **Checkout Flows:** `ShopWave/Docs/CHECKOUT_FLOWS_VISUAL.md`
- **Payment Gateway Service:** `ShopWave/Services/PaymentGatewayService.cs`

---

## ?? Summary

? **VNPay integration is now complete!**

**What we implemented:**
- ? VnPayLibrary for signature generation/validation
- ? VnPayService for payment URL creation
- ? CheckoutController integration
- ? PaymentWebhookController for IPN processing
- ? Proper security with HMAC-SHA512
- ? Idempotency handling
- ? Transaction tracking
- ? Stock management on webhook success
- ? Cart cleanup on webhook success
- ? Complete logging and error handling

**Key Features:**
- ?? Secure signature validation
- ?? Idempotent webhook processing
- ?? Complete transaction audit trail
- ??? Race condition handling
- ?? Comprehensive logging
- ?? Ready for testing with sandbox

**Production Ready:** After completing the checklist above, this implementation is production-ready!

---

**Created:** 2025-01-XX  
**Status:** ? **COMPLETE**  
**Version:** 1.0  
**VNPay API Version:** 2.1.0
