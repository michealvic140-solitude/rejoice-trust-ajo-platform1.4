@echo off
REM Rejoice Trust AJO Platform - Complete Reboot Script for Windows

setlocal enabledelayedexpansion

echo.
echo ================================================
echo REJOICE TRUST AJO PLATFORM - FULL REBOOT
echo ================================================
echo.

REM Check for DATABASE_URL
if not defined DATABASE_URL (
  echo ERROR: DATABASE_URL environment variable not set
  echo Please set your Supabase connection string in your environment variables
  pause
  exit /b 1
)

echo [1/3] Installing dependencies...
call npm install --silent 2>nul || (
  echo Dependencies already installed
)

echo.
echo [2/3] Starting backend server on port 3001...
echo Backend server starting in new window...
start "Rejoice Platform Backend" node server/index.js
timeout /t 2 /nobreak

echo.
echo [3/3] Starting frontend dev server on port 5000...
echo Frontend server starting in new window...
start "Rejoice Platform Frontend" cmd /k npm run dev:frontend

echo.
echo ================================================
echo PLATFORM REBOOT COMPLETE
echo ================================================
echo.
echo Backend Server:  http://localhost:3001
echo Frontend App:    http://localhost:5000
echo.
echo Both servers are running in separate windows.
echo Close the windows to stop the services.
echo.
pause
