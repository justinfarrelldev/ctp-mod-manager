import { app, BrowserWindow, ipcMain, shell } from 'electron';
import isDev from 'electron-is-dev';
import path from 'path';
import { updateElectronApp, UpdateSourceType } from 'update-electron-app';

import { DEFAULT_MOD_DIR } from './constants';
import { addToInstallDirs } from './file/addToInstallDirs';
import { applyModsToInstall } from './file/applyModsToInstall';
import { copyFileToModDir } from './file/copyFileToModDir';
import { deleteBackup } from './file/deleteBackup';
import { getAppliedMods } from './file/getAppliedMods';
import { getCtp2ExecutablePath } from './file/getGameExecutablePath';
import { getInstallDirs } from './file/getInstallDirs';
import { isValidInstall } from './file/isValidInstall';
import { listBackups } from './file/listBackups';
import { loadModFileNames } from './file/loadModFileNames';
import { makeBackup } from './file/makeBackup';
import { removeFromInstallDirs } from './file/removeFromInstallDirs';
import { removeModFromMods } from './file/removeModFromMods';
import { restoreBackup } from './file/restoreBackup';
import { isGameRunning, runGame, stopGame } from './file/runGame';
import { selectFolder } from './file/selectFolder';
import { viewFileDirsInZip } from './file/viewFilesInZip';
import { getInstallDirectories } from './getInstallDirectories';

updateElectronApp({
    updateSource: {
        repo: 'justinfarrelldev/ctp-mod-manager',
        type: UpdateSourceType.ElectronPublicUpdateService,
    },
});

declare const MAIN_WINDOW_VITE_DEV_SERVER_URL: string;
declare const MAIN_WINDOW_VITE_NAME: string;

let win: BrowserWindow;

const createWindow = (): void => {
    // Create the browser window.
    win = new BrowserWindow({
        webPreferences: {
            contextIsolation: true,
            preload: path.join(__dirname, 'preload.js'),
        },
    });

    if (MAIN_WINDOW_VITE_DEV_SERVER_URL) {
        win.loadURL(MAIN_WINDOW_VITE_DEV_SERVER_URL);
    } else {
        win.loadFile(
            path.join(
                __dirname,
                `../renderer/${MAIN_WINDOW_VITE_NAME}/index.html`
            )
        );
    }
    // Open the DevTools.
    if (isDev) {
        win.webContents.openDevTools({ mode: 'detach' });
    }
};

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.whenReady().then(() => {
    ipcMain.handle('load:getCtp2InstallDir', getInstallDirectories);

    ipcMain.on('file:openDirectory', (_, dir) => shell.openPath(dir));

    ipcMain.on('file:openModsDir', () => shell.openPath(DEFAULT_MOD_DIR));

    ipcMain.handle('file:viewFileDirsInZip', (_, zipFilePath) =>
        viewFileDirsInZip(zipFilePath)
    );

    ipcMain.handle('file:copyFileToModDir', (_, fileDir) =>
        copyFileToModDir(fileDir)
    );

    ipcMain.handle('file:removeModFromMods', (_, fileName) => {
        removeModFromMods(fileName);
    });

    ipcMain.handle('file:loadModFileNames', loadModFileNames);

    ipcMain.handle('file:getModsDir', () => DEFAULT_MOD_DIR);

    ipcMain.handle('file:selectFolder', () => selectFolder(win));

    ipcMain.handle('file:isValidInstall', (_, dir) => isValidInstall(dir));

    ipcMain.handle('file:addToInstallDirs', (_, dir) => addToInstallDirs(dir));

    ipcMain.handle('file:getInstallDirs', getInstallDirs);

    ipcMain.handle('file:runGame', (_, exeDir) => runGame(exeDir));

    // Add new handlers for game control
    ipcMain.handle('file:stopGame', stopGame);
    ipcMain.handle('file:isGameRunning', (_, exeDir) => isGameRunning(exeDir));

    ipcMain.handle('file:removeFromInstallDirs', (_, dir) =>
        removeFromInstallDirs(dir)
    );

    ipcMain.handle('file:listBackups', listBackups);

    ipcMain.handle('file:restoreBackup', (_, backupPath, installDir) =>
        restoreBackup(backupPath, installDir)
    );

    ipcMain.handle('file:makeBackup', (_, dir, backupName) =>
        makeBackup(dir, backupName)
    );

    ipcMain.handle(
        'file:applyModsToInstall',
        async (_, dir, mods) => await applyModsToInstall(dir, mods)
    );

    ipcMain.handle('file:deleteBackup', (_, backupPath) =>
        deleteBackup(backupPath)
    );

    ipcMain.handle('file:getCtp2ExecutablePath', (_, installDir) =>
        getCtp2ExecutablePath(installDir)
    );

    // Add new handler for getting applied mods
    ipcMain.handle('file:getAppliedMods', (_, installDir) =>
        getAppliedMods(installDir)
    );

    createWindow();
});

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});

app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
        createWindow();
    }
});
