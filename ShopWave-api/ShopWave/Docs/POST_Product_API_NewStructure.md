# API POST Product - C?u trúc m?i v?i Options và Selected Options

## T?ng quan
API ?ã ???c c?p nh?t ?? h? tr? h? th?ng options linh ho?t, cho phép ??nh ngh?a các thu?c tính s?n ph?m (Size, Color, Material, v.v.) và liên k?t chúng v?i các bi?n th? (variants).

## Endpoint
```
POST /api/v1/products
Authorization: Bearer {admin_token}
```

## Request Body Structure

### Ví d? ??y ??
```json
{
  "name": "Giày ch?y b? UltraRun",
  "description": "Giày chuyên d?ng ch?y b?, ?? êm, thi?t k? thoáng khí.",
  "categoryId": "d9f8e7c6-b5a4-4321-8888-abcdef123456",
  "slug": "giay-chay-ultrarun",
  "mainImageId": 210,
  "galleryMedia": [
    { "mediaId": 210, "sortOrder": 1 },
    { "mediaId": 211, "sortOrder": 2 },
    { "mediaId": 212, "sortOrder": 3 }
  ],
  "options": [
    {
      "name": "Size",
      "displayType": "text_button",
      "values": [
        { "value": "42" },
        { "value": "43" }
      ]
    },
    {
      "name": "Color",
      "displayType": "color_swatch",
      "values": [
        { "value": "Black", "thumbnailId": 211 },
        { "value": "White", "thumbnailId": 212 }
      ]
    }
  ],
  "variants": [
    {
      "sku": "UR-42-BLK",
      "price": 899000,
      "stock": 25,
      "imageId": 211,
      "selectedOptions": [
        { "optionName": "Size", "value": "42" },
        { "optionName": "Color", "value": "Black" }
      ]
    },
    {
      "sku": "UR-43-WHT",
      "price": 919000,
      "stock": 40,
      "imageId": 212,
      "selectedOptions": [
        { "optionName": "Size", "value": "43" },
        { "optionName": "Color", "value": "White" }
      ]
    }
  ]
}
```

## Chi ti?t các ph?n

### 1. Thông tin c? b?n s?n ph?m (Product Info)
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `name` | string | ? | Tên s?n ph?m |
| `description` | string | ? | Mô t? s?n ph?m |
| `categoryId` | guid | ? | ID c?a danh m?c |
| `slug` | string | ? | Slug cho URL (t? ??ng t?o n?u null) |
| `mainImageId` | long | ? | ID ?nh ??i di?n chính |

### 2. Gallery Media
```json
"galleryMedia": [
  {
    "mediaId": 210,      // ID ?nh trong b?ng Media
    "sortOrder": 1       // Th? t? hi?n th?
  }
]
```

### 3. Options (??nh ngh?a thu?c tính) - **PH?N M?I**
```json
"options": [
  {
    "name": "Size",                    // Tên option
    "displayType": "text_button",      // Ki?u hi?n th?
    "values": [
      { 
        "value": "42",                 // Giá tr?
        "thumbnailId": null            // ?nh thumbnail (dùng cho color swatch)
      }
    ]
  }
]
```

**Display Types h? tr?:**
- `text_button` - Nút text (Size, v.v.)
- `color_swatch` - Màu v?i thumbnail
- `dropdown` - Dropdown (future)

### 4. Variants (Bi?n th?) - **?Ã C?P NH?T**

#### Tr??c ?ây (c?):
```json
{
  "sku": "UR-42-BLK",
  "price": 899000,
  "stock": 25,
  "imageId": 211
  // Không có cách nào liên k?t v?i options
}
```

#### Bây gi? (m?i):
```json
{
  "sku": "UR-42-BLK",
  "price": 899000,
  "stock": 25,
  "imageId": 211,
  "selectedOptions": [              // PH?N M?I
    { "optionName": "Size", "value": "42" },
    { "optionName": "Color", "value": "Black" }
  ]
}
```

**L?u ý quan tr?ng:**
- `optionName` ph?i kh?p v?i `name` trong m?ng `options`
- `value` ph?i kh?p v?i `value` trong `options[].values`
- Backend s? t? ??ng t?o liên k?t trong b?ng `VariantValues`

## Response

### Success (201 Created)
```json
{
  "success": true,
  "code": "PRODUCT_CREATED",
  "message": "Product created successfully",
  "data": {
    "id": "guid-of-created-product"
  }
}
```

### Error (400 Bad Request)
```json
{
  "success": false,
  "code": "VALIDATION_ERROR",
  "message": "Invalid payload",
  "errors": [
    {
      "field": "request",
      "message": "Invalid payload",
      "code": "VALIDATION_ERROR"
    }
  ]
}
```

## Database Schema

### Các b?ng liên quan:
1. **Products** - S?n ph?m chính
2. **ProductOptions** - ??nh ngh?a options (Size, Color)
   - `Id` (Guid)
   - `ProductId` (Guid)
   - `Name` (string)
   - `DisplayType` (string) - **FIELD M?I**
3. **OptionValues** - Giá tr? c?a options (42, 43, Black, White)
   - `Id` (Guid)
   - `OptionId` (Guid)
   - `Value` (string)
   - `ThumbnailId` (long?)
4. **ProductVariants** - Các bi?n th?
5. **VariantValues** - Liên k?t variant v?i option values (many-to-many)
   - `VariantId` (Guid)
   - `ValueId` (Guid)

## Workflow t?o s?n ph?m

1. **T?o Product** ? L?u thông tin c? b?n
2. **T?o ProductOptions** ? L?u t?ng option (Size, Color)
3. **T?o OptionValues** ? L?u giá tr? c?a options (42, 43, Black, White)
4. **Map option values** ? T?o dictionary `"Size|42" -> Guid`
5. **T?o ProductVariants** ? L?u t?ng variant (SKU, price, stock)
6. **T?o VariantValues** ? Liên k?t variant v?i option values
7. **C?p nh?t denormalized fields** ? DisplayPrice, TotalInventory, VariantCount

## Migration

C?n ch?y migration ?? thêm field `DisplayType`:

```bash
dotnet ef database update
```

File migration: `AddDisplayTypeToProductOption.cs`

## Testing v?i curl

```bash
curl -X POST https://localhost:5001/api/v1/products \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d @product-with-options.json
```

## So sánh tr??c/sau

### Tr??c ?ây:
- ? Không có cách chu?n ?? ??nh ngh?a thu?c tính
- ? Size/Color hardcoded trong code
- ? Khó m? r?ng thêm thu?c tính m?i
- ? Không linh ho?t cho t?ng s?n ph?m

### Bây gi?:
- ? ??nh ngh?a options ??ng cho t?ng s?n ph?m
- ? H? tr? nhi?u lo?i display (text, color swatch)
- ? D? m? r?ng (Material, Style, v.v.)
- ? Frontend có th? render ??ng d?a trên options
- ? Tìm variant theo combination options

## GET Product Response

```json
{
  "id": "...",
  "name": "Giày ch?y b? UltraRun",
  "options": [
    {
      "name": "Size",
      "displayType": "text_button",
      "values": [
        { "value": "42", "thumbnailId": null },
        { "value": "43", "thumbnailId": null }
      ]
    },
    {
      "name": "Color",
      "displayType": "color_swatch",
      "values": [
        { "value": "Black", "thumbnailId": 211 },
        { "value": "White", "thumbnailId": 212 }
      ]
    }
  ],
  "variants": [
    {
      "id": "...",
      "sku": "UR-42-BLK",
      "price": 899000,
      "stock": 25,
      "imageId": 211,
      "selectedOptions": [
        { "optionName": "Size", "value": "42" },
        { "optionName": "Color", "value": "Black" }
      ]
    }
  ]
}
```

## Frontend Integration

Frontend có th?:
1. Render các option selectors d?a trên `displayType`
2. Khi user ch?n options ? g?i API ?? tìm variant phù h?p
3. Hi?n th? price, stock, image c?a variant t??ng ?ng

Endpoint tìm variant (?ã có s?n):
```
POST /api/v1/products/{productId}/variants/find
Body: { "valueIds": ["guid1", "guid2"] }
```
