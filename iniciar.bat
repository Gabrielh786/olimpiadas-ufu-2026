@echo off
title Olimpiada UFU 2026 - Servidor Local
echo ========================================================
echo   Iniciando o Sistema da Olimpiada UFU 2026...
echo ========================================================
echo.
cd /d "%~dp0"
start http://localhost:5173/
call npm run dev
pause
