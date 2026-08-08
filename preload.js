'use strict';
const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('kuro', {
  // events from main
  onCursor: (cb) => ipcRenderer.on('cursor', (_e, d) => cb(d)),
  onKey: (cb) => ipcRenderer.on('key', (_e, d) => cb(d)),
  onSettings: (cb) => ipcRenderer.on('settings', (_e, d) => cb(d)),
  onReminder: (cb) => ipcRenderer.on('reminder', (_e, d) => cb(d)),
  onPomodoro: (cb) => ipcRenderer.on('pomodoro', (_e, d) => cb(d)),
  onPomodoroPhase: (cb) => ipcRenderer.on('pomodoro-phase', (_e, d) => cb(d)),
  onAgent: (cb) => ipcRenderer.on('agent', (_e, d) => cb(d)),
  // actions to main
  setClickable: (v) => ipcRenderer.send('set-clickable', v),
  dragStart: () => ipcRenderer.send('drag-start'),
  dragEnd: () => ipcRenderer.send('drag-end'),
  openSettings: () => ipcRenderer.send('open-settings'),
  getSettings: () => ipcRenderer.invoke('get-settings'),
  saveSettings: (s) => ipcRenderer.send('save-settings', s)
});
