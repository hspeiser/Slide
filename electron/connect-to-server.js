#!/usr/bin/env node
/**
 * Script to connect to an already running server
 * This is useful when you've already started the server with npm run dev
 */

const { spawn } = require('child_process');
const waitOn = require('wait-on');
const path = require('path');
const fs = require('fs');

console.log('Connecting to existing server...');

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

// Wait for the web server to be available
console.log('Checking if server is running...');
waitOn({
  resources: [
    'http://localhost:5000',
    'http://127.0.0.1:5000',
    'http://[::1]:5000'
  ],
  timeout: 10000,
})
  .then(() => {
    console.log('Server is up! Starting Electron...');
    
    // Start Electron app
    const electronProcess = spawn(electronPath, [path.join(__dirname, 'main.js')], {
      stdio: 'inherit'
    });

    // Handle Electron close
    electronProcess.on('close', () => {
      console.log('Electron process closed.');
      process.exit(0);
    });
  })
  .catch(error => {
    console.error('Server not found. Make sure the server is running with "npm run dev"');
    console.error('Error:', error.message);
    process.exit(1);
  });

// Handle process termination
process.on('SIGINT', () => {
  process.exit(0);
});

process.on('SIGTERM', () => {
  process.exit(0);
});