// This script builds the application without cleaning the dist directory first
// Useful for avoiding permission issues on macOS

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('Building application without cleaning dist directory first...');

// Create dist directory if it doesn't exist
const distDir = path.join(__dirname, 'dist');
if (!fs.existsSync(distDir)) {
  fs.mkdirSync(distDir, { recursive: true });
}

// Make sure public/assets directory exists in dist
const assetsDir = path.join(distDir, 'public', 'assets');
if (!fs.existsSync(assetsDir)) {
  fs.mkdirSync(assetsDir, { recursive: true });
}

try {
  // Run Vite build with SKIP_CLEAN to prevent it from cleaning the dist directory
  console.log('Running Vite build...');
  execSync('SKIP_VITE_CLEAN=true npx vite build --emptyOutDir false', {
    stdio: 'inherit',
    env: {
      ...process.env,
      SKIP_VITE_CLEAN: 'true'
    }
  });
  
  // Build the server portion
  console.log('Building server...');
  execSync('npx esbuild server/index.ts --platform=node --packages=external --bundle --format=esm --outdir=dist', {
    stdio: 'inherit'
  });
  
  console.log('Build completed successfully!');
} catch (error) {
  console.error('Build failed:', error.message);
  process.exit(1);
}