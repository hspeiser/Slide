/**
 * Additional configuration for macOS Electron apps
 * Especially focused on fixing issues with macOS 15.3+ (Ventura, Sonoma)
 */

// Apply macOS specific fixes and settings
function configureForMacOS(app) {
  // Must be called before app is ready
  if (!app.isReady()) {
    // Basic GPU settings
    app.commandLine.appendSwitch('disable-gpu-compositing');
    app.commandLine.appendSwitch('disable-gpu');
    
    // Disable hardware acceleration - helps with crashes on macOS 15+
    app.disableHardwareAcceleration();
    
    // Disable the remote module which can cause issues
    app.commandLine.appendSwitch('disable-remote-module');
    
    // Set the app category for macOS
    app.setAppUserModelId('com.electron.scientific-calculator');
    
    // Additional V8 options to prevent crashes
    app.commandLine.appendSwitch('js-flags', '--max-old-space-size=4096');
    
    // Prevent issues with Swift/Objective-C interop
    app.commandLine.appendSwitch('disable-features', 'OutOfBlinkCors');
    
    // Check if we're running a newer Electron version
    if (parseInt(process.versions.electron) >= 28) {
      app.commandLine.appendSwitch('enable-macos-layers-ui-compositing');
    }
    
    console.log('Applied macOS-specific app configuration');
  } else {
    console.warn('Warning: macOS configuration applied after app ready - some settings may not take effect');
  }
}

// BrowserWindow settings for macOS
function getMacOSWindowSettings() {
  return {
    titleBarStyle: 'hiddenInset',       // Better style on macOS 
    vibrancy: 'under-window',           // Modern macOS look
    backgroundColor: '#00000000',       // Transparent background 
    roundedCorners: true,               // Modern macOS rounded corners
    visualEffectState: 'active',        // Keep visual effects active
    trafficLightPosition: { x: 10, y: 10 }, // Fix traffic light positioning
    // Additional settings for stability
    hasShadow: false,                   // Disable window shadow
    transparent: false,                 // Disable transparency for now
    fullscreenable: false,              // Disable fullscreen to avoid issues
    webPreferences: {
      contextIsolation: true,           // Security best practice 
      enableRemoteModule: false,        // Disable remote for stability
      experimentalFeatures: false,      // Disable experimental features
      nodeIntegrationInWorker: false    // Disable node in workers
    }
  };
}

module.exports = {
  configureForMacOS,
  getMacOSWindowSettings
};