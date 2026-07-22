# Real 9x8 board + accurate tile-grid detection (Deploy + Battle)

## What changed
Only these 4 files were touched — drop them into your existing project at
the same paths (overwrite) and you're done.

- `assets/js/board-tiles.js`
- `assets/js/deploy.js`
- `assets/js/battle-engine.js`
- `assets/css/styles.css`

## The big discovery
While validating the grid-detection fix against your green-box reference
image, I overlaid a 9x9 grid on the actual board art and it drifted out of
alignment toward the bottom. Every one of your `custom/board-skins/`
images is actually drawn as **9 columns x 8 rows (72 tiles)** — the real,
traditional Game of the Generals board — not a 9x9 square. The site's code
had `BOARD_SIZE = 9` hardcoded for both dimensions, so it was always going
to misalign no matter how good the inset detection got.

You confirmed: switch the board to the real 9x8 layout. That's what this
update does.

## Game-logic changes (deploy.js + battle-engine.js)
- `BOARD_SIZE` replaced with separate `BOARD_COLS = 9` / `BOARD_ROWS = 8`
  everywhere a board array, loop bound, or bounds-check used it.
- Home rows shifted from `[6, 7, 8]` to `[5, 6, 7]` (still the back 3 rows
  of your own side, just re-indexed for an 8-row board). Flag still must
  sit in the back row (now row 7), Spy still in the front row (now row 5).
- The CPU's own home rows `[0, 1, 2]` are unchanged (already valid on an
  8-row board).
- The "flag reaches the enemy baseline" win condition now checks
  `BOARD_ROWS - 1` (row 7) instead of the old hardcoded `8`.
- Saved-placement validation (`readPlayerPlacement`) now expects an
  8x9 array shape instead of 9x9.
- Total piece count per side (21) still fits comfortably in the 3x9 = 27
  home-zone cells — untouched by this change.

## Grid-detection changes (board-tiles.js)
Since the board is now a known, fixed 9x8 shape, detection no longer tries
to *count* grid lines (that was the fragile part — cracks and ornamental
corners in the art were creating false lines and making the old detector
fail silently, which is why pieces were sitting on the frame in your
screenshot). Instead it fits a **fixed 9x8 periodic template** against the
image and finds the four independent edge insets (top/right/bottom/left)
that best line up with the real tile boundaries:

- Builds an edge-coverage profile per column/row using a per-row (or
  per-column) noise threshold, so a true grid line — which runs the full
  length of the board — stands out from a crack decoration, which only
  crosses a small stretch.
- Searches for the spacing + phase offset that best matches a 9-tile (or
  8-tile) periodic pattern, tolerating a couple of occluded/weak lines.
- Validates the result against a plausible margin range; if a given image
  can't be matched confidently, that axis falls back to a default inset
  learned from this project's own board-skin set (~8% left, ~8.5% right,
  ~9% top, ~8.3% bottom) instead of the old broken 0%-inset fallback.
- Also reports the image's natural aspect ratio so the board frame sizes
  to the artwork instead of stretching it.

I validated this against your green-box reference image (screen2.jpg) —
the detector's result matches it within about 1%.

## CSS changes (styles.css)
- `--grid-rows` default changed from `9` to `8` in both the board
  container and the grid-template fallback.
- (Carried over from the previous inset fix: the board container sizes to
  `--board-aspect`, the grid overlay is a pure 4-edge inset box, and `.cell`
  fills its real grid track instead of a fixed size.)

No HTML changes were needed.
