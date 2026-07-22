(function () {
  "use strict";

  // Detects the actual playable tile area inside a board-skin image so the
  // piece grid can be aligned to the artwork, regardless of how each board
  // file frames or crops its tiles.
  //
  // The real Game of the Generals board is a 9-column x 8-row rectangle
  // (72 squares) -- every board-skin in custom/board-skins/ is drawn that
  // way. So instead of trying to "count" grid lines (fragile: crack/
  // ornamental texture in the art creates lots of false lines), this fits
  // a fixed 9x8 periodic grid template against the image and finds the
  // four edge insets (top/right/bottom/left) that best line up with the
  // real tile boundaries.
  //
  // Fallback: if an image's art is too noisy for a confident fit (or a
  // fit lands somewhere implausible), we fall back to a sensible default
  // inset learned from this project's own board-skin set, rather than a
  // 0% inset that pins the grid to the outer frame.

  var COLS = 9;
  var ROWS = 8;

  // Learned from this project's own custom/board-skins artwork -- used
  // only when a given image's own tile lines can't be found confidently.
  var DEFAULT_INSET = {
    left: 0.0797,
    right: 0.0845,
    top: 0.0909,
    bottom: 0.0832
  };

  var FALLBACK = {
    detected: false,
    cols: COLS,
    rows: ROWS,
    insetTop: DEFAULT_INSET.top,
    insetRight: DEFAULT_INSET.right,
    insetBottom: DEFAULT_INSET.bottom,
    insetLeft: DEFAULT_INSET.left,
    aspectRatio: null
  };

  function loadImage(src) {
    return new Promise(function (resolve, reject) {
      if (!src) {
        reject(new Error("No board image source provided."));
        return;
      }
      var img = new Image();
      img.crossOrigin = "anonymous";
      img.onload = function () {
        resolve(img);
      };
      img.onerror = function () {
        reject(new Error("Failed to load board image."));
      };
      img.src = src;
    });
  }

  function toGray(image, maxWidth) {
    var srcWidth = image.naturalWidth || image.width || maxWidth;
    var srcHeight = image.naturalHeight || image.height || maxWidth;
    var targetWidth = Math.min(srcWidth, maxWidth);
    var ratio = targetWidth / srcWidth;
    var width = Math.max(1, Math.round(targetWidth));
    var height = Math.max(1, Math.round(srcHeight * ratio));
    var canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    var context = canvas.getContext("2d");
    context.drawImage(image, 0, 0, width, height);
    var raw = context.getImageData(0, 0, width, height).data;
    var gray = new Float32Array(width * height);
    for (var i = 0, p = 0; i < gray.length; i++, p += 4) {
      gray[i] = 0.299 * raw[p] + 0.587 * raw[p + 1] + 0.114 * raw[p + 2];
    }
    return { gray: gray, width: width, height: height, naturalWidth: srcWidth, naturalHeight: srcHeight };
  }

  function median(arr) {
    var sorted = arr.slice().sort(function (a, b) { return a - b; });
    var mid = Math.floor(sorted.length / 2);
    return sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
  }

  // Builds an "edge coverage" profile: for each column (or row), what
  // fraction of the perpendicular axis shows a strong local brightness
  // jump there. A true grid line runs the *entire* length of the board,
  // so it scores near 1.0 coverage. Ornamental cracks/decorations only
  // cross a small vertical/horizontal extent, so they score low even if
  // locally very high-contrast -- this is what makes the profile robust
  // against the kintsugi-style crack textures in this project's art.
  function coverageProfile(data, axis) {
    var w = data.width, h = data.height, gray = data.gray;

    if (axis === "v") {
      // Diff image D[y][x] = |gray[y][x+1] - gray[y][x]|, x in 0..w-2.
      // Threshold is computed PER ROW (this row's own typical diff size,
      // since different rows -- e.g. inside a crack texture -- can have
      // very different baseline noise), then aggregated per COLUMN across
      // all rows: a true vertical grid line stands out against its own
      // row's baseline consistently, all the way down the image.
      var dW = w - 1;
      var rowThreshold = new Float32Array(h);
      var diffRows = [];
      for (var y = 0; y < h; y++) {
        var row = new Float32Array(dW);
        for (var x = 0; x < dW; x++) {
          row[x] = Math.abs(gray[y * w + x + 1] - gray[y * w + x]);
        }
        diffRows.push(row);
        var sorted = Array.prototype.slice.call(row).sort(function (a, b) { return a - b; });
        var med = sorted[Math.floor(sorted.length / 2)];
        var mad = 0;
        for (var k = 0; k < sorted.length; k++) mad += Math.abs(sorted[k] - med);
        mad = mad / sorted.length + 1e-6;
        rowThreshold[y] = med + 2.5 * mad;
      }
      var coverage = new Float32Array(dW);
      for (var x2 = 0; x2 < dW; x2++) {
        var count = 0;
        for (var y2 = 0; y2 < h; y2++) {
          if (diffRows[y2][x2] > rowThreshold[y2]) count++;
        }
        coverage[x2] = count / h;
      }
      return coverage;
    }

    // Diff image D[y][x] = |gray[y+1][x] - gray[y][x]|, y in 0..h-2.
    // Threshold is computed PER COLUMN, then aggregated per ROW across
    // all columns (mirror of the "v" case above).
    var dH = h - 1;
    var colThreshold = new Float32Array(w);
    var diffCols = [];
    for (var x3 = 0; x3 < w; x3++) {
      var col = new Float32Array(dH);
      for (var y3 = 0; y3 < dH; y3++) {
        col[y3] = Math.abs(gray[(y3 + 1) * w + x3] - gray[y3 * w + x3]);
      }
      diffCols.push(col);
      var sortedC = Array.prototype.slice.call(col).sort(function (a, b) { return a - b; });
      var medC = sortedC[Math.floor(sortedC.length / 2)];
      var madC = 0;
      for (var k2 = 0; k2 < sortedC.length; k2++) madC += Math.abs(sortedC[k2] - medC);
      madC = madC / sortedC.length + 1e-6;
      colThreshold[x3] = medC + 2.5 * madC;
    }
    var coverageH = new Float32Array(dH);
    for (var y4 = 0; y4 < dH; y4++) {
      var countH = 0;
      for (var x4 = 0; x4 < w; x4++) {
        if (diffCols[x4][y4] > colThreshold[x4]) countH++;
      }
      coverageH[y4] = countH / w;
    }
    return coverageH;
  }

  function interp(profile, pos) {
    var idx0 = Math.floor(pos);
    var idx1 = Math.min(idx0 + 1, profile.length - 1);
    var frac = pos - idx0;
    return profile[idx0] * (1 - frac) + profile[idx1] * frac;
  }

  // Fits a fixed n-interval (n+1 grid line) periodic template against the
  // coverage profile: searches spacing S and phase offset o, scoring by
  // total coverage support while requiring nearly all n+1 predicted lines
  // to show real (relative-threshold) edge support -- so a single
  // accidental spike (e.g. the outer frame edge) can't win on its own.
  function bestFit(profile, n) {
    var length = profile.length;
    var pmax = 0;
    for (var i = 0; i < length; i++) if (profile[i] > pmax) pmax = profile[i];
    if (pmax <= 0) return null;
    var threshold = 0.55 * pmax;
    var maxMissing = 3;

    var sMin = (length / n) * 0.55;
    var sMax = (length / n) * 1.35;
    var sSteps = 300;
    var phaseSteps = 50;

    var best = null;
    var bestScore = -1;

    for (var si = 0; si < sSteps; si++) {
      var S = sMin + (sMax - sMin) * (si / (sSteps - 1));
      for (var pi = 0; pi < phaseSteps; pi++) {
        var o = (S * pi) / phaseSteps;
        var lastPos = o + n * S;
        if (lastPos >= length - 1) continue;

        var sum = 0;
        var missing = 0;
        for (var k = 0; k <= n; k++) {
          var v = interp(profile, o + k * S);
          if (v < threshold) missing++;
          sum += v;
        }
        if (missing > maxMissing) continue;
        if (sum > bestScore) {
          bestScore = sum;
          best = { S: S, o: o };
        }
      }
    }
    return best;
  }

  // Runs the template fit for one axis and converts it into a validated
  // {start, end} inset pair (each a 0..1 fraction of that axis' length).
  // Returns null if detection failed or landed somewhere implausible, so
  // the caller can fall back to a safe default for just that axis.
  function axisInsets(profile, n) {
    var length = profile.length;
    var fit = bestFit(profile, n);
    if (!fit) return null;
    var start = fit.o / length;
    var end = 1 - (fit.o + n * fit.S) / length;
    if (start < 0.02 || start > 0.25 || end < 0.02 || end > 0.25) return null;
    return { start: start, end: end };
  }

  function detect(src) {
    return loadImage(src)
      .then(function (image) {
        try {
          var data = toGray(image, 480);
          var covV = coverageProfile(data, "v"); // vertical lines -> columns
          var covH = coverageProfile(data, "h"); // horizontal lines -> rows

          var colFit = axisInsets(covV, COLS);
          var rowFit = axisInsets(covH, ROWS);

          var naturalWidth = data.naturalWidth;
          var naturalHeight = data.naturalHeight;
          var aspectRatio = naturalWidth && naturalHeight ? naturalWidth / naturalHeight : null;

          var insetLeft = colFit ? colFit.start : DEFAULT_INSET.left;
          var insetRight = colFit ? colFit.end : DEFAULT_INSET.right;
          var insetTop = rowFit ? rowFit.start : DEFAULT_INSET.top;
          var insetBottom = rowFit ? rowFit.end : DEFAULT_INSET.bottom;

          return {
            detected: !!(colFit && rowFit),
            cols: COLS,
            rows: ROWS,
            insetTop: insetTop,
            insetRight: insetRight,
            insetBottom: insetBottom,
            insetLeft: insetLeft,
            aspectRatio: aspectRatio
          };
        } catch (error) {
          return FALLBACK;
        }
      })
      .catch(function () {
        return FALLBACK;
      });
  }

  // Applies a detected layout to a board wrapper element + its grid
  // element: four independent per-edge insets, the fixed 9x8 track
  // count, and the board's natural aspect ratio so the artwork is never
  // stretched.
  function apply(layout, boardWrap, gridRoot) {
    if (!layout) return;
    if (boardWrap) {
      boardWrap.style.setProperty("--grid-top", (layout.insetTop * 100).toFixed(2) + "%");
      boardWrap.style.setProperty("--grid-left", (layout.insetLeft * 100).toFixed(2) + "%");
      boardWrap.style.setProperty("--grid-right", (layout.insetRight * 100).toFixed(2) + "%");
      boardWrap.style.setProperty("--grid-bottom", (layout.insetBottom * 100).toFixed(2) + "%");
      if (layout.aspectRatio) {
        boardWrap.style.setProperty("--board-aspect", layout.aspectRatio.toFixed(5));
      } else {
        boardWrap.style.removeProperty("--board-aspect");
      }
    }
    if (gridRoot) {
      gridRoot.style.setProperty("--grid-cols", layout.cols || COLS);
      gridRoot.style.setProperty("--grid-rows", layout.rows || ROWS);
      gridRoot.style.gridTemplateColumns = "repeat(" + (layout.cols || COLS) + ", minmax(0, 1fr))";
      gridRoot.style.gridTemplateRows = "repeat(" + (layout.rows || ROWS) + ", minmax(0, 1fr))";
    }
  }

  window.BoardTiles = { detect: detect, apply: apply };
})();
