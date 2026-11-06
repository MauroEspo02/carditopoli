/* =========================================================
   CARDITOPOLI — game.js
   Motore: input, scene, mondo, dialoghi, menu, lotta, salvataggi.
   ========================================================= */
'use strict';

const cv = document.getElementById('cv');
const ctx = cv.getContext('2d');
ctx.imageSmoothingEnabled = false;
const UI = document.getElementById('ui');
const QS = new URLSearchParams(location.search);

/* ---------------- utilità DOM ---------------- */
function el(tag, cls, html) { const e = document.createElement(tag); if (cls) e.className = cls; if (html != null) e.innerHTML = html; return e; }
function css(e, o) { Object.assign(e.style, o); return e; }
function px(n) { return n + 'px'; }
const IMGURL = new Map();
function url(c) { if (!IMGURL.has(c)) IMGURL.set(c, c.toDataURL()); return IMGURL.get(c); }
function esc(s) { return String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c])); }
const rnd = a => a[(Math.random() * a.length) | 0];
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

/* ---------------- scala dello schermo ---------------- */
const isTouch = matchMedia('(pointer: coarse)').matches || QS.has('touch');
if (isTouch) document.body.classList.add('touch');
function fit() {
  const land = innerWidth > innerHeight;
  let aw = innerWidth - 16, ah = innerHeight - 70;
  if (isTouch) { if (land) aw = innerWidth - 330; else ah = innerHeight - 240; }
  let s = Math.min(aw / 240, ah / 160);
  s = s >= 2 ? Math.floor(s) : Math.max(1, s);
  document.documentElement.style.setProperty('--s', s);
}
addEventListener('resize', fit); fit();

/* ---------------- input ---------------- */
const Input = (() => {
  const held = {}, just = new Set(); let dirs = [];
  const KEYS = { ArrowUp: 'up', ArrowDown: 'down', ArrowLeft: 'left', ArrowRight: 'right', KeyZ: 'a', KeyA: 'a', Space: 'a', KeyJ: 'a', KeyX: 'b', KeyS: 'b', Backspace: 'b', Escape: 'b', KeyK: 'b', Enter: 'start', ShiftLeft: 'select', ShiftRight: 'select' };
  const DIRS = ['up', 'down', 'left', 'right'];
  function press(b) { if (!held[b]) { just.add(b); if (DIRS.includes(b)) { dirs = dirs.filter(d => d !== b); dirs.push(b); } } held[b] = true; Sound.init(); }
  function release(b) { held[b] = false; dirs = dirs.filter(d => d !== b); }
  addEventListener('keydown', e => {
    if (e.code === 'KeyM' && !e.repeat) { Game.toggleMusic(); return; }
    const b = KEYS[e.code]; if (!b) return; e.preventDefault(); if (e.repeat) return; press(b);
  });
  addEventListener('keyup', e => { const b = KEYS[e.code]; if (b) release(b); });
  addEventListener('blur', () => Object.keys(held).forEach(release));
  // croce direzionale: un solo elemento, si può far scorrere il dito
  const dp = document.querySelector('.dpad'); let dpDir = null;
  const dpBtn = d => dp.querySelector('.' + d);
  function dpSet(d) {
    if (d === dpDir) return;
    if (dpDir) { release(dpDir); dpBtn(dpDir).classList.remove('on'); }
    dpDir = d; if (d) { press(d); dpBtn(d).classList.add('on'); if (navigator.vibrate) navigator.vibrate(6); }
  }
  function dpFrom(e) {
    const r = dp.getBoundingClientRect(), x = e.clientX - (r.left + r.width / 2), y = e.clientY - (r.top + r.height / 2);
    if (Math.hypot(x, y) < r.width * 0.12) return dpDir;
    return Math.abs(x) > Math.abs(y) ? (x > 0 ? 'right' : 'left') : (y > 0 ? 'down' : 'up');
  }
  if (dp) {
    dp.addEventListener('pointerdown', e => { e.preventDefault(); dp.setPointerCapture(e.pointerId); dpSet(dpFrom(e)); });
    dp.addEventListener('pointermove', e => { if (dpDir) { e.preventDefault(); dpSet(dpFrom(e)); } });
    const end = e => { e.preventDefault(); dpSet(null); };
    dp.addEventListener('pointerup', end); dp.addEventListener('pointercancel', end); dp.addEventListener('lostpointercapture', () => dpSet(null));
    dp.addEventListener('contextmenu', e => e.preventDefault());
  }
  document.querySelectorAll('.pad [data-btn]:not(.d)').forEach(bt => {
    const b = bt.dataset.btn;
    const on = e => { e.preventDefault(); bt.classList.add('on'); press(b); if (navigator.vibrate) navigator.vibrate(8); };
    const off = e => { e.preventDefault(); bt.classList.remove('on'); release(b); };
    bt.addEventListener('pointerdown', e => { bt.setPointerCapture(e.pointerId); on(e); }); bt.addEventListener('pointerup', off); bt.addEventListener('pointercancel', off); bt.addEventListener('lostpointercapture', off);
    bt.addEventListener('contextmenu', e => e.preventDefault());
  });
  // gamepad
  const prev = {};
  function poll() {
    const pads = navigator.getGamepads ? navigator.getGamepads() : [];
    const p = pads && [...pads].find(x => x); if (!p) return;
    const st = {
      a: p.buttons[0]?.pressed, b: p.buttons[1]?.pressed || p.buttons[2]?.pressed, start: p.buttons[9]?.pressed, select: p.buttons[8]?.pressed,
      up: p.buttons[12]?.pressed || p.axes[1] < -0.5, down: p.buttons[13]?.pressed || p.axes[1] > 0.5,
      left: p.buttons[14]?.pressed || p.axes[0] < -0.5, right: p.buttons[15]?.pressed || p.axes[0] > 0.5,
    };
    for (const k in st) { if (st[k] && !prev[k]) press(k); if (!st[k] && prev[k]) release(k); prev[k] = st[k]; }
  }
  const hold = {};
  function repeat() { // ripetizione automatica delle direzioni nei menu
    const out = [];
    for (const d of DIRS) { if (held[d]) { hold[d] = (hold[d] || 0) + 1; if (hold[d] > 20 && hold[d] % 5 === 0) out.push(d); } else hold[d] = 0; }
    return out;
  }
  return { held, just: b => just.has(b), dir: () => dirs[dirs.length - 1] || null, end() { just.clear(); }, poll, repeat, tap(b) { press(b); setTimeout(() => release(b), 30); } };
})();

/* ---------------- stato e salvataggi ---------------- */
const SAVE_KEY = 'carditopoli-save-v1', OPT_KEY = 'carditopoli-opt-v1';
const store = {
  get(k) { try { return JSON.parse(localStorage.getItem(k)); } catch (e) { return null; } },
  set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); return true; } catch (e) { return false; } },
  del(k) { try { localStorage.removeItem(k); } catch (e) { } },
};
const OPT = Object.assign({ music: true, sfx: true, speed: 2, time: 'auto' }, store.get(OPT_KEY) || {});
Sound.setMusic(OPT.music); Sound.setSfx(OPT.sfx);
function saveOpt() { store.set(OPT_KEY, OPT); }
function freshState() { return { map: 'casa', x: 3, y: 4, dir: 'down', flags: {}, caught: [], seen: [], badges: [], extras: [], time: 0 }; }
let S = freshState();

/* ---------------- loop, attese, animazioni ---------------- */
let frame = 0;
const waits = [], tweens = [];
const wait = f => new Promise(r => waits.push({ f, r }));
const tween = (f, fn) => new Promise(r => tweens.push({ f, t: 0, fn, r }));

/* ---------------- livelli UI (stack) ---------------- */
const Layers = [];
function pushLayer(l) { Layers.push(l); if (l.el && !l.el.parentNode) UI.insertBefore(l.el, fadeEl); return l; }
function popLayer(l) { const i = Layers.indexOf(l); if (i >= 0) Layers.splice(i, 1); if (l.el) l.el.remove(); }

function paginate(t) {
  if (t.length <= 115) return [t];
  const out = []; let s = t;
  while (s.length > 115) {
    let cut = s.lastIndexOf('. ', 110); if (cut < 50) cut = s.lastIndexOf(' ', 110); else cut += 1;
    out.push(s.slice(0, cut).trim()); s = s.slice(cut).trim();
  }
  if (s) out.push(s); return out;
}

/* dialogo con effetto macchina da scrivere */
function say(lines, opt = {}) {
  return new Promise(res => {
    lines = (Array.isArray(lines) ? lines : [lines]).flatMap(paginate);
    const box = el('div', 'box dlg' + (opt.battle ? ' battle' : '') + (opt.half ? ' half' : ''));
    const tx = el('div'), ar = el('div', 'darr', '▼'); box.append(tx, ar);
    let i = 0, shown = 0, txt = '';
    const L = {
      el: box,
      update() {
        if (shown < txt.length) { shown = Math.min(txt.length, shown + [1, 2, 4][OPT.speed - 1]); tx.textContent = txt.slice(0, shown); }
        ar.style.visibility = shown >= txt.length && !opt.keep && ((frame >> 4) & 1) ? 'visible' : 'hidden';
        if (opt.auto && shown >= txt.length) { if (++L.t > opt.auto) next(); }
      },
      t: 0,
      input(b) {
        if (!['a', 'b', 'start'].includes(b) || opt.keep) return;
        if (shown < txt.length) { shown = txt.length; tx.textContent = txt; } else next();
      },
    };
    function show() { txt = lines[i]; shown = 0; L.t = 0; tx.textContent = ''; }
    function next() { i++; if (i >= lines.length) { if (!opt.keep) popLayer(L); res(L); } else { Sound.sfx('select'); show(); } }
    box.onclick = () => L.input('a');
    show(); pushLayer(L);
    if (opt.keep) { // il testo resta (per domande con scelta)
      shown = 0; const iv = () => { if (shown >= txt.length) res(L); else requestAnimationFrame(iv); }; iv();
    }
  });
}

/* menu generico: ritorna l'indice scelto o -1 */
function menu(items, opt = {}) {
  return new Promise(res => {
    const box = el('div', 'box menu' + (opt.cols ? ' grid' : '') + (opt.cls ? ' ' + opt.cls : ''));
    css(box, opt.pos || { right: '4px', top: '4px' });
    let sel = opt.start || 0;
    const rows = items.map((t, i) => { const r = el('div', 'it', esc(t)); r.onclick = () => { sel = i; draw(); pick(); }; box.appendChild(r); return r; });
    let descEl = null; if (opt.desc) { descEl = el('div', 'desc'); box.appendChild(descEl); }
    const cols = opt.cols || 1;
    function draw() { rows.forEach((r, i) => r.classList.toggle('sel', i === sel)); if (descEl) descEl.textContent = opt.desc[sel] || ''; }
    function pick() { Sound.sfx('select'); popLayer(L); res(sel); }
    const L = {
      el: box,
      input(b) {
        const n = items.length;
        if (b === 'up') sel = (sel - cols + n) % n; else if (b === 'down') sel = (sel + cols) % n;
        else if (b === 'left' && cols > 1) sel = (sel - 1 + n) % n; else if (b === 'right' && cols > 1) sel = (sel + 1) % n;
        else if (b === 'start' && opt.startBack) { Sound.sfx('back'); popLayer(L); return res(-1); }
        else if (b === 'a' || b === 'start') return pick();
        else if (b === 'b') { if (opt.noBack) return; Sound.sfx('back'); popLayer(L); return res(-1); }
        else return;
        Sound.sfx('talk'); draw();
      },
    };
    draw(); pushLayer(L);
  });
}
async function ask(q, opts = ['SÌ', 'NO'], o = {}) {
  const d = await say(q, Object.assign({ keep: true }, o));
  const r = await menu(opts, { pos: o.battle ? { right: '4px', bottom: '52px' } : { right: '4px', bottom: '50px' } });
  popLayer(d);
  return r;
}

/* banner del luogo */
let bannerEl = null, bannerT = 0;
function banner(txt) {
  if (!bannerEl) { bannerEl = el('div', 'banner'); UI.insertBefore(bannerEl, fadeEl); }
  bannerEl.textContent = txt; bannerEl.classList.add('on'); bannerT = 150;
}
function toast(txt, f = 120) { const t = el('div', 'toast', esc(txt)); UI.appendChild(t); setTimeout(() => t.remove(), f * 16); }

/* dissolvenza */
const fadeEl = el('div', 'fade'); UI.appendChild(fadeEl); let fadeV = 1;
function setFade(v) { fadeV = v; fadeEl.style.opacity = v; }
function fadeTo(v, f = 14) { const s = fadeV; return tween(f, t => setFade(s + (v - s) * t)); }

/* ---------------- risorse grafiche ---------------- */
let SHEETS = {}, CRE = {}, CRE_W = {}, ICONS = {}, MAURO_BACK;
function sheet(look) { if (!SHEETS[look]) SHEETS[look] = charSheet(LOOKS[look]); return SHEETS[look]; }
function silhouette(c, col) { const m = mk(c.width, c.height); m.g.drawImage(c, 0, 0); m.g.globalCompositeOperation = 'source-in'; R(m.g, 0, 0, c.width, c.height, col); return m; }
function initGfx() {
  buildTiles(); buildProps(); buildWorld();
  CREATURES.forEach(sp => { CRE[sp.id] = makeCreature(sp); CRE_W[sp.id] = silhouette(CRE[sp.id], '#FFFFFF'); });
  ['kebab', 'jar', 'stage', 'passport', 'land', 'boat', 'mega', 'note', 'tomb', 'cards', 'globe'].forEach(k => ICONS[k] = icon(k));
  MAURO_BACK = scaleCanvas(sheet('mauro').up[0], 3);
}

/* =========================================================
   MONDO
   ========================================================= */
let MAP = null, solid = null, NPCS = [];
const PL = { qa: 0, qs: 0, still: 9, x: 0, y: 0, px: 0, py: 0, dir: 'down', moving: false, tx: 0, ty: 0, tiles: 0, turn: 0, bumpT: 0 };
let busy = 0, zoneName = '';
const DV = { up: [0, -1], down: [0, 1], left: [-1, 0], right: [1, 0] };
const OPP = { up: 'down', down: 'up', left: 'right', right: 'left' };

function buildSolid(m) {
  const s = new Uint8Array(m.w * m.h);
  for (let y = 0; y < m.h; y++) for (let x = 0; x < m.w; x++) { const t = TILES[m.t[y][x]]; if (t && t.solid) s[y * m.w + x] = 1; }
  m.objs.forEach(o => { if (!o.solid) return; for (let j = 0; j < o.h; j++) for (let i = 0; i < o.w; i++) { const x = o.x + i, y = o.y + j; if (x >= 0 && y >= 0 && x < m.w && y < m.h) s[y * m.w + x] = 1; } });
  Object.keys(m.warps).forEach(k => { const [x, y] = k.split(',').map(Number); s[y * m.w + x] = 0; });
  m.objs.forEach(o => { if (o.flat === undefined) o.flat = !o.solid && o.kind === 'prop'; });
  return s;
}
function loadMap(id, x, y, dir) {
  MAP = MAPS[id]; S.map = id;
  if (!MAP.solidGrid) MAP.solidGrid = buildSolid(MAP);
  solid = MAP.solidGrid;
  if (!MAP.rt) MAP.rt = MAP.npcs.map(d => ({ d, x: d.x, y: d.y, px: d.x * 16, py: d.y * 16, dir: d.dir, moving: false, tx: d.x, ty: d.y, tiles: 0, timer: 60 + Math.random() * 120 }));
  NPCS = MAP.rt;
  Object.assign(PL, { x, y, px: x * 16, py: y * 16, dir: dir || 'down', moving: false, tx: x, ty: y });
  zoneName = '';
  if (MAP.outdoor) updateZone(); else banner(MAP.name);
  Sound.play(MAP.music);
}
function blocked(x, y, self) {
  if (x < 0 || y < 0 || x >= MAP.w || y >= MAP.h) return true;
  if (solid[y * MAP.w + x]) return true;
  for (const n of NPCS) if (n !== self && ((n.x === x && n.y === y) || (n.tx === x && n.ty === y))) return true;
  if (self !== PL && ((PL.x === x && PL.y === y) || (PL.tx === x && PL.ty === y))) return true;
  return false;
}
function tileAt(x, y) { return MAP.t[y] && MAP.t[y][x]; }
function updateZone() {
  if (!MAP.zones) return;
  const z = MAP.zones.find(([x0, y0, x1, y1]) => PL.x >= x0 && PL.x <= x1 && PL.y >= y0 && PL.y <= y1);
  const n = z ? z[4] : 'CARDITOPOLI';
  if (n !== zoneName) { zoneName = n; banner(n); }
}
function canAct() { return Layers.length === 0 && busy === 0 && scene === 'world'; }

function updatePlayer() {
  const run = Input.held.b && canAct();
  const spd = run ? 4 : 2;
  if (canAct() || PL.moving) { if (Input.just('a')) PL.qa = 6; if (Input.just('start')) PL.qs = 6; }
  if (PL.qa > 0) PL.qa--; if (PL.qs > 0) PL.qs--;
  if (PL.moving) {
    const tx = PL.tx * 16, ty = PL.ty * 16;
    PL.px += Math.sign(tx - PL.px) * Math.min(spd, Math.abs(tx - PL.px));
    PL.py += Math.sign(ty - PL.py) * Math.min(spd, Math.abs(ty - PL.py));
    if (PL.px === tx && PL.py === ty) { PL.moving = false; PL.x = PL.tx; PL.y = PL.ty; PL.tiles++; onStep(); }
    return;
  }
  if (!canAct()) { PL.still = 0; return; }
  if (PL.qs > 0) { PL.qs = 0; PL.qa = 0; Sound.sfx('select'); mainMenu(); return; }
  if (PL.qa > 0) { PL.qa = 0; interact(); return; }
  const d = Input.dir();
  if (!d) { PL.turn = 0; PL.still++; return; }
  // da fermo: un tocco breve gira il personaggio, tenendo premuto cammina
  if (d !== PL.dir && PL.still > 1 && !PL.turn) { PL.dir = d; PL.turn = 5; return; }
  if (PL.turn > 1 && Input.held[d]) { PL.turn--; return; }
  PL.turn = 0; PL.still = 0;
  PL.dir = d;
  const [dx, dy] = DV[d], nx = PL.x + dx, ny = PL.y + dy;
  // uscita dagli interni: tappetino + giù
  if (!MAP.outdoor && tileAt(PL.x, PL.y) === 'M' && d === 'down') { exitRoom(); return; }
  if (blocked(nx, ny, PL)) {
    if (PL.bumpT <= 0) { Sound.sfx('bump'); PL.bumpT = 18; } PL.bumpT--; return;
  }
  PL.tx = nx; PL.ty = ny; PL.moving = true;
}
async function onStep() {
  const w = MAP.warps[PL.x + ',' + PL.y];
  if (w && w.enter) { await enterRoom(w.to); return; }
  if (!MAP.outdoor && tileAt(PL.x, PL.y) === 'M' && Input.held.down) { await exitRoom(); return; }
  if (MAP.outdoor) updateZone();
  if (tileAt(PL.x, PL.y) === '"') {
    Sound.sfx('grass');
    if (MAP.encounter && !S.flags.balls) {
      busy++;
      await say(['PROFESSOR BIAGIO: Ehi, MAURO! Aspetta!', 'Nell\'erba alta vivono i CARDIMON, e ognuno è una tua competenza!', 'Tieni queste CARCIOFBALL: lanciale per catturarli e registrarli nel CARDIDEX.']);
      S.flags.balls = true; Sound.jingle('catch');
      await say(['MAURO ha ricevuto 99 CARCIOFBALL!', 'Ora cammina nell\'erba alta: i CARDIMON non tarderanno a farsi vedere!']);
      autosave(); busy--; return;
    }
    if (MAP.encounter && Math.random() < 0.14) await encounter();
  }
}
async function enterRoom(id) {
  busy++; Sound.sfx('door'); await fadeTo(1, 10);
  const m = MAPS[id];
  loadMap(id, m.mat[0], m.mat[1] - 1, 'up');
  autosave();
  await fadeTo(0, 10); busy--;
}
async function exitRoom() {
  busy++; Sound.sfx('exit'); await fadeTo(1, 10);
  const b = MAP.back;
  loadMap('town', b[0], b[1] + 1, 'down');
  await fadeTo(0, 10); busy--;
}

function updateNpcs() {
  for (const n of NPCS) {
    if (n.moving) {
      const tx = n.tx * 16, ty = n.ty * 16;
      n.px += Math.sign(tx - n.px); n.py += Math.sign(ty - n.py);
      if (n.px === tx && n.py === ty) { n.moving = false; n.x = n.tx; n.y = n.ty; n.tiles++; }
      continue;
    }
    if (!n.d.wander || n.talking || Layers.length) continue;
    if (--n.timer > 0) continue;
    n.timer = 90 + Math.random() * 180;
    const d = rnd(['up', 'down', 'left', 'right']); n.dir = d;
    const [dx, dy] = DV[d], nx = n.x + dx, ny = n.y + dy;
    if (Math.abs(nx - n.d.home[0]) > n.d.wander || Math.abs(ny - n.d.home[1]) > n.d.wander) continue;
    if (blocked(nx, ny, n) || tileAt(nx, ny) === '"' && false) continue;
    n.tx = nx; n.ty = ny; n.moving = true;
  }
}

async function interact() {
  const [dx, dy] = DV[PL.dir], fx = PL.x + dx, fy = PL.y + dy;
  const n = NPCS.find(n => n.x === fx && n.y === fy && !n.moving);
  busy++;
  try {
    if (n) {
      n.talking = true; const old = n.dir; n.dir = OPP[PL.dir];
      Sound.sfx('select');
      if (typeof n.d.talk === 'function') await n.d.talk(); else await say(n.d.talk);
      n.talking = false; if (!n.d.wander) n.dir = n.d.keepFacing ? old : n.dir;
      return;
    }
    const o = MAP.objs.find(o => o.act && fx >= o.x && fx < o.x + o.w && fy >= o.y && fy < o.y + o.h);
    if (o) {
      Sound.sfx('select');
      if (typeof o.act === 'function') await o.act(); else await say(o.act);
    }
  } finally { busy--; }
}

/* ---------------- disegno del mondo ---------------- */
const GRASSY = new Set(['.', 'f', '"', 'F']);
function drawEdges(g, ch, x, y, sx, sy) {
  const nb = [[0, -1, 'u'], [0, 1, 'd'], [-1, 0, 'l'], [1, 0, 'r']];
  if (ch === '=' || ch === '#') {
    for (const [dx, dy, s] of nb) {
      const n = tileAt(x + dx, y + dy); if (!GRASSY.has(n)) continue;
      for (let i = 0; i < 16; i++) {
        const h = 1 + ((hash2(x * 16 + i, y) >> 3) % 3 === 0 ? 1 : 0);
        if (s === 'u') { R(g, sx + i, sy, 1, h, PAL.g); P(g, sx + i, sy + h, PAL.pdd); }
        if (s === 'd') { R(g, sx + i, sy + 16 - h, 1, h, PAL.g); }
        if (s === 'l') { R(g, sx, sy + i, h, 1, PAL.g); P(g, sx + h, sy + i, PAL.pdd); }
        if (s === 'r') { R(g, sx + 16 - h, sy + i, h, 1, PAL.g); }
      }
    }
  } else if (ch === '~') {
    for (const [dx, dy, s] of nb) {
      const n = tileAt(x + dx, y + dy); if (!n || n === '~') continue;
      if (s === 'u') { R(g, sx, sy, 16, 3, PAL.wdd); R(g, sx, sy + 3, 16, 1, PAL.wl); }
      if (s === 'd') { R(g, sx, sy + 14, 16, 2, PAL.wdd); }
      if (s === 'l') { R(g, sx, sy, 2, 16, PAL.wdd); R(g, sx + 2, sy, 1, 16, PAL.wl); }
      if (s === 'r') { R(g, sx + 14, sy, 2, 16, PAL.wdd); }
    }
  }
}
function tileImg(ch, x, y) {
  const t = TILES[ch]; if (!t) return null;
  if (t.fence) return fenceTile(tileAt(x, y - 1) === 'F', tileAt(x, y + 1) === 'F', tileAt(x - 1, y) === 'F', tileAt(x + 1, y) === 'F');
  if (t.wall) return wallTile(t.wall, MAP.wall);
  if (t.stripe) return t.v[(x >> 1) % 2];
  if (t.anim) return t.v[((frame / t.speed) | 0) % t.anim];
  return t.v[hash2(x, y) % t.v.length];
}
function cam() {
  const W = MAP.w * 16, H = MAP.h * 16;
  const cx = W <= 240 ? (W - 240) / 2 : clamp(PL.px + 8 - 120, 0, W - 240);
  const cy = H <= 160 ? (H - 160) / 2 : clamp(PL.py + 8 - 80, 0, H - 160);
  return [Math.round(cx), Math.round(cy)];
}
function charFrame(c, look) {
  const sh = sheet(look)[c.dir];
  if (!c.moving) return sh[0];
  const prog = (Math.abs(c.px - c.tx * 16) + Math.abs(c.py - c.ty * 16));
  return prog > 8 ? sh[(c.tiles % 2) + 1] : sh[0];
}
function timePhase() {
  const o = OPT.time !== 'auto' ? OPT.time : (QS.get('ora') || null);
  if (o === 'notte') return 'night'; if (o === 'giorno') return 'day'; if (o === 'tramonto') return 'dusk';
  const h = new Date().getHours();
  return (h >= 20 || h < 6) ? 'night' : (h >= 17 ? 'dusk' : 'day');
}
function drawWorld() {
  const g = ctx; const [cx, cy] = cam();
  R(g, 0, 0, 240, 160, '#101018');
  const x0 = Math.max(0, (cx / 16) | 0), y0 = Math.max(0, (cy / 16) | 0);
  const x1 = Math.min(MAP.w - 1, ((cx + 240) / 16) | 0), y1 = Math.min(MAP.h - 1, ((cy + 160) / 16) | 0);
  for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) {
    const ch = MAP.t[y][x], im = tileImg(ch, x, y); const sx = x * 16 - cx, sy = y * 16 - cy;
    if (im) g.drawImage(im, sx, sy);
    if (TILES[ch] && TILES[ch].edge) drawEdges(g, ch, x, y, sx, sy);
  }
  // oggetti piatti
  for (const o of MAP.objs) if (o.flat) g.drawImage(o.img, o.x * 16 + o.ox - cx, o.y * 16 + o.oy - cy);
  // ordinamento per profondità
  const list = [];
  for (const o of MAP.objs) {
    if (o.flat) continue;
    const sx = o.x * 16 + o.ox - cx, sy = o.y * 16 + o.oy - cy;
    if (sx > 240 || sy > 160 || sx + o.img.width < 0 || sy + o.img.height < 0) continue;
    list.push({ z: (o.y + o.h) * 16, f: () => g.drawImage(o.img, sx, sy) });
  }
  const chars = NPCS.map(n => ({ c: n, look: n.d.look })).concat([{ c: PL, look: 'mauro', me: true }]);
  for (const { c, look } of chars) {
    const sx = Math.round(c.px - cx), sy = Math.round(c.py - cy);
    if (sx < -20 || sy < -30 || sx > 250 || sy > 180) continue;
    list.push({
      z: c.py + 16.5, f: () => {
        g.drawImage(SHADOW, sx, sy + 12);
        g.drawImage(charFrame(c, look), sx, sy - 7);
        // erba alta sopra i piedi
        const gx = c.moving ? c.tx : c.x, gy = c.moving ? c.ty : c.y;
        if (tileAt(gx, gy) === '"' && TILES['"'].top) g.drawImage(TILES['"'].top, gx * 16 - cx, gy * 16 - cy);
        if (c.moving && tileAt(c.x, c.y) === '"') g.drawImage(TILES['"'].top, c.x * 16 - cx, c.y * 16 - cy);
      }
    });
  }
  list.sort((a, b) => a.z - b.z).forEach(d => d.f());
  // luce del giorno
  if (MAP.outdoor) {
    const ph = timePhase();
    if (ph !== 'day') {
      g.save(); g.globalCompositeOperation = 'multiply';
      R(g, 0, 0, 240, 160, ph === 'night' ? '#5060A8' : '#F0B890'); g.restore();
      if (ph === 'night') {
        g.save();
        for (const o of MAP.objs) {
          if (o.wins) { g.globalAlpha = 0.7; for (const [wx, wy, ww, wh] of o.wins) R(g, o.x * 16 + o.ox - cx + wx, o.y * 16 + o.oy - cy + wy, ww, wh, '#F8D878'); }
          if (o.lamp) {
            const lx = o.x * 16 - cx + 8, ly = o.y * 16 - cy - 9;
            g.globalAlpha = 1; g.globalCompositeOperation = 'lighter';
            const gr = g.createRadialGradient(lx, ly, 2, lx, ly + 10, 30); gr.addColorStop(0, 'rgba(255,220,140,.55)'); gr.addColorStop(1, 'rgba(255,200,120,0)');
            g.fillStyle = gr; g.fillRect(lx - 34, ly - 30, 68, 72); g.globalCompositeOperation = 'source-over';
          }
        }
        g.restore();
      }
    }
  }
}

/* =========================================================
   API usata da maps.js (dialoghi, progetti, menu)
   ========================================================= */
const badgeOf = id => PROJECTS.findIndex(p => p.id === id);
async function awardBadge(id) {
  const p = PROJECTS.find(p => p.id === id); if (!p || S.badges.includes(id)) return;
  S.badges.push(id);
  Sound.jingle('badge');
  await say([`MAURO ha ottenuto la ${p.badge.toUpperCase()}!`]);
  autosave();
  if (S.badges.length === PROJECTS.length) await allBadges();
}
async function allBadges() {
  await wait(20);
  await say(['...', 'Il telefono di MAURO vibra. È un messaggio del PROFESSORE:', '"Hai visitato TUTTI i progetti di Carditopoli! Otto medaglie su otto!"', '"Ora sai chi è MAURO e cosa sa fare. Se ti è piaciuto il viaggio, scrivigli!"']);
  await openContacts();
}
const Game = {
  async npcTalk(id) {
    switch (id) {
      case 'prof': {
        if (!S.flags.balls) {
          await say(['Oh, MAURO! Ti stavo aspettando.', 'Io sono il PROFESSOR BIAGIO. Studio le strane creature di Carditopoli: i CARDIMON.', 'Ogni CARDIMON è una competenza. Vivono nell\'erba alta dei campi di carciofi.', 'Tieni queste CARCIOFBALL: lanciale per catturarli e registrarli nel CARDIDEX!']);
          S.flags.balls = true; Sound.jingle('catch');
          await say(['MAURO ha ricevuto 99 CARCIOFBALL!', 'In città ogni edificio custodisce un tuo progetto. Visitali tutti per ottenere le 8 MEDAGLIE!', 'Premi INVIO (o START) per aprire il menu, con CARDIDEX e PROGETTI.']);
          autosave();
        } else {
          const c = S.caught.length, b = S.badges.length;
          const msg = c >= CREATURES.length && b >= PROJECTS.length ? ['Incredibile! CARDIDEX completo e tutte le medaglie!', 'Sei la persona giusta per qualsiasi progetto creativo.'] :
            [`Vediamo... hai catturato ${c} CARDIMON su ${CREATURES.length} e hai ${b} medaglie su ${PROJECTS.length}.`, c < CREATURES.length ? (S.caught.includes(15) ? 'Continua a esplorare l\'erba alta!' : 'Si dice che un CARDIMON raro canti solo di notte...') : 'Ora visita i progetti in città!'];
          await say(msg);
        }
        break;
      }
      case 'mamma': {
        if (!S.flags.mamma) {
          S.flags.mamma = true;
          await say(['MAURO! Finalmente ti sei svegliato.', 'Il PROFESSOR BIAGIO ti cercava: ti aspetta a nord, vicino ai campi di carciofi.', 'E prima di uscire... hai mangiato? No? Vabbè, prenditi almeno un panino.', 'Se ti serve qualcosa, sul PC ci sono tutti i tuoi contatti.']);
        } else await say(rnd([['Hai mangiato?'], ['Copriti, che fuori fa freschetto!'], ['Quando la discuti questa tesi? Voglio venire!'], ['Il Professore ti cercava, vicino ai campi a nord.']]));
        break;
      }
      case 'cantante':
        return Game.projectTalk('tesi', ['♪ Sott\'a stu balcone \'e Carditopoli... ♪', 'Eh? Ti piace? È musica NEOMELODICA, guagliò.', 'MAURO ci sta scrivendo la tesi: come queste canzoni raccontano i quartieri e le strade di Napoli.']);
      case 'carte': return primaODopo();
      case 'impiegata': {
        await say(['Buongiorno! Ufficio anagrafe e curricula.']);
        if (await ask('Vuole consultare il CURRICULUM di MAURO ESPOSITO?') === 0) await openTrainer(1);
        else await say('Arrivederci, e passi pure quando vuole.');
        break;
      }
      case 'castello':
        await say(['Benvenuti al CASTELLO di Carditopoli!', 'Nella teca è esposta la SCHEDA di MAURO: chi è, cosa ha studiato e le sue medaglie.', 'Il PC vicino all\'uscita apre il CARDIDEX.']);
        return openTrainer(0);
      case 'cuoco': return Game.projectTalk('rockandfeller', ['Benvenuto da ROCK AND FELLER! Doner kebab, da Caserta con amore.', 'Il sito l\'ha fatto MAURO: menù, QR dinamici e pure il pannello admin.', 'E il logo nuovo? Sempre lui, con PULLME UP.']);
      case 'mercoleterry': return Game.projectTalk('mercoleterry', ['Benvenuto da MERCOLETERRY!', 'Datterini campani e ciliegini: la passata più chiacchierata di Carditopoli.', 'Nome, etichetta, logo, video e sito: firmato MAURO.']);
      case 'pullmeup': return Game.projectTalk('pullmeup', ['Ué, socio! Benvenuto in PULLME UP.', 'Sei anni di social, Meta, SEO, siti e contenuti.', 'Facciamo crescere i locali indipendenti, un post alla volta.']);
      case 'sabaude': return Game.projectTalk('sabaudo', ['Bogia nen! Benvenuto alle RESIDENZE SABAUDE.', 'In vetrina c\'è il PASSAPORTO SABAUDO: un viaggio a tappe nelle residenze reali del Piemonte.']);
      case 'ceramica':
        await say(['Benvenuto nella BOTTEGA! Qui l\'argilla diventa vasi, piatti e tazze.', 'Tutti i pezzi sugli scaffali li ha fatti MAURO, al tornio e a mano.']);
        return Game.passion('ceramica');
      case 'tshirt':
        await say(['Ciao! Qui vendiamo le T-SHIRT GRAFICHE disegnate da MAURO.', 'Ogni maglietta è una grafica originale. Vuoi vederle tutte?']);
        return Game.passion('tshirt');
      case 'calcio':
        await say(['Ué! Io sono MAURO... ma da piccolo!', 'Passavo le giornate qui al campetto, col pallone sempre tra i piedi.', 'Vuoi vedere il mio album di foto?']);
        return Game.passion('calcio');
      case 'mappe':
        await say(['Benvenuto nello STUDIO DELLE MAPPE.', 'MAURO ama le carte geografiche: le studia, le disegna e le costruisce con QGIS e i satelliti.', 'Ecco la sua collezione.']);
        return Game.passion('mappe');
      case 'musica':
        await say(['Benvenuto nella CASA DELLA MUSICA!', 'Il JUKEBOX là in fondo ha gli artisti preferiti di MAURO.', 'E se ti senti un rocker, prendi la CHITARRA ELETTRICA: le frecce che scendono vanno suonate a tempo!']);
        if (S.flags.rhythmBest) await say(`Il record attuale è di ${S.flags.rhythmBest} punti. Riesci a batterlo?`);
        break;
      case 'archivio': return Game.projectTalk('enzo', ['Benvenuto all\'ARCHIVIO ENZO.', 'Qui sono custodite le barche di legno costruite a mano da nonno Enzo.', 'MAURO le sta ricostruendo in 3D, una per una, partendo dalle foto. Lavori in corso!']);
    }
  },
  async projectTalk(id, lines) {
    if (lines) await say(lines);
    const seen = S.badges.includes(id);
    if (!seen) await say('Vuoi vedere la scheda del progetto?', { auto: 40 });
    await openProject(PROJECTS.find(p => p.id === id));
    await awardBadge(id);
  },
  async extraTalk(id, lines) {
    if (lines) await say(lines);
    const x = EXTRAS.find(e => e.id === id);
    await openProject(x);
    if (!S.extras.includes(id)) { S.extras.push(id); autosave(); }
  },
  passion: id => openGallery(PASSIONS[id]),
  artists: () => openArtists(),
  async chitarra() {
    await say('La chitarra acustica di MAURO. Le corde sono un po\' consumate...');
    if (await ask('Vuoi suonarla?') !== 0) return;
    Sound.jingle('chitarra');
    await say(['♪ Plin plin plon... ♪', 'Un arpeggio dolce dolce. MAURO la suona da quando era ragazzo.'], { auto: 0 });
  },
  async rhythm() {
    await say('Una chitarra elettrica rossa, attaccata all\'amplificatore.');
    if (await ask('Vuoi suonare CHITARRA EROICA?') !== 0) return;
    await say(isTouch ? 'Premi la freccia della croce giusta quando la nota arriva sulla linea. B per uscire.' : 'Premi la FRECCIA giusta quando la nota arriva sulla linea. X per uscire.');
    await playRhythm();
  },
  openContacts: () => openContacts(),
  openTrainer: () => openTrainer(0),
  openDex: () => openDex(),
  toggleMusic() { OPT.music = !OPT.music; Sound.setMusic(OPT.music); saveOpt(); toast(OPT.music ? '♪ MUSICA ON' : '♪ MUSICA OFF'); },
};
window.Game = Game;

/* ---------------- pannelli ---------------- */
function panel(title, sub) {
  const p = el('div', 'panel');
  p.innerHTML = `<div class="head"><span>${title}</span><small>${sub || ''}</small></div><div class="body"></div><div class="foot"></div>`;
  return p;
}
function panelLayer(p, input) {
  return new Promise(res => {
    const L = { el: p, input(b) { const r = input(b); if (r === 'close') { Sound.sfx('back'); popLayer(L); res(); } } };
    L.close = () => { popLayer(L); res(); };
    pushLayer(L);
  });
}
function openLink(u) { if (!u) return; Sound.sfx('select'); window.open(u, '_blank', 'noopener'); }

function openProject(p) {
  const pan = panel(p.badge ? 'PROGETTO' : 'EXTRA', p.badge ? (S.badges.includes(p.id) ? '★ ' + p.badge.toUpperCase() : p.badge.toUpperCase()) : '');
  const body = pan.querySelector('.body');
  const card = el('div', 'card'); css(card, { left: '6px', top: '5px', right: '6px', bottom: '5px', padding: '5px 7px' });
  const host = p.url ? p.url.replace(/^https?:\/\//, '').replace(/\/$/, '') : '';
  card.innerHTML = `<div style="display:flex;gap:6px;align-items:center"><img class="pix" src="${url(ICONS[p.icon])}" style="width:24px;height:24px;background:#E8F0E0;border-radius:3px;padding:2px">
    <div><div style="font-weight:700;font-size:11px;line-height:12px">${esc(p.name)}</div><div style="font-size:7px;color:#6A7A6A">${esc(p.place || '')}</div></div></div>
    <div style="margin:4px 0 2px">${p.tags.map(t => `<span class="tag">${esc(t)}</span>`).join('')}</div>
    <div class="scroll" style="height:56px"><div class="desc-txt">${esc(p.desc)}</div></div>
    <div>${p.url ? `<a class="btnlink" href="${p.url}" target="_blank" rel="noopener">▶ ${esc(host)}</a>` : '<span class="btnlink" style="background:#C8D0C0;box-shadow:none">IN COSTRUZIONE</span>'}</div>`;
  body.appendChild(card);
  pan.querySelector('.foot').innerHTML = (p.url ? '<span><b>A</b> apri il sito</span>' : '') + '<span><b>↑↓</b> scorri</span><span><b>B</b> chiudi</span>';
  const sc = card.querySelector('.scroll');
  return panelLayer(pan, b => {
    if (b === 'b' || b === 'start') return 'close';
    if (b === 'a') { if (p.url) openLink(p.url); else return 'close'; }
    if (b === 'down') sc.scrollTop += 10; if (b === 'up') sc.scrollTop -= 10;
  });
}

async function openTrainer(tab = 0) {
  const pan = panel('SCHEDA ALLENATORE', 'ID 2018');
  const body = pan.querySelector('.body');
  const tabs = ['MAURO', 'STUDI', 'LAVORO', 'LINGUE'];
  const tb = el('div', 'tabs'); body.appendChild(tb);
  const card = el('div', 'card'); css(card, { left: '4px', top: '15px', right: '4px', bottom: '27px', padding: '4px 6px', overflow: 'hidden' }); body.appendChild(card);
  const bd = el('div', 'badges'); css(bd, { position: 'absolute', left: '4px', right: '4px', bottom: '3px' }); body.appendChild(bd);
  bd.innerHTML = PROJECTS.map(p => `<div class="bd ${S.badges.includes(p.id) ? 'on' : ''}" title="${esc(p.badge)}"><img src="${url(ICONS[p.icon])}"></div>`).join('');
  const av = url(sheet('mauro').down[0]);
  const mins = Math.floor(S.time / 60);
  function draw() {
    tb.innerHTML = tabs.map((t, i) => `<span class="${i === tab ? 'on' : ''}">${t}</span>`).join('');
    [...tb.children].forEach((s, i) => s.onclick = () => { tab = i; draw(); });
    if (tab === 0) card.innerHTML = `<div style="display:flex;gap:8px"><img class="pix" src="${av}" style="width:32px;height:48px;background:#E0ECD8;border-radius:3px">
      <div style="font-size:8px;line-height:10.5px"><b style="font-size:10px">${esc(PROFILE.fullName.toUpperCase())}</b><br>${esc(PROFILE.role)}<br>${esc(PROFILE.since)}<br>
      CARDIDEX: <b>${S.caught.length}</b>/${CREATURES.length} · MEDAGLIE: <b>${S.badges.length}</b>/${PROJECTS.length}<br>TEMPO DI GIOCO: ${Math.floor(mins / 60)}:${String(mins % 60).padStart(2, '0')}</div></div>`;
    else {
      const rows = tab === 1 ? PROFILE.studies : tab === 2 ? PROFILE.jobs : PROFILE.languages;
      card.innerHTML = rows.map(([a, b]) => `<div style="font-size:7.5px;line-height:8.5px;margin-bottom:2.5px"><b>${esc(a)}</b><br><span style="color:#5A6A5A;font-size:6.5px;line-height:7.5px">${esc(b)}</span></div>`).join(''); card.scrollTop = 0;
    }
  }
  draw();
  pan.querySelector('.foot').innerHTML = '<span><b>←→</b> cambia scheda</span><span><b>↑↓</b> scorri</span><span><b>B</b> chiudi</span>';
  return panelLayer(pan, b => {
    if (b === 'b' || b === 'start' || b === 'a') return 'close';
    if (b === 'left') { tab = (tab + 3) % 4; Sound.sfx('talk'); draw(); }
    if (b === 'right') { tab = (tab + 1) % 4; Sound.sfx('talk'); draw(); }
    if (b === 'down') card.scrollTop += 12; if (b === 'up') card.scrollTop -= 12;
  });
}

function openDex() {
  const pan = panel('CARDIDEX', `VISTI ${S.seen.length} · PRESI ${S.caught.length}`);
  const body = pan.querySelector('.body');
  const list = el('div', 'list'); css(list, { left: '4px', width: '112px' }); body.appendChild(list);
  const view = el('div', 'card'); css(view, { left: '120px', top: '4px', right: '4px', bottom: '4px', padding: '4px', textAlign: 'center' }); body.appendChild(view);
  let sel = 0, top = 0; const VIS = 10;
  const ball = url(BALL);
  function draw() {
    if (sel < top) top = sel; if (sel >= top + VIS) top = sel - VIS + 1;
    list.innerHTML = CREATURES.slice(top, top + VIS).map((c, k) => {
      const i = top + k, seen = S.seen.includes(c.id), got = S.caught.includes(c.id);
      return `<div class="row ${i === sel ? 'sel' : ''}" data-i="${i}">${got ? `<img src="${ball}">` : '<span style="width:9px"></span>'}<span>${String(c.id).padStart(3, '0')}</span><span>${seen ? c.name : '?????'}</span></div>`;
    }).join('');
    list.querySelectorAll('.row').forEach(r => r.onclick = () => { sel = +r.dataset.i; draw(); });
    const c = CREATURES[sel], seen = S.seen.includes(c.id), got = S.caught.includes(c.id);
    view.innerHTML = seen ? `<img class="pix" src="${url(CRE[c.id])}" style="width:42px;height:42px"><div style="font-weight:700;font-size:9px">${c.name}</div>
      <span class="type" style="background:${TYPES[c.type]}">${c.type}</span><div style="font-size:7px;line-height:8.5px;margin-top:2px;color:#4A5A4A">${esc(c.skill)}</div>
      <div class="desc-txt" style="font-size:6.5px;line-height:7.6px;margin-top:2px;text-align:left;max-height:54px;overflow:hidden">${got ? esc(c.desc) : 'Non ancora catturato.'}</div>`
      : `<div style="margin-top:40px;font-size:9px;color:#8A9A8A">? ? ?</div><div style="font-size:7px;color:#8A9A8A;margin-top:4px">Cerca nell'erba alta!</div>`;
  }
  draw();
  pan.querySelector('.foot').innerHTML = '<span><b>↑↓</b> scorri</span><span><b>B</b> chiudi</span>';
  return panelLayer(pan, b => {
    if (b === 'b' || b === 'start') return 'close';
    if (b === 'down') { sel = (sel + 1) % CREATURES.length; Sound.sfx('talk'); draw(); }
    if (b === 'up') { sel = (sel - 1 + CREATURES.length) % CREATURES.length; Sound.sfx('talk'); draw(); }
  });
}

function openProjects(fromTitle) {
  const all = PROJECTS.concat(EXTRAS);
  const pan = panel('PROGETTI', `MEDAGLIE ${S.badges.length}/${PROJECTS.length}`);
  const body = pan.querySelector('.body');
  const list = el('div', 'list'); css(list, { left: '4px', right: '4px' }); body.appendChild(list);
  let sel = 0, top = 0; const VIS = 10; let open = false;
  function draw() {
    if (sel < top) top = sel; if (sel >= top + VIS) top = sel - VIS + 1;
    list.innerHTML = all.slice(top, top + VIS).map((p, k) => {
      const i = top + k, got = S.badges.includes(p.id) || S.extras.includes(p.id);
      return `<div class="row ${i === sel ? 'sel' : ''}" data-i="${i}"><img src="${url(ICONS[p.icon])}"><span>${esc(p.name)}</span><span class="r">${p.badge ? (got ? '★ ' : '') + esc(p.place) : 'extra'}</span></div>`;
    }).join('');
    list.querySelectorAll('.row').forEach(r => r.onclick = () => { sel = +r.dataset.i; draw(); go(); });
  }
  async function go() { if (open) return; open = true; Sound.sfx('select'); await openProject(all[sel]); open = false; }
  draw();
  pan.querySelector('.foot').innerHTML = '<span><b>A</b> apri</span><span><b>↑↓</b> scorri</span><span><b>B</b> chiudi</span>' + (fromTitle ? '' : '<span style="margin-left:auto">le medaglie si vincono visitando i luoghi</span>');
  return panelLayer(pan, b => {
    if (b === 'b' || b === 'start') return 'close';
    if (b === 'down') { sel = (sel + 1) % all.length; Sound.sfx('talk'); draw(); }
    if (b === 'up') { sel = (sel - 1 + all.length) % all.length; Sound.sfx('talk'); draw(); }
    if (b === 'a') go();
  });
}

function openContacts() {
  const pan = panel('CONTATTI', 'PC di MAURO');
  const body = pan.querySelector('.body');
  const list = el('div', 'list'); css(list, { left: '8px', right: '8px', top: '26px', fontSize: '9px', lineHeight: '15px' }); body.appendChild(list);
  const intro = el('div', '', 'Il PC si accende. Sul desktop c\'è un file: CONTATTI.txt'); css(intro, { position: 'absolute', left: '8px', right: '8px', top: '6px', fontSize: '7.5px' }); body.appendChild(intro);
  let sel = 0;
  function draw() {
    list.innerHTML = PROFILE.contacts.map(([k, v], i) => `<div class="row ${i === sel ? 'sel' : ''}" data-i="${i}"><b style="width:52px">${esc(k)}</b><span>${esc(v)}</span></div>`).join('');
    list.querySelectorAll('.row').forEach(r => r.onclick = () => { sel = +r.dataset.i; draw(); openLink(PROFILE.contacts[sel][2]); });
  }
  draw();
  pan.querySelector('.foot').innerHTML = '<span><b>A</b> apri</span><span><b>B</b> spegni</span>';
  return panelLayer(pan, b => {
    if (b === 'b' || b === 'start') return 'close';
    if (b === 'down') { sel = (sel + 1) % PROFILE.contacts.length; Sound.sfx('talk'); draw(); }
    if (b === 'up') { sel = (sel - 1 + PROFILE.contacts.length) % PROFILE.contacts.length; Sound.sfx('talk'); draw(); }
    if (b === 'a') openLink(PROFILE.contacts[sel][2]);
  });
}

async function openOptions() {
  let sel = 0;
  for (; ;) {
    const items = [`MUSICA: ${OPT.music ? 'SÌ' : 'NO'}`, `EFFETTI: ${OPT.sfx ? 'SÌ' : 'NO'}`, `TESTO: ${['LENTO', 'NORMALE', 'VELOCE'][OPT.speed - 1]}`, `ORARIO: ${{ auto: 'REALE', giorno: 'GIORNO', tramonto: 'TRAMONTO', notte: 'NOTTE' }[OPT.time]}`, 'CANCELLA SALVATAGGIO', 'FINE'];
    sel = await menu(items, { pos: { left: '50%', top: '30px', transform: 'translateX(-50%)', minWidth: '130px' }, start: sel });
    if (sel === 0) { OPT.music = !OPT.music; Sound.setMusic(OPT.music); }
    else if (sel === 1) { OPT.sfx = !OPT.sfx; Sound.setSfx(OPT.sfx); }
    else if (sel === 2) OPT.speed = OPT.speed % 3 + 1;
    else if (sel === 3) { const o = ['auto', 'giorno', 'tramonto', 'notte']; OPT.time = o[(o.indexOf(OPT.time) + 1) % 4]; }
    else if (sel === 4) { if (await ask('Vuoi davvero cancellare il salvataggio?', ['NO', 'SÌ']) === 1) { store.del(SAVE_KEY); await say('Salvataggio cancellato.'); } }
    else { saveOpt(); return; }
    saveOpt();
  }
}

/* ---------------- menu principale ---------------- */
async function mainMenu() {
  busy++;
  let sel = 0;
  try {
    for (; ;) {
      const items = ['CARDIDEX', 'PROGETTI', 'MAURO', 'SALVA', 'OPZIONI', 'ESCI'];
      const desc = ['Le competenze catturate', 'Tutti i lavori di Mauro', 'Scheda e curriculum', 'Salva la partita', 'Musica, testo, orario', 'Chiudi il menu'];
      sel = await menu(items, { pos: { right: '4px', top: '4px', width: '92px' }, start: sel, desc, startBack: true });
      if (sel < 0) return;
      if (sel === 0) await openDex();
      else if (sel === 1) await openProjects();
      else if (sel === 2) await openTrainer(0);
      else if (sel === 3) {
        if (await ask('Vuoi salvare la partita?') === 0) { save(); Sound.sfx('save'); await say('MAURO ha salvato la partita.'); }
      }
      else if (sel === 4) await openOptions();
      else return;
    }
  } finally { busy--; }
}
function snapshot() { S.x = PL.moving ? PL.tx : PL.x; S.y = PL.moving ? PL.ty : PL.y; S.dir = PL.dir; return S; }
function save() { store.set(SAVE_KEY, snapshot()); }
function autosave() { if (S.flags.started) save(); }

/* ---------------- galleria foto (via delle passioni) ---------------- */
function openGallery(P0) {
  const items = P0.items.length ? P0.items : Array.from({ length: 6 }, () => null);
  const pan = panel(P0.title, P0.items.length ? `${P0.items.length} PEZZI` : 'FOTO IN ARRIVO');
  const body = pan.querySelector('.body');
  const intro = el('div', '', esc(P0.intro)); css(intro, { position: 'absolute', left: '6px', right: '6px', top: '3px', fontSize: '7.5px' }); body.appendChild(intro);
  const grid = el('div'); css(grid, { position: 'absolute', left: '6px', right: '6px', top: '14px', bottom: '4px', display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gridAutoRows: '52px', gap: '4px', overflow: 'hidden' }); body.appendChild(grid);
  let sel = 0, zoom = null;
  const ph = '<div style="height:36px;display:flex;align-items:center;justify-content:center;background:#D8E0D0;border-radius:2px;color:#7A8A7A;font-size:6.5px">FOTO<br>IN ARRIVO</div>';
  function cell(it, i) {
    const c = el('div', 'card'); css(c, { position: 'relative', padding: '2px', cursor: 'pointer', textAlign: 'center' });
    c.innerHTML = it ? `<div style="height:36px;background:#E8E8E0 url('${esc(it.img)}') center/cover no-repeat;border-radius:2px"></div><div style="font-size:6.5px;line-height:9px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${esc(it.title || '')}</div>` : ph + '<div style="font-size:6.5px;line-height:9px;color:#9AA89A">???</div>';
    c.onclick = () => { sel = i; draw(); open(); };
    return c;
  }
  function draw() {
    const top = Math.max(0, Math.floor(sel / 3) - 1) * 3;
    grid.innerHTML = ''; items.slice(top, top + 6).forEach((it, k) => { const c = cell(it, top + k); if (top + k === sel) c.style.boxShadow = '0 0 0 2px #E05040, inset 0 0 0 1px #FFF'; grid.appendChild(c); });
  }
  function open() {
    const it = items[sel]; if (!it) { toast('Foto in arrivo!', 60); return; }
    Sound.sfx('select');
    zoom = el('div', 'panel'); css(zoom, { background: '#101810' });
    zoom.innerHTML = `<img src="${esc(it.img)}" style="position:absolute;left:4px;right:4px;top:4px;bottom:24px;width:calc(100% - 8px);height:calc(100% - 28px);object-fit:contain">
      <div style="position:absolute;left:6px;right:6px;bottom:3px;color:#F0F0E0;text-shadow:none;font-size:7.5px;line-height:9px"><b>${esc(it.title || '')}</b> ${esc(it.desc || '')}</div>`;
    zoom.onclick = () => { zoom.remove(); zoom = null; };
    pan.appendChild(zoom);
  }
  draw();
  pan.querySelector('.foot').innerHTML = '<span><b>A</b> ingrandisci</span><span><b>←↑↓→</b> scegli</span><span><b>B</b> chiudi</span>';
  return panelLayer(pan, b => {
    if (zoom) { if (['a', 'b', 'start'].includes(b)) { zoom.remove(); zoom = null; Sound.sfx('back'); } return; }
    if (b === 'b' || b === 'start') return 'close';
    const n = items.length;
    if (b === 'right') sel = (sel + 1) % n; else if (b === 'left') sel = (sel - 1 + n) % n;
    else if (b === 'down') sel = Math.min(n - 1, sel + 3); else if (b === 'up') sel = Math.max(0, sel - 3);
    else if (b === 'a') return open();
    Sound.sfx('talk'); draw();
  });
}
function openArtists() {
  const pan = panel('JUKEBOX', 'GLI ARTISTI DI MAURO');
  const body = pan.querySelector('.body');
  if (!ARTISTS.length) {
    const t = el('div', '', 'Il jukebox si accende... ma la lista è ancora vuota.<br><br>MAURO sta scegliendo i suoi artisti preferiti: torna presto!');
    css(t, { position: 'absolute', left: '14px', right: '14px', top: '30px', textAlign: 'center', fontSize: '8.5px', lineHeight: '12px' }); body.appendChild(t);
    pan.querySelector('.foot').innerHTML = '<span><b>B</b> chiudi</span>';
    return panelLayer(pan, b => (b === 'b' || b === 'a' || b === 'start') ? 'close' : null);
  }
  const list = el('div', 'list'); css(list, { left: '4px', width: '100px' }); body.appendChild(list);
  const view = el('div', 'card'); css(view, { left: '108px', top: '4px', right: '4px', bottom: '4px', padding: '6px' }); body.appendChild(view);
  let sel = 0, top = 0; const VIS = 10;
  function draw() {
    if (sel < top) top = sel; if (sel >= top + VIS) top = sel - VIS + 1;
    list.innerHTML = ARTISTS.slice(top, top + VIS).map((a, k) => `<div class="row ${top + k === sel ? 'sel' : ''}" data-i="${top + k}">♪ ${esc(a.name)}</div>`).join('');
    list.querySelectorAll('.row').forEach(r => r.onclick = () => { sel = +r.dataset.i; draw(); });
    const a = ARTISTS[sel];
    view.innerHTML = `<div style="font-weight:700;font-size:11px;line-height:13px">${esc(a.name)}</div><span class="tag" style="background:#A03060">${esc(a.genre || 'musica')}</span><div class="desc-txt" style="margin-top:4px">${esc(a.note || '')}</div>${a.url ? `<a class="btnlink" href="${esc(a.url)}" target="_blank" rel="noopener">▶ ascolta</a>` : ''}`;
  }
  draw();
  pan.querySelector('.foot').innerHTML = '<span><b>A</b> ascolta</span><span><b>↑↓</b> scorri</span><span><b>B</b> chiudi</span>';
  return panelLayer(pan, b => {
    if (b === 'b' || b === 'start') return 'close';
    if (b === 'down') { sel = (sel + 1) % ARTISTS.length; Sound.sfx('talk'); draw(); }
    if (b === 'up') { sel = (sel - 1 + ARTISTS.length) % ARTISTS.length; Sound.sfx('talk'); draw(); }
    if (b === 'a') openLink(ARTISTS[sel].url);
  });
}

/* =========================================================
   MINI-GIOCO: CHITARRA EROICA (ritmico)
   ========================================================= */
let RH = null;
const LANES = ['left', 'up', 'down', 'right'];
const LANE_COL = ['#48C860', '#E84848', '#F0C838', '#4890F0'];
function playRhythm() {
  return new Promise(async res => {
    busy++;
    await fadeTo(1, 10);
    const ch = Sound.chart('rock');
    const mids = ch.notes.map(n => n.midi), lo = Math.min(...mids), hi = Math.max(...mids);
    let prevLane = -1;
    const notes = ch.notes.map((n, i) => {
      let lane = Math.min(3, Math.floor((n.midi - lo) / (hi - lo + 1) * 4));
      if (i && ch.notes[i - 1].midi === n.midi) lane = prevLane;
      prevLane = lane; return { t: n.t + 0.05, lane, hit: 0 };
    });
    RH = { notes, t0: performance.now() / 1000, len: ch.len + 1.2, score: 0, combo: 0, best: 0, meter: 0.6, hits: 0, perfect: 0, flash: [0, 0, 0, 0], msg: '', msgT: 0, done: false, res };
    scene = 'rhythm';
    Sound.once('rock');
    await fadeTo(0, 10);
  });
}
function rhNow() { return performance.now() / 1000 - RH.t0; }
async function rhEnd(failed) {
  if (RH.done) return; RH.done = true;
  Sound.stop();
  const tot = RH.notes.length, acc = Math.round(RH.hits / tot * 100);
  const stars = failed ? 0 : acc >= 95 ? 5 : acc >= 85 ? 4 : acc >= 70 ? 3 : acc >= 50 ? 2 : 1;
  const newBest = !failed && RH.score > (S.flags.rhythmBest || 0);
  if (newBest) { S.flags.rhythmBest = RH.score; autosave(); }
  if (!failed) Sound.jingle(stars >= 3 ? 'badge' : 'catch');
  await wait(30);
  await say(failed ? ['Il pubblico ti fischia! La canzone si interrompe...', 'Riprova, il rock non si impara in un giorno!'] :
    [`Fine del pezzo! PUNTI: ${RH.score} · PRECISIONE: ${acc}% · COMBO MAX: ${RH.best}`, `${'★'.repeat(stars)}${'☆'.repeat(5 - stars)} ` + (stars >= 4 ? 'Una leggenda del rock di Carditopoli!' : stars >= 3 ? 'Il pubblico applaude!' : 'Si può fare di meglio... ma il cuore c\'era!')].concat(newBest ? ['NUOVO RECORD!'] : []));
  await fadeTo(1, 12);
  const r = RH.res; RH = null; scene = 'world'; Sound.play(MAP.music);
  await fadeTo(0, 12); busy--; r();
}
function updateRhythm() {
  if (!RH || RH.done) return;
  const now = rhNow();
  if (Input.just('b') && !Layers.length) { rhEnd(true); return; }
  LANES.forEach((d, lane) => {
    if (!Input.just(d)) return;
    RH.flash[lane] = 8;
    let best = null, bd = 1;
    for (const n of RH.notes) { if (n.hit || n.lane !== lane) continue; const dd = Math.abs(n.t - now); if (dd < bd) { bd = dd; best = n; } }
    if (best && bd < 0.14) {
      best.hit = 1; RH.hits++; RH.combo++; RH.best = Math.max(RH.best, RH.combo);
      const perfect = bd < 0.06; if (perfect) RH.perfect++;
      RH.score += (perfect ? 100 : 50) * (1 + Math.min(3, Math.floor(RH.combo / 10)));
      RH.meter = Math.min(1, RH.meter + 0.025); RH.msg = perfect ? 'PERFETTO!' : 'BENE!'; RH.msgT = 30; best.burst = 10;
    } else { RH.combo = 0; RH.meter -= 0.03; Sound.sfx('bump'); }
  });
  for (const n of RH.notes) if (!n.hit && now - n.t > 0.16) { n.hit = -1; RH.combo = 0; RH.meter -= 0.07; RH.msg = 'MANCATA'; RH.msgT = 20; }
  RH.flash = RH.flash.map(f => Math.max(0, f - 1)); if (RH.msgT) RH.msgT--;
  if (RH.meter <= 0) { rhEnd(true); return; }
  if (now > RH.len) rhEnd(false);
}
function drawRhythm() {
  const g = ctx;
  for (let y = 0; y < 160; y++) R(g, 0, y, 240, 1, y < 80 ? '#1A1030' : '#241640');
  // luci del palco
  for (let i = 0; i < 5; i++) { g.globalAlpha = 0.12 + 0.08 * Math.sin(frame / 10 + i); g.fillStyle = ['#F070C0', '#50D0F0', '#F0E050'][i % 3]; g.beginPath(); g.moveTo(20 + i * 50, 0); g.lineTo(i * 50, 160); g.lineTo(40 + i * 50, 160); g.fill(); }
  g.globalAlpha = 1;
  if (!RH) return;
  const now = rhNow(), HIT = 136, SPEED = 95, X0 = 72, LW = 24;
  R(g, X0 - 4, 0, LW * 4 + 8, 160, '#10081C'); R(g, X0 - 5, 0, 1, 160, '#5A4A80'); R(g, X0 + LW * 4 + 4, 0, 1, 160, '#5A4A80');
  for (let l = 0; l < 4; l++) {
    const x = X0 + l * LW; R(g, x + LW - 1, 0, 1, 160, '#2A1E44');
    // tasto sulla linea
    const on = RH.flash[l] > 0;
    ellipse(g, x + 12, HIT, 9, 5, on ? LANE_COL[l] : '#3A2E58'); ellipse(g, x + 12, HIT, 6, 3, on ? '#FFFFFF' : '#1A1030');
    // freccia
    const ax = x + 12, ay = 152, c = LANE_COL[l];
    const arr = { left: [[-3, 0], [0, -3], [0, 3]], right: [[3, 0], [0, -3], [0, 3]], up: [[0, -3], [-3, 0], [3, 0]], down: [[0, 3], [-3, 0], [3, 0]] }[LANES[l]];
    g.fillStyle = c; g.beginPath(); g.moveTo(ax + arr[0][0], ay + arr[0][1]); g.lineTo(ax + arr[1][0], ay + arr[1][1]); g.lineTo(ax + arr[2][0], ay + arr[2][1]); g.fill();
  }
  R(g, X0 - 4, HIT, LW * 4 + 8, 1, '#F8F8F8');
  for (const n of RH.notes) {
    const y = HIT - (n.t - now) * SPEED; if (y < -10 || y > 170) continue;
    const x = X0 + n.lane * LW + 12;
    if (n.hit === 1) { if (n.burst > 0) { n.burst--; for (let k = 0; k < 6; k++) { const a = k + frame / 5; P(g, x + Math.cos(a) * (12 - n.burst), HIT + Math.sin(a) * (8 - n.burst / 2), LANE_COL[n.lane]); } } continue; }
    const col = n.hit === -1 ? '#4A4058' : LANE_COL[n.lane];
    ellipse(g, x, Math.round(y), 8, 4, '#101018'); ellipse(g, x, Math.round(y) - 1, 7, 3, col); R(g, x - 3, Math.round(y) - 2, 4, 1, '#FFFFFF');
  }
  // punteggio e "rock meter"
  g.font = '700 8px "Pixelify Sans", monospace'; g.fillStyle = '#F8F0A0'; g.textBaseline = 'top';
  g.fillText('PUNTI', 8, 8); g.fillStyle = '#FFFFFF'; g.fillText(String(RH.score), 8, 18);
  g.fillStyle = '#F8F0A0'; g.fillText('COMBO', 8, 34); g.fillStyle = '#FFFFFF'; g.fillText(String(RH.combo) + (RH.combo >= 10 ? ' x' + (1 + Math.min(3, Math.floor(RH.combo / 10))) : ''), 8, 44);
  g.fillStyle = '#F8F0A0'; g.fillText('PUBBLICO', 184, 8);
  R(g, 186, 20, 46, 6, '#10081C'); R(g, 187, 21, Math.round(44 * Math.max(0, RH.meter)), 4, RH.meter > 0.5 ? '#58D080' : RH.meter > 0.25 ? '#F0C838' : '#F05838');
  g.fillStyle = '#C8B8E8'; g.fillText('CHITARRA', 184, 140); g.fillText('EROICA', 190, 150);
  const prog = Math.min(1, now / RH.len); R(g, 8, 150, 50, 3, '#10081C'); R(g, 8, 150, Math.round(50 * prog), 3, '#F070C0');
  if (RH.msgT) { g.fillStyle = RH.msg === 'MANCATA' ? '#F07070' : '#FFFFFF'; const w = g.measureText(RH.msg).width; g.fillText(RH.msg, 120 - w / 2, 70); }
  if (now < 2.2) { g.fillStyle = '#FFFFFF'; const t = now < 0.8 ? 'PRONTO?' : now < 1.6 ? 'VIA!' : ''; const w = g.measureText(t).width; g.fillText(t, 120 - w / 2, 60); }
}

/* =========================================================
   MINI-GIOCO: PRIMA O DOPO?
   ========================================================= */
async function primaODopo() {
  await say(['Ué, giovane! Ti va una partita a PRIMA O DOPO?']);
  if (await ask('Ti dico due eventi: tu mi dici quale è successo PRIMA. Giochiamo?') !== 0) { await say('Peccato! Quando vuoi, io sto qua.'); return; }
  const pool = EVENTS.slice().sort(() => Math.random() - 0.5);
  let score = 0; const N = 5;
  for (let r = 0; r < N; r++) {
    let a = pool[r * 2], b = pool[r * 2 + 1];
    const res = await quizRound(a, b, r + 1, N, score);
    if (res) score++;
  }
  const verdict = score === 5 ? 'Cinque su cinque! Sei una macchina del tempo!' : score >= 3 ? 'Niente male! Ripassa un po\' e torna.' : 'Eh... la storia non è il tuo forte. Ma si impara!';
  await say([`Hai fatto ${score} punti su ${N}. ${verdict}`, 'Sai che questo gioco l\'ha inventato MAURO? Si chiama PRIMA O DOPO? — La Timeline Impossibile.', 'Sono 150 carte da stampare: 100 eventi del mondo e 50 italiani!']);
  if (!S.extras.includes('primaodopo')) { S.extras.push('primaodopo'); autosave(); }
}
function quizRound(a, b, r, n, score) {
  return new Promise(res => {
    const pan = panel('PRIMA O DOPO?', `ROUND ${r}/${n} · PUNTI ${score}`);
    const body = pan.querySelector('.body');
    const q = el('div', '', 'Quale evento è successo <b>PRIMA</b>?'); css(q, { position: 'absolute', top: '8px', left: 0, right: 0, textAlign: 'center', fontSize: '9px' }); body.appendChild(q);
    const cards = [a, b].map((e, i) => {
      const c = el('div', 'card'); css(c, { top: '26px', width: '106px', height: '80px', left: i ? '128px' : '6px', padding: '6px', textAlign: 'center', display: 'flex', flexDirection: 'column', justifyContent: 'center', cursor: 'pointer', fontSize: '8.5px', lineHeight: '11px' });
      c.innerHTML = `<div>${esc(e[0])}</div><div class="yr" style="margin-top:6px;font-weight:700;font-size:12px;color:#2E7A4A;visibility:hidden">${e[1] < 0 ? -e[1] + ' a.C.' : e[1]}</div>`;
      c.onclick = () => { sel = i; draw(); choose(); };
      body.appendChild(c); return c;
    });
    let sel = 0, done = false;
    function draw() { cards.forEach((c, i) => c.style.boxShadow = i === sel ? '0 0 0 2px #E05040, inset 0 0 0 1px #FFF' : ''); }
    async function choose() {
      if (done) return; done = true;
      const ok = (sel === 0 ? a[1] < b[1] : b[1] < a[1]);
      cards.forEach(c => c.querySelector('.yr').style.visibility = 'visible');
      Sound.sfx(ok ? 'win' : 'wrong');
      q.innerHTML = ok ? '<b style="color:#2E7A4A">GIUSTO!</b>' : '<b style="color:#C03030">SBAGLIATO!</b>';
      await wait(70); popLayer(L); res(ok);
    }
    draw();
    pan.querySelector('.foot').innerHTML = '<span><b>←→</b> scegli</span><span><b>A</b> conferma</span>';
    const L = { el: pan, input(bt) { if (done) return; if (bt === 'left' || bt === 'right') { sel = 1 - sel; Sound.sfx('talk'); draw(); } if (bt === 'a') choose(); } };
    pushLayer(L);
  });
}

/* =========================================================
   LOTTA / CATTURA
   ========================================================= */
let B = null;
function pickCreature() {
  const night = timePhase() === 'night';
  if (night && Math.random() < 0.18) return CREATURES.find(c => c.night);
  if (!night && Math.random() < 0.01) return CREATURES.find(c => c.night);
  const pool = CREATURES.filter(c => c.rate > 0); const tot = pool.reduce((a, c) => a + c.rate, 0);
  let r = Math.random() * tot; for (const c of pool) { r -= c.rate; if (r <= 0) return c; } return pool[0];
}
let trans = null; // effetto di transizione su canvas
async function encounter() {
  busy++;
  const sp = pickCreature();
  Sound.sfx('encounter'); Sound.play('battle');
  for (let i = 0; i < 3; i++) { trans = { flash: 1 }; await wait(5); trans = null; await wait(5); }
  await tween(36, t => trans = { bars: t });
  scene = 'battle';
  await runBattle(sp);
  await fadeTo(1, 12); trans = null;
  scene = 'world'; B = null; Sound.play(MAP.music);
  await fadeTo(0, 12);
  busy--;
}
function hpClass(v) { return v > 0.5 ? '' : v > 0.2 ? 'y' : 'r'; }
async function runBattle(sp) {
  B = { sp, ex: -70, mx: 250, ehp: 1, eShow: 1, boost: 0, ball: null, flash: 0, shake: 0, scale: 1, hidden: false, stars: 0 };
  if (!S.seen.includes(sp.id)) S.seen.push(sp.id);
  const ui = el('div'); UI.insertBefore(ui, fadeEl);
  const ebox = el('div', 'ebox'), pbox = el('div', 'pbox');
  const got = S.caught.includes(sp.id);
  ebox.innerHTML = `<div class="nm"><span>${sp.name}${got ? ` <img class="caught" src="${url(BALL)}">` : ''}</span><span>Lv${5 + sp.id}</span></div><div class="hpline">HP<div class="hp"><i style="width:100%"></i></div></div>`;
  pbox.innerHTML = `<div class="nm"><span>MAURO</span><span>Lv${new Date().getFullYear() - 2018}</span></div><div class="hpline">HP<div class="hp"><i style="width:100%"></i></div></div><div style="text-align:right;font-size:7px;font-weight:600">∞/ ∞</div><div class="xp"><i style="width:${Math.round(S.caught.length / CREATURES.length * 100)}%"></i></div>`;
  ebox.style.visibility = pbox.style.visibility = 'hidden'; ui.append(ebox, pbox);
  const ehpBar = ebox.querySelector('.hp i');
  trans = null;
  await tween(50, t => { const e = 1 - Math.pow(1 - t, 2); B.ex = -70 + (160 + 70) * e; B.mx = 250 - (250 - 26) * e; });
  ebox.style.visibility = pbox.style.visibility = 'visible';
  await say(`È apparso ${sp.name} selvatico!`, { battle: true });
  const setHp = async to => { const from = B.ehp; B.ehp = to; await tween(24, t => { const v = from + (to - from) * t; ehpBar.style.width = (v * 100) + '%'; ehpBar.className = hpClass(v); }); };
  const enemyTurn = async () => {
    await say(`${sp.name} ${rnd(WILD_MOVES)}!`, { battle: true });
    B.shakeMe = 12; await wait(14);
    await say(rnd(['Ma MAURO non si scompone.', 'MAURO risponde con calma e professionalità.', 'Non ha effetto: MAURO ha già bevuto il caffè.', 'MAURO prende nota e va avanti.']), { battle: true });
  };
  let result = 'flee';
  for (; ;) {
    const prompt = await say(`Cosa deve fare MAURO?`, { battle: true, keep: true, half: true });
    const a = await menu(['LOTTA', 'CATTURA', 'INFO', 'FUGA'], { cols: 2, cls: 'battle', pos: { right: '0', bottom: '0', width: '104px', height: '48px', padding: '8px 4px 0 6px' } });
    popLayer(prompt);
    if (a === 0) {
      const m = await menu(MOVES.map(m => m.name), { cols: 2, cls: 'battle', pos: { left: '0', right: '0', bottom: '0', height: '48px', padding: '9px 8px 0 8px' } });
      if (m < 0) continue;
      const mv = MOVES[m];
      await say(`MAURO usa ${mv.name}!`, { battle: true, auto: 30 });
      if (mv.pow) {
        Sound.sfx('hit');
        for (let i = 0; i < 4; i++) { B.hidden = true; await wait(3); B.hidden = false; await wait(3); }
        await setHp(Math.max(0.06, B.ehp - mv.pow / 100 * (0.7 + Math.random() * 0.5)));
        await say(mv.txt, { battle: true });
      } else { B.boost = 0.2; Sound.sfx('save'); await say(mv.txt, { battle: true }); }
      await enemyTurn();
    } else if (a === 1) {
      const caught = await throwBall(sp);
      if (caught) { result = 'caught'; break; }
      await enemyTurn();
    } else if (a === 2) {
      await say([`${sp.name} — tipo ${sp.type}.`, `COMPETENZA: ${sp.skill}.`, sp.desc], { battle: true });
    } else if (a === 3) {
      Sound.sfx('flee'); await say('Scappi senza problemi!', { battle: true }); break;
    }
  }
  if (result === 'caught') {
    const isNew = !S.caught.includes(sp.id);
    if (isNew) S.caught.push(sp.id);
    Sound.jingle('catch');
    await say([`Preso! ${sp.name} è stato catturato!`].concat(isNew ? [`I dati di ${sp.name} sono stati registrati nel CARDIDEX.`] : [`${sp.name} era già nel CARDIDEX, ma un doppione fa sempre comodo.`]), { battle: true });
    autosave();
    if (isNew && S.caught.length === CREATURES.length) await say('Hai completato il CARDIDEX! Tutte le competenze di MAURO sono tue!', { battle: true });
  }
  ui.remove();
}
async function throwBall(sp) {
  await say('MAURO lancia una CARCIOFBALL!', { battle: true, auto: 20 });
  Sound.sfx('throw');
  const x0 = 50, y0 = 92, x1 = 188, y1 = 40;
  await tween(32, t => { B.ball = { x: x0 + (x1 - x0) * t, y: y0 + (y1 - y0) * t - Math.sin(t * Math.PI) * 50, r: t * 12 }; });
  Sound.sfx('pop');
  for (let i = 0; i < 8; i++) { B.flash = 1; await wait(2); B.flash = 0; await wait(2); }
  await tween(12, t => B.scale = 1 - t); B.hidden = true; B.scale = 1;
  await tween(14, t => { B.ball = { x: x1, y: y1 + (60 - y1) * Math.min(1, t * 1.2) - Math.sin(t * Math.PI * 2) * 6 * (1 - t), r: 0 }; });
  const p = clamp(0.3 + 0.62 * (1 - B.ehp) + B.boost + (sp.id === 1 ? 0.2 : 0) + (sp.night ? -0.1 : 0), 0.15, 0.97);
  const ok = Math.random() < p;
  const shakes = ok ? 3 : (Math.random() * 3) | 0;
  for (let i = 0; i < shakes; i++) {
    await wait(22); Sound.sfx('wobble');
    await tween(16, t => B.ball.r = Math.sin(t * Math.PI * 2) * 0.5);
  }
  await wait(20);
  if (ok) { B.stars = 1; Sound.sfx('save'); await wait(40); B.stars = 0; return true; }
  Sound.sfx('pop'); B.ball = null; B.hidden = false;
  for (let i = 0; i < 6; i++) { B.flash = 1; await wait(2); B.flash = 0; await wait(2); }
  await say(rnd(['Oh no! Il CARDIMON si è liberato!', 'Aaah! Ci era quasi!', 'Accidenti! Sembrava preso!']), { battle: true });
  B.boost = 0;
  return false;
}
function drawBattle() {
  const g = ctx, night = timePhase() === 'night';
  const sky = night ? ['#283058', '#404878'] : ['#B8E0F8', '#E8F4F0'];
  for (let y = 0; y < 112; y++) R(g, 0, y, 240, 1, y < 56 ? sky[0] : sky[1]);
  for (let y = 0; y < 56; y += 4) { g.globalAlpha = 0.25; R(g, 0, y, 240, 2, sky[1]); g.globalAlpha = 1; }
  R(g, 0, 70, 240, 42, night ? '#3A5A40' : '#A8D890'); for (let x = 0; x < 240; x += 6) R(g, x, 70 + (x % 12 ? 0 : 2), 3, 1, night ? '#2A4A30' : '#90C878');
  if (night) for (let i = 0; i < 20; i++) P(g, (i * 53) % 240, (i * 29) % 50, '#F8F8D8');
  ellipse(g, 188, 66, 44, 10, night ? '#2E5034' : '#78B860'); ellipse(g, 188, 65, 40, 8, night ? '#3E6A44' : '#98D078');
  ellipse(g, 62, 114, 54, 12, night ? '#2E5034' : '#78B860'); ellipse(g, 62, 113, 50, 10, night ? '#3E6A44' : '#98D078');
  // creatura
  if (B && !B.hidden) {
    const im = B.flash ? CRE_W[B.sp.id] : CRE[B.sp.id];
    const bob = Math.round(Math.sin(frame / 14) * 1);
    const s = B.scale, w = 56 * s, h = 56 * s;
    g.drawImage(im, Math.round(B.ex + (56 - w) / 2), Math.round(12 + (56 - h) + bob), w, h);
  }
  // Mauro di spalle
  if (B) {
    const sh = B.shakeMe > 0 ? ((B.shakeMe-- % 4) < 2 ? 2 : -2) : 0;
    g.drawImage(MAURO_BACK, 0, 0, 48, 58, Math.round(B.mx + 14 + sh), 54, 48, 58);
  }
  if (B && B.ball) {
    g.save(); g.translate(Math.round(B.ball.x), Math.round(B.ball.y)); g.rotate(B.ball.r || 0); g.drawImage(BALL, -6, -6); g.restore();
    if (B.stars) for (let i = 0; i < 3; i++) { const a = frame / 6 + i * 2.1; P(g, B.ball.x + Math.cos(a) * 12, B.ball.y - 4 + Math.sin(a) * 6, PAL.yel); P(g, B.ball.x + Math.cos(a) * 12 + 1, B.ball.y - 4 + Math.sin(a) * 6, PAL.wht); }
  }
}

/* =========================================================
   SCENE: avvio, titolo, introduzione
   ========================================================= */
let scene = 'boot';
let titleEls = null;
function drawSky(g, t, ph) {
  const cols = ph === 'night' ? ['#141C40', '#28305C', '#3A3E70'] : ph === 'dusk' ? ['#5868B0', '#E88878', '#F8C080'] : ['#5AA8F0', '#88C8F8', '#C8E8F8'];
  for (let y = 0; y < 160; y++) R(g, 0, y, 240, 1, y < 50 ? cols[0] : y < 90 ? cols[1] : cols[2]);
  for (let y = 46; y < 54; y += 2) R(g, 0, y, 240, 1, cols[1]);
  for (let y = 86; y < 94; y += 2) R(g, 0, y, 240, 1, cols[2]);
  if (ph === 'night') {
    for (let i = 0; i < 40; i++) { const sx = (i * 97 + 13) % 240, sy = (i * 31) % 80; if ((i + (t >> 5)) % 7) P(g, sx, sy, i % 3 ? '#F8F8D8' : '#A8B0E0'); }
    ellipse(g, 214, 70, 9, 9, '#F8F0C8'); ellipse(g, 218, 67, 8, 8, cols[1]); // la luna
  } else {
    ellipse(g, 212, 72, 11, 11, ph === 'dusk' ? '#F8A060' : '#F8F0A0');
    for (let i = 0; i < 4; i++) { const x = ((i * 80 + t * 0.15 * (i % 2 ? 1 : 0.6)) % 300) - 40, y = 20 + i * 14; ellipse(g, x, y, 16, 4, '#F8F8F8'); ellipse(g, x + 10, y - 3, 10, 4, '#F8F8F8'); }
  }
  // Vesuvio
  const vc = ph === 'night' ? '#2A2E58' : ph === 'dusk' ? '#8A6890' : '#7898C8';
  g.fillStyle = vc; g.beginPath(); g.moveTo(30, 112); g.lineTo(78, 64); g.lineTo(92, 70); g.lineTo(104, 58); g.lineTo(118, 60); g.lineTo(176, 112); g.fill();
  R(g, 100, 56 + 0, 12, 3, vc);
  // skyline di Cardito
  const sc = ph === 'night' ? '#1C2040' : ph === 'dusk' ? '#5A4060' : '#4E6E8E';
  R(g, 0, 104, 240, 20, sc);
  [[6, 96, 22, 8], [30, 92, 18, 12], [52, 98, 26, 6], [150, 94, 30, 10], [184, 90, 20, 14], [208, 97, 32, 7]].forEach(([x, y, w, h]) => R(g, x, y, w, h, sc));
  R(g, 92, 74, 12, 30, sc); R(g, 94, 70, 8, 4, sc); R(g, 97, 64, 2, 6, sc); // campanile
  R(g, 112, 86, 34, 18, sc); for (let x = 112; x < 146; x += 6) R(g, x, 82, 4, 4, sc); // castello
  if (ph === 'night') for (let i = 0; i < 14; i++) R(g, 8 + i * 17, 100 + (i % 3) * 3, 2, 2, '#F8D878');
  // campo di carciofi
  R(g, 0, 118, 240, 42, ph === 'night' ? '#244A2C' : '#5AA048');
  for (let r = 0; r < 3; r++) for (let i = 0; i < 12; i++) {
    const x = ((i * 26 + r * 13 - t * (0.3 + r * 0.2)) % 264 + 264) % 264 - 12, y = 124 + r * 13;
    ellipse(g, x, y + 3, 6 + r, 2, ph === 'night' ? '#1E3E24' : '#4E8A48'); ellipse(g, x, y, 2 + r * 0.6, 3 + r * 0.6, ph === 'night' ? '#4E6A50' : '#7EA070'); P(g, x, y - 3 - r, '#9A6AA8');
  }
}
let titleT = 0, titleMenuOpen = false;
function enterTitle() {
  scene = 'title'; titleT = 0; titleMenuOpen = false;
  Sound.play('title');
  titleEls = el('div'); titleEls.innerHTML = `<div class="logo"><div class="t">CARDITOPOLI</div><div class="v">VERSIONE CARCIOFO</div></div><div class="press">PREMI START</div><div class="copy">un portfolio giocabile di Mauro Esposito · 2026</div>`;
  UI.insertBefore(titleEls, fadeEl);
  titleEls.querySelector('.press').onclick = () => Input.tap('start');
  fadeTo(0, 20);
}
async function titleMenu() {
  titleMenuOpen = true;
  titleEls.querySelector('.press').style.visibility = 'hidden';
  const has = !!store.get(SAVE_KEY);
  const items = (has ? ['CONTINUA'] : []).concat(['NUOVA PARTITA', 'SFOGLIA I PROGETTI', 'OPZIONI']);
  for (; ;) {
    const i = await menu(items, { pos: { left: '50%', bottom: '22px', transform: 'translateX(-50%)', minWidth: '120px' }, noBack: false });
    const it = items[i];
    if (i < 0) { titleMenuOpen = false; titleEls.querySelector('.press').style.visibility = ''; return; }
    if (it === 'CONTINUA') { S = Object.assign(freshState(), store.get(SAVE_KEY)); return startGame(false); }
    if (it === 'NUOVA PARTITA') { S = freshState(); return startGame(true); }
    if (it === 'SFOGLIA I PROGETTI') await openProjects(true);
    if (it === 'OPZIONI') await openOptions();
  }
}
async function startGame(isNew) {
  await fadeTo(1, 16); titleEls.remove(); titleEls = null;
  if (isNew) { await intro(); }
  S.flags.started = true;
  scene = 'world';
  loadMap(S.map, S.x, S.y, S.dir);
  await fadeTo(0, 16);
  if (isNew) { busy++; await wait(20); await say(['MAURO si sveglia nella sua stanza a CARDITOPOLI.', 'Dalla cucina arriva un profumo di caffè... e la voce della mamma.']); busy--; }
}
let introSpr = null;
async function intro() {
  scene = 'intro'; Sound.play('inside');
  introSpr = { who: 'prof', x: 120, a: 0 };
  await fadeTo(0, 20);
  await tween(20, t => introSpr.a = t);
  await say(['Ciao! Benvenuto nel mondo di CARDITOPOLI!', 'Mi chiamo BIAGIO, ma qui tutti mi chiamano il PROFESSORE.', 'Carditopoli è una città un po\' speciale: è ispirata a Cardito, in provincia di Napoli.', 'Il nome viene dal latino "carduetum": la carciofaia. E infatti qui i carciofi... sono vivi!', 'Queste creature si chiamano CARDIMON. Ognuna rappresenta un talento.']);
  await tween(16, t => introSpr.a = 1 - t);
  introSpr = { who: 'mauro', x: 120, a: 0 };
  await tween(20, t => introSpr.a = t);
  await say(['E lui è MAURO!', 'Graphic designer, content creator ed economista della cultura. Freelance dal 2018.', 'Ogni edificio di Carditopoli custodisce uno dei suoi progetti.', 'Visitali tutti per ottenere le MEDAGLIE, e cattura i CARDIMON nell\'erba alta.']);
  await say(isTouch ? ['Comandi: croce per muoverti, A per parlare, B (tenuto premuto) per correre e per tornare indietro, START per il menu.'] : ['Comandi: FRECCE per muoverti, Z (o A) per parlare, X (o S) tenuto premuto per correre e per tornare indietro, INVIO per il menu. M accende e spegne la musica.']);
  await say('La tua avventura a CARDITOPOLI sta per cominciare!');
  await tween(30, t => { introSpr.shrink = t; });
  await fadeTo(1, 16); introSpr = null;
}
function drawIntro() {
  const g = ctx;
  for (let y = 0; y < 160; y++) R(g, 0, y, 240, 1, y < 100 ? '#E8E0F0' : '#D0C8E0');
  ellipse(g, 120, 104, 40, 8, '#B0A8C8');
  if (!introSpr) return;
  const sh = sheet(introSpr.who).down[0];
  const sc = 3 * (1 - (introSpr.shrink || 0) * 0.85);
  g.globalAlpha = introSpr.a;
  g.drawImage(sh, Math.round(introSpr.x - 8 * sc), Math.round(104 - 22 * sc), Math.round(16 * sc), Math.round(24 * sc));
  g.globalAlpha = 1;
}

let bootEl = null, bootT = 0;
function enterBoot() {
  scene = 'boot'; bootT = 0;
  bootEl = el('div', 'boot', '<div class="b1">PULLME UP</div><div class="b2">PRESENTA</div>');
  UI.insertBefore(bootEl, fadeEl); setFade(1);
}

/* =========================================================
   LOOP PRINCIPALE
   ========================================================= */
function update() {
  frame++;
  Input.poll();
  // tween & attese
  for (let i = tweens.length - 1; i >= 0; i--) { const tw = tweens[i]; tw.t++; tw.fn(Math.min(1, tw.t / tw.f)); if (tw.t >= tw.f) { tweens.splice(i, 1); tw.r(); } }
  for (let i = waits.length - 1; i >= 0; i--) { if (--waits[i].f <= 0) { const w = waits.splice(i, 1)[0]; w.r(); } }
  // input ai livelli UI
  const top = Layers[Layers.length - 1];
  const rep = Input.repeat();
  if (top) { let done = false; for (const b of ['a', 'b', 'start', 'up', 'down', 'left', 'right']) if (Input.just(b)) { top.input(b); done = true; break; } if (!done && rep.length && !top.noRepeat) top.input(rep[0]); }
  Layers.forEach(l => l.update && l.update());
  if (bannerT > 0 && --bannerT === 0 && bannerEl) bannerEl.classList.remove('on');

  if (scene === 'boot') {
    bootT++;
    if (bootT === 10) fadeTo(0, 30);
    if (bootT === 130) fadeTo(1, 25);
    if (bootT > 160 || (bootT > 10 && (Input.just('a') || Input.just('start')))) { bootEl.remove(); setFade(1); enterTitle(); }
  } else if (scene === 'title') {
    titleT++;
    const pr = titleEls && titleEls.querySelector('.press'); if (pr && !titleMenuOpen) pr.style.opacity = (titleT >> 5) & 1 ? 1 : 0.15;
    if (!titleMenuOpen && !Layers.length && (Input.just('start') || Input.just('a'))) { Sound.init(); Sound.play('title'); Sound.sfx('select'); titleMenu(); }
  } else if (scene === 'rhythm') {
    updateRhythm();
  } else if (scene === 'world') {
    S.time += 1 / 60;
    updatePlayer(); updateNpcs();
  }
  Input.end();
}
function render() {
  if (scene === 'world') drawWorld();
  else if (scene === 'battle') drawBattle();
  else if (scene === 'title') drawSky(ctx, titleT, timePhase());
  else if (scene === 'intro') drawIntro();
  else if (scene === 'rhythm') drawRhythm();
  else R(ctx, 0, 0, 240, 160, '#000');
  if (trans) {
    if (trans.flash) R(ctx, 0, 0, 240, 160, '#F8F8F8');
    if (trans.bars != null) { const h = Math.ceil(trans.bars * 10); for (let y = 0; y < 160; y += 10) R(ctx, 0, y, 240, h, '#101018'); }
  }
}
let last = performance.now(), acc = 0;
function loop(now) {
  acc += Math.min(100, now - last); last = now;
  while (acc >= 1000 / 60) { update(); acc -= 1000 / 60; }
  render();
  requestAnimationFrame(loop);
}

/* avvio */
initGfx();
window.addEventListener('pointerdown', () => Sound.init(), { once: true });
if (QS.has('skip')) { setFade(1); enterTitle(); } else enterBoot();
requestAnimationFrame(loop);
window.__C = { S, PL, get MAP() { return MAP; }, Input, Layers, loadMap, get scene() { return scene; }, encounter, pickCreature }; // debug
