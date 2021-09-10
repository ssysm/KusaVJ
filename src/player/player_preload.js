const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('ipcApi', {
  requestVideoFullscreen: ()=>{
    ipcRenderer.send('remote-fullscreen', 'ping')
  },
})