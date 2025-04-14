// A simpler script to run Electron app for local testing
const { spawn } = require('child_process');
const electron = require('electron');
const path = require('path');

console.log('Starting Electron app...');
// Launch Electron app
const electronProcess = spawn(electron, [path.join(__dirname, 'main.js')], {
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