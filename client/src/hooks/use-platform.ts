/**
 * Hook to detect whether the app is running in Electron or web browser
 * and provide platform-specific functionality
 */

// Helper to check if running in Electron
export const isElectron = (): boolean => {
  // Renderer process
  if (typeof window !== 'undefined' && typeof window.process === 'object' && 
      (window.process as any)?.type === 'renderer') {
    return true;
  }

  // Main process
  if (typeof process !== 'undefined' && typeof process.versions === 'object' && 
      !!process.versions.electron) {
    return true;
  }

  // Detect the user agent when the `nodeIntegration` option is set to false
  if (typeof navigator === 'object' && typeof navigator.userAgent === 'string' && 
      navigator.userAgent.indexOf('Electron') >= 0) {
    return true;
  }

  return false;
};

export function usePlatform() {
  const platformType = isElectron() ? 'electron' : 'web';
  
  return {
    isElectron: platformType === 'electron',
    isWeb: platformType === 'web',
    platformType,
  };
}

export default usePlatform;