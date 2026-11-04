@echo off
title Tegenspeler
cd /d "%~dp0"

rem Vers geinstalleerde programma's staan vaak nog niet in PATH: voeg de vaste plekken toe.
set "PATH=%PATH%;%ProgramFiles%\nodejs;%USERPROFILE%\.local\bin;%APPDATA%\npm"

where node >nul 2>nul
if errorlevel 1 (
  echo.
  echo  [X] Node.js is niet gevonden.
  echo      Installeer de LTS-versie via https://nodejs.org en dubbelklik daarna opnieuw op dit bestand.
  echo.
  pause
  exit /b
)

if not exist "dist\index.html" (
  echo.
  echo  [X] De app ontbreekt in deze map ^(dist\index.html^). Download de ZIP opnieuw van GitHub.
  echo.
  pause
  exit /b
)

start "" cmd /c "timeout /t 3 /nobreak >nul & start msedge http://127.0.0.1:5173"
node server.mjs
echo.
echo  Tegenspeler is gestopt.
pause
