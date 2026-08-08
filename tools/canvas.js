'use strict';
// Just enough of a 2D context to run the cat's drawing code headlessly.

function parseColor(s) {
  if (Array.isArray(s)) return s;
  s = String(s).trim();
  if (s[0] === '#') {
    if (s.length === 4) {
      const r = parseInt(s[1] + s[1], 16), g = parseInt(s[2] + s[2], 16), b = parseInt(s[3] + s[3], 16);
      return [r, g, b, 255];
    }
    const n = parseInt(s.slice(1), 16);
    return [(n >> 16) & 255, (n >> 8) & 255, n & 255, 255];
  }
  let m = s.match(/rgba?\(([^)]+)\)/);
  if (m) {
    const p = m[1].split(',').map(x => parseFloat(x));
    return [p[0] | 0, p[1] | 0, p[2] | 0, p[3] === undefined ? 255 : Math.round(p[3] * 255)];
  }
  return [0, 0, 0, 255];
}

class Ctx {
  constructor(w, h) {
    this.width = w; this.height = h;
    this.buf = Buffer.alloc(w * h * 4, 0);
    this.fillStyle = '#000';
    this.globalAlpha = 1;
    this.font = '';
    this._stack = [];
    this._tx = 0; this._ty = 0; this._sx = 1; this._sy = 1;
  }
  save() { this._stack.push([this._tx, this._ty, this._sx, this._sy]); }
  restore() { const s = this._stack.pop(); if (s) [this._tx, this._ty, this._sx, this._sy] = s; }
  translate(x, y) { this._tx += x * this._sx; this._ty += y * this._sy; }
  scale(x, y) { this._sx *= x; this._sy *= y; }
  _blend(px, py, col) {
    if (px < 0 || py < 0 || px >= this.width || py >= this.height) return;
    const a = col[3] / 255 * this.globalAlpha;
    if (a <= 0) return;
    const i = (py * this.width + px) * 4;
    const ia = 1 - a;
    this.buf[i] = Math.round(col[0] * a + this.buf[i] * ia);
    this.buf[i + 1] = Math.round(col[1] * a + this.buf[i + 1] * ia);
    this.buf[i + 2] = Math.round(col[2] * a + this.buf[i + 2] * ia);
    this.buf[i + 3] = Math.min(255, Math.round(col[3] * a + this.buf[i + 3] * ia));
  }
  fillRect(x, y, w, h) {
    const X = this._tx + x * this._sx, Y = this._ty + y * this._sy;
    const Wd = w * this._sx, Hd = h * this._sy;
    const col = parseColor(this.fillStyle);
    const x0 = Math.round(X), y0 = Math.round(Y);
    const x1 = Math.round(X + Wd), y1 = Math.round(Y + Hd);
    for (let py = y0; py < y1; py++)
      for (let px = x0; px < x1; px++) this._blend(px, py, col);
  }
  clearRect(x, y, w, h) {
    const X = Math.round(this._tx + x * this._sx), Y = Math.round(this._ty + y * this._sy);
    const Wd = Math.round(w * this._sx), Hd = Math.round(h * this._sy);
    for (let py = Y; py < Y + Hd; py++)
      for (let px = X; px < X + Wd; px++) {
        if (px < 0 || py < 0 || px >= this.width || py >= this.height) continue;
        const i = (py * this.width + px) * 4;
        this.buf[i] = this.buf[i + 1] = this.buf[i + 2] = this.buf[i + 3] = 0;
      }
  }
  // text is unused for body preview
  fillText() {}
  measureText() { return { width: 0 }; }
}
module.exports = { Ctx };
