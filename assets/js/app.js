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
    renderSetupSummary(summary, form, difficultySelect, carousels, setup);
  });
}

function createSetupCarousel({ root, hiddenInput, assets, savedValue, emptyLabel, onChange }) {
  let currentAssets = [...(assets || [])];
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

  const render = () => {
    if (!currentAssets.length) {
      hiddenInput.value = "";
      title.textContent = "";
      count.textContent = "0 of 0";
      mainCard.innerHTML = `<div class="empty-state">${emptyLabel} Drop images here or run refresh-assets.ps1.</div>`;
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
    dots.innerHTML = currentAssets
      .map((asset, index) => `<button class="visual-carousel__dot${index === currentIndex ? " is-active" : ""}" type="button" data-carousel-dot="${index}" aria-label="Select ${asset.label || asset.fileName}"></button>`)
      .join("");

    dots.querySelectorAll("[data-carousel-dot]").forEach((button) => {
      button.addEventListener("click", () => {
        currentIndex = Number(button.dataset.carouselDot);
        render();
        onChange?.();
      });
    });
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
      <div class="visual-carousel">
        <div class="visual-carousel__viewport">
          <div class="visual-carousel__main">
            <div class="empty-state">${emptyLabel}</div>
          </div>
        </div>
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
    <div class="visual-carousel">
      <button class="visual-carousel__button" type="button" data-color-prev aria-label="Previous color">Previous</button>
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
      <button class="visual-carousel__button" type="button" data-color-next aria-label="Next color">Next</button>
    </div>
  `;

  const prevButton = root.querySelector("[data-color-prev]");
  const nextButton = root.querySelector("[data-color-next]");
  const prevCard = root.querySelector("[data-carousel-prev-card]");
  const nextCard = root.querySelector("[data-carousel-next-card]");
  const mainCard = root.querySelector("[data-carousel-main-card]");
  const title = root.querySelector("[data-carousel-title]");
  const count = root.querySelector("[data-carousel-count]");
  const dots = root.querySelector("[data-carousel-dots]");
  const colorInput = root.querySelector("[data-color-picker-input]");
  const hexValue = root.querySelector("[data-color-hex-value]");

  dots?.addEventListener("click", (event) => {
    const dot = event.target.closest("[data-carousel-dot]");
    if (!dot) return;
    currentFileIndex = Number(dot.dataset.carouselDot);
    selectedColor = null;
    if (colorInput) colorInput.value = "#e9e1cd";
    if (hexValue) hexValue.textContent = "folder tint";
    render();
    onChange?.();
  });

  const render = () => {
    if (selectedColor) {
      hiddenInput.value = selectedColor;
      title.textContent = `Custom ${selectedColor}`;
      count.textContent = "1 of 1";
      mainCard.innerHTML = `
        <div class="visual-carousel__card">
          <div class="piece-art piece-art--color" style="background-color:${selectedColor};"></div>
          <span class="visual-carousel__caption">Custom tone</span>
        </div>
      `;
      prevCard.innerHTML = `<div class="visual-carousel__card visual-carousel__card--empty"><span>Custom</span></div>`;
      nextCard.innerHTML = `<div class="visual-carousel__card visual-carousel__card--empty"><span>Custom</span></div>`;
      dots.innerHTML = swatches
        .map((asset, index) => `<button class="visual-carousel__dot" type="button" data-carousel-dot="${index}" aria-label="Select ${asset.label || asset.fileName}"></button>`)
        .join("");
      return;
    }

    const currentAsset = swatches[currentFileIndex];
    const previousAsset = swatches[(currentFileIndex - 1 + swatches.length) % swatches.length];
    const nextAsset = swatches[(currentFileIndex + 1) % swatches.length];

    hiddenInput.value = currentAsset.fileName;
    title.textContent = currentAsset.label || window.PagkamakabayanAssets.normalizeName(currentAsset.fileName);
    count.textContent = `${currentFileIndex + 1} of ${swatches.length}`;
    mainCard.innerHTML = renderCarouselCard(currentAsset, "Current");
    prevCard.innerHTML = renderCarouselCard(previousAsset, "Previous");
    nextCard.innerHTML = renderCarouselCard(nextAsset, "Next");
    dots.innerHTML = swatches
      .map((asset, index) => `<button class="visual-carousel__dot${index === currentFileIndex ? " is-active" : ""}" type="button" data-carousel-dot="${index}" aria-label="Select ${asset.label || asset.fileName}"></button>`)
      .join("");
  };

  const clearCustomColor = () => {
    if (selectedColor) {
      currentFileIndex = 0;
    }
    selectedColor = null;
    if (colorInput) colorInput.value = "#e9e1cd";
    if (hexValue) hexValue.textContent = "folder tint";
  };

  let isAnimating = false;

  const animateColorCarousel = (direction) => {
    if (isAnimating) return;
    isAnimating = true;

    const exitClass = direction === "next" ? "visual-carousel__frame--exiting-left" : "visual-carousel__frame--exiting-right";
    const enterClass = direction === "next" ? "visual-carousel__frame--entering-right" : "visual-carousel__frame--entering-left";

    mainCard.classList.add(exitClass);

    setTimeout(() => {
      mainCard.classList.remove(exitClass);

      clearCustomColor();
      if (swatches.length) {
        currentFileIndex = direction === "next"
          ? (currentFileIndex + 1) % swatches.length
          : (currentFileIndex - 1 + swatches.length) % swatches.length;
      }

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

  prevButton?.addEventListener("click", () => animateColorCarousel("prev"));

  nextButton?.addEventListener("click", () => animateColorCarousel("next"));

  colorInput?.addEventListener("input", () => {
    selectedColor = colorInput.value;
    if (hexValue) hexValue.textContent = selectedColor;
    render();
    onChange?.();
  });

  colorInput?.addEventListener("change", () => {
    selectedColor = colorInput.value;
    if (hexValue) hexValue.textContent = selectedColor;
    render();
    onChange?.();
  });

  render();

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
  const feedButton = document.querySelector("[data-randomize-feed]");
  const legendRoot = document.querySelector("[data-battle-legend]");
  const savedSetup = readSavedSetup();

  if (savedSetup.difficulty && difficultyProfiles[savedSetup.difficulty]) {
    select.value = savedSetup.difficulty;
  }

  renderDifficultyFocus(focus, select.value);
  select.addEventListener("change", () => {
    renderDifficultyFocus(focus, select.value);
    saveSetup({ difficulty: select.value });
  });

  renderRankLegend(legendRoot);
  renderFeed(feedRoot);
  feedButton?.addEventListener("click", () => renderFeed(feedRoot, true));

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
