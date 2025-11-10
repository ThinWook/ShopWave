# Frontend Implementation Checklist for VNPay Order ID Fix

## ?? What Changed in Backend

The backend now appends `orderId` to the VNPay return URL, so the frontend receives:

```
Before: /checkout/result?vnp_TxnRef=xyz-789&vnp_ResponseCode=00
After:  /checkout/result?orderId=abc-123&vnp_TxnRef=xyz-789&vnp_ResponseCode=00
```

## ? Required Frontend Changes

### 1. Update `/checkout/result` Page

**File**: `app/checkout/result/page.tsx` (or similar)

#### Old Code (WRONG)
```typescript
const searchParams = useSearchParams();
const txnRef = searchParams.get('vnp_TxnRef'); // ? This is Transaction ID!
const responseCode = searchParams.get('vnp_ResponseCode');

// Redirecting with wrong ID
if (responseCode === '00') {
  router.replace(`/thank-you?orderId=${txnRef}`); // ? Using Transaction ID!
}
```

#### New Code (CORRECT)
```typescript
const searchParams = useSearchParams();
const orderId = searchParams.get('orderId'); // ? Get Order ID directly
const responseCode = searchParams.get('vnp_ResponseCode');
const txnRef = searchParams.get('vnp_TxnRef'); // Can still use for logging

// Redirecting with correct Order ID
if (responseCode === '00') {
  router.replace(`/thank-you?orderId=${orderId}`); // ? Using Order ID!
} else {
  // Handle payment failure
  router.replace(`/checkout/failed?orderId=${orderId}`);
}
```

### 2. Update `/thank-you` Page (Already Correct)

Your thank-you page should already be using `orderId` correctly:

```typescript
// This should work without changes
const searchParams = useSearchParams();
const orderId = searchParams.get('orderId');

// Fetch order details
const response = await fetch(`/api/v1/orders/${orderId}`, {
  headers: {
    'X-Session-Id': sessionId // Important for guest users!
  }
});
```

### 3. Session Management (Critical for Guests)

Ensure you're sending the session ID in API requests:

```typescript
// When calling order API
const response = await fetch(`/api/v1/orders/${orderId}`, {
  headers: {
    'Authorization': user ? `Bearer ${token}` : '', // For logged-in users
    'X-Session-Id': sessionId // For guest users (stored in localStorage/cookies)
  }
});
```

## ?? Testing Checklist

### Test 1: Guest Checkout Flow
- [ ] Add items to cart (no login)
- [ ] Proceed to checkout
- [ ] Select VNPay payment
- [ ] Complete payment on VNPay sandbox
- [ ] Verify URL on return: `/checkout/result?orderId=...&vnp_ResponseCode=00`
- [ ] Verify redirect: `/thank-you?orderId=...`
- [ ] Verify order details display correctly (no 404)
- [ ] Verify order status shows "PENDING_PAYMENT" (before webhook)

### Test 2: Logged-in User Checkout
- [ ] Login to account
- [ ] Add items to cart
- [ ] Proceed to checkout
- [ ] Select VNPay payment
- [ ] Complete payment on VNPay sandbox
- [ ] Verify URL on return: `/checkout/result?orderId=...&vnp_ResponseCode=00`
- [ ] Verify redirect: `/thank-you?orderId=...`
- [ ] Verify order details display correctly
- [ ] Verify order appears in "My Orders" list

### Test 3: Payment Failure
- [ ] Start checkout with VNPay
- [ ] Cancel payment on VNPay
- [ ] Verify URL on return: `/checkout/result?orderId=...&vnp_ResponseCode=24`
- [ ] Verify proper error handling
- [ ] Verify order status remains "PENDING_PAYMENT"

### Test 4: Unauthorized Access
- [ ] User A creates order
- [ ] Copy order ID
- [ ] Logout or switch to User B
- [ ] Try to access: `/thank-you?orderId={userA_orderId}`
- [ ] Verify: Should show 403 Forbidden error

## ?? Debugging Tips

### Check URL Parameters
```typescript
useEffect(() => {
  const params = new URLSearchParams(window.location.search);
  console.log('All URL params:', Object.fromEntries(params.entries()));
  // Should show: { orderId: '...', vnp_TxnRef: '...', vnp_ResponseCode: '00', ... }
}, []);
```

### Check Session ID
```typescript
console.log('Session ID:', localStorage.getItem('sessionId'));
// Should have a value for guest users
```

### Check API Response
```typescript
const response = await fetch(`/api/v1/orders/${orderId}`, {
  headers: {
    'X-Session-Id': sessionId
  }
});

console.log('Status:', response.status);
const data = await response.json();
console.log('Order data:', data);

// Success: status = 200, data.status = "OK"
// Not found: status = 404, data.status = "FAIL", data.code = "NOT_FOUND"
// Forbidden: status = 403, data.status = "FAIL", data.code = "FORBIDDEN"
```

## ?? Common Issues

### Issue 1: Still Getting 404
**Cause**: Frontend is still using `vnp_TxnRef` instead of `orderId`
**Fix**: Update result page to use `searchParams.get('orderId')`

### Issue 2: Getting 403 Forbidden (Guest Users)
**Cause**: Not sending `X-Session-Id` header
**Fix**: Ensure session ID is included in fetch headers

### Issue 3: Payment Success but Order Still Shows "PENDING"
**Cause**: Webhook hasn't processed yet (normal behavior)
**Fix**: This is expected. Webhook will update status within 1-2 seconds

## ?? Example Implementation

```typescript
// app/checkout/result/page.tsx
'use client';

import { useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

export default function CheckoutResult() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const orderId = searchParams.get('orderId');
    const responseCode = searchParams.get('vnp_ResponseCode');
    const txnRef = searchParams.get('vnp_TxnRef');

    console.log('VNPay return:', { orderId, responseCode, txnRef });

    if (!orderId) {
      router.replace('/checkout');
      return;
    }

    // Payment success
    if (responseCode === '00') {
      router.replace(`/thank-you?orderId=${orderId}`);
    } 
    // Payment failed or cancelled
    else {
      router.replace(`/checkout/failed?orderId=${orderId}&code=${responseCode}`);
    }
  }, [searchParams, router]);

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto"></div>
        <p className="mt-4">?ang x? lý thanh toán...</p>
      </div>
    </div>
  );
}
```

## ?? Backend Changes Summary

| File | Change |
|------|--------|
| `PaymentInformationModel.cs` | Added `OrderId` property |
| `VnPayService.cs` | Appends `?orderId={orderId}` to return URL |
| `CheckoutController.cs` | Passes `order.Id` when creating payment model |
| `OrdersController.cs` | Already has `[AllowAnonymous]` + session check ? |

## ?? Related Documentation

- [VNPAY_ORDER_ID_FIX.md](./VNPAY_ORDER_ID_FIX.md) - Detailed backend fix explanation
- [VNPAY_PAYMENT_FLOW_UPDATED.md](./VNPAY_PAYMENT_FLOW_UPDATED.md) - Complete payment flow
- [CHECKOUT_SESSION_FIX.md](./CHECKOUT_SESSION_FIX.md) - Session management guide
