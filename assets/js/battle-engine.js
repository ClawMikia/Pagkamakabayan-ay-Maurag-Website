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

  function createGame(cfg) {
    var board = [];
    for (var y = 0; y < BOARD_SIZE; y++) {
      board.push(new Array(BOARD_SIZE).fill(null));
    }
    var colored = {};
    for (var i = 0; i < BOARD_SIZE; i++) colored[i + "," + i] = true;

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

    function place(side) {
      var homeRows = side === "player" ? [6, 7, 8] : [0, 1, 2];
      var backRow = side === "player" ? 8 : 0;
      var cells = [];
      homeRows.forEach(function (row) {
        for (var col = 0; col < BOARD_SIZE; col++) {
          if (!colored[col + "," + row]) cells.push({ x: col, y: row });
        }
      });
      shuffle(cells);

      var list = [];
      Object.keys(RANKS).forEach(function (key) {
        for (var n = 0; n < RANKS[key].count; n++) list.push(key);
      });

      var flagIndex = cells.findIndex(function (cell) { return cell.y === backRow; });
      var flagCell = cells.splice(flagIndex, 1)[0];
      board[flagCell.y][flagCell.x] = makePiece(side, "flag");

      list.filter(function (key) { return key !== "flag"; }).forEach(function (key, idx) {
        var cell = cells[idx];
        board[cell.y][cell.x] = makePiece(side, key);
      });
    }

    place("player");
    place("cpu");

    return {
      board: board,
      colored: colored,
      turn: "player",
      selected: null,
      finished: false,
      winner: null,
      reason: "",
      difficulty: cfg.difficulty,
      moveCount: 0,
      log: [],
      cfg: cfg
    };
  }

  function inBounds(x, y) {
    return x >= 0 && y >= 0 && x < BOARD_SIZE && y < BOARD_SIZE;
  }

  function isColored(state, x, y) {
    return !!state.colored[x + "," + y];
  }

  function legalMoves(state, x, y) {
    var piece = state.board[y][x];
    if (!piece || !piece.alive) return [];
    var moves = [];
    DIRS.forEach(function (dir) {
      var nx = x + dir.dx;
      var ny = y + dir.dy;
      if (!inBounds(nx, ny) || isColored(state, nx, ny)) return;
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
    var newBtn = document.querySelector("[data-new-battle]");
    var resignBtn = document.querySelector("[data-resign]");
    var banner = document.querySelector("[data-battle-banner]");
    var modal = document.querySelector("[data-result-modal]");

    var cfg = readConfig(manifest);
    var state = null;
    var busy = false;

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
      return piece.rank.abbrev;
    }

    function showChar(piece) {
      return true;
    }

    function render() {
      if (!state) return;
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
          if (isColored(state, x, y)) {
            cells += '<div class="cell cell--blocked" aria-label="blocked tile"><span class="cell__blocked-mark"></span></div>';
            continue;
          }
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
            var badge = cfg.flagUrl
              ? '<div class="piece__badge"><img src="' + cfg.flagUrl + '" alt="flag"></div>'
              : "";
            inner =
              '<div class="piece piece--' + piece.side + (piece.revealed ? " piece--revealed" : "") + '">' +
              designLayer +
              colorLayer +
              charLayer +
              badge +
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

      if (!def) {
        state.board[to.y][to.x] = att;
        state.board[from.y][from.x] = null;
        log("A " + sideWord(att.side) + " " + att.rank.label + " advanced.", att.side === "player" ? "player" : "cpu");
      } else {
        att.revealed = true;
        def.revealed = true;
        var result = fight(att, def);
        var attName = att.rank.label;
        var defName = def.rank.label;
        if (result === "both") {
          att.alive = false;
          def.alive = false;
          state.board[from.y][from.x] = null;
          state.board[to.y][to.x] = null;
          log("Clash: " + attName + " and " + defName + " eliminated each other.", "combat");
        } else if (result === "defender") {
          def.alive = false;
          state.board[to.y][to.x] = att;
          state.board[from.y][from.x] = null;
          log("Challenge: " + attName + " eliminated the enemy " + defName + ".", att.side === "player" ? "win" : "loss");
        } else {
          att.alive = false;
          state.board[from.y][from.x] = null;
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
      if (isColored(state, x, y)) return;

      var piece = state.board[y][x];

      if (state.selected) {
        var isLegal = legalMoves(state, state.selected.x, state.selected.y).some(function (move) {
          return move.x === x && move.y === y;
        });
        if (isLegal) {
          var from = state.selected;
          state.selected = null;
          applyMove(from, { x: x, y: y });
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
      busy = false;
      if (!move) {
        endGame("player", "stalemate");
        return;
      }
      applyMove(move.from, move.to);
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
      if (!modal) return;
      var won = winner === "player";
      var emblem = modal.querySelector("[data-result-emblem]");
      var eyebrowEl = modal.querySelector("[data-result-eyebrow]");
      var titleEl = modal.querySelector("[data-result-title]");
      var bodyEl = modal.querySelector("[data-result-body]");
      var card = modal.querySelector("[data-result-card]");

      card.className = "result-modal__dialog " + (won ? "is-win" : "is-loss");
      if (emblem) emblem.textContent = won ? "★" : "✶";
      if (eyebrowEl) eyebrowEl.textContent = won ? "Campaign Victorious" : "Campaign Lost";
      if (titleEl) titleEl.textContent = won ? "You seized the field" : "Your command fell";
      if (bodyEl) {
        bodyEl.innerHTML =
          "<p>" + reasonText(reason, won) + "</p>" +
          '<p class="muted">Faction: ' + state.cfg.faction + " · CPU temper: " + state.difficulty + " · Turns: " + state.moveCount + "</p>";
      }
      modal.hidden = false;
      requestAnimationFrame(function () {
        modal.classList.add("is-open");
      });
    }

    function hideResult() {
      if (!modal) return;
      modal.classList.remove("is-open");
      setTimeout(function () { modal.hidden = true; }, 320);
    }

    function newGame() {
      hideResult();
      cfg = readConfig(manifest);
      if (cfg.boardUrl && skinSwatch) {
        skinSwatch.style.backgroundImage = "url('" + cfg.boardUrl + "')";
      }
      if (banner) banner.hidden = true;

      state = createGame(cfg);

      if (window.BoardTiles && cfg.boardUrl) {
        window.BoardTiles.detect(cfg.boardUrl).then(function (layout) {
          var boardWrap = gridRoot.closest(".battle-board");
          if (boardWrap) {
            boardWrap.style.setProperty("--board-inset", (layout.inset * 100).toFixed(2) + "%");
          }
          gridRoot.style.setProperty("--grid-cols", layout.cols);
          render();
        });
      } else {
        render();
      }

      log("New battle deployed. 21 pieces per side, flag hidden in the rear.", "info");
      renderStatus();
    }

      gridRoot.addEventListener("click", onCellClick);

      var diffSelect = document.querySelector("[data-battle-difficulty]");
      if (diffSelect) diffSelect.addEventListener("change", function () {
        if (state) {
          state.difficulty = diffSelect.value;
          renderStatus();
        }
      });

    if (newBtn) newBtn.addEventListener("click", newGame);
    if (resignBtn) resignBtn.addEventListener("click", function () {
      if (state && !state.finished) endGame("cpu", "resign");
    });
    if (modal) {
      modal.querySelectorAll("[data-result-close]").forEach(function (el) {
        el.addEventListener("click", hideResult);
      });
      var again = modal.querySelector("[data-result-again]");
      if (again) again.addEventListener("click", newGame);
    }

    newGame();
  }

  return { mount: mount, RANKS: RANKS };
})();
