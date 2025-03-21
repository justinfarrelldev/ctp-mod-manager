/* eslint-disable functional/prefer-immutable-types */
import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld('api', {
    // Adds a directory to the list of installation directories
    addToInstallDirs: (_: Event, dir: string) =>
        ipcRenderer.invoke('file:addToInstallDirs', dir),

    // Applies selected mods to a specified installation directory
    applyModsToInstall: (_: Event, dir: string, mods: string[]) =>
        ipcRenderer.invoke('file:applyModsToInstall', dir, mods),

    // Copies a file to the mods directory
    copyFileToModDir: (_: Event, fileDir: string) =>
        ipcRenderer.invoke('file:copyFileToModDir', fileDir),

    // Deletes a backup file
    deleteBackup: (_: Event, backupPath: string) =>
        ipcRenderer.invoke('file:deleteBackup', backupPath),

    // Retrieves the Call to Power II installation directory
    getCtp2InstallDir: () => ipcRenderer.invoke('load:getCtp2InstallDir'),

    // Retrieves the list of installation directories
    getInstallDirs: () => ipcRenderer.invoke('file:getInstallDirs'),

    // Retrieves the mods directory
    getModsDir: () => ipcRenderer.invoke('file:getModsDir'),

    // Navigates to a specified route in the application
    goToRoute: (_: Event, route: string) =>
        ipcRenderer.send('process:goToRoute', route),

    // Checks if a specified directory is a valid installation
    isValidInstall: (_: Event, fileDir: string) =>
        ipcRenderer.invoke('file:isValidInstall', fileDir),

    // List available backups
    listBackups: () => ipcRenderer.invoke('file:listBackups'),

    // Loads the names of the mod files
    loadModFileNames: () => ipcRenderer.invoke('file:loadModFileNames'),

    // Creates a backup of a specified installation directory
    makeBackup: (_: Event, dir: string) =>
        ipcRenderer.invoke('file:makeBackup', dir),

    // Opens a specified installation directory
    openDirectory: (_: Event, dir: string) =>
        ipcRenderer.send('file:openDirectory', dir),

    // Opens the mods directory
    openModsDir: () => ipcRenderer.send('file:openModsDir'),

    // Removes a directory from the list of installation directories
    removeFromInstallDirs: (_: Event, dir: string) =>
        ipcRenderer.invoke('file:removeFromInstallDirs', dir),

    // Removes a mod from the mods directory
    removeModFromMods: (_: Event, fileName: string) =>
        ipcRenderer.invoke('file:removeModFromMods', fileName),

    // Restore a backup
    restoreBackup: (_: Event, backupPath: string, installDir: string) =>
        ipcRenderer.invoke('file:restoreBackup', backupPath, installDir),

    // Runs the game from a specified executable directory
    runGame: (_: Event, exeDir: string) =>
        ipcRenderer.invoke('file:runGame', exeDir),

    // Opens a folder selection dialog
    selectFolder: () => ipcRenderer.invoke('file:selectFolder'),

    // Views the directories inside a specified zip file
    viewFileDirsInZip: (_: Event, zipFilePath: string) =>
        ipcRenderer.invoke('file:viewFileDirsInZip', zipFilePath),
});
