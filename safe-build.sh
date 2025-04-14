#!/bin/bash
# This script provides a safer way to build the application on macOS
# by manually handling the directory cleanup first

echo "Starting safe build process..."

# Ensure scripts are executable
chmod +x fix-permissions.sh
chmod +x clean-dist.sh

# Step 1: Fix any existing permissions issues
./fix-permissions.sh

# Step 2: Safely clean the dist directory
./clean-dist.sh

# Check if clean was successful
if [ $? -ne 0 ]; then
  echo "Failed to clean dist directory. Try running with sudo:"
  echo "sudo ./clean-dist.sh"
  echo "Then run this script again."
  exit 1
fi

# Step 3: Create necessary subdirectories with proper permissions
mkdir -p dist/public/assets
chmod -R 755 dist

echo "Directory structure prepared. Running build..."

# Step 4: Run the build
npm run build

# Check if build was successful
if [ $? -ne 0 ]; then
  echo "Build failed. See errors above."
  exit 1
fi

echo "Build completed successfully!"
echo ""
echo "You can now run the Electron app in standalone mode:"
echo "cd electron && node run-standalone.js"