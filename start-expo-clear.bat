@echo off
title Daily Plate - Expo (clear cache)
cd /d "%~dp0"
echo Clearing Metro/bundler cache and starting Expo Go (LAN)...
echo Use this only when reloads act stale; normal launches should use start-expo.bat.
echo.
call npx.cmd expo start --go --clear
pause
