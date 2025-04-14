// Script to set up a development environment for Electron app
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('Setting up Electron development environment...');

// Create a local package.json in the electron folder
const createLocalPackageJson = () => {
  console.log('Creating local package.json for Electron development...');
  
  const packageJson = {
    "name": "scientific-calculator-electron",
    "version": "1.0.0",
    "description": "Electron wrapper for Scientific Calculator",
    "main": "main.js",
    "scripts": {
      "start": "electron .",
      "dev": "node start-electron.js"
    },
    "author": "Calculator Developer",
    "license": "MIT",
    "dependencies": {
      "electron-is-dev": "^2.0.0"
    },
    "devDependencies": {
      "electron": "28.0.0"
    }
  };
  
  // Write the package.json
  fs.writeFileSync(path.join(__dirname, 'package.json'), JSON.stringify(packageJson, null, 2));
  console.log('Created electron/package.json');
};

// Install dependencies in the electron folder
const installDependencies = () => {
  console.log('Installing Electron dependencies locally...');
  try {
    // Run npm install in the electron directory
    execSync('npm install', { 
      cwd: __dirname,
      stdio: 'inherit'
    });
    console.log('Electron dependencies installed successfully');
  } catch (error) {
    console.error('Error installing dependencies:', error.message);
    process.exit(1);
  }
};

// Main setup process
const setup = () => {
  createLocalPackageJson();
  installDependencies();
  
  console.log('\nSetup complete! 🎉');
  console.log('\nTo run the Electron app in development mode:');
  console.log('1. Start the web server: npm run dev');
  console.log('2. In a separate terminal, run: cd electron && npm run dev');
  console.log('\nOr use the shortcut: ./run-electron.sh');
};

// Run the setup
setup();