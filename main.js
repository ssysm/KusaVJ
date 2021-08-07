const { app, ipcMain, BrowserWindow } = require('electron')
const path = require('path');
const prod = false;
// Keep a global reference of the windows object, if you don't, the window will
// be closed automatically when the JavaScript object is garbage collected.
let playerWindow;
let controlWindow;

function createWindow() {
    // Create the browser window.
    playerWindow = new BrowserWindow({ width: 800, height: 600,
        webPreferences: {
            nodeIntegration: false, // is default value after Electron v5
            contextIsolation: true, // protect against prototype pollution
            enableRemoteModule: false, // turn off remote
            preload: path.join(__dirname, "player_preload.js") // use a preload script
        }
    });
    
    controlWindow = new BrowserWindow({ width: 1024, height: 768,
        webPreferences: {
            nodeIntegration: true, 
            contextIsolation: false,
            enableRemoteModule: true,
          }
    });

    // and load the index.html of the app.
    playerWindow.loadFile('player.html')

    // and load the second window.
    controlWindow.loadFile('control.html')

    // Emitted when the window is closed.
    controlWindow.on('closed', function () {
        // Dereference the window object, usually you would store windows
        // in an array if your app supports multi windows, this is the time
        // when you should delete the corresponding element.
        controlWindow = null;
        playerWindow = null;
        if (process.platform !== 'darwin') app.quit()
    })

    ipcMain.on('remote-fullscreen', (evt,arg)=>{
        const contents = playerWindow.webContents
        contents.executeJavaScript('player.requestFullscreen()',true)
    })

    playerWindow.setMenu(null);

    if(!prod){
        playerWindow.webContents.openDevTools();
    }else{
        controlWindow.setMenu(null);
    }
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.whenReady().then(() => {
    createWindow()
    app.on('activate', function () {
        // On macOS it's common to re-create a window in the app when the
        // dock icon is clicked and there are no other windows open.
        if (BrowserWindow.getAllWindows().length === 0) createWindow()
    })
})
  
// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', function () {
    if (process.platform !== 'darwin') app.quit()
})
