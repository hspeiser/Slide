#!/usr/bin/env node
/**
 * Simple script to start Electron in pure standalone mode
 * This bypasses any need for a server or built files
 * It launches Electron directly with the --standalone flag
 */

const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');
const electronPath = require('electron');

console.log('Starting Electron in pure standalone mode (no server, no build required)');

// Launch Electron with the standalone flag
const electronProcess = spawn(electronPath, [
  path.join(__dirname, 'main.js'),
  '--standalone'
], {
  stdio: 'inherit',
  env: {
    ...process.env,
    // Set development mode
    ELECTRON_IS_DEV: "1"
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