@echo off
REM Abre o gerenciador da plataforma nutricional.
REM Basta dar dois cliques neste arquivo.

chcp 65001 >nul
cd /d "%~dp0"
title Gerenciador Nutricional

where node >nul 2>nul
if errorlevel 1 (
  echo.
  echo  O Node.js nao foi encontrado. Instale em https://nodejs.org e tente de novo.
  echo.
  pause
  exit /b 1
)

node tools\gerenciar.js

echo.
pause
