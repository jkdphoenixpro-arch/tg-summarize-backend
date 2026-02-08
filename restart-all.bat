@echo off
echo ========================================
echo   Restarting All Services
echo ========================================
echo.
echo This will close all running services and restart them.
echo.
echo Make sure you have:
echo 1. Updated all .env files
echo 2. ngrok is running (if using HTTPS)
echo.
pause

echo.
echo Killing existing processes...
taskkill /F /IM node.exe 2>nul
timeout /t 2 /nobreak > nul

echo.
echo Starting services...
echo.

start "Game Backend" cmd /k "cd game21\server && npm run dev"
timeout /t 3 /nobreak > nul

start "Game Frontend" cmd /k "cd game21\client && npm run dev"
timeout /t 3 /nobreak > nul

start "Telegram Bot" cmd /k "npm run combined"

echo.
echo ========================================
echo   All services restarted!
echo ========================================
echo.
echo Check the opened windows for any errors.
echo.
echo Test in Telegram: /game21
echo.
pause
