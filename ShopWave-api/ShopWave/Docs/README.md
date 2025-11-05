# POST Product API - Options System Documentation

## ?? Th? m?c này ch?a

1. **SUMMARY_PostProductChanges.md** - Tóm t?t t?t c? thay ??i
2. **POST_Product_API_NewStructure.md** - Chi ti?t API specification
3. **sample-product-request.json** - Ví d? request hoàn ch?nh
4. **TESTING_CHECKLIST.md** - Checklist ?? test API

## ?? Quick Start

### 1. Apply Database Migration
```bash
cd ShopWave
dotnet ef database update
```

### 2. Test API v?i curl
```bash
# T?o product
curl -X POST https://localhost:5001/api/v1/products \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d @Docs/sample-product-request.json

# L?y thông tin product
curl https://localhost:5001/api/v1/products/{product-id} \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### 3. Verify trong Database
```sql
-- Check options
SELECT * FROM ProductOptions WHERE ProductId = 'your-product-guid'

-- Check option values
SELECT po.Name, ov.Value, ov.ThumbnailId
FROM ProductOptions po
JOIN OptionValues ov ON po.Id = ov.OptionId
WHERE po.ProductId = 'your-product-guid'

-- Check variant mappings
SELECT pv.Sku, po.Name, ov.Value
FROM ProductVariants pv
JOIN VariantValues vv ON pv.Id = vv.VariantId
JOIN OptionValues ov ON vv.ValueId = ov.Id
JOIN ProductOptions po ON ov.OptionId = po.Id
WHERE pv.ProductId = 'your-product-guid'
```

## ?? Key Concepts

### Options (Thu?c tính)
- ??nh ngh?a các nhóm l?a ch?n: Size, Color, Material, v.v.
- M?i s?n ph?m có th? có nhi?u options
- M?i option có nhi?u values

### Option Values (Giá tr?)
- Các giá tr? c? th? c?a option: 42, 43, Black, White
- Có th? có thumbnail (cho color swatch)

### Variants (Bi?n th?)
- K?t h?p c? th? các option values
- Ví d?: Size=42 + Color=Black ? Variant "UR-42-BLK"
- M?i variant có price, stock, image riêng

### Display Types
- `text_button` - Hi?n th? d?ng nút text (Size)
- `color_swatch` - Hi?n th? d?ng màu v?i thumbnail (Color)
- `dropdown` - (Future) Hi?n th? d?ng dropdown

## ?? Request Structure

```
Product
??? name, description, categoryId (basics)
??? mainImageId (?nh ??i di?n)
??? galleryMedia[] (th? vi?n ?nh)
?
??? options[] (??nh ngh?a thu?c tính)
?   ??? name (Size, Color, ...)
?   ??? displayType (text_button, color_swatch)
?   ??? values[]
?       ??? value (42, Black, ...)
?       ??? thumbnailId (cho color swatch)
?
??? variants[] (các bi?n th?)
    ??? sku, price, stock
    ??? imageId
    ??? selectedOptions[] (liên k?t)
        ??? optionName
        ??? value
```

## ?? Database Schema

```
Products
  ??? Id, Name, Description, CategoryId
  ??? MediaId (main image)
  ??? DisplayPrice, TotalInventory, VariantCount (denormalized)

ProductOptions
  ??? Id, ProductId
  ??? Name (Size, Color)
  ??? DisplayType (text_button, color_swatch)

OptionValues
  ??? Id, OptionId
  ??? Value (42, Black)
  ??? ThumbnailId (nullable)

ProductVariants
  ??? Id, ProductId
  ??? Sku, Price, Stock
  ??? ImageId

VariantValues (junction table)
  ??? VariantId
  ??? ValueId
```

## ?? Workflow

```
1. POST /api/v1/products
   ?
2. Create Product
   ?
3. Create ProductOptions (Size, Color)
   ?
4. Create OptionValues (42, 43, Black, White)
   ?
5. Create ProductVariants (SKUs)
   ?
6. Create VariantValues (mappings)
   ?
7. Update denormalized fields
   ?
8. Return product ID
```

## ?? Frontend Integration

### Step 1: Hi?n th? Options
```jsx
{product.options.map(option => (
  <div key={option.name}>
    <label>{option.name}</label>
    {option.displayType === 'color_swatch' ? (
      // Render color swatches v?i thumbnails
      <ColorSwatchPicker values={option.values} />
    ) : (
      // Render text buttons
      <ButtonGroup values={option.values} />
    )}
  </div>
))}
```

### Step 2: Tìm Variant
```javascript
// User ch?n Size=42, Color=Black
const selectedValues = {
  Size: '42',
  Color: 'Black'
};

// Tìm variant phù h?p
const variant = product.variants.find(v => {
  return v.selectedOptions.every(so => 
    selectedValues[so.optionName] === so.value
  );
});

// Hi?n th? thông tin variant
console.log(variant.price, variant.stock, variant.imageId);
```

### Step 3: Ho?c dùng API
```javascript
// L?y option value IDs
const valueIds = getSelectedValueIds(selectedValues);

// Call API
const response = await fetch(`/api/v1/products/${productId}/variants/find`, {
  method: 'POST',
  body: JSON.stringify({ valueIds })
});
```

## ?? Debugging

### Logs
```csharp
// Controller có log chi ti?t
_logger.LogInformation("Created product {ProductId} with {OptionCount} options", ...);
_logger.LogWarning("Could not find option value for {Key}", ...);
```

### Common Issues
1. **selectedOptions không kh?p** ? Check option name và value spelling
2. **Variant không có price** ? Thi?u trong request
3. **Options không hi?n th?** ? Check Include() trong query
4. **ThumbnailId null** ? Media ch?a upload ho?c ID sai

## ?? Additional Resources

- **API Docs**: `POST_Product_API_NewStructure.md`
- **Testing Guide**: `TESTING_CHECKLIST.md`
- **Sample Request**: `sample-product-request.json`
- **Migration File**: `../Migrations/AddDisplayTypeToProductOption.cs`

## ?? Contributing

Khi thêm display type m?i:
1. Thêm vào enum ho?c constant
2. Update frontend renderer
3. Update documentation
4. Add test cases

## ?? Support

Issues ho?c questions:
- Check logs trong controller
- Verify database v?i SQL queries ? trên
- Xem testing checklist
- Review API documentation

---

**Last Updated**: 2024
**Version**: 1.0
**Breaking Changes**: Yes (thêm options system)
