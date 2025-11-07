-- ========================================
-- DATABASE STRUCTURE FIX: Orders & OrderItems
-- Fixes two critical design issues
-- ========================================

USE [ShopWaveDb];
GO

PRINT '========================================';
PRINT 'Database Structure Fix Summary';
PRINT '========================================';
PRINT '';
PRINT '?? CHANGES OVERVIEW:';
PRINT '1. Remove redundant ProductId from OrderItems table';
PRINT '2. Replace JSON address strings with structured fields in Orders table';
PRINT '';
PRINT '??  IMPORTANT: This migration will be applied automatically via:';
PRINT '   dotnet ef database update';
PRINT '';
PRINT 'Run this verification script AFTER migration to confirm changes.';
PRINT '========================================';
PRINT '';

-- ========================================
-- VERIFICATION QUERIES
-- ========================================

PRINT '?? 1. Checking OrderItems structure...';
IF EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('OrderItems') AND name = 'ProductId')
BEGIN
    PRINT '? ProductId column still exists in OrderItems (migration not applied yet)';
END
ELSE
BEGIN
    PRINT '? ProductId removed from OrderItems (migration applied)';
END
PRINT '';

PRINT '?? 2. Checking Orders structure...';
IF EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('Orders') AND name = 'ShippingAddress' AND system_type_id = 231) -- nvarchar(max)
BEGIN
    PRINT '? ShippingAddress is still JSON string (migration not applied yet)';
END
ELSE IF EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('Orders') AND name = 'ShippingFullName')
BEGIN
    PRINT '? Structured address fields exist (migration applied)';
    
    SELECT 
        COLUMN_NAME,
        DATA_TYPE,
        CHARACTER_MAXIMUM_LENGTH,
        IS_NULLABLE
    FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_NAME = 'Orders'
      AND COLUMN_NAME LIKE 'Shipping%'
    ORDER BY ORDINAL_POSITION;
    
    PRINT '';
    PRINT 'Billing Address Fields:';
    SELECT 
        COLUMN_NAME,
        DATA_TYPE,
        CHARACTER_MAXIMUM_LENGTH,
        IS_NULLABLE
    FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_NAME = 'Orders'
      AND COLUMN_NAME LIKE 'Billing%'
    ORDER BY ORDINAL_POSITION;
END
ELSE
BEGIN
    PRINT '??  Unknown state - please check manually';
END
PRINT '';

PRINT '========================================';
PRINT '?? MIGRATION DETAILS';
PRINT '========================================';
PRINT '';
PRINT '## Issue 1: Redundant ProductId in OrderItems';
PRINT '? OLD: OrderItems had both ProductId and ProductVariantId';
PRINT '? NEW: OrderItems only has ProductVariantId';
PRINT '   ? ProductId can be obtained via ProductVariant.ProductId';
PRINT '';
PRINT '## Issue 2: Unstructured Address Fields in Orders';
PRINT '? OLD: ShippingAddress and BillingAddress were JSON strings';
PRINT '? NEW: Structured fields for better querying and integrations:';
PRINT '   - ShippingFullName (nvarchar(100), required)';
PRINT '   - ShippingPhone (nvarchar(20), required)';
PRINT '   - ShippingStreet (nvarchar(500), required)';
PRINT '   - ShippingWard (nvarchar(100), required)';
PRINT '   - ShippingDistrict (nvarchar(100), required)';
PRINT '   - ShippingProvince (nvarchar(100), required)';
PRINT '   - ShippingNotes (nvarchar(500), optional)';
PRINT '';
PRINT '   (Same pattern for Billing* fields, all optional)';
PRINT '';
PRINT '========================================';
PRINT '?? BENEFITS';
PRINT '========================================';
PRINT '';
PRINT '1. Better Data Integrity:';
PRINT '   - No duplicate foreign keys';
PRINT '   - Clear single source of truth for product reference';
PRINT '';
PRINT '2. Improved Queryability:';
PRINT '   - Can filter orders by province/district/ward';
PRINT '   - Example: SELECT * FROM Orders WHERE ShippingProvince = ''TP. H? Chí Minh''';
PRINT '';
PRINT '3. Easier Integration:';
PRINT '   - Shipping APIs (Giao Hàng Nhanh, Viettel Post) expect structured data';
PRINT '   - No need to parse JSON strings';
PRINT '';
PRINT '4. Better Performance:';
PRINT '   - Can create indexes on address fields if needed';
PRINT '   - Faster filtering and sorting';
PRINT '';

PRINT '========================================';
PRINT '?? MIGRATION COMMANDS';
PRINT '========================================';
PRINT '';
PRINT 'To apply this migration:';
PRINT '  cd ShopWave-api/ShopWave';
PRINT '  dotnet ef database update';
PRINT '';
PRINT 'To rollback (if needed):';
PRINT '  dotnet ef database update <PreviousMigrationName>';
PRINT '';
PRINT 'To remove migration (before applying):';
PRINT '  dotnet ef migrations remove';
PRINT '';

PRINT '========================================';
PRINT '? VERIFICATION COMPLETE';
PRINT '========================================';
PRINT '';
PRINT 'Next steps after migration:';
PRINT '1. Test order creation via POST /api/v1/orders';
PRINT '2. Verify address fields are properly saved';
PRINT '3. Test order retrieval via GET /api/v1/orders/{id}';
PRINT '4. Confirm OrderItems only references ProductVariantId';
PRINT '';
