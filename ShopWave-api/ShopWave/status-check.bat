@echo off
echo.
echo ========================================== 
echo   ShopWave API - Status Check
echo ==========================================
echo.

echo [1/4] Checking if ShopWave is running...
tasklist | findstr ShopWave.exe
if %errorlevel% equ 0 (
    echo ? ShopWave.exe is running
) else (
    echo ? ShopWave.exe is NOT running
)

tasklist | findstr dotnet.exe
if %errorlevel% equ 0 (
    echo ? dotnet.exe processes found
) else (
    echo ? No dotnet.exe processes
)
echo.

echo [2/4] Checking ports 5000 and 5001...
netstat -an | findstr :5000
if %errorlevel% equ 0 (
    echo ? Port 5000 is in use
) else (
    echo ? Port 5000 is free (app not listening)
)

netstat -an | findstr :5001  
if %errorlevel% equ 0 (
    echo ? Port 5001 is in use
) else (
    echo ? Port 5001 is free (app not listening)
)
echo.

echo [3/4] Testing basic connectivity...
curl -k -m 5 https://localhost:5001/health 2>nul
if %errorlevel% equ 0 (
    echo ? HTTPS endpoint responsive
) else (
    echo ? HTTPS endpoint not responding
)

curl -m 5 http://localhost:5000/health 2>nul
if %errorlevel% equ 0 (
    echo ? HTTP endpoint responsive  
) else (
    echo ? HTTP endpoint not responding
)
echo.

echo [4/4] SSL Certificate check...
dotnet dev-certs https --check --quiet
if %errorlevel% equ 0 (
    echo ? HTTPS certificate is valid
) else (
    echo ? HTTPS certificate issue
)
echo.

echo ==========================================
echo DIAGNOSIS COMPLETE
echo ==========================================
echo.
echo SOLUTION:
echo 1. If app not running: dotnet run
echo 2. If ports not listening: Check console for startup errors
echo 3. If HTTPS cert issue: dotnet dev-certs https --trust
echo 4. If connection reset: Try http://localhost:5000/swagger
echo.
pause