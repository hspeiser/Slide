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
const electronProcess = spawn(electronPath, [
  path.join(__dirname, 'main.js'),
  '--disable-gpu-compositing',
  '--disable-gpu',
  '--disable-software-rasterizer'
], {
  stdio: 'inherit',
  env: {
    ...process.env,
    // Force various compatibility settings
    ELECTRON_IS_DEV: "1",
    DISABLE_GPU: "true",
    // Use a safe software rendering path
    ELECTRON_DISABLE_GPU_COMPOSITING: "1",
    ELECTRON_ENABLE_LOGGING: "1"
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