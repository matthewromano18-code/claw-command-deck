# Nexxen Mission Control

Desktop control center for managing an agency powered by OpenClaw agents.

## Tech Stack

- **Frontend:** React 18, TypeScript, Tailwind CSS, shadcn/ui
- **Desktop:** Tauri 2 (macOS packaging)
- **Build:** Vite 5
- **State:** TanStack React Query
- **Routing:** React Router 6

## Development

```bash
# Install dependencies
npm install

# Start dev server (browser preview)
npm run dev

# Start Tauri dev mode (native window + hot reload)
npm run tauri:dev
```

## Build

```bash
# Web build
npm run build

# macOS desktop build (.app + .dmg)
npm run tauri:build
```

## Architecture

```
src/
├── components/         # UI components
│   ├── dashboard/      # Dashboard widgets
│   ├── gateway/        # Gateway connection UI
│   ├── setup/          # Setup & config center
│   └── ui/             # shadcn/ui primitives
├── data/               # Mock data & type definitions
├── hooks/              # React hooks
├── integration/        # Event bus
├── pages/              # Route pages
└── services/
    ├── desktop/        # Native/CLI operations
    ├── openclaw/       # Gateway connection, config, health
    └── platform/       # Browser/Tauri abstraction layer

src-tauri/              # Tauri native shell (Rust)
```

## Tauri Desktop Setup

See [TAURI_SETUP.md](./TAURI_SETUP.md) for prerequisites, local development, and macOS packaging instructions.

## License

Proprietary — Nexxen Solutions
