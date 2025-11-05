# Testing Checklist - POST Product API v?i Options

## ?? Chu?n b?

- [ ] ?ã ch?y migration: `dotnet ef database update`
- [ ] Server ?ang ch?y
- [ ] Có admin token h?p l?
- [ ] Có ít nh?t 1 category trong DB
- [ ] Có ít nh?t 3-4 media files ?ã upload (?? test mainImage, gallery, thumbnails)

## ?? Test Cases

### 1. ? Test t?o s?n ph?m c? b?n (không có options)
```json
{
  "name": "Simple Product",
  "categoryId": "your-category-guid",
  "variants": [
    {
      "sku": "SIMPLE-001",
      "price": 100000,
      "stock": 50
    }
  ]
}
```
**Expected**: 
- [ ] Status 201
- [ ] Response có `id`
- [ ] Variant ???c t?o trong DB

### 2. ? Test t?o s?n ph?m v?i 1 option (Size only)
```json
{
  "name": "T-Shirt Basic",
  "categoryId": "your-category-guid",
  "options": [
    {
      "name": "Size",
      "displayType": "text_button",
      "values": [
        {"value": "S"},
        {"value": "M"},
        {"value": "L"}
      ]
    }
  ],
  "variants": [
    {
      "sku": "TSHIRT-S",
      "price": 150000,
      "stock": 20,
      "selectedOptions": [
        {"optionName": "Size", "value": "S"}
      ]
    },
    {
      "sku": "TSHIRT-M",
      "price": 150000,
      "stock": 30,
      "selectedOptions": [
        {"optionName": "Size", "value": "M"}
      ]
    }
  ]
}
```
**Expected**:
- [ ] Status 201
- [ ] 1 ProductOption ???c t?o v?i name="Size"
- [ ] 3 OptionValues ???c t?o (S, M, L)
- [ ] 2 Variants ???c t?o
- [ ] 2 VariantValues ???c t?o (liên k?t)

### 3. ? Test t?o s?n ph?m v?i 2 options (Size + Color)
S? d?ng file: `sample-product-request.json`

**Expected**:
- [ ] Status 201
- [ ] 2 ProductOptions ???c t?o
- [ ] 9 OptionValues ???c t?o (6 sizes + 3 colors)
- [ ] 5 Variants ???c t?o
- [ ] 10 VariantValues ???c t?o (5 variants × 2 options)

### 4. ? Test v?i Color swatch (có thumbnailId)
```json
{
  "options": [
    {
      "name": "Color",
      "displayType": "color_swatch",
      "values": [
        {"value": "Red", "thumbnailId": 101},
        {"value": "Blue", "thumbnailId": 102}
      ]
    }
  ]
}
```
**Expected**:
- [ ] OptionValues có ThumbnailId ???c l?u ?úng

### 5. ? Test v?i Gallery Media
```json
{
  "mainImageId": 100,
  "galleryMedia": [
    {"mediaId": 100, "sortOrder": 1},
    {"mediaId": 101, "sortOrder": 2}
  ]
}
```
**Expected**:
- [ ] Product.MediaId = 100
- [ ] 2 ProductMedia records ???c t?o

### 6. ? Test validation errors

#### 6.1 Missing required field (name)
```json
{
  "categoryId": "...",
  "variants": []
}
```
**Expected**: 
- [ ] Status 400
- [ ] Error message v? missing name

#### 6.2 Invalid categoryId
```json
{
  "name": "Test",
  "categoryId": "00000000-0000-0000-0000-000000000000"
}
```
**Expected**: 
- [ ] Status 400 ho?c 404

#### 6.3 selectedOptions không kh?p v?i options
```json
{
  "options": [
    {"name": "Size", "values": [{"value": "S"}]}
  ],
  "variants": [
    {
      "selectedOptions": [
        {"optionName": "Color", "value": "Red"}  // ? Color không t?n t?i
      ]
    }
  ]
}
```
**Expected**: 
- [ ] Status 201 (v?n t?o ???c, nh?ng log warning)
- [ ] VariantValue không ???c t?o cho option không t?n t?i

### 7. ? Test GET product ?? verify
```bash
GET /api/v1/products/{created-product-id}
```
**Expected response**:
```json
{
  "id": "...",
  "name": "...",
  "options": [
    {
      "name": "Size",
      "displayType": "text_button",
      "values": [{"value": "42", "thumbnailId": null}]
    }
  ],
  "variants": [
    {
      "sku": "...",
      "selectedOptions": [
        {"optionName": "Size", "value": "42"}
      ]
    }
  ]
}
```
- [ ] options array ???c tr? v? ??y ??
- [ ] variants có selectedOptions
- [ ] displayType ?úng

### 8. ? Test denormalized fields
**Expected**:
- [ ] Product.DisplayPrice = min(variant prices)
- [ ] Product.TotalInventory = sum(variant stocks)
- [ ] Product.VariantCount = count(variants)

### 9. ? Test v?i SKU auto-generated
Không truy?n `sku` trong variant:
```json
{
  "variants": [
    {
      "price": 100000,
      "stock": 50
      // Không có sku
    }
  ]
}
```
**Expected**:
- [ ] SKU ???c auto-generate: `{slug}-{random-8-chars}`

### 10. ? Test transaction rollback
Gi? l?p l?i ? gi?a quá trình (ví d?: mediaId không t?n t?i trong galleryMedia):
```json
{
  "galleryMedia": [
    {"mediaId": 999999, "sortOrder": 1}  // ? không t?n t?i
  ]
}
```
**Expected**:
- [ ] Status 500 ho?c 400
- [ ] Không có data rác trong DB (transaction rollback)
- [ ] Product không ???c t?o

## ?? Verification trong Database

### Query ?? check ProductOptions
```sql
SELECT po.*, ov.Value, ov.ThumbnailId
FROM ProductOptions po
LEFT JOIN OptionValues ov ON po.Id = ov.OptionId
WHERE po.ProductId = 'your-product-guid'
ORDER BY po.Name, ov.Value
```
**Expected**:
- [ ] T?t c? options và values ???c t?o ?úng

### Query ?? check VariantValues
```sql
SELECT pv.Sku, po.Name as OptionName, ov.Value
FROM ProductVariants pv
JOIN VariantValues vv ON pv.Id = vv.VariantId
JOIN OptionValues ov ON vv.ValueId = ov.Id
JOIN ProductOptions po ON ov.OptionId = po.Id
WHERE pv.ProductId = 'your-product-guid'
ORDER BY pv.Sku, po.Name
```
**Expected**:
- [ ] M?i variant có ?úng s? l??ng option values
- [ ] selectedOptions ???c map ?úng

## ?? Performance Test

- [ ] T?o product v?i 3 options × 5 values m?i option = 125 variants (3^5)
- [ ] Check response time < 5 seconds
- [ ] Check memory usage không spike

## ?? Known Issues / Edge Cases

- [ ] ?? N?u `selectedOptions` r?ng ? variant v?n ???c t?o (OK)
- [ ] ?? N?u option name có spaces ? trim ???c handle ?úng
- [ ] ?? Case sensitivity: "Size" vs "size" ? hi?n t?i case-sensitive
- [ ] ?? Duplicate variants (cùng selectedOptions) ? không có validation (c?n thêm)

## ? Final Checklist

- [ ] T?t c? test cases pass
- [ ] Database integrity OK
- [ ] Logs không có errors
- [ ] Response times acceptable
- [ ] Documentation updated
- [ ] Frontend team ???c notify v? thay ??i API

## ?? Tools

- Postman collection: (TODO: create)
- Sample curl commands: Xem `POST_Product_API_NewStructure.md`
- Sample JSON: `sample-product-request.json`

## ?? Notes

Ghi chú các issues tìm th?y trong quá trình test:

---
---
