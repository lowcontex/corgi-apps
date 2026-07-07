# CorgiNite Installer Builder UI

UI-only React prototype for selecting apps and generating one PowerShell
bootstrap script. The build flow is simulated with a staged progress UI.

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
function. That keeps the UI and download flow working in the browser and returns
the same PowerShell bootstrap script used locally.

For the full install workflow, run the downloaded `.ps1` as Administrator on a
Windows machine with `winget` available. If `winget` is missing, the script tries
to bootstrap Chocolatey as a fallback dependency manager and explains the next step.
Vercel is best for sharing the polished UI and script download.

## Notes

This prototype does not compile real installers. The build flow generates a
bootstrap script that installs the selected apps from Winget package IDs.
