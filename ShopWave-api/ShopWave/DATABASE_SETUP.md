# Database Setup Guide - ShopWave

## Connection String ?ã c?u hình
```json
"DefaultConnection": "Server=DESKTOP-GMAM0VA;Database=ShopWaveDB;Trusted_Connection=True;TrustServerCertificate=True;"
```

## Các b??c setup database

### 1. T?o Migration
M? terminal trong th? m?c `ShopWave` và ch?y:
```bash
dotnet ef migrations add InitialCreate
```

### 2. C?p nh?t Database
```bash
dotnet ef database update
```

### 3. Ch?y Application
```bash
dotnet run
```

## Ki?m tra k?t n?i

Sau khi ch?y application, b?n có th? ki?m tra k?t n?i qua các endpoints:

### 1. Test Connection
```
GET https://localhost:5001/api/database/test-connection
```

### 2. Database Info
```
GET https://localhost:5001/api/database/info
```

### 3. List Tables
```
GET https://localhost:5001/api/database/tables
```

### 4. Ensure Database Created
```
POST https://localhost:5001/api/database/ensure-created
```

## Troubleshooting

### L?i k?t n?i th??ng g?p:

1. **SQL Server not running**
   - Kh?i ??ng SQL Server service
   - Ki?m tra SQL Server Configuration Manager

2. **Authentication failed**
   - ??m b?o Windows Authentication ???c enable
   - Ki?m tra user có quy?n truy c?p SQL Server

3. **Database not found**
   - Ch?y script `Scripts/CreateDatabase.sql` trong SSMS
   - Ho?c dùng endpoint `/api/database/ensure-created`

4. **Connection timeout**
   - Ki?m tra firewall settings
   - Ki?m tra SQL Server Network Configuration

### Manual Database Creation

N?u c?n t?o database th? công, ch?y script sau trong SQL Server Management Studio:

```sql
USE master;
GO

CREATE DATABASE [ShopWaveDB]
COLLATE SQL_Latin1_General_CP1_CI_AS;
GO

USE [ShopWaveDB];
GO
```

## Entity Framework Commands

### Useful EF Core Commands:

```bash
# Xem danh sách migrations
dotnet ef migrations list

# T?o migration m?i
dotnet ef migrations add <MigrationName>

# C?p nh?t database
dotnet ef database update

# Rollback migration
dotnet ef database update <PreviousMigrationName>

# Remove last migration (n?u ch?a apply)
dotnet ef migrations remove

# Generate SQL script
dotnet ef migrations script

# Drop database
dotnet ef database drop
```

## Database Schema

Sau khi ch?y migrations, database s? có các b?ng:

- `Users` - Ng??i dùng
- `Categories` - Danh m?c s?n ph?m
- `Products` - S?n ph?m
- `Reviews` - ?ánh giá
- `CartItems` - Gi? hàng
- `Orders` - ??n hàng
- `OrderItems` - Chi ti?t ??n hàng
- `WishlistItems` - Danh sách yêu thích
- `ProductRecommendations` - G?i ý s?n ph?m
- `BrowsingHistory` - L?ch s? duy?t
- `Notifications` - Thông báo
- `UserSettings` - Cài ??t ng??i dùng
- `UserSessions` - Phiên ??ng nh?p

## Sample Data

Application s? t? ??ng seed d? li?u m?u khi kh?i ??ng, bao g?m:
- Admin user: admin@shopwave.com / admin123
- Sample categories
- Sample products

## Performance Optimizations

Database ?ã ???c t?i ?u v?i:
- Indexes cho các tr??ng th??ng query
- Composite indexes cho foreign keys
- Proper column types cho SQL Server
- Constraints và relationships