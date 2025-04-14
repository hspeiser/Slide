#!/bin/bash
# Simplified compatibility script for macOS 15.3+ (Ventura, Sonoma)
# This script launches Electron with minimal configuration to avoid
# conflicts between flags that may cause Mach port rendezvous failures

echo "Starting Electron with simplified macOS compatibility mode..."
echo "This uses hardware acceleration disabling via API instead of flags"
echo "to fix crashes on macOS 15.3+"

# Ensure we're in the project root
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
cd "$SCRIPT_DIR"

# Make sure the compatibility script is executable
chmod +x electron/run-macos-compat.js

# Launch with minimal compatible settings
# The main fixes now happen in macos-app-config.js
cd electron && node run-macos-compat.js