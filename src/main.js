const { app, BrowserWindow, ipcMain, dialog } = require("electron");
const path = require("path");
const fs = require("fs");

// 自然順ソート用の比較関数
const naturalSort = (a, b) => {
  // ファイル名部分を取得
  const aName = path.basename(a);
  const bName = path.basename(b);

  // 数字部分を抽出して数値として比較
  const aParts = aName.split(/(\d+)/).map((part) => {
    return /^\d+$/.test(part) ? parseInt(part, 10) : part.toLowerCase();
  });
  const bParts = bName.split(/(\d+)/).map((part) => {
    return /^\d+$/.test(part) ? parseInt(part, 10) : part.toLowerCase();
  });

  // 部分ごとに比較
  for (let i = 0; i < Math.min(aParts.length, bParts.length); i++) {
    if (aParts[i] !== bParts[i]) {
      return typeof aParts[i] === "number" && typeof bParts[i] === "number"
        ? aParts[i] - bParts[i]
        : String(aParts[i]).localeCompare(String(bParts[i]));
    }
  }
  return aParts.length - bParts.length;
};

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
    .map((file) => path.join(folderPath, file)) // フルパスに変換
    .sort(naturalSort); // 自然順でソート
  return files;
});
