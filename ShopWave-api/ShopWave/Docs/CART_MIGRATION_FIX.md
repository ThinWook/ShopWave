# Script ?? x? lý migration d? li?u Cart

## V?n ??
Migration không th? apply vì b?ng `CartItems` ?ã có d? li?u v?i `CartId` m?c ??nh (00000000-0000-0000-0000-000000000000), 
nh?ng không có Cart nào t??ng ?ng trong b?ng `Carts`.

## Gi?i pháp

### Option 1: Xóa d? li?u CartItems c? (Khuy?n ngh? cho Development)

Ch?y SQL này tr??c khi apply migration:

```sql
-- Xóa t?t c? CartItems c?
DELETE FROM CartItems;
```

Sau ?ó apply migration:
```bash
cd C:\Users\HasHisShuU\source\repos\ShopWave\ShopWave-api\ShopWave
dotnet ef database update
```

### Option 2: Migrate d? li?u c? sang c?u trúc m?i

#### B??c 1: T?m th?i drop constraint
```sql
-- Drop foreign key constraint t?m th?i
IF EXISTS (SELECT * FROM sys.foreign_keys WHERE name = 'FK_CartItems_Carts_CartId')
BEGIN
    ALTER TABLE CartItems DROP CONSTRAINT FK_CartItems_Carts_CartId;
END
```

#### B??c 2: T?o Cart cho m?i User có CartItems
```sql
-- T?o Cart cho m?i user
INSERT INTO Carts (Id, UserId, SessionId, CreatedAt, UpdatedAt)
SELECT 
    NEWID() as Id,
    UserId,
    NULL as SessionId,
    MIN(CreatedAt) as CreatedAt,
    GETUTCDATE() as UpdatedAt
FROM CartItems
WHERE CartId = '00000000-0000-0000-0000-000000000000'
GROUP BY UserId;

-- Update CartItems v?i Cart m?i t?o
UPDATE ci
SET ci.CartId = c.Id
FROM CartItems ci
INNER JOIN Carts c ON ci.UserId = c.UserId
WHERE ci.CartId = '00000000-0000-0000-0000-000000000000';
```

#### B??c 3: Apply migration
```bash
cd C:\Users\HasHisShuU\source\repos\ShopWave\ShopWave-api\ShopWave
dotnet ef database update
```

### Option 3: Rollback và t?o migration m?i v?i data migration

#### B??c 1: Remove migration hi?n t?i
```bash
cd C:\Users\HasHisShuU\source\repos\ShopWave\ShopWave-api\ShopWave
dotnet ef migrations remove
```

#### B??c 2: T?o migration m?i
S? c?n ch?nh s?a migration file ?? thêm data migration logic.

## Khuy?n ngh?

N?u ?ây là môi tr??ng **development** và không có d? li?u quan tr?ng:
- **Dùng Option 1** - Xóa d? li?u c? và apply migration s?ch

N?u có d? li?u c?n gi? l?i:
- **Dùng Option 2** - Migrate d? li?u sang c?u trúc m?i

## L?nh SQL ??y ?? cho Option 1

```sql
-- Backup d? li?u n?u c?n (optional)
SELECT * INTO CartItems_Backup FROM CartItems;

-- Xóa t?t c? CartItems
DELETE FROM CartItems;

-- Sau ?ó ch?y migration
```

## L?nh SQL ??y ?? cho Option 2

```sql
BEGIN TRANSACTION;

-- 1. T?o Cart cho m?i User
INSERT INTO Carts (Id, UserId, SessionId, CreatedAt, UpdatedAt)
SELECT 
    NEWID() as Id,
    ci.UserId,
    NULL as SessionId,
    MIN(ci.CreatedAt) as CreatedAt,
    GETUTCDATE() as UpdatedAt
FROM CartItems ci
WHERE NOT EXISTS (SELECT 1 FROM Carts c WHERE c.UserId = ci.UserId)
GROUP BY ci.UserId;

-- 2. Update CartItems v?i CartId m?i
UPDATE ci
SET ci.CartId = (
    SELECT TOP 1 c.Id 
    FROM Carts c 
    WHERE c.UserId = ci.UserId
)
FROM CartItems ci
WHERE ci.CartId = '00000000-0000-0000-0000-000000000000' 
   OR ci.CartId IS NULL;

-- 3. Ki?m tra
SELECT COUNT(*) as TotalCarts FROM Carts;
SELECT COUNT(*) as TotalCartItems FROM CartItems;
SELECT COUNT(*) as CartItemsWithoutCart 
FROM CartItems ci
LEFT JOIN Carts c ON ci.CartId = c.Id
WHERE c.Id IS NULL;

-- N?u CartItemsWithoutCart = 0, commit
COMMIT;
-- N?u có l?i, rollback
-- ROLLBACK;
```

## Sau khi x? lý xong

Ch?y migration:
```bash
cd C:\Users\HasHisShuU\source\repos\ShopWave\ShopWave-api\ShopWave
dotnet ef database update
```

Ki?m tra b?ng ?ã t?o:
```sql
SELECT TABLE_NAME 
FROM INFORMATION_SCHEMA.TABLES 
WHERE TABLE_NAME IN ('Carts', 'Discounts', 'AppliedDiscounts', 'DiscountTiers')
ORDER BY TABLE_NAME;
```
