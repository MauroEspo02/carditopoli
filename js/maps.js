/* =========================================================
   CARDITOPOLI — maps.js
   La città (60x48 tile) e gli interni degli edifici.
   ========================================================= */
'use strict';

const MAPS = {};

function newGrid(w, h, ch) { return Array.from({ length: h }, () => Array(w).fill(ch)); }
function fill(m, ch, x, y, w, h) { for (let j = y; j < y + h; j++) for (let i = x; i < x + w; i++) if (m.t[j] && i >= 0 && i < m.w) m.t[j][i] = ch; }

function addTree(m, x, y, kind = 'oak') { m.objs.push({ kind: 'tree', x, y, w: 2, h: 2, img: TREE_IMGS[kind], ox: 0, oy: 0, solid: true }); }
function addBld(m, x, y, kind, warpTo, extra = {}) {
  const b = building(kind);
  const o = Object.assign({ kind: 'bld', x, y, w: b.w, h: b.h, img: b.img, ox: 0, oy: -b.top, solid: true, wins: b.wins, door: [x + b.door, y + b.h - 1] }, extra);
  m.objs.push(o);
  if (warpTo) m.warps[o.door[0] + ',' + o.door[1]] = { to: warpTo, enter: true };
  return o;
}
function addProp(m, name, x, y, opt = {}) {
  const img = PROPS[name];
  const fw = opt.fw || Math.ceil(img.width / 16), fh = opt.fh || 1;
  const o = Object.assign({ kind: 'prop', name, x, y, w: fw, h: fh, img, ox: opt.ox || 0, oy: (fh * 16) - img.height + (opt.oy || 0), solid: opt.solid !== false }, opt);
  m.objs.push(o); return o;
}
function addSign(m, x, y, lines, opt = {}) { return addProp(m, opt.big ? 'bigsign' : 'sign', x, y, Object.assign({ act: lines }, opt)); }
function addNpc(m, id, look, x, y, dir, talk, opt = {}) { m.npcs.push(Object.assign({ id, look, x, y, dir, talk, home: [x, y] }, opt)); }

let TREE_IMGS = {};

function makePalco() {
  const c = mk(96, 72), g = c.g, top = 8;
  // pedana
  R(g, 2, top + 40, 92, 22, PAL.woodd); R(g, 2, top + 40, 92, 3, PAL.woodl); for (let x = 6; x < 92; x += 10) R(g, x, top + 44, 1, 18, PAL.wooddd);
  // fondale
  R(g, 8, top + 6, 80, 34, '#9A2030'); for (let x = 10; x < 88; x += 6) R(g, x, top + 6, 2, 34, '#B83040');
  // americana
  R(g, 0, 4, 4, top + 38, '#505860'); R(g, 92, 4, 4, top + 38, '#505860'); R(g, 0, 2, 96, 5, '#505860');
  for (let x = 2; x < 94; x += 6) { R(g, x, 3, 3, 3, '#303038'); }
  for (let k = 0; k < 5; k++) { R(g, 16 + k * 16, 7, 6, 4, '#202028'); R(g, 17 + k * 16, 10, 4, 2, PAL.yel); }
  // striscione
  R(g, 28, top + 10, 40, 11, PAL.yel); R(g, 28, top + 10, 40, 1, PAL.wht); text3(g, 'FRITZ', 38, top + 13, '#9A2030');
  // casse
  for (const sx of [6, 78]) { R(g, sx, top + 24, 12, 16, '#202028'); ellipse(g, sx + 6, top + 29, 3, 3, '#505060'); ellipse(g, sx + 6, top + 36, 2, 2, '#505060'); }
  R(g, 47, top + 26, 2, 14, '#505860'); ellipse(g, 48, top + 25, 2, 2, '#303038');
  return outline(c);
}

/* ---------------- LA CITTÀ ---------------- */
function buildTown() {
  const W = 60, H = 48;
  const m = { id: 'town', name: 'CARDITOPOLI', w: W, h: H, t: newGrid(W, H, '.'), objs: [], npcs: [], warps: {}, outdoor: true, music: 'town' };

  // campi a nord
  fill(m, '"', 4, 3, 20, 7); fill(m, '"', 35, 3, 21, 7); fill(m, '"', 6, 10, 8, 2); fill(m, '"', 46, 10, 9, 2);
  fill(m, 'c', 25, 3, 3, 6); fill(m, 'c', 31, 3, 3, 6);
  fill(m, 'r', 36, 11, 8, 2); fill(m, 'r', 15, 11, 7, 2);
  fill(m, '=', 28, 2, 3, 20);      // viale nord
  fill(m, '=', 2, 14, 56, 2);      // strada di campagna
  // piazza
  fill(m, '#', 15, 22, 28, 7); fill(m, '#', 25, 16, 8, 6);
  fill(m, '_', 2, 29, 56, 1); fill(m, '-', 2, 30, 58, 2); fill(m, ':', 2, 30, 58, 1); fill(m, '_', 2, 32, 56, 1);
  fill(m, '=', 43, 22, 2, 7); fill(m, '=', 43, 33, 2, 6);
  fill(m, '=', 24, 39, 2, 2); fill(m, '=', 14, 40, 22, 1); fill(m, '=', 34, 41, 2, 2);
  // fiori
  [[13, 22], [14, 23], [13, 24], [44, 16], [42, 17], [21, 36], [27, 36], [21, 37], [28, 37], [5, 26], [6, 27], [11, 25], [56, 13], [3, 13], [30, 44], [31, 44]].forEach(([x, y]) => m.t[y][x] = 'f');
  // laghetto
  fill(m, '~', 44, 39, 13, 6); fill(m, '.', 44, 39, 1, 1); fill(m, '.', 56, 39, 1, 1);
  // orto di LAND
  fill(m, 'S', 4, 35, 9, 6);
  for (let x = 4; x <= 12; x += 2) for (let y = 36; y <= 39; y++) if ((x + y) % 3) m.t[y][x] = 'c';
  // recinti
  for (let x = 3; x <= 13; x++) { m.t[34][x] = 'F'; m.t[41][x] = 'F'; }
  for (let y = 34; y <= 41; y++) { m.t[y][3] = 'F'; m.t[y][13] = 'F'; }
  m.t[34][8] = '='; // cancello
  for (let x = 15; x <= 21; x++) { m.t[42][x] = 'F'; m.t[45][x] = 'F'; }
  for (let y = 42; y <= 45; y++) { m.t[y][15] = 'F'; m.t[y][21] = 'F'; }
  m.t[42][18] = '=';

  // bordo di alberi
  for (let x = 0; x < W; x += 2) { addTree(m, x, 0); addTree(m, x, H - 2); }
  for (let x = 1; x < W - 2; x += 2) if (x < 27 || x > 30) addTree(m, x, 1);
  for (let y = 2; y < H - 2; y += 2) { addTree(m, 0, y); if (y !== 30) addTree(m, W - 2, y); }
  // alberi interni
  [[12, 3], [24, 10], [33, 10], [52, 11], [14, 30 - 13]].forEach(([x, y]) => addTree(m, x, y));
  [[3, 23], [7, 23], [3, 27], [9, 26], [36, 34], [32, 37]].forEach(([x, y]) => addTree(m, x, y, 'pine'));
  [[5, 42], [9, 42], [11, 43]].forEach(([x, y]) => addTree(m, x, y, 'olive'));

  // edifici
  addBld(m, 3, 16, 'sabaude', 'sabaude');
  addBld(m, 17, 16, 'chiesa', 'chiesa');
  addBld(m, 33, 16, 'castello', 'castello');
  addBld(m, 45, 17, 'comune', 'comune');
  addBld(m, 45, 23, 'kebab', 'kebab');
  addBld(m, 52, 23, 'mercoleterry', 'mercoleterry');
  addBld(m, 45, 33, 'pullmeup', 'pullmeup');
  addBld(m, 22, 35, 'casa', 'casa');
  addBld(m, 37, 39, 'archivio', 'archivio');
  m.objs.push({ kind: 'prop', name: 'palco', x: 52, y: 33, w: 6, h: 4, img: makePalco(), ox: 0, oy: 4 * 16 - 72, solid: true, act: () => Game.projectTalk('fritz', ['Sul palco c\'è scritto FRITZ.', 'Le luci sono ancora calde dall\'ultimo concerto...']) });

  // arredo piazza
  m.objs.push({ kind: 'prop', name: 'fountain', x: 27, y: 24, w: 3, h: 2, img: PROPS.fountain, ox: 0, oy: 32 - 40, solid: true, act: ['Una fontana. L\'acqua è fresca.', 'Qualcuno ci ha lanciato dentro una monetina... e un carciofo.'] });
  addProp(m, 'bench', 16, 27, { act: ['Una panchina. Ci si siede la gente del quartiere a commentare chi passa.'] });
  addProp(m, 'bench', 38, 23, { act: ['Una panchina di pietra, calda di sole.'] });
  addProp(m, 'lamp', 15, 22, { lamp: true }); addProp(m, 'lamp', 42, 22, { lamp: true }); addProp(m, 'lamp', 15, 28, { lamp: true }); addProp(m, 'lamp', 42, 28, { lamp: true });
  addProp(m, 'lamp', 29, 33, { lamp: true });
  addProp(m, 'cardtable', 35, 26, { fw: 2, fh: 1, act: () => Game.npcTalk('carte') });
  addProp(m, 'mic', 21, 23, { act: ['Un microfono con l\'asta dorata. Sopra c\'è un adesivo: "NAPULE".'] });
  addProp(m, 'speaker', 22, 23, { act: ['Una cassa. Dal volume si capisce che è un neomelodico.'] });
  addProp(m, 'flowerpot', 25, 21); addProp(m, 'flowerpot', 32, 21);
  addProp(m, 'vespa', 11, 30 - 1 - 1, { fw: 2, act: ['Una Vespa azzurra. Sulla sella c\'è scritto: "NON SEDERTI, SI BRUCIA".'] });
  addProp(m, 'mailbox', 21, 38, { act: ['La cassetta della posta di casa. Dentro: bollette e un volantino di Rock and Feller.'] });
  addProp(m, 'crates', 51, 27, { fw: 2, act: ['Cassette di pomodori datterini. Profumano d\'estate.'] });
  addProp(m, 'barrier', 56, 29, { fw: 3, oy: 0 });
  addProp(m, 'cone', 57, 31); addProp(m, 'cone', 58, 31); addProp(m, 'cone', 58, 30);
  addProp(m, 'boat', 48, 41, { fw: 3, solid: true, act: () => Game.projectTalk('enzo', ['Un gozzo di legno, dipinto di bianco e blu.', 'È una delle barche costruite a mano da nonno Enzo.']) });
  addProp(m, 'bush', 34, 21); addProp(m, 'bush', 43, 37 + 2); addProp(m, 'bush', 20, 33 + 0); addProp(m, 'bush', 31, 34);
  // lapidi
  const tombs = [
    ['Qui riposa chi ha scritto "esco perché siete troppi messaggi".', 'Uscito di sua spontanea volontà.'],
    ['Qui riposa chi mandava solo sticker.', 'Rimosso dagli admin. Riposi in pace.'],
    ['Qui riposa chi ha detto "ci sentiamo" ed è sparito.', 'Non ci siamo più sentiti.'],
    ['Lapide senza nome. Si dice che fosse un bot.'],
  ];
  [[16, 43], [17, 43], [19, 43], [20, 43]].forEach(([x, y], i) => addProp(m, 'tomb', x, y, { act: tombs[i] }));

  // cartelli
  addSign(m, 27, 33, ['BENVENUTO A CARDITOPOLI!', 'Dove crescono i carciofi... e le idee.']);
  addSign(m, 27, 12, ['CAMPI DI CARCIOFI', 'Attenzione: CARDIMON selvatici nell\'erba alta!']);
  addSign(m, 32, 22, ['PIAZZA GARIBALDI', 'Il cuore della città: la chiesa di San Biagio, il castello e il municipio.']);
  addSign(m, 43, 21, ['VIA DEI PROGETTI', 'Qui ogni porta è un lavoro di MAURO. Entra e guarda!']);
  addSign(m, 26, 38, ['CASA DI MAURO', 'Graphic designer, content creator, economista della cultura.']);
  addSign(m, 7, 33, () => Game.projectTalk('land', ['L\'ORTO DI LAND', 'Un orto che racconta un paper e un gioco educativo.']));
  addSign(m, 17, 41, () => Game.extraTalk('giuleppe', ['CIMITERO DI GIULEPPE', 'Qui riposano gli ex membri del gruppo WhatsApp "Gli amici di Giuleppe".']));
  addSign(m, 51, 37, () => Game.projectTalk('fritz', ['PALCO DEL FRITZ FESTIVAL', 'Stasera si suona!']));
  addSign(m, 41, 43, ['IL LAGHETTO', 'Vietato pescare i Cardimon.']);

  // NPC
  addNpc(m, 'prof', 'prof', 30, 12, 'down', () => Game.npcTalk('prof'));
  addNpc(m, 'bimbo', 'bimbo', 16, 13, 'left', ['Nell\'erba alta ci sono i CARDIMON!', 'Io ho visto un CARCIOFINO! Era tenerissimo!', 'Dicono che di notte esca un Cardimon che canta...'], { wander: 3 });
  addNpc(m, 'nonno', 'nonno', 17, 26, 'down', ['Lo sai da dove viene il nome Cardito?', 'Dal latino "carduetum": la carciofaia! Qua una volta c\'erano solo campi.', 'Fragole, asparagi, carciofi... e mo\' pure i siti web!']);
  addNpc(m, 'cantante', 'cantante', 20, 24, 'down', () => Game.npcTalk('cantante'));
  addNpc(m, 'carte', 'carte', 37, 26, 'left', () => Game.npcTalk('carte'));
  addNpc(m, 'ragazza', 'ragazza', 30, 27, 'up', ['Hai visto la bottega di MERCOLETERRY? C\'è un barattolo gigante sul tetto!', 'Dicono che la passata la facciano coi datterini campani.'], { wander: 3 });
  addNpc(m, 'ragazzo', 'ragazzo', 12, 27, 'right', ['Ué! Ma tu si\' chillo ca fa \'e siti web?', 'Me ne fai uno pure a me? Te pago in pizze fritte.'], { wander: 2 });
  addNpc(m, 'vigile', 'vigile', 57, 30, 'left', ['Alt! Di qua si va verso NAPOLI.', 'La strada è chiusa per lavori: quella zona arriva PROSSIMAMENTE.', 'Torna più tardi, giovane!']);
  addNpc(m, 'volontaria', 'volontaria', 9, 33, 'down', () => Game.projectTalk('land', ['Ciao! Questo è l\'orto di LAND.', 'MAURO ha studiato con i satelliti come è cambiata l\'agricoltura palestinese lungo il muro in Cisgiordania.', 'Da quel paper è nato LAND: un gioco di sei settimane in cui si coltiva davvero, per capire cosa significa perdere la terra.']));
  addNpc(m, 'contadino', 'contadino', 40, 10, 'down', ['Queste sono fragole di Cardito! Una volta le conoscevano tutti.', 'Non le toccare, che non sono ancora mature.'], { wander: 2 });

  m.zones = [
    [2, 2, 57, 13, 'CAMPI DI CARCIOFI'], [43, 16, 57, 38, 'VIA DEI PROGETTI'], [15, 14, 42, 29, 'PIAZZA GARIBALDI'],
    [2, 16, 14, 31, 'GIARDINI SABAUDI'], [2, 32, 14, 45, 'L\'ORTO DI LAND'], [33, 33, 57, 45, 'IL LAGHETTO'], [15, 30, 29, 45, 'QUARTIERE SUD'],
  ];
  m.encounter = true;
  return m;
}

/* ---------------- INTERNI ---------------- */
function buildRoom(id, name, w, h, floor, wall, back, setup) {
  const m = { id, name, w, h, t: newGrid(w, h, floor), objs: [], npcs: [], warps: {}, outdoor: false, wall, music: 'inside', back };
  for (let x = 0; x < w; x++) { m.t[0][x] = 'W'; m.t[1][x] = 'V'; }
  const mx = w >> 1; m.t[h - 1][mx] = 'M'; m.mat = [mx, h - 1];
  setup(m);
  return m;
}

function buildInteriors(town) {
  const back = (kind) => { const o = town.objs.find(b => b.kind === 'bld' && b.img && b._k === kind); return o; };
  const doorOf = {};
  town.objs.filter(o => o.kind === 'bld').forEach(o => { const w = Object.entries(town.warps).find(([k]) => k === o.door.join(',')); if (w) doorOf[w[1].to] = o.door; });

  const R2 = (id, name, w, h, fl, wall, setup) => { MAPS[id] = buildRoom(id, name, w, h, fl, wall, doorOf[id], setup); };

  R2('casa', 'CASA DI MAURO', 10, 8, 'w', '#E8D8B8', m => {
    addProp(m, 'bed', 1, 2, { fh: 2, act: ['Il letto di MAURO.', 'Si dorme solo dopo aver consegnato.'] });
    addProp(m, 'pc', 7, 1, { fh: 2, act: () => Game.openContacts() });
    addProp(m, 'tv', 4, 1, { fh: 2, act: ['Alla TV danno un documentario sulle barche di legno di Procida.', 'MAURO prende appunti.'] });
    addProp(m, 'rug', 3, 4, { fw: 3, fh: 2, solid: false });
    addProp(m, 'plant', 9, 1, { fh: 2, act: ['Un basilico. Lo annaffia la mamma.'] });
    addProp(m, 'poster', 2, 0, { solid: false, oy: 0, fh: 1, wallItem: true });
    addNpc(m, 'mamma', 'mamma', 6, 5, 'left', () => Game.npcTalk('mamma'));
  });
  R2('comune', 'MUNICIPIO', 11, 9, 'm', '#ECCABC', m => {
    addProp(m, 'counter', 4, 3, { act: () => Game.npcTalk('impiegata') });
    addProp(m, 'shelf', 0, 1, { fh: 2, act: ['Faldoni, faldoni, faldoni... "CURRICULUM — MAURO ESPOSITO".'] });
    addProp(m, 'shelf', 9, 1, { fh: 2, act: ['Registri dell\'anagrafe di Carditopoli. Abitanti: tanti Cardimon e un graphic designer.'] });
    addProp(m, 'plant', 2, 6, { fh: 2 }); addProp(m, 'plant', 8, 6, { fh: 2 });
    addProp(m, 'poster', 3, 0, { solid: false, fh: 1, oy: 0, wallItem: true }); addProp(m, 'poster', 7, 0, { solid: false, fh: 1, oy: 0, wallItem: true });
    addNpc(m, 'impiegata', 'impiegata', 5, 2, 'down', () => Game.npcTalk('impiegata'), { counter: true });
  });
  R2('chiesa', 'CHIESA DI SAN BIAGIO', 11, 12, 'm', '#F4E6C4', m => {
    for (let y = 2; y < 11; y++) m.t[y][5] = 'R';
    addProp(m, 'altar', 4, 2, { fh: 2, act: ['L\'altare è pieno di fiori. Il 3 febbraio è la festa di San Biagio.'] });
    [6, 8].forEach(y => { addProp(m, 'pew', 1, y, { act: ['Una panca di legno lucido.'] }); addProp(m, 'pew', 7, y, { act: ['Una panca di legno lucido.'] }); });
    addProp(m, 'plant', 1, 2, { fh: 2 }); addProp(m, 'plant', 9, 2, { fh: 2 });
    addNpc(m, 'prete', 'prete', 5, 4, 'down', ['Benvenuto nella chiesa di San Biagio, patrono di Cardito.', 'Il 3 febbraio benediciamo la gola di tutti: protegge dal mal di gola!', 'Per un cantante neomelodico è un santo fondamentale, figlio mio.']);
  });
  R2('castello', 'CASTELLO', 12, 10, 'w', '#CDB894', m => {
    for (let y = 2; y < 9; y++) m.t[y][6] = 'R';
    addProp(m, 'easel', 1, 2, { fh: 1, act: ['Un quadro in pixel art: la piazza di Carditopoli al tramonto.'] });
    addProp(m, 'shelf', 9, 1, { fh: 2, act: ['Libri di economia della cultura, manuali di Photoshop e un dizionario napoletano.'] });
    addProp(m, 'case', 3, 1, { fh: 2, act: () => Game.openTrainer() });
    addProp(m, 'pc', 8, 6 - 1, { fh: 2, act: () => Game.openDex() });
    addProp(m, 'plant', 1, 6, { fh: 2 }); addProp(m, 'plant', 10, 6, { fh: 2 });
    addNpc(m, 'guida_c', 'guida', 6, 3, 'down', () => Game.npcTalk('castello'));
  });
  R2('kebab', 'ROCK AND FELLER', 10, 8, 'k', '#F2EEE4', m => {
    addProp(m, 'counter', 1, 3, { act: () => Game.npcTalk('cuoco') });
    addProp(m, 'spit', 5, 1, { fh: 2, act: ['Il girarrosto gira, gira, gira... Profumo di doner.'] });
    addProp(m, 'table', 6, 5, { fh: 1, act: ['Un tavolino. C\'è un QR code: "Scansiona per il panino del mese".'] });
    addProp(m, 'poster', 8, 0, { solid: false, fh: 1, oy: 0, wallItem: true });
    addProp(m, 'plant', 9, 1, { fh: 2 });
    addNpc(m, 'cuoco', 'cuoco', 2, 2, 'down', () => Game.npcTalk('cuoco'), { counter: true });
  });
  R2('mercoleterry', 'MERCOLETERRY', 10, 8, 'w', '#FBF4E8', m => {
    addProp(m, 'shelf', 0, 1, { fh: 2, act: ['Scaffali pieni di barattoli di passata, tutti con l\'etichetta verde.'] });
    addProp(m, 'jar', 3, 1, { fh: 1, act: () => Game.projectTalk('mercoleterry', ['Un barattolo di MERCOLETERRY.', 'Etichetta, logo e nome: tutto disegnato da MAURO.']) });
    addProp(m, 'jar', 4, 1, { fh: 1, act: () => Game.projectTalk('mercoleterry', ['Un barattolo di MERCOLETERRY.']) });
    addProp(m, 'crates', 6, 5, { fh: 1, act: ['Bucce di pomodoro messe a essiccare. Diventeranno crackers!'] });
    addProp(m, 'counter', 3, 4, { act: () => Game.npcTalk('mercoleterry') });
    addProp(m, 'plant', 9, 1, { fh: 2 });
    addNpc(m, 'contadina', 'ragazza', 4, 3, 'down', () => Game.npcTalk('mercoleterry'), { counter: true });
  });
  R2('pullmeup', 'PULLME UP', 10, 8, 'm', '#3A4452', m => {
    addProp(m, 'desk', 1, 2, { act: ['Due monitor: su uno un calendario editoriale, sull\'altro una campagna Meta.'] });
    addProp(m, 'desk', 6, 2, { act: ['Un report: "+1.200 follower al mese". Qualcuno ha disegnato un cuore accanto.'] });
    addProp(m, 'sofa', 1, 5, { act: ['Il divano dei brainstorming. Qui sono nate idee brillanti e pisolini colossali.'] });
    addProp(m, 'plant', 9, 5, { fh: 2 });
    addProp(m, 'poster', 4, 0, { solid: false, fh: 1, oy: 0, wallItem: true });
    addNpc(m, 'socio', 'socio', 5, 4, 'down', () => Game.npcTalk('pullmeup'));
  });
  R2('sabaude', 'RESIDENZE SABAUDE', 12, 9, 'm', '#F0D890', m => {
    for (let x = 1; x < 11; x++) m.t[5][x] = 'R';
    addProp(m, 'passport', 5, 1, { fh: 2, act: () => Game.projectTalk('sabaudo', ['In vetrina c\'è un passaporto blu con lo stemma dorato.', 'Ogni pagina è una residenza reale da visitare.']) });
    addProp(m, 'shelf', 0, 1, { fh: 2, act: ['Guide turistiche di Torino, Venaria, Stupinigi, Racconigi...'] });
    addProp(m, 'shelf', 10, 1, { fh: 2, act: ['Mappe antiche dei Savoia. Molto, molto dettagliate.'] });
    addProp(m, 'plant', 1, 6, { fh: 2 }); addProp(m, 'plant', 10, 6, { fh: 2 });
    addNpc(m, 'guida_s', 'guida', 7, 4, 'down', () => Game.npcTalk('sabaude'));
  });
  R2('archivio', 'ARCHIVIO ENZO', 10, 8, 'w', '#B8885A', m => {
    addProp(m, 'boatmodel', 1, 1, { fh: 2, act: () => Game.projectTalk('enzo', ['Il modellino di un gozzo. Sotto c\'è scritto "BARCA 1".']) });
    addProp(m, 'boatmodel', 4, 1, { fh: 2, act: () => Game.projectTalk('enzo', ['"BARCA 2". Ricostruita in 3D partendo da vecchie foto.']) });
    addProp(m, 'boatmodel', 7, 1, { fh: 2, act: () => Game.projectTalk('enzo', ['"BARCA 3". Il legno sembra vero.']) });
    addProp(m, 'table', 1, 5, { fh: 1, act: ['Album di foto in bianco e nero: barche, cantieri, mare di Procida.'] });
    addNpc(m, 'custode', 'custode', 6, 5, 'left', () => Game.npcTalk('archivio'));
  });
}

function buildWorld() {
  TREE_IMGS = { oak: makeTree('oak'), pine: makeTree('pine'), olive: makeTree('olive') };
  const town = buildTown();
  MAPS.town = town;
  buildInteriors(town);
  // collega gli interni alla porta corretta
  Object.entries(town.warps).forEach(([k, w]) => { const [x, y] = k.split(',').map(Number); if (MAPS[w.to]) MAPS[w.to].back = [x, y]; });
}
