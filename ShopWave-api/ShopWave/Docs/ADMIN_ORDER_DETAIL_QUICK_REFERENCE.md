# Admin Order Detail API - Quick Reference

## ?? Quick Start

### Endpoint
```
GET /api/v1/admin/orders/{id}
```

### Authorization
```typescript
headers: {
  'Authorization': `Bearer ${adminToken}`
}
```

## ?? Response Structure

```typescript
interface AdminOrderDetailResponse {
  success: boolean;
  message: string;
  data: {
    id: string;
    orderNumber: string;
    orderDate: string; // ISO 8601
    status: "PENDING" | "PROCESSING" | "SHIPPED" | "DELIVERED" | "CANCELLED";
    paymentStatus: "PAID" | "UNPAID" | "PENDING";
    paymentMethod?: "VNPAY" | "MOMO" | "COD";
    
    // Price breakdown (historical snapshot)
    subTotal: number;
    shippingFee: number;
    progressiveDiscountAmount: number;
    voucherDiscountAmount: number;
    voucherCode?: string;
    totalAmount: number;
    
    // Customer information
    shippingAddress: {
      fullName: string;
      phone: string;
      street: string;
      ward: string;
      district: string;
      province: string;
      notes?: string;
    };
    billingAddress?: { /* same structure */ };
    
    // Order items (historical snapshot)
    orderItems: Array<{
      id: string;
      productName: string; // Name at time of order
      variantImageUrl?: string; // Image at time of order
      quantity: number;
      unitPrice: number; // Price at time of order
      totalPrice: number;
      selectedOptions?: Array<{ // Variant options at time of order
        name: string; // e.g., "Size", "Color"
        value: string; // e.g., "XL", "Red"
      }>;
    }>;
    
    // Transaction history
    transactions: Array<{
      id: string;
      gateway: "VNPAY" | "MOMO" | "COD";
      gatewayTransactionId?: string; // Payment gateway's transaction ID
      amount: number;
      status: "PENDING" | "SUCCESS" | "FAILED";
      errorMessage?: string;
      gatewayResponse?: string; // Full JSON response for debugging
      createdAt: string; // ISO 8601
    }>;
  };
  errors: Array<{
    field: string;
    message: string;
    code: string;
  }>;
}
```

## ?? Common Use Cases

### 1. Display Order Summary
```typescript
const { subTotal, shippingFee, progressiveDiscountAmount, 
        voucherDiscountAmount, totalAmount } = order;

// Calculate displayed values
const totalDiscount = progressiveDiscountAmount + voucherDiscountAmount;
```

### 2. Display Order Items with Options
```typescript
{order.orderItems.map((item) => (
  <div key={item.id}>
    <img src={item.variantImageUrl} alt={item.productName} />
    <div>{item.productName}</div>
    <div>
      {item.selectedOptions?.map(opt => (
        <span key={opt.name}>{opt.name}: {opt.value}</span>
      ))}
    </div>
    <div>{item.quantity} x {formatCurrency(item.unitPrice)}</div>
    <div>Total: {formatCurrency(item.totalPrice)}</div>
  </div>
))}
```

### 3. Display Transaction History
```typescript
{order.transactions.map((tx) => (
  <div key={tx.id}>
    <span className={`status-${tx.status.toLowerCase()}`}>
      {tx.status}
    </span>
    <span>{tx.gateway}</span>
    <span>{formatCurrency(tx.amount)}</span>
    {tx.gatewayTransactionId && (
      <span>ID: {tx.gatewayTransactionId}</span>
    )}
    {tx.errorMessage && (
      <span className="error">{tx.errorMessage}</span>
    )}
    <span>{formatDate(tx.createdAt)}</span>
  </div>
))}
```

### 4. Display Shipping Address
```typescript
const { shippingAddress } = order;
const fullAddress = [
  shippingAddress.street,
  shippingAddress.ward,
  shippingAddress.district,
  shippingAddress.province
].filter(Boolean).join(", ");

<div>
  <div>{shippingAddress.fullName}</div>
  <div>{shippingAddress.phone}</div>
  <div>{fullAddress}</div>
  {shippingAddress.notes && <div>Note: {shippingAddress.notes}</div>}
</div>
```

## ?? Status Badge Styling

```typescript
function getStatusBadgeClass(status: string): string {
  const statusMap = {
    'PENDING': 'bg-yellow-100 text-yellow-800',
    'PROCESSING': 'bg-blue-100 text-blue-800',
    'SHIPPED': 'bg-purple-100 text-purple-800',
    'DELIVERED': 'bg-green-100 text-green-800',
    'CANCELLED': 'bg-red-100 text-red-800',
    'PAID': 'bg-green-100 text-green-800',
    'UNPAID': 'bg-yellow-100 text-yellow-800',
    'SUCCESS': 'bg-green-100 text-green-800',
    'FAILED': 'bg-red-100 text-red-800',
  };
  return statusMap[status] || 'bg-gray-100 text-gray-800';
}
```

## ??? Helper Functions

### Format Currency (Vietnamese Dong)
```typescript
function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND'
  }).format(amount);
}
```

### Format Date
```typescript
function formatDate(isoString: string): string {
  return new Date(isoString).toLocaleString('vi-VN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  });
}
```

## ?? Error Handling

### Order Not Found
```typescript
if (error.status === 404) {
  showNotification('??n hàng không t?n t?i', 'error');
  navigate('/admin/orders');
}
```

### Unauthorized
```typescript
if (error.status === 401 || error.status === 403) {
  showNotification('B?n không có quy?n truy c?p', 'error');
  navigate('/admin/login');
}
```

## ?? Sample Data

```json
{
  "success": true,
  "message": "ORDER_DETAIL_RETRIEVED",
  "data": {
    "id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "orderNumber": "ORD20250125001",
    "orderDate": "2025-01-25T10:30:00Z",
    "status": "PROCESSING",
    "paymentStatus": "PAID",
    "paymentMethod": "VNPAY",
    "subTotal": 1000000,
    "shippingFee": 30000,
    "progressiveDiscountAmount": 40000,
    "voucherDiscountAmount": 50000,
    "voucherCode": "SUMMER50",
    "totalAmount": 940000,
    "shippingAddress": {
      "fullName": "Nguy?n V?n A",
      "phone": "0123456789",
      "street": "123 ???ng ABC",
      "ward": "Ph??ng 1",
      "district": "Qu?n 1",
      "province": "TP. H? Chí Minh",
      "notes": "Giao hàng bu?i sáng"
    },
    "billingAddress": null,
    "orderItems": [
      {
        "id": "4fa85f64-5717-4562-b3fc-2c963f66afa7",
        "productName": "Áo thun nam",
        "variantImageUrl": "https://example.com/images/product123.jpg",
        "quantity": 2,
        "unitPrice": 250000,
        "totalPrice": 500000,
        "selectedOptions": [
          { "name": "Size", "value": "XL" },
          { "name": "Color", "value": "??" }
        ]
      }
    ],
    "transactions": [
      {
        "id": "6fa85f64-5717-4562-b3fc-2c963f66afa9",
        "gateway": "VNPAY",
        "gatewayTransactionId": "14012345678",
        "amount": 940000,
        "status": "SUCCESS",
        "errorMessage": null,
        "gatewayResponse": "{\"vnp_ResponseCode\":\"00\"}",
        "createdAt": "2025-01-25T10:30:05Z"
      }
    ]
  },
  "errors": []
}
```

## ?? Related Endpoints

- `GET /api/v1/admin/orders` - Get paginated order list
- `PUT /api/v1/admin/orders/{id}/status` - Update order status
- `GET /api/v1/admin/transactions/{id}` - Get transaction details

## ?? Notes

### Why Snapshot Data?
All product-related fields (`productName`, `unitPrice`, `variantImageUrl`, `selectedOptions`) are **snapshots** captured at order creation time. This ensures historical accuracy even if products are updated or deleted.

### Transaction Gateway Response
The `gatewayResponse` field contains the full JSON response from payment gateways (VNPay, MoMo). This is useful for debugging payment issues but should be displayed to admin only.

---

**Last Updated**: January 25, 2025  
**For**: Frontend Developers  
**Backend Version**: v1.0
