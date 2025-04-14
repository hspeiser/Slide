// Script to run the Electron app in development mode
const { spawn } = require('child_process');
const waitOn = require('wait-on');
const electron = require('electron');
const path = require('path');

// Start the web server - use npm run dev instead of direct tsx call
console.log('Starting the web server...');
const serverProcess = spawn('npm', ['run', 'dev'], {
  env: { ...process.env },
  stdio: 'inherit',
  shell: true
});

// Wait for the web server to be available
waitOn({
  resources: ['http://localhost:5000'],
  timeout: 30000,
})
  .then(() => {
    console.log('Web server is up! Starting Electron...');
    
    // Start Electron app
    const electronProcess = spawn(electron, [path.join(__dirname, 'main.js')], {
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