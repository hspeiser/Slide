#!/bin/bash
# Special script for modern macOS systems with compatibility fixes
# This script is specifically designed for macOS 15.3+ (Ventura, Sonoma)
# where the standard Electron app might crash with SIGTRAP errors

echo "Starting Electron with macOS compatibility mode..."
echo "This mode uses special settings for macOS 15.3+ compatibility"

# Ensure we're in the project root
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
cd "$SCRIPT_DIR"

# Make sure the compatibility script is executable
chmod +x electron/run-macos-compat.js

# Launch with compatibility mode
cd electron && node run-macos-compat.js