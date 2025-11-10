# Admin Order Detail API - Testing Checklist

## ?? Testing Checklist for GET /api/v1/admin/orders/{id}

### Prerequisites
- [ ] Backend server running (http://localhost:5000)
- [ ] Admin user account created
- [ ] Admin JWT token obtained
- [ ] At least one test order in database

---

## 1?? Happy Path Tests

### Test 1.1: Get Order with All Fields Populated
**Setup**:
- Create order with:
  - Multiple items with variants (different sizes/colors)
  - Applied voucher code
  - Progressive discount
  - Shipping fee
  - Complete shipping and billing addresses
  - Multiple transactions (e.g., failed + successful)

**Request**:
```bash
curl -X GET \
  "http://localhost:5000/api/v1/admin/orders/{ORDER_ID}" \
  -H "Authorization: Bearer {ADMIN_TOKEN}"
```

**Expected Response**:
- [ ] Status: 200 OK
- [ ] `success: true`
- [ ] All order fields present and correct
- [ ] `orderItems` array with snapshot data
- [ ] `selectedOptions` deserialized (not JSON string)
- [ ] `shippingAddress` object with all fields
- [ ] `billingAddress` object (if provided)
- [ ] `transactions` array with all payment attempts

**Verify**:
- [ ] `subTotal` = sum of all `orderItems[].totalPrice`
- [ ] `totalAmount` = `subTotal + shippingFee - progressiveDiscountAmount - voucherDiscountAmount`
- [ ] Prices match historical snapshot (not current product prices)
- [ ] Variant options show historical selection

---

### Test 1.2: Get COD Order
**Setup**:
- Create COD order (Cash on Delivery)

**Expected Response**:
- [ ] `paymentMethod: "COD"`
- [ ] `paymentStatus: "UNPAID"` (until delivery)
- [ ] `transactions` array contains COD transaction
- [ ] Transaction status: "PENDING"

---

### Test 1.3: Get VNPAY Order
**Setup**:
- Create order paid via VNPAY

**Expected Response**:
- [ ] `paymentMethod: "VNPAY"`
- [ ] `paymentStatus: "PAID"`
- [ ] `transactions[0].gateway: "VNPAY"`
- [ ] `transactions[0].gatewayTransactionId` present
- [ ] `transactions[0].gatewayResponse` contains VNPay JSON

---

### Test 1.4: Get Order with No Billing Address
**Setup**:
- Create order without billing address

**Expected Response**:
- [ ] `billingAddress: null`
- [ ] `shippingAddress` still present and complete

---

### Test 1.5: Get Order with No Variants (Simple Product)
**Setup**:
- Create order with simple product (no size/color options)

**Expected Response**:
- [ ] Order details present
- [ ] `orderItems[0].selectedOptions: null` or `[]`
- [ ] Other fields still correct

---

## 2?? Error Handling Tests

### Test 2.1: Order Not Found
**Request**:
```bash
curl -X GET \
  "http://localhost:5000/api/v1/admin/orders/00000000-0000-0000-0000-000000000000" \
  -H "Authorization: Bearer {ADMIN_TOKEN}"
```

**Expected Response**:
- [ ] Status: 404 Not Found
- [ ] `success: false`
- [ ] `message: "NOT_FOUND"`
- [ ] `errors` array contains error details
- [ ] Error message in Vietnamese

---

### Test 2.2: No Authorization Header
**Request**:
```bash
curl -X GET \
  "http://localhost:5000/api/v1/admin/orders/{ORDER_ID}"
```

**Expected Response**:
- [ ] Status: 401 Unauthorized
- [ ] `success: false`

---

### Test 2.3: Invalid Token
**Request**:
```bash
curl -X GET \
  "http://localhost:5000/api/v1/admin/orders/{ORDER_ID}" \
  -H "Authorization: Bearer INVALID_TOKEN"
```

**Expected Response**:
- [ ] Status: 401 Unauthorized

---

### Test 2.4: Non-Admin User Token
**Setup**:
- Get JWT token for regular customer (non-admin)

**Request**:
```bash
curl -X GET \
  "http://localhost:5000/api/v1/admin/orders/{ORDER_ID}" \
  -H "Authorization: Bearer {CUSTOMER_TOKEN}"
```

**Expected Response**:
- [ ] Status: 403 Forbidden
- [ ] `success: false`

---

### Test 2.5: Expired Token
**Setup**:
- Use an expired admin JWT token

**Expected Response**:
- [ ] Status: 401 Unauthorized
- [ ] Error message about token expiration

---

## 3?? Data Integrity Tests

### Test 3.1: Verify Snapshot Data
**Setup**:
1. Create order with product "Product A" priced at 100,000 VND
2. After order creation, update product price to 150,000 VND
3. Get order detail

**Expected**:
- [ ] Order item shows `unitPrice: 100000` (historical)
- [ ] Not 150,000 (current price)

---

### Test 3.2: Verify Deleted Product Shows in Order
**Setup**:
1. Create order with product
2. Delete/deactivate the product
3. Get order detail

**Expected**:
- [ ] Order detail still shows product name (from snapshot)
- [ ] Image URL still present (from snapshot)
- [ ] No error about missing product

---

### Test 3.3: Verify SelectedOptions Parsing
**Setup**:
- Create order with variant having multiple options
- Database stores: `[{"name":"Size","value":"XL"},{"name":"Color","value":"Red"}]`

**Expected Response**:
```json
"selectedOptions": [
  { "name": "Size", "value": "XL" },
  { "name": "Color", "value": "Red" }
]
```

**Verify**:
- [ ] Not a JSON string
- [ ] Properly deserialized array
- [ ] Name and value keys lowercase (case-insensitive deserialization)

---

### Test 3.4: Verify Malformed SelectedOptions JSON
**Setup**:
- Manually corrupt `SelectedOptions` field in database
- Set to invalid JSON: `"[{invalid json}]"`

**Expected**:
- [ ] API doesn't crash
- [ ] `selectedOptions: null` in response
- [ ] Warning logged in server logs
- [ ] Other order fields still correct

---

## 4?? Performance Tests

### Test 4.1: Response Time
**Request**:
- Get order detail

**Expected**:
- [ ] Response time < 500ms
- [ ] No N+1 query problem (check SQL logs)
- [ ] Single query with `.Include()`

---

### Test 4.2: Large Order (Many Items)
**Setup**:
- Create order with 50+ items

**Expected**:
- [ ] All items returned
- [ ] Response time still acceptable
- [ ] No timeout errors

---

### Test 4.3: Multiple Concurrent Requests
**Setup**:
- Send 10 concurrent GET requests for same order

**Expected**:
- [ ] All requests return 200 OK
- [ ] Same data returned for all
- [ ] No database locking issues

---

## 5?? Edge Cases

### Test 5.1: Order with Zero Shipping Fee
**Setup**:
- Order over free shipping threshold

**Expected**:
- [ ] `shippingFee: 0`
- [ ] Calculation still correct

---

### Test 5.2: Order with No Discounts
**Setup**:
- Order with no voucher, no progressive discount

**Expected**:
- [ ] `progressiveDiscountAmount: 0`
- [ ] `voucherDiscountAmount: 0`
- [ ] `voucherCode: null`
- [ ] `totalAmount = subTotal + shippingFee`

---

### Test 5.3: Order with Multiple Failed Transactions
**Setup**:
- Order with multiple failed payment attempts before success

**Expected**:
- [ ] All transactions returned in array
- [ ] Ordered by `createdAt` (oldest first)
- [ ] Failed transactions show error messages

---

### Test 5.4: Unicode Characters in Address
**Setup**:
- Order with Vietnamese characters in address

**Expected**:
- [ ] Characters displayed correctly
- [ ] No encoding issues
- [ ] Tone marks preserved (à, ?, ã, á, ?)

---

### Test 5.5: Very Long Order Notes
**Setup**:
- Order with 500+ character notes

**Expected**:
- [ ] Full notes returned
- [ ] No truncation
- [ ] No performance issues

---

## 6?? Integration Tests

### Test 6.1: Order Created via Checkout Flow
**Setup**:
1. Create order via `POST /api/v1/checkout`
2. Get order ID from response
3. Fetch order detail via admin API

**Expected**:
- [ ] All data matches checkout response
- [ ] Transaction history includes payment attempt
- [ ] Snapshot data preserved correctly

---

### Test 6.2: After Status Update
**Setup**:
1. Get initial order detail (status: PROCESSING)
2. Update status via `PUT /api/v1/admin/orders/{id}/status`
3. Get order detail again

**Expected**:
- [ ] Status reflects update
- [ ] `shippedDate` updated if status = SHIPPED
- [ ] `deliveredDate` updated if status = DELIVERED
- [ ] Other fields unchanged

---

## ?? Test Results Summary

| Test Category | Total Tests | Passed | Failed | Notes |
|---------------|-------------|--------|--------|-------|
| Happy Path | 5 | - | - | |
| Error Handling | 5 | - | - | |
| Data Integrity | 4 | - | - | |
| Performance | 3 | - | - | |
| Edge Cases | 5 | - | - | |
| Integration | 2 | - | - | |
| **TOTAL** | **24** | **-** | **-** | |

---

## ??? Testing Tools

### Recommended Tools
- [ ] Postman (API testing)
- [ ] cURL (command-line testing)
- [ ] Browser DevTools (inspect JSON)
- [ ] SQL Server Management Studio (verify data)
- [ ] Visual Studio Debug Mode (step through code)

### Postman Collection
Create a collection with:
- [ ] Environment variable for `ADMIN_TOKEN`
- [ ] Environment variable for `BASE_URL`
- [ ] Pre-request script to refresh token if expired
- [ ] Tests to validate response structure

---

## ?? Bug Reporting Template

If you find a bug during testing:

```markdown
### Bug Report

**Test Case**: [e.g., Test 3.3: Verify SelectedOptions Parsing]

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

**Server Logs**:
```
[paste relevant logs]
```

**Environment**:
- OS: 
- .NET Version: 
- Database: 
```

---

## ? Sign-Off

**Tested By**: _________________  
**Date**: _________________  
**Environment**: _________________  
**Result**: ? Pass  ? Fail (see bugs)  

**Notes**:
_________________________________________________
_________________________________________________
_________________________________________________

---

**Last Updated**: January 25, 2025  
**Version**: 1.0
