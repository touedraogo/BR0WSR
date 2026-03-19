const { app, BrowserWindow, ipcMain, session, systemPreferences } = require('electron')
const { ElectronBlocker } = require('@cliqz/adblocker-electron')
const { exec } = require('child_process')
const path = require('path')

const VPN_CLI = '/Applications/NordVPN.app/Contents/MacOS/Nordvpn'

const COUNTRIES = [
  { code: 'us', name: 'United States', flag: '🇺🇸' },
  { code: 'gb', name: 'United Kingdom', flag: '🇬🇧' },
  { code: 'de', name: 'Germany', flag: '🇩🇪' },
  { code: 'fr', name: 'France', flag: '🇫🇷' },
  { code: 'nl', name: 'Netherlands', flag: '🇳🇱' },
  { code: 'jp', name: 'Japan', flag: '🇯🇵' },
  { code: 'au', name: 'Australia', flag: '🇦🇺' },
  { code: 'ca', name: 'Canada', flag: '🇨🇦' },
  { code: 'ch', name: 'Switzerland', flag: '🇨🇭' },
  { code: 'se', name: 'Sweden', flag: '🇸🇪' },
  { code: 'pl', name: 'Poland', flag: '🇵🇱' },
  { code: 'no', name: 'Norway', flag: '🇳🇴' },
  { code: 'dk', name: 'Denmark', flag: '🇩🇰' },
  { code: 'fi', name: 'Finland', flag: '🇫🇮' },
  { code: 'it', name: 'Italy', flag: '🇮🇹' },
  { code: 'es', name: 'Spain', flag: '🇪🇸' },
  { code: 'pt', name: 'Portugal', flag: '🇵🇹' },
  { code: 'br', name: 'Brazil', flag: '🇧🇷' },
  { code: 'sg', name: 'Singapore', flag: '🇸🇬' },
  { code: 'kr', name: 'South Korea', flag: '🇰🇷' },
]

function run(cmd) {
  return new Promise(resolve => exec(cmd, (err, stdout) => resolve(err ? '' : stdout.trim())))
}

// ── Auth ─────────────────────────────────────────────────────
ipcMain.handle('auth-check', () => {
  try {
    return systemPreferences.canPromptTouchID()
  } catch {
    return false
  }
})

ipcMain.handle('auth-fingerprint', async () => {
  try {
    await systemPreferences.promptTouchID('unlock BR0WSR')
    return { success: true }
  } catch (err) {
    return { success: false, error: err.message }
  }
})

ipcMain.handle('vpn-countries', () => COUNTRIES)

ipcMain.handle('vpn-status', async () => {
  const out = await run(`"${VPN_CLI}" status`)
  if (out.includes('Connected')) return 'Connected'
  if (out.includes('Connecting')) return 'Connecting'
  if (out.includes('Disconnecting')) return 'Disconnecting'
  return 'Disconnected'
})

ipcMain.handle('vpn-connect', async (_, countryCode) => {
  if (countryCode) {
    await run(`"${VPN_CLI}" connect ${countryCode}`)
  } else {
    await run(`"${VPN_CLI}" connect`)
  }
})

ipcMain.handle('vpn-disconnect', async () => {
  await run(`"${VPN_CLI}" disconnect`)
})

ipcMain.handle('vpn-quick-connect', async () => {
  await run(`"${VPN_CLI}" connect`)
})

ipcMain.handle('vpn-reconnect', async () => {
  await run(`"${VPN_CLI}" reconnect`)
})

ipcMain.handle('vpn-protocol', async () => {
  const out = await run(`"${VPN_CLI}" settings`)
  if (out.includes('UDP')) return 'UDP'
  if (out.includes('TCP')) return 'TCP'
  return 'N/A'
})

ipcMain.handle('vpn-protocol-set', async (_, protocol) => {
  if (protocol === 'UDP') {
    await run(`"${VPN_CLI}" set protocol UDP`)
  } else {
    await run(`"${VPN_CLI}" set protocol TCP`)
  }
})

let win

app.whenReady().then(() => {
  win = new BrowserWindow({
    width: 1200, height: 800,
    titleBarStyle: 'hiddenInset',
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      webviewTag: true,
      preload: path.join(__dirname, 'preload.js'),
    }
  })

  win.loadFile('index.html')

  ElectronBlocker.fromPrebuiltAdsAndTracking(fetch).then(blocker => {
    blocker.enableBlockingInSession(session.defaultSession)
    app.on('session-created', s => blocker.enableBlockingInSession(s))
    console.log('[blocker] active')
  }).catch(err => console.error('[blocker] error:', err))
})

ipcMain.handle('screenshot-capture', async () => {
  const image = await win.webContents.capturePage()
  return image.toDataURL()
})

app.on('window-all-closed', () => app.quit())
