@echo off
title MisArchivos - Servidor Web & PWA
cls
echo ========================================================
echo   Iniciando Aplicacion Web MisArchivos...
echo ========================================================
echo Abre tu navegador en: http://localhost:3000
echo.
cd /d "%~dp0web"
npm run dev
