@echo off
echo.
echo ==========================================
echo   ShopWave API - Safe Restart
echo ==========================================
echo.

echo [1/4] Process Cleanup...
tasklist | findstr ShopWave
taskkill /F /IM ShopWave.exe 2>nul
taskkill /F /IM dotnet.exe 2>nul
echo ? Processes cleaned
echo.

echo [2/4] Clean Build...
dotnet clean
dotnet restore
dotnet build
if %errorlevel% neq 0 (
    echo ? Build failed!
    pause
    exit /b 1
)
echo ? Build successful
echo.

echo [3/4] Trust SSL Certificate...
dotnet dev-certs https --trust --quiet
echo ? Certificate trusted
echo.

echo [4/4] Starting API...
echo.
echo ?? API URLs:
echo   - HTTPS: https://localhost:5001
echo   - HTTP:  http://localhost:5000  
echo   - Swagger: https://localhost:5001/swagger
echo   - Health: https://localhost:5001/health
echo.
echo ?? Wait for "Application started" message before testing
echo.

dotnet run --urls="https://localhost:5001;http://localhost:5000"