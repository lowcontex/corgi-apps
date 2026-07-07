const https = require('https')
const http = require('http')
const fs = require('fs')

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
  winrar: '/S',
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

      const request = protocol.get(url, (response) => {
        if (response.statusCode >= 300 && response.statusCode < 400) {
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
