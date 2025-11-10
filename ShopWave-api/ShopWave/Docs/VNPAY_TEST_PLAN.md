# VNPay 404 Fix - Complete Test Plan

## ?? Test Objective

Verify that users can successfully view their order details after completing VNPay payment without encountering 404 errors.

## ??? Prerequisites

### Backend Setup
- ? Build successful
- ? Database migrated and seeded
- ? VNPay configuration in `appsettings.json`:
  ```json
  "VNPay": {
    "TmnCode": "YOUR_TMN_CODE",
    "HashSecret": "YOUR_HASH_SECRET",
    "Url": "https://sandbox.vnpayment.vn/paymentv2/vpcpay.html",
    "PaymentBackReturnUrl": "http://localhost:3000/checkout/result"
  }
  ```

### Frontend Setup (Required Changes)
- Update `/checkout/result` to extract `orderId` from URL
- Ensure `X-Session-Id` header is sent with API requests

## ?? Test Scenarios

### ? Scenario 1: Guest User - Successful Payment

**Steps:**
1. Open browser in incognito/private mode
2. Navigate to `http://localhost:3000`
3. Add 2-3 products to cart
4. Click "Proceed to Checkout"
5. Fill in shipping address:
   ```
   Full Name: John Doe
   Phone: 0123456789
   Address: 123 Test Street
   Ward: Ward 1
   District: District 1
   City: Ho Chi Minh City
   ```
6. Select payment method: **VNPay**
7. Click "Complete Order"
8. **Verify**: Redirected to VNPay payment page
9. On VNPay sandbox, enter test card:
   ```
   Card Number: 9704198526191432198
   Card Holder: NGUYEN VAN A
   Expiry: 07/15
   OTP: 123456
   ```
10. Complete payment

**Expected Results:**
- ? Redirected to: `http://localhost:3000/checkout/result?orderId={guid}&vnp_ResponseCode=00&vnp_TxnRef={transactionId}`
- ? `orderId` parameter is present in URL
- ? Automatically redirected to: `http://localhost:3000/thank-you?orderId={guid}`
- ? Order details display correctly:
  - Order number
  - Order items
  - Subtotal
  - Shipping fee
  - Discounts (if any)
  - Total amount
  - Payment status (may show "UNPAID" initially, then "PAID" after webhook)
- ? **NO 404 ERROR**

**Backend Logs to Check:**
```
INFO: VNPay payment URL created for Order {OrderId}, Transaction {TransactionId}
INFO: Order {OrderNumber} created successfully for guest
```

---

### ? Scenario 2: Logged-in User - Successful Payment

**Steps:**
1. Login to account
2. Add 2-3 products to cart
3. Click "Proceed to Checkout"
4. Fill in shipping address
5. Select payment method: **VNPay**
6. Click "Complete Order"
7. Complete payment on VNPay sandbox
8. Verify redirect back to site

**Expected Results:**
- ? Redirected to: `/checkout/result?orderId={guid}&vnp_ResponseCode=00`
- ? Redirected to: `/thank-you?orderId={guid}`
- ? Order details display correctly
- ? Order appears in "My Orders" page
- ? Can access order later via "My Orders"

---

### ? Scenario 3: Payment Cancellation

**Steps:**
1. Add products to cart (guest or logged-in)
2. Proceed to checkout
3. Select VNPay payment
4. On VNPay page, click "Cancel"

**Expected Results:**
- ? Redirected to: `/checkout/result?orderId={guid}&vnp_ResponseCode=24`
- ? Should show payment failed/cancelled message
- ? Order exists with status "PENDING_PAYMENT"
- ? Can retry payment from order details

---

### ? Scenario 4: Authorization - Guest Cannot Access Other Orders

**Setup:**
1. User A (guest) creates order ? Order ID: `abc-123`
2. User A gets sessionId: `session-xyz`

**Steps:**
1. Open new incognito window (new session)
2. Try to access: `http://localhost:3000/thank-you?orderId=abc-123`
3. (Frontend will call: `GET /api/v1/orders/abc-123` with different sessionId)

**Expected Results:**
- ? Backend returns 403 Forbidden
- ? Frontend shows "Access Denied" or similar message

**Backend Response:**
```json
{
  "status": "FAIL",
  "code": "FORBIDDEN",
  "errors": [
    {
      "field": "auth",
      "message": "Forbidden",
      "code": "FORBIDDEN"
    }
  ]
}
```

---

### ? Scenario 5: Authorization - User A Cannot Access User B's Orders

**Setup:**
1. User A creates order ? Order ID: `abc-123`
2. User B logs in

**Steps:**
1. User B tries to access: `/api/v1/orders/abc-123`

**Expected Results:**
- ? Backend returns 403 Forbidden
- ? Message: "You don't have permission to view this order"

---

### ? Scenario 6: Webhook Processing (Parallel Test)

**Setup:**
1. Start payment flow
2. Monitor both return URL and webhook

**Steps:**
1. Complete VNPay payment
2. Check browser network tab
3. Check backend logs

**Expected Results:**

**Return URL Flow:**
```
1. User redirected: /checkout/result?orderId=abc-123&vnp_ResponseCode=00
2. Frontend calls: GET /api/v1/orders/abc-123
3. Backend returns: Status = "PENDING_PAYMENT" (webhook not processed yet)
```

**Webhook Flow (parallel):**
```
1. VNPay server calls: POST /api/v1/payments/vnpay/webhook
2. Backend validates signature
3. Backend updates order status: "PAID"
4. Backend responds: { RspCode: "00", Message: "success" }
```

**Timeline:**
- T+0s: User returns to site ? Order shows "PENDING_PAYMENT"
- T+1-2s: Webhook processes ? Order updates to "PAID"
- User refreshes page ? Order shows "PAID"

---

### ? Scenario 7: Multiple Items with Discounts

**Steps:**
1. Add 3 products totaling > 500,000 VND (free shipping)
2. Apply voucher code (if available)
3. Proceed to checkout with VNPay
4. Complete payment

**Expected Results:**
- ? Order details show:
  - Subtotal: X VND
  - Shipping fee: 0 VND (free shipping threshold)
  - Progressive discount: Y VND (if applicable)
  - Voucher discount: Z VND (if applied)
  - Total discount: Y + Z VND
  - Total amount: X - (Y + Z) VND
- ? All calculations match checkout page

---

### ? Scenario 8: Stock Deduction (COD vs VNPay)

**COD Flow:**
```
1. Add product (stock: 10) to cart
2. Checkout with COD
3. Order created ? Stock immediately reduced to 9
```

**VNPay Flow:**
```
1. Add product (stock: 10) to cart
2. Checkout with VNPay
3. Order created ? Stock still 10 (not reduced yet)
4. Complete payment ? Webhook processes ? Stock reduced to 9
```

**Test:**
1. Check product stock before checkout: `SELECT Stock FROM ProductVariants WHERE Id = 'xxx'`
2. Create order with VNPay
3. Check stock after order creation (before payment): Should be unchanged
4. Complete payment
5. Check stock after webhook: Should be reduced

---

## ?? Debug Checklist

### Frontend Issues

**Problem: Still getting 404**
- [ ] Check: Is `orderId` in return URL? (`console.log(searchParams.entries())`)
- [ ] Check: Is frontend using `searchParams.get('orderId')`? (not `vnp_TxnRef`)
- [ ] Check: Browser network tab - what is the actual API call?
- [ ] Check: API response status and body

**Problem: Getting 403 Forbidden (Guest)**
- [ ] Check: Is `X-Session-Id` header being sent?
- [ ] Check: Does localStorage/cookie have sessionId?
- [ ] Check: Is sessionId the same as when order was created?

**Problem: Order shows PENDING_PAYMENT forever**
- [ ] Check: Did webhook receive callback? (check backend logs)
- [ ] Check: VNPay IPN URL configuration in merchant portal
- [ ] Check: Is webhook endpoint publicly accessible?

### Backend Issues

**Problem: Return URL doesn't have orderId**
- [ ] Check: `PaymentInformationModel` has `OrderId` property
- [ ] Check: `CheckoutController` passes `order.Id` to payment model
- [ ] Check: `VnPayService` appends `?orderId={model.OrderId}` to return URL
- [ ] Check: Build successful and latest code deployed

**Problem: Webhook not processing**
- [ ] Check: Webhook endpoint: `POST /api/v1/payments/vnpay/webhook`
- [ ] Check: Signature validation in webhook
- [ ] Check: Transaction status update logic
- [ ] Check: VNPay IPN URL in merchant configuration

---

## ?? Test Results Template

| Scenario | Status | Notes |
|----------|--------|-------|
| Guest - Successful Payment | ? Pass / ? Fail | |
| Logged-in - Successful Payment | ? Pass / ? Fail | |
| Payment Cancellation | ? Pass / ? Fail | |
| Guest Cannot Access Other Orders | ? Pass / ? Fail | |
| User Cannot Access Other User's Orders | ? Pass / ? Fail | |
| Webhook Processing | ? Pass / ? Fail | |
| Multiple Items with Discounts | ? Pass / ? Fail | |
| Stock Deduction | ? Pass / ? Fail | |

---

## ?? Success Criteria

? **All tests must pass:**
1. No 404 errors after payment
2. Order details display correctly
3. Authorization works (no unauthorized access)
4. Webhook processes payment status
5. Stock management works correctly
6. Discounts calculate correctly

---

## ?? Rollback Plan (If Tests Fail)

If critical issues are found:

1. **Revert Backend Changes:**
   ```bash
   git checkout HEAD^ ShopWave/Models/PaymentInformationModel.cs
   git checkout HEAD^ ShopWave/Services/VnPayService.cs
   git checkout HEAD^ ShopWave/Controllers/CheckoutController.cs
   dotnet build
   ```

2. **Document Issue:**
   - What scenario failed?
   - What was the error message?
   - What were the logs showing?

3. **Create Bug Report:**
   - Include all debugging information
   - Include network requests/responses
   - Include backend logs

---

## ?? Support Contacts

**VNPay Sandbox Support:**
- Email: support@vnpay.vn
- Hotline: 1900 555 577
- Docs: https://sandbox.vnpayment.vn/apis/docs

**Testing Card Numbers:**
- Success: `9704198526191432198`
- Insufficient balance: `9704198526191432199`
- Invalid card: `1234567890123456`

---

## ?? Test Execution Log

```
Date: _____________
Tester: _____________
Environment: Development / Staging / Production
Backend Build: _____________
Frontend Build: _____________

Scenario 1: Guest Checkout
  - Started: _____________
  - Completed: _____________
  - Result: Pass / Fail
  - Notes: _________________________________

Scenario 2: Logged-in Checkout
  - Started: _____________
  - Completed: _____________
  - Result: Pass / Fail
  - Notes: _________________________________

... (continue for all scenarios)

Overall Status: ? All Pass ? Issues Found ? Failed
Approved for Production: ? Yes ? No
Signature: _____________
```

---

**Good luck with testing! ????**
