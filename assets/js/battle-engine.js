window.PagkamakabayanBattle = (function () {
  "use strict";

  var BOARD_SIZE = 9;
  var STORAGE_KEY = "pagkamakabayanSetup";

  // Rank definitions: strength is higher = stronger. Officers are Sergeant (4) and above.
  var RANKS = {
    fiveStarGeneral: { label: "5-Star General", abbrev: "5★", strength: 15, isOfficer: true, count: 1 },
    fourStarGeneral: { label: "4-Star General", abbrev: "4★", strength: 14, isOfficer: true, count: 1 },
    threeStarGeneral: { label: "3-Star General", abbrev: "3★", strength: 13, isOfficer: true, count: 1 },
    twoStarGeneral: { label: "2-Star General", abbrev: "2★", strength: 12, isOfficer: true, count: 1 },
    oneStarGeneral: { label: "1-Star General", abbrev: "1★", strength: 11, isOfficer: true, count: 1 },
    colonel: { label: "Colonel", abbrev: "COL", strength: 10, isOfficer: true, count: 1 },
    lieutenantColonel: { label: "Lt. Colonel", abbrev: "LTC", strength: 9, isOfficer: true, count: 1 },
    major: { label: "Major", abbrev: "MAJ", strength: 8, isOfficer: true, count: 1 },
    captain: { label: "Captain", abbrev: "CPT", strength: 7, isOfficer: true, count: 1 },
    firstLieutenant: { label: "1st Lieutenant", abbrev: "1LT", strength: 6, isOfficer: true, count: 1 },
    secondLieutenant: { label: "2nd Lieutenant", abbrev: "2LT", strength: 5, isOfficer: true, count: 1 },
    sergeant: { label: "Sergeant", abbrev: "SGT", strength: 4, isOfficer: true, count: 1 },
    private: { label: "Private", abbrev: "PVT", strength: 3, isOfficer: false, count: 6 },
    spy: { label: "Spy", abbrev: "SPY", strength: 2, isOfficer: false, count: 2 },
    flag: { label: "Flag", abbrev: "FLG", strength: 1, isOfficer: false, count: 1 }
  };

  var RANK_CATEGORY = {
    fiveStarGeneral: "pieces/five-star-general",
    fourStarGeneral: "pieces/four-star-general",
    threeStarGeneral: "pieces/three-star-general",
    twoStarGeneral: "pieces/two-star-general",
    oneStarGeneral: "pieces/one-star-general",
    colonel: "pieces/colonel",
    lieutenantColonel: "pieces/lieutenant-colonel",
    major: "pieces/major",
    captain: "pieces/captain",
    firstLieutenant: "pieces/first-lieutenant",
    secondLieutenant: "pieces/second-lieutenant",
    sergeant: "pieces/sergeant",
    spy: "pieces/spy",
    private: "pieces/private",
    flag: "country-flags"
  };

  var DIFFICULTY_PROFILES = {
    "Anak": { aggression: 0.25, randomness: 0.7, foresight: false, defends: false },
    "Mabalos / Salamat": { aggression: 0.5, randomness: 0.35, foresight: false, defends: true },
    "Maurag po Ako": { aggression: 0.75, randomness: 0.15, foresight: true, defends: true },
    "Mahal ko ang Bayan": { aggression: 0.9, randomness: 0, foresight: true, defends: true }
  };

  var DIRS = [
    { dx: 0, dy: -1 },
    { dx: 0, dy: 1 },
    { dx: -1, dy: 0 },
    { dx: 1, dy: 0 }
  ];

  function shuffle(array) {
    for (var i = array.length - 1; i > 0; i--) {
      var j = Math.floor(Math.random() * (i + 1));
      var temp = array[i];
      array[i] = array[j];
      array[j] = temp;
    }
    return array;
  }

  function readConfig(manifest) {
    var saved = {};
    try {
      saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}");
    } catch (error) {
      saved = {};
    }

    function resolve(category, fileName) {
      var assets = (manifest && manifest.assets && manifest.assets[category]) || [];
      if (!assets.length) return null;
      return assets.find(function (asset) { return asset.fileName === fileName; }) || assets[0];
    }

    var flagAsset = resolve("country-flags", saved.flag);
    var designAsset = resolve("piece-designs", saved.pieceDesign);
    var pieceColor = saved.pieceColor || "";
    var colorStyle = "";
    var colorAsset = null;
    if (pieceColor && pieceColor.indexOf("#") === 0) {
      colorStyle = pieceColor;
    } else {
      colorAsset = resolve("piece-colors", pieceColor);
      if (colorAsset) colorStyle = "url('" + colorAsset.url + "')";
    }

    var rankChar = {};
    Object.keys(RANKS).forEach(function (key) {
      var asset = resolve(RANK_CATEGORY[key], saved[key]);
      rankChar[key] = asset ? asset.url : "";
    });
    if (!rankChar.flag && flagAsset) rankChar.flag = flagAsset.url;

    var boardAsset = resolve("board-skins", saved.board);

    return {
      flagUrl: flagAsset ? flagAsset.url : "",
      flagLabel: flagAsset ? flagAsset.label : "",
      designUrl: designAsset ? designAsset.url : "",
      colorStyle: colorStyle,
      colorIsHex: !!(pieceColor && pieceColor.indexOf("#") === 0),
      rankChar: rankChar,
      boardUrl: boardAsset ? boardAsset.url : "",
      difficulty: saved.difficulty || "Maurag po Ako",
      faction: saved.faction || "archival"
    };
  }

  // Resolve combat: returns "attacker" (att loses), "defender" (def loses), or "both".
  function fight(att, def) {
    var a = att.rank.key;
    var d = def.rank.key;
    if (a === "flag" && d === "flag") return "defender";
    if (a === "flag") return "attacker";
    if (d === "flag") return "defender";
    if (a === "spy" && d === "spy") return "both";
    if (d === "spy") return "defender";
    if (a === "spy") return def.rank.isOfficer ? "defender" : "attacker";
    if (att.rank.strength > def.rank.strength) return "defender";
    if (att.rank.strength < def.rank.strength) return "attacker";
    return "both";
  }

  function createGame(cfg, playerPlacement) {
    var board = [];
    for (var y = 0; y < BOARD_SIZE; y++) {
      board.push(new Array(BOARD_SIZE).fill(null));
    }

    var idc = 0;
    function makePiece(side, rankKey) {
      return {
        id: idc++,
        side: side,
        rankKey: rankKey,
        rank: RANKS[rankKey],
        charUrl: cfg.rankChar[rankKey] || cfg.flagUrl,
        revealed: false,
        alive: true
      };
    }

    function placeFromLayout(side, layout) {
      var flagPlaced = false;
      var count = 0;
      for (var ly = 0; ly < BOARD_SIZE; ly++) {
        for (var lx = 0; lx < BOARD_SIZE; lx++) {
          var key = layout && layout[ly] && layout[ly][lx];
      if (!key || !RANKS[key]) continue;
      if (side === "player" && ly < 6) continue;
      if (side === "cpu" && ly > 2) continue;
          board[ly][lx] = makePiece(side, key);
          count++;
          if (key === "flag") flagPlaced = true;
        }
      }
      return flagPlaced && count > 0;
    }

    function place(side) {
      var homeRows = side === "player" ? [6, 7, 8] : [0, 1, 2];
      var backRow = side === "player" ? 8 : 0;
      var frontRow = side === "player" ? 6 : 2;

      var cellsByRow = {};
      homeRows.forEach(function (row) {
        cellsByRow[row] = [];
        for (var col = 0; col < BOARD_SIZE; col++) {
          cellsByRow[row].push({ x: col, y: row });
        }
      });

      // Flag must occupy the back row.
      shuffle(cellsByRow[backRow]);
      var flagCell = cellsByRow[backRow].pop();
      board[flagCell.y][flagCell.x] = makePiece(side, "flag");

      // Spies must occupy the front row.
      shuffle(cellsByRow[frontRow]);
      for (var s = 0; s < RANKS.spy.count; s++) {
        var spyCell = cellsByRow[frontRow].pop();
        board[spyCell.y][spyCell.x] = makePiece(side, "spy");
      }

      // Remaining pieces fill any open home cell.
      var remaining = [];
      homeRows.forEach(function (row) {
        cellsByRow[row].forEach(function (cell) { remaining.push(cell); });
      });
      shuffle(remaining);

      var others = [];
      Object.keys(RANKS).forEach(function (key) {
        if (key === "flag" || key === "spy") return;
        for (var n = 0; n < RANKS[key].count; n++) others.push(key);
      });
      others.forEach(function (key) {
        var cell = remaining.pop();
        board[cell.y][cell.x] = makePiece(side, key);
      });
    }

    if (playerPlacement && placeFromLayout("player", playerPlacement)) {
      // player used the manual deployment from the staging page
    } else {
      place("player");
    }
    place("cpu");

    return {
      board: board,
      turn: "player",
      selected: null,
      finished: false,
      winner: null,
      reason: "",
      difficulty: cfg.difficulty,
      moveCount: 0,
      log: [],
      eliminated: [],
      cfg: cfg
    };
  }

  function inBounds(x, y) {
    return x >= 0 && y >= 0 && x < BOARD_SIZE && y < BOARD_SIZE;
  }

  function legalMoves(state, x, y) {
    var piece = state.board[y][x];
    if (!piece || !piece.alive) return [];
    var moves = [];
    DIRS.forEach(function (dir) {
      var nx = x + dir.dx;
      var ny = y + dir.dy;
      if (!inBounds(nx, ny)) return;
      var target = state.board[ny][nx];
      if (!target) {
        moves.push({ x: nx, y: ny, capture: false });
      } else if (target.side !== piece.side) {
        moves.push({ x: nx, y: ny, capture: true });
      }
    });
    return moves;
  }

  function allLegalMoves(state, side) {
    var moves = [];
    for (var y = 0; y < BOARD_SIZE; y++) {
      for (var x = 0; x < BOARD_SIZE; x++) {
        var piece = state.board[y][x];
        if (!piece || !piece.alive || piece.side !== side) continue;
        legalMoves(state, x, y).forEach(function (move) {
          moves.push({ from: { x: x, y: y }, to: { x: move.x, y: move.y }, capture: move.capture });
        });
      }
    }
    return moves;
  }

  function findFlag(state, side) {
    for (var y = 0; y < BOARD_SIZE; y++) {
      for (var x = 0; x < BOARD_SIZE; x++) {
        var piece = state.board[y][x];
        if (piece && piece.alive && piece.side === side && piece.rankKey === "flag") {
          return { x: x, y: y };
        }
      }
    }
    return null;
  }

  function mount(manifest) {
    var gridRoot = document.querySelector("[data-battle-grid]");
    if (!gridRoot) return;

    var skinSwatch = document.querySelector("[data-board-skin-swatch]");
    var statusRoot = document.querySelector("[data-battle-status]");
    var logRoot = document.querySelector("[data-battle-log]");
    var eyebrow = document.querySelector("[data-battle-eyebrow]");
    var title = document.querySelector("[data-battle-title]");
    var diffText = document.querySelector("[data-battle-difficulty-text]");
    var newBtn = document.querySelector("[data-battle-new-battle-btn]");
    var resignBtn = document.querySelector("[data-battle-resign-btn]");
    var statusModal = document.querySelector("[data-battle-status-modal]");
    var encounterModal = document.querySelector("[data-battle-encounter-modal]");
    var statusDialog = document.querySelector("[data-battle-status-dialog]");
    var encounterDialog = document.querySelector("[data-battle-encounter-dialog]");
    var banner = document.querySelector("[data-battle-banner]");
    var resultModal = document.querySelector("[data-result-modal]");
    var eliminationModal = document.querySelector("[data-battle-elimination-modal]");
    var eliminationDialog = document.querySelector("[data-battle-elimination-dialog]");
    var eliminationRoot = document.querySelector("[data-elimination-log]");
    var tooltip = document.querySelector("[data-piece-tooltip]");
    var tooltipImg = document.querySelector("[data-tooltip-img]");
    var tooltipRank = document.querySelector("[data-tooltip-rank]");
    var tooltipSide = document.querySelector("[data-tooltip-side]");
    var tooltipStrength = document.querySelector("[data-tooltip-strength]");
    var tooltipAbbrev = document.querySelector("[data-tooltip-abbrev]");
    var tooltipFaction = document.querySelector("[data-tooltip-faction]");
    var tooltipStatus = document.querySelector("[data-tooltip-status]");

    var cfg = readConfig(manifest);
    var state = null;
    var busy = false;

    function animatePieceMove(fromX, fromY, toX, toY, isCapture, callback) {
      var fromCell = gridRoot.querySelector('[data-x="' + fromX + '"][data-y="' + fromY + '"]');
      var toCell = gridRoot.querySelector('[data-x="' + toX + '"][data-y="' + toY + '"]');
      if (!fromCell || !toCell) { callback(); return; }

      var fromPiece = fromCell.querySelector(".piece");
      if (!fromPiece) { callback(); return; }

      var fromRect = fromPiece.getBoundingClientRect();
      var toRect = toCell.getBoundingClientRect();

      var dx = toRect.left - fromRect.left;
      var dy = toRect.top - fromRect.top;

      if (Math.abs(dx) > Math.abs(dy)) {
        dy = 0;
      } else {
        dx = 0;
      }

      fromPiece.style.transition = "transform 0.38s cubic-bezier(0.25, 0.1, 0.25, 1)";
      fromPiece.style.transform = "translate(" + dx + "px, " + dy + "px)";
      fromPiece.style.zIndex = "40";

      if (isCapture) {
        var toPiece = toCell.querySelector(".piece");
        if (toPiece) {
          toPiece.style.transition = "opacity 0.22s ease";
          toPiece.style.opacity = "0.15";
        }
      }

      setTimeout(function () {
        fromPiece.style.transition = "";
        fromPiece.style.transform = "";
        fromPiece.style.zIndex = "";
        callback();
      }, 390);
    }

    function readPlayerPlacement() {
      try {
        var raw = localStorage.getItem("pagkamakabayanPlayerPlacement");
        if (!raw) return null;
        var arr = JSON.parse(raw);
        if (!Array.isArray(arr) || arr.length !== BOARD_SIZE) return null;
        for (var i = 0; i < arr.length; i++) {
          if (!Array.isArray(arr[i]) || arr[i].length !== BOARD_SIZE) return null;
        }
        return arr;
      } catch (error) {
        return null;
      }
    }

    function log(message, kind) {
      state.log.unshift({ message: message, kind: kind || "info" });
      if (state.log.length > 40) state.log.pop();
      renderLog();
    }

    function renderLog() {
      if (!logRoot) return;
      logRoot.innerHTML = state.log
        .map(function (entry) {
          return '<div class="battle-log__entry battle-log__entry--' + entry.kind + '">' + entry.message + "</div>";
        })
        .join("");
    }

    function renderEliminationLog() {
      if (!eliminationRoot) return;
      var playerEliminated = state.eliminated.filter(function (e) { return e.side === "player"; });
      var cpuEliminated = state.eliminated.filter(function (e) { return e.side === "cpu"; });

      function listEntries(entries, sideClass) {
        if (!entries.length) return '<p class="muted">No pieces eliminated yet.</p>';
        return entries.map(function (entry) {
          var label = entry.rankKey === "flag" && state.cfg.flagLabel
            ? state.cfg.flagLabel + " Flag"
            : entry.rank.label;
          var imgUrl = entry.charUrl || (entry.rankKey === "flag" ? state.cfg.flagUrl : "");
          return '<div class="elimination-entry elimination-entry--' + sideClass + '">' +
            '<span class="elimination-entry__turn">Turn ' + (entry.turn + 1) + "</span>" +
            (imgUrl ? '<div class="elimination-entry__art"><img src="' + imgUrl + '" alt="' + label + '"></div>' : '<div class="elimination-entry__art elimination-entry__art--placeholder">' + entry.rank.abbrev + '</div>') +
            '<span class="elimination-entry__rank">' + label + "</span>" +
            '<span class="elimination-entry__abbrev">' + entry.rank.abbrev + "</span>" +
            "</div>";
        }).join("");
      }

      eliminationRoot.innerHTML =
        '<div class="elimination-section">' +
        '<h4 class="elimination-section__title">Your Losses</h4>' +
        '<div class="elimination-grid">' + listEntries(playerEliminated, "player") + '</div>' +
        '</div>' +
        '<div class="elimination-section">' +
        '<h4 class="elimination-section__title">Enemy Losses</h4>' +
        '<div class="elimination-grid">' + listEntries(cpuEliminated, "cpu") + '</div>' +
        '</div>';
    }

    function renderStatus() {
      if (!statusRoot) return;
      var youTurn = state.turn === "player" && !state.finished;
      statusRoot.innerHTML =
        '<div class="status-pill ' + (youTurn ? "is-active" : "") + '">' +
        (state.finished ? "Battle resolved" : youTurn ? "Your move" : "Enemy is moving…") +
        "</div>" +
        '<div class="status-pill">CPU: ' + state.difficulty + "</div>";
      if (eyebrow) eyebrow.textContent = "Turn " + String(state.moveCount + 1).padStart(2, "0") + " · " + (youTurn ? "Your command" : "Enemy tempo");
      if (title) title.textContent = state.finished
        ? "Battle concluded."
        : youTurn
        ? "Select a piece, then a glowing tile."
        : "Awaiting the enemy's maneuver…";
    }

    function shownLabel(piece) {
      return piece.side === "cpu" ? "?" : piece.rank.abbrev;
    }

    function showChar(piece) {
      return piece.side === "player";
    }

    function render() {
      if (!state) return;
      if (tooltip) tooltip.hidden = true;
      var legalMap = {};
      if (state.selected) {
        legalMoves(state, state.selected.x, state.selected.y).forEach(function (move) {
          legalMap[move.x + "," + move.y] = move.capture ? "capture" : "move";
        });
      }

      var cells = "";
      for (var y = 0; y < BOARD_SIZE; y++) {
        for (var x = 0; x < BOARD_SIZE; x++) {
          var key = x + "," + y;
          var piece = state.board[y][x];
          var classes = "cell";
          if (state.selected && state.selected.x === x && state.selected.y === y) classes += " cell--selected";
          if (legalMap[key]) classes += legalMap[key] === "capture" ? " cell--capture" : " cell--move";

          var inner = "";
          if (piece && piece.alive) {
            var designLayer = cfg.designUrl
              ? '<div class="piece__design" style="background-image:url(\'' + cfg.designUrl + "')\"></div>"
              : "";
            var colorLayer = cfg.colorStyle
              ? cfg.colorIsHex
                ? '<div class="piece__color" style="background-color:' + cfg.colorStyle + '"></div>'
                : '<div class="piece__color" style="background-image:' + cfg.colorStyle + '"></div>'
              : "";
            var charLayer = showChar(piece)
              ? '<div class="piece__char"><img src="' + piece.charUrl + '" alt="' + piece.rank.label + '"></div>'
              : '<div class="piece__char piece__char--hidden"></div>';
            inner =
              '<div class="piece piece--' + piece.side + (piece.revealed ? " piece--revealed" : "") + '">' +
              designLayer +
              colorLayer +
              charLayer +
              '<span class="piece__label">' + shownLabel(piece) + "</span>" +
              "</div>";
          }

          cells +=
            '<button type="button" class="' + classes + '" data-x="' + x + '" data-y="' + y + '" aria-label="tile ' + (x + 1) + '-' + (y + 1) + '">' +
            inner +
            "</button>";
        }
      }
      gridRoot.innerHTML = cells;
      renderStatus();
    }

    function endTurn() {
      state.moveCount++;
      state.selected = null;
      render();
      if (state.finished) return;
      var next = state.turn;
      var moves = allLegalMoves(state, next);
      if (!moves.length) {
        endGame(next === "player" ? "cpu" : "player", "stalemate");
        return;
      }
      if (next === "cpu") {
        busy = true;
        setTimeout(cpuTurn, 620);
      }
    }

    function applyMove(from, to) {
      var att = state.board[from.y][from.x];
      var def = state.board[to.y][to.x];

      function resolveName(piece) {
        if (piece.rankKey === "flag" && state.cfg.flagLabel) return state.cfg.flagLabel + " Flag";
        return piece.rank.label;
      }

      if (!def) {
        state.board[to.y][to.x] = att;
        state.board[from.y][from.x] = null;
        log("A " + sideWord(att.side) + " " + att.rank.label + " advanced.", att.side === "player" ? "player" : "cpu");
      } else {
        att.revealed = true;
        def.revealed = true;
        var result = fight(att, def);
        var attName = resolveName(att);
        var defName = resolveName(def);
        if (result === "both") {
          att.alive = false;
          def.alive = false;
          state.board[from.y][from.x] = null;
          state.board[to.y][to.x] = null;
          state.eliminated.push({ side: att.side, rank: att.rank, rankKey: att.rankKey, charUrl: att.charUrl, turn: state.moveCount });
          state.eliminated.push({ side: def.side, rank: def.rank, rankKey: def.rankKey, charUrl: def.charUrl, turn: state.moveCount });
          log("Clash: " + attName + " and " + defName + " eliminated each other.", "combat");
        } else if (result === "defender") {
          def.alive = false;
          state.board[to.y][to.x] = att;
          state.board[from.y][from.x] = null;
          state.eliminated.push({ side: def.side, rank: def.rank, rankKey: def.rankKey, charUrl: def.charUrl, turn: state.moveCount });
          log("Challenge: " + attName + " eliminated the enemy " + defName + ".", att.side === "player" ? "win" : "loss");
        } else {
          att.alive = false;
          state.board[from.y][from.x] = null;
          state.eliminated.push({ side: att.side, rank: att.rank, rankKey: att.rankKey, charUrl: att.charUrl, turn: state.moveCount });
          log("Ambush: the enemy " + defName + " eliminated your " + attName + ".", att.side === "player" ? "loss" : "win");
        }

        if (def.rankKey === "flag") {
          endGame(att.side, "flag");
          return;
        }
        if (att.rankKey === "flag" && att.alive === false) {
          endGame(def.side, "flag");
          return;
        }
      }

      if (att.rankKey === "flag" && att.alive) {
        var enemyBack = att.side === "player" ? 0 : 8;
        if (to.y === enemyBack) {
          endGame(att.side, "reach");
          return;
        }
      }

      state.turn = state.turn === "player" ? "cpu" : "player";
      endTurn();
    }

    function sideWord(side) {
      return side === "player" ? "friendly" : "enemy";
    }

    function onCellClick(event) {
      if (!state || state.finished || busy || state.turn !== "player") return;
      var cell = event.target.closest("[data-x]");
      if (!cell) return;
      var x = Number(cell.dataset.x);
      var y = Number(cell.dataset.y);

      var piece = state.board[y][x];

      if (state.selected) {
        var isLegal = legalMoves(state, state.selected.x, state.selected.y).some(function (move) {
          return move.x === x && move.y === y;
        });
        if (isLegal) {
          var from = state.selected;
          var toPiece = state.board[y][x];
          state.selected = null;
          render();
          busy = true;
          animatePieceMove(from.x, from.y, x, y, !!toPiece, function () {
            applyMove(from, { x: x, y: y });
            busy = false;
          });
          return;
        }
      }

      if (piece && piece.alive && piece.side === "player") {
        state.selected = state.selected && state.selected.x === x && state.selected.y === y ? null : { x: x, y: y };
        render();
      } else {
        state.selected = null;
        render();
      }
    }

    function cpuTurn() {
      if (!state || state.finished) {
        busy = false;
        return;
      }
      var move = chooseCpuMove(state);
      if (!move) {
        endGame("player", "stalemate");
        return;
      }
      var def = state.board[move.to.y][move.to.x];
      animatePieceMove(move.from.x, move.from.y, move.to.x, move.to.y, !!def, function () {
        applyMove(move.from, move.to);
        busy = false;
      });
    }

    function chooseCpuMove(state) {
      var moves = allLegalMoves(state, "cpu");
      if (!moves.length) return null;
      var profile = DIFFICULTY_PROFILES[state.difficulty] || DIFFICULTY_PROFILES["Maurag po Ako"];

      var scored = moves.map(function (move) {
        var att = state.board[move.from.y][move.from.x];
        var score = 0;

        if (move.capture) {
          var def = state.board[move.to.y][move.to.x];
          if (def.revealed) {
            var r = fight(att, def);
            if (r === "defender") score += 100 + def.rank.strength;
            else if (r === "attacker") score -= 130;
            else score += 8;
          } else {
            score += 22;
          }
        }

        score += (move.to.y - move.from.y) * 1.2;
        if (att.rankKey === "flag") score += move.to.y * 5;

        if (profile.defends) {
          var danger = adjacentThreat(state, move.to.x, move.to.y, "player", att);
          if (danger) score -= 70;
          var flagPos = findFlag(state, "cpu");
          if (flagPos && move.from.x === flagPos.x && move.from.y === flagPos.y) {
            var flagDanger = adjacentThreat(state, move.to.x, move.to.y, "player", att, true);
            if (flagDanger) score -= 200;
          }
        }

        return { move: move, score: score };
      });

      scored.sort(function (a, b) { return b.score - a.score; });

      if (Math.random() < profile.randomness) {
        return scored[Math.floor(Math.random() * scored.length)].move;
      }
      return scored[0].move;
    }

    function adjacentThreat(state, x, y, enemySide, mover, onlyStronger) {
      for (var d = 0; d < DIRS.length; d++) {
        var nx = x + DIRS[d].dx;
        var ny = y + DIRS[d].dy;
        if (!inBounds(nx, ny)) continue;
        var p = state.board[ny][nx];
        if (!p || !p.alive || p.side !== enemySide) continue;
        if (!p.revealed) continue;
        if (onlyStronger) {
          if (fight(p, mover) === "attacker") return true;
        } else {
          if (fight(p, mover) !== "defender") return true;
        }
      }
      return false;
    }

    function endGame(winner, reason) {
      state.finished = true;
      state.winner = winner;
      state.reason = reason;
      if (winner === "player") {
        log("Victory! " + reasonText(reason, true), "win");
      } else {
        log("Defeat. " + reasonText(reason, false), "loss");
      }
      render();
      showResult(winner, reason);
    }

    function reasonText(reason, won) {
      if (reason === "flag") return won ? "You captured the enemy flag." : "Your flag was captured.";
      if (reason === "reach") return won ? "Your flag reached the enemy baseline." : "The enemy flag reached your baseline.";
      if (reason === "resign") return won ? "The enemy resigned." : "You resigned.";
      if (reason === "stalemate") return won ? "The enemy has no legal moves." : "You have no legal moves.";
      return won ? "The field is yours." : "The field is lost.";
    }

    function showResult(winner, reason) {
      if (!resultModal) return;
      var won = winner === "player";
      var emblem = resultModal.querySelector("[data-result-emblem]");
      var eyebrowEl = resultModal.querySelector("[data-result-eyebrow]");
      var titleEl = resultModal.querySelector("[data-result-title]");
      var bodyEl = resultModal.querySelector("[data-result-body]");
      var card = resultModal.querySelector("[data-result-card]");

      card.className = "result-modal__dialog " + (won ? "is-win" : "is-loss");
      if (emblem) emblem.textContent = won ? "★" : "✶";
      if (eyebrowEl) eyebrowEl.textContent = won ? "Campaign Victorious" : "Campaign Lost";
      if (titleEl) titleEl.textContent = won ? "You seized the field" : "Your command fell";
      if (bodyEl) {
        bodyEl.innerHTML =
          "<p>" + reasonText(reason, won) + "</p>" +
          '<p class="muted">Faction: ' + state.cfg.faction + " · CPU temper: " + state.difficulty + " · Turns: " + state.moveCount + "</p>";
      }
      resultModal.hidden = false;
      resultModal.offsetHeight;
      requestAnimationFrame(function () {
        resultModal.classList.add("is-open");
      });
    }

    function hideResult() {
      if (!resultModal) return;
      resultModal.classList.remove("is-open");
      setTimeout(function () { resultModal.hidden = true; }, 340);
    }

    function newGame() {
      hideResult();
      cfg = readConfig(manifest);
      var skinSwatch = document.querySelector("[data-board-skin-swatch]");
      function applyBoardDetection() {
        if (!skinSwatch || !cfg.boardUrl || !window.BoardTiles) {
          render();
          return;
        }
        window.BoardTiles.detect(cfg.boardUrl).then(function (layout) {
          var boardWrap = gridRoot.closest(".battle-board");
          if (boardWrap) {
            var inset = (layout.inset * 100).toFixed(2) + "%";
            boardWrap.style.setProperty("--board-inset", inset);
            boardWrap.style.setProperty("--grid-top", inset);
            boardWrap.style.setProperty("--grid-left", inset);
            boardWrap.style.setProperty("--grid-right", inset);
            boardWrap.style.setProperty("--grid-bottom", inset);
          }
          gridRoot.style.setProperty("--grid-cols", layout.cols);
          gridRoot.style.setProperty("--grid-rows", layout.rows);
          render();
        }).catch(function () {
          render();
        });
      }
      if (cfg.boardUrl && skinSwatch) {
        skinSwatch.src = cfg.boardUrl;
        if (skinSwatch.complete) {
          applyBoardDetection();
        } else {
          skinSwatch.onload = applyBoardDetection;
          skinSwatch.onerror = function () { render(); };
        }
      }

      if (banner) banner.hidden = true;

      try {
        var sw = JSON.parse(localStorage.getItem("pagkamakabayanStopwatch") || "{}");
        var boardWrap = gridRoot.closest(".battle-board");
        if (boardWrap) boardWrap.classList.toggle("battle-board--locked", !sw.running);
      } catch (e) {}

      var playerPlacement = readPlayerPlacement();
      localStorage.removeItem("pagkamakabayanPlayerPlacement");

      state = createGame(cfg, playerPlacement);

      log("New battle deployed. 21 pieces per side, flag hidden in the rear.", "info");
      renderStatus();
      render();
    }

      gridRoot.addEventListener("click", onCellClick);

      gridRoot.addEventListener("mouseover", function (e) {
        if (!tooltip || !state || state.finished || state.turn !== "player") return;
        var cell = e.target.closest("[data-x]");
        if (!cell) return;
        var x = Number(cell.dataset.x);
        var y = Number(cell.dataset.y);
        var piece = state.board[y][x];
        if (piece && piece.alive && piece.side === "player" && (!state.selected || state.selected.x !== x || state.selected.y !== y)) {
          tooltipImg.src = piece.charUrl;
          var rankLabel = piece.rankKey === "flag" && state.cfg.flagLabel
            ? state.cfg.flagLabel + " Flag"
            : piece.rank.label;
          tooltipRank.textContent = rankLabel;
          tooltipSide.textContent = "Friendly Unit";
          tooltipStrength.textContent = "Combat Strength: " + piece.rank.strength;
          tooltipAbbrev.textContent = "Rank Code: " + piece.rank.abbrev;
          tooltipFaction.textContent = "Faction: " + (state.cfg.faction || "archival");
          tooltipStatus.textContent = piece.revealed ? "Status: Revealed" : "Status: Hidden";
          tooltip.hidden = false;
          var rect = cell.getBoundingClientRect();
          tooltip.style.top = (rect.bottom + 15) + "px";
          tooltip.style.left = rect.left + "px";
        }
      });

      gridRoot.addEventListener("mouseout", function (e) {
        if (!tooltip) return;
        var cell = e.target.closest("[data-x]");
        if (!cell) return;
        tooltip.hidden = true;
      });

      document.addEventListener("stopwatch:change", function (e) {
        var boardWrap = gridRoot ? gridRoot.closest(".battle-board") : null;
        if (boardWrap) {
          boardWrap.classList.toggle("battle-board--locked", !e.detail.running);
        }
      });

      var diffText = document.querySelector("[data-battle-difficulty-text]");
      if (diffText) diffText.textContent = cfg.difficulty || "Maurag po Ako";

    if (newBtn) newBtn.addEventListener("click", newGame);
    if (resignBtn) resignBtn.addEventListener("click", function () {
      if (state && !state.finished) endGame("cpu", "resign");
    });

    function openSideModal(modalEl) {
      if (!modalEl) return;
      modalEl.hidden = false;
      modalEl.offsetHeight;
      requestAnimationFrame(function () {
        modalEl.classList.add("is-open");
      });
    }
    function closeSideModal(modalEl) {
      if (!modalEl) return;
      modalEl.classList.remove("is-open");
      setTimeout(function () { modalEl.hidden = true; }, 360);
    }

    if (statusModal) {
      var openStatusBtn = document.querySelector("[data-open-battle-status-modal]");
      if (openStatusBtn) openStatusBtn.addEventListener("click", function () { openSideModal(statusModal); });
      statusModal.querySelectorAll("[data-close-battle-status-modal]").forEach(function (el) {
        el.addEventListener("click", function () { closeSideModal(statusModal); });
      });
    }
    if (encounterModal) {
      var openEncounterBtn = document.querySelector("[data-open-battle-encounter-modal]");
      if (openEncounterBtn) openEncounterBtn.addEventListener("click", function () { openSideModal(encounterModal); });
      encounterModal.querySelectorAll("[data-close-battle-encounter-modal]").forEach(function (el) {
        el.addEventListener("click", function () { closeSideModal(encounterModal); });
      });
    }
    if (eliminationModal) {
      var openEliminationBtn = document.querySelector("[data-open-battle-elimination-modal]");
      if (openEliminationBtn) openEliminationBtn.addEventListener("click", function () {
        renderEliminationLog();
        openSideModal(eliminationModal);
      });
      eliminationModal.querySelectorAll("[data-close-battle-elimination-modal]").forEach(function (el) {
        el.addEventListener("click", function () { closeSideModal(eliminationModal); });
      });
    }

    if (resultModal) {
      resultModal.querySelectorAll("[data-result-close]").forEach(function (el) {
        el.addEventListener("click", hideResult);
      });
      var again = resultModal.querySelector("[data-result-again]");
      if (again) again.addEventListener("click", newGame);
    }

    newGame();
  }

  return { mount: mount, RANKS: RANKS };
})();
