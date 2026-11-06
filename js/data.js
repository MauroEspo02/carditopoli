/* =========================================================
   CARDITOPOLI — data.js
   >>> QUESTO È IL FILE DA MODIFICARE PER AGGIORNARE I CONTENUTI <<<
   Testi, progetti, link, Cardimon, dialoghi dei personaggi.
   ========================================================= */
'use strict';

const PROFILE = {
  name: 'MAURO',
  fullName: 'Mauro Esposito',
  role: 'Graphic designer · Content creator · Economista della cultura',
  city: 'Milano ⇄ Napoli',
  since: 'Freelance dal 2018',
  studies: [
    ['Magistrale EACT', 'Economia dell\'Ambiente, della Cultura e del Territorio — UniTo / PoliTo (2024–2026)'],
    ['Triennale Green Economy', 'Università Suor Orsola Benincasa, Napoli'],
    ['International Business & Marketing', 'HELMo, Liegi (Belgio)'],
    ['Grafica pubblicitaria', 'Accademia di Belle Arti, Napoli'],
  ],
  jobs: [
    ['Graphic designer & content creator', 'Freelance, dal 2018'],
    ['Social media manager', 'Ristoranti indipendenti'],
    ['Co-fondatore PULLME UP', 'Social, Meta, SEO, siti e contenuti'],
    ['Rappresentante degli studenti', 'Magistrale EACT'],
  ],
  languages: [['Italiano', 'madrelingua'], ['Inglese', 'professionale (IELTS 7)'], ['Francese', 'base']],
  // TODO Mauro: inserisci i tuoi contatti reali qui
  contacts: [
    ['Sito', 'mauroesposito19.com', 'https://mauroesposito19.com'],
    ['LinkedIn', 'il tuo profilo', 'https://www.linkedin.com/'],
    ['Instagram', '@iltuoprofilo', 'https://www.instagram.com/'],
    ['Email', 'scrivimi', 'mailto:ciao@mauroesposito19.com'],
  ],
};

/* Ogni progetto = un luogo della città e una MEDAGLIA */
const PROJECTS = [
  {
    id: 'rockandfeller', name: 'Rock and Feller', icon: 'kebab', badge: 'Medaglia Doner',
    place: 'Kebabberia in Via dei Progetti', url: 'https://rockandfeller.com',
    tags: ['Sito web', 'Brand', 'QR dinamici', 'Pannello admin'],
    desc: 'Il sito della kebabberia Rock and Feller (Caserta Doner Kebab): menù gestibile, link tree al posto del vecchio Linktree, QR code dinamici per il panino del mese e un pannello admin per gestire tutto. PULLME UP ha anche ridisegnato il logo e le grafiche del locale.',
  },
  {
    id: 'mercoleterry', name: 'Mercoleterry', icon: 'jar', badge: 'Medaglia Pomodoro',
    place: 'Bottega col barattolone', url: 'https://passatadipomodoro.mauroesposito19.com/',
    tags: ['Brand', 'Packaging', 'Video', '3D', 'Landing page'],
    desc: 'Una passata di pomodoro nata da zero: nome, etichetta, logo, video e una landing page con intro cinematica e barattoli 3D. Pomodori datterini campani e ciliegini della Terra dei Fuochi, e i crackers fatti con le bucce.',
  },
  {
    id: 'fritz', name: 'FRITZ Festival', icon: 'stage', badge: 'Medaglia Palco',
    place: 'Palco in piazza', url: 'https://fritz.mauroesposito19.com/',
    tags: ['Evento', 'Identità visiva', 'Sito web'],
    desc: 'Il progetto dedicato al festival FRITZ: identità del festival e sito di presentazione, con il palco come simbolo.',
  },
  {
    id: 'sabaudo', name: 'Passaporto Sabaudo', icon: 'passport', badge: 'Medaglia Sabauda',
    place: 'Palazzo delle Residenze', url: 'https://passaportosabaudo.mauroesposito19.com/',
    tags: ['Patrimonio culturale', 'Turismo', 'Sito web'],
    desc: 'Un passaporto per visitare le Residenze Reali Sabaude: un progetto di valorizzazione del patrimonio che trasforma il circuito delle residenze in un viaggio a tappe.',
  },
  {
    id: 'land', name: 'LAND', icon: 'land', badge: 'Medaglia Ulivo',
    place: 'L\'orto a ovest', url: 'https://land.mauroesposito19.com/',
    tags: ['Paper', 'Google Earth Engine', 'NDVI', 'Serious game'],
    desc: 'Un paper sul declino dell\'agricoltura palestinese in Cisgiordania, con un\'analisi satellitare NDVI (Landsat) lungo il muro a Qalqilya e Tulkarm. Accanto, LAND: un gioco/kit educativo di sei settimane di coltivazione per sensibilizzare sui temi del paper.',
  },
  {
    id: 'enzo', name: 'Archivio Enzo', icon: 'boat', badge: 'Medaglia Timone',
    place: 'Rimessa sul laghetto', url: '',
    tags: ['Museo digitale', 'Modelli 3D', 'Memoria', 'Procida'],
    desc: 'Un museo digitale delle barche in legno costruite a mano da nonno Enzo, con Procida come riferimento. Foto originali digitalizzate e modelli 3D ricostruiti e rifiniti in Blender. Lavori in corso!',
  },
  {
    id: 'pullmeup', name: 'PULLME UP', icon: 'mega', badge: 'Medaglia Megafono',
    place: 'Ufficio in Via dei Progetti', url: 'https://pullmeup.org',
    tags: ['Social media', 'Meta Ads', 'SEO', 'Siti web', 'Contenuti'],
    desc: 'La società che Mauro porta avanti da sei anni con il suo socio: gestione social, Meta, SEO, siti e contenuti. Tra i lavori: Rock and Feller e la cura dei social di Benvenuti a Bordo (+1.200 follower al mese).',
  },
  {
    id: 'tesi', name: 'Tesi neomelodica', icon: 'note', badge: 'Medaglia Melodia',
    place: 'Il cantante in piazza', url: '',
    tags: ['Economia della cultura', 'Spazio urbano', 'Archivio di canzoni'],
    desc: 'Tesi magistrale sulla rappresentazione dello spazio urbano napoletano nella musica neomelodica, con la costruzione di un archivio di oltre mille canzoni trascritte e analizzate.',
  },
];
const EXTRAS = [
  { id: 'giuleppe', name: 'Cimitero di Giuleppe', icon: 'tomb', url: 'https://gliamicidigiuleppe.pages.dev/', desc: 'Un sito-scherzo per il gruppo WhatsApp "Gli amici di Giuleppe": una lapide in pixel art per ogni membro che esce o viene rimosso dal gruppo.', tags: ['Pixel art', 'Sito web', 'Pannello admin'] },
  { id: 'primaodopo', name: 'Prima o dopo?', icon: 'cards', url: '', desc: '"PRIMA O DOPO? — La Timeline Impossibile": un gioco di carte stampabile con 150 eventi storici. Qui in piazza puoi giocarne una versione rapida!', tags: ['Game design', 'Gioco di carte', 'Stampa'] },
  { id: 'portfolio', name: 'Portfolio', icon: 'globe', url: 'https://mauroesposito19.com', desc: 'Il portfolio completo, bilingue IT/EN, con tutti i lavori.', tags: ['Portfolio'] },
];

/* ---------- CARDIMON: ogni creatura è una competenza ---------- */
const TYPES = {
  GRAFICA: '#E05890', SOCIAL: '#F0A030', DIGITALE: '#4890E0', TERRITORIO: '#48A860',
  SAPERE: '#9060C8', LINGUE: '#40B8C0', NATURA: '#78A050',
};
const CREATURES = [
  { id: 1, name: 'CARCIOFINO', type: 'NATURA', skill: 'Lo spirito di Cardito', color: '#7EA070', leaves: '#6E9C6A', scales: '#9A6AA8', shape: 'round', rate: 26, desc: 'Cardito viene da "carduetum", la carciofaia. Questo Cardimon è il simbolo della città: dove cresce lui, crescono le idee.' },
  { id: 2, name: 'PIXELLUZZO', type: 'GRAFICA', skill: 'Pixel art', color: '#F07898', shape: 'round', ears: true, acc: 'brush', brushColor: '#40C080', rate: 12, desc: 'Disegna un quadratino alla volta. È lui che ha disegnato tutta Carditopoli.' },
  { id: 3, name: 'FOTOSCIOPPO', type: 'GRAFICA', skill: 'Photoshop · Adobe', color: '#4878C8', shape: 'tall', glasses: true, acc: 'mag', rate: 10, desc: 'Ritocca tutto quello che vede. Una volta ha tolto le occhiaie a un gufo.' },
  { id: 4, name: 'VETTORINO', type: 'GRAFICA', skill: 'Illustrator · Loghi', color: '#F0A040', shape: 'round', acc: 'pencil', rate: 10, desc: 'Pensa per curve di Bézier. Ha ridisegnato il logo di Rock and Feller in una notte.' },
  { id: 5, name: 'REELLINO', type: 'SOCIAL', skill: 'Video · Reel · Montaggio', color: '#E85848', shape: 'wide', acc: 'camera', rate: 9, desc: 'Gira, monta e pubblica in quindici secondi. I suoi reel fanno girare la testa.' },
  { id: 6, name: 'SOCIALOTTO', type: 'SOCIAL', skill: 'Social media management', color: '#F0C040', shape: 'round', acc: 'wifi', wifi: '#FFFFFF', antenna: '#E85848', rate: 9, desc: 'Sa sempre a che ora pubblicare. Gestisce i social dei ristoranti indipendenti.' },
  { id: 7, name: 'SEOMBRA', type: 'DIGITALE', skill: 'SEO · Meta Ads', color: '#6058A8', shape: 'drop', eyes: 'sleepy', acc: 'coin', rate: 7, desc: 'Si muove nell\'ombra dei motori di ricerca e ti porta in prima pagina.' },
  { id: 8, name: 'CODICILLO', type: 'DIGITALE', skill: 'Siti web · HTML · JS', color: '#50B8E8', shape: 'wide', antenna: '#40C080', acc: 'cube', rate: 7, desc: 'Parla in tag e parentesi graffe. Ha costruito questo gioco senza una sola immagine.' },
  { id: 9, name: 'QGISAURO', type: 'TERRITORIO', skill: 'QGIS · Cartografia', color: '#58B070', shape: 'tall', tail: true, acc: 'pin', rate: 7, desc: 'Non si perde mai: ogni cosa che vede la mette su una mappa a livelli.' },
  { id: 10, name: 'SATELLINO', type: 'TERRITORIO', skill: 'Earth Engine · NDVI', color: '#C0C8D8', shape: 'round', acc: 'satellite', rate: 5, desc: 'Guarda il mondo da 700 km di quota e misura quanto è verde la terra.' },
  { id: 11, name: 'MESHINO', type: 'DIGITALE', skill: 'Modelli 3D · Blender', color: '#A078E0', shape: 'round', ears: true, acc: 'cube', rate: 6, desc: 'Ricostruisce barche e barattoli in tre dimensioni. Odia i modelli da 3 milioni di triangoli.' },
  { id: 12, name: 'ECONOMINO', type: 'SAPERE', skill: 'Economia della cultura', color: '#D8B060', shape: 'tall', glasses: true, acc: 'book', rate: 6, desc: 'Studia come cultura, ambiente e territorio creano valore. Si laurea a marzo.' },
  { id: 13, name: 'GREENUCCIO', type: 'SAPERE', skill: 'Green economy', color: '#60C080', shape: 'round', acc: 'leaf', rate: 6, desc: 'Ricicla tutto, perfino le bucce dei pomodori (chiedi a Mercoleterry).' },
  { id: 14, name: 'INGLESAURO', type: 'LINGUE', skill: 'Inglese · IELTS 7', color: '#E06060', shape: 'tall', tail: true, acc: 'flag', rate: 6, desc: 'Ha vissuto a Liegi e parla inglese da professionista. Il francese... ci sta lavorando.' },
  { id: 15, name: 'NEOMELODINO', type: 'SAPERE', skill: 'Musica neomelodica', color: '#3A3A58', shape: 'round', acc: 'note', ears: true, earIn: '#F07898', rate: 0, night: true, desc: 'Esce solo di notte, sotto i balconi. Canta lo spazio urbano di Napoli. Raro!' },
];

/* Mosse di Mauro in lotta */
const MOVES = [
  { name: 'BRIEF CREATIVO', pow: 30, txt: 'Le idee sono chiarissime!' },
  { name: 'REEL VIRALE', pow: 40, txt: 'Un milione di visualizzazioni!' },
  { name: 'DEADLINE', pow: 50, txt: 'Consegnato alle 23:59!' },
  { name: 'CAFFÈ SOSPESO', pow: 0, txt: 'MAURO si ricarica. Il prossimo lancio sarà più preciso!' },
];
const WILD_MOVES = ['FA I CAPRICCI', 'CHIEDE UNA REVISIONE', 'VUOLE IL LOGO PIÙ GRANDE', 'MANDA UN VOCALE DI 4 MINUTI', 'PAGA A 90 GIORNI', 'CAMBIA IDEA'];

/* Mini-gioco PRIMA O DOPO? — anni verificati */
const EVENTS = [
  ['Eruzione del Vesuvio che seppellì Pompei', 79],
  ['Bibbia di Gutenberg stampata', 1455],
  ['Colombo arriva in America', 1492],
  ['Presa della Bastiglia', 1789],
  ['Nasce il Regno delle Due Sicilie', 1816],
  ['Unità d\'Italia', 1861],
  ['"Funiculì funiculà" viene composta', 1880],
  ['Prima Coppa del Mondo vinta dall\'Italia', 1934],
  ['Fine della Seconda guerra mondiale', 1945],
  ['Primo uomo sulla Luna', 1969],
  ['Maradona arriva al Napoli', 1984],
  ['Primo scudetto del Napoli', 1987],
  ['Caduta del Muro di Berlino', 1989],
  ['Nasce il World Wide Web', 1991],
  ['Esce il primo iPhone', 2007],
];

/* Aspetto dei personaggi */
const LOOKS = {
  mauro: { style: 'caschetto', hair: '#E8C058', shirt: '#2E7A4A', pants: '#2C3448', skin: '#F8C898' },
  prof: { style: 'bald', hair: '#B0B0B0', shirt: '#E8E8F0', coat: '#F8F8F8', pants: '#5A4A3A', mustache: '#B0B0B0', glasses: true },
  mamma: { style: 'curly', hair: '#4A2A1A', shirt: '#C85878', pants: '#5A3A4A', skirt: '#5A3A4A', blush: true },
  nonno: { style: 'bald', hair: '#D8D8D8', shirt: '#8A7A5A', pants: '#4A4A4A', mustache: '#D8D8D8' },
  ragazzo: { style: 'cap', cap: '#3050A0', hair: '#2A1A10', shirt: '#E85848', pants: '#3A4A6A' },
  ragazza: { style: 'long', hair: '#7A3A20', shirt: '#F0C040', pants: '#3A4A6A', skirt: '#3A70B0', blush: true },
  prete: { style: 'short', hair: '#3A3A3A', shirt: '#202028', pants: '#202028', collar: '#F8F8F8' },
  cuoco: { style: 'short', hair: '#2A1A10', shirt: '#F0F0F0', pants: '#303038', apron: '#1E7A44', beard: '#2A1A10' },
  contadino: { style: 'cap', cap: '#C8A050', hair: '#5A3A20', shirt: '#4A8A3A', pants: '#4A3A2A', mustache: '#5A3A20' },
  impiegata: { style: 'bun', hair: '#5A3A20', shirt: '#4A6AA0', pants: '#303848', skirt: '#303848', glasses: true },
  socio: { style: 'short', hair: '#1A1A1A', shirt: '#F8D030', pants: '#2C3440', beard: '#1A1A1A' },
  guida: { style: 'short', hair: '#8A5A30', shirt: '#3A3A80', pants: '#2A2A40', collar: '#E0B040' },
  cantante: { style: 'caschetto', hair: '#1A1A1A', shirt: '#F8F8F8', pants: '#1A1A1A', collar: '#E0B040' },
  carte: { style: 'bald', hair: '#9A9A9A', shirt: '#6A3A2A', pants: '#3A3A3A', mustache: '#9A9A9A' },
  vigile: { style: 'cap', cap: '#F8F8F8', hair: '#3A2A1A', shirt: '#2A3A5A', pants: '#2A3A5A' },
  custode: { style: 'cap', cap: '#3A78C0', hair: '#C0C0C0', shirt: '#F0E8D8', pants: '#3A4A5A', beard: '#C0C0C0' },
  bimbo: { style: 'short', hair: '#C08040', shirt: '#60C0E0', pants: '#E8A040' },
  maurobimbo: { style: 'caschetto', hair: '#F4D878', shirt: '#4AA8F0', pants: '#F8F8F8', shoes: '#F8F8F8', blush: true },
  fonico: { style: 'cap', cap: '#202028', hair: '#3A2A1A', shirt: '#303040', pants: '#202028', beard: '#3A2A1A' },
  ceramista: { style: 'bun', hair: '#8A5A30', shirt: '#D8C8B0', pants: '#5A4A3A', apron: '#6A8AB0' },
  commessa: { style: 'long', hair: '#1A1A1A', shirt: '#E85848', pants: '#303038', skirt: '#303038' },
  cartografo: { style: 'short', hair: '#A0A0A0', shirt: '#5A6A4A', pants: '#4A3A2A', glasses: true, beard: '#A0A0A0' },
  volontaria: { style: 'long', hair: '#2A1A10', shirt: '#6A8A5A', pants: '#4A3A2A', skirt: '#4A3A2A' },
};

/* =========================================================
   VIA DELLE PASSIONI
   Per aggiungere le foto: metti i file nella cartella indicata
   (es. img/ceramica/) e aggiungi una riga in "items", tipo:
   { img: 'img/ceramica/vaso-blu.jpg', title: 'Vaso blu', desc: 'Fatto al tornio, 2025' },
   ========================================================= */
const PASSIONS = {
  ceramica: {
    title: 'BOTTEGA DELLA CERAMICA', folder: 'img/ceramica/',
    intro: 'Tutti i pezzi di ceramica fatti da MAURO.',
    items: [
      // { img: 'img/ceramica/01.jpg', title: 'Titolo del pezzo', desc: 'Tecnica, anno...' },
    ],
  },
  tshirt: {
    title: 'T-SHIRT GRAFICHE', folder: 'img/tshirt/',
    intro: 'Le magliette disegnate da MAURO.',
    items: [
      // { img: 'img/tshirt/01.jpg', title: 'Nome della grafica', desc: '' },
    ],
  },
  calcio: {
    title: 'ALBUM DEL CALCIO', folder: 'img/calcio/',
    intro: 'MAURO da piccolo, con il pallone sempre tra i piedi.',
    items: [
      // { img: 'img/calcio/01.jpg', title: 'Prima partita', desc: '19..' },
    ],
  },
  mappe: {
    title: 'STUDIO DELLE MAPPE', folder: 'img/mappe/',
    intro: 'Mappe e cartografie realizzate da MAURO (QGIS, Earth Engine, a mano).',
    items: [
      // { img: 'img/mappe/01.jpg', title: 'NDVI lungo il muro, Qalqilya', desc: 'Landsat · Google Earth Engine' },
    ],
  },
};

/* Gli artisti preferiti di MAURO (Casa della Musica → jukebox).
   Aggiungi righe tipo: { name: 'Nome artista', genre: 'Genere', note: 'Perché mi piace', url: 'https://open.spotify.com/...' }, */
const ARTISTS = [
];
