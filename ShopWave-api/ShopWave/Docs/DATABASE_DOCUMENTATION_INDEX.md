# ?? SHOPWAVE DATABASE DOCUMENTATION INDEX

## ?? T?ng quan

Tài li?u này cung c?p thông tin chi ti?t v? c?u trúc c? s? d? li?u c?a h? th?ng ShopWave E-commerce.

---

## ??? Danh sách tài li?u

### **1. DATABASE_SCHEMA_DOCUMENTATION.md** 
?? **Mô t? chi ti?t c?u trúc database**

**N?i dung**:
- Mô t? chi ti?t 26 b?ng trong database
- C?u trúc t?ng c?t (type, default, constraints)
- Quan h? gi?a các b?ng (foreign keys, navigation properties)
- Indexes và constraints
- ??c ?i?m b?o m?t và t?i ?u hi?u su?t
- H??ng d?n migration và seeding

**Phù h?p cho**: Developers, Database Administrators, Backend Engineers

**Link**: [DATABASE_SCHEMA_DOCUMENTATION.md](./DATABASE_SCHEMA_DOCUMENTATION.md)

---

### **2. DATABASE_ERD_DIAGRAM.md**
?? **S? ?? ERD (Entity Relationship Diagram)**

**N?i dung**:
- S? ?? ERD ??y ?? v?i Mermaid
- Tóm t?t các lo?i quan h? (1:N, N:M, Self-Reference)
- Ví d? th?c t? v? product variants, order flow, location hierarchy
- Query examples (SQL)
- Th?ng kê b?ng và cascade behaviors

**Phù h?p cho**: Architects, Business Analysts, Developers m?i join

**Link**: [DATABASE_ERD_DIAGRAM.md](./DATABASE_ERD_DIAGRAM.md)

---

## ?? Quick Reference

### **S? l??ng b?ng theo nhóm ch?c n?ng**

| Nhóm                  | S? b?ng | B?ng chính                                    |
|-----------------------|---------|-----------------------------------------------|
| ?? User Management    | 4       | Users, UserSessions, UserSettings, UserMedia  |
| ??? Product Management | 6       | Products, Variants, Options, Values, Media    |
| ?? Cart & Wishlist    | 2       | Carts, CartItems                              |
| ?? Discount & Pricing | 3       | Discounts, AppliedDiscounts, DiscountTiers    |
| ?? Order Management   | 3       | Orders, OrderItems, Transactions              |
| ?? Media & Category   | 3       | Media, Categories, Notifications              |
| ?? Location & Shipping| 4       | Provinces, Districts, Wards, ShippingRates    |
| **T?ng c?ng**         | **26**  |                                               |

---

## ?? Các b?ng quan tr?ng nh?t

### **Core Tables (5)**
1. **Users** - Qu?n lý tài kho?n ng??i dùng
2. **Products** - Thông tin s?n ph?m chính
3. **Orders** - ??n hàng (h? tr? guest checkout)
4. **ProductVariants** - Bi?n th? s?n ph?m (size, màu)
5. **Transactions** - Giao d?ch thanh toán (VNPay, MoMo, COD)

### **Feature Tables (8)**
6. **ProductOptions** - Tùy ch?n s?n ph?m (Color, Size)
7. **OptionValues** - Giá tr? option (Red, Blue, M, L)
8. **VariantValues** - Ánh x? variant ? option values (N:M)
9. **Carts** - Gi? hàng (user ho?c session-based)
10. **CartItems** - S?n ph?m trong gi?
11. **Discounts** - Mã gi?m giá (voucher)
12. **DiscountTiers** - Gi?m giá theo b?c (progressive)
13. **Categories** - Danh m?c s?n ph?m (phân c?p)

### **Supporting Tables (13)**
14. **OrderItems** - Chi ti?t ??n hàng (snapshot)
15. **AppliedDiscounts** - Voucher ?ã áp d?ng
16. **Media** - L?u tr? file media (images)
17. **ProductMedia** - Liên k?t product ? media (N:M)
18. **UserMedia** - Liên k?t user ? media (avatar, cover)
19. **Provinces** - T?nh/Thành ph?
20. **Districts** - Qu?n/Huy?n
21. **Wards** - Ph??ng/Xã
22. **ShippingRates** - Phí v?n chuy?n theo t?nh
23. **UserSessions** - Qu?n lý phiên ??ng nh?p
24. **UserSettings** - Cài ??t cá nhân (key-value)
25. **Notifications** - Thông báo cho user
26. **ShippingRates** - Phí v?n chuy?n

---

## ?? S? ?? t?ng quan

```
??????????????????????????????????????????????????????????
?              SHOPWAVE DATABASE STRUCTURE               ?
??????????????????????????????????????????????????????????
?                                                         ?
?  USER LAYER          PRODUCT LAYER        ORDER LAYER  ?
?  ???????????        ???????????         ???????????   ?
?  ? Users   ????????>?Products ?<????????? Orders  ?   ?
?  ???????????        ???????????         ???????????   ?
?       ?                  ?                    ?        ?
?       ??Sessions         ??Variants           ??Items  ?
?       ??Settings         ??Options            ??Trans  ?
?       ??Media            ??Media                       ?
?       ??Carts                                          ?
?            ?                                           ?
?            ??CartItems                                 ?
?            ??Discounts                                 ?
?                                                         ?
?  LOCATION LAYER                                        ?
?  Provinces ? Districts ? Wards ? ShippingRates         ?
?                                                         ?
??????????????????????????????????????????????????????????
```

---

## ?? B?t ??u nhanh

### **1. Xem s? ?? ERD ??y ??**
```bash
# M? file DATABASE_ERD_DIAGRAM.md
# Xem s? ?? Mermaid v?i quan h? ??y ??
```

### **2. Tìm hi?u chi ti?t b?ng c? th?**
```bash
# M? file DATABASE_SCHEMA_DOCUMENTATION.md
# Search b?ng c?n tìm (Ctrl+F): "B?ng Users", "B?ng Products", v.v.
```

### **3. Run migration**
```bash
# Apply database schema
dotnet ef database update --project ShopWave

# Seed location data
POST /api/v1/admin/seed/location
```

### **4. Ki?m tra c?u trúc database**
```sql
-- Xem t?t c? b?ng
SELECT TABLE_NAME FROM INFORMATION_SCHEMA.TABLES
WHERE TABLE_TYPE = 'BASE TABLE'
ORDER BY TABLE_NAME;

-- Xem foreign keys c?a b?ng
SELECT 
    fk.name AS ForeignKeyName,
    tp.name AS ParentTable,
    cp.name AS ParentColumn,
    tr.name AS ReferencedTable,
    cr.name AS ReferencedColumn
FROM sys.foreign_keys fk
INNER JOIN sys.tables tp ON fk.parent_object_id = tp.object_id
INNER JOIN sys.tables tr ON fk.referenced_object_id = tr.object_id
INNER JOIN sys.foreign_key_columns fkc ON fk.object_id = fkc.constraint_object_id
INNER JOIN sys.columns cp ON fkc.parent_column_id = cp.column_id AND fkc.parent_object_id = cp.object_id
INNER JOIN sys.columns cr ON fkc.referenced_column_id = cr.column_id AND fkc.referenced_object_id = cr.object_id
WHERE tp.name = 'Products' -- Thay tên b?ng
ORDER BY tp.name, fk.name;
```

---

## ?? Ví d? use cases

### **Use Case 1: T?o s?n ph?m m?i v?i variants**
```csharp
// T?o Product
var product = new Product { 
    Name = "Áo thun Basic",
    CategoryId = categoryId,
    DisplayPrice = 150000
};

// T?o Options
var colorOption = new ProductOption { Name = "Màu s?c", DisplayType = "color_swatch" };
var sizeOption = new ProductOption { Name = "Kích th??c", DisplayType = "text_button" };

// T?o Option Values
var red = new OptionValue { Value = "??", OptionId = colorOption.Id };
var blue = new OptionValue { Value = "Xanh", OptionId = colorOption.Id };
var sizeM = new OptionValue { Value = "M", OptionId = sizeOption.Id };
var sizeL = new OptionValue { Value = "L", OptionId = sizeOption.Id };

// T?o Variants
var variantRedM = new ProductVariant { 
    ProductId = product.Id, 
    Sku = "SHIRT-RED-M", 
    Price = 150000, 
    Stock = 10 
};
// Link variant v?i option values
variantRedM.VariantValues.Add(new VariantValue { ValueId = red.Id });
variantRedM.VariantValues.Add(new VariantValue { ValueId = sizeM.Id });
```

### **Use Case 2: Checkout v?i progressive discount + voucher**
```csharp
// 1. Get cart
var cart = await _context.Carts
    .Include(c => c.CartItems)
    .Include(c => c.AppliedDiscounts)
    .FirstOrDefaultAsync(c => c.UserId == userId);

// 2. Calculate subtotal
var subTotal = cart.CartItems.Sum(ci => ci.Quantity * ci.UnitPrice);

// 3. Apply progressive discount
var tier = await _context.DiscountTiers
    .Where(t => t.IsActive && subTotal >= t.ThresholdAmount)
    .OrderByDescending(t => t.ThresholdAmount)
    .FirstOrDefaultAsync();
var progressiveDiscount = tier?.DiscountValue ?? 0;

// 4. Apply voucher
var voucherDiscount = 0m;
foreach (var applied in cart.AppliedDiscounts)
{
    var discount = applied.Discount;
    if (discount.IsActive && subTotal >= discount.MinOrderAmount)
    {
        voucherDiscount += discount.DiscountType == DiscountType.PERCENTAGE
            ? subTotal * (discount.DiscountValue / 100)
            : discount.DiscountValue;
    }
}

// 5. Create order
var order = new Order {
    UserId = userId,
    OrderNumber = await GenerateOrderNumber(),
    SubTotal = subTotal,
    ProgressiveDiscountAmount = progressiveDiscount,
    VoucherDiscountAmount = voucherDiscount,
    DiscountAmount = progressiveDiscount + voucherDiscount,
    TotalAmount = subTotal - (progressiveDiscount + voucherDiscount)
};
```

### **Use Case 3: Guest checkout**
```csharp
// Guest user v?i session ID
var sessionId = Request.Headers["X-Session-Id"].FirstOrDefault();

// T?o cart cho guest
var guestCart = new Cart {
    UserId = null, // NULL cho guest
    SessionId = sessionId
};

// T?o order cho guest
var guestOrder = new Order {
    UserId = null, // NULL cho guest
    OrderNumber = "ORD202412250001",
    ShippingFullName = "Nguy?n V?n A",
    ShippingPhone = "0123456789",
    // ... các tr??ng shipping address khác
};
```

---

## ?? FAQs

### **Q1: Làm sao ?? t?o m?t s?n ph?m có nhi?u variants?**
**A**: Xem chi ti?t ? m?c "Ví d? Use Case 1" và tài li?u `DATABASE_SCHEMA_DOCUMENTATION.md` ? Section 2 (Product Management)

### **Q2: Progressive discount và voucher khác nhau nh? th? nào?**
**A**: 
- **Progressive Discount**: T? ??ng áp d?ng theo b?c d?a trên subtotal (ví d?: mua 300k gi?m 15k)
- **Voucher**: Ng??i dùng ph?i nh?p mã (ví d?: "NOV40") ?? ???c gi?m giá

### **Q3: Database có h? tr? guest checkout không?**
**A**: Có. C?t `UserId` trong b?ng `Carts` và `Orders` có th? NULL. Guest s? d?ng `SessionId` ?? qu?n lý gi? hàng.

### **Q4: Làm sao ?? query t?t c? orders c?a m?t user?**
**A**: 
```sql
SELECT * FROM Orders WHERE UserId = 'user-guid-here' ORDER BY OrderDate DESC;
```

### **Q5: Cascade delete ho?t ??ng nh? th? nào?**
**A**: Xem chi ti?t ? `DATABASE_ERD_DIAGRAM.md` ? Section "Cascade Behaviors"

---

## ??? Tools & Resources

### **Database Tools**
- **SQL Server Management Studio (SSMS)** - Qu?n lý database
- **Azure Data Studio** - Cross-platform alternative to SSMS
- **Entity Framework Core** - ORM for .NET

### **Migration Commands**
```bash
# Create new migration
dotnet ef migrations add [MigrationName] --project ShopWave

# Apply migration
dotnet ef database update --project ShopWave

# Generate SQL script
dotnet ef migrations script --project ShopWave --output migration.sql

# Rollback to previous migration
dotnet ef database update [PreviousMigrationName] --project ShopWave

# Remove last migration (if not applied)
dotnet ef migrations remove --project ShopWave
```

### **Seeding Commands**
```bash
# Seed location data (via API)
POST https://localhost:5001/api/v1/admin/seed/location
Authorization: Bearer {admin-token}

# Seed discount tiers
POST https://localhost:5001/api/v1/admin/seed/discount-tiers
Authorization: Bearer {admin-token}
```

---

## ?? Tài li?u liên quan

### **Backend Documentation**
- `CART_DISCOUNT_GUIDE.md` - H??ng d?n gi?m giá gi? hàng
- `PROGRESSIVE_DISCOUNT_IMPLEMENTATION.md` - Chi ti?t progressive discount
- `CHECKOUT_PAYMENT_GUIDE.md` - Quy trình thanh toán
- `VNPAY_INTEGRATION_COMPLETE.md` - Tích h?p VNPay

### **Admin Documentation**
- `ADMIN_ORDERS_API.md` - API qu?n lý ??n hàng
- `ADMIN_TRANSACTIONS_API.md` - API qu?n lý giao d?ch
- `API_SEED_DOCUMENTATION.md` - H??ng d?n seed data

### **Migration Documentation**
- `MIGRATION_GUIDE.md` - H??ng d?n migration
- `HOW_TO_REFRESH_DATABASE.md` - Reset database
- `CART_MIGRATION_FIX.md` - Fix cart migration issues

---

## ?? Support

N?u có câu h?i ho?c c?n h? tr? v? database schema, vui lòng:

1. ??c k? tài li?u tr??c
2. Ki?m tra m?c FAQs
3. Xem ví d? use cases
4. Liên h? Backend Team n?u v?n ch?a rõ

---

## ?? L?ch s? c?p nh?t

| Phiên b?n | Ngày       | Thay ??i                              | Tác gi? |
|-----------|------------|---------------------------------------|---------|
| 1.0       | 2024-12-25 | T?o tài li?u database ??y tiên        | Dev Team|

---

**Phiên b?n**: 1.0  
**Ngày c?p nh?t**: 2024-12-25  
**Tác gi?**: ShopWave Development Team

---

## ?? Checklist khi join project m?i

- [ ] ??c `DATABASE_SCHEMA_DOCUMENTATION.md` ?? hi?u c?u trúc database
- [ ] Xem `DATABASE_ERD_DIAGRAM.md` ?? n?m quan h? gi?a các b?ng
- [ ] Run migration: `dotnet ef database update`
- [ ] Seed location data: `POST /api/v1/admin/seed/location`
- [ ] Ki?m tra connection string trong `appsettings.json`
- [ ] Test query vài b?ng chính: Users, Products, Orders
- [ ] ??c `MIGRATION_GUIDE.md` ?? bi?t cách t?o migration m?i

**Happy Coding! ??**
