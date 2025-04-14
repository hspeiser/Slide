// A simpler script to run Electron app for local testing
const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

// Find electron in node_modules
let electronPath;
try {
  electronPath = require('electron');
} catch (error) {
  // If not found directly, try to find it in node_modules
  const possiblePaths = [
    path.join(__dirname, '..', 'node_modules', '.bin', 'electron'),
    path.join(__dirname, '..', 'node_modules', 'electron', 'dist', 'electron')
  ];
  
  for (const testPath of possiblePaths) {
    if (fs.existsSync(testPath)) {
      electronPath = testPath;
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
  stdio: 'inherit'
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