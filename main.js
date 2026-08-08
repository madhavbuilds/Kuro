// Kuro — main process
// Transparent always-on-top cat window + tray + timers + local agent hook server.
'use strict';

const { app, BrowserWindow, Tray, Menu, screen, ipcMain, nativeImage } = require('electron');
const path = require('path');
const fs = require('fs');
const http = require('http');

// ---------- settings ----------
const DEFAULTS = {
  name: '',
  baseColor: '#2d2a30',      // cat body (default: black cat)
  patternColor: '#4c4753',   // stripes / patches
  bellyColor: '#efe9e0',     // tuxedo chest / muzzle
  pattern: 'solid',          // solid | tabby | tuxedo | calico | siamese
  scale: 1.0,                // 0.7 .. 1.6
  sounds: true,
  stretchEveryMin: 45,       // 0 = off
  waterEveryMin: 60,         // 0 = off
  pomodoroFocusMin: 25,
  pomodoroBreakMin: 5,
  fixedMessage: '',
  customReminderTime: '',    // "HH:MM"
  customReminderText: '',
  peekMode: false,
  agentPort: 41999
};

let settings = { ...DEFAULTS };
const settingsPath = () => path.join(app.getPath('userData'), 'settings.json');

function loadSettings() {
  try {
    settings = { ...DEFAULTS, ...JSON.parse(fs.readFileSync(settingsPath(), 'utf8')) };
  } catch (_) { /* first run */ }
}
function saveSettings() {
  try { fs.writeFileSync(settingsPath(), JSON.stringify(settings, null, 2)); } catch (e) { console.error(e); }
}

// ---------- windows ----------
let catWin = null;
let settingsWin = null;
let tray = null;

const WIN_W = 300, WIN_H = 340;

function createCatWindow() {
  const { workArea } = screen.getPrimaryDisplay();
  catWin = new BrowserWindow({
    width: WIN_W,
    height: WIN_H,
    x: workArea.x + workArea.width - WIN_W - 24,
    y: workArea.y + workArea.height - WIN_H - 8,
    transparent: true,
    frame: false,
    resizable: false,
    hasShadow: false,
    alwaysOnTop: true,
    skipTaskbar: true,
    focusable: false,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false
    }
  });
  catWin.setAlwaysOnTop(true, 'screen-saver');
  catWin.setVisibleOnAllWorkspaces(true, { visibleOnFullScreen: true });
  // Click-through by default; renderer asks for clicks when the cursor is on the cat.
  catWin.setIgnoreMouseEvents(true, { forward: true });
  catWin.loadFile(path.join(__dirname, 'renderer', 'index.html'));
  catWin.webContents.on('did-finish-load', () => {
    send('settings', settings);
  });
  catWin.on('closed', () => { catWin = null; });
}

function openSettingsWindow() {
  if (settingsWin) { settingsWin.focus(); return; }
  settingsWin = new BrowserWindow({
    width: 420,
    height: 640,
    title: 'Kuro settings',
    resizable: false,
    autoHideMenuBar: true,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false
    }
  });
  settingsWin.loadFile(path.join(__dirname, 'settings', 'settings.html'));
  settingsWin.on('closed', () => { settingsWin = null; });
}

function send(channel, payload) {
  if (catWin && !catWin.isDestroyed()) catWin.webContents.send(channel, payload);
}

// ---------- cursor polling (global, no native hooks needed) ----------
let lastCursor = null;
let cursorTimer = null;

function startCursorPolling() {
  cursorTimer = setInterval(() => {
    if (!catWin || catWin.isDestroyed()) return;
    const p = screen.getCursorScreenPoint();
    const b = catWin.getBounds();
    const now = Date.now();
    let speed = 0;
    if (lastCursor) {
      const dt = Math.max(1, now - lastCursor.t);
      speed = Math.hypot(p.x - lastCursor.x, p.y - lastCursor.y) / dt * 1000; // px/s
    }
    lastCursor = { x: p.x, y: p.y, t: now };
    send('cursor', { x: p.x - b.x, y: p.y - b.y, sx: p.x, sy: p.y, speed });
    if (dragging) {
      catWin.setBounds({
        x: Math.round(p.x - dragOffset.x),
        y: Math.round(p.y - dragOffset.y),
        width: WIN_W, height: WIN_H
      });
    }
  }, 33);
}

// ---------- dragging ----------
let dragging = false;
let dragOffset = { x: 0, y: 0 };

ipcMain.on('drag-start', () => {
  if (!catWin) return;
  const p = screen.getCursorScreenPoint();
  const b = catWin.getBounds();
  dragOffset = { x: p.x - b.x, y: p.y - b.y };
  dragging = true;
});
ipcMain.on('drag-end', () => { dragging = false; });

// ---------- click-through toggling ----------
ipcMain.on('set-clickable', (_e, clickable) => {
  if (!catWin) return;
  catWin.setIgnoreMouseEvents(!clickable, { forward: true });
});

// ---------- settings IPC ----------
ipcMain.handle('get-settings', () => settings);
ipcMain.on('save-settings', (_e, next) => {
  settings = { ...settings, ...next };
  saveSettings();
  send('settings', settings);
  scheduleReminders();
  buildTray();
});
ipcMain.on('open-settings', () => openSettingsWindow());

// ---------- global keyboard (optional native hook) ----------
let keyboardAvailable = false;
function startKeyboardHook() {
  try {
    const { uIOhook } = require('uiohook-napi');
    uIOhook.on('keydown', () => send('key', Date.now()));
    uIOhook.start();
    keyboardAvailable = true;
  } catch (_) {
    // uiohook-napi not installed/built — cat still works, just no global kneading.
    keyboardAvailable = false;
  }
}

// ---------- reminders ----------
let stretchTimer = null, waterTimer = null, customTimer = null;

function scheduleReminders() {
  clearInterval(stretchTimer); clearInterval(waterTimer); clearInterval(customTimer);
  if (settings.stretchEveryMin > 0) {
    stretchTimer = setInterval(() => {
      send('reminder', { type: 'stretch' });
    }, settings.stretchEveryMin * 60000);
  }
  if (settings.waterEveryMin > 0) {
    waterTimer = setInterval(() => {
      send('reminder', { type: 'water' });
    }, settings.waterEveryMin * 60000);
  }
  if (settings.customReminderTime && settings.customReminderText) {
    customTimer = setInterval(() => {
      const d = new Date();
      const hhmm = `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
      if (hhmm === settings.customReminderTime && d.getSeconds() < 30) {
        send('reminder', { type: 'custom', text: settings.customReminderText });
      }
    }, 30000);
  }
}

// ---------- pomodoro ----------
const pomo = { running: false, phase: 'focus', endsAt: 0, tick: null };

function pomodoroStart() {
  pomo.running = true;
  pomo.phase = 'focus';
  pomo.endsAt = Date.now() + settings.pomodoroFocusMin * 60000;
  clearInterval(pomo.tick);
  pomo.tick = setInterval(() => {
    const remaining = Math.max(0, pomo.endsAt - Date.now());
    if (remaining === 0) {
      pomo.phase = pomo.phase === 'focus' ? 'break' : 'focus';
      const mins = pomo.phase === 'focus' ? settings.pomodoroFocusMin : settings.pomodoroBreakMin;
      pomo.endsAt = Date.now() + mins * 60000;
      send('pomodoro-phase', { phase: pomo.phase });
    }
    send('pomodoro', { running: true, phase: pomo.phase, remaining: Math.max(0, pomo.endsAt - Date.now()) });
  }, 1000);
  buildTray();
}
function pomodoroStop() {
  pomo.running = false;
  clearInterval(pomo.tick);
  send('pomodoro', { running: false });
  buildTray();
}

// ---------- AI agent hook server (Claude Code / any CLI) ----------
// POST http://127.0.0.1:<port>/agent  {"state":"thinking"|"done"|"waiting"}
let agentServer = null;
function startAgentServer() {
  agentServer = http.createServer((req, res) => {
    if (req.method === 'POST' && req.url === '/agent') {
      let body = '';
      req.on('data', c => { body += c; if (body.length > 4096) req.destroy(); });
      req.on('end', () => {
        try {
          const { state } = JSON.parse(body || '{}');
          if (['thinking', 'done', 'waiting', 'idle'].includes(state)) {
            send('agent', { state });
            res.writeHead(200); res.end('ok'); return;
          }
        } catch (_) { /* fallthrough */ }
        res.writeHead(400); res.end('bad request');
      });
    } else {
      res.writeHead(404); res.end();
    }
  });
  agentServer.on('error', () => { /* port taken — feature off */ });
  agentServer.listen(settings.agentPort, '127.0.0.1');
}

// ---------- tray ----------
function buildTray() {
  const icon = nativeImage.createFromPath(path.join(__dirname, 'assets', 'tray.png'));
  if (!tray) tray = new Tray(icon.isEmpty() ? nativeImage.createEmpty() : icon.resize({ width: 16, height: 16 }));
  const menu = Menu.buildFromTemplate([
    { label: 'Kuro', enabled: false },
    { type: 'separator' },
    pomo.running
      ? { label: `Stop Pomodoro (${pomo.phase})`, click: pomodoroStop }
      : { label: `Start Pomodoro (${settings.pomodoroFocusMin}/${settings.pomodoroBreakMin})`, click: pomodoroStart },
    { label: 'Stretch now', click: () => send('reminder', { type: 'stretch' }) },
    { label: 'Water break now', click: () => send('reminder', { type: 'water' }) },
    { type: 'separator' },
    { label: 'Peek mode', type: 'checkbox', checked: settings.peekMode, click: (m) => { settings.peekMode = m.checked; saveSettings(); send('settings', settings); } },
    { label: 'Sounds', type: 'checkbox', checked: settings.sounds, click: (m) => { settings.sounds = m.checked; saveSettings(); send('settings', settings); } },
    { label: keyboardAvailable ? 'Global keyboard: on' : 'Global keyboard: unavailable', enabled: false },
    { type: 'separator' },
    { label: 'Settings…', click: openSettingsWindow },
    { label: 'Quit', click: () => app.quit() }
  ]);
  tray.setToolTip('Kuro — your desktop cat');
  tray.setContextMenu(menu);
}

// ---------- lifecycle ----------
app.whenReady().then(() => {
  loadSettings();
  createCatWindow();
  buildTray();
  startCursorPolling();
  startKeyboardHook();
  scheduleReminders();
  startAgentServer();
});

app.on('window-all-closed', (e) => {
  // Keep running in tray; quit only from tray menu.
  e.preventDefault?.();
});
app.on('before-quit', () => {
  clearInterval(cursorTimer);
  try { require('uiohook-napi').uIOhook.stop(); } catch (_) {}
  if (agentServer) agentServer.close();
});
