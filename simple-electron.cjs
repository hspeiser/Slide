// Ultra-simple standalone Electron launcher
// No fancy configuration, no complicated stuff
const { app, BrowserWindow, Tray, nativeImage, Menu } = require('electron');
const path = require('path');
const fs = require('fs');

let mainWindow = null;
let tray = null;

// // Disable hardware acceleration to potentially avoid crashes
// app.disableHardwareAcceleration();

function toggleWindow() {
  if (mainWindow === null || mainWindow.isDestroyed()) {
    createWindow();
  } else if (mainWindow.isVisible() && mainWindow.isFocused()) {
    mainWindow.hide();
    if (process.platform === 'darwin') {
        // app.dock.hide();
    }
  } else {
    mainWindow.show();
    mainWindow.focus();
    if (process.platform === 'darwin') {
        // app.dock.show();
    }
  }
}

function createWindow() {
  console.log('Creating window...');

  if (mainWindow && !mainWindow.isDestroyed()) {
      console.log('Window already exists, focusing.');
      mainWindow.show();
      mainWindow.focus();
      return;
  }

  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    frame: false,
    titleBarStyle: 'hidden',
    webPreferences: {
      // sandbox: false, // Keep sandbox enabled unless absolutely needed
      contextIsolation: true,
      preload: path.join(__dirname, 'electron', 'preload.js')
    }
  });

  // --- Intercept Close Event on macOS --- 
  mainWindow.on('close', (event) => {
    // Check if we are on macOS and the tray icon exists
    if (process.platform === 'darwin' && tray && !tray.isDestroyed()) {
      console.log('Intercepting close event on macOS, hiding window instead.');
      event.preventDefault(); // Prevent the window from actually closing
      mainWindow.hide();
       // Optionally hide dock icon again if it had reappeared
       // if (app.dock) app.dock.hide(); 
    } else {
        // On other platforms, or if tray isn't active, allow default close
        console.log('Allowing default close behavior (not macOS or no tray).');
        // Setting mainWindow to null here will trigger the 'window-all-closed' quit logic
        mainWindow = null;
    }
  });
  // --- End Intercept --- 

  const possiblePaths = [
    path.join(__dirname, 'dist', 'index.html'),
    path.join(__dirname, 'dist', 'public', 'index.html'),
    path.join(__dirname, 'public', 'index.html'),
  ];

  let foundPath = null;
  for (const indexPath of possiblePaths) {
    if (fs.existsSync(indexPath)) {
      foundPath = indexPath;
      console.log('Found index.html at:', indexPath);
      break;
    }
  }

  if (foundPath) {
    const url = `file://${foundPath}#/`;
    mainWindow.loadURL(url);
    console.log('Loaded local file:', url);
  } else {
    mainWindow.loadURL('data:text/html,<html><body><h1>No build files found</h1></body></html>');
    console.error('No build files found');
  }
}

app.whenReady().then(() => {
  createWindow();

  if (process.platform === 'darwin') {
    try {
      const iconPath = path.join(__dirname, 'generated-icon.png');
      if (!fs.existsSync(iconPath)) {
          console.error("Tray icon not found at:", iconPath);
          return;
      }
      
      let icon = nativeImage.createFromPath(iconPath);
      icon = icon.resize({ width: 16, height: 16 });
      icon.setTemplateImage(true);

      tray = new Tray(icon);
      tray.setToolTip('Slide Calculator');

      tray.on('click', toggleWindow);

      const contextMenu = Menu.buildFromTemplate([
        { label: 'Show/Hide Slide', click: toggleWindow },
        { type: 'separator' },
        { label: 'Quit Slide', click: () => { 
            console.log('Quitting via context menu');
            app.quit(); 
          }
        },
      ]);
      tray.setContextMenu(contextMenu);
      
      app.dock.hide();
      console.log('Tray icon created and Dock icon hidden.');

    } catch (error) {
        console.error("Failed to create tray icon:", error);
    }
  }
});

app.on('window-all-closed', () => {
  console.log('All windows closed event triggered.');
  // This condition should now only be met if the close wasn't intercepted (e.g., not macOS, or tray failed)
  if (process.platform !== 'darwin') {
    console.log('Quitting app (not macOS or close not intercepted).');
    app.quit();
  } else {
      console.log('App remains active for tray (macOS).') // Message remains valid
  }
});

app.on('activate', () => {
  console.log('App activated (e.g., Dock icon clicked).');
  if (mainWindow === null || mainWindow.isDestroyed()) {
    createWindow();
  } else {
    mainWindow.show();
    mainWindow.focus();
  }
});

app.on('before-quit', () => {
    console.log('Before quit event triggered.');
    if (tray && !tray.isDestroyed()) {
        console.log('Destroying tray icon.');
        tray.destroy();
    }
    tray = null;
});