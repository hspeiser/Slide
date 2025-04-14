// Electron main process
const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const path = require('path');
const url = require('url');
const isDev = require('electron-is-dev');
const fs = require('fs');

// Keep a global reference of the window object to avoid garbage collection
let mainWindow;

function createWindow() {
  // Set macOS-specific app settings for compatibility with newer versions
  if (process.platform === 'darwin') {
    // Prevent issues with translucency on modern macOS
    app.commandLine.appendSwitch('disable-gpu-compositing');
    
    // Add transparency settings that help with newer macOS versions
    if (parseInt(process.versions.electron) >= 28) {
      app.commandLine.appendSwitch('enable-macos-layers-ui-compositing');
    }
    
    // Disable hardware acceleration if we detect issues
    if (process.env.DISABLE_GPU === 'true') {
      app.disableHardwareAcceleration();
    }
  }

  // Create the browser window with platform-specific settings
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js')
    },
    title: 'Scientific Calculator',
    icon: path.join(__dirname, 'icon.png'),
    // macOS-specific settings
    ...(process.platform === 'darwin' ? {
      titleBarStyle: 'hiddenInset', // Better style on macOS
      vibrancy: 'under-window',     // Modern macOS look
      backgroundColor: '#00000000', // Transparent background
      roundedCorners: true,         // Modern macOS rounded corners
      visualEffectState: 'active',  // Keep visual effects active
      trafficLightPosition: { x: 10, y: 10 } // Fix traffic light positioning
    } : {})
  });

  // Load the app
  let startUrl;
  
  // Check if we're running in standalone mode (no web server)
  // This can be enabled through environment variable, command line arg, or by failing to connect to the server
  const standaloneMode = process.env.ELECTRON_STANDALONE === 'true' || process.argv.includes('--standalone');
  
  // Log the current directories to help debug
  console.log('Current directory:', __dirname);
  console.log('Looking for built files...');
  
  // Check multiple possible build output locations
  const possibleIndexPaths = [
    path.join(__dirname, '../dist/index.html'),
    path.join(__dirname, '../dist/public/index.html'),
    path.join(__dirname, '../public/index.html'),
    path.join(__dirname, '../build/index.html')
  ];
  
  let foundIndexPath = null;
  for (const indexPath of possibleIndexPaths) {
    console.log('Checking for build at:', indexPath);
    if (fs.existsSync(indexPath)) {
      foundIndexPath = indexPath;
      console.log('Found built index.html at:', indexPath);
      break;
    }
  }
  
  if (isDev) {
    if (standaloneMode && foundIndexPath) {
      // Use the built dist files in standalone mode
      startUrl = url.format({
        pathname: foundIndexPath,
        protocol: 'file:',
        slashes: true,
      });
      console.log('Running in standalone development mode');
    } else {
      // Use the development server - try multiple possible addresses
      const possibleServers = [
        'http://127.0.0.1:5000',
        'http://localhost:5000',
        'http://[::1]:5000'
      ];
      
      // We'll start with the first server and let the app try connecting
      startUrl = possibleServers[0];
      console.log('Running with development server at', startUrl);
      console.log('If connection fails, try these alternatives:', possibleServers.slice(1).join(', '));
    }
  } else {
    // Production mode always uses built files
    if (foundIndexPath) {
      startUrl = url.format({
        pathname: foundIndexPath,
        protocol: 'file:',
        slashes: true,
      });
      console.log('Running in production mode with local files');
    } else {
      // Fallback to development server
      startUrl = 'http://127.0.0.1:5000';
      console.log('No build found, falling back to development server at', startUrl);
    }
  }

  // Try to load the URL, with fallback handling
  mainWindow.loadURL(startUrl).catch(error => {
    console.error('Failed to load URL:', error);
    
    // If we failed to connect to the server and not already in standalone mode,
    // try to find local files and switch to standalone mode
    if (!standaloneMode && startUrl.startsWith('http')) {
      console.log('Server connection failed. Attempting to use local files...');
      
      // Check if we have local files
      if (foundIndexPath) {
        console.log('Found local files. Switching to standalone mode.');
        const localUrl = url.format({
          pathname: foundIndexPath,
          protocol: 'file:',
          slashes: true,
        });
        
        // Try to load the local files
        mainWindow.loadURL(localUrl).catch(localError => {
          console.error('Failed to load local files:', localError);
          mainWindow.webContents.openDevTools();
        });
      } else {
        console.error('No local files found for fallback. Application may not work properly.');
        // Show an error page
        mainWindow.loadURL(`data:text/html,
          <html>
            <head><title>Connection Error</title></head>
            <body>
              <h1>Connection Error</h1>
              <p>Could not connect to development server and no local files found.</p>
              <p>Please ensure the development server is running or build the application.</p>
              <button onclick="window.location.reload()">Retry</button>
            </body>
          </html>
        `);
        mainWindow.webContents.openDevTools();
      }
    }
  });

  // Open DevTools in development mode
  if (isDev) {
    mainWindow.webContents.openDevTools();
  }

  // Handle window being closed
  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

// Create window when Electron is ready
app.whenReady().then(createWindow);

// Quit when all windows are closed (except on macOS)
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// On macOS, recreate window when dock icon is clicked and no windows are open
app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

// Handle IPC Messages

// Save File Dialog
ipcMain.handle('save-file', async (event, content, defaultPath) => {
  try {
    const { canceled, filePath } = await dialog.showSaveDialog(mainWindow, {
      title: 'Save Calculation Results',
      defaultPath: defaultPath || 'slide-export.txt',
      filters: [
        { name: 'Text Files', extensions: ['txt'] },
        { name: 'All Files', extensions: ['*'] }
      ]
    });
    
    if (!canceled && filePath) {
      fs.writeFileSync(filePath, content);
      return { success: true, filePath };
    } else {
      return { success: false, reason: 'cancelled' };
    }
  } catch (error) {
    console.error('Error saving file:', error);
    return { success: false, reason: 'error', message: error.message };
  }
});

// Get app version
ipcMain.handle('get-version', () => {
  return app.getVersion();
});

// Get app path
ipcMain.handle('get-app-path', () => {
  return app.getAppPath();
});