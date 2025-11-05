-- ================================================================
-- SCRIPT KI?M TRA CÁC B?NG CART & DISCOUNT ?Ã T?O THÀNH CÔNG
-- ================================================================

-- 1. Ki?m tra các b?ng ?ã t?n t?i
PRINT '=== CHECKING TABLES ===';
SELECT 
    TABLE_NAME,
    TABLE_TYPE
FROM INFORMATION_SCHEMA.TABLES 
WHERE TABLE_NAME IN ('Carts', 'CartItems', 'Discounts', 'AppliedDiscounts', 'DiscountTiers')
ORDER BY TABLE_NAME;

PRINT '';
PRINT '=== Expected Result: 5 tables ===';
PRINT 'AppliedDiscounts';
PRINT 'CartItems';
PRINT 'Carts';
PRINT 'DiscountTiers';
PRINT 'Discounts';
PRINT '';

-- 2. Ki?m tra c?u trúc b?ng Carts
PRINT '=== CARTS TABLE STRUCTURE ===';
SELECT 
    COLUMN_NAME,
    DATA_TYPE,
    IS_NULLABLE,
    CHARACTER_MAXIMUM_LENGTH,
    COLUMN_DEFAULT
FROM INFORMATION_SCHEMA.COLUMNS
WHERE TABLE_NAME = 'Carts'
ORDER BY ORDINAL_POSITION;

-- 3. Ki?m tra c?u trúc b?ng CartItems (?ã update)
PRINT '';
PRINT '=== CARTITEMS TABLE STRUCTURE (Updated with CartId) ===';
SELECT 
    COLUMN_NAME,
    DATA_TYPE,
    IS_NULLABLE,
    CHARACTER_MAXIMUM_LENGTH
FROM INFORMATION_SCHEMA.COLUMNS
WHERE TABLE_NAME = 'CartItems'
ORDER BY ORDINAL_POSITION;

-- 4. Ki?m tra c?u trúc b?ng Discounts
PRINT '';
PRINT '=== DISCOUNTS TABLE STRUCTURE ===';
SELECT 
    COLUMN_NAME,
    DATA_TYPE,
    IS_NULLABLE,
    CHARACTER_MAXIMUM_LENGTH
FROM INFORMATION_SCHEMA.COLUMNS
WHERE TABLE_NAME = 'Discounts'
ORDER BY ORDINAL_POSITION;

-- 5. Ki?m tra c?u trúc b?ng AppliedDiscounts
PRINT '';
PRINT '=== APPLIEDDISCOUNTS TABLE STRUCTURE ===';
SELECT 
    COLUMN_NAME,
    DATA_TYPE,
    IS_NULLABLE
FROM INFORMATION_SCHEMA.COLUMNS
WHERE TABLE_NAME = 'AppliedDiscounts'
ORDER BY ORDINAL_POSITION;

-- 6. Ki?m tra c?u trúc b?ng DiscountTiers
PRINT '';
PRINT '=== DISCOUNTTIERS TABLE STRUCTURE ===';
SELECT 
    COLUMN_NAME,
    DATA_TYPE,
    IS_NULLABLE,
    CHARACTER_MAXIMUM_LENGTH
FROM INFORMATION_SCHEMA.COLUMNS
WHERE TABLE_NAME = 'DiscountTiers'
ORDER BY ORDINAL_POSITION;

-- 7. Ki?m tra Foreign Keys
PRINT '';
PRINT '=== FOREIGN KEYS ===';
SELECT 
    fk.name AS ForeignKeyName,
    OBJECT_NAME(fk.parent_object_id) AS TableName,
    COL_NAME(fkc.parent_object_id, fkc.parent_column_id) AS ColumnName,
    OBJECT_NAME(fk.referenced_object_id) AS ReferencedTable,
    COL_NAME(fkc.referenced_object_id, fkc.referenced_column_id) AS ReferencedColumn
FROM sys.foreign_keys AS fk
INNER JOIN sys.foreign_key_columns AS fkc 
    ON fk.object_id = fkc.constraint_object_id
WHERE OBJECT_NAME(fk.parent_object_id) IN ('Carts', 'CartItems', 'AppliedDiscounts')
   OR OBJECT_NAME(fk.referenced_object_id) IN ('Carts', 'Discounts')
ORDER BY TableName, ForeignKeyName;

-- 8. Ki?m tra Indexes
PRINT '';
PRINT '=== INDEXES ===';
SELECT 
    t.name AS TableName,
    i.name AS IndexName,
    COL_NAME(ic.object_id, ic.column_id) AS ColumnName,
    i.is_unique AS IsUnique,
    i.is_primary_key AS IsPrimaryKey
FROM sys.indexes AS i
INNER JOIN sys.index_columns AS ic 
    ON i.object_id = ic.object_id AND i.index_id = ic.index_id
INNER JOIN sys.tables AS t
    ON i.object_id = t.object_id
WHERE t.name IN ('Carts', 'Discounts', 'AppliedDiscounts', 'DiscountTiers')
ORDER BY TableName, IndexName, ic.index_column_id;

-- 9. ??m s? record trong m?i b?ng
PRINT '';
PRINT '=== ROW COUNTS ===';
SELECT 'Carts' AS TableName, COUNT(*) AS RowCount FROM Carts
UNION ALL
SELECT 'CartItems', COUNT(*) FROM CartItems
UNION ALL
SELECT 'Discounts', COUNT(*) FROM Discounts
UNION ALL
SELECT 'AppliedDiscounts', COUNT(*) FROM AppliedDiscounts
UNION ALL
SELECT 'DiscountTiers', COUNT(*) FROM DiscountTiers;

PRINT '';
PRINT '=== ? MIGRATION VERIFICATION COMPLETE ===';
