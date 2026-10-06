const difficultyProfiles = {
  "Anak": {
    pressure: "Low pressure",
    tone: "Warm tutorial cadence",
    description: "Learns slowly, telegraphs intent, and gives space for new players to understand hidden-rank tempo.",
    doctrine: "Use this mode to study safe openings and basic bluff recognition."
  },
  "Mabalos / Salamat": {
    pressure: "Measured pressure",
    tone: "Polite but alert",
    description: "Punishes obvious patterns, values positioning, and rewards players who can maintain composure.",
    doctrine: "Ideal for intermediate practice and respectful escalation."
  },
  "Maurag po Ako": {
    pressure: "Assertive pressure",
    tone: "Confident tactical theater",
    description: "Bluffs often, probes weak lanes, and reshapes tempo with confident counterplay.",
    doctrine: "Best for players who want dramatic but readable mind games."
  },
  "Mahal ko ang Bayan": {
    pressure: "Elite pressure",
    tone: "Patriotic iron nerve",
    description: "Calculates sacrifice chains, protects long-term deception, and feels like a relentless command staff.",
    doctrine: "Built for experienced players who want minimal mercy and maximal adaptation."
  }
};

const battleFeedOptions = [
  "Scout line shifts left, forcing a private to reveal its patience.",
  "General shadow detected near midfield. Counter-probe recommended.",
  "Banner sweep intensifies the north corridor with comic-book tension.",
  "False retreat suspected. Preserve the spy until certainty improves.",
  "Rear guard pauses. Flag route remains plausible but not confirmed."
];

const STORAGE_KEY = "pagkamakabayanSetup";
const STOPWATCH_KEY = "pagkamakabayanStopwatch";

const setupCarouselDefinitions = [
  { key: "flag", category: "country-flags", emptyLabel: "No flags found yet." },
  { key: "fiveStarGeneral", category: "pieces/five-star-general", emptyLabel: "No Five-Star General pieces found yet." },
  { key: "fourStarGeneral", category: "pieces/four-star-general", emptyLabel: "No Four-Star General pieces found yet." },
  { key: "threeStarGeneral", category: "pieces/three-star-general", emptyLabel: "No Three-Star General pieces found yet." },
  { key: "twoStarGeneral", category: "pieces/two-star-general", emptyLabel: "No Two-Star General pieces found yet." },
  { key: "oneStarGeneral", category: "pieces/one-star-general", emptyLabel: "No One-Star General pieces found yet." },
  { key: "colonel", category: "pieces/colonel", emptyLabel: "No Colonel pieces found yet." },
  { key: "lieutenantColonel", category: "pieces/lieutenant-colonel", emptyLabel: "No Lieutenant Colonel pieces found yet." },
  { key: "major", category: "pieces/major", emptyLabel: "No Major pieces found yet." },
  { key: "captain", category: "pieces/captain", emptyLabel: "No Captain pieces found yet." },
  { key: "firstLieutenant", category: "pieces/first-lieutenant", emptyLabel: "No First Lieutenant pieces found yet." },
  { key: "secondLieutenant", category: "pieces/second-lieutenant", emptyLabel: "No Second Lieutenant pieces found yet." },
  { key: "sergeant", category: "pieces/sergeant", emptyLabel: "No Sergeant pieces found yet." },
  { key: "spy", category: "pieces/spy", emptyLabel: "No Spy pieces found yet." },
  { key: "private", category: "pieces/private", emptyLabel: "No Private pieces found yet." },
  { key: "pieceDesign", category: "piece-designs", emptyLabel: "No piece designs found yet." },
  { key: "pieceColor", category: "piece-colors", emptyLabel: "No piece color skins found yet." },
  { key: "board", category: "board-skins", emptyLabel: "No board skins found yet." }
];

const pieceCategoryKeys = setupCarouselDefinitions
  .filter((definition) => definition.category.startsWith("pieces/"))
  .map((definition) => definition.category);

document.addEventListener("DOMContentLoaded", async () => {
  const manifest = await window.siteAssets;
  setActiveNav();
  setupResponsiveNav();
  renderDifficultyGrids();
  populateAssetPreviews(manifest);
  initSetupPage(manifest);
  initBattlePage(manifest);
});

function setActiveNav() {
  const page = document.body.dataset.page;
  document.querySelectorAll("[data-nav-link]").forEach((link) => {
    const href = link.getAttribute("href") || "";
    const isActive =
      (page === "home" && href.endsWith("index.html")) ||
      href.includes(`${page}.html`);
    link.classList.toggle("is-active", isActive);
  });
}

function setupResponsiveNav() {
  const toggle = document.querySelector("[data-nav-toggle]");
  const nav = document.getElementById("site-nav");
  if (!toggle || !nav) return;

  toggle.addEventListener("click", () => {
    const nextState = !nav.classList.contains("is-open");
    nav.classList.toggle("is-open", nextState);
    toggle.setAttribute("aria-expanded", String(nextState));
  });
}

function renderDifficultyGrids() {
  document.querySelectorAll("[data-difficulty-grid]").forEach((grid) => {
    grid.innerHTML = Object.entries(difficultyProfiles)
      .map(([name, profile]) => `
        <article class="difficulty-card">
          <h4>${name}</h4>
          <p>${profile.description}</p>
          <span class="difficulty-meta">${profile.pressure} · ${profile.tone}</span>
        </article>
      `)
      .join("");
  });
}

function populateAssetPreviews(manifest) {
  const previewRoot = document.querySelector("[data-asset-preview]");
  if (!previewRoot) return;

  const categories = [
    "country-flags",
    ...pieceCategoryKeys,
    "piece-designs",
    "piece-colors",
    "board-skins",
    "portraits",
    "battlefx"
  ];

  previewRoot.innerHTML = categories
    .map((category) => {
      const asset = window.PagkamakabayanAssets.firstAsset(manifest, category);
      if (!asset) {
        return `
          <article class="asset-card">
            <div class="asset-card__meta">
              <strong>${window.PagkamakabayanAssets.normalizeName(category)}</strong>
              <span class="asset-card__tag">0 assets</span>
            </div>
            <div class="empty-state">Run refresh-assets.ps1 after dropping files into ./custom/${category}.</div>
          </article>
        `;
      }
      return createAssetCardMarkup(category, asset, manifest.counts?.[category] || 1);
    })
    .join("");
}

function createAssetCardMarkup(category, asset, count) {
  return `
    <article class="asset-card">
      <div class="asset-card__meta">
        <strong>${window.PagkamakabayanAssets.normalizeName(category)}</strong>
        <span class="asset-card__tag">${count} asset${count === 1 ? "" : "s"}</span>
      </div>
      <div class="asset-card__preview">
        <img src="${asset.url}" alt="${asset.label || asset.fileName}">
      </div>
      <p class="muted">${asset.label || window.PagkamakabayanAssets.normalizeName(asset.fileName)}</p>
    </article>
  `;
}

function initSetupPage(manifest) {
  const form = document.querySelector("[data-setup-form]");
  if (!form) return;

  const difficultySelect = document.querySelector("[data-difficulty-select]");
  const factionSelect = form.querySelector('[name="faction"]');
  const briefingButton = document.querySelector("[data-generate-briefing]");
  const randomDeployButton = document.querySelector("[data-random-deploy]");
  const summary = document.querySelector("[data-setup-summary]");
  const difficultyFocus = document.querySelector("[data-difficulty-focus]");
  const showcaseRoots = {
    flags: document.querySelector("[data-flag-showcase]"),
    ranks: document.querySelector("[data-rank-showcase]"),
    pieces: document.querySelector("[data-piece-showcase]"),
    boards: document.querySelector("[data-board-showcase]"),
    portraits: document.querySelector("[data-portrait-showcase]")
  };

  const savedSetup = readSavedSetup();
  if (savedSetup.difficulty && difficultyProfiles[savedSetup.difficulty]) {
    difficultySelect.value = savedSetup.difficulty;
  }
  if (savedSetup.faction && factionSelect.querySelector(`option[value="${savedSetup.faction}"]`)) {
    factionSelect.value = savedSetup.faction;
  }

  const carousels = {};
  setupCarouselDefinitions.forEach((definition) => {
    const root = document.querySelector(`[data-option-carousel="${definition.key}"]`);
    const hiddenInput = document.querySelector(`[data-option-input="${definition.key}"]`);

    if (definition.key === "pieceColor") {
      carousels[definition.key] = createColorPicker({
        root,
        hiddenInput,
        assets: manifest.assets?.[definition.category] || [],
        savedValue: savedSetup.pieceColor,
        emptyLabel: definition.emptyLabel,
        onChange: () => {
          syncSetup();
          renderSetupSummary(summary, form, difficultySelect, carousels);
        }
      });
    } else {
      carousels[definition.key] = createSetupCarousel({
        root,
        hiddenInput,
        assets: manifest.assets?.[definition.category] || [],
        savedValue: savedSetup[definition.key],
        emptyLabel: definition.emptyLabel,
        searchInput: definition.key === "flag" ? document.querySelector("[data-flag-search-input]") : null,
        searchCount: definition.key === "flag" ? document.querySelector("[data-flag-search-count]") : null,
        showDots: definition.key !== "flag",
        onChange: () => {
          syncSetup();
          renderSetupSummary(summary, form, difficultySelect, carousels);
        }
      });
    }
  });

  function syncSetup() {
    saveSetup(collectSetupState(form, difficultySelect, carousels));
  }

  renderDifficultyFocus(difficultyFocus, difficultySelect.value);
  renderAssetShowcase(showcaseRoots.flags, manifest.assets?.["country-flags"]);
  renderAssetShowcase(showcaseRoots.ranks, pieceCategoryKeys.flatMap((key) => manifest.assets?.[key] || []));
  renderCombinedShowcase(showcaseRoots.pieces, [
    ...(manifest.assets?.["piece-designs"] || []),
    ...pieceCategoryKeys.flatMap((key) => manifest.assets?.[key] || []),
    ...(manifest.assets?.["piece-colors"] || [])
  ]);
  renderAssetShowcase(showcaseRoots.boards, manifest.assets?.["board-skins"]);
  renderAssetShowcase(showcaseRoots.portraits, manifest.assets?.portraits);
  renderSetupSummary(summary, form, difficultySelect, carousels);
  syncSetup();

  difficultySelect.addEventListener("change", () => {
    renderDifficultyFocus(difficultyFocus, difficultySelect.value);
    syncSetup();
    renderSetupSummary(summary, form, difficultySelect, carousels);
  });

  factionSelect.addEventListener("change", () => {
    syncSetup();
    renderSetupSummary(summary, form, difficultySelect, carousels);
  });

  briefingButton?.addEventListener("click", () => {
    const setup = collectSetupState(form, difficultySelect, carousels);
    saveSetup(setup);
    localStorage.removeItem("pagkamakabayanPlayerPlacement");
    window.PagkamakabayanAudio.goTo("deploy.html");
  });

  randomDeployButton?.addEventListener("click", () => {
    const setup = collectSetupState(form, difficultySelect, carousels);
    saveSetup(setup);
    localStorage.removeItem("pagkamakabayanPlayerPlacement");
    window.PagkamakabayanAudio.goTo("battle.html");
  });
}

function createSetupCarousel({ root, hiddenInput, assets, savedValue, emptyLabel, onChange, searchInput, searchCount, showDots }) {
  const shouldShowDots = showDots !== false;
  const allAssets = [...(assets || [])];
  let currentAssets = [...allAssets];
  let currentIndex = Math.max(0, currentAssets.findIndex((asset) => asset.fileName === savedValue));
  if (currentIndex === -1) currentIndex = 0;

  if (!root || !hiddenInput) {
    return {
      getSelectedAsset: () => null,
      getSelectedLabel: () => "none selected",
      getSelectedValue: () => ""
    };
  }

  root.innerHTML = `
    <div class="visual-carousel" data-carousel-dropzone>
      <button class="visual-carousel__button" type="button" data-carousel-prev aria-label="Previous option">Previous</button>
      <div class="visual-carousel__viewport">
        <div class="visual-carousel__side visual-carousel__side--prev" data-carousel-prev-card></div>
        <div class="visual-carousel__main">
          <div class="visual-carousel__frame" data-carousel-main-card></div>
          <div class="visual-carousel__meta">
            <strong data-carousel-title></strong>
            <span data-carousel-count></span>
          </div>
          <div class="visual-carousel__dots" data-carousel-dots></div>
        </div>
        <div class="visual-carousel__side visual-carousel__side--next" data-carousel-next-card></div>
      </div>
      <button class="visual-carousel__button" type="button" data-carousel-next aria-label="Next option">Next</button>
    </div>
  `;

  const prevButton = root.querySelector("[data-carousel-prev]");
  const nextButton = root.querySelector("[data-carousel-next]");
  const prevCard = root.querySelector("[data-carousel-prev-card]");
  const nextCard = root.querySelector("[data-carousel-next-card]");
  const mainCard = root.querySelector("[data-carousel-main-card]");
  const title = root.querySelector("[data-carousel-title]");
  const count = root.querySelector("[data-carousel-count]");
  const dots = root.querySelector("[data-carousel-dots]");

  if (dots && !shouldShowDots) {
    dots.style.display = "none";
  }

  const render = () => {
    if (!currentAssets.length) {
      hiddenInput.value = "";
      title.textContent = "";
      count.textContent = `0 of ${allAssets.length}`;
      mainCard.innerHTML = `<div class="empty-state">${allAssets.length ? "No matches for your search. Clear the search to see every option." : `${emptyLabel} Drop images here or run refresh-assets.ps1.`}</div>`;
      prevCard.innerHTML = "";
      nextCard.innerHTML = "";
      dots.innerHTML = "";
      return;
    }

    const currentAsset = currentAssets[currentIndex];
    const previousAsset = currentAssets[(currentIndex - 1 + currentAssets.length) % currentAssets.length];
    const nextAsset = currentAssets[(currentIndex + 1) % currentAssets.length];

    hiddenInput.value = currentAsset.fileName;
    title.textContent = currentAsset.label || window.PagkamakabayanAssets.normalizeName(currentAsset.fileName);
    count.textContent = `${currentIndex + 1} of ${currentAssets.length}`;
    mainCard.innerHTML = renderCarouselCard(currentAsset, "Current");
    prevCard.innerHTML = renderCarouselCard(previousAsset, "Previous");
    nextCard.innerHTML = renderCarouselCard(nextAsset, "Next");
    if (shouldShowDots) {
      dots.innerHTML = currentAssets
        .map((asset, index) => `<button class="visual-carousel__dot${index === currentIndex ? " is-active" : ""}" type="button" data-carousel-dot="${index}" aria-label="${asset.label || asset.fileName}"></button>`)
        .join("");

      dots.querySelectorAll("[data-carousel-dot]").forEach((button) => {
        button.addEventListener("click", () => {
          currentIndex = Number(button.dataset.carouselDot);
          render();
          onChange?.();
        });
      });
    }
  };

  let isAnimating = false;

  const animateCarousel = (direction) => {
    if (isAnimating || !currentAssets.length) return;
    isAnimating = true;

    const exitClass = direction === "next" ? "visual-carousel__frame--exiting-left" : "visual-carousel__frame--exiting-right";
    const enterClass = direction === "next" ? "visual-carousel__frame--entering-right" : "visual-carousel__frame--entering-left";

    mainCard.classList.add(exitClass);

    setTimeout(() => {
      mainCard.classList.remove(exitClass);

      currentIndex = direction === "next"
        ? (currentIndex + 1) % currentAssets.length
        : (currentIndex - 1 + currentAssets.length) % currentAssets.length;

      render();
      onChange?.();

      requestAnimationFrame(() => {
        mainCard.classList.add(enterClass);
        setTimeout(() => {
          mainCard.classList.remove(enterClass);
          isAnimating = false;
        }, 340);
      });
    }, 280);
  };

  prevButton?.addEventListener("click", () => animateCarousel("prev"));

  nextButton?.addEventListener("click", () => animateCarousel("next"));

  const applyFilter = (query) => {
    const term = String(query || "").trim().toLowerCase();
    const beforeFileName = currentAssets[currentIndex]?.fileName || "";

    currentAssets = term
      ? allAssets.filter((asset) => {
          const label = String(asset.label || "").toLowerCase();
          const fileName = String(asset.fileName || "").toLowerCase();
          return label.includes(term) || fileName.includes(term);
        })
      : [...allAssets];

    currentIndex = currentAssets.findIndex((asset) => asset.fileName === beforeFileName);
    if (currentIndex === -1) currentIndex = 0;

    if (searchCount) {
      searchCount.textContent = term === "" ? "" : `${currentAssets.length} of ${allAssets.length}`;
    }

    render();

    const afterFileName = currentAssets[currentIndex]?.fileName || "";
    if (afterFileName !== beforeFileName) {
      onChange?.();
    }
  };

  searchInput?.addEventListener("input", () => applyFilter(searchInput.value));

  searchInput?.addEventListener("keydown", (event) => {
    if (event.key === "Enter") {
      event.preventDefault();
    }
  });

  render();

  return {
    getSelectedAsset: () => currentAssets[currentIndex] || null,
    getSelectedLabel: () => currentAssets[currentIndex]?.label || window.PagkamakabayanAssets.normalizeName(currentAssets[currentIndex]?.fileName || "none"),
    getSelectedValue: () => currentAssets[currentIndex]?.fileName || ""
  };
}

function createColorPicker({ root, hiddenInput, assets, savedValue, emptyLabel, onChange }) {
  const swatches = [...(assets || [])];
  const isHexColor = (value) => typeof value === "string" && value.startsWith("#");
  const selectedColor = isHexColor(savedValue) ? savedValue : null;
  const selectedFile = !isHexColor(savedValue) ? savedValue : null;
  let currentFileIndex = selectedFile
    ? Math.max(0, swatches.findIndex((asset) => asset.fileName === selectedFile))
    : -1;
  if (selectedFile && currentFileIndex === -1) currentFileIndex = 0;

  if (!root || !hiddenInput) {
    return {
      getSelectedAsset: () => swatches[currentFileIndex] || null,
      getSelectedLabel: () => selectedColor || swatches[currentFileIndex]?.label || "none",
      getSelectedValue: () => selectedColor || swatches[currentFileIndex]?.fileName || ""
    };
  }

  if (!swatches.length) {
    root.innerHTML = `
      <div class="color-picker-row">
        <label class="color-custom-label">Custom</label>
        <input type="color" value="${selectedColor || "#e9e1cd"}" data-color-picker-input>
        <span class="color-hex-value" data-color-hex-value>${selectedColor || "folder tint"}</span>
      </div>
    `;

    const colorInput = root.querySelector("[data-color-picker-input]");
    const hexValue = root.querySelector("[data-color-hex-value]");

    colorInput?.addEventListener("input", () => {
      selectedColor = colorInput.value;
      if (hexValue) hexValue.textContent = selectedColor;
      hiddenInput.value = selectedColor;
      onChange?.();
    });

    colorInput?.addEventListener("change", () => {
      selectedColor = colorInput.value;
      if (hexValue) hexValue.textContent = selectedColor;
      hiddenInput.value = selectedColor;
      onChange?.();
    });

    return {
      getSelectedAsset: () => null,
      getSelectedLabel: () => selectedColor || "no color selected",
      getSelectedValue: () => selectedColor || ""
    };
  }

  root.innerHTML = `
    <div class="color-picker-row">
      <label class="color-custom-label">Custom</label>
      <input type="color" value="${selectedColor || "#e9e1cd"}" data-color-picker-input>
      <span class="color-hex-value" data-color-hex-value>${selectedColor || "folder tint"}</span>
    </div>
    <div class="color-swatch-grid" data-color-swatch-grid></div>
  `;

  const swatchGrid = root.querySelector("[data-color-swatch-grid]");
  const colorInput = root.querySelector("[data-color-picker-input]");
  const hexValue = root.querySelector("[data-color-hex-value]");

  const renderSwatches = () => {
    if (!swatchGrid) return;

    if (selectedColor) {
      hiddenInput.value = selectedColor;
      swatchGrid.innerHTML = `
        <button class="color-swatch is-active" type="button" data-color-custom>
          <div class="piece-art piece-art--color" style="background-color:${selectedColor};"></div>
        </button>
      `;
      return;
    }

    swatchGrid.innerHTML = swatches
      .map((asset, index) => `
        <button class="color-swatch${index === currentFileIndex ? " is-active" : ""}" type="button" data-swatch-index="${index}" aria-label="${asset.label || asset.fileName}">
          <img src="${asset.url}" alt="${asset.label || asset.fileName}">
        </button>
      `)
      .join("");
  };

  swatchGrid?.addEventListener("click", (event) => {
    const swatch = event.target.closest("[data-swatch-index]");
    if (!swatch) return;
    currentFileIndex = Number(swatch.dataset.swatchIndex);
    selectedColor = null;
    if (colorInput) colorInput.value = "#e9e1cd";
    if (hexValue) hexValue.textContent = "folder tint";
    renderSwatches();
    onChange?.();
  });

  colorInput?.addEventListener("input", () => {
    selectedColor = colorInput.value;
    if (hexValue) hexValue.textContent = selectedColor;
    renderSwatches();
    onChange?.();
  });

  colorInput?.addEventListener("change", () => {
    selectedColor = colorInput.value;
    if (hexValue) hexValue.textContent = selectedColor;
    renderSwatches();
    onChange?.();
  });

  renderSwatches();

  return {
    getSelectedAsset: () => (selectedColor ? null : swatches[currentFileIndex]) || null,
    getSelectedLabel: () => selectedColor || swatches[currentFileIndex]?.label || window.PagkamakabayanAssets.normalizeName(swatches[currentFileIndex]?.fileName || "none"),
    getSelectedValue: () => selectedColor || swatches[currentFileIndex]?.fileName || ""
  };
}

function renderCarouselCard(asset, prefix) {
  if (!asset) {
    return `<div class="visual-carousel__card visual-carousel__card--empty"><span>No preview</span></div>`;
  }

  return `
    <div class="visual-carousel__card">
      <img src="${asset.url}" alt="${asset.label || asset.fileName}">
      <span class="visual-carousel__caption">${prefix}: ${asset.label || window.PagkamakabayanAssets.normalizeName(asset.fileName)}</span>
    </div>
  `;
}

function collectSetupState(form, difficultySelect, carousels) {
  const formData = new FormData(form);
  const carouselKeys = [
    "flag", "fiveStarGeneral", "fourStarGeneral", "threeStarGeneral", "twoStarGeneral",
    "oneStarGeneral", "colonel", "lieutenantColonel", "major", "captain",
    "firstLieutenant", "secondLieutenant", "sergeant", "spy", "private",
    "pieceDesign", "pieceColor", "board"
  ];
  return {
    faction: String(formData.get("faction") || ""),
    difficulty: difficultySelect.value,
    ...Object.fromEntries(carouselKeys.map((key) => [key, carousels[key]?.getSelectedValue() || ""]))
  };
}

function renderDifficultyFocus(root, key) {
  if (!root || !difficultyProfiles[key]) return;
  const profile = difficultyProfiles[key];
  root.innerHTML = `
    <span class="difficulty-focus__badge">${profile.pressure}</span>
    <strong>${key}</strong>
    <p>${profile.description}</p>
    <p class="muted">${profile.doctrine}</p>
  `;
}

function renderAssetShowcase(root, assets = []) {
  if (!root) return;
  if (!assets.length) {
    root.innerHTML = `<div class="empty-state">No assets loaded yet. Add files and run refresh-assets.ps1.</div>`;
    return;
  }

  root.innerHTML = assets
    .map((asset) => createAssetCardMarkup(asset.category, asset, assets.length))
    .join("");
}

function renderCombinedShowcase(root, assets = []) {
  if (!root) return;
  if (!assets.length) {
    root.innerHTML = `<div class="empty-state">No piece skins loaded yet. Add files and run refresh-assets.ps1.</div>`;
    return;
  }

  root.innerHTML = assets
    .map((asset) => createAssetCardMarkup(asset.category, asset, 1))
    .join("");
}

function renderSetupSummary(summary, form, difficultySelect, carousels, savedSetup = null) {
  if (!summary || !form) return;
  const setup = savedSetup || collectSetupState(form, difficultySelect, carousels);

  const rankNames = {
    fiveStarGeneral: "Five-Star General",
    fourStarGeneral: "Four-Star General",
    threeStarGeneral: "Three-Star General",
    twoStarGeneral: "Two-Star General",
    oneStarGeneral: "One-Star General",
    colonel: "Colonel",
    lieutenantColonel: "Lieutenant Colonel",
    major: "Major",
    captain: "Captain",
    firstLieutenant: "First Lieutenant",
    secondLieutenant: "Second Lieutenant",
    sergeant: "Sergeant",
    spy: "Spy",
    private: "Private"
  };

  const rankDetails = Object.entries(rankNames)
    .map(([key, label]) => `${label}: <strong>${carousels[key]?.getSelectedLabel() || "none"}</strong>`)
    .join(". ");

  summary.innerHTML = `
    <strong>${setup.faction || "archival"} doctrine engaged.</strong>
    <p>Difficulty: <strong>${difficultySelect.value}</strong>. Board: <strong>${carousels.board.getSelectedLabel()}</strong>. Flag: <strong>${carousels.flag.getSelectedLabel()}</strong>.</p>
    <p>${rankDetails}.</p>
    <p>Piece design: <strong>${carousels.pieceDesign.getSelectedLabel()}</strong>. Piece color: <strong>${carousels.pieceColor.getSelectedLabel()}</strong>.</p>
  `;
}

function initBattlePage(manifest) {
  const gridRoot = document.querySelector("[data-battle-grid]");
  if (!gridRoot) return;

  const focus = document.querySelector("[data-battle-difficulty-focus]");
  const select = document.querySelector("[data-battle-difficulty]");
  const feedRoot = document.querySelector("[data-feed-list]");
  const feedButton = document.querySelector("[data-battle-feed-btn]");
  const legendRoot = document.querySelector("[data-battle-legend]");
  const savedSetup = readSavedSetup();

  if (savedSetup.difficulty && difficultyProfiles[savedSetup.difficulty]) {
    if (select) select.value = savedSetup.difficulty;
    const diffText = document.querySelector("[data-battle-difficulty-text]");
    if (diffText) diffText.textContent = savedSetup.difficulty;
  }

  renderDifficultyFocus(focus, select ? select.value : (savedSetup.difficulty || ""));
  if (select) select.addEventListener("change", () => {
    renderDifficultyFocus(focus, select.value);
    saveSetup({ difficulty: select.value });
    const diffText = document.querySelector("[data-battle-difficulty-text]");
    if (diffText) diffText.textContent = select.value;
  });

  renderRankLegend(legendRoot);
  renderFeed(feedRoot);
  feedButton?.addEventListener("click", () => {
    renderFeed(feedRoot, true);
  });

  initStopwatch();

  if (window.PagkamakabayanBattle) {
    window.PagkamakabayanBattle.mount(manifest);
  }
}

function renderRankLegend(root) {
  if (!root) return;
  const order = [
    "fiveStarGeneral", "fourStarGeneral", "threeStarGeneral", "twoStarGeneral", "oneStarGeneral",
    "colonel", "lieutenantColonel", "major", "captain", "firstLieutenant", "secondLieutenant",
    "sergeant", "private", "spy", "flag"
  ];
  root.innerHTML = order
    .map((key) => {
      const def = window.PagkamakabayanBattle.RANKS[key];
      return `<li><span class="battle-legend__rank">${def.abbrev}</span> ${def.label} <em>×${def.count}</em></li>`;
    })
    .join("");
}

function initStopwatch() {
  const display = document.querySelector("[data-stopwatch-display]");
  const startButton = document.querySelector("[data-stopwatch-start]");
  const pauseButton = document.querySelector("[data-stopwatch-pause]");
  const resetButton = document.querySelector("[data-stopwatch-reset]");
  if (!display || !startButton || !pauseButton || !resetButton) return;

  const state = readStopwatchState();

  const render = () => {
    display.textContent = formatStopwatch(getLiveElapsed(state));
    startButton.disabled = state.running;
    pauseButton.disabled = !state.running;
    document.dispatchEvent(new CustomEvent("stopwatch:change", { detail: { running: state.running } }));
  };

  const tick = window.setInterval(() => {
    render();
    persistStopwatchState(state);
  }, 250);

  startButton.addEventListener("click", () => {
    if (state.running) return;
    state.running = true;
    state.startedAt = Date.now();
    persistStopwatchState(state);
    render();
  });

  pauseButton.addEventListener("click", () => {
    if (!state.running) return;
    state.elapsedMs = getLiveElapsed(state);
    state.running = false;
    state.startedAt = null;
    persistStopwatchState(state);
    render();
  });

  resetButton.addEventListener("click", () => {
    state.elapsedMs = 0;
    state.running = false;
    state.startedAt = null;
    persistStopwatchState(state);
    render();
  });

  window.addEventListener("beforeunload", () => {
    persistStopwatchState(state);
    window.clearInterval(tick);
  });

  if (!state.initialized) {
    state.running = true;
    state.startedAt = Date.now();
    state.initialized = true;
    persistStopwatchState(state);
  }

  render();
}

function getLiveElapsed(state) {
  if (!state.running || !state.startedAt) {
    return state.elapsedMs;
  }
  return state.elapsedMs + (Date.now() - state.startedAt);
}

function formatStopwatch(milliseconds) {
  const totalSeconds = Math.floor(milliseconds / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  if (hours > 0) {
    return [hours, minutes, seconds].map((value) => String(value).padStart(2, "0")).join(":");
  }

  return [minutes, seconds].map((value) => String(value).padStart(2, "0")).join(":");
}

function readStopwatchState() {
  try {
    const parsed = JSON.parse(localStorage.getItem(STOPWATCH_KEY) || "{}");
    return {
      elapsedMs: Number(parsed.elapsedMs) || 0,
      running: Boolean(parsed.running),
      startedAt: parsed.startedAt ? Number(parsed.startedAt) : null,
      initialized: Boolean(parsed.initialized)
    };
  } catch (error) {
    return {
      elapsedMs: 0,
      running: false,
      startedAt: null,
      initialized: false
    };
  }
}

function persistStopwatchState(state) {
  const liveState = {
    elapsedMs: state.running ? state.elapsedMs : getLiveElapsed(state),
    running: state.running,
    startedAt: state.running ? state.startedAt : null,
    initialized: true
  };
  localStorage.setItem(STOPWATCH_KEY, JSON.stringify(liveState));
}

function renderBattleGrid(root, selectedAssets) {
  const board = [
    ["FR", "", "", "", "WN", "", "", "", "HR"],
    ["", "", "SC", "", "", "", "RK", "", ""],
    ["", "", "", "", "", "", "", "", ""],
    ["", "", "", "SP", "", "", "", "", ""],
    ["", "", "", "", "??", "", "", "", ""],
    ["", "", "", "", "", "PV", "", "", ""],
    ["", "", "", "", "", "", "", "", ""],
    ["", "GN", "", "", "", "", "PT", "", ""],
    ["FL", "", "", "", "MV", "", "", "", "AL"]
  ];

  root.innerHTML = board
    .flatMap((row, y) =>
      row.map((token, x) => {
        const state = token
          ? y < 3
            ? "hostile"
            : y > 5
              ? "friendly"
              : "neutral"
          : "";

        if (!token) {
          return `<div class="cell" aria-label="cell ${x + 1}-${y + 1}"></div>`;
        }

        const designLayer = selectedAssets.pieceDesign
          ? `<div class="piece-art piece-art--design" style="background-image:url('${selectedAssets.pieceDesign.url}')"></div>`
          : "";
        const colorLayer = selectedAssets.pieceColor
          ? selectedAssets.pieceColor.startsWith("#")
            ? `<div class="piece-art piece-art--color piece-art--color--custom" style="background-color:${selectedAssets.pieceColor};"></div>`
            : `<div class="piece-art piece-art--color" style="background-image:url('${selectedAssets.pieceColor.url}')"></div>`
          : "";
        const rankLayer = "";
        const flagBadge = selectedAssets.flag
          ? `<div class="piece-badge"><img src="${selectedAssets.flag.url}" alt="${selectedAssets.flag.label || selectedAssets.flag.fileName}"></div>`
          : "";

        return `
          <div class="cell cell--${state}" aria-label="cell ${x + 1}-${y + 1}">
            <div class="piece-frame">
              ${designLayer}
              ${colorLayer}
              ${rankLayer}
              ${flagBadge}
              <span class="piece-label">${token}</span>
            </div>
          </div>
        `;
      })
    )
    .join("");
}

function resolveSelectedAsset(manifest, category, fileName = "") {
  const assets = manifest?.assets?.[category] || [];
  if (!assets.length) return null;
  return assets.find((asset) => asset.fileName === fileName) || assets[0];
}

function readSavedSetup() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}");
  } catch (error) {
    return {};
  }
}

function saveSetup(payload) {
  const nextValue = { ...readSavedSetup(), ...payload };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(nextValue));
}

function renderFeed(root, shuffle = false) {
  if (!root) return;
  const feed = shuffle
    ? [...battleFeedOptions].sort(() => Math.random() - 0.5).slice(0, 4)
    : battleFeedOptions.slice(0, 4);

  root.innerHTML = feed
    .map((item, index) => `
      <article class="feed-entry">
        <strong>Dispatch ${index + 1}</strong>
        <span>${item}</span>
      </article>
    `)
    .join("");
}

/* ==========================================================================
   Audio: looping background music + navigate / place / capture effects.
   Files: ./assets/audio/{background,navigate,place,capture}.mp3
   The site is multi-page, so the music position is saved and resumed on the
   next page to keep it continuous between screens.
   ========================================================================== */
(function () {
  "use strict";

  var BASE = "./assets/audio/";
  var SETTINGS_KEY = "pagkamakabayanAudio";
  var POS_KEY = "pagkamakabayanMusicPos";
  var NAV_DELAY_MS = 170; // lets the click sound be heard before a page change
  var POOL_SIZE = 4;

  function readJson(key) {
    try { return JSON.parse(localStorage.getItem(key) || "null"); } catch (e) { return null; }
  }
  function writeJson(key, value) {
    try { localStorage.setItem(key, JSON.stringify(value)); } catch (e) { /* ignore */ }
  }

  var saved = readJson(SETTINGS_KEY) || {};
  var settings = {
    musicOn: saved.musicOn !== false,
    sfxOn: saved.sfxOn !== false,
    musicVol: typeof saved.musicVol === "number" ? saved.musicVol : 0.5,
    sfxVol: typeof saved.sfxVol === "number" ? saved.sfxVol : 0.8
  };
  function persist() { writeJson(SETTINGS_KEY, settings); }

  // ---- music --------------------------------------------------------------
  var music = new Audio(BASE + "background.mp3");
  music.loop = true;
  music.preload = "auto";
  music.volume = settings.musicVol;

  var lastSave = 0;
  function savePosition() {
    if (!isFinite(music.currentTime) || music.currentTime <= 0) return;
    writeJson(POS_KEY, { t: music.currentTime, at: Date.now() });
  }

  var seeked = false;
  function seekToSaved() {
    if (seeked || !isFinite(music.duration) || music.duration <= 0) return;
    seeked = true;
    var pos = readJson(POS_KEY);
    // only resume when we arrived from another page of the site a moment ago
    if (pos && typeof pos.t === "number" && Date.now() - pos.at < 15000) {
      var elapsed = Math.max(0, (Date.now() - pos.at) / 1000);
      try { music.currentTime = (pos.t + elapsed) % music.duration; } catch (e) { /* ignore */ }
    }
  }

  var gestureArmed = false;
  function armGesture() {
    if (gestureArmed) return;
    gestureArmed = true;
    var events = ["pointerdown", "keydown", "touchstart"];
    var handler = function () {
      events.forEach(function (n) { document.removeEventListener(n, handler, true); });
      gestureArmed = false;
      startMusic();
    };
    events.forEach(function (n) { document.addEventListener(n, handler, true); });
  }

  function startMusic() {
    if (!settings.musicOn || document.hidden) return;
    var p = music.play();
    if (p && typeof p.catch === "function") {
      p.catch(function () { armGesture(); }); // autoplay blocked: wait for first click/key
    }
  }

  // Browsers may block autoplay; have a user-gesture retry ready before it is attempted.
  armGesture();

  function stopMusic() {
    savePosition();
    music.pause();
  }

  music.addEventListener("loadedmetadata", function () {
    seekToSaved();
    startMusic();
  });
  music.addEventListener("timeupdate", function () {
    var now = Date.now();
    if (now - lastSave > 500) { lastSave = now; savePosition(); }
  });
  if (music.readyState >= 1) { seekToSaved(); startMusic(); }

  document.addEventListener("visibilitychange", function () {
    if (document.hidden) stopMusic(); else startMusic();
  });
  window.addEventListener("pagehide", savePosition);
  window.addEventListener("beforeunload", savePosition);

  // ---- sound effects -----------------------------------------------------
  var pools = {};
  var cursor = {};
  ["navigate", "place", "capture"].forEach(function (name) {
    pools[name] = [];
    cursor[name] = 0;
    for (var i = 0; i < POOL_SIZE; i++) {
      var a = new Audio(BASE + name + ".mp3");
      a.preload = "auto";
      pools[name].push(a);
    }
  });

  function playSfx(name) {
    if (!settings.sfxOn || settings.sfxVol <= 0) return;
    var pool = pools[name];
    var a = pool[cursor[name]];
    cursor[name] = (cursor[name] + 1) % pool.length;
    try {
      a.volume = settings.sfxVol;
      a.currentTime = 0;
      var p = a.play();
      if (p && typeof p.catch === "function") p.catch(function () { /* blocked until a gesture */ });
    } catch (e) { /* ignore */ }
  }

  var lastNavigate = 0;
  function navigate() {
    var now = Date.now();
    if (now - lastNavigate < 90) return; // merge a button + its handler into one sound
    lastNavigate = now;
    playSfx("navigate");
  }

  function goTo(url) {
    var delay = settings.sfxOn ? NAV_DELAY_MS : 0;
    setTimeout(function () { window.location.href = url; }, delay);
  }

  // Every click on a link / button / summary / swatch plays "navigate" (never hover).
  // Board tiles are excluded: deploy.js / battle-engine.js decide their sound.
  var CLICKABLE = 'a[href], button, summary, [role="button"], [data-swatch-index], label[for], input[type="checkbox"], input[type="radio"]';
  document.addEventListener("click", function (e) {
    var t = e.target;
    if (!t || !t.closest) return;
    var el = t.closest(CLICKABLE);
    if (!el || el.disabled) return;
    if (el.closest(".cell") || el.hasAttribute("data-audio-silent")) return;
    navigate();

    if (el.tagName === "A" && settings.sfxOn) {
      var href = el.getAttribute("href");
      if (!href || href.charAt(0) === "#" || el.target === "_blank" || el.hasAttribute("download")) return;
      if (e.button !== 0 || e.ctrlKey || e.metaKey || e.shiftKey || e.altKey) return;
      var url;
      try { url = new URL(el.href, window.location.href); } catch (err) { return; }
      if (url.protocol !== window.location.protocol || url.host !== window.location.host) return;
      e.preventDefault();
      goTo(url.href);
    }
  }, true);

  // ---- settings controls (Asset Customization page) -------------------------
  function refreshControls() {
    document.querySelectorAll("[data-audio-toggle]").forEach(function (btn) {
      var kind = btn.dataset.audioToggle;
      var on = kind === "music" ? settings.musicOn : settings.sfxOn;
      btn.textContent = (kind === "music" ? "Music" : "Effects") + ": " + (on ? "On" : "Muted");
      btn.setAttribute("aria-pressed", String(on));
    });
    document.querySelectorAll("[data-audio-volume]").forEach(function (input) {
      var kind = input.dataset.audioVolume;
      var vol = kind === "music" ? settings.musicVol : settings.sfxVol;
      input.value = String(Math.round(vol * 100));
      var out = document.querySelector('[data-audio-output="' + kind + '"]');
      if (out) out.textContent = Math.round(vol * 100) + "%";
    });
  }

  function setMusicOn(on) {
    settings.musicOn = !!on;
    persist();
    if (settings.musicOn) startMusic(); else stopMusic();
    refreshControls();
  }
  function setSfxOn(on) { settings.sfxOn = !!on; persist(); refreshControls(); }
  function setMusicVolume(v) {
    settings.musicVol = Math.min(1, Math.max(0, v));
    music.volume = settings.musicVol;
    persist();
    refreshControls();
  }
  function setSfxVolume(v) {
    settings.sfxVol = Math.min(1, Math.max(0, v));
    persist();
    refreshControls();
  }

  function bindControls() {
    document.querySelectorAll("[data-audio-enable]").forEach(function (btn) {
      btn.addEventListener("click", function () {
        if (!settings.musicOn) setMusicOn(true);
        else startMusic();
        if (!settings.sfxOn) setSfxOn(true);
      });
    });
    document.querySelectorAll("[data-audio-toggle]").forEach(function (btn) {
      btn.addEventListener("click", function () {
        if (btn.dataset.audioToggle === "music") setMusicOn(!settings.musicOn);
        else setSfxOn(!settings.sfxOn);
      });
    });
    document.querySelectorAll("[data-audio-volume]").forEach(function (input) {
      var kind = input.dataset.audioVolume;
      input.addEventListener("input", function () {
        var v = Number(input.value) / 100;
        if (kind === "music") setMusicVolume(v); else setSfxVolume(v);
      });
      if (kind === "sfx") {
        input.addEventListener("change", function () { playSfx("place"); }); // preview
      }
    });
    refreshControls();
  }
  bindControls();

  window.PagkamakabayanAudio = {
    navigate: navigate,
    place: function () { playSfx("place"); },
    capture: function () { playSfx("capture"); },
    goTo: goTo,
    setMusicOn: setMusicOn,
    setSfxOn: setSfxOn,
    setMusicVolume: setMusicVolume,
    setSfxVolume: setSfxVolume
  };
})();
