# Dammi 70 euro — React

Home moderna in React con stile **industrial**, stesso sfondo e tutti gli strumenti legacy invariati.

## Avvio

```bash
cd dammi70-te
npm install
npm run dev
```

Apri l’URL indicato da Vite (di solito `http://localhost:5173`).

## Build

```bash
npm run build
npm run preview
```

## Struttura

- `src/` — home React (player, ricerca canzoni, categorie, embed)
- `public/legacy/` — copia degli strumenti HTML/JS originali (offitron, cacciatron, synt, ecc.)
- `public/dammi70euro.png` — immagine di sfondo originale

## Funzionalità home

- Ricerca canzoni in tempo reale sul catalogo Google Drive
- Player audio con condivisione (`?play=id`) e tasto Spazio
- Tab Gaming / Tools / Instruments / Casse
- Toggle **Modalità embed** (iframe o navigazione diretta)
- Design industrial: pannelli tagliati, griglia, amber/cyan, font tecnici

Gli strumenti restano quelli originali; la home li apre da `/legacy/...`.
