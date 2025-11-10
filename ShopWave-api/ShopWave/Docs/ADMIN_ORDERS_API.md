# Admin Orders API - Tài li?u API qu?n lý ??n hàng

## T?ng quan

API này cung c?p các endpoint ?? qu?n tr? viên (Admin) qu?n lý ??n hàng trong h? th?ng ShopWave. Bao g?m:
- Xem dashboard v?i th?ng kê t?ng quan
- Danh sách ??n hàng có phân trang và l?c
- Chi ti?t ??n hàng c? th?
- C?p nh?t tr?ng thái ??n hàng

---

## ?? Xác th?c

T?t c? endpoints yêu c?u:
- **JWT Token** trong header `Authorization: Bearer {token}`
- **Role**: `Admin`

---

## ?? Endpoints

### 1. GET /api/v1/admin/orders - L?y dashboard ??n hàng

**Mô t?**: Tr? v? dashboard hoàn ch?nh v?i th?ng kê t?ng quan và danh sách ??n hàng có phân trang.

#### Query Parameters

| Parameter      | Type    | Required | Mô t?                                          | Ví d?         |
|----------------|---------|----------|------------------------------------------------|---------------|
| `page`         | int     | No       | S? trang (m?c ??nh: 1)                         | `page=1`      |
| `pageSize`     | int     | No       | S? l??ng ??n hàng m?i trang (m?c ??nh: 10)   | `pageSize=20` |
| `status`       | string  | No       | L?c theo tr?ng thái ??n hàng                   | `status=PROCESSING` |
| `paymentStatus`| string  | No       | L?c theo tr?ng thái thanh toán                 | `paymentStatus=PAID` |
| `search`       | string  | No       | Tìm ki?m theo mã ??n hàng ho?c tên khách hàng | `search=Nguyen Van A` |

#### Order Status Values (Tr?ng thái ??n hàng)

- `PENDING` - Ch? x? lý
- `PROCESSING` - ?ang x? lý (s?n sàng giao)
- `SHIPPED` - ?ã giao cho v?n chuy?n
- `DELIVERED` - ?ã giao hàng
- `CANCELLED` - ?ã h?y
- `PENDING_PAYMENT` - Ch? thanh toán

#### Payment Status Values (Tr?ng thái thanh toán)

- `PAID` - ?ã thanh toán
- `UNPAID` - Ch?a thanh toán
- `PENDING` - Ch? xác nh?n thanh toán

#### Request Example

```bash
GET /api/v1/admin/orders?page=1&pageSize=10&status=PROCESSING&search=ORD202501
Authorization: Bearer {admin_jwt_token}
```

#### Response Example (200 OK)

```json
{
  "success": true,
  "code": "ADMIN_ORDERS_RETRIEVED",
  "message": "Admin orders retrieved successfully",
  "data": {
    "stats": {
      "newOrdersCount": 15,          // ??n hàng m?i (PENDING + PROCESSING)
      "readyToShipCount": 12,        // S?n sàng giao (PROCESSING)
      "todaysRevenue": 25500000,     // Doanh thu hôm nay (VN?)
      "pendingPaymentCount": 3       // Ch? thanh toán
    },
    "pagination": {
      "currentPage": 1,
      "pageSize": 10,
      "totalItems": 150,
      "totalPages": 15
    },
    "orders": [
      {
        "id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
        "orderNumber": "ORD20250108001",
        "customerName": "Nguy?n V?n A",
        "orderDate": "2025-01-08T10:30:00Z",
        "totalAmount": 850000,
        "paymentStatus": "PAID",
        "status": "PROCESSING"
      },
      {
        "id": "b2c3d4e5-f6a7-8901-bcde-f12345678901",
        "orderNumber": "ORD20250108002",
        "customerName": "Tr?n Th? B",
        "orderDate": "2025-01-08T11:15:00Z",
        "totalAmount": 1200000,
        "paymentStatus": "UNPAID",
        "status": "PENDING"
      }
      // ... more orders
    ]
  },
  "meta": {
    "timestamp": "2025-01-08T12:00:00Z",
    "endpoint": "/api/v1/admin/orders"
  }
}
```

#### Response Structure

**stats** (AdminOrderStatsDto) - Th?ng kê t?ng quan:
- `newOrdersCount`: T?ng ??n hàng m?i (PENDING + PROCESSING)
- `readyToShipCount`: ??n hàng s?n sàng giao (PROCESSING)
- `todaysRevenue`: Doanh thu hôm nay t? các ??n ?ã thanh toán (PAID)
- `pendingPaymentCount`: ??n hàng ch? thanh toán (PENDING_PAYMENT)

**pagination** (PaginationMeta) - Thông tin phân trang:
- `currentPage`: Trang hi?n t?i
- `pageSize`: S? l??ng ??n hàng m?i trang
- `totalItems`: T?ng s? ??n hàng
- `totalPages`: T?ng s? trang

**orders** (List<AdminOrderListDto>) - Danh sách ??n hàng:
- `id`: ID ??n hàng (UUID)
- `orderNumber`: Mã ??n hàng (e.g., "ORD20250108001")
- `customerName`: Tên khách hàng
- `orderDate`: Ngày ??t hàng (UTC)
- `totalAmount`: T?ng ti?n (VN?)
- `paymentStatus`: Tr?ng thái thanh toán
- `status`: Tr?ng thái ??n hàng

---

### 2. GET /api/v1/admin/orders/{id} - L?y chi ti?t ??n hàng

**Mô t?**: L?y thông tin chi ti?t c?a m?t ??n hàng c? th?, bao g?m:
- Thông tin khách hàng
- Chi ti?t s?n ph?m trong ??n hàng
- ??a ch? giao hàng
- L?ch s? giao d?ch thanh toán

#### Path Parameters

| Parameter | Type | Required | Mô t?        |
|-----------|------|----------|--------------|
| `id`      | Guid | Yes      | ID ??n hàng  |

#### Request Example

```bash
GET /api/v1/admin/orders/a1b2c3d4-e5f6-7890-abcd-ef1234567890
Authorization: Bearer {admin_jwt_token}
```

#### Response Example (200 OK)

```json
{
  "success": true,
  "code": "ORDER_DETAIL_RETRIEVED",
  "message": "Order detail retrieved successfully",
  "data": {
    "id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
    "orderNumber": "ORD20250108001",
    "subTotal": 800000,
    "shippingFee": 30000,
    "progressiveDiscountAmount": 0,
    "voucherDiscountAmount": 50000,
    "voucherCode": "NEWYEAR2025",
    "discountAmount": 50000,
    "totalAmount": 780000,
    "status": "PROCESSING",
    "paymentMethod": "VNPAY",
    "paymentStatus": "PAID",
    "orderDate": "2025-01-08T10:30:00Z",
    "shippedDate": null,
    "deliveredDate": null,
    "shippingAddress": {
      "fullName": "Nguy?n V?n A",
      "phone": "0901234567",
      "address": "123 ???ng ABC",
      "ward": "Ph??ng 1",
      "district": "Qu?n 1",
      "city": "TP. H? Chí Minh",
      "notes": "G?i tr??c khi giao"
    },
    "orderItems": [
      {
        "id": "item-id-1",
        "productName": "Áo thun nam",
        "quantity": 2,
        "unitPrice": 200000,
        "totalPrice": 400000,
        "variantImageUrl": "https://example.com/images/product.jpg",
        "selectedOptions": "[{\"name\":\"Size\",\"value\":\"L\"},{\"name\":\"Color\",\"value\":\"Blue\"}]"
      },
      {
        "id": "item-id-2",
        "productName": "Qu?n jean",
        "quantity": 1,
        "unitPrice": 400000,
        "totalPrice": 400000,
        "variantImageUrl": "https://example.com/images/jeans.jpg",
        "selectedOptions": "[{\"name\":\"Size\",\"value\":\"32\"}]"
      }
    ],
    "transactions": [
      {
        "id": "tx-id-1",
        "gateway": "VNPAY",
        "amount": 780000,
        "status": "SUCCESS",
        "gatewayTransactionId": "VNP12345678",
        "createdAt": "2025-01-08T10:35:00Z",
        "completedAt": "2025-01-08T10:35:30Z"
      }
    ]
  },
  "meta": {
    "timestamp": "2025-01-08T12:00:00Z",
    "endpoint": "/api/v1/admin/orders/a1b2c3d4-e5f6-7890-abcd-ef1234567890"
  }
}
```

#### Response Fields Explained

**Price Breakdown (Chi ti?t giá)**:
- `subTotal`: T?ng ti?n s?n ph?m (tr??c chi?t kh?u và phí ship)
- `shippingFee`: Phí v?n chuy?n
- `progressiveDiscountAmount`: Gi?m giá theo b?c (progressive discount)
- `voucherDiscountAmount`: Gi?m giá t? voucher
- `voucherCode`: Mã voucher ?ã s? d?ng (n?u có)
- `discountAmount`: T?ng gi?m giá (progressive + voucher)
- `totalAmount`: T?ng ti?n cu?i cùng (subTotal + shippingFee - discountAmount)

**Order Status Tracking**:
- `orderDate`: Ngày ??t hàng
- `shippedDate`: Ngày giao cho v?n chuy?n (null n?u ch?a ship)
- `deliveredDate`: Ngày giao hàng thành công (null n?u ch?a giao)

---

### 3. PUT /api/v1/admin/orders/{id}/status - C?p nh?t tr?ng thái ??n hàng

**Mô t?**: C?p nh?t tr?ng thái c?a ??n hàng (e.g., ?ánh d?u ?ã giao hàng, ?ã ship).

#### Path Parameters

| Parameter | Type | Required | Mô t?        |
|-----------|------|----------|--------------|
| `id`      | Guid | Yes      | ID ??n hàng  |

#### Request Body

```json
{
  "status": "SHIPPED"
}
```

**Valid Status Values**:
- `PENDING` - Ch? x? lý
- `PROCESSING` - ?ang x? lý
- `SHIPPED` - ?ã giao cho v?n chuy?n
- `DELIVERED` - ?ã giao hàng
- `CANCELLED` - ?ã h?y

#### Request Example

```bash
PUT /api/v1/admin/orders/a1b2c3d4-e5f6-7890-abcd-ef1234567890/status
Authorization: Bearer {admin_jwt_token}
Content-Type: application/json

{
  "status": "SHIPPED"
}
```

#### Response Example (200 OK)

```json
{
  "success": true,
  "code": "ORDER_STATUS_UPDATED",
  "message": "Order status updated successfully",
  "data": {
    "orderId": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
    "newStatus": "SHIPPED"
  },
  "meta": {
    "timestamp": "2025-01-08T12:00:00Z",
    "endpoint": "/api/v1/admin/orders/a1b2c3d4-e5f6-7890-abcd-ef1234567890/status"
  }
}
```

#### Automatic Date Tracking

Khi c?p nh?t tr?ng thái, h? th?ng t? ??ng c?p nh?t các tr??ng ngày tháng:
- `SHIPPED` ? `shippedDate` = current UTC time (n?u ch?a có)
- `DELIVERED` ? `deliveredDate` = current UTC time (n?u ch?a có)

---

## ? Error Responses

### 401 Unauthorized - Ch?a xác th?c

```json
{
  "success": false,
  "code": "UNAUTHORIZED",
  "message": "Unauthorized",
  "errors": [
    {
      "field": "auth",
      "message": "Unauthorized",
      "code": "UNAUTHORIZED"
    }
  ]
}
```

### 403 Forbidden - Không có quy?n Admin

```json
{
  "success": false,
  "code": "FORBIDDEN",
  "message": "Access denied",
  "errors": [
    {
      "field": "role",
      "message": "Admin role required",
      "code": "FORBIDDEN"
    }
  ]
}
```

### 404 Not Found - Không tìm th?y ??n hàng

```json
{
  "success": false,
  "code": "NOT_FOUND",
  "message": "Order not found",
  "errors": [
    {
      "field": "id",
      "message": "Order not found",
      "code": "NOT_FOUND"
    }
  ]
}
```

### 400 Bad Request - Tr?ng thái không h?p l?

```json
{
  "success": false,
  "code": "INVALID_STATUS",
  "message": "Invalid order status",
  "errors": [
    {
      "field": "status",
      "message": "Invalid order status",
      "code": "INVALID_STATUS"
    }
  ]
}
```

### 500 Internal Server Error

```json
{
  "success": false,
  "code": "INTERNAL_ERROR",
  "message": "Internal server error",
  "errors": [
    {
      "field": "server",
      "message": "Error retrieving orders",
      "code": "INTERNAL_ERROR"
    }
  ]
}
```

---

## ?? Use Cases (Các tr??ng h?p s? d?ng)

### 1. Admin Dashboard - Hi?n th? t?ng quan

**M?c ?ích**: Hi?n th? các th? th?ng kê và b?ng ??n hàng.

**Frontend g?i**:
```javascript
// GET /api/v1/admin/orders?page=1&pageSize=10
const response = await fetch('/api/v1/admin/orders?page=1&pageSize=10', {
  headers: {
    'Authorization': `Bearer ${adminToken}`
  }
});

const { data } = await response.json();

// Display stats cards
console.log('New Orders:', data.stats.newOrdersCount);
console.log('Ready to Ship:', data.stats.readyToShipCount);
console.log('Today Revenue:', data.stats.todaysRevenue);
console.log('Pending Payment:', data.stats.pendingPaymentCount);

// Display orders table
data.orders.forEach(order => {
  console.log(order.orderNumber, order.customerName, order.totalAmount);
});
```

### 2. L?c ??n hàng theo tr?ng thái

**M?c ?ích**: Admin mu?n xem ch? các ??n hàng "S?n sàng giao".

**Frontend g?i**:
```javascript
// GET /api/v1/admin/orders?status=PROCESSING
const response = await fetch('/api/v1/admin/orders?status=PROCESSING', {
  headers: {
    'Authorization': `Bearer ${adminToken}`
  }
});
```

### 3. Tìm ki?m ??n hàng

**M?c ?ích**: Admin tìm ??n hàng theo mã ho?c tên khách hàng.

**Frontend g?i**:
```javascript
// GET /api/v1/admin/orders?search=Nguyen Van A
const response = await fetch('/api/v1/admin/orders?search=Nguyen Van A', {
  headers: {
    'Authorization': `Bearer ${adminToken}`
  }
});
```

### 4. Xem chi ti?t và c?p nh?t tr?ng thái

**M?c ?ích**: Admin xem chi ti?t ??n hàng và ?ánh d?u ?ã giao hàng.

**Frontend g?i**:
```javascript
// Step 1: Get order details
const detailResponse = await fetch(`/api/v1/admin/orders/${orderId}`, {
  headers: {
    'Authorization': `Bearer ${adminToken}`
  }
});
const orderDetail = await detailResponse.json();

// Step 2: Update status to DELIVERED
const updateResponse = await fetch(`/api/v1/admin/orders/${orderId}/status`, {
  method: 'PUT',
  headers: {
    'Authorization': `Bearer ${adminToken}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({ status: 'DELIVERED' })
});
```

---

## ?? Performance Considerations

### Database Queries

- **Stats queries**: S? d?ng `CountAsync()` và `SumAsync()` cho hi?u su?t t?t
- **Order list**: S? d?ng `AsNoTracking()` cho read-only queries
- **Pagination**: S? d?ng `Skip()` và `Take()` ?? gi?i h?n k?t qu?
- **Filtering**: Áp d?ng `Where()` tr??c khi phân trang ?? gi?m t?i

### Indexing Recommendations

?? t?i ?u hi?u su?t, nên t?o index cho:
```sql
CREATE INDEX IX_Orders_Status ON Orders (Status);
CREATE INDEX IX_Orders_PaymentStatus ON Orders (PaymentStatus);
CREATE INDEX IX_Orders_OrderDate ON Orders (OrderDate DESC);
CREATE INDEX IX_Orders_ShippingFullName ON Orders (ShippingFullName);
```

---

## ?? Testing

### Test v?i Postman/Thunder Client

1. **Get dashboard**:
   ```
   GET {{baseUrl}}/api/v1/admin/orders?page=1&pageSize=10
   Authorization: Bearer {{adminToken}}
   ```

2. **Filter by status**:
   ```
   GET {{baseUrl}}/api/v1/admin/orders?status=PROCESSING
   Authorization: Bearer {{adminToken}}
   ```

3. **Search**:
   ```
   GET {{baseUrl}}/api/v1/admin/orders?search=ORD202501
   Authorization: Bearer {{adminToken}}
   ```

4. **Get order detail**:
   ```
   GET {{baseUrl}}/api/v1/admin/orders/{{orderId}}
   Authorization: Bearer {{adminToken}}
   ```

5. **Update status**:
   ```
   PUT {{baseUrl}}/api/v1/admin/orders/{{orderId}}/status
   Authorization: Bearer {{adminToken}}
   Content-Type: application/json
   
   {
     "status": "SHIPPED"
   }
   ```

---

## ?? Related Endpoints

- **User Orders**: `GET /api/v1/orders` - Khách hàng xem ??n hàng c?a mình
- **Transactions**: `GET /api/v1/transactions` - Xem l?ch s? giao d?ch
- **Checkout**: `POST /api/v1/checkout/create-order` - T?o ??n hàng m?i

---

## ?? Changelog

**Version 1.0** (2025-01-08):
- ? GET `/api/v1/admin/orders` - Dashboard v?i stats và phân trang
- ? GET `/api/v1/admin/orders/{id}` - Chi ti?t ??n hàng
- ? PUT `/api/v1/admin/orders/{id}/status` - C?p nh?t tr?ng thái

---

**Author**: ShopWave Development Team  
**Last Updated**: January 8, 2025
