/* eslint-disable functional/prefer-immutable-types */
import { contextBridge, ipcRenderer } from 'electron';

import { loadModFileNames } from './file/loadModFileNames';

contextBridge.exposeInMainWorld('api', {
    addToInstallDirs: (_: Event, dir: string) =>
        ipcRenderer.invoke('file:addToInstallDirs', dir),
    applyModsToInstall: (_: Event, dir: string, mods: string[]) =>
        ipcRenderer.invoke('file:applyModsToInstall', dir, mods),
    copyFileToModDir: (_: Event, fileDir: string) =>
        ipcRenderer.invoke('file:copyFileToModDir', fileDir),
    getCtp2InstallDir: () => ipcRenderer.invoke('load:getCtp2InstallDir'),
    getInstallDirs: () => ipcRenderer.invoke('file:getInstallDirs'),
    getModsDir: () => ipcRenderer.invoke('file:getModsDir'),
    goToRoute: (_: Event, route: string) =>
        ipcRenderer.send('process:goToRoute', route),
    isValidInstall: (_: Event, fileDir: string) =>
        ipcRenderer.invoke('file:isValidInstall', fileDir),
    loadModFileNames: () => ipcRenderer.invoke('file:loadModFileNames'),
    makeBackup: (_: Event, dir: string) =>
        ipcRenderer.invoke('file:makeBackup', dir),
    openInstallDir: (_: Event, dir: string) =>
        ipcRenderer.send('file:openInstallDir', dir),
    openModsDir: () => ipcRenderer.send('file:openModsDir'),
    removeFromInstallDirs: (_: Event, dir: string) =>
        ipcRenderer.invoke('file:removeFromInstallDirs', dir),
    removeModFromMods: (_: Event, fileName: string) =>
        ipcRenderer.invoke('file:removeModFromMods', fileName),
    runGame: (_: Event, exeDir: string) =>
        ipcRenderer.invoke('file:runGame', exeDir),
    selectFolder: () => ipcRenderer.invoke('file:selectFolder'),
    viewFileDirsInZip: (_: Event, zipFilePath: string) =>
        ipcRenderer.invoke('file:viewFileDirsInZip', zipFilePath),
});
