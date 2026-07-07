const { contextBridge, ipcRenderer } = require('electron')

contextBridge.exposeInMainWorld('electronAPI', {
  invokeBuild: (payload) => ipcRenderer.invoke('build-installer', payload),
  downloadBuiltInstaller: (outputPath) =>
    ipcRenderer.invoke('download-built-installer', outputPath),
  onBuildProgress: (callback) => {
    const subscription = (event, data) => callback(data)
    ipcRenderer.on('build-progress', subscription)
    return () => ipcRenderer.removeListener('build-progress', subscription)
  },
  onCancelBuild: () => ipcRenderer.send('cancel-build'),
})
