@echo off
title MisArchivos - Sincronizador Local Windows
cls
echo ========================================================
echo   Iniciando Agente de Sincronizacion MisArchivos...
echo ========================================================
echo Carpeta vigilada: C:\MisArchivos
echo.
cd /d "%~dp0"
node index.js
pause
