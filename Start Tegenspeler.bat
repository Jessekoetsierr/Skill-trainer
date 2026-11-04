@echo off
title Tegenspeler
cd /d "%~dp0"

where node >nul 2>nul
if errorlevel 1 (
  echo.
  echo  Node.js ontbreekt. Installeer het via https://nodejs.org  ^(kies LTS^)
  echo  en dubbelklik daarna opnieuw op dit bestand.
  echo.
  pause
  exit /b
)

where claude >nul 2>nul
if errorlevel 1 (
  echo.
  echo  Claude Code ontbreekt. Open PowerShell en voer uit:
  echo      irm https://claude.ai/install.ps1 ^| iex
  echo  Typ daarna een keer  claude  om in te loggen met je Claude-abonnement.
  echo.
  pause
  exit /b
)

echo.
echo  Tegenspeler start... Laat dit venster open zolang je oefent.
echo.
start "" cmd /c "timeout /t 2 /nobreak >nul & start msedge http://127.0.0.1:5173"
node server.mjs
pause
