# Admin Payment Status Update Endpoint

## ?? Overview

This endpoint allows administrators to manually update the payment status of an order. It's useful for handling edge cases, manual payment confirmations, refunds, or payment failures.

## ?? Endpoint Details

**URL**: `PUT /api/v1/admin/orders/{id}/payment-status`

**Authorization**: Admin role required

**Content-Type**: `application/json`

## ?? Request

### Path Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `id` | GUID | Yes | Order ID (UUID format) |

### Request Body

```json
{
  "newPaymentStatus": "PAID"
}
```

#### UpdatePaymentStatusDto

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `newPaymentStatus` | string | Yes | New payment status. Valid values: `PAID`, `UNPAID`, `PENDING`, `REFUNDED`, `FAILED` |

### Valid Payment Status Values

| Status | Description | Use Case |
|--------|-------------|----------|
| `PAID` | Payment confirmed | Customer has successfully paid |
| `UNPAID` | Payment not received | COD orders, pending payments |
| `PENDING` | Payment processing | Waiting for gateway confirmation |
| `REFUNDED` | Payment returned | Order cancelled, refund issued |
| `FAILED` | Payment unsuccessful | Payment gateway error or rejection |

## ?? Response

### Success Response (200 OK)

```json
{
  "success": true,
  "message": "PAYMENT_STATUS_UPDATED",
  "data": {
    "orderId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "orderNumber": "ORD20250125001",
    "oldPaymentStatus": "UNPAID",
    "newPaymentStatus": "PAID",
    "orderStatus": "PROCESSING"
  },
  "errors": []
}
```

### Error Responses

#### Order Not Found (404)

```json
{
  "success": false,
  "message": "NOT_FOUND",
  "data": null,
  "errors": [
    {
      "field": "id",
      "message": "Không tìm th?y ??n hàng",
      "code": "NOT_FOUND"
    }
  ]
}
```

#### Invalid Payment Status (400)

```json
{
  "success": false,
  "message": "INVALID_PAYMENT_STATUS",
  "data": null,
  "errors": [
    {
      "field": "newPaymentStatus",
      "message": "Tr?ng thái thanh toán không h?p l?. Cho phép: PAID, UNPAID, PENDING, REFUNDED, FAILED",
      "code": "INVALID_VALUE"
    }
  ]
}
```

#### Missing Field (400)

```json
{
  "success": false,
  "message": "INVALID_REQUEST",
  "data": null,
  "errors": [
    {
      "field": "newPaymentStatus",
      "message": "Tr?ng thái thanh toán là b?t bu?c",
      "code": "REQUIRED"
    }
  ]
}
```

#### Unauthorized (401)

```json
{
  "success": false,
  "message": "UNAUTHORIZED",
  "data": null,
  "errors": [
    {
      "field": "auth",
      "message": "Unauthorized",
      "code": "UNAUTHORIZED"
    }
  ]
}
```

#### Forbidden (403)

```json
{
  "success": false,
  "message": "FORBIDDEN",
  "data": null,
  "errors": [
    {
      "field": "role",
      "message": "Admin role required",
      "code": "FORBIDDEN"
    }
  ]
}
```

## ?? Automatic Business Logic

The endpoint includes automatic business logic that triggers based on the status change:

### When Status Changed to `PAID`

1. **Auto-Status Update**: If order status is `PENDING_PAYMENT`, it will automatically change to `PROCESSING`
2. **Transaction Update**: Any pending transaction associated with the order will be marked as `SUCCESS`
3. **Completion Timestamp**: Transaction's `CompletedAt` field is set to current UTC time

**Example**:
```
Order Status: PENDING_PAYMENT ? PROCESSING
Transaction Status: PENDING ? SUCCESS
```

### When Status Changed to `REFUNDED`

1. **Logging**: Refund event is logged
2. **Future Enhancement**: Space for stock restoration, refund transaction creation

## ?? Authorization

**Required**: User must have `Admin` role in JWT token.

**Header Example**:
```
Authorization: Bearer <admin_jwt_token>
```

## ?? Use Cases

### Use Case 1: Manual Payment Confirmation
**Scenario**: Bank transfer received but not reflected in system

```bash
curl -X PUT \
  "http://localhost:5000/api/v1/admin/orders/3fa85f64-5717-4562-b3fc-2c963f66afa6/payment-status" \
  -H "Authorization: Bearer <admin_token>" \
  -H "Content-Type: application/json" \
  -d '{
    "newPaymentStatus": "PAID"
  }'
```

**Result**:
- Order payment status: `UNPAID` ? `PAID`
- Order status: `PENDING_PAYMENT` ? `PROCESSING` (automatic)
- Transaction status: `PENDING` ? `SUCCESS` (automatic)

---

### Use Case 2: Mark Failed Payment
**Scenario**: Payment gateway timeout or customer's bank declined

```bash
curl -X PUT \
  "http://localhost:5000/api/v1/admin/orders/{orderId}/payment-status" \
  -H "Authorization: Bearer <admin_token>" \
  -H "Content-Type: application/json" \
  -d '{
    "newPaymentStatus": "FAILED"
  }'
```

---

### Use Case 3: Issue Refund
**Scenario**: Customer requested cancellation after payment

```bash
curl -X PUT \
  "http://localhost:5000/api/v1/admin/orders/{orderId}/payment-status" \
  -H "Authorization: Bearer <admin_token>" \
  -H "Content-Type: application/json" \
  -d '{
    "newPaymentStatus": "REFUNDED"
  }'
```

---

### Use Case 4: Reset to Pending
**Scenario**: Payment gateway issue, waiting for re-attempt

```bash
curl -X PUT \
  "http://localhost:5000/api/v1/admin/orders/{orderId}/payment-status" \
  -H "Authorization: Bearer <admin_token>" \
  -H "Content-Type: application/json" \
  -d '{
    "newPaymentStatus": "PENDING"
  }'
```

## ?? Testing with cURL

### Test 1: Successful Update

```bash
curl -X PUT \
  "http://localhost:5000/api/v1/admin/orders/3fa85f64-5717-4562-b3fc-2c963f66afa6/payment-status" \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "newPaymentStatus": "PAID"
  }'
```

**Expected**: Status 200 with updated payment status

---

### Test 2: Invalid Status

```bash
curl -X PUT \
  "http://localhost:5000/api/v1/admin/orders/3fa85f64-5717-4562-b3fc-2c963f66afa6/payment-status" \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "newPaymentStatus": "INVALID_STATUS"
  }'
```

**Expected**: Status 400 with validation error

---

### Test 3: Order Not Found

```bash
curl -X PUT \
  "http://localhost:5000/api/v1/admin/orders/00000000-0000-0000-0000-000000000000/payment-status" \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "newPaymentStatus": "PAID"
  }'
```

**Expected**: Status 404 with not found error

---

### Test 4: Missing Authorization

```bash
curl -X PUT \
  "http://localhost:5000/api/v1/admin/orders/3fa85f64-5717-4562-b3fc-2c963f66afa6/payment-status" \
  -H "Content-Type: application/json" \
  -d '{
    "newPaymentStatus": "PAID"
  }'
```

**Expected**: Status 401 Unauthorized

## ?? Frontend Integration (React Example)

### API Service Method

```typescript
// services/adminApi.ts

export async function updatePaymentStatus(
  orderId: string,
  newPaymentStatus: "PAID" | "UNPAID" | "PENDING" | "REFUNDED" | "FAILED"
) {
  const response = await fetch(
    `${API_BASE_URL}/api/v1/admin/orders/${orderId}/payment-status`,
    {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${getAdminToken()}`,
      },
      body: JSON.stringify({ newPaymentStatus }),
    }
  );

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.errors?.[0]?.message || "Failed to update payment status");
  }

  return await response.json();
}
```

### React Component Example

```typescript
import { useState } from "react";
import { updatePaymentStatus } from "../services/adminApi";

export default function PaymentStatusDropdown({ order, onUpdate }) {
  const [loading, setLoading] = useState(false);

  const handleStatusChange = async (newStatus: string) => {
    if (!confirm(`Xác nh?n thay ??i tr?ng thái thanh toán thành ${newStatus}?`)) {
      return;
    }

    setLoading(true);
    try {
      const result = await updatePaymentStatus(order.id, newStatus);
      alert("C?p nh?t tr?ng thái thanh toán thành công!");
      onUpdate(result.data); // Refresh order data
    } catch (error) {
      alert(`L?i: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <select
      value={order.paymentStatus}
      onChange={(e) => handleStatusChange(e.target.value)}
      disabled={loading}
      className="border rounded px-2 py-1"
    >
      <option value="PAID">?ã thanh toán</option>
      <option value="UNPAID">Ch?a thanh toán</option>
      <option value="PENDING">?ang x? lý</option>
      <option value="REFUNDED">?ã hoàn ti?n</option>
      <option value="FAILED">Th?t b?i</option>
    </select>
  );
}
```

## ?? Status Change Matrix

| Current Status | New Status | Order Status Impact | Transaction Impact |
|----------------|-----------|---------------------|-------------------|
| `UNPAID` | `PAID` | `PENDING_PAYMENT` ? `PROCESSING` | `PENDING` ? `SUCCESS` |
| `UNPAID` | `FAILED` | No change | No change |
| `PENDING` | `PAID` | `PENDING_PAYMENT` ? `PROCESSING` | `PENDING` ? `SUCCESS` |
| `PENDING` | `FAILED` | No change | No change |
| `PAID` | `REFUNDED` | No change | No change |
| `FAILED` | `PENDING` | No change | No change |

## ?? Database Changes

### Order Table Update
```sql
UPDATE Orders
SET 
    PaymentStatus = @NewPaymentStatus,
    Status = CASE 
        WHEN @NewPaymentStatus = 'PAID' AND Status = 'PENDING_PAYMENT' 
        THEN 'PROCESSING' 
        ELSE Status 
    END,
    UpdatedAt = GETUTCDATE()
WHERE Id = @OrderId
```

### Transaction Table Update (when status = PAID)
```sql
UPDATE Transactions
SET 
    Status = 'SUCCESS',
    CompletedAt = GETUTCDATE(),
    UpdatedAt = GETUTCDATE()
WHERE 
    OrderId = @OrderId 
    AND Status = 'PENDING'
    AND CreatedAt = (
        SELECT MAX(CreatedAt) 
        FROM Transactions 
        WHERE OrderId = @OrderId AND Status = 'PENDING'
    )
```

## ?? Logging

The endpoint logs all payment status changes with the following information:

```
INFO: Order ORD20250125001 payment status updated from UNPAID to PAID by admin
INFO: Order ORD20250125001 status automatically changed to PROCESSING after payment confirmation
INFO: Transaction 4fa85f64-... marked as SUCCESS
```

## ?? Important Notes

1. **Admin Only**: This endpoint is restricted to users with Admin role
2. **Audit Trail**: All changes are logged with timestamp and old/new values
3. **Automatic Logic**: Changing to `PAID` automatically updates order status and transaction
4. **Case Insensitive**: Payment status values are case-insensitive (converted to uppercase)
5. **No Reversal**: Status changes are not automatically reversible; manual correction required

## ?? Future Enhancements

Potential improvements for future versions:

1. **Stock Restoration**: Automatically restore stock when refunded
2. **Refund Transaction Record**: Create a separate transaction record for refunds
3. **Email Notifications**: Send email to customer when payment status changes
4. **Status Change History**: Log all status changes in a separate audit table
5. **Validation Rules**: Add business rules for allowed status transitions
6. **Webhook Integration**: Trigger webhooks when payment status changes

## ?? Related Endpoints

- `GET /api/v1/admin/orders/{id}` - Get order details
- `PUT /api/v1/admin/orders/{id}/status` - Update order status
- `GET /api/v1/admin/orders` - List all orders

## ?? Related Documentation

- [Admin Order Detail API](./ADMIN_ORDER_DETAIL_IMPLEMENTATION.md)
- [Admin Orders API](./ADMIN_ORDERS_API.md)
- [Transactions Guide](./TRANSACTIONS_TABLE_GUIDE.md)

---

**Last Updated**: January 25, 2025  
**Version**: 1.0  
**Status**: ? Production Ready
