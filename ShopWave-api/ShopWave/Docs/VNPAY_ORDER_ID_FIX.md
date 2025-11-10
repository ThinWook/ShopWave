# VNPay Order ID Return URL Fix

## ?? Problem Description

### Issue 1: 404 Error - Wrong ID in URL
When users completed payment on VNPay and returned to the thank-you page, they encountered a **404 Not Found** error.

**Root Cause:**
- VNPay was sending back `vnp_TxnRef` (Transaction ID) in the return URL
- Frontend was using this Transaction ID to fetch order details: `GET /api/v1/orders/{transactionId}`
- Backend couldn't find an order with that ID (because it was looking for Order ID, not Transaction ID)

**Flow:**
1. ? CheckoutController creates Order (OrderId: `abc-123`)
2. ? CheckoutController creates Transaction (TransactionId: `xyz-789`)
3. ? VnPayService uses `transactionId` as `vnp_TxnRef`
4. ? VNPay redirects to: `/checkout/result?vnp_TxnRef=xyz-789&vnp_ResponseCode=00`
5. ? Frontend redirects to: `/thank-you?orderId=xyz-789` (WRONG - this is TransactionId!)
6. ? Frontend calls: `GET /api/v1/orders/xyz-789`
7. ? Backend returns 404 (no order with ID `xyz-789`)

### Issue 2: Race Condition (Already Fixed)
The `OrdersController.GetOrderById` endpoint already has:
- ? `[AllowAnonymous]` attribute
- ? Session-based verification for guest users
- ? User ownership verification for logged-in users

## ? Solution Implemented

### Changes Made

#### 1. Update `PaymentInformationModel.cs`
Added `OrderId` property to pass order information to payment service:

```csharp
public class PaymentInformationModel
{
    public Guid OrderId { get; set; }  // ? NEW
    public double Amount { get; set; }
    public string Name { get; set; } = string.Empty;
    public string OrderDescription { get; set; } = string.Empty;
    public string OrderType { get; set; } = "other";
}
```

#### 2. Update `VnPayService.cs`
Modified `CreatePaymentUrl` to append `orderId` as a query parameter to the return URL:

```csharp
public string CreatePaymentUrl(PaymentInformationModel model, HttpContext context, Guid transactionId)
{
    // ...existing code...
    
    var urlCallBack = _configuration["VNPay:PaymentBackReturnUrl"];
    
    // === FIX: Append OrderId to return URL ===
    if (!string.IsNullOrEmpty(urlCallBack))
    {
        urlCallBack += $"?orderId={model.OrderId}";
    }
    // =========================================
    
    pay.AddRequestData("vnp_ReturnUrl", urlCallBack);
    // ...existing code...
}
```

#### 3. Update `CheckoutController.cs`
Pass `OrderId` when creating payment URL:

```csharp
var paymentModel = new PaymentInformationModel
{
    OrderId = order.Id, // === FIX: Pass OrderId ===
    Amount = (double)order.TotalAmount,
    Name = request.ShippingAddress.FullName,
    OrderDescription = $"Thanh toan don hang {order.OrderNumber}",
    OrderType = "other"
};
```

## ?? New Flow (Fixed)

1. ? CheckoutController creates Order (OrderId: `abc-123`)
2. ? CheckoutController creates Transaction (TransactionId: `xyz-789`)
3. ? VnPayService uses `transactionId` as `vnp_TxnRef`
4. ? **VnPayService appends `orderId` to return URL**
5. ? VNPay redirects to: `/checkout/result?orderId=abc-123&vnp_TxnRef=xyz-789&vnp_ResponseCode=00`
6. ? Frontend extracts `orderId` from URL
7. ? Frontend redirects to: `/thank-you?orderId=abc-123` (CORRECT - this is OrderId!)
8. ? Frontend calls: `GET /api/v1/orders/abc-123`
9. ? Backend returns order details (with session verification for guests)

## ?? URL Structure

### Before Fix
```
VNPay Return URL: http://localhost:3000/checkout/result
                  ?vnp_TxnRef=xyz-789
                  &vnp_ResponseCode=00
                  &vnp_SecureHash=...

Frontend extracts: orderId = vnp_TxnRef (WRONG!)
API call: GET /api/v1/orders/xyz-789 ? 404 ?
```

### After Fix
```
VNPay Return URL: http://localhost:3000/checkout/result
                  ?orderId=abc-123          ? NEW!
                  &vnp_TxnRef=xyz-789
                  &vnp_ResponseCode=00
                  &vnp_SecureHash=...

Frontend extracts: orderId = orderId (CORRECT!)
API call: GET /api/v1/orders/abc-123 ? 200 ?
```

## ?? Key Points

1. **Transaction ID (`vnp_TxnRef`)**: Used for payment tracking with VNPay
   - Stored in database for reconciliation
   - Used in webhook verification
   
2. **Order ID**: Used for customer order details
   - Passed via return URL query parameter
   - Used by frontend to display order confirmation
   
3. **Session Security**: 
   - `LastOrderId` stored in session when order is created
   - Guest users can only view orders they created in current session
   - Logged-in users can view their own orders

## ?? Testing

### Test Cases

1. **Guest Checkout with VNPay**
   ```
   1. Add items to cart (no login)
   2. Go to checkout
   3. Select VNPay payment
   4. Complete payment on VNPay sandbox
   5. ? Should redirect to /thank-you with correct orderId
   6. ? Should display order details (no 404 error)
   ```

2. **Logged-in User Checkout with VNPay**
   ```
   1. Login to account
   2. Add items to cart
   3. Go to checkout
   4. Select VNPay payment
   5. Complete payment on VNPay sandbox
   6. ? Should redirect to /thank-you with correct orderId
   7. ? Should display order details
   ```

3. **Unauthorized Access**
   ```
   1. User A creates order
   2. User B tries to access: GET /api/v1/orders/{userA_orderId}
   3. ? Should return 403 Forbidden
   ```

## ?? Related Files

- `ShopWave/Models/PaymentInformationModel.cs`
- `ShopWave/Services/VnPayService.cs`
- `ShopWave/Services/IVnPayService.cs`
- `ShopWave/Controllers/CheckoutController.cs`
- `ShopWave/Controllers/OrdersController.cs`

## ?? Related Documentation

- [VNPAY_PAYMENT_FLOW_UPDATED.md](./VNPAY_PAYMENT_FLOW_UPDATED.md)
- [VNPAY_RETURN_URL_FIX.md](./VNPAY_RETURN_URL_FIX.md)
- [CHECKOUT_SESSION_FIX.md](./CHECKOUT_SESSION_FIX.md)
