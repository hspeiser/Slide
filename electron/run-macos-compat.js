#!/usr/bin/env node
/**
 * Special compatibility script for running Electron on modern macOS (Ventura, Sonoma, etc.)
 * This script uses additional flags to help with compatibility issues
 */

const { spawn } = require('child_process');
const path = require('path');
const electronPath = require('electron');

console.log('Starting Electron with macOS compatibility mode...');

// Launch Electron directly with minimal flags for maximum compatibility
// The disableHardwareAcceleration API is the preferred method to disable GPU
// instead of passing multiple potentially conflicting flags
console.log('Launching Electron with simplified configuration...');

const electronProcess = spawn(electronPath, [
  // Use only the main script - we'll let our macos-app-config.js handle configuration
  path.join(__dirname, 'main.js')
], {
  stdio: 'inherit',
  env: {
    ...process.env,
    // Enable development mode and logging
    ELECTRON_IS_DEV: "1",
    ELECTRON_ENABLE_LOGGING: "1",
  }
});

// Handle process termination
electronProcess.on('close', (code) => {
  console.log(`Electron process exited with code ${code || 0}`);
  process.exit(code || 0);
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