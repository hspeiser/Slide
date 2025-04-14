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
    "dev": "node start-electron.js",
    "standalone": "node standalone.js",
    "simple": "node run-standalone.js"
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

echo "Setup complete! You can now run the Electron app using one of these commands:"
echo ""
echo "  npm start         - Run Electron directly (requires npm run dev in another terminal)"
echo "  npm run dev       - Run in development mode with the web server"
echo "  npm run standalone - Run in standalone mode (builds app automatically)"
echo "  npm run simple    - Use existing build without rebuilding (fastest startup)"
echo ""
echo "For local development with permission issues, use this sequence:"
echo "  1. cd .. && npm run build"
echo "  2. cd electron && npm run simple"
echo ""
echo "For more details, see the README.md file in this directory."