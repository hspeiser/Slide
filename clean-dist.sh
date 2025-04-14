#!/bin/bash
# This script safely removes the dist directory to avoid permission issues

echo "Cleaning dist directory safely..."

# Check if dist directory exists
if [ -d "dist" ]; then
  echo "Found dist directory, removing it..."
  
  # Try normal removal first
  rm -rf dist
  
  # Check if it was successful
  if [ $? -ne 0 ]; then
    echo "Failed to remove with normal permissions."
    echo "You may need to run this with sudo:"
    echo "sudo ./clean-dist.sh"
    exit 1
  fi
  
  echo "Dist directory successfully removed!"
else
  echo "No dist directory found. Nothing to clean."
fi

# Create fresh dist directory with proper permissions
mkdir -p dist
chmod 755 dist

echo "Ready for a fresh build!"