# CorgiNite Installer Builder UI

CorgiNite is a UI prototype (React + Vite) and optional Electron shell that helps you select apps from a catalog and generate a PowerShell bootstrap script (.ps1) to install those apps via Winget. The project simulates a staged "build" flow in the UI and produces a Bootstrap installer script — it does not compile native installers by itself.

Highlights
- Search and filter app catalogs
- Quick bundle presets
- Build summary with estimated package size
- Output options for architecture, offline cache, and silent installs
- Generates a PowerShell bootstrap script that uses Winget and falls back to Chocolatey
- Optional Electron shell and Windows NSIS packaging (electron-builder)

Quick start (development)
Prerequisites
- Node.js (v18+ recommended)
- npm
- For testing generated scripts: Windows with Winget (or be ready to allow Chocolatey to be bootstrapped)

Install deps
```bash
npm install
