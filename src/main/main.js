// src/main/main.js
const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const Store = require('electron-store');

const store = new Store({
  defaults: {
    settings: {
      zoomLevel: 2,
      enable360View: false
    }
  }
});

let gameState = { currentRound: 0, score: 0 };

function createWindow() {
  const mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    fullscreen: true,  // still starting in full-screen
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      preload: path.join(__dirname, 'preload.js')
    }
  });

  // **Open DevTools undocked on every launch**
  mainWindow.webContents.openDevTools({ mode: 'undocked' });

  mainWindow.loadFile(path.join(__dirname, '../renderer/index.html'));

  ipcMain.handle('get-settings',   () => store.get('settings'));
  ipcMain.handle('save-settings',  (_, s) => { store.set('settings', s); return true; });
  ipcMain.handle('start-game',     () => { gameState = { currentRound: 0, score: 0 }; return gameState; });
  ipcMain.handle('end-game',       (_, score) => { gameState.score = score; return gameState; });
}

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) createWindow();
});