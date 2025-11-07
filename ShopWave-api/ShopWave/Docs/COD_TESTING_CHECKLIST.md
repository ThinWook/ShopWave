# ? COD FLOW TESTING CHECKLIST

## ?? Pre-requisites
- [ ] User ?ã ??ng nh?p (có Bearer token)
- [ ] Cart có ít nh?t 1 item
- [ ] Products có ?? t?n kho

---

## ?? Test Case 1: COD Order Creation (Happy Path)

### Step 1: Ki?m tra gi? hàng
```bash
GET /api/v1/cart
Authorization: Bearer {token}
```

**Expected:**
```json
{
  "success": true,
  "data": {
    "items": [
      {
        "id": "...",
        "productName": "Test Product",
        "quantity": 2,
        "unitPrice": 100000,
        "totalPrice": 200000
      }
    ],
    "total": 230000  // subTotal + shipping - discount
  }
}
```

### Step 2: T?o ??n hàng COD
```bash
POST /api/v1/checkout
Authorization: Bearer {token}
Content-Type: application/json

{
  "paymentMethod": "COD",
  "shippingAddress": {
    "fullName": "Nguy?n Test",
    "phone": "0912345678",
    "address": "123 Test Street",
    "ward": "Ph??ng 1",
    "district": "Qu?n 1",
    "city": "TP. H? Chí Minh",
    "notes": "Test order"
  }
}
```

**Expected Response:**
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
      "totalAmount": 230000,
      "status": "PROCESSING",        // ? NOT PENDING_PAYMENT
      "paymentStatus": "UNPAID",     // ? Correct
      "orderDate": "2025-01-15T10:30:00Z",
      "orderItems": [...]
    }
  }
}
```

**HTTP Status:** 201 Created (NOT 200 OK)

### Step 3: Verify Database

#### 3.1 Check Order
```sql
SELECT TOP 1 *
FROM Orders
WHERE OrderNumber = 'ORD202501150001';
-- Expected:
-- Status = 'PROCESSING'
-- PaymentStatus = 'UNPAID'
-- PaymentMethod = 'COD'
```

#### 3.2 Check Transaction
```sql
SELECT *
FROM Transactions
WHERE OrderId = (
    SELECT Id FROM Orders WHERE OrderNumber = 'ORD202501150001'
);
-- Expected:
-- Gateway = 'COD'
-- Status = 'PENDING'
-- TransactionType = 'PAYMENT'
-- GatewayTransactionId IS NULL
-- Amount = Order.TotalAmount
```

#### 3.3 Check OrderItems
```sql
SELECT *
FROM OrderItems
WHERE OrderId = (
    SELECT Id FROM Orders WHERE OrderNumber = 'ORD202501150001'
);
-- Expected:
-- ProductName is snapshot (not NULL)
-- UnitPrice is snapshot
-- Quantity matches cart
```

#### 3.4 Check Stock
```sql
SELECT Id, Sku, Stock
FROM ProductVariants
WHERE Id IN (
    SELECT ProductVariantId FROM OrderItems
    WHERE OrderId = (SELECT Id FROM Orders WHERE OrderNumber = 'ORD202501150001')
);
-- Expected:
-- Stock ?ã b? tr? ?i quantity
```

#### 3.5 Check Cart Deleted
```sql
-- Cart c?a user ph?i b? xóa
SELECT *
FROM Carts
WHERE UserId = '...'; -- UserId of test user

-- Expected: Empty result (Cart ?ã b? xóa)

-- CartItems c?ng ph?i b? xóa
SELECT *
FROM CartItems
WHERE CartId IN (
    SELECT Id FROM Carts WHERE UserId = '...'
);
-- Expected: Empty result
```

### Step 4: Verify gi? hàng ?ã xóa
```bash
GET /api/v1/cart
Authorization: Bearer {token}
```

**Expected:**
```json
{
  "success": true,
  "data": {
    "items": [],  // ? Empty
    "total": 0
  }
}
```

---

## ?? Test Case 2: COD Order with Out of Stock

### Step 1: Gi?m stock c?a 1 product v? 0
```sql
UPDATE ProductVariants
SET Stock = 0
WHERE Id = '...'; -- ProductVariantId in cart
```

### Step 2: Th? t?o ??n hàng
```bash
POST /api/v1/checkout
Authorization: Bearer {token}
Content-Type: application/json

{
  "paymentMethod": "COD",
  "shippingAddress": { ... }
}
```

**Expected Response:**
```json
{
  "success": false,
  "message": "OUT_OF_STOCK",
  "errors": [
    {
      "field": "product",
      "message": "S?n ph?m 'Test Product' ?ã h?t hàng",
      "code": "OUT_OF_STOCK"
    }
  ]
}
```

**HTTP Status:** 400 Bad Request

### Step 3: Verify không có gì thay ??i
```sql
-- Order không ???c t?o
SELECT COUNT(*) FROM Orders 
WHERE CreatedAt > DATEADD(minute, -1, GETUTCDATE());
-- Expected: 0

-- Cart v?n còn
SELECT * FROM CartItems WHERE CartId = '...';
-- Expected: Items v?n còn

-- Stock không b? tr?
SELECT Stock FROM ProductVariants WHERE Id = '...';
-- Expected: Still 0
```

---

## ?? Test Case 3: COD Order with Empty Cart

### Step 1: Xóa toàn b? cart
```bash
DELETE /api/v1/cart/clear
Authorization: Bearer {token}
```

### Step 2: Th? t?o ??n hàng
```bash
POST /api/v1/checkout
Authorization: Bearer {token}
Content-Type: application/json

{
  "paymentMethod": "COD",
  "shippingAddress": { ... }
}
```

**Expected Response:**
```json
{
  "success": false,
  "message": "CART_EMPTY",
  "errors": [
    {
      "field": "cart",
      "message": "Gi? hàng tr?ng",
      "code": "CART_EMPTY"
    }
  ]
}
```

**HTTP Status:** 400 Bad Request

---

## ?? Test Case 4: Admin Confirms COD Payment

### Step 1: Shipper báo ?ã thu ti?n
```bash
# Admin API (TODO: Implement)
PATCH /api/v1/admin/orders/{orderId}/payment
Authorization: Bearer {admin_token}
Content-Type: application/json

{
  "paymentStatus": "PAID"
}
```

### Step 2: Verify Database
```sql
-- Order
SELECT PaymentStatus 
FROM Orders 
WHERE OrderNumber = 'ORD202501150001';
-- Expected: 'PAID'

-- Transaction
SELECT Status, CompletedAt
FROM Transactions
WHERE OrderId = (SELECT Id FROM Orders WHERE OrderNumber = 'ORD202501150001');
-- Expected: 
-- Status = 'SUCCESS'
-- CompletedAt = (current timestamp)
```

---

## ?? Test Summary

| Test Case | Expected Result | Actual Result | Status |
|-----------|----------------|---------------|---------|
| COD Order Creation | 201 Created | | ? |
| Order Status | PROCESSING | | ? |
| Payment Status | UNPAID | | ? |
| Transaction Created | Gateway=COD | | ? |
| Cart Deleted | Empty cart | | ? |
| Stock Reduced | Correct amount | | ? |
| Out of Stock | 400 Bad Request | | ? |
| Empty Cart | 400 Bad Request | | ? |
| Admin Confirm Payment | Status=SUCCESS | | ? |

---

## ?? Common Issues

### Issue 1: Cart không b? xóa
**Symptom:** Sau khi t?o order, cart v?n còn items

**Root Cause:** Code ch? xóa `CartItems` mà không xóa `Cart` record

**Fix:** ?ã update code ?? xóa c? `Cart`:
```csharp
_context.CartItems.RemoveRange(cart.CartItems);
_context.AppliedDiscounts.RemoveRange(cart.AppliedDiscounts);
_context.Carts.Remove(cart); // ? Add this line
```

### Issue 2: Transaction không ???c t?o
**Symptom:** Order ???c t?o nh?ng không có Transaction log

**Root Cause:** Code thi?u logic t?o Transaction cho COD

**Fix:** ?ã update code ?? t?o Transaction:
```csharp
var codTransaction = new Transaction
{
    OrderId = order.Id,
    Gateway = "COD",
    Amount = order.TotalAmount,
    Status = "PENDING",
    TransactionType = "PAYMENT"
};
_context.Transactions.Add(codTransaction);
```

### Issue 3: Order Status sai
**Symptom:** COD order có Status = "PENDING_PAYMENT"

**Root Cause:** Logic ch?a phân bi?t COD và Online payment

**Fix:** COD ph?i là "PROCESSING" ngay t? ??u:
```csharp
Status = request.PaymentMethod == "COD" ? "PROCESSING" : "PENDING_PAYMENT"
```

---

## ?? Notes

- ? COD orders ???c t?o v?i Status = "PROCESSING" (not PENDING_PAYMENT)
- ? PaymentStatus = "UNPAID" cho ??n khi Admin confirm
- ? Transaction log ???c t?o v?i Gateway = "COD"
- ? Cart và CartItems ph?i b? xóa hoàn toàn
- ? Stock ???c tr? ngay l?p t?c
- ? HTTP Status Code: 201 Created
- ?? Email service ch?a implement (TODO)

---

**Updated:** 2025-01-15
**Status:** ? Implementation Complete
