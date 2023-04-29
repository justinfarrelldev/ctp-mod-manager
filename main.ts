const path = require('path');

const { app, BrowserWindow, ipcMain } = require('electron');
const isDev = require('electron-is-dev');
const fs = require('fs');
const os = require('os');
let win;
function createWindow() {
  // Create the browser window.
  win = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      preload: path.join(__dirname, 'preload.ts'),
      contextIsolation: true,
      nodeIntegration: true,
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
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.whenReady().then(createWindow);

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

ipcMain.on('SEND_CTP2_INSTALL_DIR', (event, args) => {
  // C:\Program Files (x86)\Steam\steamapps\common\Call to Power II
  let installationType = null;
  console.log('PROCESS PLATFORM: ', process.platform);
  if (process.platform === 'win32') {
    console.log(
      'fs existssync: ',
      fs.existsSync('C:\\Program Files (x86)\\Steam\\steamapps\\common\\Call to Power II')
    );
    if (fs.existsSync('C:\\Program Files (x86)\\Steam\\steamapps\\common\\Call to Power II')) {
      installationType = 'steam';
    }
  }
  // WSL
  if (process.platform === 'linux' && os.release().toLowerCase().includes('microsoft')) {
    if (fs.existsSync('/mnt/c/Program Files (x86)/Steam/steamapps/common/Call to Power II')) {
      installationType = 'steam';
    }
  }
  console.log('installation type: ', installationType);
});
