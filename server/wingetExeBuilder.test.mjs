import assert from 'node:assert/strict'
import test from 'node:test'
import { createOfflineNsisScript } from './wingetExeBuilder.mjs'

test('creates install commands for expanded catalog apps', () => {
  const script = createOfflineNsisScript({
    payload: {
      name: 'Expanded Bundle',
      apps: [
        'anydesk',
        'realvnc-viewer',
        'imgburn',
        'infrarecorder',
        'opera',
        'discord',
        'vlc',
        'libreoffice',
        'gimp',
        'bitwarden',
        'onedrive',
        'windows-terminal',
        'dbeaver',
      ],
      options: {
        arch: 'x64',
        silentInstall: true,
        restorePoint: false,
      },
    },
    outputPath: 'C:\\Temp\\Expanded_Bundle.exe',
    installers: [
      {
        appId: 'anydesk',
        appName: 'AnyDesk',
        packageId: 'AnyDesk.AnyDesk',
        installerPath: 'C:\\Temp\\installers\\AnyDesk.exe',
        embeddedName: '01-anydesk.exe',
        installerType: 'exe',
      },
      {
        appId: 'realvnc-viewer',
        appName: 'RealVNC Viewer',
        packageId: 'RealVNC.VNCViewer',
        installerPath: 'C:\\Temp\\installers\\RealVNC.exe',
        embeddedName: '02-realvnc-viewer.exe',
        installerType: 'inno',
      },
      {
        appId: 'imgburn',
        appName: 'ImgBurn',
        packageId: 'LIGHTNINGUK.ImgBurn',
        installerPath: 'C:\\Temp\\installers\\ImgBurn.exe',
        embeddedName: '03-imgburn.exe',
        installerType: 'inno',
      },
      {
        appId: 'infrarecorder',
        appName: 'InfraRecorder',
        packageId: 'ChristianKindahl.InfraRecorder',
        installerPath: 'C:\\Temp\\installers\\InfraRecorder.exe',
        embeddedName: '04-infrarecorder.exe',
        installerType: 'inno',
      },
      {
        appId: 'opera',
        appName: 'Opera',
        packageId: 'Opera.Opera',
        installerPath: 'C:\\Temp\\installers\\Opera.exe',
        embeddedName: '05-opera.exe',
        installerType: 'exe',
      },
      {
        appId: 'discord',
        appName: 'Discord',
        packageId: 'Discord.Discord',
        installerPath: 'C:\\Temp\\installers\\Discord.exe',
        embeddedName: '06-discord.exe',
        installerType: 'exe',
      },
      {
        appId: 'vlc',
        appName: 'VLC',
        packageId: 'VideoLAN.VLC',
        installerPath: 'C:\\Temp\\installers\\VLC.exe',
        embeddedName: '07-vlc.exe',
        installerType: 'nullsoft',
      },
      {
        appId: 'libreoffice',
        appName: 'LibreOffice',
        packageId: 'TheDocumentFoundation.LibreOffice',
        installerPath: 'C:\\Temp\\installers\\LibreOffice.msi',
        embeddedName: '08-libreoffice.msi',
        installerType: 'wix',
      },
      {
        appId: 'gimp',
        appName: 'GIMP',
        packageId: 'GIMP.GIMP',
        installerPath: 'C:\\Temp\\installers\\GIMP.exe',
        embeddedName: '09-gimp.exe',
        installerType: 'inno',
      },
      {
        appId: 'bitwarden',
        appName: 'Bitwarden',
        packageId: 'Bitwarden.Bitwarden',
        installerPath: 'C:\\Temp\\installers\\Bitwarden.exe',
        embeddedName: '10-bitwarden.exe',
        installerType: 'nullsoft',
      },
      {
        appId: 'onedrive',
        appName: 'Microsoft OneDrive',
        packageId: 'Microsoft.OneDrive',
        installerPath: 'C:\\Temp\\installers\\OneDrive.exe',
        embeddedName: '11-onedrive.exe',
        installerType: 'exe',
      },
      {
        appId: 'windows-terminal',
        appName: 'Windows Terminal',
        packageId: 'Microsoft.WindowsTerminal',
        installerPath: 'C:\\Temp\\installers\\WindowsTerminal.msixbundle',
        embeddedName: '12-windows-terminal.msixbundle',
        installerType: 'msix',
      },
      {
        appId: 'dbeaver',
        appName: 'DBeaver',
        packageId: 'DBeaver.DBeaver.Community',
        installerPath: 'C:\\Temp\\installers\\DBeaver.exe',
        embeddedName: '13-dbeaver.exe',
        installerType: 'inno',
      },
    ],
  })

  for (const packageId of [
    'AnyDesk.AnyDesk',
    'RealVNC.VNCViewer',
    'LIGHTNINGUK.ImgBurn',
    'ChristianKindahl.InfraRecorder',
    'Opera.Opera',
    'Discord.Discord',
    'VideoLAN.VLC',
    'TheDocumentFoundation.LibreOffice',
    'GIMP.GIMP',
    'Bitwarden.Bitwarden',
    'Microsoft.OneDrive',
    'Microsoft.WindowsTerminal',
    'DBeaver.DBeaver.Community',
  ]) {
    assert.match(script, new RegExp(`Package: ${packageId}`))
  }

  assert.doesNotMatch(script, /undefined/)
})

test('runs installer commands through hidden NSIS execution', () => {
  const script = createOfflineNsisScript({
    payload: {
      name: 'Hidden Install Bundle',
      apps: ['chrome', 'vlc'],
      options: {
        arch: 'x64',
        silentInstall: true,
        restorePoint: false,
      },
    },
    outputPath: 'C:\\Temp\\Hidden_Install_Bundle.exe',
    installers: [
      {
        appId: 'chrome',
        appName: 'Google Chrome',
        packageId: 'Google.Chrome',
        installerPath: 'C:\\Temp\\installers\\Chrome.msi',
        embeddedName: '01-chrome.msi',
        installerType: 'wix',
      },
      {
        appId: 'vlc',
        appName: 'VLC',
        packageId: 'VideoLAN.VLC',
        installerPath: 'C:\\Temp\\installers\\VLC.exe',
        embeddedName: '02-vlc.exe',
        installerType: 'nullsoft',
      },
    ],
  })

  assert.match(script, /File "\/oname=\$PLUGINSDIR\\01-chrome\.msi"/)
  assert.match(script, /File "\/oname=\$PLUGINSDIR\\02-vlc\.exe"/)
  assert.match(script, /nsExec::ExecToStack 'msiexec \/i "\$PLUGINSDIR\\01-chrome\.msi" \/qn \/norestart'/)
  assert.match(script, /nsExec::ExecToStack '"\$PLUGINSDIR\\02-vlc\.exe" \/S'/)
  assert.doesNotMatch(script, /ExecWait/)
  assert.doesNotMatch(script, /winget|powershell|cmd\.exe/i)
})
