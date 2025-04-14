// Electron main process
import { app, BrowserWindow, ipcMain } from 'electron';
import path from 'path';
import url from 'url';
import isDev from 'electron-is-dev';

// Keep a global reference of the window object to avoid garbage collection
let mainWindow;

function createWindow() {
  // Create the browser window
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
      // preload: path.join(__dirname, 'preload.js')
    },
    title: 'Scientific Calculator',
    icon: path.join(__dirname, 'icon.png'),
  });

  // Load the app
  const startUrl = isDev
    ? 'http://localhost:5000' // Development server URL
    : url.format({
        pathname: path.join(__dirname, '../dist/public/index.html'),
        protocol: 'file:',
        slashes: true,
      });

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

// Handle IPC messages here if needed
// ipcMain.on('some-event', (event, arg) => {...});