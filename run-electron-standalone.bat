@echo off
REM Simple script to run the Electron app in standalone mode
REM This doesn't require a running server

echo Starting Electron in standalone mode...
cd electron && node start-standalone.js