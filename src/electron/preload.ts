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

    // Gets the list of mods applied to an installation
    getAppliedMods: (_: Event, installDir: string) =>
        ipcRenderer.invoke('file:getAppliedMods', installDir),

    // Gets the platform-specific path to the CTP2 executable
    getCtp2ExecutablePath: (_: Event, installDir: string) =>
        ipcRenderer.invoke('file:getCtp2ExecutablePath', installDir),

    // Retrieves the Call to Power II installation directory
    getCtp2InstallDir: () => ipcRenderer.invoke('load:getCtp2InstallDir'),

    // Retrieves the list of installation directories
    getInstallDirs: () => ipcRenderer.invoke('file:getInstallDirs'),

    // Retrieves the mods directory
    getModsDir: () => ipcRenderer.invoke('file:getModsDir'),

    // Checks if a game is currently running
    isGameRunning: (_: Event, exeDir?: string) =>
        ipcRenderer.invoke('file:isGameRunning', exeDir),

    // Checks if a specified directory is a valid installation
    isValidInstall: (_: Event, fileDir: string) =>
        ipcRenderer.invoke('file:isValidInstall', fileDir),

    // List available backups
    listBackups: () => ipcRenderer.invoke('file:listBackups'),

    // Loads the names of the mod files
    loadModFileNames: () => ipcRenderer.invoke('file:loadModFileNames'),

    // Creates a backup of a specified installation directory
    makeBackup: (_: Event, dir: string, backupName?: string) =>
        ipcRenderer.invoke('file:makeBackup', dir, backupName),

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

    // Stops the currently running game
    stopGame: () => ipcRenderer.invoke('file:stopGame'),

    // Views the directories inside a specified zip file
    viewFileDirsInZip: (_: Event, zipFilePath: string) =>
        ipcRenderer.invoke('file:viewFileDirsInZip', zipFilePath),
});
