/**
 * Additional configuration for macOS Electron apps
 * Especially focused on fixing issues with macOS 15.3+ (Ventura, Sonoma)
 */

// Apply macOS specific fixes and settings
function configureForMacOS(app) {
  // Must be called before app is ready
  if (!app.isReady()) {
    console.log('Applying macOS-specific app configuration...');
    
    // Primary way to disable GPU - this is the main fix for macOS 15.3+ crashes
    // Use ONLY this method to avoid conflicts
    app.disableHardwareAcceleration();
    console.log('Hardware acceleration disabled via API');
    
    // Set app identity
    app.setAppUserModelId('com.electron.scientific-calculator');
    
    console.log('Applied macOS-specific app configuration');
  } else {
    console.warn('Warning: macOS configuration applied after app ready - some settings may not take effect');
  }
}

// BrowserWindow settings for macOS
function getMacOSWindowSettings() {
  return {
    // Use simplified settings for better compatibility with HW acceleration disabled
    titleBarStyle: 'default',           // Standard title bar
    backgroundColor: '#2e2c29',         // Solid dark background color
    vibrancy: undefined,                // Disable vibrancy effects
    
    // Basic window properties
    roundedCorners: true,               // Keep macOS rounded corners
    
    // Limit potentially problematic effects
    transparent: false,                 // Disable transparency
    hasShadow: true,                    // Re-enable standard window shadow
    fullscreenable: true                // Re-enable standard fullscreen
  };
}

module.exports = {
  configureForMacOS,
  getMacOSWindowSettings
};