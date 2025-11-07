-- ========================================
-- QUICK FIX: Insert DiscountTiers Data
-- Run this script to fix progressive discount returning null
-- ========================================

USE [ShopWaveDb]; -- Change to your database name if different
GO

PRINT '========================================';
PRINT 'Starting DiscountTiers Setup...';
PRINT '========================================';
PRINT '';

-- Check if table exists
IF OBJECT_ID('DiscountTiers', 'U') IS NULL
BEGIN
    PRINT '? ERROR: DiscountTiers table does not exist!';
    PRINT '';
    PRINT 'Please run database migrations first:';
    PRINT '  dotnet ef database update';
    PRINT '';
    RETURN;
END

-- Check existing data
DECLARE @existingCount INT;
SELECT @existingCount = COUNT(*) FROM DiscountTiers WHERE IsActive = 1;

IF @existingCount > 0
BEGIN
    PRINT '??  WARNING: Found ' + CAST(@existingCount AS NVARCHAR(10)) + ' active tier(s) already exist!';
    PRINT '';
    PRINT 'Current tiers:';
    SELECT 
        ThresholdAmount as 'Ng??ng (?)',
        DiscountValue as 'Gi?m giá (?)',
        Description as 'Mô t?',
        FORMAT(CreatedAt, 'dd/MM/yyyy HH:mm') as 'Ngày t?o'
    FROM DiscountTiers 
    WHERE IsActive = 1
    ORDER BY ThresholdAmount;
    
    PRINT '';
    PRINT 'Do you want to add MORE tiers? (Comment out this RETURN to proceed)';
    RETURN; -- Comment this line to add more tiers anyway
END

PRINT '? Table exists and is empty. Inserting 4 sample tiers...';
PRINT '';

-- Insert 4 tiers
BEGIN TRANSACTION;

BEGIN TRY
    -- Tier 1: 599,000+ ? Save 40,000
    INSERT INTO DiscountTiers (Id, ThresholdAmount, DiscountValue, IsActive, Description, CreatedAt, UpdatedAt)
    VALUES (
        NEWID(),
        599000,
        40000,
        1,
        N'Gi?m 40.000? cho ??n hàng t? 599.000?',
        GETUTCDATE(),
        GETUTCDATE()
    );

    -- Tier 2: 999,000+ ? Save 70,000
    INSERT INTO DiscountTiers (Id, ThresholdAmount, DiscountValue, IsActive, Description, CreatedAt, UpdatedAt)
    VALUES (
        NEWID(),
        999000,
        70000,
        1,
        N'Gi?m 70.000? cho ??n hàng t? 999.000?',
        GETUTCDATE(),
        GETUTCDATE()
    );

    -- Tier 3: 1,999,000+ ? Save 150,000
    INSERT INTO DiscountTiers (Id, ThresholdAmount, DiscountValue, IsActive, Description, CreatedAt, UpdatedAt)
    VALUES (
        NEWID(),
        1999000,
        150000,
        1,
        N'Gi?m 150.000? cho ??n hàng t? 1.999.000?',
        GETUTCDATE(),
        GETUTCDATE()
    );

    -- Tier 4: 2,999,000+ ? Save 250,000
    INSERT INTO DiscountTiers (Id, ThresholdAmount, DiscountValue, IsActive, Description, CreatedAt, UpdatedAt)
    VALUES (
        NEWID(),
        2999000,
        250000,
        1,
        N'Gi?m 250.000? cho ??n hàng t? 2.999.000?',
        GETUTCDATE(),
        GETUTCDATE()
    );

    COMMIT TRANSACTION;
    
    PRINT '? SUCCESS: Inserted 4 discount tiers!';
    PRINT '';
    
END TRY
BEGIN CATCH
    ROLLBACK TRANSACTION;
    
    PRINT '? ERROR: Failed to insert tiers';
    PRINT 'Error Message: ' + ERROR_MESSAGE();
    PRINT '';
    RETURN;
END CATCH

-- Verify the insert
PRINT 'Verification:';
PRINT '-------------';
SELECT 
    ThresholdAmount as 'Ng??ng (?)',
    DiscountValue as 'Gi?m giá (?)',
    CASE WHEN IsActive = 1 THEN 'Có' ELSE 'Không' END as 'Ho?t ??ng',
    Description as 'Mô t?'
FROM DiscountTiers
WHERE IsActive = 1
ORDER BY ThresholdAmount ASC;

PRINT '';
PRINT '========================================';
PRINT '? Setup Complete!';
PRINT '';
PRINT 'Next Steps:';
PRINT '1. Test your Cart API: GET https://localhost:5001/api/v1/cart';
PRINT '2. You should now see progressiveDiscount values';
PRINT '3. Try different cart subtotals to see different tiers apply';
PRINT '';
PRINT 'Example Response (cart subtotal 648,000):';
PRINT '{';
PRINT '  "progressiveDiscount": {';
PRINT '    "currentDiscountValue": 40000,';
PRINT '    "nextDiscountThreshold": 999000,';
PRINT '    "nextDiscountValue": 70000,';
PRINT '    "amountToNext": 351000';
PRINT '  }';
PRINT '}';
PRINT '========================================';
