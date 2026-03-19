const { app, BrowserWindow, ipcMain, session, systemPreferences } = require('electron')
const { ElectronBlocker } = require('@ghostery/adblocker-electron')
const { exec } = require('child_process')
const pty = require('node-pty')
const path = require('path')

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

// ── Terminal execution ────────────────────────────────────────────
let ptyProcess = null

ipcMain.handle('terminal-create', async () => {
  console.log('[Terminal] Creating PTY...')
  try {
    if (ptyProcess) {
      ptyProcess.kill()
      ptyProcess = null
    }
    
    const shell = process.env.SHELL || '/bin/bash'
    console.log('[Terminal] Spawning shell:', shell)
    
    ptyProcess = pty.spawn(shell, [], {
      name: 'xterm-color',
      cols: 80,
      rows: 24,
      cwd: process.env.HOME || '/',
      env: process.env
    })
    
    console.log('[Terminal] PTY created successfully')
    
    ptyProcess.onData((data) => {
      if (win && !win.isDestroyed()) {
        win.webContents.send('terminal-data', data)
      }
    })
    
    ptyProcess.onExit(({ exitCode, signal }) => {
      console.log('[Terminal] PTY exited:', exitCode, signal)
      if (win && !win.isDestroyed()) {
        win.webContents.send('terminal-exit', exitCode)
      }
    })
    
    return { success: true }
  } catch (err) {
    console.error('[Terminal] Error:', err)
    return { success: false, error: err.message }
  }
})

ipcMain.handle('terminal-input', async (_, data) => {
  if (ptyProcess) {
    ptyProcess.write(data)
  }
})

ipcMain.handle('terminal-resize', async (_, cols, rows) => {
  if (ptyProcess) {
    ptyProcess.resize(cols, rows)
  }
})

ipcMain.handle('terminal-kill', async () => {
  if (ptyProcess) {
    ptyProcess.kill()
    ptyProcess = null
  }
})

// ── VPN ────────────────────────────────────────────────────────
ipcMain.handle('vpn-status', async () => {
  try {
    const out = await new Promise(resolve => {
      exec(`osascript -e 'tell application "NordVPN" to get connected' 2>/dev/null`, (err, stdout) => {
        resolve(err ? '' : stdout.trim())
      })
    })
    return out === 'true' ? 'Connected' : 'Disconnected'
  } catch (err) {
    return 'Disconnected'
  }
})

ipcMain.handle('vpn-connect', async (_, countryCode) => {
  // Use NordVPN URL scheme to connect
  await run(`open "nordvpn://connect?country=${countryCode}"`)
})

ipcMain.handle('vpn-disconnect', async () => {
  await run(`open "nordvpn://disconnect"`)
})

ipcMain.handle('vpn-quick-connect', async () => {
  await run(`open "nordvpn://connect"`)
})

ipcMain.handle('vpn-reconnect', async () => {
  await run(`open "nordvpn://disconnect"`)
  await new Promise(r => setTimeout(r, 1000))
  await run(`open "nordvpn://connect"`)
})

ipcMain.handle('vpn-protocol', async () => {
  return 'N/A'
})

ipcMain.handle('vpn-protocol-set', async () => {
  return { status: 'error', message: 'Protocol not available' }
})

ipcMain.handle('vpn-server', async () => {
  return null
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
