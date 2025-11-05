-- ========================================
-- Progressive Discount Sample Data Setup
-- ========================================

-- Clear existing discount tiers (optional - comment out if you want to keep existing data)
-- DELETE FROM DiscountTiers;

-- Insert sample discount tiers
-- These tiers provide increasing discounts as order value increases

-- Tier 1: Orders 599,000+ get 40,000 discount
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

-- Tier 2: Orders 999,000+ get 70,000 discount
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

-- Tier 3: Orders 1,999,000+ get 150,000 discount
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

-- Tier 4: Orders 2,999,000+ get 250,000 discount
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

-- Verify the tiers were created
SELECT 
    Id,
    ThresholdAmount as 'Ng??ng',
    DiscountValue as 'Gi?m giá',
    IsActive as 'Ho?t ??ng',
    Description as 'Mô t?',
    CreatedAt as 'Ngày t?o'
FROM DiscountTiers
ORDER BY ThresholdAmount ASC;

-- ========================================
-- Test Scenarios
-- ========================================

-- Scenario 1: Cart subtotal 250,000 (below first tier)
-- Expected: currentDiscountValue = 0, nextThreshold = 599,000, amountToNext = 349,000

-- Scenario 2: Cart subtotal 599,000 (exactly at first tier)
-- Expected: currentDiscountValue = 40,000, nextThreshold = 999,000, amountToNext = 400,000

-- Scenario 3: Cart subtotal 878,000 (between first and second tier)
-- Expected: currentDiscountValue = 40,000, nextThreshold = 999,000, amountToNext = 121,000

-- Scenario 4: Cart subtotal 1,500,000 (between second and third tier)
-- Expected: currentDiscountValue = 70,000, nextThreshold = 1,999,000, amountToNext = 499,000

-- Scenario 5: Cart subtotal 3,500,000 (above highest tier)
-- Expected: currentDiscountValue = 250,000, nextThreshold = null, amountToNext = null

-- ========================================
-- Query to simulate discount calculation
-- ========================================

DECLARE @SubTotal DECIMAL(18,2) = 878000; -- Change this to test different scenarios

-- Find current tier (highest tier where subtotal >= threshold)
DECLARE @CurrentDiscount DECIMAL(18,2);
SELECT TOP 1 @CurrentDiscount = DiscountValue
FROM DiscountTiers
WHERE IsActive = 1 AND @SubTotal >= ThresholdAmount
ORDER BY ThresholdAmount DESC;

-- Find next tier (lowest tier where subtotal < threshold)
DECLARE @NextThreshold DECIMAL(18,2);
DECLARE @NextDiscount DECIMAL(18,2);
DECLARE @AmountToNext DECIMAL(18,2);

SELECT TOP 1 
    @NextThreshold = ThresholdAmount,
    @NextDiscount = DiscountValue,
    @AmountToNext = ThresholdAmount - @SubTotal
FROM DiscountTiers
WHERE IsActive = 1 AND @SubTotal < ThresholdAmount
ORDER BY ThresholdAmount ASC;

-- Display results
SELECT 
    @SubTotal AS 'Subtotal',
    ISNULL(@CurrentDiscount, 0) AS 'Current Discount',
    @NextThreshold AS 'Next Threshold',
    @NextDiscount AS 'Next Discount',
    @AmountToNext AS 'Amount To Next';

-- ========================================
-- Management Queries
-- ========================================

-- Deactivate a specific tier
-- UPDATE DiscountTiers SET IsActive = 0 WHERE ThresholdAmount = 599000;

-- Reactivate a tier
-- UPDATE DiscountTiers SET IsActive = 1 WHERE ThresholdAmount = 599000;

-- Update discount value for a tier
-- UPDATE DiscountTiers SET DiscountValue = 50000, UpdatedAt = GETUTCDATE() WHERE ThresholdAmount = 599000;

-- Add a new tier
-- INSERT INTO DiscountTiers (Id, ThresholdAmount, DiscountValue, IsActive, Description, CreatedAt, UpdatedAt)
-- VALUES (NEWID(), 4999000, 400000, 1, N'Gi?m 400.000? cho ??n hàng t? 4.999.000?', GETUTCDATE(), GETUTCDATE());

-- Delete a tier (careful - this is permanent!)
-- DELETE FROM DiscountTiers WHERE ThresholdAmount = 4999000;

-- View all tiers sorted by threshold
SELECT 
    Id,
    ThresholdAmount as 'Threshold',
    DiscountValue as 'Discount',
    IsActive as 'Active',
    Description,
    CreatedAt as 'Created',
    UpdatedAt as 'Updated'
FROM DiscountTiers
ORDER BY ThresholdAmount ASC;
