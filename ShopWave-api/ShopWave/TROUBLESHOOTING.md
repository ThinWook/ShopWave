# ?? ShopWave API Troubleshooting Guide

## ? V?n ??: Không m? ???c https://localhost:5001/swagger

### ?? Các b??c ki?m tra:

## 1. **Ki?m tra Build & Dependencies**
```bash
cd ShopWave
dotnet build
```
? N?u build thành công, chuy?n b??c 2
? N?u có l?i, xem ph?n "Build Errors" bên d??i

## 2. **Ki?m tra Database Connection**
```bash
# Trong th? m?c ShopWave
dotnet ef migrations add InitialCreate
dotnet ef database update
```

### N?u ch?a có EF Tools:
```bash
dotnet tool install --global dotnet-ef
```

## 3. **Ch?y Application**
```bash
dotnet run
```

### K?t qu? mong ??i:
```
?? Starting ShopWave API...
? Database connection verified successfully
?? Swagger UI: https://localhost:5001/swagger
?? API Base: https://localhost:5001/api
```

## 4. **Test Endpoints**

### Basic Health Check:
```
GET https://localhost:5001/
GET https://localhost:5001/health
```

### Database Test:
```
GET https://localhost:5001/api/database/test-connection
```

---

## ??? Common Issues & Solutions

### Issue 1: Port ?ã ???c s? d?ng
**Tri?u ch?ng:** `EADDRINUSE` ho?c `Address already in use`

**Gi?i pháp:**
```bash
# Tìm process ?ang dùng port 5001
netstat -ano | findstr :5001

# Kill process (thay <PID> b?ng process ID)
taskkill /F /PID <PID>
```

**Ho?c ??i port trong `Properties/launchSettings.json`:**
```json
{
  "profiles": {
    "https": {
      "applicationUrl": "https://localhost:5002;http://localhost:5003"
    }
  }
}
```

### Issue 2: Certificate SSL Issues
**Tri?u ch?ng:** `SSL certificate` errors

**Gi?i pháp:**
```bash
dotnet dev-certs https --trust
```

### Issue 3: Database Connection Failed
**Tri?u ch?ng:** `Cannot connect to database`

**Ki?m tra:**
1. SQL Server ?ang ch?y?
2. Connection string ?úng?
3. Database t?n t?i?

**Gi?i pháp:**
```bash
# T?o database th? công trong SQL Server Management Studio
USE master;
CREATE DATABASE [ShopWaveDB];

# Ho?c dùng API endpoint
POST https://localhost:5001/api/database/ensure-created
```

### Issue 4: Migration Issues
**Tri?u ch?ng:** `No migrations found` ho?c `Table doesn't exist`

**Gi?i pháp:**
```bash
# Xóa migrations c? (n?u có)
dotnet ef migrations remove

# T?o migration m?i
dotnet ef migrations add InitialCreate

# Apply migration
dotnet ef database update
```

### Issue 5: Build Errors
**Các l?i th??ng g?p:**

#### CS0246: Type not found
```bash
dotnet restore
dotnet clean
dotnet build
```

#### Package version conflicts
```bash
dotnet list package --outdated
dotnet add package <PackageName> --version <Version>
```

---

## ?? Step-by-step Testing

### 1. **Ch?y startup script:**
```bash
# Windows
start.bat

# Manual
dotnet run
```

### 2. **Ki?m tra logs:**
Tìm các thông báo:
- ? `Database connection verified successfully`
- ? `Swagger UI: https://localhost:5001/swagger`
- ?? `Database connection failed` (v?n OK, Swagger s? ho?t ??ng)

### 3. **Test t?ng endpoint:**

#### Health Check:
```bash
curl https://localhost:5001/health
# Expected: {"status":"Healthy","timestamp":"..."}
```

#### Database Test:
```bash
curl https://localhost:5001/api/database/test-connection
# Expected: {"success":true,"message":"..."}
```

#### Swagger UI:
M? browser: `https://localhost:5001/swagger`

---

## ?? Quick Checklist

- [ ] .NET 8 SDK installed
- [ ] SQL Server running  
- [ ] Port 5001 available
- [ ] SSL certificate trusted
- [ ] EF Core tools installed
- [ ] Database exists
- [ ] Migrations applied
- [ ] No build errors
- [ ] Firewall allows localhost:5001

---

## ?? Emergency Commands

### Reset everything:
```bash
# Stop all running processes
taskkill /F /IM dotnet.exe

# Clean build
dotnet clean
dotnet restore
dotnet build

# Reset database
dotnet ef database drop
dotnet ef migrations remove
dotnet ef migrations add InitialCreate
dotnet ef database update

# Run
dotnet run
```

### Alternative ports:
```bash
dotnet run --urls="https://localhost:5002"
```

### Skip HTTPS:
```bash
dotnet run --urls="http://localhost:5000"
# Then access: http://localhost:5000/swagger
```

---

## ?? Getting Help

### Logs Location:
- Application logs: Console output
- IIS Express logs: `%USERPROFILE%\.vs\ShopWave\logs`

### Useful Commands:
```bash
# Check .NET version
dotnet --version

# Check EF version  
dotnet ef --version

# List migrations
dotnet ef migrations list

# Database info
dotnet ef dbcontext info
```

### Error Codes:
- **500**: Server error (check logs)
- **404**: Endpoint not found
- **CERT**: SSL certificate issue
- **EADDRINUSE**: Port conflict