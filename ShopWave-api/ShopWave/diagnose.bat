@echo off
echo.
echo ==========================================
echo   ShopWave API - Connection Diagnostic
echo ==========================================
echo.

cd /d "%~dp0"

echo [1/6] Checking .NET version...
dotnet --version
echo.

echo [2/6] Checking project files...
if exist "ShopWave.csproj" (
    echo ? Project file found
) else (
    echo ? Project file not found!
    pause
    exit /b 1
)
echo.

echo [3/6] Building project...
dotnet build --configuration Debug
if %errorlevel% neq 0 (
    echo ? Build failed!
    pause
    exit /b 1
)
echo ? Build successful
echo.

echo [4/6] Checking ports...
echo Checking if port 5001 is available...
netstat -an | findstr :5001
if %errorlevel% equ 0 (
    echo ??  Port 5001 is already in use!
    echo Available processes using port 5001:
    netstat -ano | findstr :5001
    echo.
    echo You can kill the process with: taskkill /F /PID [PID]
    echo Or use alternative port with: dotnet run --urls="https://localhost:5002"
) else (
    echo ? Port 5001 is available
)
echo.

echo [5/6] Testing SSL certificate...
echo Trusting development certificates...
dotnet dev-certs https --trust
echo.

echo [6/6] Starting API with diagnostics...
echo.
echo ?? API will be available at:
echo   - Main: https://localhost:5001
echo   - Swagger: https://localhost:5001/swagger  
echo   - Health: https://localhost:5001/health
echo   - Alt HTTP: http://localhost:5000/swagger
echo.
echo ?? If Swagger doesn't open automatically:
echo   1. Wait for "Application started" message
echo   2. Manually open: https://localhost:5001/swagger
echo   3. Or try HTTP version: http://localhost:5000/swagger
echo.

timeout /t 3 /nobreak > nul

echo Starting application...
dotnet run --urls="https://localhost:5001;http://localhost:5000"