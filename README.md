# Pagkamakabayan ay Maurag

A dark-mode historic-comic microsite for Game of the Generals with setup, battle UI, lore, and manifest-based asset customization.

## Overview

Game of the Generals is part war-room simulation, part memory duel, and part national myth-making. This standalone site frames it as a midnight operations dossier with panel borders, dramatic lighting, and customizable visual assets.

## Pages

- **Command Deck** (`index.html`) - Atmospheric entry page introducing the game, difficulty ladder, and asset workflow
- **Setup Page** (`setup.html`) - Faction flavor, board skin selection, CPU difficulty descriptors, and mission toggles
- **Battle UI** (`battle.html`) - Stylized tactical board with turn status, ranked unit cards, battlefield feed, and comic-caption overlays
- **Rules & Lore** (`rules-lore.html`) - Concise rules dossier connecting deduction gameplay with national memory and oral tradition

## Asset Pipeline

This static site reads `./assets/data/assets-manifest.json`. After adding files to any customization folder, run:

```powershell
powershell -ExecutionPolicy Bypass -File .\refresh-assets.ps1
```

### Customization Folders

- `custom/country-flags` - Country flag images
- `custom/rank-characters` - Rank character artwork
- `custom/piece-designs` - Game piece designs
- `custom/piece-colors` - Piece color variants
- `custom/board-skins` - Board skin backgrounds
- `custom/battlefx` - Battle effect graphics
- `custom/ui-icons` - UI icon assets
- `custom/banners` - Banner graphics
- `custom/portraits` - Portrait images

## CPU Difficulties

1. **Anak** - Child/Easy
2. **Mabalos / Salamat** - Gratitude/Medium
3. **Maurag po Ako** - I'm strong/Challenging
4. **Mahal ko ang Bayan** - Love of country/Hard