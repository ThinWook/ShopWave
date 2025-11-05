# ?? H??ng D?n Refresh Database ?? Th?y B?ng M?i

## V?n ??
Migration ?ã ch?y thành công nh?ng b?n không th?y các b?ng m?i trong database explorer.

## ? Gi?i pháp

### 1. SQL Server Management Studio (SSMS)

**Cách 1: Refresh Object Explorer**
1. Trong Object Explorer, tìm ??n database `ShopWaveDB`
2. Click ph?i vào database name
3. Ch?n **Refresh** (ho?c nh?n F5)
4. M? r?ng: `ShopWaveDB` ? `Tables` ? `dbo`
5. B?n s? th?y các b?ng m?i:
   - `dbo.Carts`
   - `dbo.Discounts`
   - `dbo.AppliedDiscounts`
   - `dbo.DiscountTiers`

**Cách 2: Reconnect**
1. Click ph?i vào Server connection
2. Ch?n **Disconnect**
3. Click ph?i l?i ? **Connect**

### 2. Azure Data Studio

**Cách 1: Refresh**
1. Click ph?i vào database `ShopWaveDB`
2. Ch?n **Refresh**
3. M? r?ng: `Tables` ? Xem các b?ng m?i

**Cách 2: Reload Connection**
1. Click vào icon ? (Reload)
2. Ho?c disconnect và connect l?i

### 3. Visual Studio Server Explorer

1. Trong Server Explorer panel
2. Click ph?i vào Data Connections ? Your Connection
3. Ch?n **Refresh**
4. M? r?ng `Tables`

### 4. DBeaver / DataGrip

1. Click ph?i vào database connection
2. Ch?n **Refresh** ho?c nh?n F5
3. M? r?ng schema ? Tables

## ?? Verify B?ng SQL Query

N?u v?n không th?y, ch?y query này ?? verify b?ng ?ã t?n t?i:

```sql
-- Ki?m tra các b?ng m?i
SELECT TABLE_NAME 
FROM INFORMATION_SCHEMA.TABLES 
WHERE TABLE_NAME IN ('Carts', 'Discounts', 'AppliedDiscounts', 'DiscountTiers')
ORDER BY TABLE_NAME;
```

**Expected Output:**
```
TABLE_NAME
-----------------
AppliedDiscounts
Carts
DiscountTiers
Discounts
```

## ?? N?u V?n Không Th?y

### Option 1: Ch?y Full Verification Script
M? file `SQL_VerifyCartTables.sql` và ch?y toàn b? script ?? ki?m tra chi ti?t.

### Option 2: Ki?m tra k?t n?i ?úng database
```sql
-- Ki?m tra b?n ?ang k?t n?i ??n database nào
SELECT DB_NAME() AS CurrentDatabase;
```

??m b?o output là `ShopWaveDB` (ho?c tên database b?n ?ang dùng).

### Option 3: Ki?m tra connection string
M? file `appsettings.json` ho?c `appsettings.Development.json`:
```json
{
  "ConnectionStrings": {
    "ShopWaveConnection": "Server=...;Database=ShopWaveDB;..."
  }
}
```

??m b?o tên database kh?p v?i database b?n ?ang xem.

## ?? Ki?m Tra C?u Trúc B?ng

### Carts Table
```sql
SELECT COLUMN_NAME, DATA_TYPE, IS_NULLABLE
FROM INFORMATION_SCHEMA.COLUMNS
WHERE TABLE_NAME = 'Carts'
ORDER BY ORDINAL_POSITION;
```

Expected columns:
- Id (uniqueidentifier, NOT NULL)
- UserId (uniqueidentifier, NULL)
- SessionId (nvarchar(100), NULL)
- CreatedAt (datetime2, NOT NULL)
- UpdatedAt (datetime2, NOT NULL)

### CartItems Table (Updated)
```sql
SELECT COLUMN_NAME, DATA_TYPE, IS_NULLABLE
FROM INFORMATION_SCHEMA.COLUMNS
WHERE TABLE_NAME = 'CartItems'
ORDER BY ORDINAL_POSITION;
```

Should now include:
- **CartId** (uniqueidentifier, NOT NULL) ? NEW!

### Discounts Table
```sql
SELECT COLUMN_NAME, DATA_TYPE, IS_NULLABLE
FROM INFORMATION_SCHEMA.COLUMNS
WHERE TABLE_NAME = 'Discounts'
ORDER BY ORDINAL_POSITION;
```

### AppliedDiscounts Table
```sql
SELECT COLUMN_NAME, DATA_TYPE, IS_NULLABLE
FROM INFORMATION_SCHEMA.COLUMNS
WHERE TABLE_NAME = 'AppliedDiscounts'
ORDER BY ORDINAL_POSITION;
```

### DiscountTiers Table
```sql
SELECT COLUMN_NAME, DATA_TYPE, IS_NULLABLE
FROM INFORMATION_SCHEMA.COLUMNS
WHERE TABLE_NAME = 'DiscountTiers'
ORDER BY ORDINAL_POSITION;
```

## ? Checklist

- [ ] Migration ?ã ch?y thành công (no "Pending")
- [ ] Refresh database connection trong SQL tool
- [ ] Ch?y verification query th?y 4 b?ng m?i
- [ ] CartItems có thêm c?t CartId
- [ ] Foreign keys ?ã ???c t?o ?úng
- [ ] Indexes ?ã ???c t?o (Code unique, SessionId indexed)

## ?? K?t Qu?

Sau khi refresh, b?n s? th?y:

```
Tables/
??? dbo.AppliedDiscounts     ? NEW
??? dbo.CartItems            ? UPDATED (có CartId)
??? dbo.Carts                ? NEW
??? dbo.Categories
??? dbo.DiscountTiers        ? NEW
??? dbo.Discounts            ? NEW
??? dbo.Media
??? dbo.Notifications
??? dbo.OptionValues
??? dbo.OrderItems
??? dbo.Orders
??? dbo.ProductMedia
??? dbo.ProductOptions
??? dbo.Products
??? dbo.ProductVariants
??? dbo.UserMedia
??? dbo.Users
??? dbo.UserSessions
??? dbo.UserSettings
??? dbo.VariantValues
```

## ?? Support

N?u v?n g?p v?n ??, ki?m tra:
1. Connection string trong `appsettings.json`
2. Migration history: `SELECT * FROM __EFMigrationsHistory`
3. Logs trong Output window c?a Visual Studio
