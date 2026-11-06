# CARDITOPOLI — Versione Carciofo

Il portfolio giocabile di **Mauro Esposito**: un piccolo RPG 2D in stile Game Boy Advance,
ambientato in una città immaginaria ispirata a **Cardito (NA)**.

Esplori la città, entri negli edifici (ogni edificio è un progetto), parli con i personaggi,
catturi i **CARDIMON** nell'erba alta (ogni creatura è una competenza) e raccogli le **8 medaglie**.

## Come si avvia
Nessuna installazione, nessuna build: basta aprire `index.html` nel browser (doppio clic).
Funziona anche offline. Per pubblicarlo basta caricare la cartella così com'è
(Cloudflare Pages, GitHub Pages, un sottodominio di mauroesposito19.com...).

Su Cloudflare Pages: *Create project → collega il repo `carditopoli` → Framework: None →
Build command vuoto → Output directory `/`*.

## Comandi
| Azione | Tastiera | Telefono |
|---|---|---|
| Muoversi | Frecce / WASD | Croce |
| Parlare / confermare | Z, Spazio | A |
| Correre / indietro | X (tenuto premuto), Esc | B |
| Menu | Invio | START |
| Musica on/off | M | menu → Opzioni |

Funziona anche con un gamepad. Parametri utili nell'URL: `?skip` salta l'intro,
`?ora=notte` / `?ora=giorno` / `?ora=tramonto` forza l'orario (normalmente segue l'ora reale).

## Struttura
```
index.html      pagina e controlli touch
style.css       interfaccia (dialoghi, menu, schede)
js/data.js      ← TESTI, PROGETTI, LINK, CARDIMON: è il file da modificare
js/maps.js      la mappa della città e gli interni degli edifici
js/gfx.js       tutta la pixel art, disegnata in codice
js/audio.js     sintetizzatore chiptune e musiche
js/game.js      motore: movimento, dialoghi, menu, lotta, salvataggi
```

### Aggiornare i contenuti
- **Contatti**: `PROFILE.contacts` in `js/data.js` (ci sono dei segnaposto da sostituire).
- **Progetti**: array `PROJECTS` (nome, descrizione, tag, link). Ogni progetto è collegato
  a un luogo della mappa in `js/maps.js`.
- **Nuove creature**: aggiungi un oggetto a `CREATURES` (colore, forma, accessorio).

## Originalità
Tutta la grafica è generata in codice e tutte le musiche sono composizioni originali.
Non usa sprite, tileset, musiche, nomi o loghi di giochi esistenti: è un omaggio di stile
all'epoca GBA, non una copia. Font: Pixelify Sans (Google Fonts, licenza OFL).

© 2026 Mauro Esposito
