@echo off
chcp 65001 >nul
echo Criando o atalho da Mesa do Assessor na area de trabalho...
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0criar-atalho.ps1"
echo.
pause
