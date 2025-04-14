// Ultra-simple standalone Electron launcher
// No fancy configuration, no complicated stuff
const { app, BrowserWindow } = require('electron');
const path = require('path');
const fs = require('fs');

let mainWindow;

function createWindow() {
  console.log('Creating window with minimal settings...');
  
  // Super simple window with nothing fancy
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      contextIsolation: true,
      preload: path.join(__dirname, 'electron', 'preload.js')
    }
  });

  // Just look for the build files
  const possiblePaths = [
    path.join(__dirname, 'dist', 'index.html'),
    path.join(__dirname, 'dist', 'public', 'index.html'),
    path.join(__dirname, 'public', 'index.html'),
  ];

  // Find the first one that exists
  let foundPath = null;
  for (const indexPath of possiblePaths) {
    console.log('Checking:', indexPath);
    if (fs.existsSync(indexPath)) {
      foundPath = indexPath;
      console.log('Found index.html at:', indexPath);
      break;
    }
  }

  // If we found it, use it
  if (foundPath) {
    mainWindow.loadFile(foundPath);
    console.log('Loaded local file:', foundPath);
  } else {
    // No build files found
    mainWindow.loadURL('data:text/html,<html><body><h1>No build files found</h1></body></html>');
    console.error('No build files found');
  }

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

app.whenReady().then(() => {
  createWindow();
});

app.on('window-all-closed', () => {
  app.quit();
});