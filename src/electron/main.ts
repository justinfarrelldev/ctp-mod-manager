import path from 'path';
import { app, BrowserWindow, ipcMain, shell } from 'electron';
import isDev from 'electron-is-dev';
import { copyFileToModDir } from './file/copyFileToModDir';
import { goToRoute } from './process/goToRoute';
import { getInstallDirectories } from './getInstallDirectories';
import { loadModFileNames } from './file/loadModFileNames';
import { DEFAULT_MOD_DIR } from './constants';
import { viewFileDirsInZip } from './file/viewFilesInZip';
import { selectFolder } from './file/selectFolder';
import { isValidInstall } from './file/isValidInstall';
import { addToInstallDirs } from './file/addToInstallDirs';
import { getInstallDirs } from './file/getInstallDirs';
import { runGame } from './file/runGame';
import { removeFromInstallDirs } from './file/removeFromInstallDirs';
import { makeBackup } from './file/makeBackup';
import { applyModsToInstall } from './file/applyModsToInstall';
import { removeModFromMods } from './file/removeModFromMods';
import { getFileChangesToApplyMod } from './file/getFileChangesToApplyMod';

declare const MAIN_WINDOW_VITE_DEV_SERVER_URL: string;
declare const MAIN_WINDOW_VITE_NAME: string;

let win: BrowserWindow;

const createWindow = () => {
    // Create the browser window.
    win = new BrowserWindow({
        webPreferences: {
            preload: path.join(__dirname, 'preload.js'),
            contextIsolation: true,
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

    ipcMain.on('file:openInstallDir', (_, dir) => shell.openPath(dir));

    ipcMain.on('file:openModsDir', () => shell.openPath(DEFAULT_MOD_DIR));

    ipcMain.handle('file:viewFileDirsInZip', (_, zipFilePath) =>
        viewFileDirsInZip(zipFilePath)
    );

    ipcMain.on('process:goToRoute', (_, route) => goToRoute(route, win));

    ipcMain.handle('file:copyFileToModDir', (_, fileDir) =>
        copyFileToModDir(fileDir)
    );

    ipcMain.handle('file:removeModFromMods', (_, fileName) => {
        removeModFromMods(fileName);
    });

    ipcMain.handle('file:loadModFileNames', () => loadModFileNames());

    ipcMain.handle('file:getModsDir', () => DEFAULT_MOD_DIR);

    ipcMain.handle('file:selectFolder', () => selectFolder(win));

    ipcMain.handle('file:isValidInstall', (_, dir) => isValidInstall(dir));

    ipcMain.handle('file:addToInstallDirs', (_, dir) => addToInstallDirs(dir));

    ipcMain.handle('file:getInstallDirs', () => getInstallDirs());

    ipcMain.handle('file:runGame', (_, exeDir) => runGame(exeDir));

    ipcMain.handle('file:removeFromInstallDirs', (_, dir) =>
        removeFromInstallDirs(dir)
    );

    ipcMain.handle('file:makeBackup', (_, dir) => makeBackup(dir));

    ipcMain.handle(
        'file:applyModsToInstall',
        async (_, dir, mods) => await applyModsToInstall(dir, mods)
    );

    ipcMain.on('file:getFileChangesToApplyMod', (_, modName, installDir) => {
        getFileChangesToApplyMod(modName, installDir);
    });

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
