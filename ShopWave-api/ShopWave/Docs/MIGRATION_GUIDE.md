# H??ng d?n t?o migration cho DisplayType

## B??c 1: D?ng server
Nh?n Ctrl+C trong terminal ?ang ch?y server

## B??c 2: T?o migration
```bash
cd C:\Users\HasHisShuU\source\repos\ShopWave\ShopWave-api\ShopWave
dotnet ef migrations add AddDisplayTypeToProductOption
```

## B??c 3: Apply migration
```bash
dotnet ef database update
```

## B??c 4: Kh?i ??ng l?i server
```bash
dotnet run
```

## N?u g?p l?i "file is locked"

### Cách 1: D?ng t? Task Manager
1. M? Task Manager (Ctrl+Shift+Esc)
2. Tìm process "ShopWave-api" ho?c "dotnet"
3. End Task

### Cách 2: Dùng PowerShell
```powershell
# Tìm process
Get-Process | Where-Object {$_.ProcessName -like "*ShopWave*"}

# Kill process (thay PID b?ng s? th?c t?)
Stop-Process -Id PID -Force
```

### Cách 3: Build thành công mà không c?n d?ng
N?u build thành công (nh? b?n ?ã th?y), b?n ch? c?n:
```bash
# Trong terminal khác (không ph?i terminal ?ang ch?y server)
cd C:\Users\HasHisShuU\source\repos\ShopWave\ShopWave-api\ShopWave
dotnet ef migrations add AddDisplayTypeToProductOption --no-build
```

## Ki?m tra migration ?ã t?o
File migration s? có format:
```
Migrations/YYYYMMDDHHMMSS_AddDisplayTypeToProductOption.cs
```

N?i dung nên có:
```csharp
protected override void Up(MigrationBuilder migrationBuilder)
{
    migrationBuilder.AddColumn<string>(
        name: "DisplayType",
        table: "ProductOptions",
        type: "nvarchar(50)",
        maxLength: 50,
        nullable: true);
}
```

## Verify trong database
```sql
-- Check column t?n t?i
SELECT COLUMN_NAME, DATA_TYPE, CHARACTER_MAXIMUM_LENGTH
FROM INFORMATION_SCHEMA.COLUMNS
WHERE TABLE_NAME = 'ProductOptions' AND COLUMN_NAME = 'DisplayType'
```

Expected result:
```
COLUMN_NAME   | DATA_TYPE | CHARACTER_MAXIMUM_LENGTH
DisplayType   | nvarchar  | 50
```
