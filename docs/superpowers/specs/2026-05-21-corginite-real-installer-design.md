# CorgiNite Real Installer Build System — Design

## Overview

Convert the CorgiNite React prototype into an Electron desktop app that produces real `.exe` installers. When the user clicks "Build Installer", the app downloads selected application installers, compiles them into a single NSIS-based installer with a wizard UI, and saves it to the user's Downloads folder.

## Architecture

### Components

1. **Electron Main Process** (`electron/main.js`)
   - Manages the application window
   - Receives build requests via IPC
   - Downloads installer files from known URLs
   - Generates NSIS scripts
   - Compiles NSIS scripts via `makensis`
   - Reports progress back to renderer

2. **Electron Preload Script** (`electron/preload.js`)
   - Exposes `window.electronAPI.invokeBuild()` and `window.electronAPI.onBuildProgress()` to the renderer
   - Secure IPC bridge with no direct Node.js exposure

3. **React Renderer** (existing `src/` files, minimal changes)
   - UI remains unchanged — same 3-step flow
   - Replaces `mockApi.js` with real IPC call
   - Shows real-time progress from main process

4. **NSIS Script Generator** (main process module)
   - Takes the list of downloaded installers and options
   - Generates a `.nsi` script with wizard UI (welcome, progress, finish pages)
   - Configures silent install switches per app type

5. **Installer Downloader** (main process module)
   - Maps each app ID to its official download URL
   - Downloads `.exe`/`.msi` files to a temp directory
   - Retries failed downloads once

### Data Flow

```
User clicks "Build Installer" in React UI
    ↓
Renderer calls window.electronAPI.invokeBuild({ apps, options, name })
    ↓
Main process receives request, creates temp directory
    ↓
For each selected app: download installer to temp folder
    ↓
Generate NSIS .nsi script from downloaded installers
    ↓
Compile .nsi with makensis → produces .exe in Downloads folder
    ↓
Progress updates streamed back to renderer via onBuildProgress
    ↓
Clean up temp directory
    ↓
Renderer shows "Download complete" notification
```

## Generated Installer Behavior

The `.exe` produced by the build is a self-contained NSIS installer that:

1. **Welcome page** — lists all apps to be installed, total estimated size
2. **Directory page** — lets user choose install location (default: `C:\CorgiNite`)
3. **Installing page** — runs each installer silently in sequence with a progress bar
4. **Finish page** — shows summary of installed apps, option to launch apps

### Silent Install Switches

| Installer Type | Silent Switch |
|---|---|
| `.msi` | `/quiet /norestart` |
| `.exe` (Inno Setup) | `/VERYSILENT /NORESTART` |
| `.exe` (NSIS) | `/S` |
| `.exe` (Wise) | `/S /v/qn` |
| Chrome | `/silent /install` |
| Firefox | `-ms` |
| Node.js | `/quiet` |
| Python | `/quiet InstallAllUsers=0` |

## Error Handling

- **Failed download**: Retry once with 3-second delay. If still failing, show error with app name and abort build.
- **NSIS compile failure**: Capture stderr, show error in UI.
- **User cancels mid-build**: Kill all download processes, delete temp directory, reset UI state.
- **No internet**: Detect early, show friendly error before starting downloads.

## File Changes

### Modified Files

| File | Change |
|---|---|
| `package.json` | Add Electron, electron-builder, electron-updater, NSIS dev dependencies; add `electron`, `build`, `build:win` scripts |
| `src/api/mockApi.js` | Replace mock with IPC call to `window.electronAPI.invokeBuild()` |
| `vite.config.js` | Add `base: './'` for Electron compatibility |

### New Files

| File | Purpose |
|---|---|
| `electron/main.js` | Electron main process: window management, IPC handlers, build pipeline |
| `electron/preload.js` | Secure IPC bridge for renderer |
| `electron/downloaders.js` | App-specific download URL mapping and download logic |
| `electron/nsis-generator.js` | NSIS script generation from installer list |
| `electron/build-pipeline.js` | Orchestrates download → generate → compile → save |
| `electron-builder.json` | Electron-builder configuration (output format, NSIS settings, file inclusions) |
| `index.html` | Add `nodeIntegration: false` preload reference (already exists, may need script tag update) |

## Security

- `nodeIntegration: false` in renderer
- `contextIsolation: true`
- Only specific IPC channels exposed via preload
- No arbitrary file system access from renderer
- Downloaded installers verified by file extension before execution

## Build Output

The Electron app itself is packaged by `electron-builder` into:
- `CorgiNite Setup X.X.X.exe` — NSIS installer for the CorgiNite app itself
- Portable option available via electron-builder config

The installers produced by CorgiNite (user-built bundles) are saved to:
- `%USERPROFILE%\Downloads\<installer-name>.exe`
