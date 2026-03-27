# Mission Control — Tauri Desktop Setup

## Prerequisites

1. **Rust toolchain** — [Install rustup](https://rustup.rs/)
2. **Xcode Command Line Tools** — `xcode-select --install`
3. **Node.js 18+** — already present if you've been developing
4. **Tauri CLI** — `cargo install tauri-cli@^2`

## Quick Start (Local Development)

```bash
# 1. Clone the repo from GitHub
git clone <your-repo-url> mission-control
cd mission-control

# 2. Install JS dependencies
npm install

# 3. Install Tauri JS plugin packages
npm install @tauri-apps/api@^2 @tauri-apps/plugin-store@^2 \
  @tauri-apps/plugin-notification@^2 @tauri-apps/plugin-shell@^2 \
  @tauri-apps/plugin-os@^2

# 4. Run in dev mode (opens native window + hot reload)
npm run tauri:dev
```

## Build for macOS

```bash
# Produces a .app bundle and .dmg installer
npm run tauri:build

# Output: src-tauri/target/release/bundle/dmg/
#         src-tauri/target/release/bundle/macos/Mission Control.app
```

## Project Structure

```
├── src/                          # React frontend
│   ├── services/
│   │   ├── platform/             # Abstraction layer
│   │   │   ├── types.ts          # IStorage, IShell, etc.
│   │   │   ├── browser.ts        # Browser fallbacks
│   │   │   ├── tauri.ts          # Tauri native implementations
│   │   │   └── index.ts          # Auto-detects environment
│   │   ├── openclaw/             # Gateway connection logic
│   │   │   ├── connection.ts     # WebSocket state machine
│   │   │   ├── gateway-api.ts    # REST client
│   │   │   ├── auth.ts           # Auth/pairing service
│   │   │   ├── config.ts         # Default endpoints
│   │   │   └── types.ts          # Connection types
│   │   └── desktop/              # Desktop-only utilities
│   │       ├── gateway-commands.ts
│   │       └── system-info.ts
│   ├── components/gateway/       # Gateway status UI
│   └── hooks/useGatewayConnection.ts
├── src-tauri/                    # Tauri native shell
│   ├── Cargo.toml
│   ├── tauri.conf.json           # Window config, CSP, bundle settings
│   ├── capabilities/default.json # Permissions
│   └── src/
│       ├── main.rs               # Entry point
│       ├── lib.rs                # Plugin registration
│       └── commands.rs           # Rust commands (gateway CLI wrappers)
```

## How It Works

- In **browser** (Lovable preview): Uses localStorage, browser Notification API, shell commands are no-ops
- In **Tauri** (desktop): Detects `window.__TAURI__`, swaps to native storage (`tauri-plugin-store`), native notifications, and real shell commands via Rust

## Generating App Icons

```bash
# Place a 1024x1024 icon.png in src-tauri/icons/ then:
cargo tauri icon src-tauri/icons/icon.png
```

## OpenClaw Gateway

The app connects to a local OpenClaw Gateway by default:
- WebSocket: `ws://127.0.0.1:18789`
- HTTP API: `http://127.0.0.1:18789`

If the gateway isn't running, the UI shows clear status and instructions.
