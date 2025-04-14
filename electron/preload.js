// Electron preload script
// This is executed in the renderer process before the web page loads
// Used to safely expose Electron and Node.js APIs to the renderer

const { contextBridge, ipcRenderer } = require('electron');

// Expose protected methods that allow the renderer process to use
// IPC communication without exposing the entire Electron API
contextBridge.exposeInMainWorld('electronAPI', {
  saveFile: (content, defaultPath) => ipcRenderer.invoke('save-file', content, defaultPath),
  getVersion: () => ipcRenderer.invoke('get-version'),
  getAppPath: () => ipcRenderer.invoke('get-app-path'),
  getPlatform: () => process.platform,
});