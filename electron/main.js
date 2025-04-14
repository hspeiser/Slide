// Electron main process
const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const path = require('path');
const url = require('url');
const isDev = require('electron-is-dev');
const fs = require('fs');

// Keep a global reference of the window object to avoid garbage collection
let mainWindow;

function createWindow() {
  // Create the browser window
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
  });

  // Load the app
  let startUrl;
  
  // Check if we're running in standalone mode (no web server)
  const standaloneMode = process.env.ELECTRON_STANDALONE === 'true';
  
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
      // Use the development server
      startUrl = 'http://127.0.0.1:5000';
      console.log('Running with development server at', startUrl);
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

  mainWindow.loadURL(startUrl);

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