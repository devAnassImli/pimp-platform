@echo off
chcp 65001 >nul
setlocal enabledelayedexpansion
title PIMP - Lancement
cd /d "%~dp0"

echo ============================================
echo    PIMP - Product Information Management
echo ============================================
echo.

where node >nul 2>nul
if errorlevel 1 (
  echo [ERREUR] Node.js n'est pas installe.
  echo Installe la version LTS depuis : https://nodejs.org
  echo Puis relance ce fichier start.bat
  pause
  exit /b
)

if not exist "server\.env" (
  echo Premiere configuration.
  echo Cle API Gemini gratuite ici : https://aistudio.google.com/apikey
  echo.
  set /p GKEY="Colle ta cle Gemini ici (ou Entree pour passer) : "
  (
    echo PORT=4000
    echo DB_DRIVER=memory
    echo DB_SERVER=localhost
    echo DB_PORT=1433
    echo DB_USER=sa
    echo DB_PASSWORD=Pimp_Strong_Pass123
    echo DB_NAME=PIMP
    echo GEMINI_API_KEY=!GKEY!
  ) > "server\.env"
  echo Fichier server\.env cree.
  echo.
)

if not exist "server\node_modules" (
  echo Installation des dependances du serveur...
  call npm --prefix server install
)
if not exist "client\node_modules" (
  echo Installation des dependances de l'interface...
  call npm --prefix client install
)

echo.
echo Lancement du serveur et de l'interface...
start "PIMP - Serveur"   cmd /k "cd /d %~dp0server && npm run dev"
start "PIMP - Interface" cmd /k "cd /d %~dp0client && npm run dev"

echo Ouverture du navigateur...
timeout /t 7 /nobreak >nul
start "" http://localhost:5173

echo.
echo Termine. Laisse les deux fenetres ouvertes pendant l'utilisation.
exit /b
