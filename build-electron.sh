#!/bin/bash
# Script to build the Electron app

# Exit on any error
set -e

echo "Building Electron app..."
node --loader=tsx electron/build-electron.js