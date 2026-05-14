const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('agentApi', {
  getConfig: () => ipcRenderer.invoke('config:get'),
  saveConfig: (config) => ipcRenderer.invoke('config:save', config),
  startAgent: () => ipcRenderer.invoke('agent:start'),
  stopAgent: () => ipcRenderer.invoke('agent:stop'),
  getStatus: () => ipcRenderer.invoke('agent:status'),
  listPrinters: () => ipcRenderer.invoke('printers:list'),
  testPrinter: (printerName) => ipcRenderer.invoke('printer:test', printerName),
  readLogs: () => ipcRenderer.invoke('logs:read'),
  getLogPath: () => ipcRenderer.invoke('logs:path'),
  onLog: (cb) => ipcRenderer.on('agent:log', (_, msg) => cb(msg)),
  switchScreen: (screenName) => ipcRenderer.invoke('switch-screen', screenName),
});
