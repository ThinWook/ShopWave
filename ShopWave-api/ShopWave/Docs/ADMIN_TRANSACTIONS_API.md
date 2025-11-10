# ?? Admin Transactions Dashboard API

## ?? T?ng Quan

API này cung c?p giao di?n qu?n lý giao d?ch thanh toán cho Admin, bao g?m:
- **Th?ng kê t?ng quan**: Doanh thu hôm nay, s? l??ng giao d?ch thành công/th?t b?i
- **B?ng danh sách giao d?ch**: V?i phân trang, l?c, tìm ki?m
- **Chi ti?t giao d?ch**: Xem thông tin ??y ?? c?a m?t giao d?ch

---

## ?? Endpoints

### 1. GET Dashboard v?i Th?ng kê + Danh sách

**Endpoint**: `GET /api/v1/admin/transactions`

**Authorization**: Yêu c?u role `Admin`

**Query Parameters**:

| Parameter | Type | Default | Mô t? |
|-----------|------|---------|-------|
| `page` | int | 1 | Trang hi?n t?i |
| `pageSize` | int | 10 | S? items m?i trang |
| `status` | string? | null | L?c theo tr?ng thái (SUCCESS, FAILED, PENDING) |
| `gateway` | string? | null | L?c theo c?ng thanh toán (VNPAY, MOMO, COD) |
| `search` | string? | null | Tìm ki?m theo mã ??n hàng ho?c mã GD |
| `days` | int | 7 | L?c theo s? ngày g?n ?ây |

**Response Structure**:

```json
{
  "status": "success",
  "code": "ADMIN_TRANSACTIONS_RETRIEVED",
  "data": {
    "stats": {
      "todaysRevenue": 15000000,
      "successfulTodayCount": 12,
      "failedTodayCount": 3
    },
    "pagination": {
      "currentPage": 1,
      "pageSize": 10,
      "totalItems": 45,
      "totalPages": 5
    },
    "transactions": [
      {
        "id": "550e8400-e29b-41d4-a716-446655440000",
        "gatewayTransactionId": "14312345",
        "orderNumber": "ORD20250125001",
        "createdAt": "2025-01-25T10:30:00Z",
        "gateway": "VNPAY",
        "amount": 1250000,
        "status": "SUCCESS"
      }
    ]
  }
}
```

---

### 2. GET Chi ti?t Giao d?ch

**Endpoint**: `GET /api/v1/admin/transactions/{id}`

**Authorization**: Yêu c?u role `Admin`

**Path Parameters**:

| Parameter | Type | Mô t? |
|-----------|------|-------|
| `id` | Guid | Transaction ID |

**Response Structure**:

```json
{
  "status": "success",
  "code": "TRANSACTION_DETAIL_RETRIEVED",
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "orderId": "660e8400-e29b-41d4-a716-446655440001",
    "orderNumber": "ORD20250125001",
    "gateway": "VNPAY",
    "gatewayTransactionId": "14312345",
    "amount": 1250000,
    "status": "SUCCESS",
    "transactionType": "PAYMENT",
    "errorMessage": null,
    "gatewayResponse": "{\"vnp_ResponseCode\":\"00\",\"vnp_Message\":\"Success\"}",
    "ipAddress": "192.168.1.1",
    "userAgent": "Mozilla/5.0...",
    "createdAt": "2025-01-25T10:30:00Z",
    "updatedAt": "2025-01-25T10:31:00Z",
    "completedAt": "2025-01-25T10:31:00Z"
  }
}
```

---

## ?? Th?ng Kê (Stats) - Gi?i thích Logic

### 1. Today's Revenue (Doanh thu hôm nay)
```csharp
TodaysRevenue = await _context.Transactions
    .Where(t => t.Status == "SUCCESS" && 
                t.CreatedAt >= todayStart && 
                t.CreatedAt < todayEnd)
    .SumAsync(t => t.Amount);
```
- **?i?u ki?n**: Ch? tính các giao d?ch `SUCCESS` trong ngày hôm nay
- **K?t qu?**: T?ng s? ti?n (VND)

### 2. Successful Today Count (S? GD thành công)
```csharp
SuccessfulTodayCount = await todaysSuccessQuery.CountAsync();
```
- **?i?u ki?n**: ??m s? l??ng giao d?ch `SUCCESS` hôm nay

### 3. Failed Today Count (S? GD th?t b?i)
```csharp
FailedTodayCount = await _context.Transactions
    .CountAsync(t => t.Status == "FAILED" && 
                     t.CreatedAt >= todayStart && 
                     t.CreatedAt < todayEnd);
```
- **?i?u ki?n**: ??m s? l??ng giao d?ch `FAILED` hôm nay

---

## ?? Filters (B? L?c)

### 1. Status Filter (L?c theo Tr?ng thái)
```csharp
if (!string.IsNullOrEmpty(status))
{
    query = query.Where(t => t.Status == status);
}
```

**Các giá tr? h?p l?**:
- `SUCCESS` - Giao d?ch thành công
- `FAILED` - Giao d?ch th?t b?i
- `PENDING` - ?ang ch? x? lý

### 2. Gateway Filter (L?c theo C?ng TT)
```csharp
if (!string.IsNullOrEmpty(gateway))
{
    query = query.Where(t => t.Gateway == gateway);
}
```

**Các giá tr? h?p l?**:
- `VNPAY` - VNPay
- `MOMO` - MoMo
- `COD` - Thanh toán khi nh?n hàng
- `ZALOPAY` - ZaloPay

### 3. Search Filter (Tìm ki?m)
```csharp
if (!string.IsNullOrEmpty(search))
{
    var searchLower = search.ToLower();
    query = query.Where(t =>
        (t.Order != null && t.Order.OrderNumber.ToLower().Contains(searchLower)) ||
        (t.GatewayTransactionId != null && t.GatewayTransactionId.ToLower().Contains(searchLower))
    );
}
```

**Tìm ki?m theo**:
- Mã ??n hàng (Order Number)
- Mã giao d?ch Gateway (Gateway Transaction ID)

### 4. Days Filter (L?c theo Ngày)
```csharp
var dateFilter = DateTime.UtcNow.AddDays(-days);
query = query.Where(t => t.CreatedAt >= dateFilter);
```

**M?c ??nh**: 7 ngày g?n ?ây

---

## ?? Request Examples

### Example 1: L?y t?t c? giao d?ch (trang 1)
```http
GET /api/v1/admin/transactions?page=1&pageSize=10
Authorization: Bearer {admin_token}
```

### Example 2: L?c giao d?ch thành công c?a VNPAY
```http
GET /api/v1/admin/transactions?status=SUCCESS&gateway=VNPAY
Authorization: Bearer {admin_token}
```

### Example 3: Tìm ki?m theo mã ??n hàng
```http
GET /api/v1/admin/transactions?search=ORD20250125001
Authorization: Bearer {admin_token}
```

### Example 4: L?y giao d?ch 30 ngày g?n ?ây
```http
GET /api/v1/admin/transactions?days=30
Authorization: Bearer {admin_token}
```

### Example 5: K?t h?p nhi?u filter
```http
GET /api/v1/admin/transactions?status=FAILED&gateway=VNPAY&days=3&page=1
Authorization: Bearer {admin_token}
```

---

## ?? Use Cases

### Use Case 1: Dashboard Overview
**M?c ?ích**: Hi?n th? th? th?ng kê t?ng quan trên ??u trang

```javascript
// Frontend code example
const response = await fetch('/api/v1/admin/transactions?page=1&pageSize=10');
const data = await response.json();

// Display stats
console.log(`Doanh thu hôm nay: ${data.data.stats.todaysRevenue.toLocaleString()} VND`);
console.log(`Thành công: ${data.data.stats.successfulTodayCount}`);
console.log(`Th?t b?i: ${data.data.stats.failedTodayCount}`);
```

### Use Case 2: Filter Failed Transactions
**M?c ?ích**: Xem các giao d?ch th?t b?i ?? x? lý

```javascript
const response = await fetch('/api/v1/admin/transactions?status=FAILED&days=7');
const data = await response.json();

// Show failed transactions
data.data.transactions.forEach(tx => {
  console.log(`${tx.orderNumber} - ${tx.gateway} - ${tx.amount}`);
});
```

### Use Case 3: Search Specific Order
**M?c ?ích**: Tìm giao d?ch c?a m?t ??n hàng c? th?

```javascript
const orderNumber = 'ORD20250125001';
const response = await fetch(`/api/v1/admin/transactions?search=${orderNumber}`);
const data = await response.json();

// Show transaction for this order
console.log(data.data.transactions);
```

---

## ?? Error Responses

### 401 Unauthorized
```json
{
  "status": "fail",
  "code": "UNAUTHORIZED",
  "errors": [
    {
      "field": "authorization",
      "message": "Authentication required",
      "code": "UNAUTHORIZED"
    }
  ]
}
```

### 403 Forbidden
```json
{
  "status": "fail",
  "code": "FORBIDDEN",
  "errors": [
    {
      "field": "role",
      "message": "Admin role required",
      "code": "FORBIDDEN"
    }
  ]
}
```

### 404 Not Found (Chi ti?t giao d?ch)
```json
{
  "status": "fail",
  "code": "NOT_FOUND",
  "errors": [
    {
      "field": "id",
      "message": "Transaction not found",
      "code": "NOT_FOUND"
    }
  ]
}
```

### 500 Internal Server Error
```json
{
  "status": "fail",
  "code": "INTERNAL_ERROR",
  "errors": [
    {
      "field": "server",
      "message": "Error retrieving transactions",
      "code": "INTERNAL_ERROR"
    }
  ]
}
```

---

## ?? Testing v?i Postman/Thunder Client

### 1. Setup Environment Variables
```
BASE_URL=http://localhost:5000
ADMIN_TOKEN=<your_admin_jwt_token>
```

### 2. Test Dashboard
```http
GET {{BASE_URL}}/api/v1/admin/transactions
Authorization: Bearer {{ADMIN_TOKEN}}
```

### 3. Test with Filters
```http
GET {{BASE_URL}}/api/v1/admin/transactions?status=SUCCESS&gateway=VNPAY&page=1&pageSize=20
Authorization: Bearer {{ADMIN_TOKEN}}
```

### 4. Test Transaction Detail
```http
GET {{BASE_URL}}/api/v1/admin/transactions/550e8400-e29b-41d4-a716-446655440000
Authorization: Bearer {{ADMIN_TOKEN}}
```

---

## ?? Database Queries Explained

### Query 1: Stats Calculation (Efficient)
```sql
-- Today's Revenue (Single query)
SELECT SUM(Amount) 
FROM Transactions 
WHERE Status = 'SUCCESS' 
  AND CreatedAt >= @todayStart 
  AND CreatedAt < @todayEnd;

-- Successful Count (Reuses same query)
SELECT COUNT(*) 
FROM Transactions 
WHERE Status = 'SUCCESS' 
  AND CreatedAt >= @todayStart 
  AND CreatedAt < @todayEnd;

-- Failed Count (Separate query)
SELECT COUNT(*) 
FROM Transactions 
WHERE Status = 'FAILED' 
  AND CreatedAt >= @todayStart 
  AND CreatedAt < @todayEnd;
```

### Query 2: Transaction List with Filters
```sql
SELECT t.*, o.OrderNumber
FROM Transactions t
LEFT JOIN Orders o ON t.OrderId = o.Id
WHERE t.CreatedAt >= @dateFilter
  AND (@status IS NULL OR t.Status = @status)
  AND (@gateway IS NULL OR t.Gateway = @gateway)
  AND (@search IS NULL OR 
       o.OrderNumber LIKE '%' + @search + '%' OR
       t.GatewayTransactionId LIKE '%' + @search + '%')
ORDER BY t.CreatedAt DESC
OFFSET @skip ROWS
FETCH NEXT @pageSize ROWS ONLY;
```

---

## ?? Frontend Integration Tips

### 1. Stats Cards Component
```tsx
// React/Next.js example
function StatsCards({ stats }) {
  return (
    <div className="grid grid-cols-3 gap-4">
      <Card>
        <h3>Doanh thu hôm nay</h3>
        <p className="text-2xl">{stats.todaysRevenue.toLocaleString()} ?</p>
      </Card>
      <Card>
        <h3>Giao d?ch thành công</h3>
        <p className="text-2xl text-green-600">{stats.successfulTodayCount}</p>
      </Card>
      <Card>
        <h3>Giao d?ch th?t b?i</h3>
        <p className="text-2xl text-red-600">{stats.failedTodayCount}</p>
      </Card>
    </div>
  );
}
```

### 2. Transaction Table Component
```tsx
function TransactionTable({ transactions, pagination, onPageChange }) {
  return (
    <>
      <table>
        <thead>
          <tr>
            <th>Mã GD</th>
            <th>??n hàng</th>
            <th>Ngày</th>
            <th>C?ng TT</th>
            <th>S? ti?n</th>
            <th>Tr?ng thái</th>
          </tr>
        </thead>
        <tbody>
          {transactions.map(tx => (
            <tr key={tx.id}>
              <td>{tx.gatewayTransactionId || 'N/A'}</td>
              <td>{tx.orderNumber}</td>
              <td>{new Date(tx.createdAt).toLocaleString('vi-VN')}</td>
              <td>{tx.gateway}</td>
              <td>{tx.amount.toLocaleString()} ?</td>
              <td>
                <StatusBadge status={tx.status} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <Pagination {...pagination} onChange={onPageChange} />
    </>
  );
}
```

---

## ? Best Practices

### 1. Always Use AsNoTracking() for Read-Only Queries
```csharp
IQueryable<Transaction> query = _context.Transactions
    .Include(t => t.Order)
    .AsNoTracking(); // ? Better performance
```

### 2. Build Query Incrementally (IQueryable)
```csharp
// ? Good: Query is not executed until ToListAsync()
IQueryable<Transaction> query = _context.Transactions;
query = query.Where(...); // Add filters
query = query.OrderBy(...); // Add sorting
var results = await query.ToListAsync(); // Execute once

// ? Bad: Multiple database calls
var all = await _context.Transactions.ToListAsync();
var filtered = all.Where(...); // In-memory filtering
```

### 3. Use Pagination for Large Datasets
```csharp
// ? Good: Only fetch required page
var results = await query
    .Skip((page - 1) * pageSize)
    .Take(pageSize)
    .ToListAsync();

// ? Bad: Fetch all and paginate in memory
var all = await query.ToListAsync();
var page = all.Skip((page - 1) * pageSize).Take(pageSize);
```

---

## ?? Deployment Notes

### 1. Database Indexes
?? t?i ?u hi?u su?t, hãy thêm indexes:

```sql
-- Index cho CreatedAt (dùng trong filter days)
CREATE INDEX IX_Transactions_CreatedAt 
ON Transactions(CreatedAt DESC);

-- Index cho Status (dùng trong stats và filter)
CREATE INDEX IX_Transactions_Status 
ON Transactions(Status);

-- Index cho Gateway (dùng trong filter)
CREATE INDEX IX_Transactions_Gateway 
ON Transactions(Gateway);

-- Composite index cho stats query
CREATE INDEX IX_Transactions_Status_CreatedAt 
ON Transactions(Status, CreatedAt DESC);
```

### 2. Caching Strategy
Có th? cache stats trong 1-5 phút:

```csharp
// Example with IMemoryCache
var cacheKey = $"admin_tx_stats_{todayStart:yyyyMMdd}";
if (!_cache.TryGetValue(cacheKey, out AdminTransactionStatsDto stats))
{
    stats = await CalculateStats();
    _cache.Set(cacheKey, stats, TimeSpan.FromMinutes(5));
}
```

---

## ?? Related Documentation

- [Admin Orders API](./ADMIN_ORDERS_API.md)
- [Transactions Table Guide](./TRANSACTIONS_TABLE_GUIDE.md)
- [VNPAY Integration](./VNPAY_INTEGRATION_COMPLETE.md)

---

**Created**: January 25, 2025  
**Last Updated**: January 25, 2025  
**Version**: 1.0.0
