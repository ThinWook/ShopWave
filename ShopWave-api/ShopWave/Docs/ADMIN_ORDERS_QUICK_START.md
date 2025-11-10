# Admin Orders API - Quick Start Guide

## ?? Quick Start

This guide helps you quickly test the Admin Orders endpoints.

---

## Prerequisites

1. **Admin account** with JWT token
2. **API testing tool** (Postman, Thunder Client, or cURL)
3. **Backend running** on `https://localhost:7296` (or your configured port)

---

## ?? Getting Admin Token

First, login as admin to get the JWT token:

```bash
POST /api/v1/auth/login
Content-Type: application/json

{
  "email": "admin@shopwave.com",
  "password": "your_admin_password"
}
```

**Response**:
```json
{
  "success": true,
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": "...",
      "role": "Admin"
    }
  }
}
```

Save the `token` value for use in subsequent requests.

---

## ?? API Endpoints

### 1. Get Admin Dashboard (Basic)

**Request**:
```bash
GET https://localhost:7296/api/v1/admin/orders
Authorization: Bearer YOUR_TOKEN_HERE
```

**Expected Response**:
```json
{
  "success": true,
  "code": "ADMIN_ORDERS_RETRIEVED",
  "data": {
    "stats": {
      "newOrdersCount": 5,
      "readyToShipCount": 3,
      "todaysRevenue": 1500000,
      "pendingPaymentCount": 2
    },
    "pagination": {
      "currentPage": 1,
      "pageSize": 10,
      "totalItems": 25,
      "totalPages": 3
    },
    "orders": [
      {
        "id": "...",
        "orderNumber": "ORD20250108001",
        "customerName": "Nguy?n V?n A",
        "orderDate": "2025-01-08T10:00:00Z",
        "totalAmount": 500000,
        "paymentStatus": "PAID",
        "status": "PROCESSING"
      }
      // ... more orders
    ]
  }
}
```

---

### 2. Get Dashboard with Filters

**Filter by Status**:
```bash
GET https://localhost:7296/api/v1/admin/orders?status=PROCESSING
Authorization: Bearer YOUR_TOKEN_HERE
```

**Filter by Payment Status**:
```bash
GET https://localhost:7296/api/v1/admin/orders?paymentStatus=PAID
Authorization: Bearer YOUR_TOKEN_HERE
```

**Search by Order Number or Customer Name**:
```bash
GET https://localhost:7296/api/v1/admin/orders?search=Nguyen
Authorization: Bearer YOUR_TOKEN_HERE
```

**Combine Filters with Pagination**:
```bash
GET https://localhost:7296/api/v1/admin/orders?status=PROCESSING&page=2&pageSize=5
Authorization: Bearer YOUR_TOKEN_HERE
```

---

### 3. Get Order Details

**Request**:
```bash
GET https://localhost:7296/api/v1/admin/orders/{ORDER_ID}
Authorization: Bearer YOUR_TOKEN_HERE
```

Replace `{ORDER_ID}` with actual order UUID (e.g., from the dashboard response).

**Example**:
```bash
GET https://localhost:7296/api/v1/admin/orders/a1b2c3d4-e5f6-7890-abcd-ef1234567890
Authorization: Bearer YOUR_TOKEN_HERE
```

**Expected Response**:
```json
{
  "success": true,
  "code": "ORDER_DETAIL_RETRIEVED",
  "data": {
    "id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
    "orderNumber": "ORD20250108001",
    "subTotal": 500000,
    "shippingFee": 30000,
    "discountAmount": 50000,
    "totalAmount": 480000,
    "status": "PROCESSING",
    "paymentStatus": "PAID",
    "shippingAddress": {
      "fullName": "Nguy?n V?n A",
      "phone": "0901234567",
      "address": "123 ABC Street"
    },
    "orderItems": [...],
    "transactions": [...]
  }
}
```

---

### 4. Update Order Status

**Request**:
```bash
PUT https://localhost:7296/api/v1/admin/orders/{ORDER_ID}/status
Authorization: Bearer YOUR_TOKEN_HERE
Content-Type: application/json

{
  "status": "SHIPPED"
}
```

**Valid Status Values**:
- `PENDING`
- `PROCESSING`
- `SHIPPED`
- `DELIVERED`
- `CANCELLED`

**Example**:
```bash
PUT https://localhost:7296/api/v1/admin/orders/a1b2c3d4-e5f6-7890-abcd-ef1234567890/status
Authorization: Bearer YOUR_TOKEN_HERE
Content-Type: application/json

{
  "status": "SHIPPED"
}
```

**Expected Response**:
```json
{
  "success": true,
  "code": "ORDER_STATUS_UPDATED",
  "data": {
    "orderId": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
    "newStatus": "SHIPPED"
  }
}
```

---

## ?? Testing Scenarios

### Scenario 1: Admin Dashboard View

**Goal**: Load the admin orders page with stats and order list.

**Steps**:
1. Login as admin to get token
2. Call `GET /api/v1/admin/orders`
3. Verify stats show correct counts
4. Verify orders array contains order data
5. Verify pagination metadata is present

**Success Criteria**:
- Status code: 200
- Stats object has `newOrdersCount`, `readyToShipCount`, `todaysRevenue`, `pendingPaymentCount`
- Orders array is not empty (if you have orders in DB)
- Pagination shows correct page/total pages

---

### Scenario 2: Filter Orders by Status

**Goal**: Admin wants to see only "Ready to Ship" orders.

**Steps**:
1. Call `GET /api/v1/admin/orders?status=PROCESSING`
2. Verify all returned orders have `status: "PROCESSING"`

**Success Criteria**:
- Status code: 200
- All orders in response have `status === "PROCESSING"`
- Stats are still calculated from ALL orders (not filtered)

---

### Scenario 3: Search for Customer

**Goal**: Admin searches for orders by customer name.

**Steps**:
1. Call `GET /api/v1/admin/orders?search=Nguyen`
2. Verify returned orders contain "Nguyen" in `customerName`

**Success Criteria**:
- Status code: 200
- All orders contain the search term in `customerName` or `orderNumber`

---

### Scenario 4: View Order Details

**Goal**: Admin clicks "View" button to see full order details.

**Steps**:
1. Get an order ID from dashboard
2. Call `GET /api/v1/admin/orders/{ORDER_ID}`
3. Verify detailed information is returned

**Success Criteria**:
- Status code: 200
- Response contains:
  - Price breakdown (subTotal, shippingFee, discounts)
  - Shipping address
  - Order items with variant details
  - Transaction history

---

### Scenario 5: Update Order to Shipped

**Goal**: Admin marks an order as shipped.

**Steps**:
1. Get an order ID with `status: "PROCESSING"`
2. Call `PUT /api/v1/admin/orders/{ORDER_ID}/status` with `{"status": "SHIPPED"}`
3. Verify status update response
4. Call `GET /api/v1/admin/orders/{ORDER_ID}` to verify `shippedDate` is set

**Success Criteria**:
- Status code: 200
- Response confirms status updated to "SHIPPED"
- `shippedDate` field is now populated (not null)

---

## ? Error Testing

### Test 1: Unauthorized Access
```bash
GET https://localhost:7296/api/v1/admin/orders
# No Authorization header
```
**Expected**: 401 Unauthorized

### Test 2: Non-Admin User
```bash
GET https://localhost:7296/api/v1/admin/orders
Authorization: Bearer CUSTOMER_TOKEN
```
**Expected**: 403 Forbidden

### Test 3: Order Not Found
```bash
GET https://localhost:7296/api/v1/admin/orders/00000000-0000-0000-0000-000000000000
Authorization: Bearer ADMIN_TOKEN
```
**Expected**: 404 Not Found

### Test 4: Invalid Status
```bash
PUT https://localhost:7296/api/v1/admin/orders/{ORDER_ID}/status
Authorization: Bearer ADMIN_TOKEN
Content-Type: application/json

{
  "status": "INVALID_STATUS"
}
```
**Expected**: 400 Bad Request

---

## ?? Sample Test Data

If you need to create test data, you can:

1. **Use the existing seeder** (`POST /api/admin/seed/initialize`)
2. **Create orders via checkout flow** as a customer
3. **Manually insert test orders** in the database

### Example: Create Test Order via Checkout

```bash
# 1. Login as customer
POST /api/v1/auth/login
{
  "email": "customer@example.com",
  "password": "password123"
}

# 2. Add items to cart
POST /api/v1/cart/add
{
  "productVariantId": "...",
  "quantity": 2
}

# 3. Create order via checkout
POST /api/v1/checkout/create-order
{
  "shippingAddress": {
    "fullName": "Nguy?n V?n A",
    "phone": "0901234567",
    "address": "123 ABC Street",
    "ward": "Ph??ng 1",
    "district": "Qu?n 1",
    "city": "TP. H? Chí Minh"
  }
}
```

---

## ?? Debugging Tips

### Check Backend Logs

The controller logs important events:
- `"VNPay webhook received"` - Payment callback
- `"Order {OrderNumber} status updated to {Status} by admin"` - Status changes
- `"Error retrieving admin order dashboard"` - Errors

### Verify JWT Token

Decode your JWT token at [jwt.io](https://jwt.io) to verify:
- `role` claim is `"Admin"`
- Token is not expired

### Check Database

Query orders directly:
```sql
-- Get order count by status
SELECT Status, COUNT(*) FROM Orders GROUP BY Status;

-- Get today's revenue
SELECT SUM(TotalAmount) FROM Orders 
WHERE CAST(OrderDate AS DATE) = CAST(GETDATE() AS DATE) 
AND PaymentStatus = 'PAID';

-- Get specific order
SELECT * FROM Orders WHERE Id = 'YOUR_ORDER_ID';
```

---

## ?? Postman Collection (Optional)

Create a Postman collection with these requests:

**Variables**:
- `{{baseUrl}}`: `https://localhost:7296`
- `{{adminToken}}`: Your admin JWT token

**Requests**:
1. **Get Dashboard** - `GET {{baseUrl}}/api/v1/admin/orders`
2. **Filter by Status** - `GET {{baseUrl}}/api/v1/admin/orders?status=PROCESSING`
3. **Search** - `GET {{baseUrl}}/api/v1/admin/orders?search=Nguyen`
4. **Get Order Detail** - `GET {{baseUrl}}/api/v1/admin/orders/{{orderId}}`
5. **Update Status** - `PUT {{baseUrl}}/api/v1/admin/orders/{{orderId}}/status`

---

## ? Quick Checklist

Before testing, verify:
- [ ] Backend is running (`dotnet run` in ShopWave directory)
- [ ] You have an admin account in the database
- [ ] You can successfully login and get a JWT token
- [ ] You have at least one order in the database (for testing)
- [ ] Your API testing tool is configured with the base URL

---

## ?? Support

If you encounter issues:
1. Check the console logs for error messages
2. Verify your JWT token is valid and not expired
3. Ensure the user has `Admin` role
4. Check database connection is working
5. Review the full documentation in `ADMIN_ORDERS_API.md`

---

**Happy Testing! ??**

---

**Author**: ShopWave Development Team  
**Last Updated**: January 8, 2025
