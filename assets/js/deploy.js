(function () {
  "use strict";

  var STORAGE_KEY = "pagkamakabayanSetup";
  var PLACEMENT_KEY = "pagkamababayanPlayerPlacement";
  var BOARD_SIZE = 9;

  var RANKS = {
    fiveStarGeneral: { label: "5-Star General", abbrev: "5★", count: 1 },
    fourStarGeneral: { label: "4-Star General", abbrev: "4★", count: 1 },
    threeStarGeneral: { label: "3-Star General", abbrev: "3★", count: 1 },
    twoStarGeneral: { label: "2-Star General", abbrev: "2★", count: 1 },
    oneStarGeneral: { label: "1-Star General", abbrev: "1★", count: 1 },
    colonel: { label: "Colonel", abbrev: "COL", count: 1 },
    lieutenantColonel: { label: "Lt. Colonel", abbrev: "LTC", count: 1 },
    major: { label: "Major", abbrev: "MAJ", count: 1 },
    captain: { label: "Captain", abbrev: "CPT", count: 1 },
    firstLieutenant: { label: "1st Lieutenant", abbrev: "1LT", count: 1 },
    secondLieutenant: { label: "2nd Lieutenant", abbrev: "2LT", count: 1 },
    sergeant: { label: "Sergeant", abbrev: "SGT", count: 1 },
    private: { label: "Private", abbrev: "PVT", count: 6 },
    spy: { label: "Spy", abbrev: "SPY", count: 2 },
    flag: { label: "Flag", abbrev: "FLG", count: 1 }
  };

  function normalizeName(fileName) {
    if (!fileName) return "default";
    if (window.PagkamakabayanAssets && window.PagkamakabayanAssets.normalizeName) {
      return window.PagkamakabayanAssets.normalizeName(fileName);
    }
    return fileName.replace(/\.[^/.]+$/, "").replace(/[-_]+/g, " ");
  }

  document.addEventListener("DOMContentLoaded", function () {
    window.siteAssets.then(function (manifest) {
      initDeploy(manifest);
    });
  });

  function readSetup() {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}");
    } catch (error) {
      return {};
    }
  }

  function resolveAsset(manifest, category, fileName) {
    var assets = (manifest && manifest.assets && manifest.assets[category]) || [];
    if (!assets.length) return null;
    return assets.find(function (asset) { return asset.fileName === fileName; }) || assets[0];
  }

  function initDeploy(manifest) {
    var gridRoot = document.querySelector("[data-deploy-grid]");
    var paletteRoot = document.querySelector("[data-deploy-palette]");
    var skinSwatch = document.querySelector("[data-board-skin-swatch]");
    var statusRoot = document.querySelector("[data-deploy-status]");
    var counterRoot = document.querySelector("[data-deploy-counter]");
    var hintRoot = document.querySelector("[data-deploy-hint]");
    var startBtn = document.querySelector("[data-start-battle]");
    var clearBtn = document.querySelector("[data-clear-board]");
    var autoBtn = document.querySelector("[data-auto-fill]");
    if (!gridRoot || !paletteRoot) return;

    var setup = readSetup();

    var flagAsset = resolveAsset(manifest, "country-flags", setup.flag);
    var designAsset = resolveAsset(manifest, "piece-designs", setup.pieceDesign);
    var colorStyle = "";
    if (setup.pieceColor) {
      if (setup.pieceColor.indexOf("#") === 0) {
        colorStyle = setup.pieceColor;
      } else {
        var colorAsset = resolveAsset(manifest, "piece-colors", setup.pieceColor);
        if (colorAsset) colorStyle = "url('" + colorAsset.url + "')";
      }
    }
    var boardAsset = resolveAsset(manifest, "board-skins", setup.board);
    var rankChar = {};
    Object.keys(RANKS).forEach(function (key) {
      var category = "pieces/" + key.replace(/([A-Z])/g, function (m) { return "-" + m.toLowerCase(); }).replace(/^-/, "");
      if (key === "flag") category = "country-flags";
      var asset = resolveAsset(manifest, category, setup[key]);
      rankChar[key] = asset ? asset.url : (flagAsset && key === "flag" ? flagAsset.url : "");
    });
    if (!rankChar.flag && flagAsset) rankChar.flag = flagAsset.url;

    var homeRows = [6, 7, 8];
    var homeCells = [];
    homeRows.forEach(function (row) {
      for (var col = 0; col < BOARD_SIZE; col++) {
        homeCells.push({ x: col, y: row });
      }
    });

    var totalCounts = {};
    var paletteOrder = [];
    Object.keys(RANKS).forEach(function (key) {
      totalCounts[key] = RANKS[key].count;
      paletteOrder.push(key);
    });

    var board = [];
    for (var y = 0; y < BOARD_SIZE; y++) board.push(new Array(BOARD_SIZE).fill(null));
    var selected = null;

    // Counts are always derived from the board itself, so a piece type can
    // never be placed beyond its Game of the Generals limit (no manual counter
    // that can drift during lifts/swaps).
    function countOnBoard(key) {
      var count = 0;
      for (var yy = 0; yy < BOARD_SIZE; yy++) {
        for (var xx = 0; xx < BOARD_SIZE; xx++) {
          if (board[yy][xx] === key) count++;
        }
      }
      return count;
    }

    function remaining(key) {
      return totalCounts[key] - countOnBoard(key);
    }

    function totalPlaced() {
      var count = 0;
      for (var yy = 0; yy < BOARD_SIZE; yy++) {
        for (var xx = 0; xx < BOARD_SIZE; xx++) {
          if (board[yy][xx]) count++;
        }
      }
      return count;
    }

    function totalPieces() {
      var sum = 0;
      Object.keys(totalCounts).forEach(function (key) { sum += totalCounts[key]; });
      return sum;
    }

    function inHome(x, y) {
      return homeRows.indexOf(y) !== -1;
    }

    var frontRow = homeRows[0];
    var backRow = homeRows[homeRows.length - 1];

    // Strict Game of the Generals placement rules:
    // - Flag must occupy the player's back row.
    // - Spy must occupy the player's front row (closest to the center).
    // - Every other piece may sit anywhere in the home zone.
    function requiredRow(key) {
      if (key === "flag") return backRow;
      if (key === "spy") return frontRow;
      return -1;
    }

    function isLegalPlacement(key, y) {
      var req = requiredRow(key);
      return req === -1 ? true : y === req;
    }

    function ruleNote(key) {
      var req = requiredRow(key);
      if (req === backRow) return "Back row only";
      if (req === frontRow) return "Front row only";
      return "Any home row";
    }

    function setSkin() {
      if (boardAsset && skinSwatch) {
        skinSwatch.style.backgroundImage = "url('" + boardAsset.url + "')";
      }
      if (window.BoardTiles && boardAsset) {
        window.BoardTiles.detect(boardAsset.url).then(function (layout) {
          var boardWrap = gridRoot.closest(".deploy-board") || gridRoot.closest(".battle-board");
          if (boardWrap) {
            var inset = (layout.inset * 100).toFixed(2) + "%";
            boardWrap.style.setProperty("--board-inset", inset);
            boardWrap.style.setProperty("--grid-top", inset);
            boardWrap.style.setProperty("--grid-left", inset);
            boardWrap.style.setProperty("--grid-right", inset);
            boardWrap.style.setProperty("--grid-bottom", inset);
          }
          gridRoot.style.setProperty("--grid-cols", layout.cols || 9);
          gridRoot.style.setProperty("--grid-rows", layout.rows || 9);
          renderBoard();
        });
      } else {
        renderBoard();
      }
    }

    function pieceMarkup(rankKey) {
      var designLayer = designAsset
        ? '<div class="piece__design" style="background-image:url(\'' + designAsset.url + "')\"></div>"
        : "";
      var colorLayer = colorStyle
        ? (setup.pieceColor && setup.pieceColor.indexOf("#") === 0
          ? '<div class="piece__color" style="background-color:' + colorStyle + '"></div>'
          : '<div class="piece__color" style="background-image:' + colorStyle + '"></div>')
        : "";
      var charLayer = rankChar[rankKey]
        ? '<div class="piece__char"><img src="' + rankChar[rankKey] + '" alt="' + RANKS[rankKey].label + '"></div>'
        : '<div class="piece__char piece__char--hidden"></div>';
      var badge = flagAsset
        ? '<div class="piece__badge"><img src="' + flagAsset.url + '" alt="flag"></div>'
        : "";
      return (
        '<div class="piece piece--player">' +
        designLayer +
        colorLayer +
        charLayer +
        badge +
        '<span class="piece__label">' + RANKS[rankKey].abbrev + "</span>" +
        "</div>"
      );
    }

    function renderPalette() {
      paletteRoot.innerHTML = paletteOrder.map(function (key) {
        var left = remaining(key);
        var isSelected = selected === key;
        var disabled = left <= 0 && !isSelected;
        return (
          '<button type="button" class="deploy-piece' + (isSelected ? " is-selected" : "") + (disabled ? " is-empty" : "") + '" ' +
          'data-piece="' + key + '" ' + (disabled ? "disabled" : "") + ' aria-label="select ' + RANKS[key].label + '">' +
          '<span class="deploy-piece__art">' +
          (rankChar[key]
            ? '<img src="' + rankChar[key] + '" alt="' + RANKS[key].label + '">'
            : '<span class="deploy-piece__placeholder">' + RANKS[key].abbrev + "</span>") +
          "</span>" +
          '<span class="deploy-piece__meta">' +
          "<strong>" + RANKS[key].label + "</strong>" +
          '<span class="deploy-piece__count">' + left + " / " + totalCounts[key] + "</span>" +
          '<span class="deploy-piece__rule">' + ruleNote(key) + "</span>" +
          "</span>" +
          "</button>"
        );
      }).join("");

      paletteRoot.querySelectorAll("[data-piece]").forEach(function (button) {
        button.addEventListener("click", function () {
          var key = button.dataset.piece;
          selected = selected === key ? null : key;
          renderPalette();
          renderBoard();
          renderHint();
        });
      });
    }

    function renderBoard() {
      var cells = "";
      for (var yy = 0; yy < BOARD_SIZE; yy++) {
        for (var xx = 0; xx < BOARD_SIZE; xx++) {
          var rankKey = board[yy][xx];
          var classes = "cell";
          if (inHome(xx, yy)) {
            if (rankKey) {
              classes += " cell--occupied";
            } else if (selected && isLegalPlacement(selected, yy)) {
              classes += " cell--move";
            }
          } else {
            classes += " cell--enemy";
          }
          var inner = rankKey ? pieceMarkup(rankKey) : "";
          cells +=
            '<button type="button" class="' + classes + '" data-x="' + xx + '" data-y="' + yy + '" aria-label="tile ' + (xx + 1) + "-" + (yy + 1) + '">' +
            inner +
            "</button>";
        }
      }
      gridRoot.innerHTML = cells;

      gridRoot.querySelectorAll("[data-x]").forEach(function (cell) {
        cell.addEventListener("click", function () {
          var x = Number(cell.dataset.x);
          var y = Number(cell.dataset.y);
          onCellClick(x, y);
        });
      });
    }

    function renderStatus() {
      var placedCount = totalPlaced();
      var total = totalPieces();
      var ready = placedCount === total;
      if (statusRoot) {
        statusRoot.innerHTML =
          '<div class="status-pill ' + (ready ? "is-active" : "") + '">' +
          (ready ? "All forces staged" : "Staging in progress") +
          "</div>" +
          '<div class="status-pill">Placed: ' + placedCount + " / " + total + "</div>" +
          '<div class="status-pill">Board: ' + (boardAsset ? normalizeName(boardAsset.fileName) : "default") + "</div>";
      }
      if (counterRoot) {
        counterRoot.textContent = placedCount + " / " + total + " seated";
      }
      if (startBtn) startBtn.disabled = !ready;
    }

    function renderHint() {
      if (!hintRoot) return;
      if (selected) {
        var req = requiredRow(selected);
        var where = req === backRow ? "your back row" : req === frontRow ? "your front row" : "any tile in your zone";
        hintRoot.textContent = "Selected " + RANKS[selected].label + " (" + ruleNote(selected) + ") — tap a glowing tile in " + where + " to place it.";
      } else {
        hintRoot.textContent = "Tap a piece above, then tap an empty tile. Flag goes in the back row, Spy in the front row.";
      }
    }

    function onCellClick(x, y) {
      if (!inHome(x, y)) return;
      var occupant = board[y][x];
      if (occupant) {
        if (selected) {
          if (selected === occupant) {
            // Deselect / put the lifted piece back where it came from.
            board[y][x] = selected;
            selected = null;
          } else {
            if (!isLegalPlacement(selected, y)) {
              flashRule(selected);
              return;
            }
            if (remaining(selected) <= 0) {
              flashLimit(selected);
              return;
            }
            // Swap: occupant is lifted off, selected drops in.
            board[y][x] = selected;
            selected = occupant;
          }
        } else {
          // Lift a placed piece (it leaves the board, still selectable).
          board[y][x] = null;
          selected = occupant;
        }
      } else if (selected) {
        if (!isLegalPlacement(selected, y)) {
          flashRule(selected);
          return;
        }
        if (remaining(selected) <= 0) {
          flashLimit(selected);
          return;
        }
        board[y][x] = selected;
        selected = null;
      }
      renderPalette();
      renderBoard();
      renderStatus();
      renderHint();
    }

    function flashLimit(key) {
      if (!hintRoot) return;
      hintRoot.textContent = "Limit reached: you can only field " + totalCounts[key] + " " + RANKS[key].label + (totalCounts[key] === 1 ? "" : "s") + " in this army.";
    }

    function flashRule(key) {
      if (!hintRoot) return;
      var req = requiredRow(key);
      var where = req === backRow ? "your back row" : req === frontRow ? "your front row" : "your zone";
      hintRoot.textContent = RANKS[key].label + " must be placed in " + where + " (" + ruleNote(key) + "). Choose a glowing tile there.";
    }

    function clearBoard() {
      for (var yy = 0; yy < BOARD_SIZE; yy++) {
        for (var xx = 0; xx < BOARD_SIZE; xx++) board[yy][xx] = null;
      }
      selected = null;
      renderPalette();
      renderBoard();
      renderStatus();
      renderHint();
    }

    function autoFill() {
      var empty = homeCells.filter(function (cell) { return !board[cell.y][cell.x]; });
      Object.keys(RANKS).forEach(function (key) {
        for (var n = countOnBoard(key); n < totalCounts[key]; n++) {
          var candidates = empty.filter(function (cell) {
            return !board[cell.y][cell.x] && isLegalPlacement(key, cell.y);
          });
          if (!candidates.length) return;
          shuffle(candidates);
          var cell = candidates[0];
          board[cell.y][cell.x] = key;
          empty = empty.filter(function (c) { return !(c.x === cell.x && c.y === cell.y); });
        }
      });
      selected = null;
      renderPalette();
      renderBoard();
      renderStatus();
      renderHint();
    }

    function shuffle(array) {
      for (var i = array.length - 1; i > 0; i--) {
        var j = Math.floor(Math.random() * (i + 1));
        var temp = array[i];
        array[i] = array[j];
        array[j] = temp;
      }
      return array;
    }

    function startBattle() {
      if (totalPlaced() !== totalPieces()) {
        renderHint();
        return;
      }
      var flagOk = false;
      var spyCount = 0;
      for (var y = 0; y < BOARD_SIZE; y++) {
        for (var x = 0; x < BOARD_SIZE; x++) {
          var key = board[y][x];
          if (key === "flag" && y === backRow) flagOk = true;
          if (key === "spy" && y === frontRow) spyCount++;
        }
      }
      if (!flagOk || spyCount !== RANKS.spy.count) {
        if (hintRoot) hintRoot.textContent = "Strict rules: the Flag must sit in your back row and both Spies in your front row before battle.";
        return;
      }
      var payload = board.map(function (row) { return row.slice(); });
      localStorage.setItem(PLACEMENT_KEY, JSON.stringify(payload));
      window.location.href = "battle.html";
    }

    if (startBtn) startBtn.addEventListener("click", startBattle);
    if (clearBtn) clearBtn.addEventListener("click", clearBoard);
    if (autoBtn) autoBtn.addEventListener("click", autoFill);

    setSkin();
    renderPalette();
    renderBoard();
    renderStatus();
    renderHint();
  }
})();
