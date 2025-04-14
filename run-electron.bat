@echo off
REM Script to run Electron with a connection to the development server
REM Use this when you have the development server running

echo Connecting to the development server...
cd electron && node connect-to-server.js