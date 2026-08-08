/* Kuro — shared cat drawing (browser canvas).
   Ported from renderer/catdraw.js for the marketing site. */

export type CatGaze = { x: number; y: number };

export type CatState = {
  face?: "open" | "closed" | "sleep" | "wide";
  gaze?: CatGaze;
  showKeys?: boolean;
  pawPhase?: number;
  tailSway?: number;
  pattern?: string;
  blush?: boolean;
  heat?: number;
  growY?: number;
  growX?: number;
  hop?: number;
  offsetX?: number;
  scale?: number;
};

export type CatSettings = {
  baseColor: string;
  patternColor: string;
  bellyColor: string;
  pattern?: string;
  scale?: number;
};

// ---- grid ----
const GW = 46, GH = 44;
const CX = 23;

// role ids
const T = 0, BODY = 1, PAT = 2, BELLY = 3, OUT = 4,
      KTOP = 5, KFACE = 6, KSIDE = 7, EAR = 8, PAW = 9,
      EW = 10, ED = 11, NOSE = 12, MOUTH = 13, WHISK = 14, BLUSH = 15, GLINT = 16;

// ---- color utils ----
function shade(hex: string, f: number) {
  const n = parseInt(hex.slice(1), 16);
  let r = (n >> 16) & 255, g = (n >> 8) & 255, b = n & 255;
  r = Math.min(255, Math.round(r * f)); g = Math.min(255, Math.round(g * f)); b = Math.min(255, Math.round(b * f));
  return `rgb(${r},${g},${b})`;
}
function mix(a: string, b: string, t: number) {
  const pa = parseInt(a.slice(1), 16), pb = parseInt(b.slice(1), 16);
  const r = Math.round(((pa >> 16) & 255) * (1 - t) + ((pb >> 16) & 255) * t);
  const g = Math.round(((pa >> 8) & 255) * (1 - t) + ((pb >> 8) & 255) * t);
  const bl = Math.round((pa & 255) * (1 - t) + (pb & 255) * t);
  return `rgb(${r},${g},${bl})`;
}

// ---- grid raster helpers ----
function makeGrid(): Int8Array { return new Int8Array(GW * GH); }
function set(g: Int8Array, x: number, y: number, role: number) { if (x >= 0 && x < GW && y >= 0 && y < GH) g[y * GW + x] = role; }
function get(g: Int8Array, x: number, y: number) { return (x < 0 || x >= GW || y < 0 || y >= GH) ? -1 : g[y * GW + x]; }
function disc(g: Int8Array, cx: number, cy: number, r: number, role: number) {
  const r2 = r * r;
  for (let y = Math.floor(cy - r); y <= Math.ceil(cy + r); y++)
    for (let x = Math.floor(cx - r); x <= Math.ceil(cx + r); x++) {
      const dx = x + 0.5 - cx, dy = y + 0.5 - cy;
      if (dx * dx + dy * dy <= r2) set(g, x, y, role);
    }
}
function ellipse(g: Int8Array, cx: number, cy: number, rx: number, ry: number, role: number) {
  for (let y = Math.floor(cy - ry); y <= Math.ceil(cy + ry); y++)
    for (let x = Math.floor(cx - rx); x <= Math.ceil(cx + rx); x++) {
      const dx = (x + 0.5 - cx) / rx, dy = (y + 0.5 - cy) / ry;
      if (dx * dx + dy * dy <= 1) set(g, x, y, role);
    }
}
function rect(g: Int8Array, x0: number, y0: number, w: number, h: number, role: number) {
  for (let y = Math.round(y0); y < Math.round(y0 + h); y++)
    for (let x = Math.round(x0); x < Math.round(x0 + w); x++) set(g, x, y, role);
}
function tri(g: Int8Array, ax: number, ay: number, bx: number, by: number, cx: number, cy: number, role: number) {
  const minx = Math.floor(Math.min(ax, bx, cx)), maxx = Math.ceil(Math.max(ax, bx, cx));
  const miny = Math.floor(Math.min(ay, by, cy)), maxy = Math.ceil(Math.max(ay, by, cy));
  const d = (by - cy) * (ax - cx) + (cx - bx) * (ay - cy) || 1e-6;
  for (let y = miny; y <= maxy; y++)
    for (let x = minx; x <= maxx; x++) {
      const px = x + 0.5, py = y + 0.5;
      const a = ((by - cy) * (px - cx) + (cx - bx) * (py - cy)) / d;
      const b = ((cy - ay) * (px - cx) + (ax - cx) * (py - cy)) / d;
      const c = 1 - a - b;
      if (a >= 0 && b >= 0 && c >= 0) set(g, x, y, role);
    }
}

// ---- pattern ----
function applyPattern(g: Int8Array, pattern: string) {
  if (pattern === 'solid') return;
  for (let y = 0; y < GH; y++) for (let x = 0; x < GW; x++) {
    if (g[y * GW + x] !== BODY) continue;
    const nx = (x - CX) / 13, ny = (y - 20) / 20;
    if (pattern === 'tabby') {
      if (y < 20 && ((x + (y >> 2)) % 5) < 2) g[y * GW + x] = PAT;
      else if (y >= 24 && y < 34 && ((x + 2) % 6) < 2) g[y * GW + x] = PAT;
    } else if (pattern === 'siamese') {
      if (Math.abs(nx) > 0.72 || y < 6 || y > 34) g[y * GW + x] = PAT;
    } else if (pattern === 'calico') {
      const patches = [[16, 12, 4], [30, 10, 3.4], [28, 30, 4], [15, 30, 3]];
      for (let i = 0; i < patches.length; i++) {
        const p = patches[i];
        const wob = Math.sin((x * 12.9 + y * 7.3 + i * 40) * 1.3) * 0.9;
        if (Math.hypot(x - p[0], y - p[1]) <= p[2] + wob) { g[y * GW + x] = (i % 2 ? PAT : BELLY); break; }
      }
    }
  }
}

// ---- build the cat into a role grid ----
function build(state: CatState) {
  const g = makeGrid();
  const pawPhase = state.pawPhase || 0;
  const showKeys = !!state.showKeys;
  const tailSway = state.tailSway || 0;

  // tail (behind body) — curls up-right then hooks
  const tail = [
    [30, 33, 3.7], [33, 32, 3.5], [36, 30, 3.2], [38.5, 27, 2.9],
    [40, 23.5, 2.6], [40.2, 20, 2.4], [39, 17, 2.2], [37, 15, 2.05], [34.8, 14.7, 1.85]
  ];
  for (let i = 0; i < tail.length; i++) {
    const t = tail[i];
    disc(g, t[0] + tailSway * (i / tail.length) * 2.2, t[1], t[2], BODY);
  }

  // body (sitting pear)
  ellipse(g, CX, 28.5, 12.5, 10.5, BODY);
  ellipse(g, CX, 33, 11.5, 8, BODY); // fuller bottom

  // head (big, in front of body)
  disc(g, CX, 15, 11.6, BODY);

  // ears (pointed, with a clear notch between them)
  tri(g, 13, 1.2, 9, 10.2, 17.5, 9, BODY);
  tri(g, 33, 1.2, 37, 10.2, 28.5, 9, BODY);

  applyPattern(g, state.pattern || 'solid');

  // tuxedo bib + white paws
  if (state.pattern === 'tuxedo') {
    ellipse(g, CX, 22.5, 5.5, 7.5, BELLY);
  }

  // inner ears (pink) — inside the black
  tri(g, 12.9, 4.8, 11, 9.2, 16, 8.2, EAR);
  tri(g, 33.1, 4.8, 30, 8.2, 35, 9.2, EAR);

  // keyboard keys (in front, bottom) — only while typing/kneading/overheat
  if (showKeys) {
    drawKey(g, 16, 34);
    drawKey(g, 30, 34);
  }

  // front arms + paws
  const liftL = showKeys ? (Math.sin(pawPhase) > 0 ? 2.2 : 0) : 0;
  const liftR = showKeys ? (Math.sin(pawPhase + Math.PI) > 0 ? 2.2 : 0) : 0;
  const pawRole = (state.pattern === 'tuxedo' || state.pattern === 'siamese') ? BELLY : PAW;
  if (showKeys) {
    // reaching down onto the keys
    arm(g, 18, 27, 16, 33 - liftL);
    arm(g, 28, 27, 30, 33 - liftR);
    paw(g, 16, 32.5 - liftL, pawRole);
    paw(g, 30, 32.5 - liftR, pawRole);
  } else {
    // resting in front
    arm(g, 19, 30, 19.5, 35.5);
    arm(g, 27, 30, 26.5, 35.5);
    paw(g, 19.5, 36, pawRole);
    paw(g, 26.5, 36, pawRole);
  }

  outline(g);
  face(g, state);
  return g;
}

function drawKey(g: Int8Array, cx: number, topY: number) {
  const x0 = cx - 4, w = 8, h = 6;
  rect(g, x0, topY, w, h, KSIDE);        // dark base = border/shadow
  rect(g, x0, topY, w - 1, h - 1, KFACE); // mid face
  rect(g, x0, topY, w - 1, 3, KTOP);      // light top
}
function arm(g: Int8Array, x0: number, y0: number, x1: number, y1: number) {
  const n = 6;
  for (let i = 0; i <= n; i++) {
    const t = i / n;
    disc(g, x0 + (x1 - x0) * t, y0 + (y1 - y0) * t, 2.1, BODY);
  }
}
function paw(g: Int8Array, cx: number, cy: number, role: number) {
  ellipse(g, cx, cy, 2.7, 2.0, role);
}

// outline the cat silhouette (not the keys)
function outline(g: Int8Array) {
  const cat = new Set([BODY, PAT, BELLY, PAW, EAR]);
  const copy = Int8Array.from(g);
  for (let y = 0; y < GH; y++) for (let x = 0; x < GW; x++) {
    const v = copy[y * GW + x];
    if (!cat.has(v)) continue;
    const edge =
      !cat.has(get(copy, x - 1, y)) || !cat.has(get(copy, x + 1, y)) ||
      !cat.has(get(copy, x, y - 1)) || !cat.has(get(copy, x, y + 1));
    // don't outline where a key sits directly under a paw seam? keep simple:
    if (edge) g[y * GW + x] = OUT;
  }
}

// ---- face (drawn into grid so it stays crisp) ----
function face(g: Int8Array, state: CatState) {
  const gaze = state.gaze || { x: 0, y: 0 };
  const f = state.face || 'open';
  const eyeY = 13.4;
  const eyes = [18.4, 27.6];
  const ox = Math.max(-1, Math.min(1, gaze.x)) * 1.4;
  const oy = Math.max(-0.6, Math.min(1, gaze.y)) * 1.1;

  for (const ex of eyes) {
    if (f === 'closed' || f === 'sleep') {
      // gentle arc  ‿
      rect(g, ex - 1.6, eyeY + 0.4, 3.2, 0.9, MOUTH);
    } else if (f === 'wide') {
      disc(g, ex, eyeY, 3.4, EW);
      disc(g, ex, eyeY, 2.1, ED);
      disc(g, ex - 0.6, eyeY - 0.6, 0.7, GLINT);
    } else {
      disc(g, ex, eyeY, 3.2, EW);
      disc(g, ex + ox, eyeY + oy, 1.7, ED);
      disc(g, ex + ox - 0.5, eyeY + oy - 0.6, 0.6, GLINT);
    }
  }

  // nose + mouth
  disc(g, CX, 17.4, 1.0, NOSE);
  if (f === 'open') {
    disc(g, CX, 19.3, 1.3, MOUTH); // little meow "o"
  } else {
    set(g, CX - 2, 19, MOUTH); set(g, CX - 1, 19.4, MOUTH);
    set(g, CX + 1, 19, MOUTH); set(g, CX + 0, 19.4, MOUTH);
    set(g, CX, 19.7, MOUTH);
  }

  // whiskers — three thin 1px lines each side, angled down/out
  const wsL = [[10.5, 15.6], [10, 17.2], [10.5, 18.8]];
  for (let i = 0; i < wsL.length; i++) {
    const [x, y] = wsL[i];
    for (let k = 0; k < 5; k++) set(g, x - k, y + (k * 0.35 | 0), WHISK);          // left
    for (let k = 0; k < 5; k++) set(g, (2 * CX - x) + k, y + (k * 0.35 | 0), WHISK); // right
  }

  // blush
  if (state.blush) {
    ellipse(g, 15.5, 17.5, 1.8, 1.0, BLUSH);
    ellipse(g, 30.5, 17.5, 1.8, 1.0, BLUSH);
  }
}

// ---- paint grid → canvas ----
function palette(settings: CatSettings, heat: number): Record<number, string> {
  const base = heat > 0 ? mix(settings.baseColor, '#e8433f', heat * 0.6) : settings.baseColor;
  const pat = heat > 0 ? mix(settings.patternColor, '#a3241f', heat * 0.55) : settings.patternColor;
  return {
    [BODY]: base,
    [PAT]: pat,
    [BELLY]: settings.bellyColor,
    [OUT]: shade(settings.baseColor, 0.42),
    [KTOP]: '#eae6df',
    [KFACE]: '#c6c1b8',
    [KSIDE]: '#7d786f',
    [EAR]: '#e88d9a',
    [PAW]: shade(settings.baseColor, 1.14),
    [EW]: '#ffffff',
    [ED]: '#20242b',
    [NOSE]: '#e88d9a',
    [MOUTH]: '#20242b',
    [WHISK]: 'rgba(70,55,45,0.7)',
    [BLUSH]: 'rgba(242,140,150,0.85)',
    [GLINT]: '#ffffff'
  };
}

// main entry
function draw(
  ctx: CanvasRenderingContext2D,
  view: { W: number; H: number },
  state: CatState,
  settings: CatSettings
) {
  const scale = settings.scale || 1;
  const u = Math.max(3, Math.round(6 * scale));
  const grow = state.growY || 1;
  const growX = state.growX || 1;

  const g = build(state);
  const pal = palette(settings, state.heat || 0);

  const bw = GW * u, bh = GH * u;
  const baseX = Math.round((view.W - bw) / 2) + Math.round(state.offsetX || 0);
  const baseY = view.H - bh - 6 - Math.round(state.hop || 0);

  // scale about bottom-center
  const cxpx = baseX + bw / 2, cypx = baseY + bh;
  const sx = growX, sy = grow;
  const cw = u * sx, ch = u * sy;

  for (let y = 0; y < GH; y++) for (let x = 0; x < GW; x++) {
    const role = g[y * GW + x];
    if (role === T) continue;
    ctx.fillStyle = pal[role];
    const gx = baseX + x * u, gy = baseY + y * u;
    const px = cxpx + (gx - cxpx) * sx;
    const py = cypx + (gy - cypx) * sy;
    ctx.fillRect(Math.round(px), Math.round(py), Math.ceil(cw) + 1, Math.ceil(ch) + 1);
  }
  return { baseX, baseY, u, bw, bh };
}


export const CatDraw = { draw, GW, GH };
export default CatDraw;
