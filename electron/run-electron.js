// Script to run the Electron app in development mode
const { spawn } = require('child_process');
const waitOn = require('wait-on');
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

// Start the web server - use npm run dev instead of direct tsx call
console.log('Starting the web server...');
const serverProcess = spawn('npm', ['run', 'dev'], {
  env: { ...process.env },
  stdio: 'inherit',
  shell: true
});

// Wait for the web server to be available
// Try multiple variants of localhost in case one of them doesn't work
waitOn({
  resources: [
    'http://localhost:5000',
    'http://127.0.0.1:5000',
    'http://[::1]:5000'
  ],
  timeout: 30000,
})
  .then(() => {
    console.log('Web server is up! Starting Electron...');
    
    // Start Electron app
    const electronProcess = spawn(electronPath, [path.join(__dirname, 'main.js')], {
      stdio: 'inherit'
    });

    // Handle Electron close
    electronProcess.on('close', () => {
      console.log('Electron process closed. Shutting down the web server...');
      serverProcess.kill();
      process.exit(0);
    });
  })
  .catch(error => {
    console.error('Error starting application:', error);
    serverProcess.kill();
    process.exit(1);
  });

// Handle process termination
const cleanup = () => {
  serverProcess.kill();
  process.exit(0);
};

process.on('SIGINT', cleanup);
process.on('SIGTERM', cleanup);