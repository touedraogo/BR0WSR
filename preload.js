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
  },
  terminal: {
    create: ()     => ipcRenderer.invoke('terminal-create'),
    input:  (data) => ipcRenderer.invoke('terminal-input', data),
    resize: (c, r) => ipcRenderer.invoke('terminal-resize', c, r),
    kill:   ()     => ipcRenderer.invoke('terminal-kill'),
    onData: (cb)   => ipcRenderer.on('terminal-data', (_, data) => cb(data)),
    onExit: (cb)   => ipcRenderer.on('terminal-exit', (_, code) => cb(code)),
  }
})
