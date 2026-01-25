@echo off
REM ================================================
REM KASIR APP MIGRATION HELPER (WINDOWS)
REM ================================================
REM Script untuk memudahkan setup & migration

cd /d "%~dp0"

:MENU
cls
echo.
echo ===================================
echo   APLIKASI KASIR - MIGRATION TOOL
echo ===================================
echo.
echo 1. Setup Database (Create DB + Tables)
echo 2. Import Data (From JSON backup)
echo 3. Start Development Server
echo 4. Create Backup Folder
echo 5. Open MySQL Client
echo 6. Check Node/NPM Version
echo 0. Exit
echo.
set /p CHOICE="Select option (0-6): "

if "%CHOICE%"=="1" goto SETUP_DB
if "%CHOICE%"=="2" goto IMPORT_DATA
if "%CHOICE%"=="3" goto START_SERVER
if "%CHOICE%"=="4" goto CREATE_FOLDER
if "%CHOICE%"=="5" goto MYSQL_CLI
if "%CHOICE%"=="6" goto CHECK_VERSION
if "%CHOICE%"=="0" exit
goto MENU

:SETUP_DB
cls
echo.
echo Setting up database...
echo.
call npm run db:setup
pause
goto MENU

:IMPORT_DATA
cls
echo.
echo Import JSON backup to MySQL
echo.
echo Make sure backup file is in: scripts/data/
echo Example: scripts/data/kasir_backup_2026-01-22.json
echo.
set /p FILENAME="Enter filename (without path): "
if "%FILENAME%"=="" (
  echo Error: No filename provided
  pause
  goto MENU
)
call npm run db:import -- %FILENAME%
pause
goto MENU

:START_SERVER
cls
echo.
echo Starting development server...
echo.
echo Server akan berjalan di: http://localhost:3000
echo.
call npm run dev
pause
goto MENU

:CREATE_FOLDER
cls
echo.
echo Creating scripts/data folder...
if not exist "scripts\data" (
  mkdir scripts\data
  echo Created: scripts\data
) else (
  echo Folder already exists
)
echo.
echo Copy your backup JSON file ke:
echo %cd%\scripts\data\
echo.
pause
goto MENU

:MYSQL_CLI
cls
echo.
echo Opening MySQL Client...
echo.
echo Default: mysql -u root
echo With password: mysql -u root -p
echo.
mysql -u root -p
pause
goto MENU

:CHECK_VERSION
cls
echo.
echo Checking versions...
echo.
node --version
npm --version
echo.
pause
goto MENU
