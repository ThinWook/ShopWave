-- ? VERIFICATION QUERY - Ch?y sau khi refresh database
-- ================================================================

PRINT '=== KI?M TRA CÁC B?NG CART & DISCOUNT ===';
PRINT '';

SELECT 
    TABLE_NAME,
    (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = t.TABLE_NAME) AS ColumnCount
FROM INFORMATION_SCHEMA.TABLES t
WHERE TABLE_NAME IN ('Carts', 'CartItems', 'Discounts', 'AppliedDiscounts', 'DiscountTiers')
ORDER BY TABLE_NAME;

PRINT '';
PRINT 'Expected: 5 tables';
PRINT '- AppliedDiscounts';
PRINT '- CartItems';
PRINT '- Carts';
PRINT '- DiscountTiers';
PRINT '- Discounts';
PRINT '';

-- Ki?m tra CartItems có c?t CartId
PRINT '=== KI?M TRA CartItems ?Ã CÓ CartId ===';
SELECT 
    COLUMN_NAME,
    DATA_TYPE,
    IS_NULLABLE
FROM INFORMATION_SCHEMA.COLUMNS
WHERE TABLE_NAME = 'CartItems' AND COLUMN_NAME = 'CartId';

PRINT '';
PRINT 'Expected: CartId (uniqueidentifier, NO)';
PRINT '';

-- ??m s? b?ng
DECLARE @CartDiscountTables INT;
SELECT @CartDiscountTables = COUNT(*)
FROM INFORMATION_SCHEMA.TABLES
WHERE TABLE_NAME IN ('Carts', 'CartItems', 'Discounts', 'AppliedDiscounts', 'DiscountTiers');

IF @CartDiscountTables = 5
BEGIN
    PRINT '??? SUCCESS! All 5 tables exist! ???';
END
ELSE
BEGIN
    PRINT '? ERROR: Only ' + CAST(@CartDiscountTables AS VARCHAR) + ' tables found!';
END
