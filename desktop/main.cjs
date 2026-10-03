const { app, BrowserWindow, shell } = require('electron');
const path = require('path');

function createWindow() {
  const mainWindow = new BrowserWindow({
    width: 1120,
    height: 840,
    minWidth: 780,
    minHeight: 600,
    backgroundColor: '#0d0e12',
    title: 'Unsaid — A private place for the things you don\'t know how to say out loud',
    icon: path.join(__dirname, '../public/favicon.svg'),
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: true
    },
    titleBarStyle: 'default',
    autoHideMenuBar: true
  });

  const startUrl = process.env.VITE_DEV_SERVER_URL || 'http://localhost:5173';

  mainWindow.loadURL(startUrl).catch(() => {
    // If dev server isn't running yet, load production dist
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html'));
  });

  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: 'deny' };
  });
}

app.whenReady().then(() => {
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
