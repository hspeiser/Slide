# Scientific Calculator

A powerful scientific calculator application that provides an intuitive and advanced mathematical computation experience across desktop platforms.

## Features

- Advanced scientific calculations with mathjs integration
- Variable support for complex calculations
- Cross-platform compatibility (Web and Desktop)
- Standalone mode - works without requiring a web server
- Dark mode support

## Running the Application

### Web Application

To run the application as a web app:

```bash
# Start the development server
npm run dev
```

Visit `http://localhost:5000` in your browser to use the application.

### Desktop Application (Electron)

There are multiple ways to run the application as a desktop app:

#### Option 1: With Development Server (recommended for development)

Start the development server first, then run Electron pointing to it:

```bash
# Unix/Linux/Mac
./run-electron.sh

# Windows
run-electron.bat
```

#### Option 2: Pure Standalone Mode (no server required)

Run the Electron app directly without needing a running server:

```bash
# Unix/Linux/Mac
./run-electron-standalone.sh

# Windows
run-electron-standalone.bat
```

#### Option 3: All-in-One Development Mode

Start both the development server and Electron app with a single command:

```bash
# Unix/Linux/Mac
./dev-electron.sh

# Windows
dev-electron.bat
```

## Development

For detailed information about the Electron setup, see the [Electron README](./electron/README.md).

### Technology Stack

- TypeScript React frontend
- Tailwind CSS for responsive design
- Express backend (optional)
- Mathjs for calculations
- Electron for desktop apps

## Building for Production

To build the application for production:

```bash
# Build the web application
npm run build

# Build the Electron desktop application
./build-electron.sh  # or build-electron.bat on Windows
```

## Troubleshooting

- If you encounter port binding errors, try using the standalone mode instead.
- For permission issues on macOS when building, use sudo or adjust file permissions.
- If Electron can't connect to the server, verify the server is running and no firewalls are blocking port 5000.