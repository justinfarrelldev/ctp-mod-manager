// Since this is an Electron file, we must use require
const path = require('path');

const { app, BrowserWindow, ipcMain, shell } = require('electron');
const isDev = require('electron-is-dev');
const fs = require('fs');
const os = require('os');

const DEFAULT_WINDOWS_DIR = 'C:\\Program Files (x86)\\Steam\\steamapps\\common\\Call to Power II';
const DEFAULT_WSL2_DIR = '/mnt/c/Program Files (x86)/Steam/steamapps/common/Call to Power II';

let win;

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

// Goes to the provided route.
const goToRoute = (route) => {
  let pathInUrl = '';
  if (route.startsWith('/')) {
    pathInUrl = route.slice(1).replaceAll(' ', '_');
  } else {
    pathInUrl = route.replaceAll(' ', '_');
  }
  // TODO fix this for production
  win.loadURL(
    // isDev
    // ?
    `http://localhost:3300/${pathInUrl}`
    // : `file://${path.join(__dirname, '../build/index.html')}`
  );
};

const getInstallDirectories = () => {
  const installInfos = [];
  // C:\Program Files (x86)\Steam\steamapps\common\Call to Power II
  if (process.platform === 'win32') {
    if (fs.existsSync(DEFAULT_WINDOWS_DIR)) {
      installInfos.push({
        installationType: 'steam',
        os: process.platform,
        directory: DEFAULT_WINDOWS_DIR,
      });
    }
  }
  // WSL
  if (process.platform === 'linux' && os.release().toLowerCase().includes('microsoft')) {
    if (fs.existsSync(DEFAULT_WSL2_DIR)) {
      installInfos.push({
        installationType: 'steam',
        os: process.platform,
        directory: DEFAULT_WSL2_DIR,
      });
    }
  }

  return installInfos;
};

const openInstallDir = (dir) => {
  console.log('trying to open install dir: ', dir);
  shell.openPath(dir);
};

const copyFiles = (/* fileDir, fileDest */) => {
  console.log('trying to copy files');
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

ipcMain.on('file:openInstallDir', (event, dir) => openInstallDir(dir));

ipcMain.on('process:goToRoute', (event, route) => goToRoute(route));

ipcMain.on('file:copy', (/* event, fileDir, fileDest */) => copyFiles(/* fileDir, fileDest */));
