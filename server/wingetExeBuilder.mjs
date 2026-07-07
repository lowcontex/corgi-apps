import { execFile } from 'node:child_process'
import { mkdir, mkdtemp, readdir, rm, stat, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { createExeFilename } from './installerPayload.mjs'

export const WINGET_PACKAGE_IDS = Object.freeze({
  '7zip': '7zip.7zip',
  peazip: 'Giorgiotani.Peazip',
  winrar: 'RARLab.WinRAR',
  anydesk: 'AnyDesk.AnyDesk',
  teamviewer: 'TeamViewer.TeamViewer',
  imgburn: 'LIGHTNINGUK.ImgBurn',
  'realvnc-server': 'RealVNC.VNCServer',
  'realvnc-viewer': 'RealVNC.VNCViewer',
  tightvnc: 'GlavSoft.TightVNC',
  teracopy: 'CodeSector.TeraCopy',
  infrarecorder: 'ChristianKindahl.InfraRecorder',
  revo: 'RevoUninstaller.RevoUninstaller',
  launchy: 'CodeJelly.Launchy',
  windirstat: 'WinDirStat.WinDirStat',
  wiztree: 'AntibodySoftware.WizTree',
  glary: 'Glarysoft.GlaryUtilities',
  'open-shell': 'Open-Shell.Open-Shell-Menu',
  ccleaner: 'Piriform.CCleaner',
  evernote: 'Evernote.Evernote',
  obsidian: 'Obsidian.Obsidian',
  notion: 'Notion.Notion',
  'google-earth': 'Google.EarthPro',
  steam: 'Valve.Steam',
  'epic-games': 'EpicGames.EpicGamesLauncher',
  keepass: 'DominikReichl.KeePass',
  bitwarden: 'Bitwarden.Bitwarden',
  malwarebytes: 'Malwarebytes.Malwarebytes',
  veracrypt: 'IDRIX.VeraCrypt',
  everything: 'voidtools.Everything',
  'nv-access': 'NVAccess.NVDA',
  dropbox: 'Dropbox.Dropbox',
  'google-drive': 'Google.GoogleDrive',
  onedrive: 'Microsoft.OneDrive',
  'dotnet-runtime-8': 'Microsoft.DotNet.DesktopRuntime.8',
  'dotnet-sdk-8': 'Microsoft.DotNet.SDK.8',
  'java-jre-17': 'EclipseAdoptium.Temurin.17.JRE',
  'java-jdk-17': 'EclipseAdoptium.Temurin.17.JDK',
  'vcpp-x64': 'Microsoft.VCRedist.2015+.x64',
  'vcpp-x86': 'Microsoft.VCRedist.2015+.x86',
  chrome: 'Google.Chrome',
  firefox: 'Mozilla.Firefox',
  edge: 'Microsoft.Edge',
  brave: 'Brave.Brave',
  opera: 'Opera.Opera',
  vivaldi: 'Vivaldi.Vivaldi',
  zoom: 'Zoom.Zoom',
  discord: 'Discord.Discord',
  teams: 'Microsoft.Teams',
  slack: 'SlackTechnologies.Slack',
  thunderbird: 'Mozilla.Thunderbird',
  signal: 'OpenWhisperSystems.Signal',
  vlc: 'VideoLAN.VLC',
  spotify: 'Spotify.Spotify',
  audacity: 'Audacity.Audacity',
  foobar2000: 'PeterPawlowski.foobar2000',
  'obs-studio': 'OBSProject.OBSStudio',
  handbrake: 'HandBrake.HandBrake',
  libreoffice: 'TheDocumentFoundation.LibreOffice',
  'adobe-reader': 'Adobe.Acrobat.Reader.64-bit',
  'foxit-reader': 'Foxit.FoxitReader',
  sumatrapdf: 'SumatraPDF.SumatraPDF',
  gimp: 'GIMP.GIMP',
  inkscape: 'Inkscape.Inkscape',
  krita: 'KDE.Krita',
  blender: 'BlenderFoundation.Blender',
  paintdotnet: 'dotPDN.PaintDotNet',
  sharex: 'ShareX.ShareX',
  irfanview: 'IrfanSkiljan.IrfanView',
  git: 'Git.Git',
  nodejs: 'OpenJS.NodeJS.LTS',
  python: 'Python.Python.3.12',
  vscode: 'Microsoft.VisualStudioCode',
  docker: 'Docker.DockerDesktop',
  postman: 'Postman.Postman',
  notepadplusplus: 'Notepad++.Notepad++',
  'windows-terminal': 'Microsoft.WindowsTerminal',
  powershell: 'Microsoft.PowerShell',
  putty: 'PuTTY.PuTTY',
  winscp: 'WinSCP.WinSCP',
  dbeaver: 'DBeaver.DBeaver.Community',
  'github-desktop': 'GitHub.GitHubDesktop',
})

const APP_NAMES = Object.freeze({
  '7zip': '7-Zip',
  peazip: 'PeaZip',
  winrar: 'WinRAR',
  anydesk: 'AnyDesk',
  teamviewer: 'TeamViewer',
  imgburn: 'ImgBurn',
  chrome: 'Google Chrome',
  firefox: 'Mozilla Firefox',
  edge: 'Microsoft Edge',
  brave: 'Brave',
  opera: 'Opera',
  vivaldi: 'Vivaldi',
  zoom: 'Zoom',
  discord: 'Discord',
  teams: 'Microsoft Teams',
  slack: 'Slack',
  thunderbird: 'Thunderbird',
  signal: 'Signal',
  vlc: 'VLC',
  spotify: 'Spotify',
  audacity: 'Audacity',
  foobar2000: 'foobar2000',
  'obs-studio': 'OBS Studio',
  handbrake: 'HandBrake',
  libreoffice: 'LibreOffice',
  'adobe-reader': 'Adobe Acrobat Reader',
  'foxit-reader': 'Foxit Reader',
  sumatrapdf: 'SumatraPDF',
  gimp: 'GIMP',
  inkscape: 'Inkscape',
  krita: 'Krita',
  blender: 'Blender',
  paintdotnet: 'Paint.NET',
  sharex: 'ShareX',
  irfanview: 'IrfanView',
  git: 'Git for Windows',
  nodejs: 'Node.js LTS',
  python: 'Python',
  vscode: 'Visual Studio Code',
  docker: 'Docker Desktop',
  postman: 'Postman',
  notepadplusplus: 'Notepad++',
  'windows-terminal': 'Windows Terminal',
  powershell: 'PowerShell',
  putty: 'PuTTY',
  winscp: 'WinSCP',
  dbeaver: 'DBeaver',
  'github-desktop': 'GitHub Desktop',
})

const escapeNsisString = (value) =>
  String(value).replace(/\\/g, '\\\\').replace(/"/g, '$\\"')

const DOWNLOAD_TIMEOUT_MS = 10 * 60 * 1000
const NSIS_COMPILE_TIMEOUT_MS = 5 * 60 * 1000
const DOWNLOAD_BUFFER_BYTES = 20 * 1024 * 1024

const INSTALLER_EXTENSIONS = new Set(['.exe', '.msi', '.msp'])
const UNSUPPORTED_OFFLINE_EXTENSIONS = new Set([
  '.appx',
  '.appxbundle',
  '.msix',
  '.msixbundle',
])

const INSTALLER_TYPE_SILENT_ARGS = Object.freeze({
  burn: '/quiet /norestart',
  exe: '/quiet /norestart',
  inno: '/VERYSILENT /NORESTART /SUPPRESSMSGBOXES',
  nullsoft: '/S',
  nsis: '/S',
  wix: '/quiet /norestart',
})

const APP_SILENT_ARGS = Object.freeze({
  'adobe-reader': '/sAll /rs /rps /msi EULA_ACCEPT=YES',
  anydesk: '--install --silent',
  brave: '--install --silent',
  discord: '-s',
  'dotnet-runtime-8': '/install /quiet /norestart',
  'dotnet-sdk-8': '/install /quiet /norestart',
  edge: '/silent /install',
  firefox: '/S',
  'google-drive': '--silent --desktop_shortcut',
  'java-jdk-17': '/quiet',
  'java-jre-17': '/quiet',
  onedrive: '/silent',
  opera: '/silent /install',
  slack: '--silent',
  teams: '--silent',
  'vcpp-x64': '/install /quiet /norestart',
  'vcpp-x86': '/install /quiet /norestart',
  vivaldi: '--vivaldi-silent',
})

const runProcess = async (file, args, { cwd, timeout = DOWNLOAD_TIMEOUT_MS } = {}) =>
  new Promise((resolve, reject) => {
    execFile(
      file,
      args,
      {
        cwd,
        timeout,
        windowsHide: true,
        maxBuffer: DOWNLOAD_BUFFER_BYTES,
      },
      (error, stdout, stderr) => {
        if (error) {
          reject(
            new Error(
              `${file} ${args.join(' ')} failed: ${
                stderr?.trim() || stdout?.trim() || error.message
              }`,
            ),
          )
          return
        }

        resolve({ stdout, stderr })
      },
    )
  })

const collectFiles = async (directory) => {
  const entries = await readdir(directory, { withFileTypes: true })
  const files = await Promise.all(
    entries.map(async (entry) => {
      const entryPath = path.join(directory, entry.name)
      if (entry.isDirectory()) {
        return collectFiles(entryPath)
      }

      return entry.isFile() ? [entryPath] : []
    }),
  )

  return files.flat()
}

const readWingetInstallerType = async (packageId) => {
  const { stdout } = await runProcess('winget', [
    'show',
    '--id',
    packageId,
    '--exact',
    '--source',
    'winget',
    '--disable-interactivity',
    '--accept-source-agreements',
  ])
  const installerType = stdout.match(/Installer Type:\s*([^\r\n]+)/i)?.[1]

  return installerType ? installerType.trim().toLowerCase() : ''
}

const parseDownloadedInstallerPath = (output) => {
  const matches = [...output.matchAll(/Installer downloaded:\s*(.+)/gi)]
  const lastMatch = matches.at(-1)?.[1]?.trim()

  return lastMatch || ''
}

const findDownloadedInstaller = async ({ downloadDir, beforeFiles, output, appName }) => {
  const parsedPath = parseDownloadedInstallerPath(output)
  if (parsedPath) {
    try {
      const fileStats = await stat(parsedPath)
      if (fileStats.isFile()) {
        return parsedPath
      }
    } catch {
      // Winget sometimes prints short 8.3 paths. Fall through to directory diff.
    }
  }

  const afterFiles = await collectFiles(downloadDir)
  const newFiles = afterFiles.filter((filePath) => !beforeFiles.has(filePath.toLowerCase()))
  const installerFiles = newFiles.filter((filePath) =>
    INSTALLER_EXTENSIONS.has(path.extname(filePath).toLowerCase()),
  )

  if (installerFiles.length > 0) {
    return installerFiles[0]
  }

  const unsupportedFile = newFiles.find((filePath) =>
    UNSUPPORTED_OFFLINE_EXTENSIONS.has(path.extname(filePath).toLowerCase()),
  )

  if (unsupportedFile) {
    throw new Error(
      `${appName} uses ${path.extname(
        unsupportedFile,
      )} packaging, which cannot be embedded as a silent offline installer yet.`,
    )
  }

  throw new Error(`No offline installer file was downloaded for ${appName}.`)
}

const createWingetDownloadArgs = ({ packageId, downloadDir, options }) => {
  const args = [
    'download',
    '--id',
    packageId,
    '--exact',
    '--source',
    'winget',
    '--download-directory',
    downloadDir,
    '--accept-package-agreements',
    '--accept-source-agreements',
    '--skip-license',
    '--skip-dependencies',
    '--disable-interactivity',
  ]

  if (options.arch === 'x64' || options.arch === 'x86') {
    args.push('--architecture', options.arch)
  }

  return args
}

const createEmbeddedInstallerName = ({ index, appId, installerPath }) => {
  const extension = path.extname(installerPath).toLowerCase()
  return `${String(index + 1).padStart(2, '0')}-${appId}${extension}`
}

const getLocalInstallCommand = ({ appId, embeddedName, installerType }) => {
  const localPath = `$PLUGINSDIR\\${embeddedName}`
  const extension = path.extname(embeddedName).toLowerCase()

  if (extension === '.msi') {
    return `msiexec /i "${localPath}" /qn /norestart`
  }

  if (extension === '.msp') {
    return `msiexec /p "${localPath}" /qn /norestart`
  }

  if (extension === '.exe') {
    const silentArgs =
      APP_SILENT_ARGS[appId] ||
      INSTALLER_TYPE_SILENT_ARGS[installerType] ||
      '/quiet /norestart'

    return `"${localPath}" ${silentArgs}`
  }

  if (UNSUPPORTED_OFFLINE_EXTENSIONS.has(extension)) {
    return `powershell -NoProfile -ExecutionPolicy Bypass -WindowStyle Hidden -Command "Add-AppxPackage -Path '${localPath}'"`
  }

  throw new Error(`${appId} uses unsupported offline installer type: ${extension}`)
}

const createOfflineInstallCommand = (installer) => {
  const command = getLocalInstallCommand(installer)

  return `
  ; Package: ${escapeNsisString(installer.packageId)}
  File "/oname=$PLUGINSDIR\\${escapeNsisString(installer.embeddedName)}" "${escapeNsisString(installer.installerPath)}"
  DetailPrint "Installing ${escapeNsisString(installer.appName)}"
  nsExec::ExecToStack '${command}'
  Pop $0
  Pop $1
  \${If} $0 != 0
    DetailPrint "${escapeNsisString(installer.appName)} finished with exit code $0"
  \${Else}
    DetailPrint "${escapeNsisString(installer.appName)} installed"
  \${EndIf}
`
}

const prepareOfflineInstallers = async ({
  payload,
  downloadDir,
  onProgress,
  isCancelled,
}) => {
  await mkdir(downloadDir, { recursive: true })

  const installers = []

  for (const [index, appId] of payload.apps.entries()) {
    if (isCancelled()) {
      throw new Error('Build cancelled by user')
    }

    const packageId = WINGET_PACKAGE_IDS[appId]
    const appName = APP_NAMES[appId] || appId
    if (!packageId) {
      throw new Error(`No offline package mapping configured for app: ${appId}`)
    }

    onProgress({
      phase: 'downloading',
      message: `Downloading ${appName} offline installer.`,
    })

    const beforeFiles = new Set(
      (await collectFiles(downloadDir)).map((filePath) => filePath.toLowerCase()),
    )
    const installerType = await readWingetInstallerType(packageId)
    const { stdout, stderr } = await runProcess(
      'winget',
      createWingetDownloadArgs({ packageId, downloadDir, options: payload.options }),
      { timeout: DOWNLOAD_TIMEOUT_MS },
    )
    const installerPath = await findDownloadedInstaller({
      downloadDir,
      beforeFiles,
      output: `${stdout}\n${stderr}`,
      appName,
    })

    installers.push({
      appId,
      appName,
      packageId,
      installerPath,
      embeddedName: createEmbeddedInstallerName({ index, appId, installerPath }),
      installerType,
    })
  }

  return installers
}

export const createOfflineNsisScript = ({ payload, outputPath, installers }) => {
  const safeName = escapeNsisString(payload.name)
  const installCommands = installers
    .map((installer) => createOfflineInstallCommand(installer))
    .join('\n')

  return `; CorgiNite web installer
; Generated by CorgiNite

!include "MUI2.nsh"
!include "LogicLib.nsh"

Name "${safeName}"
OutFile "${escapeNsisString(outputPath)}"
RequestExecutionLevel admin
ShowInstDetails show

!define MUI_ABORTWARNING
!define MUI_INSTFILESPAGE_PROGRESSBAR smooth

!insertmacro MUI_PAGE_WELCOME
!insertmacro MUI_PAGE_INSTFILES
!insertmacro MUI_PAGE_FINISH
!insertmacro MUI_LANGUAGE "English"

Section "Install Applications" SecInstall
  InitPluginsDir
  SetDetailsPrint both

${installCommands}

  DetailPrint "CorgiNite offline bundle complete"
SectionEnd
`
}

const findMakensisCandidates = () => [
  process.env.NSIS_MAKENSIS,
  path.join(
    process.env['ProgramFiles(x86)'] || 'C:\\Program Files (x86)',
    'NSIS',
    'makensis.exe',
  ),
  path.join(process.env.ProgramFiles || 'C:\\Program Files', 'NSIS', 'makensis.exe'),
  'makensis.exe',
  'makensis',
].filter(Boolean)

const runMakensis = async ({ nsiPath, cwd }) => {
  const candidates = findMakensisCandidates()
  let lastError = null

  for (const candidate of candidates) {
    try {
      await new Promise((resolve, reject) => {
        execFile(
          candidate,
          [nsiPath],
          { cwd, timeout: NSIS_COMPILE_TIMEOUT_MS, windowsHide: true },
          (error) => {
          if (error) {
            reject(error)
            return
          }
          resolve()
          },
        )
      })
      return
    } catch (error) {
      lastError = error
    }
  }

  throw new Error(
    `NSIS makensis was not found or could not compile the installer: ${
      lastError?.message || 'unknown error'
    }`,
  )
}

export const runExeBuildPipeline = async (
  payload,
  onProgress = () => {},
  isCancelled = () => false,
) => {
  const tempDir = await mkdtemp(path.join(tmpdir(), 'corginite-exe-'))

  try {
    if (isCancelled()) {
      throw new Error('Build cancelled by user')
    }

    onProgress({ phase: 'downloading', message: 'Downloading offline installers.' })
    const downloadDir = path.join(tempDir, 'installers')
    const installers = await prepareOfflineInstallers({
      payload,
      downloadDir,
      onProgress,
      isCancelled,
    })

    if (isCancelled()) {
      throw new Error('Build cancelled by user')
    }

    onProgress({ phase: 'generating', message: 'Embedding offline installers.' })
    const outputPath = path.join(tempDir, createExeFilename(payload.name))
    const nsiPath = path.join(tempDir, 'bundle.nsi')
    const nsiContent = createOfflineNsisScript({ payload, outputPath, installers })
    await writeFile(nsiPath, nsiContent, 'utf8')

    if (isCancelled()) {
      throw new Error('Build cancelled by user')
    }

    onProgress({ phase: 'compiling', message: 'Compiling offline Windows EXE.' })
    await runMakensis({ nsiPath, cwd: tempDir })

    if (isCancelled()) {
      throw new Error('Build cancelled by user')
    }

    onProgress({
      phase: 'complete',
      message: 'EXE installer ready.',
      outputPath,
    })

    return {
      outputPath,
      cleanup: () => rm(tempDir, { recursive: true, force: true }),
    }
  } catch (error) {
    await rm(tempDir, { recursive: true, force: true })
    throw error
  }
}
