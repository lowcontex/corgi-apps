# CorgiNite Installer Builder UI

UI-only React prototype for selecting apps and compiling them into one installer
bundle. The build flow is simulated with a mocked API and staged progress.

## Features

- Search and filter app catalogs
- Quick bundle presets
- Build summary with estimated package size
- Output options for architecture, offline cache, and silent installs

## Run locally

```bash
npm install
npm run dev
```

## Deploying to Vercel

The Vercel deployment uses the static React build plus a preview `/api/build-installer`
function. That keeps the UI and download flow working in the browser, but the
real NSIS/winget installer pipeline still runs in the local desktop/server setup.

For the full installer workflow, use the local `npm run dev` server or the
Electron desktop app. Vercel is best for sharing the polished UI and demo build.

## Notes

This prototype does not compile real installers. The build flow is stubbed in
the mock API module inside the src folder.
