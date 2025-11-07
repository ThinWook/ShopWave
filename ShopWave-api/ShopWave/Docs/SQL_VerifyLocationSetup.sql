-- ============================================
-- Verification Script for Location & Shipping Implementation
-- Purpose: Quick check that everything is set up correctly
-- ============================================

USE ShopWaveDb;
GO

PRINT '========================================';
PRINT 'LOCATION & SHIPPING VERIFICATION SCRIPT';
PRINT '========================================';
PRINT '';

-- Check 1: Tables Exist
PRINT '1. Checking if tables exist...';
IF OBJECT_ID('Provinces', 'U') IS NOT NULL
    PRINT '   ? Provinces table exists'
ELSE
    PRINT '   ? ERROR: Provinces table missing!'

IF OBJECT_ID('Districts', 'U') IS NOT NULL
    PRINT '   ? Districts table exists'
ELSE
    PRINT '   ? ERROR: Districts table missing!'

IF OBJECT_ID('Wards', 'U') IS NOT NULL
    PRINT '   ? Wards table exists'
ELSE
    PRINT '   ? ERROR: Wards table missing!'

IF OBJECT_ID('ShippingRates', 'U') IS NOT NULL
    PRINT '   ? ShippingRates table exists'
ELSE
    PRINT '   ? ERROR: ShippingRates table missing!'

PRINT '';

-- Check 2: Data Count
PRINT '2. Checking data counts...';
DECLARE @ProvinceCount INT, @DistrictCount INT, @WardCount INT, @RateCount INT;

SELECT @ProvinceCount = COUNT(*) FROM Provinces;
SELECT @DistrictCount = COUNT(*) FROM Districts;
SELECT @WardCount = COUNT(*) FROM Wards;
SELECT @RateCount = COUNT(*) FROM ShippingRates;

PRINT '   Provinces: ' + CAST(@ProvinceCount AS VARCHAR);
PRINT '   Districts: ' + CAST(@DistrictCount AS VARCHAR);
PRINT '   Wards: ' + CAST(@WardCount AS VARCHAR);
PRINT '   ShippingRates: ' + CAST(@RateCount AS VARCHAR);

IF @ProvinceCount = 0
    PRINT '   ? WARNING: No provinces found. Run seed script!';
IF @DistrictCount = 0
    PRINT '   ? WARNING: No districts found. Run seed script!';
IF @WardCount = 0
    PRINT '   ? WARNING: No wards found. Run seed script!';
IF @RateCount = 0
    PRINT '   ? WARNING: No shipping rates found. Run seed script!';

PRINT '';

-- Check 3: DEFAULT Shipping Rate
PRINT '3. Checking DEFAULT shipping rate...';
IF EXISTS (SELECT 1 FROM ShippingRates WHERE Province = 'DEFAULT')
BEGIN
    DECLARE @DefaultFee DECIMAL(18,2);
    SELECT @DefaultFee = Fee FROM ShippingRates WHERE Province = 'DEFAULT';
    PRINT '   ? DEFAULT shipping rate exists: ' + CAST(@DefaultFee AS VARCHAR) + ' VND';
END
ELSE
    PRINT '   ? CRITICAL: DEFAULT shipping rate missing! System will fail!';

PRINT '';

-- Check 4: Sample Province Data
PRINT '4. Sample provinces:';
SELECT TOP 5 
    Id, 
    Name, 
    Code,
    (SELECT COUNT(*) FROM Districts WHERE ProvinceId = p.Id) AS DistrictCount
FROM Provinces p
ORDER BY Name;

PRINT '';

-- Check 5: Sample District Data
PRINT '5. Sample districts (H? Chí Minh):';
SELECT TOP 5
    d.Id,
    d.Name,
    p.Name AS ProvinceName,
    (SELECT COUNT(*) FROM Wards WHERE DistrictId = d.Id) AS WardCount
FROM Districts d
JOIN Provinces p ON d.ProvinceId = p.Id
WHERE p.Id = 50
ORDER BY d.Name;

PRINT '';

-- Check 6: Sample Ward Data
PRINT '6. Sample wards (Qu?n 1):';
SELECT TOP 5
    w.Id,
    w.Name,
    d.Name AS DistrictName
FROM Wards w
JOIN Districts d ON w.DistrictId = d.Id
WHERE d.Id = 760
ORDER BY w.Name;

PRINT '';

-- Check 7: All Shipping Rates
PRINT '7. All shipping rates:';
SELECT 
    Province,
    Fee,
    CASE 
        WHEN Province = 'DEFAULT' THEN '(Fallback rate)'
        ELSE ''
    END AS Notes
FROM ShippingRates
ORDER BY 
    CASE WHEN Province = 'DEFAULT' THEN 0 ELSE 1 END,
    Province;

PRINT '';

-- Check 8: Indexes
PRINT '8. Checking indexes...';
IF EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_Districts_ProvinceId' AND object_id = OBJECT_ID('Districts'))
    PRINT '   ? Districts.ProvinceId index exists'
ELSE
    PRINT '   ? Districts.ProvinceId index missing';

IF EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_Wards_DistrictId' AND object_id = OBJECT_ID('Wards'))
    PRINT '   ? Wards.DistrictId index exists'
ELSE
    PRINT '   ? Wards.DistrictId index missing';

IF EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_ShippingRates_Province' AND object_id = OBJECT_ID('ShippingRates'))
    PRINT '   ? ShippingRates.Province unique index exists'
ELSE
    PRINT '   ? ShippingRates.Province unique index missing';

PRINT '';

-- Check 9: Foreign Key Constraints
PRINT '9. Checking foreign key constraints...';
IF EXISTS (SELECT 1 FROM sys.foreign_keys WHERE name LIKE 'FK_Districts_Provinces%')
    PRINT '   ? Districts ? Provinces FK exists'
ELSE
    PRINT '   ? Districts ? Provinces FK missing';

IF EXISTS (SELECT 1 FROM sys.foreign_keys WHERE name LIKE 'FK_Wards_Districts%')
    PRINT '   ? Wards ? Districts FK exists'
ELSE
    PRINT '   ? Wards ? Districts FK missing';

PRINT '';

-- Check 10: Sample Query Tests
PRINT '10. Testing sample queries...';

-- Test: Get districts for HCM
DECLARE @HCMDistrictCount INT;
SELECT @HCMDistrictCount = COUNT(*) 
FROM Districts 
WHERE ProvinceId = 50;
PRINT '   Districts in H? Chí Minh: ' + CAST(@HCMDistrictCount AS VARCHAR);

-- Test: Get wards for Qu?n 1
DECLARE @Q1WardCount INT;
SELECT @Q1WardCount = COUNT(*) 
FROM Wards 
WHERE DistrictId = 760;
PRINT '   Wards in Qu?n 1: ' + CAST(@Q1WardCount AS VARCHAR);

-- Test: Get shipping fee for HCM
DECLARE @HCMFee DECIMAL(18,2);
SELECT @HCMFee = Fee 
FROM ShippingRates 
WHERE Province = N'H? Chí Minh';
IF @HCMFee IS NOT NULL
    PRINT '   Shipping fee for H? Chí Minh: ' + CAST(@HCMFee AS VARCHAR) + ' VND';
ELSE
    PRINT '   ? No specific rate for H? Chí Minh (will use DEFAULT)';

PRINT '';

-- Summary
PRINT '========================================';
PRINT 'VERIFICATION COMPLETE';
PRINT '========================================';
PRINT '';

-- Final Status
IF @ProvinceCount > 0 
   AND @DistrictCount > 0 
   AND @WardCount > 0 
   AND EXISTS (SELECT 1 FROM ShippingRates WHERE Province = 'DEFAULT')
BEGIN
    PRINT '? STATUS: All checks passed!';
    PRINT 'System is ready to use.';
END
ELSE
BEGIN
    PRINT '?? STATUS: Some checks failed!';
    PRINT 'Please run the seed script: SQL_SeedLocationData.sql';
END

PRINT '';
PRINT 'Next steps:';
PRINT '1. Test API endpoints using curl or Postman';
PRINT '2. Check LOCATION_QUICK_START.md for testing examples';
PRINT '3. Integrate with frontend';

GO
