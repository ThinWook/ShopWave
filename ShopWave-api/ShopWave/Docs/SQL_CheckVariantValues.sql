-- ===================================================================
-- Ki?m tra d? li?u VariantValues cho product c? th?
-- ===================================================================

-- 1. Ki?m tra Product và các Variants c?a nó
DECLARE @ProductId UNIQUEIDENTIFIER = '74ae5dd8-7e18-4d8d-a87e-b17aaa0e752e';

SELECT 
    'Product Info' as Section,
    p.Id as ProductId,
    p.Name as ProductName,
    COUNT(DISTINCT pv.Id) as VariantCount,
    COUNT(DISTINCT po.Id) as OptionCount
FROM Products p
LEFT JOIN ProductVariants pv ON p.Id = pv.ProductId
LEFT JOIN ProductOptions po ON p.Id = po.ProductId
WHERE p.Id = @ProductId
GROUP BY p.Id, p.Name;

-- 2. Ki?m tra Variants
SELECT 
    'Variants' as Section,
    pv.Id as VariantId,
    pv.Sku,
    pv.Price,
    pv.Stock
FROM ProductVariants pv
WHERE pv.ProductId = @ProductId;

-- 3. Ki?m tra ProductOptions c?a product này
SELECT 
    'Options' as Section,
    po.Id as OptionId,
    po.Name as OptionName,
    po.DisplayType,
    COUNT(ov.Id) as ValueCount
FROM ProductOptions po
LEFT JOIN OptionValues ov ON po.Id = ov.OptionId
WHERE po.ProductId = @ProductId
GROUP BY po.Id, po.Name, po.DisplayType;

-- 4. Ki?m tra OptionValues
SELECT 
    'OptionValues' as Section,
    ov.Id as ValueId,
    po.Name as OptionName,
    ov.Value
FROM OptionValues ov
INNER JOIN ProductOptions po ON ov.OptionId = po.Id
WHERE po.ProductId = @ProductId
ORDER BY po.Name, ov.Value;

-- 5. *** QUAN TR?NG: Ki?m tra VariantValues (liên k?t gi?a Variant và OptionValue)
SELECT 
    'VariantValues (Links)' as Section,
    vv.VariantId,
    pv.Sku as VariantSku,
    vv.ValueId,
    po.Name as OptionName,
    ov.Value as OptionValue
FROM VariantValues vv
INNER JOIN ProductVariants pv ON vv.VariantId = pv.Id
INNER JOIN OptionValues ov ON vv.ValueId = ov.Id
INNER JOIN ProductOptions po ON ov.OptionId = po.Id
WHERE pv.ProductId = @ProductId
ORDER BY pv.Sku, po.Name;

-- 6. Ki?m tra Variants KHÔNG có VariantValues (r?ng selectedOptions)
SELECT 
    'Variants WITHOUT VariantValues' as Section,
    pv.Id as VariantId,
    pv.Sku,
    CASE 
        WHEN EXISTS (SELECT 1 FROM VariantValues vv WHERE vv.VariantId = pv.Id)
        THEN 'Has Links'
        ELSE '? NO LINKS (selectedOptions will be empty)'
    END as Status
FROM ProductVariants pv
WHERE pv.ProductId = @ProductId;

-- ===================================================================
-- EXPECTED RESULTS
-- ===================================================================
/*
N?u "VariantValues (Links)" tr? v? 0 rows:
- Có ngh?a là khi t?o product, b?n KHÔNG g?i "selectedOptions" trong request
- ho?c logic t?o VariantValue trong CreateProduct b? sai
- ho?c optionValueMap không map ?úng key

? FIX: Khi t?o product qua API, ph?i g?i ??y ??:
{
  "variants": [
    {
      "sku": "Cam-L",
      "price": 321000,
      "stock": 314,
      "selectedOptions": [
        { "optionName": "Kích th??c", "value": "L" },
        { "optionName": "Màu", "value": "Cam" }
      ]
    }
  ]
}

N?u ?ã có product c? và mu?n s?a, c?n:
1. INSERT VariantValues th? công (script bên d??i)
2. Ho?c xóa product và t?o l?i v?i payload ??y ??
*/

-- ===================================================================
-- SCRIPT FIX: Thêm VariantValues th? công cho product hi?n t?i
-- ===================================================================
/*
-- B??c 1: L?y danh sách OptionValue IDs
SELECT 
    ov.Id as ValueId,
    po.Name as OptionName,
    ov.Value
FROM OptionValues ov
INNER JOIN ProductOptions po ON ov.OptionId = po.Id
WHERE po.ProductId = '74ae5dd8-7e18-4d8d-a87e-b17aaa0e752e'
ORDER BY po.Name, ov.Value;

-- B??c 2: Map variant SKU v?i OptionValue IDs (thay các GUID th?c t?)
-- Ví d?: variant "Cam-L" c?n link v?i "Màu: Cam" và "Kích th??c: L"

BEGIN TRANSACTION;

-- Variant "Cam-L" (thay GUID th?c t? t? k?t qu? trên)
DECLARE @VariantCamL UNIQUEIDENTIFIER = '8fed937b-925b-41c3-913a-1ea735da1fe3';
DECLARE @ValueMauCam UNIQUEIDENTIFIER; -- L?y t? query trên
DECLARE @ValueSizeL UNIQUEIDENTIFIER; -- L?y t? query trên

-- L?y ValueId t? ??ng
SELECT @ValueMauCam = ov.Id 
FROM OptionValues ov
INNER JOIN ProductOptions po ON ov.OptionId = po.Id
WHERE po.ProductId = '74ae5dd8-7e18-4d8d-a87e-b17aaa0e752e' 
  AND po.Name = N'Màu' 
  AND ov.Value = N'Cam';

SELECT @ValueSizeL = ov.Id 
FROM OptionValues ov
INNER JOIN ProductOptions po ON ov.OptionId = po.Id
WHERE po.ProductId = '74ae5dd8-7e18-4d8d-a87e-b17aaa0e752e' 
  AND po.Name = N'Kích th??c' 
  AND ov.Value = N'L';

-- Insert VariantValues
IF @ValueMauCam IS NOT NULL
    INSERT INTO VariantValues (Id, VariantId, ValueId) 
    VALUES (NEWID(), @VariantCamL, @ValueMauCam);

IF @ValueSizeL IS NOT NULL
    INSERT INTO VariantValues (Id, VariantId, ValueId) 
    VALUES (NEWID(), @VariantCamL, @ValueSizeL);

-- T??ng t? cho variant "Cam-XL"
DECLARE @VariantCamXL UNIQUEIDENTIFIER = 'a7004669-3631-47fe-ad64-f02b6a2ed157';
DECLARE @ValueSizeXL UNIQUEIDENTIFIER;

SELECT @ValueSizeXL = ov.Id 
FROM OptionValues ov
INNER JOIN ProductOptions po ON ov.OptionId = po.Id
WHERE po.ProductId = '74ae5dd8-7e18-4d8d-a87e-b17aaa0e752e' 
  AND po.Name = N'Kích th??c' 
  AND ov.Value = N'XL';

IF @ValueMauCam IS NOT NULL
    INSERT INTO VariantValues (Id, VariantId, ValueId) 
    VALUES (NEWID(), @VariantCamXL, @ValueMauCam);

IF @ValueSizeXL IS NOT NULL
    INSERT INTO VariantValues (Id, VariantId, ValueId) 
    VALUES (NEWID(), @VariantCamXL, @ValueSizeXL);

-- Ki?m tra l?i
SELECT 
    pv.Sku,
    po.Name as OptionName,
    ov.Value as OptionValue
FROM VariantValues vv
INNER JOIN ProductVariants pv ON vv.VariantId = pv.Id
INNER JOIN OptionValues ov ON vv.ValueId = ov.Id
INNER JOIN ProductOptions po ON ov.OptionId = po.Id
WHERE pv.ProductId = '74ae5dd8-7e18-4d8d-a87e-b17aaa0e752e'
ORDER BY pv.Sku, po.Name;

-- N?u OK, commit
-- COMMIT TRANSACTION;

-- N?u sai, rollback
-- ROLLBACK TRANSACTION;
*/
