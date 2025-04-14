// Script to build the Electron app
import { spawn } from 'child_process';
import { exec } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Build the web app first
console.log('Building the web application...');

// Run the build command
exec('npm run build', (error, stdout, stderr) => {
  if (error) {
    console.error(`Error building web app: ${error}`);
    process.exit(1);
  }
  
  console.log('Web app built successfully. Building Electron app...');
  
  // Build the Electron app using electron-builder
  const electronBuilderProcess = spawn('npx', ['electron-builder', 'build', '-c', path.join(__dirname, 'electron-builder.json')], {
    stdio: 'inherit',
    shell: true
  });

  // Handle electron-builder close
  electronBuilderProcess.on('close', code => {
    if (code === 0) {
      console.log('Electron app built successfully!');
    } else {
      console.error(`Electron build failed with code ${code}`);
      process.exit(code);
    }
  });
});