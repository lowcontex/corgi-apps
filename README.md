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

## Notes

This prototype does not compile real installers. The build flow is stubbed in
the mock API module inside the src folder.
