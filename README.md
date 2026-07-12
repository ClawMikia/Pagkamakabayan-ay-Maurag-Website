# Pagkamakabayan ay Maurag

A dark-mode **historic-comic microsite** and playable tribute to **Game of the Generals** — the iconic Filipino board game invented by **Sofronio H. Pasola Jr. in 1970**. The site frames the game as a midnight operations dossier: panel borders, dramatic lighting, manifest-driven visual assets, and a fully playable tactical board with a CPU opponent.

> Part war-room simulation, part memory duel, part national myth-making.

---

## Overview

Game of the Generals is a hidden-information strategy game. Each player commands a 21-piece army of concealed ranks; pieces reveal and resolve only when they clash. The strongest player is usually the one who reads patterns, preserves uncertainty, and times reveals — not the one who attacks hardest.

This project is a **static, serverless site** (vanilla HTML/CSS/JS, no build step) that dramatizes that tension with a comic-book art direction and a fully customizable visual armory.

---

## Pages

| File | Name | Purpose |
| --- | --- | --- |
| `index.html` | **Command Deck** | Atmospheric landing page: hero, stat grid, feature overview, and the CPU difficulty ladder. |
| `setup.html` | **Setup Console** | Pre-battle briefing. Pick faction, CPU temper, and per-rank art/flag/board via animated carousels; generate a briefing or scatter pieces randomly. |
| `customization.html` | **Asset Customization** | Browseable "visual armory" — every flag, piece design, rank variant, and board skin loaded from the manifest, shown in nested accordions. |
| `deploy.html` | **Deploy Board** | Manual staging screen. Drag a piece from the tray onto your home zone (bottom three rows); enforce strict placement rules before launching into battle. |
| `battle.html` | **Battle UI** | Playable tactical board: turn status, ranked unit cards, battlefield feed, side modals, animated combat, and win/lose resolution. |
| `rules-lore.html` | **Rules & Lore** | Concise rules dossier and thematic framing connecting deduction gameplay with national memory and oral tradition. |

All pages share a persistent left **sidebar** (brand block, nav, CPU difficulties, asset pipeline notes) that collapses to a hamburger menu on small screens.

---

## Features & Functionality

### Gameplay engine (`assets/js/battle-engine.js`)
- **9×9 board**, 21 pieces per side, played against a CPU opponent.
- **Full rank ladder** with hidden identities: 5★, 4★, 3★, 2★, 1★ Generals, Colonel, Lt. Colonel, Major, Captain, 1st/2nd Lieutenant, Sergeant, Private (×6), Spy (×2), and Flag (×1).
- **Combat resolution** implementing Game of the Generals rules, including the Spy's special counters (a Spy defeats the highest general but loses to anyone else, and loses to the Private).
- **Win conditions**: capture the enemy Flag, march your own Flag to the enemy baseline, force a stalemate, or accept a resignation.
- **Animated piece movement** (slide + capture fade) and on-board legal-move highlighting (`cell--move`, `cell--capture`, `cell--selected`).
- **Hover tooltips** revealing a player piece's rank, combat strength, rank code, faction, and reveal status.
- **Side modals**: Field Status & Rank Ladder, Encounter Log (live battle feed + action log), and Elimination Log (separate "Your Losses" / "Enemy Losses" galleries with rank art and turn stamps).
- **Result modal** with win/loss theming, reason text, and per-game stats (faction, CPU temper, turn count).

### CPU difficulty (`app.js` + `battle-engine.js`)
Four distinct opponent profiles, selectable on Setup and the Battle toolbar:

1. **Anak** — Child / Easy. Low pressure, high randomness, no foresight. A patient tutorial cadence.
2. **Mabalos / Salamat** — Gratitude / Medium. Measured pressure, polite but alert, defends weak lanes.
3. **Maurag po Ako** — "I'm strong" / Challenging. Assertive, bluffs often, uses foresight.
4. **Mahal ko ang Bayan** — Love of country / Hard. Elite pressure, zero randomness, relentless calculation and long-term deception.

The CPU scores every legal move (captures, advancement, flag defense) and applies each profile's `aggression`, `randomness`, `foresight`, and `defends` weights to choose among them.

### Setup & loadout (`assets/js/app.js`)
- **Animated visual carousels** for every selectable rank, the flag, piece design, and board skin — with prev/next buttons, slide transitions, and clickable dot navigation.
- **Piece color picker**: choose a folder tint from `piece-colors` swatches **or** any custom hex color via a native color input.
- **Live briefing summary** that reflects every selection (faction doctrine, difficulty, board, flag, each rank art, design, and color).
- **Persistence**: the selection is saved to `localStorage` (`pagkamakabayanSetup`) and carried into Deploy and Battle.
- **Two launch paths**: *Generate briefing* → `deploy.html` (manual staging); *Scatter pieces randomly* → `battle.html` (auto-deployed).

### Deployment (`assets/js/deploy.js`)
- Tap a piece in the tray, then tap a glowing home-zone tile to place it; tap a placed piece to lift it back.
- **Strict placement rules enforced**: Flag must sit on the back row, both Spies on the front row, and no rank can exceed its Game of the Generals count (counts are derived live from the board).
- **Auto-fill remaining**, **reset board**, live placed/total counter, and readiness gating on *Start battle*.
- Manual placement is serialized to `localStorage` (`pagkamakabayanPlayerPlacement`) and consumed by the battle engine.

### Battle stopwatch
- MM:SS stopwatch with Start / Pause / Reset, persisted across reloads (`pagkamakabayanStopwatch`).
- The board is **locked** ("Start the stopwatch to begin battle") until the timer is running.

### Asset pipeline (manifest-driven)
- The site reads `./assets/data/assets-manifest.json` (and the parallel `assets-manifest.js` global) to know which images exist.
- After adding files to any customization folder, run the generator:

```powershell
powershell -ExecutionPolicy Bypass -File .\refresh-assets.ps1
```

- A live watcher is also available:

```powershell
powershell -ExecutionPolicy Bypass -File .\watch-assets.ps1
```

- `assets/js/asset-loader.js` loads the manifest (with a graceful fallback) and exposes `firstAsset` / `normalizeName` helpers used across pages.
- `assets/js/board-tiles.js` auto-detects the 9×9 grid inside a board-skin image using a grayscale line-profile scan, then insets the playable grid to match the artwork.

---

## Customization Folders (`custom/`)

Drop images into these folders, then run `refresh-assets.ps1`. Supported extensions: `.png`, `.jpg`, `.jpeg`, `.webp`, `.gif`, `.svg`.

| Folder | Contents | Used for |
| --- | --- | --- |
| `custom/country-flags` | 11 flags (Brazil, China, France, Germany, India, Japan, Korea, Philippines, Russia, UK, US) | Piece corner badges / Flag art |
| `custom/piece-designs/frames` | 15 designs (Bagani, Bayani, Kabayanihan, Kagitingan, Kalasag, Katapangan, Lakas, Lakas Loob, Mandirigma, Matapang, Sigasig, Tagapagtanggol, Tapang, Tapang Loob, Tibay) | Silhouette frame layered over every piece |
| `custom/piece-colors` | (empty — add swatch images) | Piece color tint skins |
| `custom/board-skins` | 10 board skins (Board 1–10) | Tactical grid background |
| `custom/portraits` | 2 (general-commander, shadow-scout) | Commander/portrait art |
| `custom/banners` | 1 (bayanihan-banner) | Banner graphics |
| `custom/ui-icons` | 1 (sun-star) | UI icon assets |
| `custom/battlefx` | 1 (fog-sweep) | Battle effect graphics |
| `custom/pieces/<rank>` | 4 variant images per rank (captain, colonel, first-lieutenant, five-star-general, four-star-general, lieutenant-colonel, major, one-star-general, private, second-lieutenant, sergeant, spy, three-star-general, two-star-general) | Per-rank character art shown on pieces |

---

## UI & Design System (`assets/css/styles.css`)

- **Theme**: dark, dramatic, "midnight operations dossier." Background is a fixed `background.png` with a dark overlay and a faint grid texture; panels use layered bronze/teal gradients with double borders and soft shadows.
- **Typography**: display headings in **Cinzel** (serif, monumental); body in **Inter**; the battle stopwatch uses **Share Tech Mono**. Loaded from Google Fonts.
- **Color tokens** (CSS variables): `--bg #090b11`, `--text #e7dfcc`, `--gold #8e6747`, `--red #7a4747`, `--blue #14606f`, `--green #2a4635`, `--cyan-deep #0d4f5d`.
- **Components**: sticky sidebar with active-nav highlighting; gradient `panel` / `panel--inset` / `panel--accent` cards; pill `button` (primary / ghost / accent variants); animated `visual-carousel`; color picker; status pills; layered `piece` elements (design + color + character + flag badge + rank label); sliding `side-modal`s; centered `result-modal`; nested `category-accordion` / `piece-accordion` galleries on the customization page.
- **Pieces** render with layered layers: a `piece__design` frame (luminosity blend), a `piece__color` tint (screen blend, supports custom hex), a `piece__char` image (player pieces only — enemy pieces show `?`), a `piece__badge` flag, and a `piece__label` rank code. Player pieces are teal-toned, CPU pieces bronze-toned; revealed pieces gain a brighter outline.
- **Layout**: CSS grid shell (`sidebar + content`); responsive breakpoints at **1180px** (stack grids, hide carousel side cards), **920px** (single-column, hamburger nav), and **720px** (full-width modals, tighter board cells, stacked buttons).
- **Motion**: carousel slide in/out keyframes, modal scale/fade transitions, piece-move transforms, and accordion height animations.

---

## Project Structure

```
.
├── index.html            # Command Deck
├── setup.html            # Setup Console
├── customization.html    # Asset Customization (armory)
├── deploy.html           # Manual Deploy Board
├── battle.html           # Playable Battle UI
├── rules-lore.html       # Rules & Lore
├── app_icon.png          # Brand / favicon
├── background.png        # Page background
├── refresh-assets.ps1    # Regenerate asset manifest
├── watch-assets.ps1      # Auto-regenerate on asset changes
├── custom/               # User-replaceable art (see table above)
└── assets/
    ├── css/
    │   └── styles.css    # Full design system
    ├── data/
    │   ├── assets-manifest.json   # Runtime asset index
    │   └── assets-manifest.js     # Same data as a JS global
    └── js/
        ├── asset-loader.js   # Manifest loader + helpers
        ├── app.js            # Nav, setup carousels, stopwatch, feed
        ├── board-tiles.js    # Board-skin grid detection
        ├── battle-engine.js  # Game rules, CPU AI, board rendering
        └── deploy.js         # Manual staging logic
```

---

## Running Locally

No build step or dependencies are required — it is a static site. For the manifest fetch and `localStorage` flow to work cleanly, serve over HTTP rather than opening files directly:

```powershell
# Python
python -m http.server 8000

# or Node
npx serve .
```

Then open `http://localhost:8000/`.

**First run**: the asset manifest is already generated. If you add or change art in `custom/`, run `refresh-assets.ps1` (or keep `watch-assets.ps1` running) to rebuild `assets/data/assets-manifest.*`.

---

## Credits & Context

A fan tribute, not an official product. "Pagkamakabayan" signals respect, duty, and collective memory; the site leans into civic atmosphere without claiming to be an official historical document. Game of the Generals was invented by Sofronio H. Pasola Jr. in 1970.
