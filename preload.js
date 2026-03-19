const { contextBridge, ipcRenderer } = require('electron')

contextBridge.exposeInMainWorld('browser', {
  onBlockerReady: (cb) => ipcRenderer.on('blocker-ready', () => cb()),
  auth: {
    check:       ()     => ipcRenderer.invoke('auth-check'),
    fingerprint: ()     => ipcRenderer.invoke('auth-fingerprint'),
  },
  vpn: {
    countries:   ()     => ipcRenderer.invoke('vpn-countries'),
    status:     ()     => ipcRenderer.invoke('vpn-status'),
    connect:    (code) => ipcRenderer.invoke('vpn-connect', code),
    disconnect: ()     => ipcRenderer.invoke('vpn-disconnect'),
    quickConnect: ()   => ipcRenderer.invoke('vpn-quick-connect'),
    reconnect:  ()     => ipcRenderer.invoke('vpn-reconnect'),
    protocol:  ()     => ipcRenderer.invoke('vpn-protocol'),
    setProtocol: (p)  => ipcRenderer.invoke('vpn-protocol-set', p),
  },
  screenshot: {
    capture: (tabId) => ipcRenderer.invoke('screenshot-capture', tabId),
  }
})
