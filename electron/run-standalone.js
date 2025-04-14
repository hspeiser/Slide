// Simplified standalone script that uses existing built files
const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

console.log('Starting Electron in simple standalone mode...');

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

// Check if we have a built application
// According to vite.config.ts, the build output is in "dist/public"
const distPath = path.join(__dirname, '..', 'dist');
const publicDistPath = path.join(distPath, 'public');
const indexPath = path.join(publicDistPath, 'index.html');

if (!fs.existsSync(indexPath)) {
  console.error('Error: Built application not found.');
  console.error('Please build the application first with:');
  console.error('cd .. && npm run build');
  console.error('Or run the main app with:');
  console.error('cd .. && npm run dev');
  process.exit(1);
}

console.log('Starting Electron app with existing build...');
// Launch Electron app with standalone mode flag
const electronProcess = spawn(electronPath, [path.join(__dirname, 'main.js')], {
  stdio: 'inherit',
  env: {
    ...process.env,
    // Force dev mode and standalone mode
    ELECTRON_IS_DEV: "1",
    ELECTRON_STANDALONE: "true"
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