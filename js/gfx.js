/* =========================================================
   CARDITOPOLI — gfx.js
   Tutta la pixel art è disegnata in codice: niente immagini,
   niente asset di terzi. Risoluzione GBA: 240x160, tile 16x16.
   ========================================================= */
'use strict';

const TS = 16;
const VIEW_W = 240, VIEW_H = 160;

const PAL = {
  ol: '#283038',            // contorno
  g: '#7CC860', gl: '#9CE078', gd: '#58A848', gdd: '#3E8A3A',
  tg: '#3E9A3C', tgd: '#2A7230', tgl: '#62BC4E',
  p: '#E8D498', pl: '#F4E4B0', pd: '#D0B878', pdd: '#B89C5C',
  st: '#DCD4C2', stl: '#ECE6D6', std: '#BEB4A0', stm: '#A69C88',
  as: '#7E808A', asl: '#8E9098', asd: '#6A6C76',
  sw: '#C8C8C0', swd: '#AEAEA6',
  w: '#5AA8F0', wl: '#9CD4FA', wd: '#3E86D0', wdd: '#2E6CB0',
  soil: '#9A6A40', soill: '#B48050', soild: '#7A4E2C',
  leaf: '#3C9840', leafd: '#2A7830', leafl: '#5CB850', leafdd: '#1E5A28',
  trunk: '#8A5A30', trunkd: '#6A4020',
  wood: '#C08850', woodl: '#D8A468', woodd: '#9A6A3A', wooddd: '#74502A',
  wht: '#F8F8F8', blk: '#181820',
  red: '#E04838', redd: '#B03028', redl: '#F07060',
  yel: '#F8D030', yeld: '#D8A820',
  glass: '#88C8F0', glassd: '#5A98D0', glassl: '#C0E8FA',
  night: '#F8D878',
};

/* ---------- helpers ---------- */
function mk(w, h) {
  const c = document.createElement('canvas');
  c.width = w; c.height = h;
  const g = c.getContext('2d');
  g.imageSmoothingEnabled = false;
  c.g = g;
  return c;
}
function R(g, x, y, w, h, col) { g.fillStyle = col; g.fillRect(x, y, w, h); }
function P(g, x, y, col) { g.fillStyle = col; g.fillRect(x, y, 1, 1); }
function srand(seed) {
  return function () {
    seed |= 0; seed = seed + 0x6D2B79F5 | 0;
    let t = Math.imul(seed ^ seed >>> 15, 1 | seed);
    t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
}
function hash2(x, y) { let h = x * 374761393 + y * 668265263; h = (h ^ (h >>> 13)) * 1274126177; return (h ^ (h >>> 16)) >>> 0; }
function ellipse(g, cx, cy, rx, ry, col) {
  g.fillStyle = col;
  for (let y = -ry; y <= ry; y++) {
    const w = Math.round(rx * Math.sqrt(Math.max(0, 1 - (y * y) / (ry * ry))));
    g.fillRect(Math.round(cx - w), Math.round(cy + y), w * 2 + 1, 1);
  }
}
function outline(c, col = PAL.ol) {
  const g = c.g || c.getContext('2d');
  const w = c.width, h = c.height;
  const d = g.getImageData(0, 0, w, h), a = d.data;
  const mark = new Uint8Array(w * h);
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    if (a[(y * w + x) * 4 + 3] !== 0) continue;
    const n = (xx, yy) => xx >= 0 && yy >= 0 && xx < w && yy < h && a[(yy * w + xx) * 4 + 3] > 0;
    if (n(x - 1, y) || n(x + 1, y) || n(x, y - 1) || n(x, y + 1)) mark[y * w + x] = 1;
  }
  g.fillStyle = col;
  for (let i = 0; i < mark.length; i++) if (mark[i]) g.fillRect(i % w, (i / w) | 0, 1, 1);
  return c;
}
function mirror(c) {
  const m = mk(c.width, c.height);
  m.g.translate(c.width, 0); m.g.scale(-1, 1); m.g.drawImage(c, 0, 0);
  return m;
}
function scaleCanvas(c, s) {
  const m = mk(c.width * s, c.height * s);
  m.g.drawImage(c, 0, 0, c.width * s, c.height * s);
  return m;
}
function shade(hex, amt) {
  const n = parseInt(hex.slice(1), 16);
  let r = (n >> 16) & 255, g = (n >> 8) & 255, b = n & 255;
  const f = v => Math.max(0, Math.min(255, Math.round(amt < 0 ? v * (1 + amt) : v + (255 - v) * amt)));
  return '#' + ((1 << 24) + (f(r) << 16) + (f(g) << 8) + f(b)).toString(16).slice(1).toUpperCase();
}

/* ---------- micro font 3x5 per insegne ---------- */
const FONT3 = (() => {
  const src = {
    A: '010101111101101', B: '110101110101110', C: '011100100100011', D: '110101101101110',
    E: '111100110100111', F: '111100110100100', G: '011100101101011', H: '101101111101101',
    I: '111010010010111', J: '001001001101010', K: '101101110101101', L: '100100100100111',
    M: '101111111101101', N: '110101101101101', O: '010101101101010', P: '110101110100100',
    Q: '010101101110011', R: '110101110101101', S: '011100010001110', T: '111010010010010',
    U: '101101101101111', V: '101101101101010', W: '101101111111101', X: '101101010101101',
    Y: '101101010010010', Z: '111001010100111', '0': '111101101101111', '1': '010110010010111',
    '2': '110001010100111', '3': '110001010001110', '4': '101101111001001', '5': '111100110001110',
    '6': '011100111101111', '7': '111001010010010', '8': '111101111101111', '9': '111101111001110',
    '&': '010101010101011', '!': '010010010000010', '.': '000000000000010', '-': '000000111000000',
    '?': '110001010000010', "'": '010010000000000', ' ': '000000000000000',
  };
  return src;
})();
function text3(g, str, x, y, col) {
  str = str.toUpperCase();
  for (const ch of str) {
    const s = FONT3[ch] || FONT3[' '];
    for (let i = 0; i < 15; i++) if (s[i] === '1') P(g, x + (i % 3), y + ((i / 3) | 0), col);
    x += 4;
  }
}
function text3w(str) { return str.length * 4 - 1; }

/* =========================================================
   TILE
   ========================================================= */
const TILES = {};
function tileVariants(n, fn) { const a = []; for (let i = 0; i < n; i++) { const c = mk(TS, TS); fn(c.g, i, srand(1000 + i * 77)); a.push(c); } return a; }

function drawGrass(g, r, flowers) {
  R(g, 0, 0, 16, 16, PAL.g);
  for (let i = 0; i < 3; i++) {
    const x = (r() * 12) | 0, y = 2 + ((r() * 12) | 0);
    P(g, x, y, PAL.gd); P(g, x + 1, y - 1, PAL.gd); P(g, x + 2, y, PAL.gd); P(g, x + 3, y - 1, PAL.gd);
    P(g, x + 1, y, PAL.gl);
  }
  for (let i = 0; i < 4; i++) P(g, (r() * 16) | 0, (r() * 16) | 0, PAL.gl);
}
function buildTiles() {
  TILES['.'] = { v: tileVariants(4, (g, i, r) => drawGrass(g, r)) };
  // fiori animati
  TILES['f'] = {
    anim: 2, speed: 32, v: [0, 1].map(fr => {
      const c = mk(16, 16), g = c.g; drawGrass(g, srand(5));
      const fl = [[3, 3, PAL.red], [11, 4, PAL.yel], [7, 10, PAL.wht], [13, 12, '#F890C0'], [2, 12, PAL.yel]];
      fl.forEach(([x, y, col]) => {
        const o = fr && (x % 2) ? 1 : 0;
        P(g, x + o, y - 1, col); P(g, x - 1 + o, y, col); P(g, x + 1 + o, y, col); P(g, x + o, y + 1, col); P(g, x + o, y, PAL.yel === col ? '#F07020' : PAL.yeld);
        P(g, x, y + 2, PAL.gd);
      });
      return c;
    })
  };
  // erba alta
  const tall = mk(16, 16), top = mk(16, 16);
  (function () {
    const g = tall.g; R(g, 0, 0, 16, 16, PAL.g);
    const blades = (gg, y0) => {
      for (let bx = 0; bx < 16; bx += 4) {
        R(gg, bx, y0 + 2, 4, 6, PAL.tg);
        P(gg, bx, y0 + 1, PAL.tg); P(gg, bx + 1, y0, PAL.tg); P(gg, bx + 2, y0 + 1, PAL.tg); P(gg, bx + 3, y0, PAL.tg);
        P(gg, bx + 1, y0 + 1, PAL.tgl); P(gg, bx + 1, y0 + 2, PAL.tgl); P(gg, bx + 3, y0 + 1, PAL.tgl);
        P(gg, bx + 2, y0 + 5, PAL.tgd); P(gg, bx + 2, y0 + 6, PAL.tgd); P(gg, bx, y0 + 7, PAL.tgd);
      }
    };
    blades(g, 0); blades(g, 8);
    // overlay inferiore (copre i piedi del personaggio)
    top.g.drawImage(tall, 0, 8, 16, 8, 0, 8, 16, 8);
  })();
  TILES['"'] = { v: [tall], top };
  TILES['='] = {
    v: tileVariants(3, (g, i, r) => {
      R(g, 0, 0, 16, 16, PAL.p);
      for (let k = 0; k < 6; k++) P(g, (r() * 16) | 0, (r() * 16) | 0, PAL.pd);
      for (let k = 0; k < 3; k++) { const x = (r() * 14) | 0, y = (r() * 14) | 0; P(g, x, y, PAL.pl); P(g, x + 1, y, PAL.pdd); }
    }), edge: 'grass'
  };
  TILES['#'] = {
    v: tileVariants(4, (g, i, r) => {
      R(g, 0, 0, 16, 16, PAL.std);
      for (let row = 0; row < 2; row++) {
        const off = row ? 4 : 0;
        for (let col = -1; col < 2; col++) {
          const x = col * 8 + off, y = row * 8;
          const tone = r() < 0.3 ? PAL.stl : (r() < 0.2 ? '#D2C8B4' : PAL.st);
          R(g, x + 1, y + 1, 7, 7, tone);
          P(g, x + 1, y + 1, PAL.stl); P(g, x + 7, y + 7, PAL.stm);
        }
      }
    }), edge: 'grass'
  };
  TILES['-'] = { v: tileVariants(3, (g, i, r) => { R(g, 0, 0, 16, 16, PAL.as); for (let k = 0; k < 10; k++) P(g, (r() * 16) | 0, (r() * 16) | 0, r() < .5 ? PAL.asl : PAL.asd); }) };
  TILES[':'] = { v: tileVariants(2, (g, i, r) => { R(g, 0, 0, 16, 16, PAL.as); for (let k = 0; k < 10; k++) P(g, (r() * 16) | 0, (r() * 16) | 0, r() < .5 ? PAL.asl : PAL.asd); R(g, 2, 14, 8, 2, '#F0F0E8'); }) };
  TILES['_'] = { v: [(() => { const c = mk(16, 16), g = c.g; R(g, 0, 0, 16, 16, PAL.sw); R(g, 0, 7, 16, 1, PAL.swd); R(g, 7, 0, 1, 7, PAL.swd); R(g, 15, 8, 1, 8, PAL.swd); R(g, 0, 15, 16, 1, '#9A9A92'); return c; })()] };
  TILES['~'] = {
    anim: 3, speed: 20, v: [0, 1, 2].map(fr => {
      const c = mk(16, 16), g = c.g; R(g, 0, 0, 16, 16, PAL.w);
      for (let k = 0; k < 3; k++) {
        const y = 2 + k * 5, x = ((k * 6 + fr * 2) % 16);
        R(g, x, y, 4, 1, PAL.wl); R(g, (x + 4) % 16, y + 1, 2, 1, PAL.wl); R(g, (x + 9) % 16, y + 2, 3, 1, PAL.wd);
      }
      return c;
    }), edge: 'shore', solid: true
  };
  TILES['S'] = { v: [(() => { const c = mk(16, 16), g = c.g; R(g, 0, 0, 16, 16, PAL.soil); for (let y = 1; y < 16; y += 4) { R(g, 0, y, 16, 1, PAL.soild); R(g, 0, y + 1, 16, 1, PAL.soill); } return c; })()] };
  TILES['c'] = {
    v: tileVariants(2, (g, i, r) => {
      R(g, 0, 0, 16, 16, PAL.soil); R(g, 0, 13, 16, 1, PAL.soild);
      // pianta di carciofo
      const lc = '#6E9C6A', ld = '#4E7A4E';
      R(g, 2, 9, 12, 4, lc); R(g, 1, 10, 2, 2, ld); R(g, 13, 10, 2, 2, ld); P(g, 4, 8, lc); P(g, 11, 8, lc);
      R(g, 7, 4, 2, 6, ld);
      ellipse(g, 8, 4, 3, 3, '#7EA070'); P(g, 7, 2, '#9A6AA8'); P(g, 9, 3, '#9A6AA8'); P(g, 8, 1, '#B080C0'); P(g, 6, 4, '#5E8A58'); P(g, 10, 5, '#5E8A58');
    }), solid: true
  };
  TILES['r'] = {
    v: tileVariants(2, (g, i, r) => {
      R(g, 0, 0, 16, 16, PAL.soil); R(g, 0, 14, 16, 1, PAL.soild);
      for (let k = 0; k < 2; k++) { const x = 2 + k * 7 + i; ellipse(g, x + 2, 8, 3, 3, PAL.leaf); P(g, x + 1, 7, PAL.leafl); R(g, x + 3, 10, 2, 2, PAL.red); P(g, x + 3, 10, PAL.redl); P(g, x, 11, PAL.red); }
    }), solid: true
  };
  TILES['p'] = { v: [0, 1].map(i => { const c = mk(16, 16), gg = c.g; R(gg, 0, 0, 16, 16, i ? '#5AB848' : '#68C454'); for (let k = 0; k < 5; k++) P(gg, (k * 7 + i * 3) % 16, (k * 5) % 16, i ? '#4EA83E' : '#5AB848'); return c; }), stripe: true };
  TILES['F'] = { fence: true, solid: true, v: [mk(16, 16)] };
  TILES['x'] = { v: [(() => { const c = mk(16, 16); R(c.g, 0, 0, 16, 16, '#101018'); return c; })()], solid: true };
  // pavimenti interni
  TILES['w'] = { v: [(() => { const c = mk(16, 16), g = c.g; R(g, 0, 0, 16, 16, PAL.woodl); for (let y = 0; y < 16; y += 4) { R(g, 0, y + 3, 16, 1, PAL.wood); } R(g, 5, 0, 1, 4, PAL.wood); R(g, 12, 4, 1, 4, PAL.wood); R(g, 3, 8, 1, 4, PAL.wood); R(g, 10, 12, 1, 4, PAL.wood); return c; })()] };
  TILES['k'] = { v: [(() => { const c = mk(16, 16), g = c.g; R(g, 0, 0, 16, 16, '#F0F0E8'); R(g, 0, 0, 8, 8, '#2E7A4A'); R(g, 8, 8, 8, 8, '#2E7A4A'); return c; })()] };
  TILES['m'] = { v: [(() => { const c = mk(16, 16), g = c.g; R(g, 0, 0, 16, 16, '#E8E4DC'); R(g, 0, 15, 16, 1, '#C8C4BC'); R(g, 15, 0, 1, 16, '#C8C4BC'); P(g, 4, 5, '#D4D0C8'); P(g, 5, 6, '#D4D0C8'); P(g, 10, 11, '#D4D0C8'); return c; })()] };
  TILES['R'] = { v: [(() => { const c = mk(16, 16), g = c.g; R(g, 0, 0, 16, 16, '#C03838'); R(g, 0, 0, 1, 16, '#E0B040'); R(g, 15, 0, 1, 16, '#E0B040'); return c; })()] };
  TILES['M'] = { v: [(() => { const c = mk(16, 16), g = c.g; R(g, 0, 0, 16, 16, PAL.woodl); R(g, 1, 3, 14, 10, '#B04848'); R(g, 2, 4, 12, 8, '#C85858'); for (let x = 3; x < 13; x += 2) R(g, x, 5, 1, 6, '#B04848'); return c; })()] };
  // muri interni (colore dalla stanza)
  TILES['W'] = { wall: 'top', solid: true, v: [mk(16, 16)] };
  TILES['V'] = { wall: 'base', solid: true, v: [mk(16, 16)] };
}

function drawFence(g, up, down, left, right) {
  const post = (x, y) => { R(g, x, y, 4, 10, PAL.woodl); R(g, x + 3, y, 1, 10, PAL.woodd); R(g, x, y, 4, 1, PAL.wht); };
  if (left) { R(g, 0, 6, 8, 2, PAL.woodl); R(g, 0, 10, 8, 2, PAL.woodl); R(g, 0, 8, 8, 1, PAL.woodd); R(g, 0, 12, 8, 1, PAL.woodd); }
  if (right) { R(g, 8, 6, 8, 2, PAL.woodl); R(g, 8, 10, 8, 2, PAL.woodl); R(g, 8, 8, 8, 1, PAL.woodd); R(g, 8, 12, 8, 1, PAL.woodd); }
  if (up) R(g, 7, 0, 2, 4, PAL.woodl);
  if (down) R(g, 7, 12, 2, 4, PAL.woodl);
  post(6, 3);
}
const _fenceCache = {};
function fenceTile(u, d, l, r) {
  const k = '' + +u + +d + +l + +r;
  if (!_fenceCache[k]) {
    const c = mk(16, 16); drawGrass(c.g, srand(3)); const o = mk(16, 16); drawFence(o.g, u, d, l, r); outline(o); c.g.drawImage(o, 0, 0); _fenceCache[k] = c;
  }
  return _fenceCache[k];
}
function wallTile(kind, col) {
  const k = kind + col;
  if (!_fenceCache[k]) {
    const c = mk(16, 16), g = c.g;
    if (kind === 'top') { R(g, 0, 0, 16, 16, shade(col, -0.12)); R(g, 0, 0, 16, 3, shade(col, -0.35)); R(g, 0, 15, 16, 1, shade(col, 0.15)); for (let x = 0; x < 16; x += 8) R(g, x, 4, 1, 11, shade(col, -0.2)); }
    else { R(g, 0, 0, 16, 16, col); R(g, 0, 12, 16, 4, shade(col, -0.4)); R(g, 0, 12, 16, 1, shade(col, -0.55)); for (let x = 0; x < 16; x += 8) R(g, x, 0, 1, 12, shade(col, -0.08)); }
    _fenceCache[k] = c;
  }
  return _fenceCache[k];
}

/* =========================================================
   ALBERI E OGGETTI
   ========================================================= */
function makeTree(kind = 'oak') {
  const c = mk(32, 32), g = c.g;
  if (kind === 'pine') { // pino marittimo a ombrello
    R(g, 14, 12, 4, 18, PAL.trunk); R(g, 16, 12, 2, 18, PAL.trunkd); P(g, 13, 18, PAL.trunk); R(g, 11, 12, 3, 2, PAL.trunk);
    ellipse(g, 16, 8, 14, 6, PAL.leafd); ellipse(g, 15, 7, 12, 4, PAL.leaf); ellipse(g, 12, 5, 6, 2, PAL.leafl);
    for (let i = 0; i < 6; i++) P(g, 6 + i * 4, 10 + (i % 2), PAL.leafdd);
  } else if (kind === 'olive') {
    R(g, 14, 18, 4, 12, '#8A7A60'); R(g, 16, 18, 2, 12, '#6A5A44'); R(g, 11, 17, 4, 2, '#8A7A60');
    ellipse(g, 16, 12, 12, 9, '#6A8A5A'); ellipse(g, 14, 10, 9, 6, '#84A472'); ellipse(g, 11, 8, 4, 2, '#A0BC8A');
    for (let i = 0; i < 7; i++) P(g, 8 + i * 3, 14 + (i % 3), '#4A6A44');
  } else {
    R(g, 13, 22, 6, 9, PAL.trunk); R(g, 16, 22, 3, 9, PAL.trunkd); P(g, 12, 30, PAL.trunk); P(g, 19, 30, PAL.trunkd);
    ellipse(g, 16, 13, 14, 11, PAL.leafd);
    ellipse(g, 15, 11, 12, 9, PAL.leaf);
    ellipse(g, 11, 8, 6, 4, PAL.leafl);
    ellipse(g, 21, 15, 5, 3, PAL.leafd);
    P(g, 9, 6, '#7CD070'); P(g, 10, 6, '#7CD070'); P(g, 12, 5, '#7CD070');
    for (let i = 0; i < 8; i++) P(g, 5 + i * 3, 19 + (i % 2), PAL.leafdd);
  }
  return outline(c);
}

const PROPS = {};
function prop(name, w, h, fn, noOutline) {
  const c = mk(w, h); fn(c.g, c); if (!noOutline) outline(c); PROPS[name] = c; return c;
}
function buildProps() {
  prop('sign', 16, 16, g => { R(g, 7, 9, 2, 6, PAL.woodd); R(g, 2, 2, 12, 8, PAL.wood); R(g, 3, 3, 10, 6, PAL.woodl); R(g, 4, 4, 8, 1, PAL.woodd); R(g, 4, 6, 6, 1, PAL.woodd); });
  prop('bigsign', 32, 16, g => { R(g, 4, 9, 2, 6, PAL.woodd); R(g, 26, 9, 2, 6, PAL.woodd); R(g, 1, 1, 30, 9, PAL.wood); R(g, 2, 2, 28, 7, PAL.woodl); });
  prop('bush', 16, 16, g => { ellipse(g, 8, 9, 7, 6, PAL.leafd); ellipse(g, 7, 8, 6, 4, PAL.leaf); P(g, 5, 6, PAL.leafl); P(g, 6, 5, PAL.leafl); P(g, 10, 7, PAL.leafl); });
  prop('lamp', 16, 32, g => { R(g, 7, 8, 2, 22, '#384048'); R(g, 5, 29, 6, 2, '#384048'); R(g, 4, 2, 8, 7, '#384048'); R(g, 5, 3, 6, 5, '#F8E8A0'); R(g, 3, 1, 10, 2, '#283038'); });
  prop('bench', 32, 16, g => { R(g, 1, 3, 30, 3, PAL.wood); R(g, 1, 7, 30, 3, PAL.woodl); R(g, 3, 10, 2, 5, '#505860'); R(g, 27, 10, 2, 5, '#505860'); R(g, 1, 6, 30, 1, PAL.woodd); });
  prop('fountain', 48, 40, g => {
    ellipse(g, 24, 28, 22, 10, '#B8B0A0'); ellipse(g, 24, 27, 19, 8, '#D8D0C0'); ellipse(g, 24, 27, 16, 6, PAL.w); ellipse(g, 20, 26, 6, 2, PAL.wl);
    R(g, 21, 8, 6, 18, '#D8D0C0'); R(g, 25, 8, 2, 18, '#B8B0A0'); ellipse(g, 24, 9, 8, 3, '#D8D0C0'); ellipse(g, 24, 8, 6, 2, PAL.w);
    R(g, 23, 1, 2, 7, PAL.wl); P(g, 22, 2, PAL.wl); P(g, 25, 3, PAL.wl);
  });
  prop('flowerpot', 16, 16, g => { R(g, 4, 9, 8, 6, '#C8683C'); R(g, 3, 8, 10, 2, '#D88050'); ellipse(g, 8, 5, 5, 4, PAL.leaf); P(g, 6, 3, PAL.red); P(g, 10, 4, PAL.red); P(g, 8, 2, PAL.yel); });
  prop('crates', 32, 16, g => {
    for (let i = 0; i < 2; i++) { const x = i * 16 + 1; R(g, x, 5, 14, 10, PAL.wood); R(g, x, 5, 14, 2, PAL.woodl); R(g, x + 2, 9, 10, 1, PAL.woodd); for (let k = 0; k < 4; k++) { ellipse(g, x + 3 + k * 3, 4, 2, 2, PAL.red); P(g, x + 2 + k * 3, 3, PAL.redl); } }
  });
  prop('cone', 16, 16, g => { R(g, 3, 13, 10, 2, '#F07020'); R(g, 6, 3, 4, 10, '#F07020'); R(g, 5, 6, 6, 2, PAL.wht); R(g, 5, 10, 6, 2, PAL.wht); R(g, 7, 2, 2, 1, '#F07020'); });
  prop('barrier', 48, 16, g => { R(g, 2, 9, 2, 6, '#606870'); R(g, 44, 9, 2, 6, '#606870'); R(g, 0, 4, 48, 5, PAL.wht); for (let x = 0; x < 48; x += 8) R(g, x, 4, 4, 5, PAL.red); });
  prop('tomb', 16, 16, g => { R(g, 3, 4, 10, 11, '#9CA0A8'); R(g, 4, 2, 8, 2, '#9CA0A8'); R(g, 4, 5, 8, 9, '#B4B8C0'); R(g, 7, 6, 2, 6, '#7C8088'); R(g, 5, 8, 6, 2, '#7C8088'); R(g, 2, 14, 12, 2, PAL.gd); });
  prop('cardtable', 32, 24, g => { ellipse(g, 16, 9, 14, 6, '#2E7A4A'); ellipse(g, 16, 8, 12, 4, '#3A9A5C'); R(g, 14, 14, 4, 8, PAL.woodd); R(g, 10, 21, 12, 2, PAL.woodd); R(g, 9, 6, 4, 5, PAL.wht); R(g, 18, 5, 4, 5, PAL.wht); P(g, 10, 7, PAL.red); P(g, 20, 6, PAL.blk); });
  prop('speaker', 16, 24, g => { R(g, 2, 2, 12, 20, '#303038'); ellipse(g, 8, 8, 4, 4, '#505060'); ellipse(g, 8, 8, 2, 2, '#202028'); ellipse(g, 8, 17, 3, 3, '#505060'); });
  prop('boat', 64, 48, g => {
    // gozzo rosso e bianco con tendalino, albero, remi e motore fuoribordo (come la barca di nonno Enzo)
    const top = x => 31 - Math.round(Math.pow(Math.max(0, x - 40) / 22, 2) * 6) - Math.round(x / 64 * 2);
    const bot = x => 45 - Math.round(Math.pow(Math.max(0, x - 36) / 26, 1.6) * 13);
    for (let x = 6; x < 62; x++) {
      const t = top(x), b = bot(x), h = b - t;
      for (let y = t; y < b; y++) {
        const f = (y - t) / h;
        let col = f < 0.12 ? '#F4F0E6' : f < 0.4 ? '#D8282C' : f < 0.47 ? '#F4F0E6' : f < 0.68 ? '#D8282C' : '#F0ECE2';
        if (f >= 0.12 && f < 0.4 && (y - t) === Math.round(h * 0.26)) col = '#B81C22';
        if (f >= 0.68 && (y - t) % 3 === 0) col = '#DCD8CE';
        P(g, x, y, col);
      }
      P(g, x, t, '#FFFFFF');
    }
    R(g, 6, top(6), 2, bot(6) - top(6), '#B81C22'); // specchio di poppa
    // tendalino su tre paletti
    for (const px of [12, 24, 37]) R(g, px, 9, 1, top(px) - 9, '#D8A060');
    R(g, 9, 8, 34, 2, '#C89050');
    R(g, 7, 5, 38, 3, '#F8F8F4'); for (let x = 7; x < 45; x += 3) P(g, x, 4 + (x % 2), '#F8F8F4'); for (let x = 8; x < 45; x += 4) P(g, x, 8, '#E8E8E0');
    // albero
    R(g, 46, 0, 2, top(46), '#D8A868'); P(g, 47, 0, '#B88848');
    // remi
    for (let i = 0; i < 30; i++) P(g, 14 + i, 30 - Math.round(i * 0.22), '#8A2A2A');
    for (let i = 0; i < 6; i++) P(g, 10 + i, 31, '#8A2A2A');
    // bitte e prua
    R(g, 56, top(56) - 2, 3, 2, '#C83030'); R(g, 20, top(20) - 2, 2, 2, '#C83030');
    // motore fuoribordo blu
    R(g, 0, 22, 8, 8, '#2A3A90'); R(g, 1, 23, 6, 2, '#4A5AB8'); R(g, 7, 24, 3, 1, '#303030'); R(g, 3, 30, 2, 8, '#303038');
  });
  prop('mailbox', 16, 16, g => { R(g, 7, 8, 2, 7, '#505860'); R(g, 3, 3, 10, 6, PAL.red); R(g, 3, 3, 10, 1, PAL.redl); R(g, 5, 5, 6, 1, PAL.redd); });
  prop('vespa', 32, 24, g => {
    ellipse(g, 7, 19, 4, 4, '#303038'); ellipse(g, 25, 19, 4, 4, '#303038'); ellipse(g, 7, 19, 2, 2, '#A0A0A8'); ellipse(g, 25, 19, 2, 2, '#A0A0A8');
    ellipse(g, 22, 14, 8, 5, '#68C0B0'); R(g, 6, 10, 6, 8, '#68C0B0'); R(g, 6, 3, 2, 8, '#505860'); R(g, 3, 3, 8, 2, '#505860'); R(g, 17, 9, 10, 2, '#5A4A3A'); P(g, 5, 11, PAL.yel);
  });
  prop('goal', 16, 48, g => { R(g, 2, 0, 3, 48, PAL.wht); R(g, 2, 0, 14, 3, PAL.wht); R(g, 2, 45, 14, 3, PAL.wht); for (let y = 4; y < 45; y += 4) R(g, 5, y, 11, 1, '#C8D0D8'); for (let x = 7; x < 16; x += 4) R(g, x, 3, 1, 42, '#C8D0D8'); });
  prop('ball', 16, 16, g => { ellipse(g, 8, 10, 4, 4, PAL.wht); R(g, 7, 9, 3, 2, '#303038'); P(g, 5, 11, '#303038'); P(g, 11, 8, '#303038'); P(g, 8, 13, '#303038'); });
  prop('acoustic', 16, 32, g => { ellipse(g, 8, 23, 6, 7, '#D89848'); ellipse(g, 8, 16, 4, 4, '#D89848'); ellipse(g, 8, 20, 2, 2, '#3A2A1A'); R(g, 7, 0, 2, 14, '#6A4020'); R(g, 6, 0, 4, 3, '#4A2A10'); R(g, 7, 26, 3, 1, '#4A2A10'); for (let y = 2; y < 25; y += 2) P(g, 8, y, '#E8E0D0'); });
  // ---- interni ----
  prop('bed', 16, 32, g => { R(g, 1, 2, 14, 28, PAL.woodd); R(g, 2, 3, 12, 26, '#F0F0F8'); R(g, 3, 4, 10, 6, PAL.wht); R(g, 2, 12, 12, 17, '#4878D0'); R(g, 2, 12, 12, 2, '#6898E8'); });
  prop('pc', 32, 32, g => { R(g, 1, 16, 30, 4, PAL.wood); R(g, 1, 20, 30, 10, PAL.woodd); R(g, 3, 22, 26, 6, PAL.wood); R(g, 7, 2, 18, 13, '#D8D8E0'); R(g, 9, 4, 14, 9, '#3060A0'); R(g, 10, 5, 6, 1, '#80C0F8'); R(g, 10, 7, 9, 1, '#80C0F8'); R(g, 13, 15, 6, 2, '#B0B0B8'); R(g, 8, 17, 16, 2, '#E8E8F0'); });
  prop('tv', 32, 32, g => { R(g, 2, 18, 28, 12, PAL.woodd); R(g, 3, 19, 26, 4, PAL.wood); R(g, 4, 4, 24, 15, '#303038'); R(g, 6, 6, 20, 11, '#58A8E0'); R(g, 7, 7, 8, 3, '#A0D8F8'); });
  prop('table', 32, 24, g => { R(g, 1, 2, 30, 12, PAL.wood); R(g, 1, 2, 30, 2, PAL.woodl); R(g, 3, 14, 3, 9, PAL.woodd); R(g, 26, 14, 3, 9, PAL.woodd); R(g, 12, 4, 8, 6, PAL.wht); R(g, 13, 5, 6, 3, '#E06040'); });
  prop('plant', 16, 32, g => { R(g, 4, 22, 8, 9, '#C8683C'); R(g, 3, 21, 10, 2, '#D88050'); ellipse(g, 8, 13, 6, 9, PAL.leaf); ellipse(g, 6, 10, 3, 4, PAL.leafl); R(g, 7, 16, 2, 6, PAL.leafd); });
  prop('shelf', 32, 32, g => {
    R(g, 1, 1, 30, 30, PAL.woodd); R(g, 3, 3, 26, 26, PAL.wooddd);
    const cols = ['#C04040', '#4070C0', '#40A060', '#D0A030', '#8050A0', '#E07040'];
    for (let s = 0; s < 3; s++) { R(g, 3, 10 + s * 9, 26, 2, PAL.wood); for (let b = 0; b < 8; b++) R(g, 4 + b * 3, 3 + s * 9, 2, 7, cols[(b + s * 3) % 6]); }
  });
  prop('counter', 48, 24, g => { R(g, 0, 4, 48, 18, '#D8C8A8'); R(g, 0, 2, 48, 4, '#F0E4C8'); R(g, 0, 20, 48, 2, '#A89878'); for (let x = 6; x < 48; x += 12) R(g, x, 8, 1, 12, '#B8A888'); });
  prop('pew', 48, 16, g => { R(g, 1, 2, 46, 4, PAL.woodd); R(g, 1, 6, 46, 5, PAL.wood); R(g, 1, 6, 46, 1, PAL.woodl); R(g, 2, 11, 3, 4, PAL.woodd); R(g, 43, 11, 3, 4, PAL.woodd); });
  prop('altar', 48, 32, g => { R(g, 2, 12, 44, 18, '#F0ECE0'); R(g, 2, 12, 44, 3, '#E0B040'); R(g, 6, 18, 36, 8, '#D8D0C0'); R(g, 23, 0, 2, 11, '#E0B040'); R(g, 19, 3, 10, 2, '#E0B040'); R(g, 8, 6, 2, 6, PAL.wht); P(g, 8, 5, PAL.yel); R(g, 38, 6, 2, 6, PAL.wht); P(g, 38, 5, PAL.yel); });
  prop('case', 32, 32, g => { R(g, 2, 18, 28, 12, PAL.woodd); R(g, 3, 19, 26, 3, PAL.wood); R(g, 3, 4, 26, 15, '#C8E8F8'); R(g, 3, 4, 26, 1, PAL.wht); R(g, 4, 5, 2, 8, PAL.wht); }, false);
  prop('spit', 32, 32, g => { // girarrosto del kebab
    R(g, 2, 26, 28, 5, '#A0A0A8'); R(g, 15, 0, 2, 26, '#707078'); for (let y = 4; y < 24; y++) { const w = 7 - Math.abs(y - 12) / 3; R(g, 16 - w, y, w * 2, 1, y % 3 ? '#B87040' : '#985830'); }
    R(g, 24, 4, 5, 20, '#C04030'); R(g, 25, 5, 3, 18, '#F07040');
  });
  prop('jar', 16, 24, g => { R(g, 3, 4, 10, 18, '#D84030'); R(g, 3, 4, 10, 2, '#F06050'); R(g, 4, 1, 8, 3, '#E0B040'); R(g, 3, 10, 10, 7, '#F8F0E0'); R(g, 5, 12, 6, 1, '#2E7A4A'); R(g, 5, 14, 6, 1, PAL.red); P(g, 4, 6, PAL.wht); });
  prop('sofa', 48, 24, g => { R(g, 1, 4, 46, 18, '#B04860'); R(g, 4, 2, 40, 8, '#C85878'); R(g, 1, 8, 6, 14, '#983850'); R(g, 41, 8, 6, 14, '#983850'); R(g, 7, 12, 34, 2, '#983850'); });
  prop('rug', 48, 32, g => { R(g, 0, 0, 48, 32, '#C04838'); R(g, 3, 3, 42, 26, '#E0B040'); R(g, 5, 5, 38, 22, '#C04838'); ellipse(g, 24, 16, 10, 6, '#E0B040'); ellipse(g, 24, 16, 7, 4, '#2E7A4A'); }, true);
  prop('poster', 16, 16, g => { R(g, 2, 1, 12, 14, PAL.wht); R(g, 3, 2, 10, 7, '#58A8E0'); R(g, 3, 9, 10, 1, PAL.red); R(g, 4, 11, 8, 1, '#888'); R(g, 4, 13, 6, 1, '#888'); });
  prop('desk', 48, 24, g => { R(g, 1, 6, 46, 6, '#E8E8F0'); R(g, 3, 12, 3, 11, '#707880'); R(g, 42, 12, 3, 11, '#707880'); R(g, 8, 0, 14, 8, '#303038'); R(g, 9, 1, 12, 5, '#40C080'); R(g, 28, 0, 14, 8, '#303038'); R(g, 29, 1, 12, 5, '#E06090'); });
  prop('mixer', 32, 24, g => { R(g, 1, 8, 30, 14, '#303038'); for (let i = 0; i < 6; i++) { R(g, 3 + i * 5, 10, 2, 8, '#606070'); R(g, 3 + i * 5, 12 + (i * 3) % 5, 2, 2, i % 2 ? PAL.red : PAL.yel); } });
  const VASES = ['#2E6AB0', '#E8B030', '#3A9A6A', '#C85030', '#F0E8D8', '#7A4AA0'];
  function vase(g, x, y, s, col) { ellipse(g, x, y - s, s, s + 1, col); R(g, x - (s >> 1), y - s * 2 - 3, s, 3, col); R(g, x - (s >> 1) - 1, y - s * 2 - 4, s + 2, 1, shade(col, -0.25)); P(g, x - s + 1, y - s - 1, shade(col, 0.45)); R(g, x - s + 1, y - s + 1, s * 2 - 1, 1, shade(col, -0.3)); }
  prop('vaseshelf', 32, 32, (g) => { R(g, 1, 1, 30, 30, PAL.woodd); R(g, 3, 3, 26, 26, PAL.wooddd); for (let s = 0; s < 2; s++) { R(g, 3, 14 + s * 13, 26, 2, PAL.wood); for (let k = 0; k < 3; k++) vase(g, 8 + k * 8, 14 + s * 13, 3, VASES[(k + s * 3) % 6]); } });
  prop('vases', 32, 24, g => { R(g, 1, 12, 30, 4, PAL.wood); R(g, 3, 16, 3, 7, PAL.woodd); R(g, 26, 16, 3, 7, PAL.woodd); vase(g, 8, 12, 4, VASES[0]); vase(g, 17, 12, 3, VASES[1]); vase(g, 25, 12, 4, VASES[2]); });
  prop('wheel', 32, 24, g => { R(g, 4, 12, 24, 10, '#808890'); ellipse(g, 16, 11, 12, 3, '#A0A8B0'); ellipse(g, 16, 8, 5, 4, '#C88A60'); R(g, 13, 3, 6, 5, '#C88A60'); R(g, 14, 2, 4, 1, '#A86A40'); });
  prop('kiln', 32, 32, g => { R(g, 2, 6, 28, 25, '#9A8A80'); R(g, 2, 6, 28, 3, '#B8A8A0'); R(g, 7, 13, 18, 12, '#3A3030'); R(g, 9, 15, 14, 8, '#F07830'); R(g, 11, 17, 10, 4, '#F8C040'); R(g, 13, 0, 6, 6, '#7A6A60'); });
  prop('rack', 32, 32, g => {
    R(g, 2, 3, 28, 2, '#808890'); R(g, 3, 5, 2, 26, '#808890'); R(g, 27, 5, 2, 26, '#808890');
    const cols = ['#E85848', PAL.wht, '#2E7A4A', '#F0C040', '#3A70C0'];
    for (let k = 0; k < 5; k++) { const x = 4 + k * 5; R(g, x, 6, 6, 15, cols[k]); R(g, x - 1, 6, 1, 4, cols[k]); R(g, x + 6, 6, 1, 4, cols[k]); R(g, x + 2, 6, 2, 1, '#808890'); }
  });
  prop('mannequin', 16, 32, g => { ellipse(g, 8, 4, 3, 3, '#E8D8C0'); R(g, 3, 8, 10, 12, '#E85848'); R(g, 2, 8, 2, 5, '#E85848'); R(g, 12, 8, 2, 5, '#E85848'); text3(g, 'M', 7, 11, PAL.wht); R(g, 7, 20, 2, 9, '#707880'); R(g, 4, 29, 8, 2, '#707880'); });
  prop('amp', 16, 24, g => { R(g, 1, 4, 14, 19, '#2A2A30'); R(g, 2, 5, 12, 3, '#C8A060'); R(g, 2, 9, 12, 13, '#3A3A42'); for (let y = 10; y < 22; y += 2) R(g, 3, y, 10, 1, '#2A2A30'); });
  prop('guitar', 16, 32, g => { ellipse(g, 8, 23, 6, 6, '#D83838'); ellipse(g, 6, 17, 3, 3, '#D83838'); R(g, 6, 22, 5, 3, PAL.wht); R(g, 7, 2, 2, 16, '#3A2A1A'); R(g, 6, 0, 4, 3, '#202020'); R(g, 3, 30, 10, 2, '#505860'); });
  prop('jukebox', 32, 32, g => { R(g, 3, 6, 26, 25, '#A03060'); ellipse(g, 16, 7, 13, 6, '#A03060'); ellipse(g, 16, 8, 10, 4, '#F8C040'); R(g, 7, 12, 18, 9, '#2A2A40'); for (let k = 0; k < 4; k++) R(g, 9 + k * 4, 14, 2, 5, ['#F05050', '#50D0F0', '#F0E050', '#70F070'][k]); R(g, 6, 23, 20, 6, '#601838'); for (let x = 8; x < 25; x += 3) R(g, x, 24, 2, 4, '#F8C040'); });
  prop('drums', 32, 24, g => { ellipse(g, 16, 16, 7, 7, '#E8E8F0'); ellipse(g, 16, 16, 5, 5, '#3060B0'); ellipse(g, 6, 11, 5, 3, '#E0B040'); ellipse(g, 26, 9, 5, 2, '#E0B040'); R(g, 5, 12, 1, 11, '#808890'); R(g, 26, 10, 1, 13, '#808890'); ellipse(g, 24, 15, 4, 3, '#3060B0'); });
  prop('wallmap', 48, 32, g => {
    R(g, 0, 0, 48, 30, '#8A6A40'); R(g, 2, 2, 44, 26, '#EAD9A8');
    ellipse(g, 14, 12, 8, 6, '#9CC488'); ellipse(g, 32, 17, 9, 6, '#9CC488'); ellipse(g, 30, 9, 4, 3, '#B8D498'); R(g, 20, 20, 3, 2, '#9CC488');
    for (let x = 4; x < 46; x += 8) R(g, x, 2, 1, 26, '#D8C690'); for (let y = 6; y < 28; y += 8) R(g, 2, y, 44, 1, '#D8C690');
    P(g, 14, 12, PAL.red); P(g, 33, 16, PAL.red); for (let i = 0; i < 9; i++) P(g, 15 + i * 2, 13 + Math.round(i / 3), '#C04040');
    ellipse(g, 41, 23, 3, 3, '#8A6A40'); P(g, 41, 19, '#8A6A40');
  }, true);
  prop('globe', 16, 32, g => { ellipse(g, 8, 10, 7, 7, '#3A78C0'); ellipse(g, 6, 8, 3, 2, '#5AA048'); ellipse(g, 10, 13, 2, 2, '#5AA048'); R(g, 7, 17, 2, 9, '#C8A060'); R(g, 3, 26, 10, 3, '#8A6A40'); });
  prop('maptable', 48, 24, g => { R(g, 1, 4, 46, 10, PAL.wood); R(g, 1, 4, 46, 2, PAL.woodl); R(g, 3, 14, 3, 9, PAL.woodd); R(g, 42, 14, 3, 9, PAL.woodd); R(g, 6, 3, 18, 9, '#EAD9A8'); R(g, 8, 5, 6, 4, '#9CC488'); R(g, 26, 2, 16, 10, '#F0E8D0'); R(g, 28, 4, 2, 6, '#3A78C0'); R(g, 31, 6, 9, 1, '#C04040'); });
  prop('artist', 16, 16, g => { R(g, 1, 1, 14, 14, '#202030'); ellipse(g, 8, 6, 3, 3, '#F8C898'); R(g, 4, 9, 8, 5, '#A03060'); R(g, 2, 13, 12, 1, '#F8C040'); }, true);
  prop('passport', 32, 32, g => { R(g, 2, 18, 28, 12, PAL.woodd); R(g, 3, 4, 26, 15, '#C8E8F8'); R(g, 9, 6, 14, 11, '#3A3A80'); R(g, 10, 7, 12, 9, '#4848A0'); ellipse(g, 16, 10, 3, 3, '#E0B040'); R(g, 12, 14, 8, 1, '#E0B040'); });
  prop('boatmodel', 32, 32, g => { R(g, 2, 18, 28, 12, PAL.woodd); R(g, 3, 4, 26, 15, '#C8E8F8'); for (let y = 0; y < 6; y++) R(g, 5 + y * 2, 12 + y, 22 - y * 4, 1, y === 0 ? PAL.wht : y === 2 ? PAL.wht : y < 4 ? '#D8282C' : '#F0ECE2'); R(g, 22, 5, 1, 7, '#D8A868'); R(g, 7, 8, 13, 2, PAL.wht); R(g, 9, 10, 1, 2, '#D8A868'); R(g, 17, 10, 1, 2, '#D8A868'); R(g, 4, 11, 2, 2, '#2A3A90'); });
  prop('sprout', 32, 32, g => { R(g, 2, 18, 28, 12, PAL.woodd); R(g, 3, 4, 26, 15, '#C8E8F8'); R(g, 10, 14, 12, 5, PAL.soil); R(g, 15, 8, 2, 6, PAL.leafd); ellipse(g, 12, 9, 3, 2, PAL.leaf); ellipse(g, 20, 8, 3, 2, PAL.leafl); });
  prop('mic', 16, 32, g => { R(g, 7, 10, 2, 20, '#505860'); R(g, 3, 29, 10, 2, '#505860'); ellipse(g, 8, 6, 3, 4, '#303038'); P(g, 7, 4, '#A0A0A8'); });
  prop('easel', 32, 32, g => { R(g, 6, 4, 2, 27, PAL.woodd); R(g, 24, 4, 2, 27, PAL.woodd); R(g, 4, 3, 24, 18, PAL.wht); R(g, 6, 5, 20, 14, '#F8F0E0'); ellipse(g, 12, 11, 4, 3, PAL.red); R(g, 16, 8, 8, 8, '#2E7A4A'); });
}

/* =========================================================
   EDIFICI
   ========================================================= */
function roofSlope(g, x, y, w, h, col) {
  const d = shade(col, -0.25), l = shade(col, 0.2), dd = shade(col, -0.45);
  R(g, x, y, w, h, col);
  for (let yy = y + 3; yy < y + h; yy += 4) R(g, x, yy, w, 1, d);
  for (let yy = y; yy < y + h; yy += 4) for (let xx = x + ((yy / 4) % 2 ? 2 : 6); xx < x + w; xx += 8) R(g, xx, yy, 1, 3, d);
  R(g, x, y, w, 1, l); R(g, x - 1, y + h - 1, w + 2, 2, dd);
}
function windowAt(g, x, y, w = 10, h = 9, frame = PAL.wht) {
  R(g, x - 1, y - 1, w + 2, h + 2, frame); R(g, x, y, w, h, PAL.glass); R(g, x, y + h - 3, w, 3, PAL.glassd);
  R(g, x + 1, y + 1, 2, 3, PAL.glassl); R(g, x + (w >> 1), y, 1, h, frame); R(g, x - 1, y + h + 1, w + 2, 1, shade(frame, -0.3));
}
function doorAt(g, x, y, col = PAL.woodd, w = 12, h = 14) {
  R(g, x - 1, y - 1, w + 2, h + 1, shade(col, -0.3)); R(g, x, y, w, h, col); R(g, x + 1, y + 1, w - 2, 5, shade(col, 0.15)); R(g, x + 1, y + 7, w - 2, 6, shade(col, 0.1));
  P(g, x + w - 3, y + 8, PAL.yel);
}
// ritorna {img, w, h, top, door:[dx], wins:[]}
function building(kind) {
  const B = {};
  const make = (wt, ht, top) => { const c = mk(wt * 16, ht * 16 + top); return c; };
  let c, g, w, h, top = 0, door = 0, wins = [];
  const win = (x, y, ww = 10, hh = 9, fr) => { windowAt(g, x, y + top, ww, hh, fr); wins.push([x, y + top, ww, hh]); };
  switch (kind) {
    case 'casa': {
      w = 7; h = 6; top = 10; c = make(w, h, top); g = c.g;
      const cr = '#F2E8D4', cd = '#DCCFB6', rb = '#A8402E', rbd = '#7A2A20', sh = '#6A1E22', gl = '#2E3A3C';
      R(g, 4, top + 20, 104, 76, cr); R(g, 4, top + 20, 104, 2, cd);
      R(g, 0, top + 16, 44, 4, rb); R(g, 0, top + 20, 44, 2, rbd); R(g, 68, top + 16, 44, 4, rb); R(g, 68, top + 20, 44, 2, rbd);
      R(g, 42, 2, 28, top + 94, cr); R(g, 66, 2, 4, top + 94, cd); R(g, 40, 0, 32, 4, rb); R(g, 40, 4, 32, 1, rbd);
      for (const yy of [8, 34, 58]) { R(g, 49, top + yy - 6, 14, 16, '#E8E8E0'); R(g, 50, top + yy - 5, 12, 14, '#8AA0B0'); R(g, 55, top + yy - 5, 1, 14, '#E8E8E0'); wins.push([50, top + yy - 5, 12, 14]); }
      const shutter = (x, y) => { R(g, x, y, 12, 14, sh); for (let k = 2; k < 14; k += 3) R(g, x + 1, y + k, 10, 1, '#4A1418'); R(g, x + 5, y, 1, 14, '#4A1418'); };
      shutter(10, top + 26); shutter(26, top + 26); shutter(78, top + 26); shutter(94, top + 26); shutter(14, top + 56); shutter(82, top + 56);
      wins.push([10, top + 26, 12, 14], [94, top + 26, 12, 14]);
      const balcony = (x, y, ww) => { R(g, x, y, ww, 7, gl); R(g, x, y, ww, 1, '#5A6A6C'); R(g, x, y + 7, ww, 2, rb); R(g, x, y + 9, ww, 1, rbd); for (let k = x + 3; k < x + ww; k += 7) P(g, k, y + 4, '#3A8A3A'); };
      balcony(2, top + 42, 38); balcony(72, top + 42, 38); balcony(76, top + 72, 34);
      for (let x = 6; x < 36; x += 4) R(g, x, top + 51, 4, 4, (x / 4) % 2 ? PAL.wht : '#9A9A90');
      R(g, 44, top + 70, 24, 2, rb); R(g, 46, top + 74, 20, 22, '#F8E8B8'); for (let x = 47; x < 66; x += 3) R(g, x, top + 76, 1, 20, '#5A4A3A'); R(g, 46, top + 85, 20, 1, '#5A4A3A');
      R(g, 53, top + 72, 6, 2, '#FFF4C0'); wins.push([46, top + 74, 20, 22]);
      R(g, 84, top + 84, 26, 3, '#F0EEE8'); R(g, 86, top + 87, 1, 9, '#6A4020'); R(g, 106, top + 87, 1, 9, '#6A4020'); R(g, 90, top + 90, 3, 3, PAL.red); R(g, 98, top + 91, 3, 3, PAL.red);
      ellipse(g, 12, top + 90, 11, 6, PAL.leafd); ellipse(g, 11, top + 89, 9, 4, PAL.leaf);
      door = 3; break;
    }
    case 'chiesa': {
      w = 7; h = 6; top = 32; c = make(w, h, top); g = c.g;
      // campanile
      R(g, 84, 0, 26, 70, '#E8D8B4'); R(g, 84, 0, 26, 3, '#C8B088'); R(g, 106, 3, 4, 67, '#D0C098');
      R(g, 90, 12, 14, 16, '#5A4A3A'); ellipse(g, 97, 22, 4, 4, '#E0B040'); R(g, 90, 10, 14, 3, '#C8B088'); R(g, 95, -1, 4, 6, '#C8B088'); R(g, 96, -4, 2, 6, '#806040');
      // facciata
      R(g, 4, 40, 84, 88, '#F4E6C4'); R(g, 4, 40, 84, 3, '#D8C090');
      for (let i = 0; i < 24; i++) R(g, 4 + i * 2, 40 - i, 84 - i * 4, 1, i % 4 === 0 ? '#D8C090' : '#F4E6C4');
      R(g, 8, 38, 76, 3, '#C8B088');
      ellipse(g, 46, 58, 9, 9, '#C8B088'); ellipse(g, 46, 58, 7, 7, '#5A88C8'); R(g, 45, 51, 2, 14, '#E0B040'); R(g, 39, 57, 14, 2, '#E0B040');
      for (const px of [10, 30, 58, 78]) { R(g, px, 44, 4, 84, '#E0D0A8'); R(g, px + 3, 44, 1, 84, '#C8B088'); }
      R(g, 36, 98, 20, 30, '#7A4A28'); ellipse(g, 46, 98, 10, 8, '#7A4A28'); R(g, 37, 100, 18, 28, '#8E5A30'); R(g, 45, 92, 2, 36, '#5A3A20');
      win(16, 80, 8, 14, '#E0D0A8'); win(66, 80, 8, 14, '#E0D0A8');
      text3(g, 'SAN BIAGIO', 27, 74 + 0, '#8A6A40');
      door = 2; w = 7; break;
    }
    case 'castello': {
      w = 9; h = 6; top = 16; c = make(w, h, top); g = c.g;
      const st = '#CDB894', sd = '#A89270', sl = '#E0D0B0';
      R(g, 0, 8, 144, 104, st);
      for (let y = 12; y < 112; y += 6) for (let x = (y / 6) % 2 ? 0 : 6; x < 144; x += 12) R(g, x, y, 11, 1, sd);
      // torri
      for (const tx of [0, 112]) { R(g, tx, 0, 32, 112, sl); R(g, tx + 28, 0, 4, 112, sd); for (let x = tx; x < tx + 32; x += 8) R(g, x, -4 + 4, 5, 5, sl); R(g, tx, 6, 32, 2, sd); win(tx + 11, 30, 8, 12, '#B09A78'); win(tx + 11, 66, 8, 12, '#B09A78'); }
      for (let x = 32; x < 112; x += 10) { R(g, x, 4, 6, 6, st); R(g, x + 5, 4, 1, 6, sd); }
      R(g, 32, 10, 80, 2, sd);
      win(44, 40, 10, 10, '#B09A78'); win(90, 40, 10, 10, '#B09A78');
      // portale
      R(g, 60, 76, 24, 36, '#5A3A20'); ellipse(g, 72, 76, 12, 8, '#5A3A20'); R(g, 62, 78, 20, 34, '#7A4A28'); for (let x = 64; x < 82; x += 4) R(g, x, 78, 1, 34, '#5A3A20');
      text3(g, 'CASTELLO', 56, 60, '#7A6448');
      // bandiera
      R(g, 127, -4 + 4, 1, 0, sd);
      door = 4; break;
    }
    case 'comune': {
      w = 8; h = 5; top = 16; c = make(w, h, top); g = c.g;
      R(g, 0, 20, 128, 76, '#ECCABC'); R(g, 0, 16, 128, 6, '#F8F0E8'); R(g, 0, 14, 128, 2, '#C8A898');
      // frontone con orologio
      for (let i = 0; i < 12; i++) R(g, 40 + i * 2, 14 - i, 48 - i * 4, 1, '#F8F0E8');
      ellipse(g, 64, 8, 5, 5, '#F8F8F8'); ellipse(g, 64, 8, 4, 4, '#303038'); ellipse(g, 64, 8, 3, 3, PAL.wht); R(g, 64, 5, 1, 4, PAL.blk); R(g, 64, 8, 3, 1, PAL.blk);
      R(g, 63, -6 + 6, 1, 0, PAL.blk);
      // tricolore
      R(g, 100, 0, 1, 16, '#505860'); R(g, 101, 1, 4, 7, '#2E9A4A'); R(g, 105, 1, 4, 7, PAL.wht); R(g, 109, 1, 4, 7, PAL.red);
      for (const px of [4, 30, 92, 118]) { R(g, px, 22, 6, 74, '#F8F0E8'); R(g, px + 5, 22, 1, 74, '#D8C8B8'); }
      win(14, 30, 10, 12); win(40, 30, 10, 12); win(78, 30, 10, 12); win(104, 30, 10, 12);
      win(14, 60, 10, 12); win(104, 60, 10, 12);
      R(g, 58, 52, 28, 44, '#F8F0E8'); doorAt(g, 64, 66, '#6A4A2A', 16, 30); ellipse(g, 72, 66, 8, 5, '#6A4A2A');
      R(g, 50, 46, 44, 7, '#F8F0E8'); text3(g, 'MUNICIPIO', 55, 47, '#8A6A58');
      door = 4; break;
    }
    case 'kebab': {
      w = 6; h = 4; c = make(w, h, 0); g = c.g;
      R(g, 0, 4, 96, 60, '#F2EEE4'); R(g, 0, 2, 96, 3, '#303830');
      for (let x = 0; x < 96; x += 4) { R(g, x, 6, 4, 4, (x / 4) % 2 ? '#1E7A44' : PAL.wht); R(g, x, 10, 4, 4, (x / 4) % 2 ? PAL.wht : '#1E7A44'); }
      R(g, 4, 15, 88, 9, '#1E2A22'); text3(g, 'ROCK&FELLER', 26, 17, PAL.wht);
      // tenda
      for (let x = 2; x < 94; x += 6) { R(g, x, 25, 6, 6, (x / 6) % 2 < 1 ? '#1E7A44' : PAL.wht); }
      for (let x = 2; x < 94; x += 6) { P(g, x + 2, 31, '#1E7A44'); P(g, x + 3, 31, '#1E7A44'); }
      R(g, 4, 34, 26, 22, '#1E2A22'); R(g, 5, 35, 24, 20, PAL.glass); R(g, 6, 36, 4, 8, PAL.glassl); wins.push([5, 35, 24, 20]);
      R(g, 62, 34, 28, 22, '#1E2A22'); R(g, 63, 35, 26, 20, PAL.glass); R(g, 64, 36, 4, 8, PAL.glassl); wins.push([63, 35, 26, 20]);
      R(g, 66, 40, 18, 10, '#B87040'); R(g, 74, 38, 2, 14, '#707078');
      doorAt(g, 34, 49, '#1E2A22', 16, 15); R(g, 36, 51, 12, 10, PAL.glass);
      door = 2; break;
    }
    case 'mercoleterry': {
      w = 6; h = 4; top = 22; c = make(w, h, top); g = c.g;
      // barattolone sul tetto
      R(g, 38, 0, 20, 4, '#E0B040'); R(g, 36, 4, 24, 26, '#D83828'); R(g, 36, 4, 24, 3, '#F05848'); R(g, 36, 12, 24, 10, '#F8F0E0'); text3(g, 'MT', 44, 15, '#2E7A4A'); P(g, 38, 8, PAL.wht);
      roofSlope(g, 1, top + 2, 94, 22, '#C83A2A');
      R(g, 3, top + 24, 90, 40, '#FBF4E8');
      R(g, 6, top + 26, 84, 9, '#2E7A4A'); text3(g, 'MERCOLETERRY', 24, top + 28, PAL.wht);
      win(10, top + 40); win(76, top + 40); doorAt(g, 36, top + 49, '#A83020'); door = 2;
      for (let x = 30; x < 70; x += 8) { ellipse(g, x, top + 40, 2, 2, PAL.red); P(g, x, top + 37, PAL.leafd); }
      break;
    }
    case 'pullmeup': {
      w = 6; h = 5; top = 8; c = make(w, h, top); g = c.g;
      R(g, 70, 0, 2, 10, '#505860'); ellipse(g, 71, 1, 3, 1, '#F07020');
      R(g, 0, 8, 96, 80, '#2C3440'); R(g, 0, 8, 96, 4, '#404A58');
      R(g, 6, 14, 84, 10, '#F8D030'); text3(g, 'PULLME UP', 30, 17, '#2C3440');
      for (let r = 0; r < 2; r++) for (let k = 0; k < 4; k++) { const x = 6 + k * 22, y = 28 + r * 18; R(g, x, y, 18, 14, '#7AB8E8'); R(g, x + 1, y + 1, 4, 5, PAL.glassl); wins.push([x, y, 18, 14]); }
      R(g, 0, 64, 96, 1, '#404A58');
      R(g, 30, 66, 20, 22, '#7AB8E8'); R(g, 39, 66, 2, 22, '#2C3440'); R(g, 29, 65, 22, 1, '#F8D030');
      door = 2; break;
    }
    case 'sabaude': {
      w = 9; h = 5; top = 14; c = make(w, h, top); g = c.g;
      roofSlope(g, 1, 4, 142, 22, '#6A7A90');
      R(g, 3, 26, 138, 68, '#F0D890'); R(g, 3, 26, 138, 3, '#D8B868');
      // corpo centrale con frontone
      R(g, 52, 18, 40, 76, '#F8E4A8'); for (let i = 0; i < 12; i++) R(g, 52 + i * 2, 18 - i, 40 - i * 4, 1, '#F8F0E0'); ellipse(g, 72, 11, 3, 3, '#3A3A80'); P(g, 72, 11, '#E0B040');
      for (let k = 0; k < 4; k++) { win(8 + k * 11, 34, 6, 10, PAL.wht); win(8 + k * 11, 60, 6, 10, PAL.wht); win(98 + k * 11, 34, 6, 10, PAL.wht); win(98 + k * 11, 60, 6, 10, PAL.wht); }
      win(60, 34, 8, 10, PAL.wht); win(76, 34, 8, 10, PAL.wht);
      R(g, 56, 48, 32, 7, PAL.wht); text3(g, 'RESIDENZE', 55, 49, '#3A3A80');
      doorAt(g, 64, 64 + 0, '#3A4A70', 16, 30);
      door = 4; break;
    }
    case 'archivio': {
      w = 6; h = 4; c = make(w, h, 0); g = c.g;
      roofSlope(g, 1, 2, 94, 22, '#5A6A7A');
      R(g, 3, 24, 90, 40, '#B8885A'); for (let y = 26; y < 64; y += 4) R(g, 3, y, 90, 1, '#9A6A40');
      R(g, 8, 26, 80, 9, '#F0E8D8'); text3(g, 'ARCHIVIO ENZO', 22, 28, '#3A78C0');
      // timone decorativo
      ellipse(g, 18, 46, 6, 6, '#7A4A28'); ellipse(g, 18, 46, 4, 4, '#B8885A'); for (let a = 0; a < 8; a++) { const an = a * Math.PI / 4; P(g, 18 + Math.round(Math.cos(an) * 7), 46 + Math.round(Math.sin(an) * 7), '#7A4A28'); }
      win(70, 40); doorAt(g, 36, 49, '#5A3A20'); door = 2; break;
    }
    case 'ceramica': {
      w = 6; h = 4; c = make(w, h, 0); g = c.g;
      roofSlope(g, 1, 2, 94, 20, '#C86A3A');
      R(g, 3, 22, 90, 42, '#F2DEC4');
      // fascia di maioliche
      for (let x = 3; x < 93; x += 6) { R(g, x, 23, 6, 6, (x / 6) % 2 < 1 ? '#2E6AB0' : '#F0D040'); P(g, x + 2, 25, PAL.wht); P(g, x + 3, 26, PAL.wht); }
      R(g, 6, 31, 84, 8, '#2E6AB0'); text3(g, 'CERAMICA', 32, 33, PAL.wht);
      R(g, 6, 42, 26, 18, '#4A3020'); R(g, 7, 43, 24, 16, PAL.glass); wins.push([7, 43, 24, 16]);
      for (let k = 0; k < 3; k++) { const col = ['#2E6AB0', '#E8B030', '#3A9A6A'][k]; ellipse(g, 12 + k * 8, 54, 3, 4, col); R(g, 11 + k * 8, 48, 3, 2, col); }
      win(68, 44, 18, 12); doorAt(g, 36, 49, '#2E6AB0'); door = 2; break;
    }
    case 'musica': {
      w = 7; h = 5; top = 28; c = make(w, h, top); g = c.g;
      // disco gigante sul tetto
      R(g, 54, 26, 4, 10, '#303038');
      ellipse(g, 56, 22, 22, 22, '#18181E'); for (let r = 8; r < 22; r += 3) for (let a = 0; a < 64; a++) { const an = a / 64 * Math.PI * 2; if ((a + r) % 5) P(g, 56 + Math.round(Math.cos(an) * r), 22 + Math.round(Math.sin(an) * r), '#2A2A34'); }
      ellipse(g, 56, 22, 7, 7, '#D83838'); ellipse(g, 56, 22, 1, 1, '#F8F8F8'); for (let i = 0; i < 6; i++) P(g, 44 + i, 10 + i, '#5A5A6A');
      R(g, 0, top + 6, 112, 74, '#4A3070'); R(g, 0, top + 6, 112, 4, '#6A4A98');
      R(g, 8, top + 14, 96, 10, '#1A1028'); text3(g, 'CASA DELLA MUSICA', 23, top + 17, '#F070C0');
      for (let k = 0; k < 4; k++) { const x = 8 + k * 26; win(x, top + 30, 16, 12, '#2A1A40'); }
      for (let i = 0; i < 6; i++) { P(g, 6 + i * 20, top + 12, ['#F05050', '#50D0F0', '#F0E050'][i % 3]); }
      doorAt(g, 52, top + 58, '#1A1028', 16, 22); R(g, 50, top + 54, 20, 3, '#F070C0');
      door = 3; break;
    }
    case 'tshirt': {
      w = 6; h = 4; top = 14; c = make(w, h, top); g = c.g;
      // insegna a forma di maglietta
      R(g, 34, 0, 28, 18, '#E85848'); R(g, 28, 0, 8, 8, '#E85848'); R(g, 60, 0, 8, 8, '#E85848'); R(g, 43, 0, 10, 3, '#B83030'); text3(g, 'MT', 44, 7, PAL.wht);
      R(g, 0, top + 4, 96, 60, '#F8F8F4'); R(g, 0, top + 4, 96, 4, '#303038');
      R(g, 6, top + 11, 84, 9, '#303038'); text3(g, 'T-SHIRT GRAFICHE', 16, top + 13, '#F0C040');
      R(g, 4, top + 24, 28, 28, '#303038'); R(g, 5, top + 25, 26, 26, PAL.glass); wins.push([5, top + 25, 26, 26]);
      for (let k = 0; k < 3; k++) { const x = 7 + k * 8, col = ['#E85848', '#2E7A4A', '#F0C040'][k]; R(g, x, top + 30, 6, 9, col); R(g, x - 1, top + 30, 8, 3, col); }
      R(g, 64, top + 24, 28, 28, '#303038'); R(g, 65, top + 25, 26, 26, PAL.glass); wins.push([65, top + 25, 26, 26]);
      R(g, 70, top + 30, 14, 16, '#3A70C0'); R(g, 67, top + 30, 20, 4, '#3A70C0');
      doorAt(g, 36, top + 49, '#303038', 16, 15); R(g, 38, top + 51, 12, 10, PAL.glass);
      door = 2; break;
    }
    case 'mappe': {
      w = 6; h = 4; top = 16; c = make(w, h, top); g = c.g;
      // mappamondo sul tetto
      ellipse(g, 74, 10, 9, 9, '#3A78C0'); ellipse(g, 71, 7, 4, 3, '#5AA048'); ellipse(g, 77, 13, 3, 2, '#5AA048'); R(g, 73, 18, 2, 6, '#C8A060');
      roofSlope(g, 1, top + 2, 94, 20, '#3A7A7A');
      R(g, 3, top + 22, 90, 42, '#E8D8A8');
      R(g, 6, top + 25, 84, 9, '#5A4020'); text3(g, 'STUDIO DELLE MAPPE', 12, top + 27, '#F0E0B0');
      // rosa dei venti
      ellipse(g, 18, top + 47, 8, 8, '#F8F0D8'); R(g, 17, top + 39, 2, 16, '#C04040'); R(g, 10, top + 46, 16, 2, '#5A4020'); text3(g, 'N', 16, top + 34, '#C04040');
      win(70, top + 40); doorAt(g, 36, top + 49, '#5A4020'); door = 2; break;
    }
  }
  return { img: outline(c), w, h, top, door, wins };
}

/* =========================================================
   PERSONAGGI  (16x24, 4 direzioni x 3 frame)
   ========================================================= */
function drawCharFrame(g, dir, step, o) {
  const sk = o.skin || '#F8C898', skd = shade(sk, -0.15);
  const hair = o.hair || '#5A3A20', hd = shade(hair, -0.25), hl = shade(hair, 0.3);
  const sh = o.shirt || '#4878D0', shd = shade(sh, -0.25);
  const pa = o.pants || '#384868', pad = shade(pa, -0.25);
  const shoe = o.shoes || '#383038';
  const b = step ? 1 : 0; // bob
  const side = dir === 'right';
  // gambe
  if (!side) {
    const ly = step === 1 ? 1 : 0, ry = step === 2 ? 1 : 0;
    R(g, 5, 19, 2, 2 + ly, pa); R(g, 9, 19, 2, 2 + ry, pa);
    R(g, 5, 21 + ly, 2, 1, shoe); R(g, 9, 21 + ry, 2, 1, shoe);
    if (o.skirt) { R(g, 4, 17 + b, 8, 3, o.skirt); }
  } else {
    if (step === 0) { R(g, 6, 19, 4, 2, pa); R(g, 6, 21, 5, 1, shoe); }
    else if (step === 1) { R(g, 4, 19, 2, 2, pad); R(g, 9, 19, 2, 2, pa); R(g, 3, 21, 3, 1, shoe); R(g, 9, 21, 3, 1, shoe); }
    else { R(g, 6, 19, 2, 2, pad); R(g, 8, 19, 2, 2, pa); R(g, 5, 21, 3, 1, shoe); R(g, 8, 21, 3, 1, shoe); }
    if (o.skirt) R(g, 5, 17 + b, 7, 3, o.skirt);
  }
  g.save(); g.translate(0, b);
  // corpo
  if (!side) {
    R(g, 4, 12, 8, 6, sh); R(g, 11, 12, 1, 6, shd); R(g, 5, 17, 6, 1, pa); R(g, 5, 18, 6, 1, pad);
    const al = step === 1 ? -1 : 0, ar = step === 2 ? -1 : 0;
    R(g, 3, 12, 1, 4 + al, sh); R(g, 12, 12, 1, 4 + ar, shd); P(g, 3, 16 + al, sk); P(g, 12, 16 + ar, sk);
    if (o.collar) { R(g, 6, 12, 4, 1, o.collar); }
    if (o.apron) { R(g, 5, 13, 6, 5, o.apron); }
    if (o.coat) { R(g, 4, 12, 2, 6, o.coat); R(g, 10, 12, 2, 6, o.coat); R(g, 3, 12, 1, 4, o.coat); R(g, 12, 12, 1, 4, o.coat); }
  } else {
    R(g, 5, 12, 6, 6, sh); R(g, 10, 12, 1, 6, shd); R(g, 5, 17, 6, 1, pa); R(g, 5, 18, 6, 1, pad);
    const ax = step === 1 ? 6 : step === 2 ? 9 : 7;
    R(g, ax, 12, 2, 4, shd); P(g, ax, 16, sk); P(g, ax + 1, 16, sk);
    if (o.apron) R(g, 8, 13, 3, 5, o.apron);
    if (o.coat) { R(g, 5, 12, 2, 6, o.coat); }
  }
  // testa
  if (!side) R(g, 4, 5, 8, 7, sk); else R(g, 5, 5, 7, 7, sk);
  if (dir === 'down') {
    P(g, 6, 8, PAL.blk); P(g, 6, 9, PAL.blk); P(g, 9, 8, PAL.blk); P(g, 9, 9, PAL.blk);
    if (o.blush) { P(g, 5, 10, '#F09090'); P(g, 10, 10, '#F09090'); }
    if (o.glasses) { R(g, 5, 8, 3, 2, '#303038'); R(g, 8, 8, 3, 2, '#303038'); P(g, 6, 8, '#A0D0F0'); P(g, 9, 8, '#A0D0F0'); }
    if (o.beard) { R(g, 5, 10, 6, 2, o.beard); P(g, 4, 9, o.beard); P(g, 11, 9, o.beard); }
    if (o.mustache) R(g, 6, 10, 4, 1, o.mustache);
  }
  if (side) {
    P(g, 10, 8, PAL.blk); P(g, 10, 9, PAL.blk); P(g, 12, 9, sk);
    if (o.glasses) { R(g, 9, 8, 3, 2, '#303038'); P(g, 10, 8, '#A0D0F0'); }
    if (o.beard) R(g, 7, 10, 5, 2, o.beard);
    if (o.mustache) R(g, 9, 10, 3, 1, o.mustache);
  }
  // capelli
  const st = o.style || 'short';
  if (dir === 'down') {
    if (st === 'caschetto') { R(g, 3, 3, 10, 5, hair); R(g, 4, 2, 8, 1, hair); R(g, 3, 8, 2, 3, hair); R(g, 11, 8, 2, 3, hair); P(g, 6, 7, sk); P(g, 9, 7, sk); R(g, 5, 3, 4, 1, hl); P(g, 12, 5, hd); }
    else if (st === 'long') { R(g, 3, 3, 10, 4, hair); R(g, 4, 2, 8, 1, hair); R(g, 3, 7, 2, 8, hair); R(g, 11, 7, 2, 8, hair); R(g, 5, 3, 4, 1, hl); }
    else if (st === 'bun') { R(g, 4, 3, 8, 3, hair); R(g, 6, 0, 4, 3, hair); R(g, 3, 5, 1, 3, hair); R(g, 12, 5, 1, 3, hair); P(g, 7, 1, hl); }
    else if (st === 'cap') { R(g, 4, 2, 8, 4, o.cap || PAL.red); R(g, 3, 6, 10, 1, shade(o.cap || PAL.red, -0.3)); R(g, 5, 3, 3, 1, shade(o.cap || PAL.red, 0.3)); }
    else if (st === 'bald') { R(g, 3, 6, 1, 3, hair); R(g, 12, 6, 1, 3, hair); P(g, 6, 5, shade(sk, 0.3)); }
    else if (st === 'curly') { [2, 5, 8, 11, 13].forEach(x => P(g, x, 3, hair)); P(g, 3, 7, hair); P(g, 12, 7, hair); for (let i = 0; i < 6; i++) ellipse(g, 4 + i * 1.6, 4, 1, 1, hair); R(g, 3, 3, 10, 3, hair); P(g, 4, 2, hair); P(g, 7, 2, hair); P(g, 10, 2, hair); P(g, 3, 6, hair); P(g, 12, 6, hair); P(g, 6, 3, hl); }
    else { R(g, 4, 3, 8, 3, hair); R(g, 5, 2, 6, 1, hair); R(g, 3, 4, 1, 4, hair); R(g, 12, 4, 1, 4, hair); R(g, 5, 3, 3, 1, hl); }
  } else if (dir === 'up') {
    if (st === 'cap') { R(g, 4, 2, 8, 6, o.cap || PAL.red); R(g, 4, 8, 8, 4, hair); }
    else if (st === 'bald') { R(g, 3, 7, 10, 4, hair); }
    else {
      R(g, 3, 3, 10, 9, hair); R(g, 4, 2, 8, 1, hair); R(g, 5, 4, 4, 2, hl); R(g, 11, 5, 1, 6, hd);
      if (st === 'long') R(g, 3, 12, 10, 3, hair);
      if (st === 'bun') R(g, 6, 0, 4, 3, hair);
      if (st === 'short' || st === 'curly') { R(g, 4, 11, 8, 1, sk); }
    }
    if (st === 'curly') { [3, 5, 7, 9, 11].forEach(x => P(g, x, 1, hair)); [4, 7, 10].forEach(y => { P(g, 2, y, hair); P(g, 13, y, hair); }); [[5, 4], [9, 6], [6, 8], [10, 9], [8, 3]].forEach(([x, y]) => P(g, x, y, hl)); }
  } else {
    if (st === 'caschetto') { R(g, 4, 3, 9, 5, hair); R(g, 5, 2, 7, 1, hair); R(g, 4, 8, 4, 3, hair); R(g, 9, 7, 3, 1, hair); R(g, 6, 3, 4, 1, hl); }
    else if (st === 'long') { R(g, 4, 3, 9, 4, hair); R(g, 4, 7, 4, 8, hair); R(g, 6, 3, 4, 1, hl); }
    else if (st === 'bun') { R(g, 5, 3, 7, 3, hair); R(g, 3, 2, 3, 4, hair); R(g, 5, 6, 2, 2, hair); }
    else if (st === 'cap') { R(g, 5, 2, 7, 4, o.cap || PAL.red); R(g, 11, 5, 3, 1, shade(o.cap || PAL.red, -0.3)); R(g, 5, 6, 2, 3, hair); }
    else if (st === 'bald') { R(g, 5, 6, 2, 4, hair); }
    else if (st === 'curly') { R(g, 4, 2, 9, 4, hair); R(g, 4, 6, 4, 4, hair); [5, 8, 11].forEach(x => P(g, x, 1, hair)); P(g, 3, 4, hair); P(g, 3, 7, hair); P(g, 12, 6, hair); [[6, 3], [9, 4], [5, 7]].forEach(([x, y]) => P(g, x, y, hl)); }
    else { R(g, 5, 3, 7, 3, hair); R(g, 6, 2, 5, 1, hair); R(g, 5, 6, 2, 3, hair); R(g, 7, 3, 3, 1, hl); }
  }
  if (o.hat === 'priest') { if (dir !== 'up') { R(g, 4, 2, 8, 3, '#202028'); R(g, 2, 5, 12, 1, '#202028'); } }
  if (o.hat === 'chef') { R(g, 4, 0, 8, 4, PAL.wht); R(g, 5, -1, 6, 1, PAL.wht); R(g, 4, 4, 8, 1, '#D8D8D8'); }
  g.restore();
}
function charSheet(o) {
  const dirs = { down: [], up: [], right: [], left: [] };
  ['down', 'up', 'right'].forEach(d => {
    for (let s = 0; s < 3; s++) {
      const c = mk(16, 24); drawCharFrame(c.g, d, s, o); outline(c); dirs[d].push(c);
    }
  });
  dirs.left = dirs.right.map(mirror);
  return dirs;
}
// ombra
const SHADOW = (() => { const c = mk(16, 6); c.g.globalAlpha = 0.28; ellipse(c.g, 8, 3, 6, 2, '#000'); return c; })();

/* =========================================================
   CARDIMON (creature originali, 56x56)
   ========================================================= */
function makeCreature(sp) {
  const S = 56, c = mk(S, S), g = c.g;
  const col = sp.color, d = shade(col, -0.25), l = shade(col, 0.3), belly = sp.belly || shade(col, 0.55);
  const cx = 28, by = 50;
  // coda
  if (sp.tail) { const tc = sp.tailColor || d; for (let i = 0; i < 10; i++) R(g, 40 + i, 38 - i * 1.5, 4, 4, tc); ellipse(g, 51, 22, 4, 4, sp.tailTip || tc); }
  // corpo
  const rx = sp.shape === 'wide' ? 20 : sp.shape === 'tall' ? 13 : 16;
  const ry = sp.shape === 'wide' ? 14 : sp.shape === 'tall' ? 20 : 17;
  const cy = by - ry;
  // orecchie / foglie dietro
  if (sp.leaves) { const lc = sp.leaves; for (let i = -2; i <= 2; i++) { const x = cx + i * 7; for (let k = 0; k < 9; k++) R(g, x - 3 + Math.abs(i), cy - ry + 6 - k, 6 - k * 0.6, 1, k > 6 ? shade(lc, 0.3) : lc); } }
  if (sp.ears) { ellipse(g, cx - rx + 4, cy - ry + 4, 4, 8, d); ellipse(g, cx + rx - 4, cy - ry + 4, 4, 8, d); ellipse(g, cx - rx + 4, cy - ry + 5, 2, 5, sp.earIn || l); ellipse(g, cx + rx - 4, cy - ry + 5, 2, 5, sp.earIn || l); }
  if (sp.antenna) { R(g, cx - 1, cy - ry - 8, 2, 10, PAL.ol); ellipse(g, cx, cy - ry - 9, 3, 3, sp.antenna); }
  ellipse(g, cx, cy, rx, ry, d);
  ellipse(g, cx - 1, cy - 1, rx - 2, ry - 2, col);
  ellipse(g, cx - 5, cy - ry / 2, rx / 3, ry / 5, l);
  if (sp.bellyOn !== false) ellipse(g, cx, cy + ry / 3, rx / 2, ry / 3, belly);
  // squame da carciofo
  if (sp.scales) { for (let r = 0; r < 3; r++) for (let k = -2; k <= 2; k++) { const x = cx + k * 6 + (r % 2) * 3, y = cy + r * 6 - 2; if ((x - cx) ** 2 / (rx * rx) + (y - cy) ** 2 / (ry * ry) < 0.7) { R(g, x - 2, y, 5, 1, d); P(g, x, y - 1, sp.scales); } } }
  // piedi
  ellipse(g, cx - rx / 2, by - 1, 5, 3, d); ellipse(g, cx + rx / 2, by - 1, 5, 3, d);
  // braccia
  ellipse(g, cx - rx, cy + 3, 3, 5, d); ellipse(g, cx + rx, cy + 3, 3, 5, d);
  // occhi
  const ey = cy - ry / 4, ex = 6;
  if (sp.eyes === 'sleepy') { R(g, cx - ex - 3, ey, 6, 2, PAL.blk); R(g, cx + ex - 3, ey, 6, 2, PAL.blk); }
  else {
    ellipse(g, cx - ex, ey, 3, 4, PAL.wht); ellipse(g, cx + ex, ey, 3, 4, PAL.wht);
    ellipse(g, cx - ex + 1, ey + 1, 2, 2, PAL.blk); ellipse(g, cx + ex + 1, ey + 1, 2, 2, PAL.blk);
    P(g, cx - ex, ey - 1, PAL.wht); P(g, cx + ex, ey - 1, PAL.wht);
  }
  if (sp.glasses) { R(g, cx - ex - 5, ey - 4, 10, 1, PAL.ol); R(g, cx + ex - 5, ey - 4, 10, 1, PAL.ol); R(g, cx - ex - 5, ey + 4, 10, 1, PAL.ol); R(g, cx + ex - 5, ey + 4, 10, 1, PAL.ol); R(g, cx - 1, ey, 2, 1, PAL.ol); R(g, cx - ex - 5, ey - 4, 1, 8, PAL.ol); R(g, cx + ex + 4, ey - 4, 1, 8, PAL.ol); }
  // bocca
  R(g, cx - 2, ey + 6, 5, 1, PAL.ol); P(g, cx - 3, ey + 5, PAL.ol); P(g, cx + 3, ey + 5, PAL.ol);
  if (sp.blush !== false) { R(g, cx - ex - 4, ey + 4, 3, 2, '#F09090'); R(g, cx + ex + 2, ey + 4, 3, 2, '#F09090'); }
  // accessori
  const acc = sp.acc;
  if (acc === 'pencil') { for (let i = 0; i < 12; i++) R(g, cx + rx + 1 + i * 0.5, cy - 2 - i, 3, 2, PAL.yel); R(g, cx + rx + 6, cy - 15, 2, 3, '#F8C8A0'); P(g, cx + rx + 7, cy - 16, PAL.ol); }
  if (acc === 'brush') { R(g, cx + rx, cy - 12, 2, 16, PAL.woodd); ellipse(g, cx + rx + 1, cy - 14, 2, 3, sp.brushColor || PAL.red); }
  if (acc === 'pin') { ellipse(g, cx, cy - ry - 7, 5, 5, PAL.red); ellipse(g, cx, cy - ry - 7, 2, 2, PAL.wht); for (let i = 0; i < 5; i++) R(g, cx - 2 + i * 0.5, cy - ry - 3 + i, 4 - i, 1, PAL.red); }
  if (acc === 'camera') { R(g, cx - 8, cy + 2, 16, 10, '#303038'); ellipse(g, cx, cy + 7, 3, 3, '#80C0F0'); R(g, cx + 3, cy, 4, 2, '#303038'); }
  if (acc === 'cube') { R(g, cx + rx - 2, cy - 18, 10, 10, '#80C0F0'); R(g, cx + rx - 2, cy - 18, 10, 3, '#B0E0FA'); R(g, cx + rx + 5, cy - 18, 3, 10, '#5090C8'); }
  if (acc === 'wifi') { for (let r = 3; r <= 9; r += 3) { for (let a = -6; a <= 6; a++) { const an = -Math.PI / 2 + a * 0.12; P(g, cx + Math.round(Math.cos(an) * r), cy - ry - 2 + Math.round(Math.sin(an) * r), sp.wifi || PAL.wht); } } }
  if (acc === 'book') { R(g, cx - 7, cy + 2, 14, 10, '#3A5AB0'); R(g, cx - 6, cy + 3, 12, 8, PAL.wht); R(g, cx, cy + 3, 1, 8, '#3A5AB0'); }
  if (acc === 'leaf') { ellipse(g, cx + 6, cy - ry - 3, 5, 3, PAL.leafl); R(g, cx + 1, cy - ry - 3, 10, 1, PAL.leafd); R(g, cx, cy - ry - 2, 2, 4, PAL.leafd); }
  if (acc === 'satellite') { R(g, cx - 4, cy - ry - 10, 8, 6, '#C0C0C8'); R(g, cx - 14, cy - ry - 9, 9, 4, '#3060B0'); R(g, cx + 5, cy - ry - 9, 9, 4, '#3060B0'); R(g, cx, cy - ry - 4, 1, 4, PAL.ol); }
  if (acc === 'note') { R(g, cx + rx + 2, cy - 18, 2, 12, PAL.ol); ellipse(g, cx + rx, cy - 6, 3, 2, PAL.ol); R(g, cx + rx + 2, cy - 18, 6, 2, PAL.ol); }
  if (acc === 'flag') { R(g, cx + rx, cy - 20, 1, 22, PAL.ol); R(g, cx + rx + 1, cy - 20, 4, 8, '#3050A0'); R(g, cx + rx + 5, cy - 20, 4, 8, PAL.wht); R(g, cx + rx + 9, cy - 20, 4, 8, PAL.red); }
  if (acc === 'mag') { ellipse(g, cx + rx + 2, cy - 10, 5, 5, PAL.ol); ellipse(g, cx + rx + 2, cy - 10, 4, 4, '#C0E8FA'); R(g, cx + rx - 4, cy - 4, 2, 6, PAL.woodd); }
  if (acc === 'coin') { ellipse(g, cx + rx + 3, cy - 10, 5, 5, PAL.yeld); ellipse(g, cx + rx + 3, cy - 10, 4, 4, PAL.yel); R(g, cx + rx + 2, cy - 13, 2, 6, PAL.yeld); }
  return outline(c);
}

/* Carciofball: la sfera da lancio (un carciofo stilizzato) */
const BALL = (() => {
  const c = mk(12, 12), g = c.g;
  ellipse(g, 6, 7, 5, 5, '#5E8A58'); ellipse(g, 6, 6, 4, 4, '#7EA070');
  R(g, 3, 6, 6, 1, '#4E7A4E'); R(g, 4, 8, 4, 1, '#4E7A4E'); P(g, 6, 2, '#9A6AA8'); P(g, 5, 3, '#B080C0'); P(g, 7, 3, '#9A6AA8'); R(g, 5, 11, 2, 1, '#4E7A4E');
  return outline(c);
})();

/* icone progetto 16x16 per menu */
function icon(kind) {
  const c = mk(16, 16), g = c.g;
  switch (kind) {
    case 'kebab': R(g, 7, 1, 2, 14, '#707078'); for (let y = 3; y < 13; y++) { const w = 4 - Math.abs(y - 8) / 2; R(g, 8 - w, y, w * 2, 1, y % 2 ? '#B87040' : '#985830'); } break;
    case 'jar': R(g, 4, 3, 8, 12, '#D83828'); R(g, 5, 1, 6, 2, '#E0B040'); R(g, 4, 7, 8, 4, '#F8F0E0'); P(g, 5, 4, PAL.wht); break;
    case 'stage': R(g, 1, 10, 14, 5, PAL.woodd); R(g, 1, 2, 14, 2, '#303038'); R(g, 1, 2, 2, 8, '#303038'); R(g, 13, 2, 2, 8, '#303038'); R(g, 3, 4, 4, 6, PAL.red); R(g, 9, 4, 4, 6, PAL.red); P(g, 8, 5, PAL.yel); break;
    case 'passport': R(g, 3, 1, 10, 14, '#3A3A80'); ellipse(g, 8, 6, 2, 2, '#E0B040'); R(g, 5, 10, 6, 1, '#E0B040'); break;
    case 'land': R(g, 1, 10, 14, 5, PAL.soil); R(g, 7, 4, 2, 6, PAL.leafd); ellipse(g, 5, 5, 2, 1, PAL.leaf); ellipse(g, 11, 4, 2, 1, PAL.leafl); break;
    case 'boat': for (let y = 0; y < 5; y++) R(g, 2 + y, 9 + y, 12 - y * 2, 1, y === 0 || y === 2 ? PAL.wht : '#D8282C'); R(g, 11, 2, 1, 7, '#D8A868'); R(g, 3, 5, 8, 1, PAL.wht); R(g, 4, 6, 1, 3, '#D8A868'); R(g, 9, 6, 1, 3, '#D8A868'); R(g, 0, 8, 2, 2, '#2A3A90'); break;
    case 'mega': R(g, 2, 6, 3, 4, '#F8D030'); for (let i = 0; i < 8; i++) R(g, 5 + i, 6 - i / 2, 1, 4 + i, '#F8D030'); R(g, 2, 10, 2, 4, '#2C3440'); break;
    case 'note': R(g, 10, 2, 2, 9, PAL.ol); ellipse(g, 8, 11, 3, 2, PAL.ol); R(g, 10, 2, 4, 2, PAL.ol); break;
    case 'tomb': R(g, 4, 3, 8, 12, '#9CA0A8'); R(g, 7, 5, 2, 6, '#5C6068'); R(g, 5, 7, 6, 2, '#5C6068'); break;
    case 'cards': R(g, 2, 3, 8, 11, PAL.wht); R(g, 6, 2, 8, 11, '#F8F0E0'); P(g, 4, 5, PAL.red); P(g, 11, 6, PAL.blk); break;
    case 'globe': ellipse(g, 8, 8, 6, 6, '#3A78C0'); ellipse(g, 6, 6, 2, 2, PAL.leaf); ellipse(g, 10, 10, 2, 1, PAL.leaf); break;
  }
  return outline(c);
}

/* KIRA, shiba inu bianca (16x16, 4 direzioni x 2 passi) */
function kiraSheet() {
  const W = '#FAF6EE', S = '#E2D8C6', N = '#202020', IN = '#F0B8A8';
  function fr(dir, st) {
    const c = mk(16, 16), g = c.g, l = st ? 1 : 0;
    if (dir === 'right') {
      ellipse(g, 7, 10, 5, 3, W); R(g, 4, 12, 7, 1, S);
      R(g, 3, 12 + l, 2, 3 - l, W); R(g, 6, 12, 2, 3, S); R(g, 9, 13 - l, 2, 2 + l, W); R(g, 11, 12, 1, 3, S);
      ellipse(g, 12, 7, 3, 3, W); R(g, 13, 7, 3, 2, W); P(g, 15, 7, N); P(g, 12, 6, N);
      R(g, 10, 2, 2, 3, W); P(g, 11, 3, IN); R(g, 13, 3, 1, 2, W);
      ellipse(g, 2, 6, 2, 2, W); P(g, 2, 6, S); R(g, 2, 7, 2, 2, W);
    } else if (dir === 'down') {
      ellipse(g, 8, 11, 4, 3, W); R(g, 5, 13, 2, 2 - l, W); R(g, 9, 13, 2, 1 + l, W);
      ellipse(g, 8, 6, 4, 3, W); R(g, 4, 2, 2, 3, W); R(g, 10, 2, 2, 3, W); P(g, 5, 3, IN); P(g, 10, 3, IN);
      P(g, 6, 6, N); P(g, 10, 6, N); P(g, 8, 8, N); ellipse(g, 13, 9, 2, 2, W);
    } else {
      ellipse(g, 8, 11, 4, 3, W); R(g, 5, 13, 2, 2 - l, W); R(g, 9, 13, 2, 1 + l, W);
      ellipse(g, 8, 6, 4, 3, S); R(g, 4, 2, 2, 3, S); R(g, 10, 2, 2, 3, S);
      ellipse(g, 8, 10, 2, 2, W); P(g, 8, 10, S);
    }
    return outline(c);
  }
  const out = {};
  ['down', 'up', 'right'].forEach(d => out[d] = [fr(d, 0), fr(d, 1)]);
  out.left = out.right.map(mirror);
  return out;
}
