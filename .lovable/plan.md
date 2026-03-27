

# Pre-Export Readiness Audit — Nexxen Mission Control

---

## A. Executive Verdict: 🟡 YELLOW

**Exportable, but fix these issues first.**

The codebase is structurally sound — clean service isolation, good hook patterns, proper Tauri abstraction. But there are several low-effort issues that would make this look unprofessional or cause confusion on GitHub.

---

## B. Blockers (fix before export)

| # | Severity | File(s) | Issue | Smallest Fix |
|---|----------|---------|-------|-------------|
| 1 | **High** | `package.json` | Package name is `vite_react_shadcn_ts` — generic Lovable scaffold name. Anyone cloning sees a template, not a product. | Change `"name"` to `"nexxen-mission-control"` |
| 2 | **High** | `README.md` | Contains only "Welcome to your Lovable project / TODO: Document your project here". This is the first thing anyone sees on GitHub. | Replace with a real project README (name, description, setup, scripts) |
| 3 | **Medium** | `src/pages/Index.tsx` | Dead Lovable placeholder page with `data-lovable-blank-page-placeholder` attribute and placeholder.svg. Route `/` redirects away from it, but the file ships in the repo. | Delete the file or replace with a redirect component |
| 4 | **Medium** | `src/assets/nexxen-logo.png` | File exists but is no longer imported anywhere (removed in recent edit). Orphaned binary asset in repo. | Delete the file, or re-add the import if the logo is wanted |
| 5 | **Medium** | `index.html` | Likely still has Lovable default `<title>` tag. Should say "Nexxen Mission Control". | Update `<title>` |

---

## C. Warnings (non-blocking, clean soon)

| # | File(s) | Issue |
|---|---------|-------|
| 1 | `package.json` | `next-themes` is a dependency but only used in `sonner.tsx` — a Next.js package in a Vite/Tauri app. Works but looks odd. |
| 2 | `.gitignore` | Missing: `.env`, `.env.*`, `*.tsbuildinfo`, `src-tauri/target/`, `bun.lockb`. The Rust `target/` dir could be massive if someone runs `cargo build` locally. |
| 3 | `bun.lock` + `bun.lockb` | Two lock file formats (bun) alongside `package-lock.json` (npm). Pick one package manager; remove the others' lock files or gitignore them. |
| 4 | `src/components/NavLink.tsx` | Unused component — `AppNav.tsx` imports `NavLink` directly from `react-router-dom`, not this wrapper. |
| 5 | `public/placeholder.svg` | Lovable default placeholder. Only referenced by `Index.tsx` (also dead). |
| 6 | `package.json` `"version": "0.0.0"` | Should be `"1.0.0"` or similar for a real product. |
| 7 | `playwright-fixture.ts` + `playwright.config.ts` | Lovable test scaffolding — decide if you want these in the public repo or gitignored. |
| 8 | `tsconfig.app.tsbuildinfo` / `tsconfig.node.tsbuildinfo` | Build artifacts checked into repo. Should be gitignored. |

---

## D. Pass/Fail Checklist

| Area | Status | Notes |
|------|--------|-------|
| Build readiness | ✅ Pass | Vite config, tsconfig, aliases all correct |
| Repo hygiene | ❌ Fail | Generic package name, placeholder files, multiple lock files, tsbuildinfo committed |
| Secret safety | ✅ Pass | No hardcoded secrets. Auth tokens stored via platform abstraction. Bearer header built from stored token only. |
| Environment setup | ⚠️ Warn | No `.env.example`. `.gitignore` missing `.env` and Tauri `target/` |
| Architecture quality | ✅ Pass | Clean service/hook/component separation. Mock data isolated in `data/`. Platform abstraction solid. |
| OpenClaw readiness | ✅ Pass | All gateway logic in `services/openclaw/`. Config, auth, health, setup fully isolated from UI. |
| Desktop/Tauri readiness | ✅ Pass | `src-tauri/` properly structured. Platform detection in place. `base: "./"` set for file:// protocol. |
| Documentation | ❌ Fail | README is empty placeholder. TAURI_SETUP.md exists but README doesn't reference it. |
| Branding/polish | ⚠️ Warn | Dead `Index.tsx` placeholder, orphaned logo asset, generic package name |

---

## E. Missing Files / Docs

| File | Needed? | Why |
|------|---------|-----|
| `README.md` | **Yes — rewrite** | Currently a placeholder. Need project name, description, prerequisites, dev commands, architecture overview, export/build instructions. |
| `.env.example` | **Yes** | Even if empty now, establishes the pattern for future OpenClaw config keys. |
| `LICENSE` | **Recommended** | Needed if the repo will be public or shared with contractors. |
| `CONTRIBUTING.md` | Optional | Not needed for initial export. |
| `docs/architecture.md` | Optional | TAURI_SETUP.md partially covers this. Can add later. |

---

## F. Recommended Next Prompt

Send this as your next message after approving:

> Fix only the pre-export blockers identified in the audit. Do not refactor or add features.
>
> 1. Rename `package.json` name to `nexxen-mission-control` and version to `1.0.0`
> 2. Replace `README.md` with a proper project README for Nexxen Mission Control (description, tech stack, dev commands, architecture summary, export/build notes)
> 3. Delete `src/pages/Index.tsx` and `public/placeholder.svg`
> 4. Delete `src/assets/nexxen-logo.png` (orphaned, no longer imported)
> 5. Update `index.html` title to "Nexxen Mission Control"
> 6. Update `.gitignore` to include: `.env`, `.env.*`, `*.tsbuildinfo`, `src-tauri/target/`, `bun.lockb`
> 7. Create a minimal `.env.example` with comments for future OpenClaw config
> 8. Remove `bun.lock` and `bun.lockb` from the repo (keep `package-lock.json` only)
> 9. Keep all changes minimal and reversible. Do not refactor anything else.

