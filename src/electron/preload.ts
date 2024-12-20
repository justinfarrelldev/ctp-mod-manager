import { ipcRenderer, contextBridge } from 'electron';
import { loadModFileNames } from './file/loadModFileNames';

contextBridge.exposeInMainWorld('api', {
    getCtp2InstallDir: () => ipcRenderer.invoke('load:getCtp2InstallDir'),
    openInstallDir: (_: Event, dir: string) =>
        ipcRenderer.send('file:openInstallDir', dir),
    openModsDir: () => ipcRenderer.send('file:openModsDir'),
    getModsDir: () => ipcRenderer.invoke('file:getModsDir'),
    viewFileDirsInZip: (_: Event, zipFilePath: string) =>
        ipcRenderer.invoke('file:viewFileDirsInZip', zipFilePath),
    goToRoute: (_: Event, route: string) =>
        ipcRenderer.send('process:goToRoute', route),
    copyFileToModDir: (_: Event, fileDir: string) =>
        ipcRenderer.invoke('file:copyFileToModDir', fileDir),
    removeModFromMods: (_: Event, fileName: string) =>
        ipcRenderer.invoke('file:removeModFromMods', fileName),
    loadModFileNames: () => ipcRenderer.invoke('file:loadModFileNames'),
    selectFolder: () => ipcRenderer.invoke('file:selectFolder'),
    isValidInstall: (_: Event, fileDir: string) =>
        ipcRenderer.invoke('file:isValidInstall', fileDir),
    addToInstallDirs: (_: Event, dir: string) =>
        ipcRenderer.invoke('file:addToInstallDirs', dir),
    getInstallDirs: () => ipcRenderer.invoke('file:getInstallDirs'),
    runGame: (_: Event, exeDir: string) =>
        ipcRenderer.invoke('file:runGame', exeDir),
    removeFromInstallDirs: (_: Event, dir: string) =>
        ipcRenderer.invoke('file:removeFromInstallDirs', dir),
    makeBackup: (_: Event, dir: string) =>
        ipcRenderer.invoke('file:makeBackup', dir),
    applyModsToInstall: (_: Event, dir: string, mods: string[]) =>
        ipcRenderer.send('file:applyModsToInstall', dir, mods),
    getFileChangesToApplyMod: (_: Event, modName: string, installDir: string) =>
        ipcRenderer.send('file:getFileChangesToApplyMod', modName, installDir),
});
