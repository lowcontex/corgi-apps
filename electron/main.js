const { app, BrowserWindow, ipcMain, shell } = require('electron')
const fs = require('fs')
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
      if (mainWindow && !mainWindow.isDestroyed()) {
        mainWindow.webContents.send('build-progress', progress)
      }
    }, () => cancelRequested)

    buildInProgress = false
    return { success: true, ...result }
  } catch (error) {
    buildInProgress = false
    return { success: false, error: error.message }
  }
})

ipcMain.handle('download-built-installer', async (event, outputPath) => {
  if (!outputPath || typeof outputPath !== 'string') {
    return { success: false, error: 'Installer path missing' }
  }

  if (!fs.existsSync(outputPath)) {
    return { success: false, error: 'Installer file no longer exists' }
  }

  shell.showItemInFolder(outputPath)
  return { success: true }
})

ipcMain.on('cancel-build', () => {
  cancelRequested = true
})
