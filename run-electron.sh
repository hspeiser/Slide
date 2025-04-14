#!/bin/bash
# Script to run the Electron app

# Exit on any error
set -e

echo "Starting Electron app..."
node --loader=tsx electron/run-electron.js