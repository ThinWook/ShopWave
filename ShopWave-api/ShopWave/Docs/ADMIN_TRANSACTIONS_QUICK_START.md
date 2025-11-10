# ?? Admin Transactions API - Quick Start

## B?t ??u nhanh trong 5 phút

### 1?? Test Basic Dashboard (Không filter)

**Request**:
```http
GET http://localhost:5000/api/v1/admin/transactions
Authorization: Bearer YOUR_ADMIN_TOKEN
```

**Expected Response**:
```json
{
  "status": "success",
  "code": "ADMIN_TRANSACTIONS_RETRIEVED",
  "data": {
    "stats": {
      "todaysRevenue": 0,
      "successfulTodayCount": 0,
      "failedTodayCount": 0
    },
    "pagination": {
      "currentPage": 1,
      "pageSize": 10,
      "totalItems": 0,
      "totalPages": 0
    },
    "transactions": []
  }
}
```

---

### 2?? Filter Successful Transactions

**Request**:
```http
GET http://localhost:5000/api/v1/admin/transactions?status=SUCCESS
Authorization: Bearer YOUR_ADMIN_TOKEN
```

---

### 3?? Search by Order Number

**Request**:
```http
GET http://localhost:5000/api/v1/admin/transactions?search=ORD20250125001
Authorization: Bearer YOUR_ADMIN_TOKEN
```

---

### 4?? Get Transaction Details

**Request**:
```http
GET http://localhost:5000/api/v1/admin/transactions/{transaction-id}
Authorization: Bearer YOUR_ADMIN_TOKEN
```

---

## ?? Available Filters

| Filter | Example | Description |
|--------|---------|-------------|
| `status` | `?status=SUCCESS` | SUCCESS, FAILED, PENDING |
| `gateway` | `?gateway=VNPAY` | VNPAY, MOMO, COD |
| `search` | `?search=ORD123` | Order number or Transaction ID |
| `days` | `?days=30` | Recent days (default: 7) |
| `page` | `?page=2` | Page number (default: 1) |
| `pageSize` | `?pageSize=20` | Items per page (default: 10) |

---

## ?? Common Scenarios

### Scenario 1: Monitor Today's Performance
```http
GET /api/v1/admin/transactions?days=1
```
Shows only today's transactions with stats.

### Scenario 2: Find Failed VNPAY Transactions
```http
GET /api/v1/admin/transactions?status=FAILED&gateway=VNPAY&days=3
```

### Scenario 3: Investigate Specific Order
```http
GET /api/v1/admin/transactions?search=ORD20250125001
```

---

## ?? Setup Tips

### 1. Get Admin Token
```bash
# Login as admin first
POST /api/v1/auth/login
{
  "email": "admin@shopwave.com",
  "password": "your_password"
}

# Copy the token from response
```

### 2. Set Authorization Header
```bash
# In Postman/Thunder Client
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### 3. Test with cURL
```bash
curl -X GET "http://localhost:5000/api/v1/admin/transactions?page=1" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

## ? Checklist

- [ ] Admin authentication working
- [ ] Can fetch transaction list
- [ ] Stats showing correct numbers
- [ ] Filters working (status, gateway)
- [ ] Search working (order number)
- [ ] Pagination working
- [ ] Transaction details working

---

## ?? Troubleshooting

### Problem: 401 Unauthorized
**Solution**: Make sure you're using an admin token and it's not expired.

### Problem: Empty stats/transactions
**Solution**: Create test transactions first (make some orders with payments).

### Problem: 500 Internal Server Error
**Solution**: Check `Transactions` table exists and has `Order` relationship.

---

## ?? Next Steps

1. ? Test all filters
2. ? Integrate with frontend
3. ? Add indexes for performance
4. ? Set up caching if needed

**Full Documentation**: [ADMIN_TRANSACTIONS_API.md](./ADMIN_TRANSACTIONS_API.md)
