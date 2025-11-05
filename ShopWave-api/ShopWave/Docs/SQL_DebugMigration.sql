-- ================================================================
-- DEBUG SCRIPT: Tìm hi?u t?i sao không th?y b?ng m?i
-- ================================================================

PRINT '=== 1. KI?M TRA DATABASE HI?N T?I ===';
SELECT DB_NAME() AS CurrentDatabase;
PRINT 'Expected: ShopWaveDB';
PRINT '';

PRINT '=== 2. KI?M TRA MIGRATION HISTORY ===';
SELECT 
    MigrationId, 
    ProductVersion
FROM __EFMigrationsHistory
ORDER BY MigrationId DESC;
PRINT 'Expected: 20251104122412_AddCartDiscountTablesWithDataMigration should be in the list';
PRINT '';

PRINT '=== 3. TÌM T?T C? B?NG LIÊN QUAN ??N CART VÀ DISCOUNT ===';
SELECT 
    TABLE_NAME,
    TABLE_TYPE
FROM INFORMATION_SCHEMA.TABLES
WHERE TABLE_NAME LIKE '%Cart%' 
   OR TABLE_NAME LIKE '%Discount%'
ORDER BY TABLE_NAME;
PRINT 'Expected: Carts, CartItems, Discounts, AppliedDiscounts, DiscountTiers';
PRINT '';

PRINT '=== 4. T?T C? CÁC B?NG TRONG DATABASE ===';
SELECT 
    TABLE_NAME
FROM INFORMATION_SCHEMA.TABLES
WHERE TABLE_TYPE = 'BASE TABLE'
ORDER BY TABLE_NAME;
PRINT '';

PRINT '=== 5. KI?M TRA C?T CartId TRONG CartItems ===';
SELECT 
    COLUMN_NAME,
    DATA_TYPE,
    IS_NULLABLE
FROM INFORMATION_SCHEMA.COLUMNS
WHERE TABLE_NAME = 'CartItems'
ORDER BY ORDINAL_POSITION;
PRINT 'Expected: CartId column should exist';
PRINT '';

PRINT '=== 6. CONNECTION INFO ===';
SELECT 
    @@SERVERNAME AS ServerName,
    DB_NAME() AS DatabaseName,
    SUSER_NAME() AS CurrentUser;
