@echo off
title Daily Plate - Expo
cd /d "%~dp0"
echo Starting Expo for Daily Plate...
echo Project: %CD%
echo Press Ctrl+C to stop the server.
echo.
call npm start
pause
