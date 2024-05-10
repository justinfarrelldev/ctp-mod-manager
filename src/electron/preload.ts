import { ipcRenderer, contextBridge } from 'electron';

// load:getCtp2InstallDir

contextBridge.exposeInMainWorld('api', {
    getCtp2InstallDir: () => ipcRenderer.invoke('load:getCtp2InstallDir'),
    openInstallDir: (event, dir) =>
        ipcRenderer.send('file:openInstallDir', dir),
    openModsDir: () => ipcRenderer.send('file:openModsDir'),
    getModsDir: () => ipcRenderer.invoke('file:getModsDir'),
    viewFileDirsInZip: (event, zipFilePath) =>
        ipcRenderer.invoke('file:viewFileDirsInZip', zipFilePath),
    goToRoute: (event, route) => ipcRenderer.send('process:goToRoute', route),
    copyFileToModDir: (event, fileDir) =>
        ipcRenderer.invoke('file:copyFileToModDir', fileDir),
    loadMods: () => ipcRenderer.invoke('file:loadMods'),
    selectFolder: () => ipcRenderer.invoke('file:selectFolder'),
    isValidInstall: (event, fileDir) =>
        ipcRenderer.invoke('file:isValidInstall', fileDir),
    addToInstallDirs: (event, dir) =>
        ipcRenderer.invoke('file:addToInstallDirs', dir),
    getInstallDirs: () => ipcRenderer.invoke('file:getInstallDirs'),
    runGame: (event, exeDir) => ipcRenderer.invoke('file:runGame', exeDir),
    removeFromInstallDirs: (event, dir) =>
        ipcRenderer.invoke('file:removeFromInstallDirs', dir),
    makeBackup: (event, dir) => ipcRenderer.invoke('file:makeBackup', dir),
    applyModsToInstall: (event, dir, mods) =>
        ipcRenderer.invoke('file:applyModsToInstall', dir, mods),
});
