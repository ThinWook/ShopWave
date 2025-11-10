# Admin Transaction Detail Modal - Quick Reference

## ?? Quick Start

### Endpoint
```
GET /api/v1/admin/transactions/{id}
```

### Authorization
```typescript
headers: {
  'Authorization': `Bearer ${adminToken}`
}
```

## ?? Response Structure

```typescript
interface AdminTransactionDetail {
  // Basic info
  id: string;
  orderId: string;
  orderNumber: string;  // e.g., "ORD20250125001"
  status: "SUCCESS" | "FAILED" | "PENDING" | "REFUNDED";
  gateway: "VNPAY" | "MOMO" | "COD";
  transactionType: "PAYMENT" | "REFUND";
  amount: number;
  
  // Timestamps
  createdAt: string;      // ISO 8601
  updatedAt: string;      // ISO 8601
  completedAt?: string;   // ISO 8601 (null if not completed)
  
  // Debug info (optional)
  gatewayTransactionId?: string;
  ipAddress?: string;
  userAgent?: string;
  errorMessage?: string;
  gatewayResponse?: string;  // JSON string
}
```

## ?? Status Badge Colors

```typescript
const statusConfig = {
  SUCCESS: {
    label: "Thành công",
    color: "bg-green-100 text-green-800",
    icon: "?",
  },
  FAILED: {
    label: "Th?t b?i",
    color: "bg-red-100 text-red-800",
    icon: "?",
  },
  PENDING: {
    label: "?ang x? lý",
    color: "bg-yellow-100 text-yellow-800",
    icon: "?",
  },
  REFUNDED: {
    label: "?ã hoàn ti?n",
    color: "bg-purple-100 text-purple-800",
    icon: "?",
  },
};
```

## ?? React Modal Component (Complete)

```typescript
import { useState, useEffect } from "react";
import { formatCurrency } from "@/utils/format";

interface TransactionDetailModalProps {
  transactionId: string;
  isOpen: boolean;
  onClose: () => void;
}

export default function TransactionDetailModal({
  transactionId,
  isOpen,
  onClose,
}: TransactionDetailModalProps) {
  const [transaction, setTransaction] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!isOpen) return;

    async function fetchTransaction() {
      setLoading(true);
      setError(null);
      
      try {
        const response = await fetch(
          `/api/v1/admin/transactions/${transactionId}`,
          {
            headers: {
              Authorization: `Bearer ${localStorage.getItem("adminToken")}`,
            },
          }
        );

        if (!response.ok) {
          throw new Error("Failed to fetch transaction");
        }

        const json = await response.json();
        setTransaction(json.data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    fetchTransaction();
  }, [transactionId, isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b">
          <h2 className="text-xl font-semibold">Chi ti?t giao d?ch</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-6">
          {loading && <div>?ang t?i...</div>}
          {error && <div className="text-red-600">L?i: {error}</div>}
          
          {transaction && (
            <>
              {/* Basic Information */}
              <section>
                <h3 className="text-lg font-medium mb-3">Thông tin c? b?n</h3>
                <div className="grid grid-cols-2 gap-4">
                  <InfoRow label="Mã giao d?ch" value={transaction.id} />
                  <InfoRow 
                    label="??n hàng" 
                    value={
                      <a 
                        href={`/admin/orders/${transaction.orderId}`}
                        className="text-blue-600 hover:underline"
                        target="_blank"
                      >
                        {transaction.orderNumber}
                      </a>
                    } 
                  />
                  <InfoRow 
                    label="Tr?ng thái" 
                    value={<StatusBadge status={transaction.status} />} 
                  />
                  <InfoRow label="C?ng thanh toán" value={transaction.gateway} />
                  <InfoRow label="Lo?i giao d?ch" value={transaction.transactionType} />
                  <InfoRow 
                    label="S? ti?n" 
                    value={
                      <span className="font-bold text-lg">
                        {formatCurrency(transaction.amount)}
                      </span>
                    } 
                  />
                </div>
              </section>

              {/* Timestamps */}
              <section>
                <h3 className="text-lg font-medium mb-3">Th?i gian</h3>
                <div className="grid grid-cols-2 gap-4">
                  <InfoRow 
                    label="T?o lúc" 
                    value={new Date(transaction.createdAt).toLocaleString("vi-VN")} 
                  />
                  <InfoRow 
                    label="C?p nh?t" 
                    value={new Date(transaction.updatedAt).toLocaleString("vi-VN")} 
                  />
                  {transaction.completedAt && (
                    <InfoRow 
                      label="Hoàn thành" 
                      value={new Date(transaction.completedAt).toLocaleString("vi-VN")} 
                    />
                  )}
                </div>
              </section>

              {/* Debug Information */}
              {(transaction.gatewayTransactionId || transaction.ipAddress || transaction.errorMessage) && (
                <section>
                  <h3 className="text-lg font-medium mb-3">Thông tin k? thu?t</h3>
                  <div className="grid grid-cols-1 gap-4">
                    {transaction.gatewayTransactionId && (
                      <InfoRow 
                        label="Mã GD c?ng thanh toán" 
                        value={<code className="bg-gray-100 px-2 py-1 rounded">{transaction.gatewayTransactionId}</code>} 
                      />
                    )}
                    {transaction.ipAddress && (
                      <InfoRow 
                        label="IP Address" 
                        value={<code className="bg-gray-100 px-2 py-1 rounded">{transaction.ipAddress}</code>} 
                      />
                    )}
                    {transaction.errorMessage && (
                      <InfoRow 
                        label="L?i" 
                        value={<span className="text-red-600">{transaction.errorMessage}</span>} 
                      />
                    )}
                  </div>
                </section>
              )}

              {/* Gateway Response (collapsible) */}
              {transaction.gatewayResponse && (
                <section>
                  <details className="border rounded-lg">
                    <summary className="px-4 py-3 cursor-pointer hover:bg-gray-50 font-medium">
                      Gateway Response (JSON)
                    </summary>
                    <pre className="p-4 bg-gray-50 overflow-x-auto text-sm">
                      {JSON.stringify(JSON.parse(transaction.gatewayResponse), null, 2)}
                    </pre>
                  </details>
                </section>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-3 px-6 py-4 border-t bg-gray-50">
          <button
            onClick={onClose}
            className="px-4 py-2 border rounded-lg hover:bg-gray-100"
          >
            ?óng
          </button>
        </div>
      </div>
    </div>
  );
}

// Helper Components
function InfoRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <div className="text-sm text-gray-500 mb-1">{label}</div>
      <div className="text-gray-900">{value}</div>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const config = {
    SUCCESS: { label: "Thành công", color: "bg-green-100 text-green-800" },
    FAILED: { label: "Th?t b?i", color: "bg-red-100 text-red-800" },
    PENDING: { label: "?ang x? lý", color: "bg-yellow-100 text-yellow-800" },
    REFUNDED: { label: "?ã hoàn ti?n", color: "bg-purple-100 text-purple-800" },
  };

  const { label, color } = config[status] || config.PENDING;

  return (
    <span className={`inline-flex px-3 py-1 rounded-full text-sm font-medium ${color}`}>
      {label}
    </span>
  );
}
```

## ?? Usage in Transaction List

```typescript
// TransactionListPage.tsx

import { useState } from "react";
import TransactionDetailModal from "./TransactionDetailModal";

export default function TransactionListPage() {
  const [selectedTransactionId, setSelectedTransactionId] = useState<string | null>(null);

  return (
    <div>
      {/* Transaction Table */}
      <table>
        <tbody>
          {transactions.map((tx) => (
            <tr key={tx.id}>
              <td>{tx.orderNumber}</td>
              <td>{tx.gateway}</td>
              <td>{tx.amount}</td>
              <td>
                <button 
                  onClick={() => setSelectedTransactionId(tx.id)}
                  className="text-blue-600 hover:underline"
                >
                  Xem chi ti?t
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Modal */}
      <TransactionDetailModal
        transactionId={selectedTransactionId || ""}
        isOpen={selectedTransactionId !== null}
        onClose={() => setSelectedTransactionId(null)}
      />
    </div>
  );
}
```

## ??? Helper Functions

### Format Currency (Vietnamese Dong)

```typescript
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
  }).format(amount);
}
```

### Format Date

```typescript
export function formatDate(isoString: string): string {
  return new Date(isoString).toLocaleString("vi-VN", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}
```

### Parse Gateway Response

```typescript
export function parseGatewayResponse(jsonString?: string): any {
  if (!jsonString) return null;
  
  try {
    return JSON.parse(jsonString);
  } catch (error) {
    console.error("Failed to parse gateway response:", error);
    return null;
  }
}
```

## ?? Error Handling

```typescript
try {
  const response = await fetch(`/api/v1/admin/transactions/${id}`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!response.ok) {
    if (response.status === 404) {
      alert("Giao d?ch không t?n t?i");
    } else if (response.status === 401 || response.status === 403) {
      alert("B?n không có quy?n truy c?p");
      // Redirect to login
    } else {
      alert("L?i khi t?i giao d?ch");
    }
    return;
  }

  const json = await response.json();
  setTransaction(json.data);
} catch (error) {
  alert("L?i k?t n?i m?ng");
}
```

## ?? Styling Tips

### Modal Backdrop

```css
.modal-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  z-index: 50;
  display: flex;
  align-items: center;
  justify-content: center;
}
```

### Modal Content

```css
.modal-content {
  background: white;
  border-radius: 0.5rem;
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1);
  max-width: 42rem;
  width: 100%;
  max-height: 90vh;
  overflow-y: auto;
}
```

### Status Badge

```css
.badge {
  display: inline-flex;
  padding: 0.25rem 0.75rem;
  border-radius: 9999px;
  font-size: 0.875rem;
  font-weight: 500;
}

.badge-success {
  background: rgb(220 252 231);
  color: rgb(22 101 52);
}

.badge-failed {
  background: rgb(254 226 226);
  color: rgb(153 27 27);
}
```

## ?? Sample Data

```json
{
  "success": true,
  "message": "TRANSACTION_DETAIL_RETRIEVED",
  "data": {
    "id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "orderId": "4fa85f64-5717-4562-b3fc-2c963f66afa7",
    "orderNumber": "ORD20250125001",
    "status": "SUCCESS",
    "gateway": "VNPAY",
    "transactionType": "PAYMENT",
    "amount": 940000,
    "createdAt": "2025-01-25T10:30:00Z",
    "updatedAt": "2025-01-25T10:30:15Z",
    "completedAt": "2025-01-25T10:30:15Z",
    "gatewayTransactionId": "14012345678",
    "ipAddress": "192.168.1.100",
    "userAgent": "Mozilla/5.0 ...",
    "errorMessage": null,
    "gatewayResponse": "{\"vnp_ResponseCode\":\"00\"}"
  }
}
```

## ?? Quick Test (cURL)

```bash
# Get transaction detail
curl -X GET \
  "http://localhost:5000/api/v1/admin/transactions/YOUR_TRANSACTION_ID" \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN"

# Expected: 200 OK with full details
```

## ?? Related

- Full Documentation: [ADMIN_TRANSACTION_DETAIL_MODAL.md](./ADMIN_TRANSACTION_DETAIL_MODAL.md)
- Admin Transactions API: [ADMIN_TRANSACTIONS_API.md](./ADMIN_TRANSACTIONS_API.md)

---

**Last Updated**: January 25, 2025
