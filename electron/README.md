# Electron App for Scientific Calculator

This directory contains the Electron wrapper for the Scientific Calculator application, allowing it to run as a native desktop application.

## Setup for Local Development

To set up the Electron app for local development:

1. Navigate to the `electron` directory:
   ```
   cd electron
   ```

2. Run the setup script:
   ```
   ./setup-local.sh
   ```
   
   This will:
   - Create a local package.json for the Electron app
   - Install Electron and required dependencies

## Running the App Locally

There are two ways to run the app:

### Method 1: Start the web app and Electron separately

1. Start the web application server (in the root directory):
   ```
   npm run dev
   ```

2. In a separate terminal, start the Electron app:
   ```
   cd electron
   npm start
   ```

### Method 2: Use the standalone Electron mode

For quick testing without needing to run the web server:

```
cd electron
npm run dev
```

This will start Electron in development mode, automatically forcing ELECTRON_IS_DEV to be true.

## Building the Electron App

To build the Electron application for distribution:

```
cd electron
npm run build
```

This will create distributable packages in the `release` directory.

## Troubleshooting

- If you encounter errors about missing modules, run the setup script again.
- If Electron can't connect to the web server, make sure the web server is running on port 5000.
- For issues with building, check that electron-builder is installed correctly.

## File Structure

- `main.js` - Main Electron process
- `preload.js` - Preload script for secure IPC communication
- `start-electron.js` - Script for standalone Electron mode
- `run-electron.js` - Script for running with the web server
- `build-electron.js` - Script for building the distributable app
- `electron-builder.json` - Configuration for electron-builder