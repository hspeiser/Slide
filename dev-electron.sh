#!/bin/bash
# Script to start both the development server and Electron
# This is a convenience script for development

echo "Starting both the development server and Electron..."

# Start the development server in the background
npm run dev &
SERVER_PID=$!

# Wait for server to be ready
echo "Waiting for server to be ready..."
sleep 5

# Start Electron
cd electron && node connect-to-server.js

# Kill the server when Electron exits
kill $SERVER_PID