# Admin Payment Status Update - Quick Reference

## ?? Quick Start

### Endpoint
```
PUT /api/v1/admin/orders/{id}/payment-status
```

### Authorization
```typescript
headers: {
  'Authorization': `Bearer ${adminToken}`,
  'Content-Type': 'application/json'
}
```

## ?? Request/Response

### Request Body
```typescript
{
  newPaymentStatus: "PAID" | "UNPAID" | "PENDING" | "REFUNDED" | "FAILED"
}
```

### Success Response (200)
```typescript
{
  success: true,
  message: "PAYMENT_STATUS_UPDATED",
  data: {
    orderId: string,
    orderNumber: string,
    oldPaymentStatus: string,
    newPaymentStatus: string,
    orderStatus: string  // May auto-update to PROCESSING
  }
}
```

## ?? Payment Status Values

| Value | Display Text | Badge Color | Use Case |
|-------|-------------|-------------|----------|
| `PAID` | ?ã thanh toán | ?? Green | Payment confirmed |
| `UNPAID` | Ch?a thanh toán | ?? Yellow | COD, awaiting payment |
| `PENDING` | ?ang x? lý | ?? Blue | Processing payment |
| `REFUNDED` | ?ã hoàn ti?n | ?? Purple | Refund issued |
| `FAILED` | Th?t b?i | ?? Red | Payment failed |

## ? Automatic Actions

### When changing to `PAID`:
1. ? Order status: `PENDING_PAYMENT` ? `PROCESSING`
2. ? Transaction status: `PENDING` ? `SUCCESS`
3. ? Transaction `CompletedAt` timestamp set

## ?? React/TypeScript Example

### API Service
```typescript
// services/adminApi.ts

export async function updateOrderPaymentStatus(
  orderId: string,
  newPaymentStatus: "PAID" | "UNPAID" | "PENDING" | "REFUNDED" | "FAILED"
) {
  const response = await fetch(
    `/api/v1/admin/orders/${orderId}/payment-status`,
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
    throw new Error(error.errors?.[0]?.message || "Update failed");
  }

  return await response.json();
}
```

### Dropdown Component
```typescript
import { useState } from "react";
import { updateOrderPaymentStatus } from "@/services/adminApi";

interface PaymentStatusDropdownProps {
  order: {
    id: string;
    orderNumber: string;
    paymentStatus: string;
  };
  onUpdate: (updatedOrder: any) => void;
}

export default function PaymentStatusDropdown({ 
  order, 
  onUpdate 
}: PaymentStatusDropdownProps) {
  const [loading, setLoading] = useState(false);

  const statusOptions = [
    { value: "PAID", label: "?ã thanh toán", color: "bg-green-100 text-green-800" },
    { value: "UNPAID", label: "Ch?a thanh toán", color: "bg-yellow-100 text-yellow-800" },
    { value: "PENDING", label: "?ang x? lý", color: "bg-blue-100 text-blue-800" },
    { value: "REFUNDED", label: "?ã hoàn ti?n", color: "bg-purple-100 text-purple-800" },
    { value: "FAILED", label: "Th?t b?i", color: "bg-red-100 text-red-800" },
  ];

  const handleChange = async (newStatus: string) => {
    const statusLabel = statusOptions.find(s => s.value === newStatus)?.label;
    
    if (!confirm(`Xác nh?n thay ??i tr?ng thái thanh toán thành "${statusLabel}"?`)) {
      return;
    }

    setLoading(true);
    try {
      const result = await updateOrderPaymentStatus(order.id, newStatus as any);
      
      alert(`? C?p nh?t thành công!\n\n??n hàng: ${result.data.orderNumber}\nTr?ng thái c?: ${result.data.oldPaymentStatus}\nTr?ng thái m?i: ${result.data.newPaymentStatus}`);
      
      onUpdate(result.data);
    } catch (error: any) {
      alert(`? L?i: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const currentStatus = statusOptions.find(s => s.value === order.paymentStatus);

  return (
    <div className="relative">
      <select
        value={order.paymentStatus}
        onChange={(e) => handleChange(e.target.value)}
        disabled={loading}
        className={`
          px-3 py-1.5 rounded-full text-sm font-medium
          ${currentStatus?.color || 'bg-gray-100 text-gray-800'}
          ${loading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
          border-none outline-none
        `}
      >
        {statusOptions.map(option => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center bg-white bg-opacity-50 rounded-full">
          <div className="animate-spin h-4 w-4 border-2 border-gray-800 border-t-transparent rounded-full"></div>
        </div>
      )}
    </div>
  );
}
```

### Usage in Order Detail Page
```typescript
import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import PaymentStatusDropdown from "@/components/PaymentStatusDropdown";

export default function OrderDetailPage() {
  const { id } = useParams();
  const [order, setOrder] = useState(null);

  useEffect(() => {
    // Load order details
    fetchOrderDetails(id).then(setOrder);
  }, [id]);

  const handlePaymentStatusUpdate = (updatedData) => {
    // Update local order state
    setOrder(prev => ({
      ...prev,
      paymentStatus: updatedData.newPaymentStatus,
      status: updatedData.orderStatus, // May have changed automatically
    }));
  };

  if (!order) return <div>Loading...</div>;

  return (
    <div>
      <h1>Order #{order.orderNumber}</h1>
      
      <div className="flex items-center gap-4">
        <span className="text-gray-600">Tr?ng thái thanh toán:</span>
        <PaymentStatusDropdown 
          order={order} 
          onUpdate={handlePaymentStatusUpdate} 
        />
      </div>
      
      {/* Rest of order details */}
    </div>
  );
}
```

## ?? Badge Component (Optional)

```typescript
// components/PaymentStatusBadge.tsx

interface PaymentStatusBadgeProps {
  status: "PAID" | "UNPAID" | "PENDING" | "REFUNDED" | "FAILED";
}

export default function PaymentStatusBadge({ status }: PaymentStatusBadgeProps) {
  const config = {
    PAID: {
      label: "?ã thanh toán",
      className: "bg-green-100 text-green-800 border-green-200",
      icon: "?",
    },
    UNPAID: {
      label: "Ch?a thanh toán",
      className: "bg-yellow-100 text-yellow-800 border-yellow-200",
      icon: "?",
    },
    PENDING: {
      label: "?ang x? lý",
      className: "bg-blue-100 text-blue-800 border-blue-200",
      icon: "?",
    },
    REFUNDED: {
      label: "?ã hoàn ti?n",
      className: "bg-purple-100 text-purple-800 border-purple-200",
      icon: "?",
    },
    FAILED: {
      label: "Th?t b?i",
      className: "bg-red-100 text-red-800 border-red-200",
      icon: "?",
    },
  };

  const { label, className, icon } = config[status] || config.UNPAID;

  return (
    <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium border ${className}`}>
      <span>{icon}</span>
      <span>{label}</span>
    </span>
  );
}
```

## ?? Error Handling

```typescript
try {
  const result = await updateOrderPaymentStatus(orderId, "PAID");
  console.log("Success:", result);
} catch (error) {
  if (error.status === 404) {
    alert("Không tìm th?y ??n hàng");
  } else if (error.status === 400) {
    alert("Tr?ng thái thanh toán không h?p l?");
  } else if (error.status === 401 || error.status === 403) {
    alert("B?n không có quy?n th?c hi?n thao tác này");
    // Redirect to login
  } else {
    alert("L?i không xác ??nh. Vui lòng th? l?i.");
  }
}
```

## ?? Status Flow Chart

```
UNPAID ???????
             ??? PAID ??? [Auto: Order Status = PROCESSING]
PENDING ??????             [Auto: Transaction = SUCCESS]
             
PAID ????? REFUNDED

Any Status ????? FAILED
```

## ?? Important Notes

1. **Admin Only**: Requires admin authentication
2. **Case Insensitive**: Status values automatically converted to uppercase
3. **Automatic Updates**: Changing to `PAID` may auto-update order status
4. **No Undo**: Changes are permanent; requires manual correction
5. **Validation**: Only accepts predefined status values

## ?? Quick Test (cURL)

```bash
# Test successful update
curl -X PUT \
  "http://localhost:5000/api/v1/admin/orders/YOUR_ORDER_ID/payment-status" \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"newPaymentStatus":"PAID"}'

# Expected: 200 OK with updated status
```

## ?? Related APIs

- `GET /api/v1/admin/orders/{id}` - Get order details
- `PUT /api/v1/admin/orders/{id}/status` - Update order status

---

**Quick Tip**: For best UX, show a confirmation dialog before changing payment status and display a loading spinner during the request.

**Last Updated**: January 25, 2025
