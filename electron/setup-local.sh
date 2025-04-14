#!/bin/bash
# Setup script for local Electron development

# Exit on any error
set -e

echo "Setting up Electron for local development..."

# Create a local package.json for Electron
cat > package.json << EOF
{
  "name": "scientific-calculator-electron",
  "version": "1.0.0",
  "description": "Electron wrapper for Scientific Calculator",
  "main": "main.js",
  "scripts": {
    "start": "electron .",
    "build": "electron-builder",
    "dev": "node start-electron.js"
  },
  "author": "Calculator Developer",
  "license": "MIT",
  "dependencies": {
    "electron-is-dev": "^2.0.0"
  },
  "devDependencies": {
    "electron": "28.0.0",
    "electron-builder": "^24.6.3"
  }
}
EOF

# Install dependencies
echo "Installing Electron dependencies..."
npm install

echo "Setup complete! You can now run the Electron app with 'npm start'"