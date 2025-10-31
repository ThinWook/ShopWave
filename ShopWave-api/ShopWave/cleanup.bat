@echo off
echo.
echo ==========================================
echo   ShopWave API - Process Cleanup
echo ==========================================
echo.

echo [1/3] Checking running ShopWave processes...
tasklist | findstr ShopWave
echo.

echo [2/3] Stopping all ShopWave processes...
taskkill /F /IM ShopWave.exe 2>nul
taskkill /F /IM dotnet.exe /FI "WINDOWTITLE eq ShopWave*" 2>nul
echo.

echo [3/3] Cleaning ports...
echo Checking processes using ports 5000 and 5001...
for /f "tokens=5" %%a in ('netstat -ano ^| findstr :500') do (
    echo Killing process %%a
    taskkill /F /PID %%a 2>nul
)
echo.

echo ? Cleanup completed!
echo.
timeout /t 2 /nobreak > nul