#!/bin/bash
# This script fixes permissions issues that can occur on macOS 
# when running the build process

echo "Fixing permissions on dist directory..."

# Check if dist directory exists
if [ -d "dist" ]; then
  echo "Found dist directory, applying permissions fix..."
  
  # Fix permissions
  chmod -R 755 dist
  
  echo "Permissions fixed!"
else
  echo "No dist directory found. Nothing to fix."
fi

echo "Done!"