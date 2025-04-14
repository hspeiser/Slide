// Standalone script for running Electron without needing the web server
const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

console.log('Starting Electron in standalone mode...');

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

// Check if we need to build the app first
if (!fs.existsSync(path.join(__dirname, '..', 'dist', 'index.html'))) {
  console.log('Dist folder not found. Building the application first...');
  
  // First, check if dist folder exists and has permission issues
  const distPath = path.join(__dirname, '..', 'dist');
  if (fs.existsSync(distPath)) {
    console.log('Existing dist folder found. Checking if we have write permissions...');
    
    try {
      // Create a test file to check write permissions
      const testFile = path.join(distPath, 'permission-test.txt');
      fs.writeFileSync(testFile, 'testing permissions');
      fs.unlinkSync(testFile);
      console.log('We have write permissions to the dist folder.');
    } catch (error) {
      console.error('Permission issues with the dist folder. Please run:');
      console.error(`sudo chmod -R 755 "${distPath}"`);
      console.error('Or run this script with sudo privileges.');
      process.exit(1);
    }
  }
  
  // Try to build the app with higher permissions if supported
  try {
    console.log('Building the application...');
    const buildCmd = process.platform === 'darwin' || process.platform === 'linux' 
      ? 'NODE_ENV=production npx vite build' 
      : 'set NODE_ENV=production && npx vite build';
    
    require('child_process').execSync(buildCmd, {
      cwd: path.join(__dirname, '..'),
      stdio: 'inherit'
    });
  } catch (error) {
    console.error('Failed to build the application. Try running:');
    console.error('sudo npm run build');
    console.error('And then run this script again.');
    process.exit(1);
  }
}

console.log('Starting Electron app in standalone mode...');
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