// TypeScript declarations for the Electron API exposed via contextBridge
interface ElectronAPI {
  saveFile: (content: string, defaultPath?: string) => Promise<{
    success: boolean;
    filePath?: string;
    reason?: string;
    message?: string;
  }>;
  getVersion: () => Promise<string>;
  getAppPath: () => Promise<string>;
  getPlatform: () => string;
}

// Extend the Window interface
interface Window {
  electronAPI?: ElectronAPI;
}