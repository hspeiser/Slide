#!/bin/bash
# Simple script to run the Electron app in standalone mode
# This doesn't require a running server

echo "Starting Electron in standalone mode..."
cd electron && node start-standalone.js