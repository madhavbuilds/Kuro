// Kuro renderer glue — behavior, input, effects. Drawing lives in catdraw.js.
'use strict';

const cvs = document.getElementById('cat');
const ctx = cvs.getContext('2d');
const W = cvs.width, H = cvs.height;

let S = {
  name: '', baseColor: '#2d2a30', patternColor: '#4c4753', bellyColor: '#efe9e0',
  pattern: 'solid', scale: 1.0, sounds: true, fixedMessage: '', peekMode: false
};

const cat = {
  mode: 'idle', modeUntil: 0,
  gaze: { x: 0, y: 0.2 },
  blinkUntil: 0, nextBlink: performance.now() + 2500,
  kneadPhase: 0, keyTimes: [], petMeter: 0,
  lastCursorMove: performance.now(), lastKey: 0,
  stretchT: 0, squishY: 0, wobble: 0,
  dragging: false, peekOffset: 0, hop: 0
};

let bubble = null;
let pomo = { running: false, phase: 'focus', remaining: 0 };
const particles = [];
let cursor = { x: -999, y: -999, sx: 0, sy: 0, speed: 0 };
let prevWinCursor = { x: -999, y: -999 };
let lastBounds = null;

function catBounds() {
  return lastBounds || { baseX: (W - 276) / 2, baseY: H - 264 - 6, bw: 276, bh: 264, u: 6 };
}

function heatLevel(now) {
  cat.keyTimes = cat.keyTimes.filter(t => now - t < 2500);
  const kps = cat.keyTimes.length / 2.5;
  return Math.max(0, Math.min(1, (kps - 5) / 5));
}
function setMode(mode, ms) { cat.mode = mode; cat.modeUntil = performance.now() + (ms || 0); }
function say(text, ms = 5000) { bubble = { text, until: performance.now() + ms }; }
function nameOr(you) { return S.name ? S.name : you; }

function updateBehavior(now) {
  const b = catBounds();
  const headX = b.baseX + b.bw / 2;
  const headY = b.baseY + 15 * b.u;
  const dx = cursor.x - headX, dy = cursor.y - headY;
  const d = Math.hypot(dx, dy) || 1;
  cat.gaze.x = dx / d; cat.gaze.y = dy / d;

  if (now > cat.nextBlink) { cat.blinkUntil = now + 120; cat.nextBlink = now + 1800 + Math.random() * 3500; }

  if (Math.abs(cursor.x - prevWinCursor.x) + Math.abs(cursor.y - prevWinCursor.y) > 1) {
    cat.lastCursorMove = now;
    if (cat.mode === 'sleep') { setMode('idle'); say('mrrp?', 1500); }
  }
  prevWinCursor = { x: cursor.x, y: cursor.y };

  if (cat.modeUntil && now > cat.modeUntil && !['idle', 'sleep'].includes(cat.mode)) {
    if (cat.mode === 'stretchBig') cat.stretchT = 0;
    setMode('idle');
  }

  const heat = heatLevel(now);
  const typedRecently = now - cat.lastKey < 900;
  if (cat.dragging) {
    setMode('drag', 200);
  } else if (heat >= 1 && typedRecently) {
    if (cat.mode !== 'overheat') say('(too fast!!)', 1800);
    setMode('overheat', 900);
  } else if (typedRecently && ['idle', 'knead', 'hunt'].includes(cat.mode)) {
    setMode('knead', 900);
  }

  const nearCat = cursor.x > b.baseX - 80 && cursor.x < b.baseX + b.bw + 80 &&
                  cursor.y > b.baseY - 80 && cursor.y < b.baseY + b.bh + 80;
  if (cursor.speed > 1400 && nearCat && ['idle', 'knead'].includes(cat.mode)) setMode('hunt', 1200);

  const overHead = cursor.x > b.baseX + b.bw * 0.25 && cursor.x < b.baseX + b.bw * 0.75 &&
                   cursor.y > b.baseY && cursor.y < b.baseY + b.bh * 0.5;
  if (overHead && cursor.speed > 5 && cursor.speed < 500 && !cat.dragging) {
    cat.petMeter = Math.min(1, cat.petMeter + 0.02);
    if (cat.petMeter > 0.25) {
      setMode('pet', 400);
      if (Math.random() < 0.12) spawn('heart', cursor.x, cursor.y - 8);
      if (cat.petMeter > 0.9 && Math.random() < 0.05) { say('purrrr…', 1500); meow('purr'); }
    }
  } else {
    cat.petMeter = Math.max(0, cat.petMeter - 0.01);
  }

  if (now - cat.lastCursorMove > 90000 && now - cat.lastKey > 90000 && cat.mode === 'idle') setMode('sleep');
  if (cat.mode === 'sleep' && Math.random() < 0.02) spawn('zzz', b.baseX + b.bw * 0.72, b.baseY + 4);
  if (cat.mode === 'overheat' && Math.random() < 0.35) spawn('steam', b.baseX + b.bw * (0.3 + Math.random() * 0.4), b.baseY);

  if (cat.mode === 'knead' || cat.mode === 'overheat') cat.kneadPhase += 0.35 * (cat.mode === 'overheat' ? 1.8 : 1);
  if (cat.mode === 'stretchBig') cat.stretchT = Math.min(1, cat.stretchT + 0.008);

  cat.squishY += ((cat.dragging ? Math.min(0.5, cursor.speed / 3000) : 0) - cat.squishY) * 0.15;
  cat.wobble *= 0.90;
  if (cat.dragging) cat.wobble += (Math.random() - 0.5) * Math.min(1.2, cursor.speed / 1500);
  cat.hop = Math.max(0, cat.hop - 2.2);

  const targetPeek = S.peekMode && !bubble && !pomo.running ? W * 0.42 : 0;
  cat.peekOffset += (targetPeek - cat.peekOffset) * 0.06;
}

function buildState(now) {
  const heat = heatLevel(now);
  let face = 'open';
  if (cat.mode === 'sleep') face = 'sleep';
  else if (cat.mode === 'pet' && cat.petMeter > 0.4) face = 'closed';
  else if (now < cat.blinkUntil) face = 'closed';
  else if (cat.mode === 'hunt' || cat.mode === 'agentDone') face = 'wide';

  const typing = cat.mode === 'knead' || cat.mode === 'overheat';
  let growY = 1, growX = 1;
  if (cat.mode === 'stretchBig') growY = 1 + 0.35 * Math.sin(Math.min(1, cat.stretchT) * Math.PI);
  if (cat.dragging || cat.mode === 'drag') { growY = 1 + cat.squishY; growX = 1 - cat.squishY * 0.4; }

  return {
    face, gaze: cat.gaze,
    showKeys: typing, pawPhase: cat.kneadPhase, heat,
    tailSway: Math.sin(now / 420) * (cat.mode === 'hunt' ? 1 : 0.5) + (cat.wobble || 0) * 0.3,
    growY, growX, hop: cat.hop, offsetX: cat.peekOffset,
    blush: (cat.mode === 'pet' && cat.petMeter > 0.3) || heat > 0.4,
    pattern: S.pattern
  };
}

function roundedPixelRect(x, y, w, h, fill, stroke) {
  ctx.fillStyle = stroke; ctx.fillRect(x + 2, y, w - 4, h); ctx.fillRect(x, y + 2, w, h - 4);
  ctx.fillStyle = fill; ctx.fillRect(x + 3, y + 1, w - 6, h - 2); ctx.fillRect(x + 1, y + 3, w - 2, h - 6);
}
function drawBubble(now) {
  let text = null;
  if (bubble && now < bubble.until) text = bubble.text;
  else { bubble = null; if (S.fixedMessage) text = '\u{1F4CC} ' + S.fixedMessage; }
  if (!text) return;
  ctx.font = '12px "Courier New", monospace';
  const tw = Math.min(W - 20, ctx.measureText(text).width + 18);
  const x = Math.round((W - tw) / 2), y = 20, h = 26;
  roundedPixelRect(x, y, tw, h, '#fffdf5', '#20242b');
  ctx.fillStyle = '#20242b'; ctx.fillRect(W / 2 - 3, y + h, 6, 4);
  ctx.fillStyle = '#fffdf5'; ctx.fillRect(W / 2 - 2, y + h - 1, 4, 3);
  ctx.fillStyle = '#20242b'; ctx.fillText(text, x + 9, y + 17, tw - 16);
}
function drawPomodoro() {
  if (!pomo.running) return;
  const mm = String(Math.floor(pomo.remaining / 60000)).padStart(2, '0');
  const ss = String(Math.floor(pomo.remaining % 60000 / 1000)).padStart(2, '0');
  const label = (pomo.phase === 'focus' ? '\u25CF ' : '\u2615 ') + mm + ':' + ss;
  ctx.font = 'bold 12px "Courier New", monospace';
  const tw = ctx.measureText(label).width + 16;
  const x = W - tw - 6, y = H - 34;
  roundedPixelRect(x, y, tw, 22, pomo.phase === 'focus' ? '#ffe9d6' : '#dff2e4', '#20242b');
  ctx.fillStyle = '#20242b'; ctx.fillText(label, x + 8, y + 15);
}

function spawn(kind, x, y) {
  particles.push({ kind, x, y, vx: (Math.random() - 0.5) * 14, vy: -22 - Math.random() * 18, life: 1 });
}
function drawParticles(dt) {
  for (let i = particles.length - 1; i >= 0; i--) {
    const p = particles[i];
    p.x += p.vx * dt; p.y += p.vy * dt; p.life -= dt * 0.6;
    if (p.kind === 'steam') { p.vx = Math.sin(p.y / 8) * 16; p.vy = -34; }
    if (p.life <= 0) { particles.splice(i, 1); continue; }
    ctx.globalAlpha = Math.max(0, p.life);
    ctx.font = '14px "Courier New", monospace';
    const glyph = { heart: '\u2665', steam: '\u301C', zzz: 'z', drop: '\u{1F4A7}', spark: '\u2726' }[p.kind];
    ctx.fillStyle = { heart: '#e8607a', steam: '#b9c4cc', zzz: '#7d8aa0', drop: '#5aa7e0', spark: '#f2c14e' }[p.kind];
    ctx.fillText(glyph, p.x, p.y); ctx.globalAlpha = 1;
  }
}

let audioCtx = null;
function meow(kind) {
  if (!S.sounds) return;
  try {
    audioCtx = audioCtx || new AudioContext();
    const t0 = audioCtx.currentTime;
    const osc = audioCtx.createOscillator(), gain = audioCtx.createGain();
    osc.type = 'triangle';
    if (kind === 'purr') {
      osc.frequency.setValueAtTime(70, t0);
      gain.gain.setValueAtTime(0.05, t0); gain.gain.linearRampToValueAtTime(0, t0 + 0.5); osc.stop(t0 + 0.5);
    } else {
      osc.frequency.setValueAtTime(620, t0);
      osc.frequency.exponentialRampToValueAtTime(880, t0 + 0.12);
      osc.frequency.exponentialRampToValueAtTime(430, t0 + 0.4);
      gain.gain.setValueAtTime(0.0001, t0);
      gain.gain.exponentialRampToValueAtTime(0.12, t0 + 0.05);
      gain.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.45); osc.stop(t0 + 0.5);
    }
    osc.connect(gain).connect(audioCtx.destination); osc.start(t0);
  } catch (_) {}
}

window.kuro.onCursor((d) => { cursor = d; });
window.kuro.onKey(() => { const now = performance.now(); cat.lastKey = now; cat.keyTimes.push(now); });
window.kuro.onSettings((s) => { S = { ...S, ...s }; });
window.kuro.onReminder((r) => {
  const n = nameOr('you');
  if (r.type === 'stretch') { setMode('stretchBig', 12000); cat.stretchT = 0; say('Stretch time, ' + n + '! \u{1F43E}', 9000); meow(); }
  else if (r.type === 'water') {
    say((S.name ? S.name + ', d' : 'D') + 'rink some water! \u{1F4A7}', 8000);
    for (let i = 0; i < 4; i++) spawn('drop', W / 2 + (i - 2) * 14, 60); meow();
  } else if (r.type === 'custom') { say((S.name ? S.name + ': ' : '') + r.text, 12000); meow(); }
});
window.kuro.onPomodoro((p) => { pomo = { ...pomo, ...p }; });
window.kuro.onPomodoroPhase((p) => {
  if (p.phase === 'break') { say('Break time' + (S.name ? ', ' + S.name : '') + '! \u2615', 8000); meow(); }
  else { say('Focus! \u25CF', 6000); meow(); }
});
window.kuro.onAgent((a) => {
  if (a.state === 'thinking') { setMode('idle'); say('\u2026thinking', 3000); }
  else if (a.state === 'done') {
    setMode('agentDone', 4000); cat.hop = 26;
    for (let i = 0; i < 6; i++) spawn('spark', W / 2 + (Math.random() - 0.5) * 80, 100);
    say("Agent's done" + (S.name ? ', ' + S.name : '') + '! meow!', 6000); meow();
  } else setMode('idle');
});

let overCat = false;
function hitTest(x, y) {
  const b = catBounds();
  return x > b.baseX - 4 && x < b.baseX + b.bw + 4 && y > b.baseY - 2 && y < b.baseY + b.bh + 6;
}
window.addEventListener('mousemove', (e) => {
  const hit = hitTest(e.clientX, e.clientY);
  if (hit !== overCat) { overCat = hit; window.kuro.setClickable(hit); }
});
window.addEventListener('mousedown', (e) => {
  if (e.button === 0 && hitTest(e.clientX, e.clientY)) { cat.dragging = true; setMode('drag', 60000); window.kuro.dragStart(); }
});
window.addEventListener('mouseup', () => {
  if (cat.dragging) { cat.dragging = false; cat.wobble = 2.2; setMode('idle'); window.kuro.dragEnd(); }
});
window.addEventListener('contextmenu', (e) => { e.preventDefault(); if (hitTest(e.clientX, e.clientY)) window.kuro.openSettings(); });
window.addEventListener('dblclick', (e) => { if (hitTest(e.clientX, e.clientY)) { meow(); say('meow!', 1200); } });

let last = performance.now();
function frame(now) {
  const dt = Math.min(0.1, (now - last) / 1000); last = now;
  ctx.clearRect(0, 0, W, H);
  updateBehavior(now);
  lastBounds = CatDraw.draw(ctx, { W, H }, buildState(now), S);
  drawBubble(now);
  drawPomodoro();
  drawParticles(dt);
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);
