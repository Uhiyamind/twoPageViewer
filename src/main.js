const { app, BrowserWindow, ipcMain, dialog } = require("electron");
const path = require("path");
const fs = require("fs");

function createWindow() {
  const win = new BrowserWindow({
    width: 1200,
    height: 800,
    autoHideMenuBar: true,
    frame: true,
    backgroundColor: "#121212",
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
      enableRemoteModule: true,
      webSecurity: false,
    },
  });

  // 開発時のみDevToolsを表示
  if (process.env.NODE_ENV === "development") {
    win.webContents.openDevTools();
  }

  // ファイルの絶対パスを取得
  const indexPath = path.join(__dirname, "../public/index.html");
  win.loadFile(indexPath);
}

app.whenReady().then(createWindow);

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});

app.on("activate", () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

// フォルダ選択ダイアログを開く
ipcMain.handle("select-folder", async () => {
  const result = await dialog.showOpenDialog({
    properties: ["openDirectory"],
  });
  return result.filePaths[0];
});

// フォルダ内の画像ファイルを取得
ipcMain.handle("get-images", async (event, folderPath) => {
  const validExtensions = [".jpg", ".jpeg", ".png", ".gif", ".bmp"];
  const files = fs
    .readdirSync(folderPath)
    .filter((file) => {
      const ext = path.extname(file).toLowerCase();
      return validExtensions.includes(ext);
    })
    .sort();
  return files.map((file) => path.join(folderPath, file));
});
