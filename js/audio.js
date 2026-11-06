/* =========================================================
   CARDITOPOLI — audio.js
   Sintetizzatore chiptune in WebAudio. Tutte le musiche sono
   composizioni originali scritte per Carditopoli.
   Formato note: "C5-2" = Do5 per 2 passi, "r-1" = pausa.
   ========================================================= */
'use strict';

const Sound = (() => {
  let ctx = null, master, musicG, sfxG, noiseBuf, timer = null, cur = null, curName = null, resumeName = null;
  let musicOn = true, sfxOn = true;
  const SEMI = { C: 0, 'C#': 1, Db: 1, D: 2, 'D#': 3, Eb: 3, E: 4, F: 5, 'F#': 6, Gb: 6, G: 7, 'G#': 8, Ab: 8, A: 9, 'A#': 10, Bb: 10, B: 11 };
  const rep = (s, n) => Array(n).fill(s).join(' ');
  const freq = n => { const m = n.match(/^([A-G][#b]?)(\d)$/); return 440 * Math.pow(2, (SEMI[m[1]] + (+m[2] + 1) * 12 - 69) / 12); };
  const parse = s => s.trim().split(/\s+/).map(t => { const [n, d] = t.split('-'); return { n, d: d ? +d : 1 }; });

  /* ---------------- BRANI ---------------- */
  // Carditopoli: tarantella in 6/8 (originale)
  const chord = { Am: 'r-1 C4 E4 r-1 C4 E4', E: 'r-1 B3 D4 r-1 B3 D4', F: 'r-1 A3 C4 r-1 A3 C4', C: 'r-1 G3 C4 r-1 G3 C4', Dm: 'r-1 A3 D4 r-1 A3 D4', G: 'r-1 B3 D4 r-1 B3 D4', G7: 'r-1 B3 F4 r-1 B3 F4', EA: 'r-1 B3 D4 r-1 C4 E4' };
  const TRACKS = {
    town: {
      step: 0.19, loop: true, ch: [
        { w: 'square', v: 0.11, s: 'A4 C5 E5 A5 E5 C5  B4 D5 E5 G#5 E5 D5  A4 C5 E5 A5 B5 C6  B5-2 G#5 A5-3  F5 E5 D5 C5 D5 E5  G5 F5 E5 D5 E5 F5  D5 F5 A5 G#5 F5 D5  E5-2 D5 C5 B4 A4 ' +
            'G5 G5 E5 C6-2 G5  F5 F5 D5 B5-2 G5  E5 G5 C6 E6-2 D6  C6 B5 A5 G5-3  A5 A5 F5 C6-2 A5  G5 G5 E5 C6-2 E5  D5 F5 B5 A5 G5 F5  E5 G#5 B5 E5-3' },
        { w: 'square', v: 0.035, s: [chord.Am, chord.E, chord.Am, chord.EA, chord.F, chord.C, chord.Dm, chord.EA, chord.C, chord.G, chord.C, chord.G, chord.F, chord.C, chord.G7, chord.E].join(' ') },
        { w: 'triangle', v: 0.2, s: 'A2-3 E3-3 E2-3 B2-3 A2-3 E3-3 E2-3 A2-3 F2-3 C3-3 C3-3 G2-3 D3-3 A2-3 E2-3 A2-3 C3-3 G2-3 G2-3 D3-3 C3-3 G2-3 G2-3 D3-3 F2-3 C3-3 C3-3 G2-3 G2-3 D3-3 E2-3 B2-3' },
        { w: 'noise', v: 0.05, s: rep('x o o x o o', 16) },
      ]
    },
    title: {
      step: 0.115, loop: true, ch: [
        { w: 'square', v: 0.12, s: 'C5-4 G4-2 C5-2 E5-4 G5-4  F5-4 E5-2 D5-2 E5-6 C5-2  A4-4 C5-2 F5-2 A5-4 G5-4  G5-4 F5-2 E5-2 D5-8  C5-4 G4-2 C5-2 E5-4 G5-4  C6-6 B5-2 A5-4 G5-4  F5-4 A5-2 G5-2 F5-4 D5-4  C5-12 r-4' },
        { w: 'square', v: 0.04, s: rep('E4-2 G4-2 C5-2 G4-2', 4) + ' ' + rep('A4-2 C5-2 F5-2 C5-2', 2) + ' ' + rep('B4-2 D5-2 G5-2 D5-2', 2) + ' ' + rep('E4-2 G4-2 C5-2 G4-2', 2) + ' ' + rep('C5-2 E5-2 A5-2 E5-2', 2) + ' ' + rep('A4-2 C5-2 F5-2 C5-2', 1) + ' ' + rep('B4-2 D5-2 G5-2 D5-2', 1) + ' ' + rep('E4-2 G4-2 C5-2 G4-2', 2) },
        { w: 'triangle', v: 0.22, s: rep('C3-2 C4-2', 8) + ' ' + rep('F2-2 F3-2', 4) + ' ' + rep('G2-2 G3-2', 4) + ' ' + rep('C3-2 C4-2', 4) + ' ' + rep('A2-2 A3-2', 4) + ' ' + rep('F2-2 F3-2', 2) + ' ' + rep('G2-2 G3-2', 2) + ' ' + rep('C3-2 C4-2', 4) },
        { w: 'noise', v: 0.04, s: rep('x r o r x r o r x r o r x r o o', 8) },
      ]
    },
    battle: {
      step: 0.094, loop: true, ch: [
        {
          w: 'square', v: 0.11, s: rep('E5 E5 r E5 D5 E5 G5 E5 B4 B4 r B4 A4 B4 D5 B4  C5 C5 r C5 B4 C5 E5 C5 D5 D5 r D5 F#5 E5 D5 B4', 2) +
            ' E5-2 G5-2 B5-2 A5-2 G5-2 F#5-2 E5-2 D5-2  C5-2 E5-2 G5-2 F#5-2 E5-4 D#5-4  E5-2 G5-2 B5-2 E6-2 D6-2 B5-2 G5-2 A5-2  B5-8 B4-4 D#5-4'
        },
        { w: 'square', v: 0.035, s: rep(rep('B3-2 E4-2', 4) + ' ' + rep('C4-2 E4-2', 2) + ' ' + rep('D4-2 F#4-2', 2), 2) + ' ' + rep('B3-2 E4-2', 4) + ' ' + rep('C4-2 E4-2', 2) + ' ' + rep('B3-2 D#4-2', 2) + ' ' + rep('B3-2 E4-2', 4) + ' ' + rep('B3-2 D#4-2', 4) },
        { w: 'triangle', v: 0.22, s: rep(rep('E2-2 E3-2', 4) + ' ' + rep('C2-2 C3-2', 2) + ' ' + rep('D2-2 D3-2', 2), 2) + ' ' + rep('E2-2 E3-2', 4) + ' ' + rep('C2-2 C3-2', 2) + ' ' + rep('B1-2 B2-2', 2) + ' ' + rep('E2-2 E3-2', 4) + ' ' + rep('B1-2 B2-2', 4) },
        { w: 'noise', v: 0.05, s: rep('x r o r x o o r', 16) },
      ]
    },
    inside: {
      step: 0.17, loop: true, ch: [
        { w: 'square', v: 0.09, s: 'C5-2 F5-2 A5-2  G5-3 F5-1 E5-2  F5-2 A5-2 C6-2  Bb5-4 A5-2  G5-2 Bb5-2 D6-2  C6-3 Bb5-1 A5-2  G5-2 E5-2 C5-2  F5-6' },
        { w: 'square', v: 0.03, s: 'r-2 A3-2 C4-2 r-2 G3-2 C4-2 r-2 A3-2 C4-2 r-2 Bb3-2 D4-2 r-2 Bb3-2 D4-2 r-2 A3-2 C4-2 r-2 G3-2 C4-2 r-2 A3-2 C4-2' },
        { w: 'triangle', v: 0.2, s: 'F2-6 C3-6 F2-6 Bb2-6 G2-6 C3-6 C3-6 F2-6' },
      ]
    },
    // brano rock originale per il gioco della chitarra (20 battute da 8 passi)
    rock: {
      step: 0.15, loop: false, ch: [
        { w: 'square', v: 0.12, s: 'r-8 r-8 ' + rep('E4 E4 G4 E4 A4 E4 B4 A4  G4 G4 E4 D4 E4-2 r-2  E4 E4 G4 E4 A4 E4 B4 A4  G4 A4 B4 D5 B4-2 A4-2  E5-2 D5 B4 D5-2 E5-2  G5-2 F#5 E5 D5-2 B4-2  C5-2 B4 A4 G4-2 A4-2  B4-4 r-2 B4 D#5', 2) + ' E5 D5 B4 A4 G4 E4 G4 A4  E4-8' },
        { w: 'square', v: 0.04, s: rep('E3 E3 B3 E3 E3 B3 E3 D3', 2) + ' ' + rep(rep('E3 E3 B3 E3 E3 B3 E3 D3', 3) + ' G3 G3 D4 G3 D3 D3 A3 D3  ' + rep('E3 E3 B3 E3 E3 B3 E3 D3', 1) + ' G3 G3 D4 G3 D3 D3 A3 D3  C3 C3 G3 C3 A2 A2 E3 A2  B2 B2 F#3 B2 B2 B2 F#3 B2', 2) + ' ' + rep('E3 E3 B3 E3 E3 B3 E3 D3', 2) },
        { w: 'triangle', v: 0.22, s: rep('E2-2 E3-2 E2-2 E3-2', 2) + ' ' + rep(rep('E2-2 E3-2 E2-2 E3-2', 3) + ' G2-2 G3-2 D2-2 D3-2  E2-2 E3-2 E2-2 E3-2  G2-2 G3-2 D2-2 D3-2  C2-2 C3-2 A1-2 A2-2  B1-2 B2-2 B1-2 B2-2', 2) + ' ' + rep('E2-2 E3-2 E2-2 E3-2', 2) },
        { w: 'noise', v: 0.06, s: rep('x r o r x o o r', 20) },
      ]
    },
    chitarra: { step: 0.12, loop: false, ch: [{ w: 'triangle', v: 0.25, s: 'E3 B3 E4 G4 B4 G4 E4 B3  A3 E4 A4 C5 E5-4  D4 A4 D5 F#5 A5-2 F#5 D5  E4 B4 E5 G#5 B5-6' }, { w: 'square', v: 0.03, s: 'E3-8 A3-8 D4-8 E4-8' }] },
    catch: { step: 0.09, loop: false, ch: [{ w: 'square', v: 0.13, s: 'C5 E5 G5 C6-2 r-1 G5 C6-6' }, { w: 'triangle', v: 0.22, s: 'C3-4 G2-2 C3-7' }] },
    badge: { step: 0.1, loop: false, ch: [{ w: 'square', v: 0.13, s: 'G4 C5 E5 G5-2 E5 G5 C6-6 r-1 B5 C6-2 D6-2 E6-8' }, { w: 'triangle', v: 0.22, s: 'C3-4 E3-3 G2-3 C3-4 G2-4 C3-8' }] },
  };

  /* ---------------- MOTORE ---------------- */
  function init() {
    if (ctx) { if (ctx.state === 'suspended') ctx.resume(); return; }
    try {
      ctx = new (window.AudioContext || window.webkitAudioContext)();
      master = ctx.createGain(); master.gain.value = 0.6; master.connect(ctx.destination);
      musicG = ctx.createGain(); musicG.gain.value = musicOn ? 1 : 0; musicG.connect(master);
      sfxG = ctx.createGain(); sfxG.gain.value = sfxOn ? 1 : 0; sfxG.connect(master);
      noiseBuf = ctx.createBuffer(1, ctx.sampleRate * 0.5, ctx.sampleRate);
      const d = noiseBuf.getChannelData(0); for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
      timer = setInterval(tick, 25);
      if (curName) { const n = curName; curName = null; play(n); }
    } catch (e) { ctx = null; }
  }
  function tone(type, f, t, dur, vol, dest) {
    const o = ctx.createOscillator(), g = ctx.createGain();
    o.type = type; o.frequency.setValueAtTime(f, t);
    g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(vol, t + 0.005);
    g.gain.setValueAtTime(vol * 0.75, t + Math.min(0.05, dur * 0.4));
    g.gain.linearRampToValueAtTime(0, t + dur * 0.92);
    o.connect(g); g.connect(dest); o.start(t); o.stop(t + dur);
  }
  function noise(t, dur, vol, hp, dest) {
    const s = ctx.createBufferSource(), f = ctx.createBiquadFilter(), g = ctx.createGain();
    s.buffer = noiseBuf; f.type = 'highpass'; f.frequency.value = hp;
    g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(0.001, t + dur);
    s.connect(f); f.connect(g); g.connect(dest); s.start(t); s.stop(t + dur + 0.02);
  }
  function tick() {
    if (!ctx || !cur) return;
    const now = ctx.currentTime, tr = cur.tr;
    let allDone = true;
    cur.ch.forEach(c => {
      if (c.done) return; allDone = false;
      while (c.next < now + 0.15) {
        const nt = c.notes[c.i], dur = nt.d * tr.step;
        if (nt.n !== 'r') {
          if (c.w === 'noise') { const loud = nt.n === 'x'; noise(c.next, loud ? 0.08 : 0.04, c.v * (loud ? 1 : 0.5), loud ? 3000 : 6000, musicG); }
          else tone(c.w, freq(nt.n), c.next, dur, c.v, musicG);
        }
        c.next += dur; c.i++;
        if (c.i >= c.notes.length) { if (tr.loop) c.i = 0; else { c.done = true; break; } }
      }
    });
    if (allDone && cur.onEnd) { const cb = cur.onEnd; const endAt = Math.max(...cur.ch.map(c => c.next)); if (now > endAt) { cur = null; cb(); } }
  }
  function start(name, onEnd) {
    const tr = TRACKS[name]; if (!tr) return;
    const t0 = ctx ? ctx.currentTime + 0.05 : 0;
    cur = { tr, onEnd, ch: tr.ch.map(c => ({ w: c.w, v: c.v, notes: parse(c.s), i: 0, next: t0 })) };
  }
  // brani esterni in mp3 (es. la musica della lotta)
  const FILES = { battle: 'audio/battle.mp3' };
  let fileEl = null;
  function stopFile() { if (fileEl) { fileEl.pause(); fileEl = null; } }
  function play(name) {
    if (FILES[name]) {
      if (fileEl && curName === name) return;
      stopFile(); cur = null; curName = name;
      fileEl = new Audio(FILES[name]); fileEl.loop = true; fileEl.volume = musicOn ? 0.7 : 0;
      const p = fileEl.play(); if (p) p.catch(() => { stopFile(); curName = null; start('battle'); curName = name; });
      return;
    }
    stopFile();
    if (curName === name && cur) return;
    curName = name;
    if (!ctx) return;
    start(name);
  }
  function jingle(name) {
    const back = curName; curName = null; stopFile();
    if (!ctx) return;
    start(name, () => { if (back) play(back); });
  }
  function stop() { cur = null; curName = null; stopFile(); }
  /* effetti */
  function sfx(kind) {
    if (!ctx || !sfxOn) return;
    const t = ctx.currentTime + 0.01;
    switch (kind) {
      case 'select': tone('square', 1320, t, 0.05, 0.1, sfxG); break;
      case 'back': tone('square', 660, t, 0.05, 0.08, sfxG); break;
      case 'bump': tone('square', 90, t, 0.09, 0.12, sfxG); break;
      case 'door': noise(t, 0.25, 0.12, 400, sfxG); tone('triangle', 220, t, 0.15, 0.2, sfxG); break;
      case 'exit': noise(t, 0.2, 0.1, 800, sfxG); break;
      case 'grass': noise(t, 0.05, 0.05, 5000, sfxG); break;
      case 'talk': tone('square', 880, t, 0.03, 0.05, sfxG); break;
      case 'save': [523, 659, 784, 1046].forEach((f, i) => tone('square', f, t + i * 0.07, 0.08, 0.1, sfxG)); break;
      case 'encounter': for (let i = 0; i < 12; i++) tone('square', 300 + i * 90, t + i * 0.035, 0.04, 0.09, sfxG); break;
      case 'hit': noise(t, 0.18, 0.2, 500, sfxG); tone('square', 140, t, 0.12, 0.12, sfxG); break;
      case 'throw': for (let i = 0; i < 8; i++) tone('triangle', 900 - i * 60, t + i * 0.03, 0.04, 0.2, sfxG); break;
      case 'wobble': tone('square', 330, t, 0.06, 0.09, sfxG); tone('square', 262, t + 0.08, 0.06, 0.09, sfxG); break;
      case 'pop': tone('square', 1500, t, 0.04, 0.1, sfxG); noise(t, 0.12, 0.12, 2000, sfxG); break;
      case 'flee': for (let i = 0; i < 6; i++) tone('square', 700 - i * 80, t + i * 0.04, 0.05, 0.08, sfxG); break;
      case 'win': [784, 988, 1175].forEach((f, i) => tone('square', f, t + i * 0.08, 0.1, 0.1, sfxG)); break;
      case 'wrong': tone('square', 200, t, 0.15, 0.1, sfxG); tone('square', 150, t + 0.16, 0.25, 0.1, sfxG); break;
    }
  }
  return {
    init, play, jingle, stop, sfx,
    // suona un brano una volta sola (per il gioco della chitarra)
    once(name, onEnd) { curName = null; if (!ctx) { if (onEnd) setTimeout(onEnd, 30000); return; } start(name, onEnd || (() => { })); },
    // note della prima voce di un brano con il loro tempo in secondi
    chart(name) { const tr = TRACKS[name]; let t = 0; const out = []; parse(tr.ch[0].s).forEach(n => { if (n.n !== 'r') out.push({ t, n: n.n, midi: SEMI[n.n.slice(0, -1)] + (+n.n.slice(-1) + 1) * 12 }); t += n.d * tr.step; }); return { notes: out, len: t }; },
    get ready() { return !!ctx; },
    setMusic(on) { musicOn = on; if (musicG) musicG.gain.value = on ? 1 : 0; if (fileEl) fileEl.volume = on ? 0.7 : 0; },
    setSfx(on) { sfxOn = on; if (sfxG) sfxG.gain.value = on ? 1 : 0; },
    get musicOn() { return musicOn; }, get sfxOn() { return sfxOn; },
    get current() { return curName; },
  };
})();
