-- ========================================
-- Quick Verification: Check DiscountTiers Table
-- ========================================

-- Check if DiscountTiers table exists
IF OBJECT_ID('DiscountTiers', 'U') IS NOT NULL
BEGIN
    PRINT '? DiscountTiers table exists'
    
    -- Check if there are any active tiers
    DECLARE @tierCount INT
    SELECT @tierCount = COUNT(*) FROM DiscountTiers WHERE IsActive = 1
    
    IF @tierCount > 0
    BEGIN
        PRINT '? Active discount tiers found: ' + CAST(@tierCount AS NVARCHAR(10))
        PRINT ''
        PRINT 'Current Active Tiers:'
        PRINT '--------------------'
        
        SELECT 
            Id,
            ThresholdAmount as 'Ng??ng (VND)',
            DiscountValue as 'Gi?m giá (VND)',
            IsActive as 'Ho?t ??ng',
            Description as 'Mô t?',
            FORMAT(CreatedAt, 'dd/MM/yyyy HH:mm') as 'Ngày t?o'
        FROM DiscountTiers
        WHERE IsActive = 1
        ORDER BY ThresholdAmount ASC;
    END
    ELSE
    BEGIN
        PRINT '? No active discount tiers found!'
        PRINT ''
        PRINT 'SOLUTION: Run the SQL_ProgressiveDiscountSetup.sql script to insert sample tiers'
        PRINT ''
        
        -- Show what would be inserted
        PRINT 'Suggested Tiers to Insert:'
        PRINT '-------------------------'
        SELECT 
            599000 as 'ThresholdAmount',
            40000 as 'DiscountValue',
            N'Gi?m 40.000? cho ??n hàng t? 599.000?' as 'Description'
        UNION ALL
        SELECT 999000, 70000, N'Gi?m 70.000? cho ??n hàng t? 999.000?'
        UNION ALL
        SELECT 1999000, 150000, N'Gi?m 150.000? cho ??n hàng t? 1.999.000?'
        UNION ALL
        SELECT 2999000, 250000, N'Gi?m 250.000? cho ??n hàng t? 2.999.000?';
    END
END
ELSE
BEGIN
    PRINT '? DiscountTiers table does NOT exist!'
    PRINT ''
    PRINT 'ERROR: Table missing. This suggests:'
    PRINT '1. Migrations have not been run'
    PRINT '2. Database is using an old schema'
    PRINT ''
    PRINT 'SOLUTION: Run migrations or recreate the database'
    PRINT 'Command: dotnet ef database update'
END

PRINT ''
PRINT '========================================';

-- Test progressive discount calculation logic with sample subtotal
DECLARE @TestSubTotal DECIMAL(18,2) = 648000; -- Your cart subtotal

PRINT 'Test Calculation for SubTotal: ' + FORMAT(@TestSubTotal, 'N0', 'vi-VN') + ' VND';
PRINT '--------------------';

IF OBJECT_ID('DiscountTiers', 'U') IS NOT NULL
BEGIN
    DECLARE @CurrentDiscount DECIMAL(18,2) = 0;
    DECLARE @NextThreshold DECIMAL(18,2) = NULL;
    DECLARE @NextDiscount DECIMAL(18,2) = NULL;
    DECLARE @AmountToNext DECIMAL(18,2) = NULL;

    -- Find current tier
    SELECT TOP 1 @CurrentDiscount = DiscountValue
    FROM DiscountTiers
    WHERE IsActive = 1 AND @TestSubTotal >= ThresholdAmount
    ORDER BY ThresholdAmount DESC;

    -- Find next tier
    SELECT TOP 1 
        @NextThreshold = ThresholdAmount,
        @NextDiscount = DiscountValue,
        @AmountToNext = ThresholdAmount - @TestSubTotal
    FROM DiscountTiers
    WHERE IsActive = 1 AND @TestSubTotal < ThresholdAmount
    ORDER BY ThresholdAmount ASC;

    -- Display results
    PRINT 'Expected API Response:';
    PRINT '{';
    PRINT '  "currentDiscountValue": ' + ISNULL(CAST(@CurrentDiscount AS NVARCHAR(20)), 'null');
    PRINT '  "nextDiscountThreshold": ' + ISNULL(CAST(@NextThreshold AS NVARCHAR(20)), 'null');
    PRINT '  "nextDiscountValue": ' + ISNULL(CAST(@NextDiscount AS NVARCHAR(20)), 'null');
    PRINT '  "amountToNext": ' + ISNULL(CAST(@AmountToNext AS NVARCHAR(20)), 'null');
    PRINT '}';
    
    IF @CurrentDiscount = 0 AND @NextThreshold IS NULL
    BEGIN
        PRINT '';
        PRINT 'WARNING: All values are null/zero. No discount tiers configured!';
    END
END;

PRINT '========================================';
