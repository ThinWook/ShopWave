-- ========================================
-- QUICK VERIFICATION: Order Structure Fix
-- Run this after migration to confirm changes
-- ========================================

USE [ShopWaveDb];
GO

PRINT '? VERIFICATION SCRIPT';
PRINT '====================';
PRINT '';

-- 1. Check OrderItems structure
PRINT '1?? OrderItems Table Structure:';
PRINT '----------------------------';
SELECT 
    COLUMN_NAME as 'Column',
    DATA_TYPE as 'Type',
    CHARACTER_MAXIMUM_LENGTH as 'MaxLength',
    IS_NULLABLE as 'Nullable'
FROM INFORMATION_SCHEMA.COLUMNS
WHERE TABLE_NAME = 'OrderItems'
ORDER BY ORDINAL_POSITION;
PRINT '';

-- Verify ProductId is removed
IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('OrderItems') AND name = 'ProductId')
    PRINT '? ProductId successfully removed from OrderItems';
ELSE
    PRINT '? ERROR: ProductId still exists in OrderItems';
PRINT '';

-- 2. Check Orders address fields
PRINT '2?? Orders - Shipping Address Fields:';
PRINT '-----------------------------------';
SELECT 
    COLUMN_NAME as 'Column',
    DATA_TYPE as 'Type',
    CHARACTER_MAXIMUM_LENGTH as 'MaxLength',
    IS_NULLABLE as 'Nullable'
FROM INFORMATION_SCHEMA.COLUMNS
WHERE TABLE_NAME = 'Orders'
  AND COLUMN_NAME LIKE 'Shipping%'
ORDER BY ORDINAL_POSITION;
PRINT '';

PRINT '3?? Orders - Billing Address Fields:';
PRINT '----------------------------------';
SELECT 
    COLUMN_NAME as 'Column',
    DATA_TYPE as 'Type',
    CHARACTER_MAXIMUM_LENGTH as 'MaxLength',
    IS_NULLABLE as 'Nullable'
FROM INFORMATION_SCHEMA.COLUMNS
WHERE TABLE_NAME = 'Orders'
  AND COLUMN_NAME LIKE 'Billing%'
ORDER BY ORDINAL_POSITION;
PRINT '';

-- Verify old fields are removed
IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('Orders') AND name = 'ShippingAddress' AND system_type_id = 231)
    PRINT '? Old ShippingAddress (JSON) field removed';
ELSE
    PRINT '? ERROR: Old ShippingAddress field still exists';

IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('Orders') AND name = 'BillingAddress' AND system_type_id = 231)
    PRINT '? Old BillingAddress (JSON) field removed';
ELSE
    PRINT '? ERROR: Old BillingAddress field still exists';
PRINT '';

-- 4. Check foreign keys
PRINT '4?? Foreign Key Relationships:';
PRINT '---------------------------';
SELECT 
    fk.name as 'FK Name',
    OBJECT_NAME(fk.parent_object_id) as 'From Table',
    COL_NAME(fkc.parent_object_id, fkc.parent_column_id) as 'From Column',
    OBJECT_NAME(fk.referenced_object_id) as 'To Table',
    COL_NAME(fkc.referenced_object_id, fkc.referenced_column_id) as 'To Column'
FROM sys.foreign_keys fk
INNER JOIN sys.foreign_key_columns fkc ON fk.object_id = fkc.constraint_object_id
WHERE fk.parent_object_id = OBJECT_ID('OrderItems')
ORDER BY fk.name;
PRINT '';

-- 5. Sample query to show new capabilities
PRINT '5?? NEW CAPABILITY: Query Orders by Location';
PRINT '-----------------------------------------';
PRINT 'Example queries now possible:';
PRINT '';
PRINT '-- Find orders by province:';
PRINT 'SELECT OrderNumber, ShippingFullName, ShippingProvince, TotalAmount';
PRINT 'FROM Orders';
PRINT 'WHERE ShippingProvince = ''TP. H? Chí Minh'';';
PRINT '';
PRINT '-- Count orders by district:';
PRINT 'SELECT ShippingDistrict, COUNT(*) as OrderCount';
PRINT 'FROM Orders';
PRINT 'GROUP BY ShippingDistrict';
PRINT 'ORDER BY OrderCount DESC;';
PRINT '';

-- 6. Show existing orders (if any)
DECLARE @orderCount INT;
SELECT @orderCount = COUNT(*) FROM Orders;

IF @orderCount > 0
BEGIN
    PRINT '6?? Existing Orders in Database:';
    PRINT '-----------------------------';
    PRINT CONCAT('Total orders: ', @orderCount);
    PRINT '';
    SELECT TOP 5
        OrderNumber,
        ShippingFullName,
        CONCAT(ShippingStreet, ', ', ShippingWard, ', ', ShippingDistrict) as 'Shipping Address',
        ShippingProvince,
        TotalAmount,
        Status,
        FORMAT(OrderDate, 'dd/MM/yyyy HH:mm') as 'Order Date'
    FROM Orders
    ORDER BY OrderDate DESC;
END
ELSE
BEGIN
    PRINT '6?? No orders in database yet';
    PRINT '-------------------------';
    PRINT 'Create a test order via API to verify the new structure works.';
END
PRINT '';

PRINT '====================';
PRINT '? VERIFICATION COMPLETE';
PRINT '';
PRINT 'Next Steps:';
PRINT '1. Create a test order via POST /api/v1/orders';
PRINT '2. Verify address fields are saved correctly';
PRINT '3. Retrieve order via GET /api/v1/orders/{id}';
PRINT '4. Test location-based queries';
