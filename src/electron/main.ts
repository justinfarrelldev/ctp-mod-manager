// Since this is an Electron file, we must use require
import path from 'path';

import { app, BrowserWindow, ipcMain, shell } from 'electron';
import isDev from 'electron-is-dev';
import { copyFileToModDir } from './file/copyFileToModDir';
import { goToRoute } from './process/goToRoute';
import { getInstallDirectories } from './getInstallDirectories';
import { loadMods } from './file/loadMods';

let win: BrowserWindow;

const createWindow = () => {
  // Create the browser window.
  win = new BrowserWindow({
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
    },
  });

  // and load the index.html of the app.
  // win.loadFile("index.html");
  win.loadURL(
    isDev ? 'http://localhost:3300' : `file://${path.join(__dirname, '../build/index.html')}`
  );
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
  // ipcMain.handle('file:openInstallDir', openInstallDir);
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

ipcMain.on('file:openInstallDir', (event, dir) => shell.openPath(dir));

ipcMain.on('process:goToRoute', (event, route) => goToRoute(route, win));

ipcMain.on('file:copyFileToModDir', (event, fileDir) => copyFileToModDir(fileDir));

ipcMain.handle('file:loadMods', () => loadMods());
