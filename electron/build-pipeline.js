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

function findMakensis() {
  const candidates = [
    path.join(process.env['ProgramFiles(x86)'] || 'C:\\Program Files (x86)', 'NSIS', 'makensis.exe'),
    path.join(process.env['ProgramFiles'] || 'C:\\Program Files', 'NSIS', 'makensis.exe'),
    'makensis.exe',
    'makensis',
  ]
  for (const candidate of candidates) {
    try {
      if (fs.existsSync(candidate)) {
        return candidate
      }
    } catch (error) {
      console.warn('Unable to inspect NSIS candidate', { candidate, error })
    }
  }
  return 'makensis.exe'
}

async function runBuildPipeline(payload, onProgress, isCancelled) {
  const { apps, name, options } = payload
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'corginite-build-'))
  const downloadsDir = path.join(tempDir, 'downloads')
  fs.mkdirSync(downloadsDir, { recursive: true })

  const installers = []

  try {
    const totalApps = apps.length

    onProgress({ phase: 'downloading', step: 0, total: totalApps, message: 'Starting downloads...' })

    for (let i = 0; i < totalApps; i++) {
      if (isCancelled()) {
        throw new Error('Build cancelled by user')
      }

      const appId = apps[i]
      const appInfo = getAppInfo(appId)
      const url = getDownloadUrl(appId)
      const urlPath = new URL(url).pathname
      const fileName = path.basename(urlPath) || `${appId}_installer.exe`
      const destPath = path.join(downloadsDir, fileName)

      onProgress({
        phase: 'downloading',
        step: i + 1,
        total: totalApps,
        message: `Downloading ${appInfo.name}...`,
        appId,
      })

      await downloadFile(url, destPath, (percent) => {
        onProgress({
          phase: 'downloading',
          step: i + 1,
          total: totalApps,
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

    onProgress({ phase: 'generating', step: 0, total: 1, message: 'Generating installer script...' })

    const { nsiPath, outputFile } = generateNsisScript(installers, name || 'CorgiNite Bundle', options, tempDir)

    if (isCancelled()) {
      throw new Error('Build cancelled by user')
    }

    onProgress({ phase: 'compiling', step: 0, total: 1, message: 'Compiling installer with NSIS...' })

    const makensis = findMakensis()

    await new Promise((resolve, reject) => {
      execFile(makensis, [nsiPath], { cwd: tempDir, timeout: 120000 }, (error, stdout, stderr) => {
        if (error) {
          const msg = stderr ? stderr.toString() : error.message
          reject(new Error(`NSIS compilation failed: ${msg}`))
          return
        }
        resolve()
      })
    })

    if (isCancelled()) {
      throw new Error('Build cancelled by user')
    }

    onProgress({ phase: 'finalizing', step: 0, total: 1, message: 'Saving installer to Downloads...' })

    const downloadsFolder = path.join(os.homedir(), 'Downloads')
    if (!fs.existsSync(downloadsFolder)) {
      fs.mkdirSync(downloadsFolder, { recursive: true })
    }

    const finalPath = path.join(downloadsFolder, path.basename(outputFile))
    let finalOutput = finalPath
    let counter = 1
    while (fs.existsSync(finalOutput)) {
      const ext = path.extname(finalPath)
      const base = path.basename(finalPath, ext)
      finalOutput = path.join(downloadsFolder, `${base}_${counter}${ext}`)
      counter++
    }

    if (fs.existsSync(outputFile)) {
      fs.copyFileSync(outputFile, finalOutput)
    } else {
      throw new Error('Compiled installer not found at expected location. Is NSIS installed?')
    }

    cleanupTempDir(tempDir)

    onProgress({
      phase: 'complete',
      step: 1,
      total: 1,
      message: 'Installer ready!',
      outputPath: finalOutput,
    })

    return {
      outputPath: finalOutput,
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
    console.error('Failed to cleanup temp directory:', err)
  }
}

module.exports = {
  runBuildPipeline,
}
