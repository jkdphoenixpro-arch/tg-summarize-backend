@echo off
echo Starting Combined Bot + Game 21...
echo.
echo Opening 3 terminals:
echo 1. Backend (port 3001)
echo 2. Frontend (port 5173)
echo 3. Telegram Bot
echo.

start "Game Backend" cmd /k "cd game21\server && npm run dev"
timeout /t 3 /nobreak > nul

start "Game Frontend" cmd /k "cd game21\client && npm run dev"
timeout /t 3 /nobreak > nul

start "Telegram Bot" cmd /k "npm run combined"

echo.
echo All services started!
echo.
echo Check:
echo - Backend: http://localhost:3001
echo - Frontend: http://localhost:5173
echo - Bot: Check Telegram
echo.
pause
