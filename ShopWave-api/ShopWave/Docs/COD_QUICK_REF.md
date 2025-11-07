# ?? COD QUICK REFERENCE

## ?? API Call
```bash
POST /api/v1/checkout
Authorization: Bearer {token}
Content-Type: application/json

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

## ? Expected Response
```json
HTTP/1.1 201 Created

{
  "success": true,
  "message": "ORDER_CREATED",
  "data": {
    "status": "OK",
    "paymentMethod": "COD",
    "order": {
      "orderNumber": "ORD202501150001",
      "totalAmount": 230000,
      "status": "PROCESSING",
      "paymentStatus": "UNPAID"
    }
  }
}
```

## ?? Quick Verify
```sql
-- Order
SELECT Status, PaymentStatus FROM Orders WHERE OrderNumber = 'ORD...';
-- Expected: PROCESSING, UNPAID

-- Transaction
SELECT Gateway, Status FROM Transactions WHERE OrderId = '...';
-- Expected: COD, PENDING

-- Cart (should be empty)
SELECT * FROM Carts WHERE UserId = '...';
-- Expected: 0 rows
```

## ?? Key Points
1. ? Status = **PROCESSING** (NOT PENDING_PAYMENT)
2. ? PaymentStatus = **UNPAID**
3. ? Transaction v?i Gateway = **COD**
4. ? Cart **b? xóa hoàn toàn**
5. ? Stock **b? tr? ngay**
6. ? HTTP Code = **201 Created**

## ?? Troubleshooting
| Issue | Check |
|-------|-------|
| Cart không xóa | `_context.Carts.Remove(cart)` |
| Transaction không có | `codTransaction` ???c add |
| Status sai | Should be "PROCESSING" |
| Stock không tr? | Loop qua OrderItems |

## ?? Files
- Implementation: `CheckoutController.cs`
- Full Guide: `COD_IMPLEMENTATION_SUMMARY.md`
- Testing: `COD_TESTING_CHECKLIST.md`
- SQL Verify: `SQL_VerifyCODTransactions.sql`
