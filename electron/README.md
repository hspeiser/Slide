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

There are three ways to run the app:

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

### Method 2: Use the development Electron mode

For development with automatic connecting to the web server:

```
cd electron
npm run dev
```

This will start Electron in development mode, automatically connecting to the web server at port 5000.

### Method 3: Use the standalone mode

For quick testing without needing to run the web server:

```
cd electron
npm run standalone
```

This will:
1. Build the web application if needed
2. Start Electron in standalone mode using the built files
3. No need for a separate web server to be running

### Method 4: Two-step process for permission issues (Recommended for macOS/Linux)

If you encounter permission issues with the standalone mode, use this two-step approach:

```
# Step 1: Build the app first (from project root)
npm run build

# Step 2: Run Electron with existing build (from electron directory)
cd electron
npm run simple
```

This approach:
1. Builds the application using your normal user permissions
2. Uses the existing build files without attempting to rebuild
3. Avoids permission errors by not trying to clean the dist folder
4. Is the fastest way to start the app locally

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
- `start-electron.js` - Script for development mode with web server
- `standalone.js` - Script for standalone mode (builds app if needed)
- `run-standalone.js` - Script for using existing built files
- `run-electron.js` - Script for running with the web server
- `build-electron.js` - Script for building the distributable app
- `setup-local.sh` - Script for setting up local development
- `electron-builder.json` - Configuration for electron-builder