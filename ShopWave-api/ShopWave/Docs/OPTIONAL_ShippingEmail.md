# Optional: Add Shipping Email to Order Model

## Context

Client ?ang g?i `email` trong `shippingAddress`, nh?ng `Order` model hi?n t?i không có field ?? l?u email.

## Quick Fix

### 1. Update Order Model

```csharp
// ShopWave/Models/Order.cs

// Add after ShippingPhone field:
[MaxLength(255)]
[EmailAddress]
public string? ShippingEmail { get; set; }

// Add after BillingPhone field (optional):
[MaxLength(255)]
[EmailAddress]
public string? BillingEmail { get; set; }
```

### 2. Update CheckoutController

```csharp
// ShopWave/Controllers/CheckoutController.cs
// In CreateCheckout method, add:

ShippingEmail = request.ShippingAddress.Email,
BillingEmail = request.BillingAddress?.Email,
```

### 3. Update OrdersController (GetOrderById)

```csharp
// ShopWave/Controllers/OrdersController.cs
// In OrderDetailDto construction, add:

ShippingAddress = new AddressDto
{
    FullName = order.ShippingFullName,
    Phone = order.ShippingPhone,
    Email = order.ShippingEmail, // <-- ADD THIS
    Address = order.ShippingStreet,
    Ward = order.ShippingWard,
    District = order.ShippingDistrict,
    City = order.ShippingProvince,
    Notes = order.ShippingNotes
},
BillingAddress = !string.IsNullOrEmpty(order.BillingFullName) ? new AddressDto
{
    FullName = order.BillingFullName,
    Phone = order.BillingPhone ?? "",
    Email = order.BillingEmail, // <-- ADD THIS
    Address = order.BillingStreet ?? "",
    Ward = order.BillingWard ?? "",
    District = order.BillingDistrict ?? "",
    City = order.BillingProvince ?? "",
    Notes = order.BillingNotes
} : null,
```

### 4. Create Migration

```bash
cd ShopWave
dotnet ef migrations add AddEmailToOrderAddress
dotnet ef database update
```

## SQL Migration (Manual Alternative)

```sql
-- Add Shipping and Billing Email columns to Orders table
ALTER TABLE Orders 
ADD ShippingEmail NVARCHAR(255) NULL;

ALTER TABLE Orders 
ADD BillingEmail NVARCHAR(255) NULL;

-- Optional: Add email validation constraint
ALTER TABLE Orders
ADD CONSTRAINT CK_Orders_ShippingEmail_Format 
CHECK (ShippingEmail IS NULL OR ShippingEmail LIKE '%@%.%');

ALTER TABLE Orders
ADD CONSTRAINT CK_Orders_BillingEmail_Format 
CHECK (BillingEmail IS NULL OR BillingEmail LIKE '%@%.%');
```

## Verification

### Test 1: Create Order with Email

```json
POST /api/v1/checkout
{
  "paymentMethod": "COD",
  "shippingAddress": {
    "fullName": "Test User",
    "phone": "0123456789",
    "email": "test@example.com",
    "address": "123 Test St",
    "ward": "Ward 1",
    "district": "District 1",
    "city": "Ho Chi Minh"
  }
}
```

### Test 2: Verify Email Saved

```sql
SELECT TOP 1 
    OrderNumber,
    ShippingFullName,
    ShippingEmail,
    CreatedAt
FROM Orders
ORDER BY CreatedAt DESC;
```

Expected result:
```
OrderNumber   | ShippingFullName | ShippingEmail       | CreatedAt
ORD20240115001| Test User        | test@example.com    | 2024-01-15 10:30:00
```

### Test 3: Get Order Details

```json
GET /api/v1/orders/{orderId}

Response:
{
  "success": true,
  "data": {
    "shippingAddress": {
      "fullName": "Test User",
      "email": "test@example.com",  // <-- Should be present
      "phone": "0123456789",
      ...
    }
  }
}
```

## Benefits

? Email ???c l?u vào database  
? Có th? g?i email xác nh?n order  
? Có th? g?i email tracking shipment  
? Data integrity - ??y ?? thông tin khách hàng  

## Alternative: Temporary Workaround (No Migration)

N?u không mu?n migration ngay, có th? l?u email vào `ShippingNotes` field:

```csharp
// In CheckoutController.cs
ShippingNotes = !string.IsNullOrEmpty(request.ShippingAddress.Email) 
    ? $"Email: {request.ShippingAddress.Email}\n{request.ShippingAddress.Notes}"
    : request.ShippingAddress.Notes,
```

?? **Not recommended** - violates data normalization and makes querying by email difficult.

---

**Status**: Optional Enhancement  
**Priority**: Medium  
**Effort**: Low (15 minutes)  
**Impact**: High (enables email notifications)
