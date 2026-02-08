@echo off
echo ========================================
echo   Starting with ngrok (HTTPS)
echo ========================================
echo.
echo This will open 5 windows:
echo 1. Backend (port 3001)
echo 2. Frontend (port 5173)
echo 3. ngrok Backend (HTTPS tunnel)
echo 4. ngrok Frontend (HTTPS tunnel)
echo 5. Instructions
echo.
echo IMPORTANT:
echo After ngrok starts, you need to:
echo 1. Copy ngrok URLs from windows 3 and 4
echo 2. Update .env files with these URLs
echo 3. Restart backend, frontend, and bot
echo.
pause

start "Game Backend" cmd /k "cd game21\server && npm run dev"
timeout /t 2 /nobreak > nul

start "Game Frontend" cmd /k "cd game21\client && npm run dev"
timeout /t 2 /nobreak > nul

start "ngrok Backend" cmd /k "echo Backend ngrok (port 3001) && echo Copy the HTTPS URL && echo. && ngrok http 3001"
timeout /t 2 /nobreak > nul

start "ngrok Frontend" cmd /k "echo Frontend ngrok (port 5173) && echo Copy the HTTPS URL && echo. && ngrok http 5173"
timeout /t 2 /nobreak > nul

start "Instructions" cmd /k "echo. && echo ========================================== && echo   ngrok URLs Setup && echo ========================================== && echo. && echo 1. Copy Backend ngrok URL (https://xxx.ngrok-free.app) && echo 2. Copy Frontend ngrok URL (https://yyy.ngrok-free.app) && echo. && echo 3. Update .env files: && echo. && echo    Root .env: && echo    GAME_SERVER_URL=https://xxx.ngrok-free.app && echo    WEBAPP_URL=https://yyy.ngrok-free.app && echo. && echo    game21/server/.env: && echo    WEBAPP_URL=https://yyy.ngrok-free.app && echo. && echo    game21/client/.env: && echo    VITE_SOCKET_URL=https://xxx.ngrok-free.app && echo. && echo 4. Restart backend and frontend (Ctrl+C and npm run dev) && echo 5. Start bot: npm run combined && echo. && echo 6. Test in Telegram: /game21 && echo. && echo ========================================== && echo. && pause"

echo.
echo All windows opened!
echo Follow instructions in the last window.
echo.
pause
