@echo off
REM Script to start both the development server and Electron
REM This is a convenience script for development

echo Starting both the development server and Electron...

REM Start the development server in a new window
start cmd /k npm run dev

REM Wait for server to be ready
echo Waiting for server to be ready...
timeout /t 5

REM Start Electron
cd electron && node connect-to-server.js