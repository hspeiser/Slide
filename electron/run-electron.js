// Script to run the Electron app in development mode
import { spawn } from 'child_process';
import waitOn from 'wait-on';
import electron from 'electron';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Start the web server
console.log('Starting the web server...');
const serverProcess = spawn('node', ['--loader=tsx', '../server/index.ts'], {
  env: { ...process.env, NODE_ENV: 'development' },
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