'use strict';
const fs = require('fs');
const path = require('path');
const { Ctx } = require('./canvas');
const { encodePNG } = require('./png');
const CatDraw = require('../renderer/catdraw');

const W = 200, H = 215;

const settings = {
  baseColor: '#2d2a30', patternColor: '#4c4753', bellyColor: '#efe9e0',
  pattern: 'solid', scale: 0.7
};

const poses = [
  { label: 'idle',      state: { face: 'open', gaze: { x: 0, y: 0.2 }, showKeys: false, tailSway: 0.4 } },
  { label: 'typeA',     state: { face: 'open', gaze: { x: 0, y: 0.6 }, showKeys: true, pawPhase: 0.4, tailSway: -0.5 } },
  { label: 'typeB',     state: { face: 'open', gaze: { x: 0, y: 0.6 }, showKeys: true, pawPhase: Math.PI + 0.4 } },
  { label: 'lookL',     state: { face: 'open', gaze: { x: -1, y: -0.2 }, showKeys: false } },
  { label: 'sleep',     state: { face: 'sleep', showKeys: false } },
  { label: 'pet',       state: { face: 'closed', blush: true, showKeys: false } },
  { label: 'wide',      state: { face: 'wide', gaze: { x: 0, y: 0 }, showKeys: false } },
  { label: 'overheat',  state: { face: 'open', showKeys: true, pawPhase: 1.0, heat: 1 } },
  { label: 'stretch',   state: { face: 'closed', showKeys: false, growY: 1.35 } },
  { label: 'mochi',     state: { face: 'wide', showKeys: false, growY: 1.5, growX: 0.7 } },
  { label: 'tabby',     state: { face: 'open', pattern: 'tabby', showKeys: false } , pat: 'tabby', pal: { baseColor: '#e6a15c', patternColor: '#9c5a23' } },
  { label: 'tuxedo',    state: { face: 'open', pattern: 'tuxedo', showKeys: false }, pat: 'tuxedo', pal: { baseColor: '#26242a', bellyColor: '#f6f1e8' } }
];

const bg = [244, 243, 240, 255];
function newCtx() {
  const c = new Ctx(W, H);
  for (let i = 0; i < W * H; i++) { c.buf[i*4]=bg[0]; c.buf[i*4+1]=bg[1]; c.buf[i*4+2]=bg[2]; c.buf[i*4+3]=255; }
  return c;
}

fs.mkdirSync(path.join(__dirname, '..', 'preview'), { recursive: true });
const tiles = [];
for (const p of poses) {
  const c = newCtx();
  const st = { ...p.state };
  if (p.state.pattern) st.pattern = p.state.pattern;
  const s = { ...settings, ...(p.pal || {}), pattern: st.pattern || 'solid' };
  CatDraw.draw(c, { W, H }, st, s);
  const png = encodePNG(W, H, c.buf);
  const f = path.join(__dirname, '..', 'preview', p.label + '.png');
  fs.writeFileSync(f, png);
  tiles.push({ label: p.label, file: f });
}
console.log('rendered', tiles.map(t => t.label).join(', '));
