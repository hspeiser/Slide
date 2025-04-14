# Electron Setup for Calculator App

This directory contains all the configuration for running the calculator app as an Electron desktop application.

## Running Options

You have several options for running the Electron app:

### 1. With Development Server (recommended for development)

This starts the development server and then launches Electron pointing to it:

```bash
# From project root
npm run dev

# Then in another terminal:
cd electron
node connect-to-server.js
```

### 2. Pure Standalone Mode (no server, no build required)

This runs Electron directly without needing a server or built files - best for quick testing:

```bash
# From project root
cd electron
node start-standalone.js
```

### 3. Standalone Mode with Built Files

This uses pre-built files for a more production-like experience:

```bash
# From project root
npm run build
cd electron
node run-standalone.js
```

### 4. Full Production Build

This creates a packaged Electron application:

```bash
# From project root
npm run build
./build-electron.sh  # or build-electron.bat on Windows
```

## Troubleshooting

- If you see port binding errors when starting the dev server, try running with the standalone mode instead.
- On macOS, if you encounter permission issues when building, try running the commands with sudo or adjust permissions in your project directory.
- If Electron can't connect to the server, check that the server is actually running and that there are no firewalls blocking access to port 5000.

### macOS Compatibility Issues

If you encounter crashes or strange behavior on macOS (especially newer versions like Ventura or Sonoma), try using the simplified macOS compatibility mode:

```bash
# From project root
./run-electron-macos.sh
```

This mode disables hardware acceleration via the Electron API rather than using multiple command-line flags, which can cause conflicts and Mach port rendezvous failures.

#### What the Simplified Approach Fixes

- Application crashes on startup (SIGTRAP errors)
- Mach port rendezvous failures (`ERROR:mach_port_rendezvous.cc` messages)
- App termination due to missing parent process
- Window rendering issues

#### How It Works

The simplified compatibility approach:

1. Disables hardware acceleration through a single official API call (`app.disableHardwareAcceleration()`)
2. Avoids using multiple conflicting GPU flags
3. Uses a simplified window configuration with no transparency or vibrancy effects
4. Eliminates the sandbox modifications that can cause IPC issues

Unlike the previous approach that used multiple flags, this method targets the specific issue with macOS 15.3+ and Electron by using only the officially supported method to disable GPU acceleration.

## Environment Variables

- `ELECTRON_STANDALONE=true` - Forces Electron to run in standalone mode without a server
- `ELECTRON_IS_DEV=1` - Forces development mode (opens DevTools)

## Command Line Arguments 

- `--standalone` - Alternative way to enable standalone mode