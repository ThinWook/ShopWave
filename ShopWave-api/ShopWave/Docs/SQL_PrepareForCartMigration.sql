-- ===================================================================
-- Script ?? chu?n b? database tr??c khi apply Cart & Discount migration
-- ===================================================================

-- OPTION 1: XÓA D? LI?U C? (Khuy?n ngh? cho Development)
-- ===================================================================
-- Backup d? li?u c? n?u c?n
SELECT * INTO CartItems_Backup_20251104 FROM CartItems;

-- Xóa t?t c? CartItems
DELETE FROM CartItems;

-- Sau khi ch?y script này, apply migration:
-- dotnet ef database update


-- ===================================================================
-- OPTION 2: MIGRATE D? LI?U C? (N?u c?n gi? d? li?u)
-- ===================================================================
/*
BEGIN TRANSACTION;

-- B??c 1: Thêm c?t CartId n?u ch?a có
IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[CartItems]') AND name = 'CartId')
BEGIN
    ALTER TABLE CartItems ADD CartId uniqueidentifier NULL;
END

-- B??c 2: T?o Cart cho m?i User
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

-- B??c 3: C?p nh?t CartId cho CartItems
UPDATE ci
SET ci.CartId = (
    SELECT TOP 1 c.Id 
    FROM Carts c 
    WHERE c.UserId = ci.UserId
    ORDER BY c.CreatedAt DESC
)
FROM CartItems ci
WHERE ci.CartId IS NULL 
   OR ci.CartId = '00000000-0000-0000-0000-000000000000';

-- B??c 4: Ki?m tra d? li?u
SELECT 
    'Carts Created' as Status,
    COUNT(*) as Count
FROM Carts
UNION ALL
SELECT 
    'CartItems Total' as Status,
    COUNT(*) as Count
FROM CartItems
UNION ALL
SELECT 
    'CartItems WITHOUT Cart' as Status,
    COUNT(*) as Count
FROM CartItems ci
LEFT JOIN Carts c ON ci.CartId = c.Id
WHERE c.Id IS NULL;

-- N?u "CartItems WITHOUT Cart" = 0, COMMIT
-- N?u không, ROLLBACK và ki?m tra l?i

-- Xác nh?n không có CartItem nào thi?u Cart
DECLARE @ItemsWithoutCart INT;
SELECT @ItemsWithoutCart = COUNT(*)
FROM CartItems ci
LEFT JOIN Carts c ON ci.CartId = c.Id
WHERE c.Id IS NULL;

IF @ItemsWithoutCart = 0
BEGIN
    PRINT 'Data migration successful! Committing...';
    COMMIT TRANSACTION;
END
ELSE
BEGIN
    PRINT 'ERROR: Some CartItems do not have valid Carts. Rolling back...';
    ROLLBACK TRANSACTION;
END
*/


-- ===================================================================
-- SAU KHI CH?Y SCRIPT, APPLY MIGRATION
-- ===================================================================
-- cd C:\Users\HasHisShuU\source\repos\ShopWave\ShopWave-api\ShopWave
-- dotnet ef database update


-- ===================================================================
-- KI?M TRA SAU KHI APPLY MIGRATION
-- ===================================================================
/*
-- Ki?m tra các b?ng ?ã ???c t?o
SELECT TABLE_NAME 
FROM INFORMATION_SCHEMA.TABLES 
WHERE TABLE_NAME IN ('Carts', 'Discounts', 'AppliedDiscounts', 'DiscountTiers')
ORDER BY TABLE_NAME;

-- Ki?m tra c?u trúc b?ng Carts
SELECT 
    COLUMN_NAME,
    DATA_TYPE,
    IS_NULLABLE,
    CHARACTER_MAXIMUM_LENGTH
FROM INFORMATION_SCHEMA.COLUMNS
WHERE TABLE_NAME = 'Carts'
ORDER BY ORDINAL_POSITION;

-- Ki?m tra foreign keys
SELECT 
    fk.name AS ForeignKey,
    OBJECT_NAME(fk.parent_object_id) AS TableName,
    COL_NAME(fkc.parent_object_id, fkc.parent_column_id) AS ColumnName,
    OBJECT_NAME(fk.referenced_object_id) AS ReferencedTable,
    COL_NAME(fkc.referenced_object_id, fkc.referenced_column_id) AS ReferencedColumn
FROM sys.foreign_keys AS fk
INNER JOIN sys.foreign_key_columns AS fkc 
    ON fk.object_id = fkc.constraint_object_id
WHERE OBJECT_NAME(fk.parent_object_id) IN ('Carts', 'CartItems', 'AppliedDiscounts')
ORDER BY TableName, ForeignKey;

-- Ki?m tra indexes
SELECT 
    i.name AS IndexName,
    OBJECT_NAME(i.object_id) AS TableName,
    COL_NAME(ic.object_id, ic.column_id) AS ColumnName,
    i.is_unique
FROM sys.indexes AS i
INNER JOIN sys.index_columns AS ic 
    ON i.object_id = ic.object_id AND i.index_id = ic.index_id
WHERE OBJECT_NAME(i.object_id) IN ('Carts', 'Discounts', 'AppliedDiscounts')
ORDER BY TableName, IndexName;
*/
