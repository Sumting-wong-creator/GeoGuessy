// src/main/preload.js
const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('api', {
  electron: {
    getSettings:   () => ipcRenderer.invoke('get-settings'),
    saveSettings:  (s) => ipcRenderer.invoke('save-settings', s),
    startGame:     () => ipcRenderer.invoke('start-game'),
    endGame:       (score) => ipcRenderer.invoke('end-game', score)
  },
  leaflet: {
    createMap: (containerId, opts) =>
      window.L && document.getElementById(containerId)
        ? window.L.map(containerId, opts)
        : null,
    tileLayer: (url, opts) =>
      window.L ? window.L.tileLayer(url, opts) : null,
    marker: (latlng, opts) =>
      window.L ? window.L.marker(latlng, opts) : null
  }
});