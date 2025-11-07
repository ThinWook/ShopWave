-- ============================================
-- SQL Script: Seed Location Data
-- Purpose: Populate Provinces, Districts, Wards, and ShippingRates tables
-- ============================================

USE ShopWaveDb;
GO

-- ============================================
-- STEP 1: Seed Provinces (Sample data for major cities)
-- ============================================
SET IDENTITY_INSERT Provinces ON;

INSERT INTO Provinces (Id, Name, Code) VALUES
(1, N'Hà N?i', 'HN'),
(50, N'H? Chí Minh', 'HCM'),
(48, N'?à N?ng', 'DN'),
(31, N'H?i Phòng', 'HP'),
(92, N'C?n Th?', 'CT'),
(56, N'Bình D??ng', 'BD'),
(74, N'??ng Nai', 'DNI'),
(75, N'Bà R?a - V?ng Tàu', 'BRVT'),
(35, N'Hà Nam', 'HNA'),
(36, N'Nam ??nh', 'N?');

SET IDENTITY_INSERT Provinces OFF;
GO

-- ============================================
-- STEP 2: Seed Districts (Sample for H? Chí Minh and Hà N?i)
-- ============================================
-- H? Chí Minh City Districts
SET IDENTITY_INSERT Districts ON;

INSERT INTO Districts (Id, Name, ProvinceId) VALUES
(760, N'Qu?n 1', 50),
(761, N'Qu?n 2', 50),
(762, N'Qu?n 3', 50),
(763, N'Qu?n 4', 50),
(764, N'Qu?n 5', 50),
(765, N'Qu?n 6', 50),
(766, N'Qu?n 7', 50),
(767, N'Qu?n 8', 50),
(768, N'Qu?n 9', 50),
(769, N'Qu?n 10', 50),
(770, N'Qu?n 11', 50),
(771, N'Qu?n 12', 50),
(772, N'Qu?n Bình Th?nh', 50),
(773, N'Qu?n Gò V?p', 50),
(774, N'Qu?n Phú Nhu?n', 50),
(775, N'Qu?n Tân Bình', 50),
(776, N'Qu?n Tân Phú', 50),
(777, N'Qu?n Bình Tân', 50),
(778, N'Huy?n C? Chi', 50),
(779, N'Huy?n Hóc Môn', 50),
(780, N'Huy?n Bình Chánh', 50),
(781, N'Huy?n Nhà Bè', 50),
(782, N'Huy?n C?n Gi?', 50),
(783, N'Thành ph? Th? ??c', 50);

-- Hà N?i Districts
INSERT INTO Districts (Id, Name, ProvinceId) VALUES
(1, N'Qu?n Ba ?ình', 1),
(2, N'Qu?n Hoàn Ki?m', 1),
(3, N'Qu?n Tây H?', 1),
(4, N'Qu?n Long Biên', 1),
(5, N'Qu?n C?u Gi?y', 1),
(6, N'Qu?n ??ng ?a', 1),
(7, N'Qu?n Hai Bà Tr?ng', 1),
(8, N'Qu?n Hoàng Mai', 1),
(9, N'Qu?n Thanh Xuân', 1),
(10, N'Qu?n Hà ?ông', 1),
(11, N'Huy?n Sóc S?n', 1),
(12, N'Huy?n ?ông Anh', 1),
(13, N'Huy?n Gia Lâm', 1),
(14, N'Qu?n Nam T? Liêm', 1),
(15, N'Qu?n B?c T? Liêm', 1);

SET IDENTITY_INSERT Districts OFF;
GO

-- ============================================
-- STEP 3: Seed Wards (Sample for Qu?n 1 HCM and Ba ?ình HN)
-- ============================================
SET IDENTITY_INSERT Wards ON;

-- Qu?n 1, H? Chí Minh
INSERT INTO Wards (Id, Name, DistrictId) VALUES
(27001, N'Ph??ng Tân ??nh', 760),
(27002, N'Ph??ng ?a Kao', 760),
(27003, N'Ph??ng B?n Nghé', 760),
(27004, N'Ph??ng B?n Thành', 760),
(27005, N'Ph??ng Nguy?n Thái Bình', 760),
(27006, N'Ph??ng Ph?m Ng? Lão', 760),
(27007, N'Ph??ng C?u Ông Lãnh', 760),
(27008, N'Ph??ng Cô Giang', 760),
(27009, N'Ph??ng Nguy?n C? Trinh', 760),
(27010, N'Ph??ng C?u Kho', 760);

-- Qu?n 2, H? Chí Minh (now part of Th? ??c)
INSERT INTO Wards (Id, Name, DistrictId) VALUES
(27100, N'Ph??ng Th?o ?i?n', 761),
(27101, N'Ph??ng An Phú', 761),
(27102, N'Ph??ng An Khánh', 761),
(27103, N'Ph??ng Bình An', 761),
(27104, N'Ph??ng Bình Tr?ng ?ông', 761),
(27105, N'Ph??ng Bình Tr?ng Tây', 761),
(27106, N'Ph??ng Cát Lái', 761),
(27107, N'Ph??ng Th?nh M? L?i', 761),
(27108, N'Ph??ng An L?i ?ông', 761),
(27109, N'Ph??ng Th? Thiêm', 761);

-- Ba ?ình, Hà N?i
INSERT INTO Wards (Id, Name, DistrictId) VALUES
(1, N'Ph??ng Phúc Xá', 1),
(2, N'Ph??ng Trúc B?ch', 1),
(3, N'Ph??ng V?nh Phúc', 1),
(4, N'Ph??ng C?ng V?', 1),
(5, N'Ph??ng Li?u Giai', 1),
(6, N'Ph??ng Nguy?n Trung Tr?c', 1),
(7, N'Ph??ng Quán Thánh', 1),
(8, N'Ph??ng Ng?c Hà', 1),
(9, N'Ph??ng ?i?n Biên', 1),
(10, N'Ph??ng ??i C?n', 1),
(11, N'Ph??ng Ng?c Khánh', 1),
(12, N'Ph??ng Kim Mã', 1),
(13, N'Ph??ng Gi?ng Võ', 1),
(14, N'Ph??ng Thành Công', 1);

SET IDENTITY_INSERT Wards OFF;
GO

-- ============================================
-- STEP 4: Seed ShippingRates
-- ============================================
INSERT INTO ShippingRates (Id, Province, Fee, CreatedAt, UpdatedAt) VALUES
(NEWID(), 'DEFAULT', 30000.00, GETUTCDATE(), GETUTCDATE()),
(NEWID(), N'H? Chí Minh', 20000.00, GETUTCDATE(), GETUTCDATE()),
(NEWID(), N'Hà N?i', 20000.00, GETUTCDATE(), GETUTCDATE()),
(NEWID(), N'?à N?ng', 25000.00, GETUTCDATE(), GETUTCDATE()),
(NEWID(), N'H?i Phòng', 25000.00, GETUTCDATE(), GETUTCDATE()),
(NEWID(), N'C?n Th?', 28000.00, GETUTCDATE(), GETUTCDATE()),
(NEWID(), N'Bình D??ng', 22000.00, GETUTCDATE(), GETUTCDATE()),
(NEWID(), N'??ng Nai', 22000.00, GETUTCDATE(), GETUTCDATE()),
(NEWID(), N'Bà R?a - V?ng Tàu', 35000.00, GETUTCDATE(), GETUTCDATE());
GO

-- ============================================
-- STEP 5: Verify Data
-- ============================================
PRINT '===== PROVINCES =====';
SELECT * FROM Provinces ORDER BY Name;

PRINT '===== DISTRICTS (Sample) =====';
SELECT TOP 20 d.Id, d.Name, p.Name AS ProvinceName
FROM Districts d
JOIN Provinces p ON d.ProvinceId = p.Id
ORDER BY p.Name, d.Name;

PRINT '===== WARDS (Sample) =====';
SELECT TOP 20 w.Id, w.Name, d.Name AS DistrictName
FROM Wards w
JOIN Districts d ON w.DistrictId = d.Id
ORDER BY d.Name, w.Name;

PRINT '===== SHIPPING RATES =====';
SELECT * FROM ShippingRates ORDER BY Province;

PRINT 'Location data seed completed successfully!';
GO
