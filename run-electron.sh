#!/bin/bash
# Script to run the Electron app

# Exit on any error
set -e

# Check if setup is needed
if [ "$1" == "--setup" ] || [ ! -d "electron/node_modules" ]; then
  echo "Setting up Electron development environment..."
  node electron/dev-setup.js
  exit 0
fi

echo "Starting Electron app..."
node electron/run-electron.js