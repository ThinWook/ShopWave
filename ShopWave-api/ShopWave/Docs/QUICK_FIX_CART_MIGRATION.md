## H??ng d?n x? lý l?i Migration Cart & Discount

### V?n ??
Migration không th? apply vì `CartItems` ?ã có d? li?u v?i `CartId` m?c ??nh nh?ng ch?a có b?ng `Carts`.

### Gi?i pháp nhanh (Development Environment)

#### B??c 1: Xóa d? li?u CartItems c?

M? SQL Server Management Studio ho?c Azure Data Studio và k?t n?i ??n database `ShopWaveDB`, sau ?ó ch?y:

```sql
-- Xóa t?t c? CartItems c?
DELETE FROM CartItems;
```

Ho?c dùng command line:

```powershell
# Dùng sqlcmd (n?u có)
sqlcmd -S your_server_name -d ShopWaveDB -Q "DELETE FROM CartItems;"
```

#### B??c 2: Apply migration

```bash
cd C:\Users\HasHisShuU\source\repos\ShopWave\ShopWave-api\ShopWave
dotnet ef database update
```

#### B??c 3: Ki?m tra k?t qu?

```sql
-- Ki?m tra các b?ng m?i
SELECT TABLE_NAME 
FROM INFORMATION_SCHEMA.TABLES 
WHERE TABLE_NAME IN ('Carts', 'Discounts', 'AppliedDiscounts', 'DiscountTiers')
ORDER BY TABLE_NAME;
```

Expected output:
```
TABLE_NAME
-----------------
AppliedDiscounts
Carts
DiscountTiers
Discounts
```

### N?u c?n gi? d? li?u c?

Xem chi ti?t trong file: `SQL_PrepareForCartMigration.sql` (Option 2)

### Troubleshooting

#### L?i: "Build failed"
??m b?o server không ?ang ch?y ho?c dùng `--no-build`:
```bash
dotnet ef database update --no-build
```

#### L?i: "Migration still pending"
Ki?m tra danh sách migrations:
```bash
dotnet ef migrations list
```

#### Xóa migration và t?o l?i
```bash
# Remove migration
dotnet ef migrations remove

# Create new migration
dotnet ef migrations add AddCartDiscountTables --no-build

# Apply it
dotnet ef database update --no-build
```

### Sau khi hoàn t?t

B?n s? có 4 b?ng m?i:
- ? `Carts` - Gi? hàng
- ? `Discounts` - Mã gi?m giá  
- ? `AppliedDiscounts` - Voucher ?ã áp d?ng
- ? `DiscountTiers` - B?c gi?m giá

Và `CartItems` s? có thêm c?t `CartId` v?i foreign key ??n `Carts`.
