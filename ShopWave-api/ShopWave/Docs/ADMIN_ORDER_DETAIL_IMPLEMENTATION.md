# Admin Order Detail Implementation (Single Transaction Page)

## ?? Overview

This document describes the implementation of the **Admin Order Detail API** (`GET /api/v1/admin/orders/{id}`) which provides complete information for the "Single Transaction" page in the admin panel.

## ?? Purpose

The admin needs to view detailed information about a specific order, including:
- Order summary and status
- Customer shipping/billing information
- Order items with product snapshots (price, image, options at time of order)
- Transaction history (payment gateway interactions)

## ?? Implementation Details

### 1. DTOs (Data Transfer Objects)

**File**: `ShopWave/DTOs/Admin/OrderAdminDtos.cs`

#### `AdminOrderDetailDto`
Main response DTO containing all order information:

```csharp
public class AdminOrderDetailDto
{
    public Guid Id { get; set; }
    public string OrderNumber { get; set; }
    public DateTime OrderDate { get; set; }
    
    // Status
    public string Status { get; set; }
    public string PaymentStatus { get; set; }
    public string? PaymentMethod { get; set; }

    // Price Breakdown (snapshot)
    public decimal SubTotal { get; set; }
    public decimal ShippingFee { get; set; }
    public decimal ProgressiveDiscountAmount { get; set; }
    public decimal VoucherDiscountAmount { get; set; }
    public string? VoucherCode { get; set; }
    public decimal TotalAmount { get; set; }

    // Addresses
    public AdminOrderShippingAddressDto ShippingAddress { get; set; }
    public AdminOrderBillingAddressDto? BillingAddress { get; set; }
    
    // Related data
    public List<AdminOrderItemDto> OrderItems { get; set; }
    public List<AdminTransactionDto> Transactions { get; set; }
}
```

#### `AdminOrderItemDto`
Order item with snapshot data:

```csharp
public class AdminOrderItemDto
{
    public Guid Id { get; set; }
    public string ProductName { get; set; } // Snapshot
    public string? VariantImageUrl { get; set; } // Snapshot
    public int Quantity { get; set; }
    public decimal UnitPrice { get; set; } // Snapshot
    public decimal TotalPrice { get; set; }
    public List<SelectedOptionDto>? SelectedOptions { get; set; } // Deserialized from JSON
}
```

#### `AdminTransactionDto`
Transaction history entry:

```csharp
public class AdminTransactionDto
{
    public Guid Id { get; set; }
    public string Gateway { get; set; } // VNPAY, MOMO, COD
    public string? GatewayTransactionId { get; set; }
    public decimal Amount { get; set; }
    public string Status { get; set; } // PENDING, SUCCESS, FAILED
    public string? ErrorMessage { get; set; }
    public string? GatewayResponse { get; set; } // Full JSON for debugging
    public DateTime CreatedAt { get; set; }
}
```

### 2. Controller Endpoint

**File**: `ShopWave/Controllers/Admin/OrdersAdminController.cs`

#### Endpoint: `GET /api/v1/admin/orders/{id}`

**Authorization**: Requires `Admin` role

**Process Flow**:

1. **Query Database**
   ```csharp
   var order = await _context.Orders
       .Include(o => o.OrderItems)    // Load order items
       .Include(o => o.Transactions)  // Load transaction history
       .AsNoTracking()
       .FirstOrDefaultAsync(o => o.Id == id);
   ```

2. **Map to DTO**
   - Extract all order fields
   - Map flattened address fields to structured DTOs
   - Deserialize `SelectedOptions` JSON string to `List<SelectedOptionDto>`
   - Map transaction history

3. **Return Response**
   ```csharp
   return Ok(EnvelopeBuilder.Ok(HttpContext, "ORDER_DETAIL_RETRIEVED", orderDto));
   ```

### 3. Key Features

#### Snapshot Data Preservation
All price-sensitive and product-related data is stored as **snapshots** at order creation time:
- `ProductName`: Product name at time of order
- `VariantImageUrl`: Variant image URL at time of order
- `UnitPrice`: Price at time of order
- `SelectedOptions`: Variant options (e.g., Size: XL, Color: Red)

This ensures admin can see **historical data** even if products are updated or deleted.

#### SelectedOptions Deserialization
The `SelectedOptions` field in `OrderItems` is stored as a JSON string in the database:

**Database**: 
```json
"[{\"name\":\"Size\",\"value\":\"XL\"},{\"name\":\"Color\",\"value\":\"Red\"}]"
```

**API Response**:
```json
"selectedOptions": [
  { "name": "Size", "value": "XL" },
  { "name": "Color", "value": "Red" }
]
```

**Implementation**:
```csharp
private List<SelectedOptionDto>? DeserializeSelectedOptions(string? json)
{
    if (string.IsNullOrEmpty(json))
        return null;

    try
    {
        return JsonSerializer.Deserialize<List<SelectedOptionDto>>(
            json,
            new JsonSerializerOptions { PropertyNameCaseInsensitive = true }
        );
    }
    catch (JsonException ex)
    {
        _logger.LogWarning(ex, "Failed to deserialize SelectedOptions: {Json}", json);
        return null;
    }
}
```

## ?? Response Format

### Success Response (200 OK)

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
      },
      {
        "id": "5fa85f64-5717-4562-b3fc-2c963f66afa8",
        "productName": "Qu?n jean nam",
        "variantImageUrl": "https://example.com/images/product456.jpg",
        "quantity": 1,
        "unitPrice": 500000,
        "totalPrice": 500000,
        "selectedOptions": [
          { "name": "Size", "value": "32" },
          { "name": "Color", "value": "Xanh" }
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
        "gatewayResponse": "{\"vnp_ResponseCode\":\"00\",\"vnp_TransactionNo\":\"14012345678\"}",
        "createdAt": "2025-01-25T10:30:05Z"
      }
    ]
  },
  "errors": []
}
```

### Error Response - Order Not Found (404)

```json
{
  "success": false,
  "message": "NOT_FOUND",
  "data": null,
  "errors": [
    {
      "field": "id",
      "message": "??n hàng không t?n t?i",
      "code": "NOT_FOUND"
    }
  ]
}
```

### Error Response - Internal Server Error (500)

```json
{
  "success": false,
  "message": "INTERNAL_ERROR",
  "data": null,
  "errors": [
    {
      "field": "server",
      "message": "L?i khi truy xu?t ??n hàng",
      "code": "INTERNAL_ERROR"
    }
  ]
}
```

## ?? Authorization

**Required**: User must have `Admin` role in JWT token.

**Header**:
```
Authorization: Bearer <admin_jwt_token>
```

## ?? Testing with cURL

### Get Order Detail

```bash
curl -X GET \
  "http://localhost:5000/api/v1/admin/orders/3fa85f64-5717-4562-b3fc-2c963f66afa6" \
  -H "Authorization: Bearer <admin_token>"
```

## ?? Database Tables Used

1. **Orders** - Main order table
2. **OrderItems** - Order items with snapshot fields
3. **Transactions** - Payment transaction history

## ?? Frontend Integration (React Example)

```typescript
// ShopWave-admin/src/pages/SingleTransaction.tsx

import { useParams } from "react-router";
import { useEffect, useState } from "react";
import { adminApi } from "../services/adminApi";

export default function SingleTransaction() {
  const { id } = useParams();
  const [order, setOrder] = useState<AdminOrderDetailDto | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadOrder() {
      try {
        const response = await adminApi.get(`/api/v1/admin/orders/${id}`);
        setOrder(response.data);
      } catch (error) {
        console.error("Failed to load order:", error);
      } finally {
        setLoading(false);
      }
    }
    loadOrder();
  }, [id]);

  if (loading) return <div>Loading...</div>;
  if (!order) return <div>Order not found</div>;

  return (
    <div>
      <h1>Order #{order.orderNumber}</h1>
      
      {/* Order Status */}
      <div>
        <span>Status: {order.status}</span>
        <span>Payment: {order.paymentStatus}</span>
      </div>

      {/* Price Breakdown */}
      <div>
        <p>Subtotal: {formatCurrency(order.subTotal)}</p>
        <p>Shipping: {formatCurrency(order.shippingFee)}</p>
        <p>Progressive Discount: -{formatCurrency(order.progressiveDiscountAmount)}</p>
        {order.voucherCode && (
          <p>Voucher ({order.voucherCode}): -{formatCurrency(order.voucherDiscountAmount)}</p>
        )}
        <p><strong>Total: {formatCurrency(order.totalAmount)}</strong></p>
      </div>

      {/* Order Items */}
      <table>
        <thead>
          <tr>
            <th>Product</th>
            <th>Options</th>
            <th>Quantity</th>
            <th>Unit Price</th>
            <th>Total</th>
          </tr>
        </thead>
        <tbody>
          {order.orderItems.map((item) => (
            <tr key={item.id}>
              <td>
                <img src={item.variantImageUrl} alt={item.productName} />
                {item.productName}
              </td>
              <td>
                {item.selectedOptions?.map((opt) => (
                  <span key={opt.name}>{opt.name}: {opt.value}</span>
                ))}
              </td>
              <td>{item.quantity}</td>
              <td>{formatCurrency(item.unitPrice)}</td>
              <td>{formatCurrency(item.totalPrice)}</td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Transaction History */}
      <h2>Transaction History</h2>
      <ul>
        {order.transactions.map((tx) => (
          <li key={tx.id}>
            {tx.gateway} - {tx.status} - {formatCurrency(tx.amount)}
            {tx.gatewayTransactionId && <span> (ID: {tx.gatewayTransactionId})</span>}
          </li>
        ))}
      </ul>
    </div>
  );
}
```

## ? Checklist

- [x] DTOs created for admin order detail response
- [x] Controller endpoint implemented with proper authorization
- [x] SelectedOptions JSON deserialization
- [x] Transaction history included
- [x] Snapshot data preserved (product name, price, image, options)
- [x] Error handling with proper status codes
- [x] Build successful with no compilation errors
- [x] Documentation complete

## ?? Related Documentation

- [ADMIN_ORDERS_API.md](./ADMIN_ORDERS_API.md) - Complete Admin Orders API documentation
- [ORDER_FIX_COMPLETE.md](./ORDER_FIX_COMPLETE.md) - Order structure and snapshot implementation
- [TRANSACTIONS_TABLE_GUIDE.md](./TRANSACTIONS_TABLE_GUIDE.md) - Transaction table structure

## ?? Notes

### Why Snapshot Data?

Storing snapshot data ensures that even if:
- A product is deleted
- Prices are updated
- Product names are changed
- Variant options are modified

The admin can still see the **exact state** of the order at the time it was placed. This is critical for:
- Order history auditing
- Tax/accounting records
- Customer dispute resolution
- Historical reporting

### Performance Optimization

The endpoint uses `.AsNoTracking()` for read-only queries, which improves performance by skipping change tracking overhead.

### Future Enhancements

Potential improvements for future versions:
1. Add order notes/comments system
2. Add shipment tracking integration
3. Add refund management
4. Add order status change history (audit trail)
5. Add customer information card (user details, order history)

---

**Last Updated**: January 25, 2025  
**Version**: 1.0  
**Status**: ? Complete and Production-Ready
