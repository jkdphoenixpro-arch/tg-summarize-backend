@echo off
echo ========================================
echo   Combined Bot + Game 21 Setup
echo ========================================
echo.

echo [1/4] Installing bot dependencies...
call npm install
if errorlevel 1 (
    echo ERROR: Failed to install bot dependencies
    pause
    exit /b 1
)
echo.

echo [2/4] Installing game dependencies...
cd game21
call npm install
if errorlevel 1 (
    echo ERROR: Failed to install game dependencies
    cd ..
    pause
    exit /b 1
)
echo.

echo [3/4] Installing server dependencies...
cd server
call npm install
if errorlevel 1 (
    echo ERROR: Failed to install server dependencies
    cd ../..
    pause
    exit /b 1
)
cd ..
echo.

echo [4/4] Installing client dependencies...
cd client
call npm install
if errorlevel 1 (
    echo ERROR: Failed to install client dependencies
    cd ../..
    pause
    exit /b 1
)
cd ../..
echo.

echo ========================================
echo   Installation Complete!
echo ========================================
echo.
echo Next steps:
echo 1. Create .env files (see HOW-TO-RUN.md)
echo 2. Run: start-all.bat
echo.
echo Documentation:
echo - HOW-TO-RUN.md - How to run the project
echo - START-HERE.md - Quick start guide
echo.
pause
