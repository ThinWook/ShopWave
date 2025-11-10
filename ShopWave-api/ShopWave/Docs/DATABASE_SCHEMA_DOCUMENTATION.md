# MÔ T? C? S? D? LI?U - SHOPWAVE E-COMMERCE

## ?? T?ng quan

Tài li?u này mô t? chi ti?t c?u trúc c? s? d? li?u c?a h? th?ng ShopWave E-commerce, bao g?m 26 b?ng chính ???c chia thành 7 nhóm ch?c n?ng.

**Công ngh?**: SQL Server + Entity Framework Core  
**Phiên b?n**: .NET 8  
**Ngày c?p nh?t**: 2024

---

## ?? S? ?? t?ng quan

```
???????????????????????????????????????????????????????????????????????
?                         SHOPWAVE DATABASE                            ?
???????????????????????????????????????????????????????????????????????
?                                                                       ?
?  ?? USER MANAGEMENT        ??? PRODUCT MANAGEMENT                    ?
?  ??? Users                 ??? Products                              ?
?  ??? UserSessions          ??? ProductVariants                       ?
?  ??? UserSettings          ??? ProductOptions                        ?
?  ??? UserMedia             ??? OptionValues                          ?
?                            ??? VariantValues                         ?
?  ?? CART & WISHLIST        ??? ProductMedia                          ?
?  ??? Carts                                                            ?
?  ??? CartItems             ?? ORDER MANAGEMENT                       ?
?                            ??? Orders                                 ?
?  ?? DISCOUNT & PRICING     ??? OrderItems                            ?
?  ??? Discounts             ??? Transactions                          ?
?  ??? AppliedDiscounts                                                ?
?  ??? DiscountTiers         ?? MEDIA & CATEGORY                       ?
?                            ??? Media                                  ?
?  ?? LOCATION & SHIPPING    ??? Categories                            ?
?  ??? Provinces             ??? Notifications                         ?
?  ??? Districts                                                        ?
?  ??? Wards                                                            ?
?  ??? ShippingRates                                                    ?
?                                                                       ?
???????????????????????????????????????????????????????????????????????
```

---

## 1. ?? USER MANAGEMENT (Qu?n lý ng??i dùng)

### 1.1. B?ng Users

**Mô t?**: L?u tr? thông tin tài kho?n ng??i dùng

| C?t          | Ki?u          | M?c ??nh      | Liên k?t t?i    | Ghi chú                                  |
|--------------|---------------|---------------|-----------------|------------------------------------------|
| Id           | uniqueidentifier | NewGuid()  |                 | PRIMARY KEY                              |
| Email        | nvarchar(255) |               |                 | UNIQUE, NOT NULL, Email verification     |
| PasswordHash | nvarchar(255) |               |                 | NOT NULL, Hashed password                |
| FullName     | nvarchar(255) |               |                 | NOT NULL                                 |
| Phone        | nvarchar(20)  | NULL          |                 | Optional                                 |
| Role         | nvarchar(50)  | 'Customer'    |                 | NOT NULL (Customer, Admin)               |
| IsActive     | bit           | 1             |                 | Account status                           |
| CreatedAt    | datetime2     | GETUTCDATE()  |                 | NOT NULL                                 |
| UpdatedAt    | datetime2     | GETUTCDATE()  |                 | NOT NULL                                 |

**Indexes**:
- `IX_Users_Email` (UNIQUE)

**Relationships**:
- Has many `Orders` (1:N)
- Has many `Notifications` (1:N)
- Has many `UserSettings` (1:N)
- Has many `UserSessions` (1:N)
- Has many `UserMedia` (1:N)

---

### 1.2. B?ng UserSessions

**Mô t?**: Qu?n lý phiên ??ng nh?p c?a ng??i dùng

| C?t          | Ki?u          | M?c ??nh     | Liên k?t t?i | Ghi chú                    |
|--------------|---------------|--------------|--------------|----------------------------|
| Id           | uniqueidentifier | NewGuid() |              | PRIMARY KEY                |
| UserId       | uniqueidentifier |           | Users.Id     | NOT NULL, Foreign Key      |
| SessionToken | nvarchar(255) |              |              | NOT NULL, JWT token        |
| IpAddress    | nvarchar(45)  | NULL         |              | IPv4/IPv6                  |
| UserAgent    | nvarchar(500) | NULL         |              | Browser info               |
| CreatedAt    | datetime2     | GETUTCDATE() |              | NOT NULL                   |
| LastActivity | datetime2     | GETUTCDATE() |              | NOT NULL                   |
| ExpiresAt    | datetime2     |              |              | NOT NULL                   |

**Relationships**:
- Belongs to `Users` (N:1)

---

### 1.3. B?ng UserSettings

**Mô t?**: L?u tr? cài ??t cá nhân c?a ng??i dùng (key-value)

| C?t          | Ki?u           | M?c ??nh     | Liên k?t t?i | Ghi chú                      |
|--------------|----------------|--------------|--------------|------------------------------|
| Id           | uniqueidentifier | NewGuid()  |              | PRIMARY KEY                  |
| UserId       | uniqueidentifier |            | Users.Id     | NOT NULL, Foreign Key        |
| SettingKey   | nvarchar(100)  |              |              | NOT NULL                     |
| SettingValue | nvarchar(1000) | NULL         |              | JSON or string               |
| CreatedAt    | datetime2      | GETUTCDATE() |              | NOT NULL                     |
| UpdatedAt    | datetime2      | GETUTCDATE() |              | NOT NULL                     |

**Indexes**:
- `IX_UserSettings_UserId_SettingKey` (UNIQUE)

**Relationships**:
- Belongs to `Users` (N:1)

---

### 1.4. B?ng UserMedia

**Mô t?**: Liên k?t gi?a ng??i dùng và media (avatar, cover)

| C?t       | Ki?u             | M?c ??nh | Liên k?t t?i | Ghi chú                                    |
|-----------|------------------|----------|--------------|---------------------------------------------|
| UserId    | uniqueidentifier |          | Users.Id     | Composite PRIMARY KEY, Foreign Key          |
| MediaId   | bigint           |          | Media.Id     | Composite PRIMARY KEY, Foreign Key          |
| MediaType | varchar(50)      |          |              | Composite PRIMARY KEY ('avatar', 'cover')   |

**Relationships**:
- Belongs to `Users` (N:1)
- Belongs to `Media` (N:1)

---

## 2. ??? PRODUCT MANAGEMENT (Qu?n lý s?n ph?m)

### 2.1. B?ng Products

**Mô t?**: Thông tin s?n ph?m chính (t?ng quan)

| C?t            | Ki?u             | M?c ??nh     | Liên k?t t?i   | Ghi chú                               |
|----------------|------------------|--------------|----------------|---------------------------------------|
| Id             | uniqueidentifier | NewGuid()    |                | PRIMARY KEY                           |
| Name           | nvarchar(255)    |              |                | NOT NULL                              |
| Description    | nvarchar(2000)   | NULL         |                | Product description                   |
| CategoryId     | uniqueidentifier |              | Categories.Id  | NOT NULL, Foreign Key                 |
| MediaId        | bigint           | NULL         | Media.Id       | Foreign Key, Main product image       |
| DisplayPrice   | decimal(18,2)    | 0            |                | Min price among variants (denormalized) |
| TotalInventory | int              | 0            |                | Sum of variant stocks (denormalized)  |
| VariantCount   | int              | 0            |                | Number of variants (denormalized)     |
| Popularity     | int              | 0            |                | View count or rating score            |
| IsActive       | bit              | 1            |                | Product visibility                    |
| CreatedAt      | datetime2        | GETUTCDATE() |                | NOT NULL                              |
| UpdatedAt      | datetime2        | GETUTCDATE() |                | NOT NULL                              |

**Indexes**:
- `IX_Products_CategoryId`
- `IX_Products_MediaId`

**Relationships**:
- Belongs to `Categories` (N:1)
- Belongs to `Media` (N:1) optional
- Has many `ProductVariants` (1:N)
- Has many `ProductOptions` (1:N)
- Has many `ProductMedia` (1:N)

---

### 2.2. B?ng ProductVariants

**Mô t?**: Bi?n th? s?n ph?m (size, màu, v.v.)

| C?t       | Ki?u             | M?c ??nh | Liên k?t t?i | Ghi chú                        |
|-----------|------------------|----------|--------------|--------------------------------|
| Id        | uniqueidentifier | NewGuid()|              | PRIMARY KEY                    |
| ProductId | uniqueidentifier |          | Products.Id  | NOT NULL, Foreign Key          |
| Sku       | nvarchar(100)    |          |              | NOT NULL, Stock Keeping Unit   |
| Price     | decimal(18,2)    |          |              | NOT NULL                       |
| Stock     | int              |          |              | NOT NULL, Available quantity   |
| ImageId   | bigint           | NULL     | Media.Id     | Foreign Key, Variant image     |

**Indexes**:
- `IX_ProductVariants_ProductId`
- `IX_ProductVariants_ImageId`

**Relationships**:
- Belongs to `Products` (N:1)
- Belongs to `Media` (N:1) optional
- Has many `VariantValues` (1:N)

---

### 2.3. B?ng ProductOptions

**Mô t?**: Tùy ch?n s?n ph?m (Color, Size, Material, v.v.)

| C?t         | Ki?u             | M?c ??nh | Liên k?t t?i | Ghi chú                                          |
|-------------|------------------|----------|--------------|--------------------------------------------------|
| Id          | uniqueidentifier | NewGuid()|              | PRIMARY KEY                                      |
| ProductId   | uniqueidentifier |          | Products.Id  | NOT NULL, Foreign Key                            |
| Name        | nvarchar(255)    |          |              | NOT NULL (e.g., 'Color', 'Size')                 |
| DisplayType | nvarchar(50)     | NULL     |              | 'text_button', 'color_swatch', 'dropdown', etc.  |

**Indexes**:
- `IX_ProductOptions_ProductId`

**Relationships**:
- Belongs to `Products` (N:1)
- Has many `OptionValues` (1:N)

---

### 2.4. B?ng OptionValues

**Mô t?**: Giá tr? c?a t?ng option (Red, Blue, M, L, v.v.)

| C?t         | Ki?u             | M?c ??nh | Liên k?t t?i      | Ghi chú                       |
|-------------|------------------|----------|-------------------|-------------------------------|
| Id          | uniqueidentifier | NewGuid()|                   | PRIMARY KEY                   |
| OptionId    | uniqueidentifier |          | ProductOptions.Id | NOT NULL, Foreign Key         |
| Value       | nvarchar(255)    |          |                   | NOT NULL (e.g., 'Red', 'M')   |
| ThumbnailId | bigint           | NULL     | Media.Id          | Foreign Key, Thumbnail image  |

**Indexes**:
- `IX_OptionValues_OptionId`
- `IX_OptionValues_ThumbnailId`

**Relationships**:
- Belongs to `ProductOptions` (N:1)
- Belongs to `Media` (N:1) optional

---

### 2.5. B?ng VariantValues

**Mô t?**: Ánh x? gi?a variant và các option values (Many-to-Many)

| C?t       | Ki?u             | M?c ??nh | Liên k?t t?i       | Ghi chú                              |
|-----------|------------------|----------|---------------------|--------------------------------------|
| VariantId | uniqueidentifier |          | ProductVariants.Id  | Composite PRIMARY KEY, Foreign Key   |
| ValueId   | uniqueidentifier |          | OptionValues.Id     | Composite PRIMARY KEY, Foreign Key   |

**Relationships**:
- Belongs to `ProductVariants` (N:1)
- Belongs to `OptionValues` (N:1)

**Ví d?**: Variant "Áo thun ?? size M" có 2 records trong b?ng này:
- `VariantId` = X, `ValueId` = (OptionValue cho "Red")
- `VariantId` = X, `ValueId` = (OptionValue cho "M")

---

### 2.6. B?ng ProductMedia

**Mô t?**: Liên k?t gi?a s?n ph?m và nhi?u hình ?nh (Many-to-Many)

| C?t          | Ki?u             | M?c ??nh | Liên k?t t?i | Ghi chú                              |
|--------------|------------------|----------|--------------|--------------------------------------|
| ProductId    | uniqueidentifier |          | Products.Id  | Composite PRIMARY KEY, Foreign Key   |
| MediaId      | bigint           |          | Media.Id     | Composite PRIMARY KEY, Foreign Key   |
| DisplayOrder | int              | 0        |              | Image display order                  |

**Relationships**:
- Belongs to `Products` (N:1)
- Belongs to `Media` (N:1)

---

## 3. ?? CART & WISHLIST (Gi? hàng)

### 3.1. B?ng Carts

**Mô t?**: Gi? hàng c?a ng??i dùng ho?c khách (session-based)

| C?t       | Ki?u             | M?c ??nh     | Liên k?t t?i | Ghi chú                                |
|-----------|------------------|--------------|--------------|----------------------------------------|
| Id        | uniqueidentifier | NewGuid()    |              | PRIMARY KEY                            |
| UserId    | uniqueidentifier | NULL         | Users.Id     | Foreign Key (NULL for guest)           |
| SessionId | nvarchar(100)    | NULL         |              | For guest users                        |
| CreatedAt | datetime2        | GETUTCDATE() |              | NOT NULL                               |
| UpdatedAt | datetime2        | GETUTCDATE() |              | NOT NULL                               |

**Indexes**:
- `IX_Carts_UserId`
- `IX_Carts_SessionId`

**Relationships**:
- Belongs to `Users` (N:1) optional
- Has many `CartItems` (1:N)
- Has many `AppliedDiscounts` (1:N)

---

### 3.2. B?ng CartItems

**Mô t?**: Các s?n ph?m trong gi? hàng

| C?t              | Ki?u             | M?c ??nh     | Liên k?t t?i       | Ghi chú                   |
|------------------|------------------|--------------|---------------------|---------------------------|
| Id               | uniqueidentifier | NewGuid()    |                     | PRIMARY KEY               |
| CartId           | uniqueidentifier |              | Carts.Id            | NOT NULL, Foreign Key     |
| ProductVariantId | uniqueidentifier |              | ProductVariants.Id  | NOT NULL, Foreign Key     |
| Quantity         | int              |              |                     | NOT NULL                  |
| UnitPrice        | decimal(18,2)    |              |                     | NOT NULL, Snapshot price  |
| CreatedAt        | datetime2        | GETUTCDATE() |                     | NOT NULL                  |
| UpdatedAt        | datetime2        | GETUTCDATE() |                     | NOT NULL                  |

**Indexes**:
- `IX_CartItems_CartId`
- `IX_CartItems_ProductVariantId`

**Relationships**:
- Belongs to `Carts` (N:1)
- Belongs to `ProductVariants` (N:1)

---

## 4. ?? DISCOUNT & PRICING (Gi?m giá)

### 4.1. B?ng Discounts

**Mô t?**: Mã gi?m giá (voucher)

| C?t            | Ki?u          | M?c ??nh     | Liên k?t t?i | Ghi chú                                    |
|----------------|---------------|--------------|--------------|---------------------------------------------|
| Id             | uniqueidentifier | NewGuid() |              | PRIMARY KEY                                 |
| Code           | nvarchar(50)  |              |              | NOT NULL, UNIQUE (e.g., 'NOV40')            |
| Description    | nvarchar(500) | NULL         |              | Voucher description                         |
| DiscountType   | int           |              |              | NOT NULL (0=PERCENTAGE, 1=FIXED_AMOUNT)     |
| DiscountValue  | decimal(18,2) |              |              | NOT NULL (e.g., 15 for 15% or 15000 VND)    |
| MinOrderAmount | decimal(18,2) |              |              | NOT NULL, Minimum order to apply            |
| StartDate      | datetime2     | NULL         |              | Valid from                                  |
| EndDate        | datetime2     | NULL         |              | Valid until                                 |
| UsageLimit     | int           | NULL         |              | Max usage count (NULL = unlimited)          |
| UsageCount     | int           | 0            |              | Current usage count                         |
| IsActive       | bit           | 1            |              | Voucher status                              |
| CreatedAt      | datetime2     | GETUTCDATE() |              | NOT NULL                                    |
| UpdatedAt      | datetime2     | GETUTCDATE() |              | NOT NULL                                    |

**Indexes**:
- `IX_Discounts_Code` (UNIQUE)

**Relationships**:
- Has many `AppliedDiscounts` (1:N)

---

### 4.2. B?ng AppliedDiscounts

**Mô t?**: Liên k?t gi? hàng v?i voucher ?ã áp d?ng

| Cót                   | Ki?u             | M?c ??nh     | Liên k?t t?i | Ghi chú                   |
|-----------------------|------------------|--------------|--------------|---------------------------|
| Id                    | uniqueidentifier | NewGuid()    |              | PRIMARY KEY               |
| CartId                | uniqueidentifier |              | Carts.Id     | NOT NULL, Foreign Key     |
| DiscountId            | uniqueidentifier |              | Discounts.Id | NOT NULL, Foreign Key     |
| DiscountAmountApplied | decimal(18,2)    |              |              | NOT NULL, Calculated      |
| AppliedAt             | datetime2        | GETUTCDATE() |              | NOT NULL                  |

**Indexes**:
- `IX_AppliedDiscounts_CartId`
- `IX_AppliedDiscounts_DiscountId`

**Relationships**:
- Belongs to `Carts` (N:1)
- Belongs to `Discounts` (N:1)

---

### 4.3. B?ng DiscountTiers

**Mô t?**: Ch??ng trình gi?m giá theo b?c (Progressive Discount)

| C?t             | Ki?u          | M?c ??nh     | Liên k?t t?i | Ghi chú                                  |
|-----------------|---------------|--------------|--------------|------------------------------------------|
| Id              | uniqueidentifier | NewGuid() |              | PRIMARY KEY                              |
| ThresholdAmount | decimal(18,2) |              |              | NOT NULL (e.g., 300000 for 300k VND)     |
| DiscountValue   | decimal(18,2) |              |              | NOT NULL (e.g., 15000 for 15k VND off)   |
| Description     | nvarchar(500) | NULL         |              | Tier description                         |
| IsActive        | bit           | 1            |              | Tier status                              |
| CreatedAt       | datetime2     | GETUTCDATE() |              | NOT NULL                                 |
| UpdatedAt       | datetime2     | GETUTCDATE() |              | NOT NULL                                 |

**Ví d?**:
- Threshold 300,000 VND ? Gi?m 15,000 VND
- Threshold 500,000 VND ? Gi?m 50,000 VND
- Threshold 1,000,000 VND ? Gi?m 100,000 VND

---

## 5. ?? ORDER MANAGEMENT (Qu?n lý ??n hàng)

### 5.1. B?ng Orders

**Mô t?**: ??n hàng c?a khách (h? tr? c? guest checkout)

| C?t                         | Ki?u             | M?c ??nh     | Liên k?t t?i | Ghi chú                                      |
|-----------------------------|------------------|--------------|--------------|----------------------------------------------|
| Id                          | uniqueidentifier | NewGuid()    |              | PRIMARY KEY                                  |
| UserId                      | uniqueidentifier | NULL         | Users.Id     | Foreign Key (NULL for guest orders)          |
| OrderNumber                 | nvarchar(50)     |              |              | NOT NULL, UNIQUE (e.g., 'ORD202412250001')   |
| OrderDate                   | datetime2        | GETUTCDATE() |              | NOT NULL                                     |
| Status                      | nvarchar(50)     | 'PROCESSING' |              | NOT NULL (PROCESSING, SHIPPED, DELIVERED...) |
| PaymentStatus               | nvarchar(50)     | 'UNPAID'     |              | NOT NULL (UNPAID, PAID, REFUNDED)            |
| PaymentMethod               | nvarchar(100)    | NULL         |              | COD, VNPAY, MOMO                             |
| SubTotal                    | decimal(18,2)    |              |              | NOT NULL, Sum of items                       |
| ShippingFee                 | decimal(18,2)    |              |              | NOT NULL                                     |
| DiscountAmount              | decimal(18,2)    |              |              | NOT NULL, Total discount (backward compat)   |
| ProgressiveDiscountAmount   | decimal(18,2)    |              |              | NOT NULL, Discount from tiers                |
| VoucherDiscountAmount       | decimal(18,2)    |              |              | NOT NULL, Discount from voucher              |
| VoucherCode                 | nvarchar(50)     | NULL         |              | Applied voucher code                         |
| TotalAmount                 | decimal(18,2)    |              |              | NOT NULL, Final total                        |
| ShippingFullName            | nvarchar(100)    |              |              | NOT NULL                                     |
| ShippingPhone               | nvarchar(20)     |              |              | NOT NULL                                     |
| ShippingStreet              | nvarchar(500)    |              |              | NOT NULL                                     |
| ShippingWard                | nvarchar(100)    |              |              | NOT NULL                                     |
| ShippingDistrict            | nvarchar(100)    |              |              | NOT NULL                                     |
| ShippingProvince            | nvarchar(100)    |              |              | NOT NULL                                     |
| ShippingNotes               | nvarchar(500)    | NULL         |              | Optional                                     |
| BillingFullName             | nvarchar(100)    | NULL         |              | Optional                                     |
| BillingPhone                | nvarchar(20)     | NULL         |              | Optional                                     |
| BillingStreet               | nvarchar(500)    | NULL         |              | Optional                                     |
| BillingWard                 | nvarchar(100)    | NULL         |              | Optional                                     |
| BillingDistrict             | nvarchar(100)    | NULL         |              | Optional                                     |
| BillingProvince             | nvarchar(100)    | NULL         |              | Optional                                     |
| BillingNotes                | nvarchar(500)    | NULL         |              | Optional                                     |
| ShippedDate                 | datetime2        | NULL         |              | When shipped                                 |
| DeliveredDate               | datetime2        | NULL         |              | When delivered                               |
| CreatedAt                   | datetime2        | GETUTCDATE() |              | NOT NULL                                     |
| UpdatedAt                   | datetime2        | GETUTCDATE() |              | NOT NULL                                     |

**Indexes**:
- `IX_Orders_UserId`

**Relationships**:
- Belongs to `Users` (N:1) optional
- Has many `OrderItems` (1:N)
- Has many `Transactions` (1:N)

---

### 5.2. B?ng OrderItems

**Mô t?**: Chi ti?t s?n ph?m trong ??n hàng (snapshot)

| C?t              | Ki?u             | M?c ??nh     | Liên k?t t?i       | Ghi chú                              |
|------------------|------------------|--------------|---------------------|--------------------------------------|
| Id               | uniqueidentifier | NewGuid()    |                     | PRIMARY KEY                          |
| OrderId          | uniqueidentifier |              | Orders.Id           | NOT NULL, Foreign Key                |
| ProductVariantId | uniqueidentifier |              | ProductVariants.Id  | NOT NULL, Foreign Key                |
| ProductName      | nvarchar(255)    |              |                     | NOT NULL, Snapshot                   |
| Quantity         | int              |              |                     | NOT NULL                             |
| UnitPrice        | decimal(18,2)    |              |                     | NOT NULL, Price at time of order     |
| TotalPrice       | decimal(18,2)    |              |                     | NOT NULL, Quantity × UnitPrice       |
| VariantImageUrl  | nvarchar(1000)   | NULL         |                     | Snapshot image URL                   |
| SelectedOptions  | nvarchar(max)    | NULL         |                     | JSON (e.g., [{"Name":"Color","Value":"Red"}]) |
| CreatedAt        | datetime2        | GETUTCDATE() |                     | NOT NULL                             |

**Indexes**:
- `IX_OrderItems_OrderId`
- `IX_OrderItems_ProductVariantId`

**Relationships**:
- Belongs to `Orders` (N:1)
- Belongs to `ProductVariants` (N:1)

---

### 5.3. B?ng Transactions

**Mô t?**: Giao d?ch thanh toán (COD, VNPay, MoMo)

| C?t                    | Ki?u             | M?c ??nh     | Liên k?t t?i | Ghi chú                                     |
|------------------------|------------------|--------------|--------------|---------------------------------------------|
| Id                     | uniqueidentifier | NewGuid()    |              | PRIMARY KEY                                 |
| OrderId                | uniqueidentifier |              | Orders.Id    | NOT NULL, Foreign Key                       |
| Gateway                | nvarchar(50)     |              |              | NOT NULL (COD, VNPAY, MOMO)                 |
| GatewayTransactionId   | nvarchar(255)    | NULL         |              | Transaction ID from gateway                 |
| Amount                 | decimal(18,2)    |              |              | NOT NULL                                    |
| Status                 | nvarchar(50)     | 'PENDING'    |              | NOT NULL (PENDING, SUCCESS, FAILED)         |
| TransactionType        | nvarchar(50)     |              |              | NOT NULL (PAYMENT, REFUND)                  |
| GatewayResponse        | nvarchar(max)    | NULL         |              | JSON response from gateway                  |
| ErrorMessage           | nvarchar(1000)   | NULL         |              | Error details if failed                     |
| IpAddress              | nvarchar(45)     | NULL         |              | IP of user                                  |
| UserAgent              | nvarchar(500)    | NULL         |              | Browser info                                |
| CreatedAt              | datetime2        | GETUTCDATE() |              | NOT NULL                                    |
| UpdatedAt              | datetime2        | GETUTCDATE() |              | NOT NULL                                    |
| CompletedAt            | datetime2        | NULL         |              | When transaction completed                  |

**Indexes**:
- `IX_Transactions_OrderId_Status`
- `IX_Transactions_GatewayTransactionId`

**Relationships**:
- Belongs to `Orders` (N:1)

---

## 6. ?? MEDIA & CATEGORY (Media & Danh m?c)

### 6.1. B?ng Media

**Mô t?**: L?u tr? thông tin file media (hình ?nh, video)

| C?t              | Ki?u          | M?c ??nh     | Liên k?t t?i | Ghi chú                           |
|------------------|---------------|--------------|--------------|-----------------------------------|
| Id               | bigint        | IDENTITY(1,1)|              | PRIMARY KEY                       |
| FileName         | nvarchar(255) |              |              | NOT NULL                          |
| OriginalFileName | nvarchar(255) | NULL         |              | Original upload name              |
| Url              | nvarchar(max) |              |              | NOT NULL, Full URL or path        |
| MimeType         | varchar(100)  | NULL         |              | image/jpeg, image/png, etc.       |
| FileSize         | bigint        | NULL         |              | File size in bytes                |
| Category         | varchar(50)   | NULL         |              | 'product', 'avatar', 'banner'...  |
| CreatedAt        | datetime2     | GETUTCDATE() |              | NOT NULL                          |

**Relationships**:
- Referenced by `Products.MediaId`
- Referenced by `ProductVariants.ImageId`
- Referenced by `OptionValues.ThumbnailId`
- Referenced by `UserMedia`
- Referenced by `ProductMedia`

---

### 6.2. B?ng Categories

**Mô t?**: Danh m?c s?n ph?m (h? tr? phân c?p)

| C?t         | Ki?u             | M?c ??nh     | Liên k?t t?i   | Ghi chú                            |
|-------------|------------------|--------------|----------------|------------------------------------|
| Id          | uniqueidentifier | NewGuid()    |                | PRIMARY KEY                        |
| Name        | nvarchar(255)    |              |                | NOT NULL                           |
| Description | nvarchar(1000)   | NULL         |                | Category description               |
| ParentId    | uniqueidentifier | NULL         | Categories.Id  | Foreign Key, Self-reference        |
| ImageUrl    | nvarchar(500)    | NULL         |                | Category image                     |
| SortOrder   | int              | 0            |                | Display order                      |
| IsActive    | bit              | 1            |                | Category visibility                |
| CreatedAt   | datetime2        | GETUTCDATE() |                | NOT NULL                           |
| UpdatedAt   | datetime2        | GETUTCDATE() |                | NOT NULL                           |

**Indexes**:
- `IX_Categories_ParentId`

**Relationships**:
- Self-reference: `ParentCategory` (N:1)
- Has many `SubCategories` (1:N)
- Has many `Products` (1:N)

---

### 6.3. B?ng Notifications

**Mô t?**: Thông báo cho ng??i dùng

| C?t       | Ki?u             | M?c ??nh     | Liên k?t t?i | Ghi chú                                 |
|-----------|------------------|--------------|--------------|------------------------------------------|
| Id        | uniqueidentifier | NewGuid()    |              | PRIMARY KEY                              |
| UserId    | uniqueidentifier |              | Users.Id     | NOT NULL, Foreign Key                    |
| Type      | nvarchar(50)     |              |              | NOT NULL (ORDER_UPDATE, PROMO, etc.)     |
| Title     | nvarchar(255)    |              |              | NOT NULL                                 |
| Message   | nvarchar(2000)   |              |              | NOT NULL                                 |
| IsRead    | bit              | 0            |              | Read status                              |
| ReadAt    | datetime2        | NULL         |              | When read                                |
| CreatedAt | datetime2        | GETUTCDATE() |              | NOT NULL                                 |

**Indexes**:
- `IX_Notifications_UserId`

**Relationships**:
- Belongs to `Users` (N:1)

---

## 7. ?? LOCATION & SHIPPING (??a ?i?m & V?n chuy?n)

### 7.1. B?ng Provinces

**Mô t?**: T?nh/Thành ph? (Vi?t Nam)

| C?t  | Ki?u          | M?c ??nh | Liên k?t t?i | Ghi chú           |
|------|---------------|----------|--------------|-------------------|
| Id   | int           |          |              | PRIMARY KEY       |
| Name | nvarchar(100) |          |              | NOT NULL          |
| Code | nvarchar(20)  | NULL     |              | Province code     |

**Indexes**:
- `IX_Provinces_Name`

**Relationships**:
- Has many `Districts` (1:N)

---

### 7.2. B?ng Districts

**Mô t?**: Qu?n/Huy?n

| C?t        | Ki?u          | M?c ??nh | Liên k?t t?i | Ghi chú           |
|------------|---------------|----------|--------------|-------------------|
| Id         | int           |          |              | PRIMARY KEY       |
| Name       | nvarchar(100) |          |              | NOT NULL          |
| ProvinceId | int           |          | Provinces.Id | NOT NULL, Foreign Key |

**Indexes**:
- `IX_Districts_ProvinceId`

**Relationships**:
- Belongs to `Provinces` (N:1)
- Has many `Wards` (1:N)

---

### 7.3. B?ng Wards

**Mô t?**: Ph??ng/Xã

| C?t        | Ki?u          | M?c ??nh | Liên k?t t?i | Ghi chú           |
|------------|---------------|----------|--------------|-------------------|
| Id         | int           |          |              | PRIMARY KEY       |
| Name       | nvarchar(100) |          |              | NOT NULL          |
| DistrictId | int           |          | Districts.Id | NOT NULL, Foreign Key |

**Indexes**:
- `IX_Wards_DistrictId`

**Relationships**:
- Belongs to `Districts` (N:1)

---

### 7.4. B?ng ShippingRates

**Mô t?**: Phí v?n chuy?n theo t?nh

| C?t       | Ki?u          | M?c ??nh     | Liên k?t t?i | Ghi chú                  |
|-----------|---------------|--------------|--------------|--------------------------|
| Id        | uniqueidentifier | NewGuid() |              | PRIMARY KEY              |
| Province  | nvarchar(100) |              |              | NOT NULL, UNIQUE         |
| Fee       | decimal(18,2) |              |              | NOT NULL, Shipping fee   |
| CreatedAt | datetime2     | GETUTCDATE() |              | NOT NULL                 |
| UpdatedAt | datetime2     | GETUTCDATE() |              | NOT NULL                 |

**Indexes**:
- `IX_ShippingRates_Province` (UNIQUE)

---

## ?? Tóm t?t quan h? chính

### **Products ? Variants ? Options**
```
Products (1) ??? (N) ProductVariants
    ?                      ?
    ?                      ???? (N) VariantValues ????
    ?                                                  ?
    ???? (N) ProductOptions                          ?
              ?                                       ?
              ???? (N) OptionValues ???????????????????
```

### **Cart ? Items ? Discounts**
```
Carts (1) ??? (N) CartItems ??? (N) ProductVariants
   ?
   ???? (N) AppliedDiscounts ??? (N) Discounts
```

### **Order ? Items ? Transactions**
```
Orders (1) ??? (N) OrderItems ??? (N) ProductVariants
    ?
    ???? (N) Transactions
```

### **Location Hierarchy**
```
Provinces (1) ??? (N) Districts (1) ??? (N) Wards
```

---

## ?? ??c ?i?m b?o m?t

1. **Password Hashing**: `Users.PasswordHash` l?u tr? m?t kh?u ?ã hash (BCrypt/SHA256)
2. **Session Management**: `UserSessions` theo dõi phiên ??ng nh?p v?i JWT token
3. **Guest Support**: `Carts` và `Orders` h? tr? `UserId = NULL` cho khách vãng lai
4. **Audit Trail**: T?t c? b?ng ??u có `CreatedAt` và `UpdatedAt` (tr? b?ng junction)
5. **Soft Delete**: S? d?ng `IsActive` thay vì xóa v?t lý

---

## ?? T?i ?u hi?u su?t

1. **Denormalization**: `Products` có `DisplayPrice`, `TotalInventory`, `VariantCount`
2. **Indexes**: 30+ indexes trên foreign keys và frequently queried columns
3. **Snapshot Data**: `OrderItems` l?u snapshot ?? tránh join khi query l?ch s?
4. **Decimal Precision**: `decimal(18,2)` cho t?t c? giá tr? ti?n t?
5. **Batch Processing**: `DbSeeder` x? lý 1000 records/batch khi seed Wards

---

## ??? Migration & Seeding

### **Entity Framework Migrations**
```bash
# T?o migration m?i
dotnet ef migrations add [MigrationName] --project ShopWave

# Apply migration
dotnet ef database update --project ShopWave

# Rollback migration
dotnet ef database update [PreviousMigrationName] --project ShopWave
```

### **Database Seeding**
```bash
# Seed location data (Provinces, Districts, Wards)
POST /api/v1/admin/seed/location

# Seed discount tiers
POST /api/v1/admin/seed/discount-tiers

# Seed sample data (Products, Categories)
POST /api/v1/admin/seed/sample-data
```

---

## ?? Tài li?u liên quan

- `CART_DISCOUNT_GUIDE.md` - H??ng d?n gi?m giá gi? hàng
- `PROGRESSIVE_DISCOUNT_IMPLEMENTATION.md` - Chi ti?t progressive discount
- `VNPAY_INTEGRATION_COMPLETE.md` - Tích h?p VNPay
- `CHECKOUT_PAYMENT_GUIDE.md` - Quy trình thanh toán
- `ADMIN_ORDERS_API.md` - API qu?n lý ??n hàng

---

**Phiên b?n**: 1.0  
**Ngày t?o**: 2024-12-25  
**Tác gi?**: ShopWave Development Team
