# CorgiNite Real Installer Build System — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Convert the CorgiNite React prototype into an Electron desktop app that produces real `.exe` installers bundling selected applications with a wizard UI.

**Architecture:** Electron main process handles file downloads, NSIS script generation, and compilation. React renderer stays unchanged visually but calls the main process via IPC instead of the mock API. electron-builder packages the Electron app itself.

**Tech Stack:** Electron, electron-builder, NSIS, Node.js (fs, path, child_process, https), React (existing)

---

### Task 1: Add Electron dependencies and scripts to package.json

**Files:**
- Modify: `package.json`

- [ ] **Step 1: Update package.json with Electron dependencies and scripts**

Replace the entire `scripts` section and add `devDependencies`:

```json
{
  "name": "corgi-nite",
  "private": true,
  "version": "0.0.0",
  "type": "module",
  "main": "electron/main.js",
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "lint": "eslint .",
    "preview": "vite preview",
    "electron:dev": "concurrently \"vite\" \"wait-on http://localhost:5173 && electron .\"",
    "electron:build": "vite build && electron-builder --win",
    "electron:preview": "vite build && electron ."
  },
  "dependencies": {
    "react": "^19.2.6",
    "react-dom": "^19.2.6"
  },
  "devDependencies": {
    "@eslint/js": "^10.0.1",
    "@types/react": "^19.2.14",
    "@types/react-dom": "^19.2.3",
    "@vitejs/plugin-react": "^6.0.1",
    "concurrently": "^9.1.2",
    "electron": "^33.2.0",
    "electron-builder": "^25.1.8",
    "eslint": "^10.3.0",
    "eslint-plugin-react-hooks": "^7.1.1",
    "eslint-plugin-react-refresh": "^0.5.2",
    "globals": "^17.6.0",
    "vite": "^8.0.12",
    "wait-on": "^8.0.2"
  }
}
```

- [ ] **Step 2: Install dependencies**

Run: `npm install`
Expected: All packages installed, no errors

- [ ] **Step 3: Commit**

```bash
git add package.json package-lock.json
git commit -m "chore: add Electron and electron-builder dependencies"
```

---

### Task 2: Create Electron preload script (IPC bridge)

**Files:**
- Create: `electron/preload.js`

- [ ] **Step 1: Create the preload script**

Create `electron/preload.js`:

```javascript
const { contextBridge, ipcRenderer } = require('electron')

contextBridge.exposeInMainWorld('electronAPI', {
  invokeBuild: (payload) => ipcRenderer.invoke('build-installer', payload),
  onBuildProgress: (callback) => {
    const subscription = (event, data) => callback(data)
    ipcRenderer.on('build-progress', subscription)
    return () => ipcRenderer.removeListener('build-progress', subscription)
  },
  onCancelBuild: () => ipcRenderer.send('cancel-build'),
})
```

- [ ] **Step 2: Commit**

```bash
git add electron/preload.js
git commit -m "feat: add Electron preload script with IPC bridge"
```

---

### Task 3: Create Electron main process entry point

**Files:**
- Create: `electron/main.js`

- [ ] **Step 1: Create the main process file**

Create `electron/main.js`:

```javascript
const { app, BrowserWindow, ipcMain } = require('electron')
const path = require('path')
const { runBuildPipeline } = require('./build-pipeline.js')

let mainWindow
let buildInProgress = false
let cancelRequested = false

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 900,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  })

  const isDev = process.env.NODE_ENV === 'development' || !app.isPackaged

  if (isDev) {
    mainWindow.loadURL('http://localhost:5173')
    mainWindow.webContents.openDevTools()
  } else {
    mainWindow.loadFile(path.join(__dirname, '..', 'dist', 'index.html'))
  }
}

app.whenReady().then(createWindow)

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow()
  }
})

ipcMain.handle('build-installer', async (event, payload) => {
  if (buildInProgress) {
    return { success: false, error: 'Build already in progress' }
  }

  buildInProgress = true
  cancelRequested = false

  try {
    const result = await runBuildPipeline(payload, (progress) => {
      mainWindow.webContents.send('build-progress', progress)
    }, () => cancelRequested)

    buildInProgress = false
    return result
  } catch (error) {
    buildInProgress = false
    return { success: false, error: error.message }
  }
})

ipcMain.on('cancel-build', () => {
  cancelRequested = true
})
```

- [ ] **Step 2: Commit**

```bash
git add electron/main.js
git commit -m "feat: add Electron main process with window and IPC handlers"
```

---

### Task 4: Create app download URL mapper and downloader

**Files:**
- Create: `electron/downloaders.js`

- [ ] **Step 1: Create the downloaders module**

Create `electron/downloaders.js`:

```javascript
const https = require('https')
const http = require('http')
const fs = require('fs')
const path = require('path')
const { URL } = require('url')

const appDownloadUrls = {
  '7zip': 'https://www.7-zip.org/a/7z2409-x64.exe',
  peazip: 'https://github.com/peazip/PeaZip/releases/download/10.1.0/peazip-10.1.0.WIN64.exe',
  winrar: 'https://www.rarlab.com/rar/winrar-x64-624.exe',
  anydesk: 'https://download.anydesk.com/AnyDesk.exe',
  teamviewer: 'https://download.teamviewer.com/download/TeamViewer_Setup.exe',
  imgburn: 'https://download.imgburn.com/SetupImgBurn_2.5.8.0.exe',
  'realvnc-server': 'https://www.realvnc.com/download/file/server-standalone/7.13.1/VNC-Server-7.13.1-Windows.exe',
  'realvnc-viewer': 'https://www.realvnc.com/download/file/viewer/7.13.1/VNC-Viewer-7.13.1-Windows.exe',
  tightvnc: 'https://www.tightvnc.com/download/2.8.81/tightvnc-2.8.81-setup-64bit.msi',
  teracopy: 'https://codesector.com/files/teracopy.exe',
  cdburnerxp: 'https://cdburnerxp.se/downloadsetup.exe',
  revo: 'https://download.revouninstaller.com/revo_uninstaller.exe',
  launchy: 'https://github.com/OpenLaunchy/Launchy/releases/download/v3.0.0/Launchy-3.0.0.exe',
  windirstat: 'https://windirstat.net/windirstat1_1_2_setup.exe',
  wiztree: 'https://wiztreefree.com/zipped/WizTree_423_64bit.zip',
  glary: 'https://download.glarysoft.com/gup.exe',
  infrarecorder: 'https://infrarecorder.org/files/0.5.3/irsetup.exe',
  'open-shell': 'https://github.com/Open-Shell/Open-Shell-Menu/releases/download/v4.4.191/OpenShellSetup_4_4_191.exe',
  ccleaner: 'https://download.ccleaner.com/ccsetup5119.exe',
  evernote: 'https://cdn1.evernote.com/win6/public/Evernote_setup.exe',
  'google-earth': 'https://dl.google.com/earth/client/advanced/current/GoogleEarthProWinSetup.exe',
  steam: 'https://cdn.cloudflare.steamstatic.com/client/installer/steamsetup.exe',
  'epic-games': 'https://launcher-public-service-prod06.ol.epicgames.com/launcher/api/installer/download/EpicGamesLauncherInstaller.msi',
  keepass: 'https://sourceforge.net/projects/keepass/files/KeePass%202.x/2.57/KeePass-2.57-Setup.exe/download',
  everything: 'https://www.voidtools.com/Everything-1.4.1.1026.x64-Setup.exe',
  'nv-access': 'https://updates.nvaccess.org/downloads/nvda_snapshot_latest.exe',
  'dotnet-runtime-8': 'https://download.visualstudio.microsoft.com/download/pr/dotnet-runtime-8.0-windows-x64.exe',
  'dotnet-sdk-8': 'https://download.visualstudio.microsoft.com/download/pr/dotnet-sdk-8.0-windows-x64.exe',
  'java-jre-17': 'https://github.com/adoptium/temurin17-binaries/releases/download/jdk-17.0.13%2B11/OpenJDK17U-jre_x64_windows_hotspot_17.0.13_11.msi',
  'java-jdk-17': 'https://github.com/adoptium/temurin17-binaries/releases/download/jdk-17.0.13%2B11/OpenJDK17U-jdk_x64_windows_hotspot_17.0.13_11.msi',
  'vcpp-x64': 'https://aka.ms/vs/17/release/vc_redist.x64.exe',
  'vcpp-x86': 'https://aka.ms/vs/17/release/vc_redist.x86.exe',
  chrome: 'https://dl.google.com/chrome/install/latest/chrome_installer.exe',
  firefox: 'https://download.mozilla.org/?product=firefox-latest&os=win64&lang=en-US',
  edge: 'https://go.microsoft.com/fwlink/?linkid=2109047&Channel=Stable&language=en',
  brave: 'https://laptop-updates.brave.com/latest/winx64',
  git: 'https://github.com/git-for-windows/git/releases/download/v2.47.1.windows.2/Git-2.47.1.2-64-bit.exe',
  nodejs: 'https://nodejs.org/dist/v22.12.0/node-v22.12.0-x64.msi',
  python: 'https://www.python.org/ftp/python/3.13.1/python-3.13.1-amd64.exe',
  vscode: 'https://update.code.visualstudio.com/latest/win32-x64-user/stable',
  docker: 'https://desktop.docker.com/win/main/amd64/Docker%20Desktop%20Installer.exe',
  postman: 'https://dl.pstmn.io/download/win64',
}

const silentSwitches = {
  '7zip': '/S',
  peazip: '/VERYSILENT /NORESTART',
  'winrar': '/S',
  anydesk: '--install "C:\\Program Files\\AnyDesk" --start-with-win --silent',
  teamviewer: '/S',
  imgburn: '/S',
  'realvnc-server': '/VERYSILENT /NORESTART',
  'realvnc-viewer': '/VERYSILENT /NORESTART',
  tightvnc: '/quiet /norestart',
  teracopy: '/VERYSILENT /NORESTART',
  cdburnerxp: '/VERYSILENT /NORESTART',
  revo: '/VERYSILENT /NORESTART',
  launchy: '/VERYSILENT /NORESTART',
  windirstat: '/S',
  glary: '/VERYSILENT /NORESTART',
  infrarecorder: '/S',
  'open-shell': '/quiet',
  ccleaner: '/S',
  evernote: '/S',
  'google-earth': '/S',
  steam: '/S',
  'epic-games': '/quiet /norestart',
  keepass: '/VERYSILENT /NORESTART',
  everything: '/VERYSILENT /NORESTART',
  'nv-access': '/S',
  'dotnet-runtime-8': '/quiet /norestart',
  'dotnet-sdk-8': '/quiet /norestart',
  'java-jre-17': '/quiet /norestart',
  'java-jdk-17': '/quiet /norestart',
  'vcpp-x64': '/quiet /norestart',
  'vcpp-x86': '/quiet /norestart',
  chrome: '/silent /install',
  firefox: '-ms',
  edge: '/silent /install',
  brave: '/silent /install',
  git: '/VERYSILENT /NORESTART',
  nodejs: '/quiet /norestart',
  python: '/quiet InstallAllUsers=0 PrependPath=1',
  vscode: '/VERYSILENT /NORESTART',
  docker: '/S',
  postman: '/S',
}

function getDownloadUrl(appId) {
  const url = appDownloadUrls[appId]
  if (!url) {
    throw new Error(`No download URL configured for app: ${appId}`)
  }
  return url
}

function getSilentSwitch(appId) {
  return silentSwitches[appId] || '/S'
}

function downloadFile(url, dest, onProgress, isCancelled) {
  return new Promise((resolve, reject) => {
    const protocol = url.startsWith('https') ? https : http

    function attempt(retryCount) {
      if (isCancelled()) {
        reject(new Error('Download cancelled'))
        return
      }

      const request = protocol.get(url, { followRedirects: true }, (response) => {
        if (response.statusCode === 301 || response.statusCode === 302) {
          const redirectUrl = response.headers.location
          if (redirectUrl) {
            downloadFile(redirectUrl, dest, onProgress, isCancelled)
              .then(resolve)
              .catch(reject)
          } else {
            reject(new Error('Redirect with no location header'))
          }
          return
        }

        if (response.statusCode !== 200) {
          reject(new Error(`HTTP ${response.statusCode} for ${url}`))
          return
        }

        const totalBytes = parseInt(response.headers['content-length'], 10)
        let downloadedBytes = 0
        const fileStream = fs.createWriteStream(dest)

        response.on('data', (chunk) => {
          if (isCancelled()) {
            request.destroy()
            fileStream.close()
            fs.unlink(dest, () => {})
            reject(new Error('Download cancelled'))
            return
          }

          downloadedBytes += chunk.length
          if (totalBytes) {
            onProgress(Math.round((downloadedBytes / totalBytes) * 100))
          }
        })

        response.pipe(fileStream)

        fileStream.on('finish', () => {
          fileStream.close()
          resolve(dest)
        })

        fileStream.on('error', (err) => {
          fs.unlink(dest, () => {})
          reject(err)
        })
      })

      request.on('error', (err) => {
        if (retryCount < 1) {
          setTimeout(() => attempt(retryCount + 1), 3000)
        } else {
          reject(err)
        }
      })
    }

    attempt(0)
  })
}

module.exports = {
  getDownloadUrl,
  getSilentSwitch,
  downloadFile,
}
```

- [ ] **Step 2: Commit**

```bash
git add electron/downloaders.js
git commit -m "feat: add app download URL mapper and downloader with silent switches"
```

---

### Task 5: Create NSIS script generator

**Files:**
- Create: `electron/nsis-generator.js`

- [ ] **Step 1: Create the NSIS generator module**

Create `electron/nsis-generator.js`:

```javascript
const fs = require('fs')
const path = require('path')
const { getSilentSwitch } = require('./downloaders.js')

function generateNsisScript(installers, bundleName, options, outputDir) {
  const nsiPath = path.join(outputDir, 'bundle.nsi')
  const outputFile = path.join(outputDir, `${bundleName.replace(/[^a-zA-Z0-9_-]/g, '_')}.exe`)

  const installerEntries = installers.map((inst, index) => {
    const silentSwitch = getSilentSwitch(inst.appId)
    const fileName = path.basename(inst.filePath)
    return `
  ; Install ${inst.appName}
  DetailPrint "Installing ${inst.appName}..."
  ExecWait '"$PLUGINSDIR\\${fileName}" ${silentSwitch}' $0
  DetailPrint "${inst.appName} install returned: $0"
`
  }).join('\n')

  const appListText = installers.map((inst) => `  - ${inst.appName}`).join('\\r\\n')

  const nsiContent = `; CorgiNite Bundle Installer
; Generated by CorgiNite
; Bundle: ${bundleName}

!include "MUI2.nsh"
!include "LogicLib.nsh"
!include "x64.nsh"

; General settings
Name "${bundleName}"
OutFile "${outputFile}"
InstallDir "$PROGRAMFILES64\\CorgiNiteBundle"
RequestExecutionLevel admin
ShowInstDetails show

; MUI Settings
!define MUI_ABORTWARNING
!define MUI_ICON ""
!define MUI_UNICON ""

; Pages
!insertmacro MUI_PAGE_WELCOME
!insertmacro MUI_PAGE_DIRECTORY
!insertmacro MUI_PAGE_INSTFILES
!insertmacro MUI_PAGE_FINISH

!insertmacro MUI_LANGUAGE "English"

; Installer sections
Section "Install Applications" SecInstall
  SetOutPath "$INSTDIR"

  ; Extract installers to temp
  InitPluginsDir
${installers.map((inst) => {
    const fileName = path.basename(inst.filePath)
    return `  File "${inst.filePath}"`
  }).join('\n')}

  ; Run each installer silently
${installerEntries}

  ; Clean up extracted installers
  RMDir /r "$PLUGINSDIR"

SectionEnd

; Descriptions
LangString DESC_SecInstall ${LANG_ENGLISH} "Installs all selected applications silently."

!insertmacro MUI_FUNCTION_DESCRIPTION_BEGIN
!insertmacro MUI_DESCRIPTION_TEXT ${SecInstall} $(DESC_SecInstall)
!insertmacro MUI_FUNCTION_DESCRIPTION_END
`

  fs.writeFileSync(nsiPath, nsiContent, 'utf8')
  return { nsiPath, outputFile }
}

module.exports = {
  generateNsisScript,
}
```

- [ ] **Step 2: Commit**

```bash
git add electron/nsis-generator.js
git commit -m "feat: add NSIS script generator with wizard UI pages"
```

---

### Task 6: Create build pipeline orchestrator

**Files:**
- Create: `electron/build-pipeline.js`

- [ ] **Step 1: Create the build pipeline module**

Create `electron/build-pipeline.js`:

```javascript
const fs = require('fs')
const path = require('path')
const { execFile } = require('child_process')
const os = require('os')
const { getDownloadUrl, downloadFile } = require('./downloaders.js')
const { generateNsisScript } = require('./nsis-generator.js')

const CATALOG = [
  { id: '7zip', name: '7-Zip', sizeMb: 4 },
  { id: 'peazip', name: 'PeaZip', sizeMb: 9 },
  { id: 'winrar', name: 'WinRAR', sizeMb: 6 },
  { id: 'anydesk', name: 'AnyDesk', sizeMb: 6 },
  { id: 'teamviewer', name: 'TeamViewer 15', sizeMb: 42 },
  { id: 'imgburn', name: 'ImgBurn', sizeMb: 3 },
  { id: 'realvnc-server', name: 'RealVNC Server', sizeMb: 19 },
  { id: 'realvnc-viewer', name: 'RealVNC Viewer', sizeMb: 12 },
  { id: 'tightvnc', name: 'TightVNC', sizeMb: 8 },
  { id: 'teracopy', name: 'TeraCopy', sizeMb: 7 },
  { id: 'cdburnerxp', name: 'CDBurnerXP', sizeMb: 6 },
  { id: 'revo', name: 'Revo Uninstaller', sizeMb: 17 },
  { id: 'launchy', name: 'Launchy', sizeMb: 5 },
  { id: 'windirstat', name: 'WinDirStat', sizeMb: 8 },
  { id: 'wiztree', name: 'WizTree', sizeMb: 6 },
  { id: 'glary', name: 'Glary Utilities', sizeMb: 20 },
  { id: 'infrarecorder', name: 'InfraRecorder', sizeMb: 3 },
  { id: 'open-shell', name: 'Open-Shell', sizeMb: 7 },
  { id: 'ccleaner', name: 'CCleaner', sizeMb: 34 },
  { id: 'evernote', name: 'Evernote', sizeMb: 210 },
  { id: 'google-earth', name: 'Google Earth', sizeMb: 70 },
  { id: 'steam', name: 'Steam', sizeMb: 3 },
  { id: 'epic-games', name: 'Epic Games Launcher', sizeMb: 100 },
  { id: 'keepass', name: 'KeePass 2', sizeMb: 4 },
  { id: 'everything', name: 'Everything', sizeMb: 2 },
  { id: 'nv-access', name: 'NV Access', sizeMb: 30 },
  { id: 'dotnet-runtime-8', name: '.NET Desktop Runtime 8', sizeMb: 60 },
  { id: 'dotnet-sdk-8', name: '.NET SDK 8', sizeMb: 210 },
  { id: 'java-jre-17', name: 'Java Runtime 17', sizeMb: 80 },
  { id: 'java-jdk-17', name: 'Java Development Kit 17', sizeMb: 190 },
  { id: 'vcpp-x64', name: 'Visual C++ Redist 2015-2022 x64', sizeMb: 25 },
  { id: 'vcpp-x86', name: 'Visual C++ Redist 2015-2022 x86', sizeMb: 22 },
  { id: 'chrome', name: 'Google Chrome', sizeMb: 120 },
  { id: 'firefox', name: 'Mozilla Firefox', sizeMb: 95 },
  { id: 'edge', name: 'Microsoft Edge', sizeMb: 130 },
  { id: 'brave', name: 'Brave', sizeMb: 110 },
  { id: 'git', name: 'Git for Windows', sizeMb: 52 },
  { id: 'nodejs', name: 'Node.js LTS', sizeMb: 45 },
  { id: 'python', name: 'Python 3', sizeMb: 50 },
  { id: 'vscode', name: 'Visual Studio Code', sizeMb: 120 },
  { id: 'docker', name: 'Docker Desktop', sizeMb: 480 },
  { id: 'postman', name: 'Postman', sizeMb: 130 },
]

function getAppInfo(appId) {
  const app = CATALOG.find((a) => a.id === appId)
  if (!app) {
    throw new Error(`Unknown app ID: ${appId}`)
  }
  return app
}

async function runBuildPipeline(payload, onProgress, isCancelled) {
  const { apps, name, options } = payload
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'corginite-build-'))
  const downloadsDir = path.join(tempDir, 'downloads')
  fs.mkdirSync(downloadsDir, { recursive: true })

  const installers = []

  try {
    // Phase 1: Download installers
    onProgress({ phase: 'downloading', step: 0, total: apps.length, message: 'Starting downloads...' })

    for (let i = 0; i < apps.length; i++) {
      if (isCancelled()) {
        throw new Error('Build cancelled by user')
      }

      const appId = apps[i]
      const appInfo = getAppInfo(appId)
      const url = getDownloadUrl(appId)
      const fileName = path.basename(new URL(url).pathname) || `${appId}_installer.exe`
      const destPath = path.join(downloadsDir, fileName)

      onProgress({
        phase: 'downloading',
        step: i + 1,
        total: apps.length,
        message: `Downloading ${appInfo.name}...`,
        appId,
      })

      await downloadFile(url, destPath, (percent) => {
        onProgress({
          phase: 'downloading',
          step: i + 1,
          total: apps.length,
          message: `Downloading ${appInfo.name}... ${percent}%`,
          appId,
          downloadPercent: percent,
        })
      }, isCancelled)

      installers.push({
        appId,
        appName: appInfo.name,
        filePath: destPath,
      })
    }

    if (isCancelled()) {
      throw new Error('Build cancelled by user')
    }

    // Phase 2: Generate NSIS script
    onProgress({ phase: 'generating', step: 0, total: 1, message: 'Generating installer script...' })

    const { nsiPath, outputFile } = generateNsisScript(installers, name, options, tempDir)

    if (isCancelled()) {
      throw new Error('Build cancelled by user')
    }

    // Phase 3: Compile with makensis
    onProgress({ phase: 'compiling', step: 0, total: 1, message: 'Compiling installer...' })

    const makensisPath = path.join(
      __dirname,
      '..',
      'node_modules',
      'electron-builder',
      'node_modules',
      '7zip-bin',
      'win',
      'x64',
      '7za.exe'
    )

    // Use electron-builder's bundled makensis if available, otherwise try system PATH
    const nsisBinPath = path.join(
      __dirname,
      '..',
      'node_modules',
      'electron-builder',
      'node_modules',
      'app-builder-bin',
      'win',
      'x64',
      'makensis.exe'
    )

    const makensis = fs.existsSync(nsisBinPath) ? nsisBinPath : 'makensis'

    await new Promise((resolve, reject) => {
      execFile(makensis, [nsiPath], { cwd: tempDir }, (error, stdout, stderr) => {
        if (error) {
          reject(new Error(`NSIS compilation failed: ${stderr || error.message}`))
          return
        }
        resolve()
      })
    })

    if (isCancelled()) {
      throw new Error('Build cancelled by user')
    }

    // Phase 4: Copy to Downloads folder
    onProgress({ phase: 'finalizing', step: 0, total: 1, message: 'Saving installer...' })

    const downloadsFolder = path.join(os.homedir(), 'Downloads')
    const finalPath = path.join(downloadsFolder, path.basename(outputFile))

    if (fs.existsSync(outputFile)) {
      fs.copyFileSync(outputFile, finalPath)
    } else {
      throw new Error('Compiled installer not found. NSIS may not be installed.')
    }

    // Cleanup
    cleanupTempDir(tempDir)

    onProgress({ phase: 'complete', step: 1, total: 1, message: 'Installer ready!', outputPath: finalPath })

    return {
      success: true,
      outputPath: finalPath,
      installerCount: installers.length,
    }
  } catch (error) {
    cleanupTempDir(tempDir)
    throw error
  }
}

function cleanupTempDir(dir) {
  try {
    fs.rmSync(dir, { recursive: true, force: true })
  } catch (err) {
    console.error('Failed to cleanup temp directory:', dir, err)
  }
}

module.exports = {
  runBuildPipeline,
}
```

- [ ] **Step 2: Commit**

```bash
git add electron/build-pipeline.js
git commit -m "feat: add build pipeline orchestrator with download, generate, compile phases"
```

---

### Task 7: Update vite.config.js for Electron compatibility

**Files:**
- Modify: `vite.config.js`

- [ ] **Step 1: Update Vite config**

Replace `vite.config.js` content:

```javascript
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  base: './',
  build: {
    outDir: 'dist',
  },
})
```

- [ ] **Step 2: Commit**

```bash
git add vite.config.js
git commit -m "chore: update Vite config for Electron compatibility"
```

---

### Task 8: Replace mockApi.js with real IPC call

**Files:**
- Modify: `src/api/mockApi.js`

- [ ] **Step 1: Replace mock API with real IPC call**

Replace `src/api/mockApi.js` content:

```javascript
export const requestBuild = async ({ apps, name, options }) => {
  if (!window.electronAPI) {
    throw new Error('Electron API not available. Run inside Electron.')
  }

  return new Promise((resolve, reject) => {
    let completed = false

    const progressHandler = window.electronAPI.onBuildProgress((data) => {
      if (data.phase === 'complete' && !completed) {
        completed = true
        progressHandler()
        resolve({
          buildId: `CN-${Date.now().toString().slice(-4)}`,
          outputPath: data.outputPath,
          installerCount: data.installerCount,
        })
      }
    })

    window.electronAPI
      .invokeBuild({ apps, name, options })
      .then((result) => {
        if (!result.success) {
          completed = true
          progressHandler()
          reject(new Error(result.error || 'Build failed'))
        }
      })
      .catch((error) => {
        if (!completed) {
          completed = true
          progressHandler()
          reject(error)
        }
      })
  })
}
```

- [ ] **Step 2: Commit**

```bash
git add src/api/mockApi.js
git commit -m "feat: replace mock API with real Electron IPC build call"
```

---

### Task 9: Add progress handling to App.jsx

**Files:**
- Modify: `src/App.jsx`

- [ ] **Step 1: Add progress state and IPC listener to App.jsx**

In `src/App.jsx`, add a new state variable after the existing state declarations (around line 534):

```javascript
const [buildProgress, setBuildProgress] = useState(null)
```

Replace the `startBuild` function (lines 680-728) with:

```javascript
const startBuild = async () => {
  if (selectedCount === 0) {
    setActiveStepId('apps')
    setErrorMessage('Select at least one app to start a build.')
    return
  }

  if (!installerName.trim()) {
    setActiveStepId('output')
    setErrorMessage('Enter an installer name before building.')
    return
  }

  if (!window.electronAPI) {
    setErrorMessage('Electron is not available. This feature requires the desktop app.')
    return
  }

  setErrorMessage('')
  setActiveStepId('review')
  setBuildStatus('building')
  setBuildStep(0)
  setBuildId('')
  setBuildProgress(null)
  clearTimers()

  const progressHandler = window.electronAPI.onBuildProgress((data) => {
    setBuildProgress(data)

    const phaseSteps = {
      downloading: buildSteps.length * 0.6,
      generating: buildSteps.length * 0.8,
      compiling: buildSteps.length * 0.9,
      finalizing: buildSteps.length,
    }

    const phaseWeight = phaseSteps[data.phase] || 0
    const stepProgress = data.total > 0 ? data.step / data.total : 0
    const totalStep = Math.ceil(phaseWeight * stepProgress)
    setBuildStep(totalStep)

    if (data.phase === 'complete') {
      setBuildStatus('ready')
      setBuildStep(buildSteps.length)
      setBuildId(`CN-${Date.now().toString().slice(-4)}`)
    }
  })

  try {
    await window.electronAPI.invokeBuild({
      apps: Array.from(selectedIds),
      name: installerName.trim(),
      options,
    })
  } catch (error) {
    console.error('Build failed', { error })
    setBuildStatus('idle')
    setBuildStep(0)
    setBuildProgress(null)
    setErrorMessage(`Build failed: ${error.message}`)
  } finally {
    progressHandler()
  }
}
```

Add `buildProgress` to the cleanup in `resetBuild` (around line 730-735):

```javascript
const resetBuild = () => {
  clearTimers()
  setBuildStatus('idle')
  setBuildStep(0)
  setBuildId('')
  setBuildProgress(null)
}
```

Update the build dialog subtitle to show real progress (around line 1387):

Replace:
```javascript
<p className="build-subtitle">{activeStep}</p>
```

With:
```javascript
<p className="build-subtitle">{buildProgress?.message || activeStep}</p>
```

- [ ] **Step 2: Commit**

```bash
git add src/App.jsx
git commit -m "feat: add real-time build progress handling from Electron IPC"
```

---

### Task 10: Create electron-builder configuration

**Files:**
- Create: `electron-builder.json`

- [ ] **Step 1: Create electron-builder config**

Create `electron-builder.json`:

```json
{
  "appId": "com.corginite.builder",
  "productName": "CorgiNite",
  "directories": {
    "output": "release"
  },
  "files": [
    "dist/**/*",
    "electron/**/*",
    "package.json"
  ],
  "win": {
    "target": [
      {
        "target": "nsis",
        "arch": ["x64"]
      }
    ],
    "icon": "public/favicon.svg"
  },
  "nsis": {
    "oneClick": false,
    "allowToChangeInstallationDirectory": true,
    "createDesktopShortcut": true,
    "createStartMenuShortcut": true,
    "shortcutName": "CorgiNite",
    "include": null,
    "installerIcon": null,
    "uninstallerIcon": null,
    "installerHeaderIcon": null,
    "differentialPackage": false
  },
  "publish": null
}
```

- [ ] **Step 2: Add build config reference to package.json**

Add to `package.json` at the top level:

```json
"build": {
  "extends": "electron-builder.json"
}
```

- [ ] **Step 3: Commit**

```bash
git add electron-builder.json package.json
git commit -m "chore: add electron-builder configuration for Windows NSIS installer"
```

---

### Task 11: Test the Electron dev mode

**Files:**
- No file changes

- [ ] **Step 1: Build the Vite bundle**

Run: `npm run build`
Expected: `dist/` folder created with `index.html`, JS, CSS

- [ ] **Step 2: Start Electron in dev mode**

Run: `npm run electron:dev`
Expected: Electron window opens showing the CorgiNite UI

- [ ] **Step 3: Test build flow**

In the Electron window:
1. Select some apps
2. Go to step 2, confirm name
3. Go to step 3, click "Build Installer"
4. Verify progress updates appear
5. Check that an `.exe` appears in Downloads folder (may fail if NSIS not installed — that's expected for now)

- [ ] **Step 4: Commit any fixes**

```bash
git add -A
git commit -m "fix: address issues found during dev mode testing"
```

---

### Task 12: Build the production Electron app

**Files:**
- No file changes

- [ ] **Step 1: Build the production installer**

Run: `npm run electron:build`
Expected: `release/` folder created with `CorgiNite Setup 0.0.0.exe`

- [ ] **Step 2: Verify the output**

Check that `release/CorgiNite Setup 0.0.0.exe` exists and is a valid installer.

- [ ] **Step 3: Commit**

```bash
git add -A
git commit -m "chore: production build artifacts"
```
