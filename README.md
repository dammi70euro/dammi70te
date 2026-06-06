# Dammi 70 te!

Hub musicale, gaming e strumenti con home React in stile **industrial** e strumenti legacy HTML/JS.

**Live:** [https://dammi70euro.github.io/dammi70te/](https://dammi70euro.github.io/dammi70te/)

## Sviluppo locale

```bash
npm install
npm run dev
```

Apri l’URL indicato da Vite (di solito `http://localhost:5173`).

Opzionale: copia `.env.example` in `.env` per override delle variabili Google Drive.

## Build

```bash
npm run build
npm run preview
```

In produzione il sito è servito sotto `/dammi70te/` (GitHub Pages).

## Pubblicazione su GitHub Pages

Il deploy è automatico tramite GitHub Actions (`.github/workflows/deploy.yml`) ad ogni push su `main`.

### Primo setup (una tantum)

1. Crea il repository [dammi70euro/dammi70te](https://github.com/dammi70euro/dammi70te) su GitHub (se non esiste già).
2. Push del branch `main`:
   ```bash
   git push -u origin main
   ```
3. Su GitHub: **Settings → Pages → Build and deployment**
   - Source: **GitHub Actions**
4. (Opzionale) **Settings → Secrets and variables → Actions** — aggiungi `VITE_DRIVE_API_KEY` e `VITE_DRIVE_FOLDER_ID` se vuoi override rispetto ai default nel codice.

Dopo il primo workflow completato, il sito sarà online all’URL indicato sopra.

## Struttura

- `src/` — home React (player, ricerca canzoni, categorie, embed)
- `public/legacy/` — strumenti HTML/JS originali (offitron, cacciatron, synt, ecc.)
- `public/dammi70euro.png` — immagine di sfondo originale
- `.github/workflows/` — CI e deploy GitHub Pages

## Funzionalità home

- Ricerca canzoni in tempo reale sul catalogo Google Drive
- Player audio con condivisione (`?play=id`) e tasto Spazio
- Tab Gaming / Tools / Instruments / Casse
- Toggle **Modalità embed** (iframe o navigazione diretta)
- Design industrial: pannelli tagliati, griglia, amber/cyan, font tecnici

Gli strumenti restano quelli originali; la home li apre da `{base}/legacy/...`.

## Licenza

MIT — vedi [LICENSE](LICENSE).
