// Script to build the Electron app
const { spawn, exec } = require('child_process');
const path = require('path');
const fs = require('fs');

// Create a temporary package.json with proper configurations for electron-builder
const createTempPackageJson = () => {
  console.log('Creating temporary package.json for electron-builder...');
  
  // Read the original package.json
  const packagePath = path.join(__dirname, '..', 'package.json');
  const original = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
  
  // Create a modified version suitable for electron-builder
  const modified = {
    ...original,
    main: 'electron/main.js',
    devDependencies: {
      ...original.devDependencies,
      'electron': original.dependencies.electron,
      'electron-builder': original.dependencies['electron-builder'],
      'electron-is-dev': original.dependencies['electron-is-dev']
    }
  };
  
  // Electron-builder checks these properties
  modified.author = modified.author || { name: 'Calculator Developer' };
  modified.description = modified.description || 'Scientific Calculator Application';
  
  // Delete properties that cause conflicts
  delete modified.dependencies.electron;
  delete modified.dependencies['electron-builder'];
  delete modified.dependencies['electron-is-dev'];
  
  // Write to a temporary file
  const tempPath = path.join(__dirname, 'temp-package.json');
  fs.writeFileSync(tempPath, JSON.stringify(modified, null, 2));
  
  return tempPath;
};

// Build the web app first
console.log('Building the web application...');

// Run the build command
exec('npm run build', (error, stdout, stderr) => {
  if (error) {
    console.error(`Error building web app: ${error}`);
    process.exit(1);
  }
  
  console.log('Web app built successfully. Building Electron app...');
  
  // Create temporary package.json
  const tempPackagePath = createTempPackageJson();
  
  // Build the Electron app using electron-builder
  const electronBuilderProcess = spawn('npx', [
    'electron-builder', 
    'build', 
    '-c', path.join(__dirname, 'electron-builder.json'),
    '--project', path.dirname(tempPackagePath)
  ], {
    stdio: 'inherit',
    shell: true
  });

  // Handle electron-builder close
  electronBuilderProcess.on('close', code => {
    // Clean up temp package.json
    try {
      fs.unlinkSync(tempPackagePath);
      console.log('Temporary package.json cleaned up');
    } catch (error) {
      console.warn('Failed to clean up temporary file:', error);
    }
    
    if (code === 0) {
      console.log('Electron app built successfully!');
    } else {
      console.error(`Electron build failed with code ${code}`);
      process.exit(code);
    }
  });
});