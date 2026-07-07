import { useEffect, useMemo, useRef, useState } from 'react'
import {
  InstallerDownloadError,
  requestExeInstallerDownload,
} from './api/exeInstaller'
import './App.css'

const catalog = [
  {
    id: '7zip',
    name: '7-Zip',
    vendor: 'Igor Pavlov',
    category: 'Compression',
    sizeMb: 4,
    type: 'utility',
    tags: ['Silent', 'Portable'],
  },
  {
    id: 'peazip',
    name: 'PeaZip',
    vendor: 'Giorgio Tani',
    category: 'Compression',
    sizeMb: 9,
    type: 'utility',
    tags: ['Silent'],
  },
  {
    id: 'winrar',
    name: 'WinRAR',
    vendor: 'RARLAB',
    category: 'Compression',
    sizeMb: 6,
    type: 'utility',
    tags: ['Popular'],
  },
  {
    id: 'anydesk',
    name: 'AnyDesk',
    vendor: 'AnyDesk Software',
    category: 'Utilities',
    sizeMb: 6,
    type: 'utility',
    tags: ['Remote'],
  },
  {
    id: 'teamviewer',
    name: 'TeamViewer 15',
    vendor: 'TeamViewer',
    category: 'Utilities',
    sizeMb: 42,
    type: 'utility',
    tags: ['Remote'],
  },
  {
    id: 'imgburn',
    name: 'ImgBurn',
    vendor: 'LIGHTNING UK',
    category: 'Utilities',
    sizeMb: 3,
    type: 'utility',
    tags: ['Disc'],
  },
  {
    id: 'realvnc-server',
    name: 'RealVNC Server',
    vendor: 'RealVNC',
    category: 'Utilities',
    sizeMb: 19,
    type: 'utility',
    tags: ['Remote'],
  },
  {
    id: 'realvnc-viewer',
    name: 'RealVNC Viewer',
    vendor: 'RealVNC',
    category: 'Utilities',
    sizeMb: 12,
    type: 'utility',
    tags: ['Remote'],
  },
  {
    id: 'tightvnc',
    name: 'TightVNC',
    vendor: 'GlavSoft',
    category: 'Utilities',
    sizeMb: 8,
    type: 'utility',
    tags: ['Remote'],
  },
  {
    id: 'teracopy',
    name: 'TeraCopy',
    vendor: 'Code Sector',
    category: 'Utilities',
    sizeMb: 7,
    type: 'utility',
    tags: ['File'],
  },
  {
    id: 'revo',
    name: 'Revo Uninstaller',
    vendor: 'VS Revo Group',
    category: 'Utilities',
    sizeMb: 17,
    type: 'utility',
    tags: ['Cleanup'],
  },
  {
    id: 'launchy',
    name: 'Launchy',
    vendor: 'Launchy',
    category: 'Utilities',
    sizeMb: 5,
    type: 'utility',
    tags: ['Launcher'],
  },
  {
    id: 'windirstat',
    name: 'WinDirStat',
    vendor: 'WinDirStat',
    category: 'Utilities',
    sizeMb: 8,
    type: 'utility',
    tags: ['Storage'],
  },
  {
    id: 'wiztree',
    name: 'WizTree',
    vendor: 'Antibody Software',
    category: 'Utilities',
    sizeMb: 6,
    type: 'utility',
    tags: ['Storage'],
  },
  {
    id: 'glary',
    name: 'Glary Utilities',
    vendor: 'Glarysoft',
    category: 'Utilities',
    sizeMb: 20,
    type: 'utility',
    tags: ['Cleanup'],
  },
  {
    id: 'infrarecorder',
    name: 'InfraRecorder',
    vendor: 'Christian Kindahl',
    category: 'Utilities',
    sizeMb: 3,
    type: 'utility',
    tags: ['Disc'],
  },
  {
    id: 'open-shell',
    name: 'Open-Shell',
    vendor: 'Open-Shell',
    category: 'Utilities',
    sizeMb: 7,
    type: 'utility',
    tags: ['Shell'],
  },
  {
    id: 'ccleaner',
    name: 'CCleaner',
    vendor: 'Piriform',
    category: 'Utilities',
    sizeMb: 34,
    type: 'utility',
    tags: ['Cleanup'],
  },
  {
    id: 'evernote',
    name: 'Evernote',
    vendor: 'Evernote',
    category: 'Productivity',
    sizeMb: 210,
    type: 'other',
    tags: ['Notes'],
  },
  {
    id: 'obsidian',
    name: 'Obsidian',
    vendor: 'Obsidian',
    category: 'Productivity',
    sizeMb: 175,
    type: 'other',
    tags: ['Notes'],
  },
  {
    id: 'notion',
    name: 'Notion',
    vendor: 'Notion Labs',
    category: 'Productivity',
    sizeMb: 160,
    type: 'other',
    tags: ['Workspace'],
  },
  {
    id: 'google-earth',
    name: 'Google Earth',
    vendor: 'Google',
    category: 'Other',
    sizeMb: 70,
    type: 'other',
    tags: ['Maps'],
  },
  {
    id: 'steam',
    name: 'Steam',
    vendor: 'Valve',
    category: 'Other',
    sizeMb: 3,
    type: 'other',
    tags: ['Launcher'],
  },
  {
    id: 'epic-games',
    name: 'Epic Games Launcher',
    vendor: 'Epic Games',
    category: 'Other',
    sizeMb: 100,
    type: 'other',
    tags: ['Launcher'],
  },
  {
    id: 'keepass',
    name: 'KeePass 2',
    vendor: 'Dominik Reichl',
    category: 'Security',
    sizeMb: 4,
    type: 'other',
    tags: ['Security'],
  },
  {
    id: 'bitwarden',
    name: 'Bitwarden',
    vendor: 'Bitwarden',
    category: 'Security',
    sizeMb: 105,
    type: 'other',
    tags: ['Password'],
  },
  {
    id: 'malwarebytes',
    name: 'Malwarebytes',
    vendor: 'Malwarebytes',
    category: 'Security',
    sizeMb: 300,
    type: 'other',
    tags: ['Protection'],
  },
  {
    id: 'veracrypt',
    name: 'VeraCrypt',
    vendor: 'IDRIX',
    category: 'Security',
    sizeMb: 35,
    type: 'other',
    tags: ['Encryption'],
  },
  {
    id: 'everything',
    name: 'Everything',
    vendor: 'Voidtools',
    category: 'Other',
    sizeMb: 2,
    type: 'other',
    tags: ['Search'],
  },
  {
    id: 'nv-access',
    name: 'NV Access',
    vendor: 'NV Access',
    category: 'Other',
    sizeMb: 30,
    type: 'other',
    tags: ['Accessibility'],
  },
  {
    id: 'dropbox',
    name: 'Dropbox',
    vendor: 'Dropbox',
    category: 'Cloud Storage',
    sizeMb: 180,
    type: 'other',
    tags: ['Sync'],
  },
  {
    id: 'google-drive',
    name: 'Google Drive',
    vendor: 'Google',
    category: 'Cloud Storage',
    sizeMb: 300,
    type: 'other',
    tags: ['Sync'],
  },
  {
    id: 'onedrive',
    name: 'Microsoft OneDrive',
    vendor: 'Microsoft',
    category: 'Cloud Storage',
    sizeMb: 65,
    type: 'other',
    tags: ['Sync'],
  },
  {
    id: 'dotnet-runtime-8',
    name: '.NET Desktop Runtime 8',
    vendor: 'Microsoft',
    category: 'Runtimes',
    sizeMb: 60,
    type: 'runtime',
    tags: ['Recommended'],
  },
  {
    id: 'dotnet-sdk-8',
    name: '.NET SDK 8',
    vendor: 'Microsoft',
    category: 'Runtimes',
    sizeMb: 210,
    type: 'runtime',
    tags: ['SDK'],
  },
  {
    id: 'java-jre-17',
    name: 'Java Runtime 17',
    vendor: 'Eclipse Temurin',
    category: 'Runtimes',
    sizeMb: 80,
    type: 'runtime',
    tags: ['Recommended'],
  },
  {
    id: 'java-jdk-17',
    name: 'Java Development Kit 17',
    vendor: 'Eclipse Temurin',
    category: 'Runtimes',
    sizeMb: 190,
    type: 'runtime',
    tags: ['SDK'],
  },
  {
    id: 'vcpp-x64',
    name: 'Visual C++ Redist 2015-2022 x64',
    vendor: 'Microsoft',
    category: 'Runtimes',
    sizeMb: 25,
    type: 'runtime',
    tags: ['Recommended'],
  },
  {
    id: 'vcpp-x86',
    name: 'Visual C++ Redist 2015-2022 x86',
    vendor: 'Microsoft',
    category: 'Runtimes',
    sizeMb: 22,
    type: 'runtime',
    tags: ['Recommended'],
  },
  {
    id: 'chrome',
    name: 'Google Chrome',
    vendor: 'Google',
    category: 'Browsers',
    sizeMb: 120,
    type: 'browser',
    tags: ['Popular'],
  },
  {
    id: 'firefox',
    name: 'Mozilla Firefox',
    vendor: 'Mozilla',
    category: 'Browsers',
    sizeMb: 95,
    type: 'browser',
    tags: ['Popular'],
  },
  {
    id: 'edge',
    name: 'Microsoft Edge',
    vendor: 'Microsoft',
    category: 'Browsers',
    sizeMb: 130,
    type: 'browser',
    tags: ['Recommended'],
  },
  {
    id: 'brave',
    name: 'Brave',
    vendor: 'Brave Software',
    category: 'Browsers',
    sizeMb: 110,
    type: 'browser',
    tags: ['Privacy'],
  },
  {
    id: 'opera',
    name: 'Opera',
    vendor: 'Opera',
    category: 'Browsers',
    sizeMb: 125,
    type: 'browser',
    tags: ['Popular'],
  },
  {
    id: 'vivaldi',
    name: 'Vivaldi',
    vendor: 'Vivaldi Technologies',
    category: 'Browsers',
    sizeMb: 120,
    type: 'browser',
    tags: ['Customizable'],
  },
  {
    id: 'zoom',
    name: 'Zoom',
    vendor: 'Zoom',
    category: 'Messaging',
    sizeMb: 110,
    type: 'other',
    tags: ['Meetings'],
  },
  {
    id: 'discord',
    name: 'Discord',
    vendor: 'Discord',
    category: 'Messaging',
    sizeMb: 105,
    type: 'other',
    tags: ['Chat'],
  },
  {
    id: 'teams',
    name: 'Microsoft Teams',
    vendor: 'Microsoft',
    category: 'Messaging',
    sizeMb: 160,
    type: 'other',
    tags: ['Work'],
  },
  {
    id: 'slack',
    name: 'Slack',
    vendor: 'Slack Technologies',
    category: 'Messaging',
    sizeMb: 125,
    type: 'other',
    tags: ['Work'],
  },
  {
    id: 'thunderbird',
    name: 'Thunderbird',
    vendor: 'Mozilla',
    category: 'Messaging',
    sizeMb: 65,
    type: 'other',
    tags: ['Email'],
  },
  {
    id: 'signal',
    name: 'Signal',
    vendor: 'Signal Foundation',
    category: 'Messaging',
    sizeMb: 130,
    type: 'other',
    tags: ['Private'],
  },
  {
    id: 'vlc',
    name: 'VLC',
    vendor: 'VideoLAN',
    category: 'Media',
    sizeMb: 45,
    type: 'other',
    tags: ['Player'],
  },
  {
    id: 'spotify',
    name: 'Spotify',
    vendor: 'Spotify',
    category: 'Media',
    sizeMb: 105,
    type: 'other',
    tags: ['Music'],
  },
  {
    id: 'audacity',
    name: 'Audacity',
    vendor: 'Audacity Team',
    category: 'Media',
    sizeMb: 75,
    type: 'other',
    tags: ['Audio'],
  },
  {
    id: 'foobar2000',
    name: 'foobar2000',
    vendor: 'Peter Pawlowski',
    category: 'Media',
    sizeMb: 15,
    type: 'other',
    tags: ['Player'],
  },
  {
    id: 'obs-studio',
    name: 'OBS Studio',
    vendor: 'OBS Project',
    category: 'Media',
    sizeMb: 150,
    type: 'other',
    tags: ['Streaming'],
  },
  {
    id: 'handbrake',
    name: 'HandBrake',
    vendor: 'HandBrake',
    category: 'Media',
    sizeMb: 25,
    type: 'other',
    tags: ['Video'],
  },
  {
    id: 'libreoffice',
    name: 'LibreOffice',
    vendor: 'The Document Foundation',
    category: 'Documents',
    sizeMb: 350,
    type: 'other',
    tags: ['Office'],
  },
  {
    id: 'adobe-reader',
    name: 'Adobe Acrobat Reader',
    vendor: 'Adobe',
    category: 'Documents',
    sizeMb: 390,
    type: 'other',
    tags: ['PDF'],
  },
  {
    id: 'foxit-reader',
    name: 'Foxit Reader',
    vendor: 'Foxit',
    category: 'Documents',
    sizeMb: 170,
    type: 'other',
    tags: ['PDF'],
  },
  {
    id: 'sumatrapdf',
    name: 'SumatraPDF',
    vendor: 'SumatraPDF',
    category: 'Documents',
    sizeMb: 12,
    type: 'other',
    tags: ['PDF'],
  },
  {
    id: 'gimp',
    name: 'GIMP',
    vendor: 'GIMP',
    category: 'Imaging',
    sizeMb: 320,
    type: 'other',
    tags: ['Editor'],
  },
  {
    id: 'inkscape',
    name: 'Inkscape',
    vendor: 'Inkscape',
    category: 'Imaging',
    sizeMb: 115,
    type: 'other',
    tags: ['Vector'],
  },
  {
    id: 'krita',
    name: 'Krita',
    vendor: 'KDE',
    category: 'Imaging',
    sizeMb: 185,
    type: 'other',
    tags: ['Painting'],
  },
  {
    id: 'blender',
    name: 'Blender',
    vendor: 'Blender Foundation',
    category: 'Imaging',
    sizeMb: 360,
    type: 'other',
    tags: ['3D'],
  },
  {
    id: 'paintdotnet',
    name: 'Paint.NET',
    vendor: 'dotPDN',
    category: 'Imaging',
    sizeMb: 80,
    type: 'other',
    tags: ['Editor'],
  },
  {
    id: 'sharex',
    name: 'ShareX',
    vendor: 'ShareX',
    category: 'Imaging',
    sizeMb: 35,
    type: 'other',
    tags: ['Capture'],
  },
  {
    id: 'irfanview',
    name: 'IrfanView',
    vendor: 'Irfan Skiljan',
    category: 'Imaging',
    sizeMb: 8,
    type: 'other',
    tags: ['Viewer'],
  },
  {
    id: 'git',
    name: 'Git for Windows',
    vendor: 'Git',
    category: 'Developer Tools',
    sizeMb: 52,
    type: 'dev',
    tags: ['CLI'],
  },
  {
    id: 'nodejs',
    name: 'Node.js LTS',
    vendor: 'OpenJS Foundation',
    category: 'Developer Tools',
    sizeMb: 45,
    type: 'dev',
    tags: ['Runtime'],
  },
  {
    id: 'python',
    name: 'Python 3',
    vendor: 'Python Software Foundation',
    category: 'Developer Tools',
    sizeMb: 50,
    type: 'dev',
    tags: ['Runtime'],
  },
  {
    id: 'vscode',
    name: 'Visual Studio Code',
    vendor: 'Microsoft',
    category: 'Developer Tools',
    sizeMb: 120,
    type: 'dev',
    tags: ['Editor'],
  },
  {
    id: 'docker',
    name: 'Docker Desktop',
    vendor: 'Docker',
    category: 'Developer Tools',
    sizeMb: 480,
    type: 'dev',
    tags: ['Containers'],
  },
  {
    id: 'postman',
    name: 'Postman',
    vendor: 'Postman',
    category: 'Developer Tools',
    sizeMb: 130,
    type: 'dev',
    tags: ['API'],
  },
  {
    id: 'notepadplusplus',
    name: 'Notepad++',
    vendor: 'Notepad++',
    category: 'Developer Tools',
    sizeMb: 10,
    type: 'dev',
    tags: ['Editor'],
  },
  {
    id: 'windows-terminal',
    name: 'Windows Terminal',
    vendor: 'Microsoft',
    category: 'Developer Tools',
    sizeMb: 35,
    type: 'dev',
    tags: ['Terminal'],
  },
  {
    id: 'powershell',
    name: 'PowerShell',
    vendor: 'Microsoft',
    category: 'Developer Tools',
    sizeMb: 105,
    type: 'dev',
    tags: ['Shell'],
  },
  {
    id: 'putty',
    name: 'PuTTY',
    vendor: 'PuTTY',
    category: 'Developer Tools',
    sizeMb: 4,
    type: 'dev',
    tags: ['SSH'],
  },
  {
    id: 'winscp',
    name: 'WinSCP',
    vendor: 'WinSCP',
    category: 'Developer Tools',
    sizeMb: 20,
    type: 'dev',
    tags: ['SFTP'],
  },
  {
    id: 'dbeaver',
    name: 'DBeaver',
    vendor: 'DBeaver',
    category: 'Developer Tools',
    sizeMb: 130,
    type: 'dev',
    tags: ['Database'],
  },
  {
    id: 'github-desktop',
    name: 'GitHub Desktop',
    vendor: 'GitHub',
    category: 'Developer Tools',
    sizeMb: 155,
    type: 'dev',
    tags: ['Git'],
  },
]

const categoryOrder = [
  'Compression',
  'Utilities',
  'Security',
  'Browsers',
  'Messaging',
  'Media',
  'Documents',
  'Imaging',
  'Productivity',
  'Cloud Storage',
  'Runtimes',
  'Developer Tools',
  'Other',
]

const buildSteps = [
  'Validate selection',
  'Download offline installers',
  'Embed installer files',
  'Compile offline bundle',
  'Prepare browser download',
  'Start download',
]

const presets = [
  {
    id: 'workstation',
    name: 'Workstation Essentials',
    description: 'Core tools, browsers, and runtimes for daily use.',
    items: [
      '7zip',
      'everything',
      'bitwarden',
      'libreoffice',
      'vlc',
      'chrome',
      'firefox',
      'dotnet-runtime-8',
      'vcpp-x64',
      'vcpp-x86',
    ],
  },
  {
    id: 'developer',
    name: 'Developer Station',
    description: 'SDKs, editors, browsers, and CLI tools.',
    items: [
      'vscode',
      'git',
      'nodejs',
      'python',
      'dotnet-sdk-8',
      'java-jdk-17',
      'windows-terminal',
      'powershell',
      'dbeaver',
      'chrome',
      'edge',
    ],
  },
  {
    id: 'support',
    name: 'Support Kit',
    description: 'Remote tools and cleanup utilities for help desks.',
    items: [
      'anydesk',
      'teamviewer',
      'realvnc-viewer',
      'realvnc-server',
      'revo',
      'glary',
      'teracopy',
    ],
  },
  {
    id: 'office',
    name: 'Office and Messaging',
    description: 'Documents, PDF tools, notes, chat, and cloud sync.',
    items: [
      'libreoffice',
      'adobe-reader',
      'sumatrapdf',
      'obsidian',
      'teams',
      'slack',
      'onedrive',
    ],
  },
  {
    id: 'creator',
    name: 'Creator Kit',
    description: 'Media, imaging, recording, and publishing tools.',
    items: [
      'vlc',
      'audacity',
      'obs-studio',
      'handbrake',
      'gimp',
      'inkscape',
      'sharex',
    ],
  },
]

const flowSteps = [
  {
    id: 'apps',
    eyebrow: 'Step 1',
    title: 'Choose apps',
    description: 'Use search or start with a quick bundle.',
  },
  {
    id: 'output',
    eyebrow: 'Step 2',
    title: 'Set output',
    description: 'Confirm installer name and run behavior.',
  },
  {
    id: 'review',
    eyebrow: 'Step 3',
    title: 'Review and download',
    description: 'Check the bundle details before downloading.',
  },
]

const defaultSelection = ['dotnet-runtime-8', 'vcpp-x64', 'chrome', '7zip']

const formatSize = (sizeMb) => {
  if (sizeMb >= 1024) {
    return `${(sizeMb / 1024).toFixed(1)} GB`
  }
  return `${Math.round(sizeMb)} MB`
}

const BuildMark = () => (
  <div className="build-mark" aria-hidden="true">
    <span className="build-mark-core"></span>
    <span className="build-mark-ring"></span>
  </div>
)

function App() {
  const [selectedIds, setSelectedIds] = useState(
    () => new Set(defaultSelection),
  )
  const [search, setSearch] = useState('')
  const [activeCategory, setActiveCategory] = useState('All')
  const [activeStepId, setActiveStepId] = useState('apps')
  const [options, setOptions] = useState({
    arch: 'x64',
    silentInstall: true,
    restorePoint: false,
  })
  const [installerName, setInstallerName] = useState('CorgiNite Bundle')
  const [buildStatus, setBuildStatus] = useState('idle')
  const [buildStep, setBuildStep] = useState(0)
  const [buildId, setBuildId] = useState('')
  const [errorMessage, setErrorMessage] = useState('')
  const [buildProgress, setBuildProgress] = useState(null)
  const [buildOutputPath, setBuildOutputPath] = useState('')
  const [downloadMessage, setDownloadMessage] = useState('')
  const timersRef = useRef([])

  const selectedApps = useMemo(
    () => catalog.filter((app) => selectedIds.has(app.id)),
    [selectedIds],
  )

  const totalSize = useMemo(
    () => selectedApps.reduce((sum, app) => sum + app.sizeMb, 0),
    [selectedApps],
  )

  const estimatedSize = totalSize

  const selectedSummary = useMemo(() => {
    const summary = {
      runtime: 0,
      browser: 0,
      dev: 0,
      utility: 0,
      other: 0,
    }
    selectedApps.forEach((app) => {
      summary[app.type] += 1
    })
    return summary
  }, [selectedApps])

  const filteredApps = useMemo(() => {
    const query = search.trim().toLowerCase()
    return catalog.filter((app) => {
      const matchesCategory =
        activeCategory === 'All' || app.category === activeCategory
      if (!matchesCategory) {
        return false
      }
      if (!query) {
        return true
      }
      const haystack = `${app.name} ${app.vendor} ${app.category} ${app.tags.join(
        ' ',
      )}`.toLowerCase()
      return haystack.includes(query)
    })
  }, [activeCategory, search])

  const selectedCount = selectedIds.size
  const currentStepIndex = flowSteps.findIndex((step) => step.id === activeStepId)
  const currentStep = flowSteps[currentStepIndex] ?? flowSteps[0]
  const isFirstStep = currentStepIndex === 0
  const isLastStep = currentStepIndex === flowSteps.length - 1
  const canBuild = selectedCount > 0 && installerName.trim().length > 0

  const clearTimers = () => {
    timersRef.current.forEach((timerId) => window.clearTimeout(timerId))
    timersRef.current = []
  }

  useEffect(() => () => clearTimers(), [])

  const toggleApp = (id) => {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) {
        next.delete(id)
      } else {
        next.add(id)
      }
      return next
    })
    if (errorMessage) {
      setErrorMessage('')
    }
  }

  const goToStep = (stepId) => {
    setActiveStepId(stepId)
  }

  const goForward = () => {
    if (activeStepId === 'apps' && selectedCount === 0) {
      setErrorMessage('Select at least one app before continuing.')
      return
    }

    if (activeStepId === 'output' && !installerName.trim()) {
      setErrorMessage('Enter an installer name before reviewing the download.')
      return
    }

    const nextStep = flowSteps[Math.min(currentStepIndex + 1, flowSteps.length - 1)]
    setActiveStepId(nextStep.id)
  }

  const goBack = () => {
    const previousStep = flowSteps[Math.max(currentStepIndex - 1, 0)]
    setActiveStepId(previousStep.id)
  }

  const clearFilters = () => {
    setSearch('')
    setActiveCategory('All')
  }

  const applyPreset = (presetId) => {
    const preset = presets.find((item) => item.id === presetId)
    if (!preset) {
      return
    }
    setSelectedIds(new Set(preset.items))
  }

  const clearSelection = () => {
    setSelectedIds(new Set())
  }

  const updateOption = (key, value) => {
    setOptions((prev) => ({
      ...prev,
      [key]: value,
    }))
    if (errorMessage) {
      setErrorMessage('')
    }
  }

  const startBuild = async () => {
    if (selectedCount === 0) {
      setActiveStepId('apps')
      setErrorMessage('Select at least one app to start the download.')
      return
    }

    if (!installerName.trim()) {
      setActiveStepId('output')
      setErrorMessage('Enter an installer name before downloading.')
      return
    }

    setErrorMessage('')
    setActiveStepId('review')
    setBuildStatus('building')
    setBuildStep(0)
    setBuildId('')
    setBuildProgress(null)
    setBuildOutputPath('')
    setDownloadMessage('')
    clearTimers()

    try {
      setBuildStep(1)
      setBuildProgress({
        phase: 'resolving',
        message: 'Sending selected apps to the EXE builder.',
      })

      const downloadResult = await requestExeInstallerDownload({
        apps: selectedApps,
        name: installerName.trim(),
        options,
      })

      setBuildId(`CN-${Date.now().toString().slice(-6)}`)
      setBuildOutputPath(downloadResult.filename)
      setBuildStep(buildSteps.length)
      setBuildProgress({
        phase: 'complete',
        message: 'Windows installer ready.',
      })
      setBuildStatus('ready')
      setDownloadMessage(downloadResult.message)
    } catch (error) {
      const message =
        error instanceof InstallerDownloadError || error instanceof Error
          ? error.message
          : 'Unknown download failure'
      console.error('Installer download failed', {
        error,
        appCount: selectedCount,
        installerName: installerName.trim(),
      })
      setBuildStatus('idle')
      setBuildStep(0)
      setBuildProgress(null)
      setErrorMessage(message)
    }
  }

  const resetBuild = () => {
    clearTimers()
    setBuildStatus('idle')
    setBuildStep(0)
    setBuildId('')
    setBuildProgress(null)
    setBuildOutputPath('')
    setDownloadMessage('')
  }

  const isBuilding = buildStatus === 'building'
  const isReady = buildStatus === 'ready'
  const buildLabel =
    buildStatus === 'building'
      ? 'Preparing'
      : buildStatus === 'ready'
        ? 'Ready'
        : 'Idle'

  const progressPercent = Math.min(
    Math.round((buildStep / buildSteps.length) * 100),
    100,
  )
  const activeStep =
    buildStep === 0
      ? 'Waiting to start'
      : buildSteps[Math.min(buildStep - 1, buildSteps.length - 1)]

  const visibleSelection = selectedApps.slice(0, 6)
  const hiddenSelectionCount = Math.max(
    selectedApps.length - visibleSelection.length,
    0,
  )
  const primaryActionLabel = isLastStep
    ? isBuilding
      ? 'Preparing download'
      : 'Download EXE'
    : currentStepIndex === 0
      ? 'Next: Output'
      : 'Next: Review'

  return (
    <div className="app">
      <header className="app-header">
        <div className="header-copy">
          <span className="eyebrow">CorgiNite web installer</span>
          <h1 className="page-title">Build a clean Windows installer in three steps</h1>
          <p className="page-lead">
            Choose apps, set the output, and generate one offline EXE bundle with a
            clear summary at every step.
          </p>
        </div>
        <div className="header-card">
          <span className="header-card-label">Current bundle</span>
          <strong className="header-card-value">{selectedCount} apps selected</strong>
          <span className="header-card-meta">
            Estimated size {formatSize(estimatedSize)} · {options.arch} ·{' '}
            {options.silentInstall ? 'Silent' : 'Interactive'}
          </span>
        </div>
      </header>

      <ol className="stepper" aria-label="Installer setup steps">
        {flowSteps.map((step, index) => {
          const isActive = step.id === activeStepId
          const isComplete = index < currentStepIndex
          return (
            <li
              key={step.id}
              className={`stepper-item ${isActive ? 'active' : ''} ${
                isComplete ? 'complete' : ''
              }`}
              aria-current={isActive ? 'step' : undefined}
            >
              <span className="stepper-index">{index + 1}</span>
              <span className="stepper-copy">
                <span className="stepper-title">{step.title}</span>
                <span className="stepper-desc">{step.description}</span>
              </span>
            </li>
          )
        })}
      </ol>

      <main className="builder">
        <section className="workspace" aria-labelledby="workspace-title">
          <div className="workspace-heading">
            <span className="eyebrow">{currentStep.eyebrow}</span>
            <h2 id="workspace-title" className="section-title">
              {currentStep.title}
            </h2>
            <p className="section-lead">{currentStep.description}</p>
          </div>

          {errorMessage ? (
            <div className="error" role="alert">
              {errorMessage}
            </div>
          ) : null}

          {activeStepId === 'apps' ? (
            <div className="step-content">
              <div className="control-grid">
                <div className="field search-group">
                  <label className="field-label" htmlFor="app-search">
                    Search apps
                  </label>
                  <input
                    id="app-search"
                    className="input"
                    type="search"
                    value={search}
                    onChange={(event) => setSearch(event.target.value)}
                    placeholder="Search by app, vendor, or tag"
                  />
                </div>
                <div className="field">
                  <p className="field-label">Categories</p>
                  <div className="chip-row">
                    {['All', ...categoryOrder].map((category) => (
                      <button
                        key={category}
                        type="button"
                        className={`chip ${
                          activeCategory === category ? 'chip-active' : ''
                        }`}
                        onClick={() => setActiveCategory(category)}
                        aria-pressed={activeCategory === category}
                      >
                        {category}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <section className="quick-bundles" aria-labelledby="bundles-title">
                <div className="subsection-heading">
                  <h3 id="bundles-title" className="subsection-title">
                    Quick bundles
                  </h3>
                  <p className="subsection-note">
                    Replace the current selection with a recommended set.
                  </p>
                </div>
                <div className="preset-row">
                  {presets.map((preset) => (
                    <button
                      key={preset.id}
                      type="button"
                      className="preset"
                      onClick={() => applyPreset(preset.id)}
                    >
                      <span className="preset-title">{preset.name}</span>
                      <span className="preset-desc">{preset.description}</span>
                    </button>
                  ))}
                </div>
              </section>

              <section className="catalog" aria-labelledby="catalog-title">
                <div className="subsection-heading catalog-heading">
                  <div>
                    <h3 id="catalog-title" className="subsection-title">
                      App catalog
                    </h3>
                    <p className="subsection-note">
                      {filteredApps.length} apps shown, {selectedCount} selected.
                    </p>
                  </div>
                  <button type="button" className="text-action" onClick={clearFilters}>
                    Clear filters
                  </button>
                </div>

                {filteredApps.length === 0 ? (
                  <div className="empty-state">
                    <p className="empty-title">No matching apps</p>
                    <p className="empty-copy">
                      Clear the filters or search for a broader app name.
                    </p>
                    <button type="button" className="btn ghost" onClick={clearFilters}>
                      Clear filters
                    </button>
                  </div>
                ) : (
                  <div className="catalog-grid">
                    {filteredApps.map((app) => {
                      const isSelected = selectedIds.has(app.id)
                      const primaryTag = app.tags[0]
                      return (
                        <label
                          key={app.id}
                          className={`app-row ${isSelected ? 'selected' : ''}`}
                          title={`${app.vendor} - ${app.category}`}
                        >
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => toggleApp(app.id)}
                          />
                          <span className="app-info">
                            <span className="app-name">{app.name}</span>
                            <span className="app-meta">
                              <span>{formatSize(app.sizeMb)}</span>
                              <span>{app.category}</span>
                            </span>
                          </span>
                          {primaryTag ? (
                            <span
                              className={`tag ${
                                primaryTag === 'Recommended' ? 'tag-accent' : ''
                              }`}
                            >
                              {primaryTag}
                            </span>
                          ) : null}
                        </label>
                      )
                    })}
                  </div>
                )}
              </section>
            </div>
          ) : null}

          {activeStepId === 'output' ? (
            <div className="step-content output-step">
              <div className="field">
                <label className="field-label" htmlFor="installer-name">
                  Installer name
                </label>
                <input
                  id="installer-name"
                  className="input"
                  type="text"
                  value={installerName}
                  onChange={(event) => {
                    setInstallerName(event.target.value)
                    if (errorMessage) {
                      setErrorMessage('')
                    }
                  }}
                  placeholder="Name shown on the generated bundle"
                />
              </div>

              <div className="field">
                <p className="field-label">Architecture</p>
                <div className="segment" role="group" aria-label="Architecture">
                  {['x64', 'x86', 'mixed'].map((arch) => (
                    <button
                      key={arch}
                      type="button"
                      className={`segment-btn ${
                        options.arch === arch ? 'segment-active' : ''
                      }`}
                      onClick={() => updateOption('arch', arch)}
                      aria-pressed={options.arch === arch}
                    >
                      {arch}
                    </button>
                  ))}
                </div>
              </div>

              <section className="option-list" aria-label="Output options">
                <label className="toggle">
                  <input
                    type="checkbox"
                    checked={options.silentInstall}
                    onChange={(event) =>
                      updateOption('silentInstall', event.target.checked)
                    }
                  />
                  <span>
                    <span className="toggle-title">Force silent installs</span>
                    <span className="toggle-copy">
                      Use quiet install switches whenever the app supports them.
                    </span>
                  </span>
                </label>
                <label className="toggle">
                  <input
                    type="checkbox"
                    checked={options.restorePoint}
                    onChange={(event) =>
                      updateOption('restorePoint', event.target.checked)
                    }
                  />
                  <span>
                    <span className="toggle-title">Create restore point</span>
                    <span className="toggle-copy">
                      Add a Windows restore point before running installers.
                    </span>
                  </span>
                </label>
              </section>
            </div>
          ) : null}

          {activeStepId === 'review' ? (
            <div className="step-content review-step">
              <section className="review-section" aria-labelledby="review-title">
                <div className="subsection-heading">
                  <h3 id="review-title" className="subsection-title">
                    Bundle details
                  </h3>
                  <button
                    type="button"
                    className="text-action"
                    onClick={() => goToStep('apps')}
                  >
                    Edit apps
                  </button>
                </div>
                <dl className="detail-list">
                  <div>
                    <dt>Installer</dt>
                    <dd>{installerName || 'Missing name'}</dd>
                  </div>
                  <div>
                    <dt>Applications</dt>
                    <dd>{selectedCount} selected</dd>
                  </div>
                  <div>
                    <dt>Bundled size</dt>
                    <dd>{formatSize(estimatedSize)}</dd>
                  </div>
                  <div>
                    <dt>Architecture</dt>
                    <dd>{options.arch}</dd>
                  </div>
                  <div>
                    <dt>Install source</dt>
                    <dd>Offline EXE bundle</dd>
                  </div>
                  <div>
                    <dt>Silent mode</dt>
                    <dd>{options.silentInstall ? 'Enabled' : 'Disabled'}</dd>
                  </div>
                </dl>
              </section>

              <section className="review-section" aria-labelledby="selected-title">
                <div className="subsection-heading">
                  <h3 id="selected-title" className="subsection-title">
                    Selected apps
                  </h3>
                </div>
                {selectedApps.length === 0 ? (
                  <div className="empty-state">
                    <p className="empty-title">No apps selected</p>
                    <p className="empty-copy">
                      Go back to the catalog and pick at least one app.
                    </p>
                    <button
                      type="button"
                      className="btn ghost"
                      onClick={() => goToStep('apps')}
                    >
                      Choose apps
                    </button>
                  </div>
                ) : (
                  <ul className="selected-apps">
                    {selectedApps.map((app) => (
                      <li key={`review-${app.id}`}>
                        <span>
                          <strong>{app.name}</strong>
                          <span className="muted">{app.category}</span>
                        </span>
                        <span className="muted">{formatSize(app.sizeMb)}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </section>

              <section className="review-section" aria-labelledby="build-title">
                <div className="subsection-heading">
                  <div>
                    <h3 id="build-title" className="subsection-title">
                      Download status
                    </h3>
                    <p className="subsection-note">
                      The generated .exe downloads automatically when ready.
                    </p>
                  </div>
                  <span className={`status status-${buildStatus}`}>
                    {buildLabel}
                  </span>
                </div>
                <div className="progress-track" aria-hidden="true">
                  <div
                    className="progress-fill"
                    style={{ '--progress': `${progressPercent}%` }}
                  ></div>
                </div>
                <div
                  className="sr-progress"
                  role="progressbar"
                  aria-label="Download progress"
                  aria-valuenow={progressPercent}
                  aria-valuemin="0"
                  aria-valuemax="100"
                ></div>
                <div className="step-list" aria-live="polite">
                  {buildSteps.map((step, index) => {
                    const isComplete = buildStep > index
                    const stepIsActive = buildStep === index && isBuilding
                    return (
                      <div
                        key={step}
                        className={`step ${isComplete ? 'complete' : ''} ${
                          stepIsActive ? 'active' : ''
                        }`}
                      >
                        <span className="step-dot" aria-hidden="true"></span>
                        <span className="step-label">{step}</span>
                      </div>
                    )
                  })}
                </div>
                <div className="build-meta">
                  <div>
                    <span className="meta-label">Download ID</span>
                    <span className="meta-value">{buildId || 'Pending'}</span>
                  </div>
                  <div>
                    <span className="meta-label">Active task</span>
                    <span className="meta-value">{activeStep}</span>
                  </div>
                </div>
                {isReady ? (
                  <div className="success-row">
                    <span className="success-pill">Installer ready</span>
                    {buildOutputPath ? (
                      <span className="output-path" title={buildOutputPath}>
                        {downloadMessage || `Prepared: ${buildOutputPath}`}
                      </span>
                    ) : null}
                    <button type="button" className="btn ghost" onClick={resetBuild}>
                      Reset
                    </button>
                  </div>
                ) : null}
              </section>
            </div>
          ) : null}

          <div className="step-footer">
            {!isFirstStep ? (
              <button
                type="button"
                className="btn ghost step-back"
                onClick={goBack}
                disabled={isBuilding}
              >
                Back
              </button>
            ) : null}
            <button
              type="button"
              className="btn primary"
              onClick={isLastStep ? startBuild : goForward}
              disabled={isBuilding}
            >
              {primaryActionLabel}
            </button>
          </div>
        </section>

        <aside className="summary-panel" aria-label="Current bundle summary">
          <div className="summary-header">
            <div>
              <h2 className="panel-title">Current bundle</h2>
              <p className="panel-subtitle">A compact summary of what will ship.</p>
            </div>
            <span className={`status status-${buildStatus}`}>{buildLabel}</span>
          </div>

          <dl className="summary-grid">
            <div>
              <dt>Selected</dt>
              <dd>{selectedCount} apps</dd>
            </div>
            <div>
              <dt>Download size</dt>
              <dd>{formatSize(estimatedSize)}</dd>
            </div>
            <div>
              <dt>Runtimes</dt>
              <dd>{selectedSummary.runtime}</dd>
            </div>
            <div>
              <dt>Browsers</dt>
              <dd>{selectedSummary.browser}</dd>
            </div>
          </dl>

          <div className="selected-list">
            <div className="subsection-heading compact-heading">
              <p className="field-label">Selected apps</p>
              <button
                type="button"
                className="text-action"
                onClick={clearSelection}
                disabled={selectedCount === 0 || isBuilding}
              >
                Clear
              </button>
            </div>
            {visibleSelection.length === 0 ? (
              <p className="muted">No apps selected yet.</p>
            ) : (
              <ul>
                {visibleSelection.map((app) => (
                  <li key={`selected-${app.id}`}>
                    <span>{app.name}</span>
                    <button
                      type="button"
                      className="remove-btn"
                      onClick={() => toggleApp(app.id)}
                      aria-label={`Remove ${app.name}`}
                      disabled={isBuilding}
                    >
                      Remove
                    </button>
                  </li>
                ))}
                {hiddenSelectionCount > 0 ? (
                  <li className="muted">+{hiddenSelectionCount} more</li>
                ) : null}
              </ul>
            )}
          </div>

          {!canBuild ? (
            <p className="notice">
              Add at least one app and keep the installer name filled in before
              downloading.
            </p>
          ) : null}
        </aside>
      </main>

      {isBuilding ? (
        <div
          className="build-overlay"
          role="dialog"
          aria-modal="true"
          aria-live="polite"
          aria-label="Installer download in progress"
        >
          <div className="build-dialog" style={{ '--progress': `${progressPercent}%` }}>
            <div className="build-header">
              <BuildMark />
              <div className="build-copy">
                <p className="build-title">Building Windows installer</p>
                <p className="build-subtitle">{buildProgress?.message || activeStep}</p>
                <p className="build-progress-meta">
                  {progressPercent}% complete
                </p>
              </div>
            </div>
            <div className="build-progress">
              <div className="progress-track">
                <div className="progress-fill"></div>
              </div>
              <div className="build-steps">
                {buildSteps.map((step, index) => (
                  <span
                    key={`overlay-${step}`}
                    className={`build-step ${
                      buildStep > index ? 'complete' : ''
                    }`}
                  >
                    {step}
                  </span>
                ))}
              </div>
            </div>
            <div className="build-footer">
              <div className="loader-dots" aria-hidden="true">
                <span></span>
                <span></span>
                <span></span>
              </div>
              <button type="button" className="btn ghost" onClick={resetBuild}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  )
}

export default App
