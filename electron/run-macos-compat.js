#!/usr/bin/env node
/**
 * Special compatibility script for running Electron on modern macOS (Ventura, Sonoma, etc.)
 * This script uses additional flags to help with compatibility issues
 */

const { spawn } = require('child_process');
const path = require('path');
const electronPath = require('electron');

console.log('Starting Electron with macOS compatibility mode...');

// Launch Electron with special flags for macOS compatibility
// NOTE: Key difference is we're setting DISABLE_GPU environment variable
//       which will be detected BEFORE the app.ready event
const electronProcess = spawn(electronPath, [
  // Add these arguments before the main script to ensure they take effect
  '--no-sandbox',                  // Remove sandbox which can cause issues with modern macOS
  '--disable-gpu',                 // Completely disable GPU hardware acceleration
  '--disable-gpu-compositing',     // Disable GPU compositing
  '--disable-gpu-rasterization',   // Disable GPU rasterization
  '--disable-software-rasterizer', // Use minimal software drawing
  path.join(__dirname, 'main.js')  // This must come after all the flags
], {
  stdio: 'inherit',
  env: {
    ...process.env,
    // Force various compatibility settings
    ELECTRON_IS_DEV: "1",         // Enable dev mode to see errors
    DISABLE_GPU: "true",          // This is detected early in main.js before app.ready
    ELECTRON_ENABLE_LOGGING: "1", // Enable full electron logging
    ELECTRON_STANDALONE: "true",  // Use standalone mode for better reliability
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