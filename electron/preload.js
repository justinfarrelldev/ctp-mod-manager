const { ipcRenderer, contextBridge } = require('electron');

// load:getCtp2InstallDir

contextBridge.exposeInMainWorld('api', {
  getCtp2InstallDir: () => ipcRenderer.invoke('load:getCtp2InstallDir'),
  openInstallDir: (event, dir) => ipcRenderer.send('file:openInstallDir', dir),
  goToRoute: (event, route) => ipcRenderer.send('process:goToRoute', route),
  copyFiles: (event, fileDir, fileDest) => ipcRenderer.send('file:copy', fileDir, fileDest),
});
