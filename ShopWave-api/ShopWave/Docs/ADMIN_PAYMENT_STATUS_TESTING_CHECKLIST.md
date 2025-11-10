# Admin Payment Status Update - Testing Checklist

## ? Backend Testing Checklist

### Prerequisites
- [ ] Backend server running
- [ ] Admin user account created
- [ ] Admin JWT token obtained
- [ ] Test order created in database

---

## 1?? Happy Path Tests

### Test 1.1: Update to PAID (with automatic logic)
**Setup**:
- Create order with status `PENDING_PAYMENT`
- Payment status: `UNPAID`
- Transaction status: `PENDING`

**Request**:
```bash
curl -X PUT \
  "http://localhost:5000/api/v1/admin/orders/{ORDER_ID}/payment-status" \
  -H "Authorization: Bearer {ADMIN_TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{"newPaymentStatus":"PAID"}'
```

**Expected**:
- [ ] Status: 200 OK
- [ ] Response includes `oldPaymentStatus: "UNPAID"`
- [ ] Response includes `newPaymentStatus: "PAID"`
- [ ] Response includes `orderStatus: "PROCESSING"` (auto-updated)
- [ ] Order in database: `PaymentStatus = "PAID"`, `Status = "PROCESSING"`
- [ ] Transaction in database: `Status = "SUCCESS"`, `CompletedAt` set

---

### Test 1.2: Update to FAILED
**Request**:
```bash
curl -X PUT \
  "http://localhost:5000/api/v1/admin/orders/{ORDER_ID}/payment-status" \
  -H "Authorization: Bearer {ADMIN_TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{"newPaymentStatus":"FAILED"}'
```

**Expected**:
- [ ] Status: 200 OK
- [ ] Payment status updated to `FAILED`
- [ ] Order status unchanged
- [ ] Transaction status unchanged

---

### Test 1.3: Update to REFUNDED
**Request**:
```bash
curl -X PUT \
  "http://localhost:5000/api/v1/admin/orders/{ORDER_ID}/payment-status" \
  -H "Authorization: Bearer {ADMIN_TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{"newPaymentStatus":"REFUNDED"}'
```

**Expected**:
- [ ] Status: 200 OK
- [ ] Payment status updated to `REFUNDED`
- [ ] Refund logged in server logs

---

### Test 1.4: Update to PENDING
**Request**:
```bash
curl -X PUT \
  "http://localhost:5000/api/v1/admin/orders/{ORDER_ID}/payment-status" \
  -H "Authorization: Bearer {ADMIN_TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{"newPaymentStatus":"PENDING"}'
```

**Expected**:
- [ ] Status: 200 OK
- [ ] Payment status updated to `PENDING`

---

### Test 1.5: Case Insensitive Input
**Request**:
```bash
curl -X PUT \
  "http://localhost:5000/api/v1/admin/orders/{ORDER_ID}/payment-status" \
  -H "Authorization: Bearer {ADMIN_TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{"newPaymentStatus":"paid"}'
```

**Expected**:
- [ ] Status: 200 OK
- [ ] Accepted (case-insensitive)
- [ ] Stored as `PAID` in database (uppercase)

---

## 2?? Validation Tests

### Test 2.1: Invalid Payment Status
**Request**:
```bash
curl -X PUT \
  "http://localhost:5000/api/v1/admin/orders/{ORDER_ID}/payment-status" \
  -H "Authorization: Bearer {ADMIN_TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{"newPaymentStatus":"INVALID_STATUS"}'
```

**Expected**:
- [ ] Status: 400 Bad Request
- [ ] Error message: "Tr?ng thái thanh toán không h?p l?"
- [ ] Error lists valid values

---

### Test 2.2: Missing Payment Status Field
**Request**:
```bash
curl -X PUT \
  "http://localhost:5000/api/v1/admin/orders/{ORDER_ID}/payment-status" \
  -H "Authorization: Bearer {ADMIN_TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{}'
```

**Expected**:
- [ ] Status: 400 Bad Request
- [ ] Error message: "Tr?ng thái thanh toán là b?t bu?c"

---

### Test 2.3: Empty Payment Status
**Request**:
```bash
curl -X PUT \
  "http://localhost:5000/api/v1/admin/orders/{ORDER_ID}/payment-status" \
  -H "Authorization: Bearer {ADMIN_TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{"newPaymentStatus":""}'
```

**Expected**:
- [ ] Status: 400 Bad Request
- [ ] Error message about required field

---

### Test 2.4: Null Payment Status
**Request**:
```bash
curl -X PUT \
  "http://localhost:5000/api/v1/admin/orders/{ORDER_ID}/payment-status" \
  -H "Authorization: Bearer {ADMIN_TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{"newPaymentStatus":null}'
```

**Expected**:
- [ ] Status: 400 Bad Request

---

## 3?? Authorization Tests

### Test 3.1: No Authorization Header
**Request**:
```bash
curl -X PUT \
  "http://localhost:5000/api/v1/admin/orders/{ORDER_ID}/payment-status" \
  -H "Content-Type: application/json" \
  -d '{"newPaymentStatus":"PAID"}'
```

**Expected**:
- [ ] Status: 401 Unauthorized

---

### Test 3.2: Invalid Token
**Request**:
```bash
curl -X PUT \
  "http://localhost:5000/api/v1/admin/orders/{ORDER_ID}/payment-status" \
  -H "Authorization: Bearer INVALID_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"newPaymentStatus":"PAID"}'
```

**Expected**:
- [ ] Status: 401 Unauthorized

---

### Test 3.3: Non-Admin User Token
**Setup**:
- Get JWT token for regular customer (non-admin)

**Request**:
```bash
curl -X PUT \
  "http://localhost:5000/api/v1/admin/orders/{ORDER_ID}/payment-status" \
  -H "Authorization: Bearer {CUSTOMER_TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{"newPaymentStatus":"PAID"}'
```

**Expected**:
- [ ] Status: 403 Forbidden

---

### Test 3.4: Expired Token
**Setup**:
- Use an expired admin JWT token

**Expected**:
- [ ] Status: 401 Unauthorized
- [ ] Error about token expiration

---

## 4?? Edge Cases

### Test 4.1: Order Not Found
**Request**:
```bash
curl -X PUT \
  "http://localhost:5000/api/v1/admin/orders/00000000-0000-0000-0000-000000000000/payment-status" \
  -H "Authorization: Bearer {ADMIN_TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{"newPaymentStatus":"PAID"}'
```

**Expected**:
- [ ] Status: 404 Not Found
- [ ] Error message: "Không tìm th?y ??n hàng"

---

### Test 4.2: Invalid Order ID Format
**Request**:
```bash
curl -X PUT \
  "http://localhost:5000/api/v1/admin/orders/INVALID_ID/payment-status" \
  -H "Authorization: Bearer {ADMIN_TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{"newPaymentStatus":"PAID"}'
```

**Expected**:
- [ ] Status: 400 Bad Request

---

### Test 4.3: Same Status (idempotent)
**Setup**:
- Order already has `PaymentStatus = "PAID"`

**Request**:
```bash
curl -X PUT \
  "http://localhost:5000/api/v1/admin/orders/{ORDER_ID}/payment-status" \
  -H "Authorization: Bearer {ADMIN_TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{"newPaymentStatus":"PAID"}'
```

**Expected**:
- [ ] Status: 200 OK
- [ ] No errors (idempotent operation)
- [ ] Response shows same old and new status

---

### Test 4.4: Order Without Transaction
**Setup**:
- Create order without any transactions

**Request**: Change to `PAID`

**Expected**:
- [ ] Status: 200 OK
- [ ] Payment status updated
- [ ] No errors (handles missing transactions gracefully)

---

### Test 4.5: Order With Multiple Transactions
**Setup**:
- Order with 2 PENDING transactions

**Request**: Change to `PAID`

**Expected**:
- [ ] Status: 200 OK
- [ ] Only most recent PENDING transaction updated
- [ ] Older transactions unchanged

---

## 5?? Business Logic Tests

### Test 5.1: PAID Triggers Order Status Change
**Setup**:
- Order status: `PENDING_PAYMENT`
- Payment status: `UNPAID`

**Request**: Change to `PAID`

**Expected**:
- [ ] Order status auto-changes to `PROCESSING`
- [ ] Logged: "Order status automatically changed to PROCESSING"

---

### Test 5.2: PAID Doesn't Change Non-Pending Order
**Setup**:
- Order status: `SHIPPED` (not PENDING_PAYMENT)
- Payment status: `UNPAID`

**Request**: Change to `PAID`

**Expected**:
- [ ] Payment status updated to `PAID`
- [ ] Order status remains `SHIPPED` (no change)

---

### Test 5.3: Transaction Status Update
**Setup**:
- Order with PENDING transaction

**Request**: Change to `PAID`

**Expected**:
- [ ] Transaction status changed to `SUCCESS`
- [ ] Transaction `CompletedAt` timestamp set
- [ ] Transaction `UpdatedAt` timestamp updated

---

### Test 5.4: Multiple Status Changes
**Sequence**:
1. Change to `PENDING`
2. Change to `PAID`
3. Change to `REFUNDED`

**Expected**:
- [ ] Each change succeeds
- [ ] Each change logged
- [ ] Final status is `REFUNDED`

---

## 6?? Logging Tests

### Test 6.1: Successful Update Logged
**Request**: Successful update

**Verify Logs**:
- [ ] Log: "Order {OrderNumber} payment status updated from {Old} to {New} by admin"
- [ ] Log includes order number
- [ ] Log includes old and new status

---

### Test 6.2: Auto-Logic Logged
**Request**: Change to `PAID` (triggers auto-logic)

**Verify Logs**:
- [ ] Log: "Order status automatically changed to PROCESSING"
- [ ] Log: "Transaction {Id} marked as SUCCESS"

---

### Test 6.3: Error Logged
**Request**: Invalid order ID

**Verify Logs**:
- [ ] Error log: "Error updating payment status for order {Id}"
- [ ] Exception details logged

---

## 7?? Performance Tests

### Test 7.1: Response Time
**Request**: Standard update

**Expected**:
- [ ] Response time < 500ms

---

### Test 7.2: Concurrent Updates
**Setup**:
- Send 5 concurrent update requests to same order

**Expected**:
- [ ] All requests complete successfully
- [ ] Final status reflects last successful update
- [ ] No deadlocks or errors

---

## 8?? Integration Tests

### Test 8.1: Update Then Get Order Detail
**Sequence**:
1. Update payment status to `PAID`
2. GET order details

**Expected**:
- [ ] GET returns updated payment status
- [ ] GET returns updated order status (if changed)
- [ ] GET returns updated transaction

---

### Test 8.2: Update Then List Orders
**Sequence**:
1. Update payment status to `PAID`
2. GET order list with filter `paymentStatus=PAID`

**Expected**:
- [ ] Updated order appears in filtered list

---

## ?? Test Results Summary

| Category | Total Tests | Passed | Failed | Notes |
|----------|-------------|--------|--------|-------|
| Happy Path | 5 | - | - | |
| Validation | 4 | - | - | |
| Authorization | 4 | - | - | |
| Edge Cases | 5 | - | - | |
| Business Logic | 4 | - | - | |
| Logging | 3 | - | - | |
| Performance | 2 | - | - | |
| Integration | 2 | - | - | |
| **TOTAL** | **29** | **-** | **-** | |

---

## ??? Testing Tools

### Recommended Tools
- [ ] Postman (API testing)
- [ ] cURL (command-line testing)
- [ ] SQL Server Management Studio (verify database)
- [ ] Visual Studio Debug Mode (step through code)
- [ ] Browser DevTools (inspect responses)

### Postman Collection Setup
- [ ] Create environment with `ADMIN_TOKEN` variable
- [ ] Create environment with `BASE_URL` variable
- [ ] Add pre-request script to refresh token if expired
- [ ] Add tests to validate response structure

---

## ?? Bug Reporting Template

If you find a bug:

```markdown
### Bug Report

**Test Case**: [e.g., Test 5.1: PAID Triggers Order Status Change]

**Steps to Reproduce**:
1. 
2. 
3. 

**Expected Result**:
- 

**Actual Result**:
- 

**Request**:
```bash
[paste cURL command]
```

**Response**:
```json
[paste response]
```

**Database State After**:
```sql
SELECT * FROM Orders WHERE Id = '...'
SELECT * FROM Transactions WHERE OrderId = '...'
```

**Server Logs**:
```
[paste relevant logs]
```
```

---

## ? Sign-Off

**Tested By**: _________________  
**Date**: _________________  
**Environment**: _________________  
**Result**: ? All Pass  ? Some Failures (see report)  

**Notes**:
_________________________________________________
_________________________________________________

---

**Last Updated**: January 25, 2025  
**Version**: 1.0
