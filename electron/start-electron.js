// A simpler script to run Electron app for local testing
const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');
const isDev = require('electron-is-dev');

console.log('Starting Electron in standalone mode...');

// Try to find the electron executable
let electronPath;
try {
  // First, try to get it from the require
  electronPath = require('electron');
} catch (error) {
  // If that fails, look in node_modules directories
  const possiblePaths = [
    // Local electron directory
    path.join(__dirname, 'node_modules', '.bin', 'electron'),
    path.join(__dirname, 'node_modules', 'electron', 'dist', 'electron'),
    // Parent directory
    path.join(__dirname, '..', 'node_modules', '.bin', 'electron'),
    path.join(__dirname, '..', 'node_modules', 'electron', 'dist', 'electron')
  ];
  
  for (const testPath of possiblePaths) {
    if (fs.existsSync(testPath)) {
      electronPath = testPath;
      console.log(`Found Electron at: ${electronPath}`);
      break;
    }
  }
  
  if (!electronPath) {
    console.error('Electron executable not found. Make sure it is installed.');
    process.exit(1);
  }
}

console.log('Starting Electron app...');
// Launch Electron app
const electronProcess = spawn(electronPath, [path.join(__dirname, 'main.js')], {
  stdio: 'inherit',
  env: {
    ...process.env,
    // Force dev mode
    ELECTRON_IS_DEV: "1"
  }
});

// Handle Electron close
electronProcess.on('close', (code) => {
  console.log(`Electron process exited with code ${code}`);
  process.exit(code);
});

// Handle termination signals
process.on('SIGINT', () => {
  electronProcess.kill();
  process.exit(0);
});

process.on('SIGTERM', () => {
  electronProcess.kill();
  process.exit(0);
});