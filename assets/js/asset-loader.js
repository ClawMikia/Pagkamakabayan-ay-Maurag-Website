(function () {
  const manifestPath = "./assets/data/assets-manifest.json";

  const fallbackManifest = {
    generatedAt: "fallback",
    counts: {},
    assets: {
      "country-flags": [],
      "piece-designs": [],
      "piece-colors": [],
      portraits: [],
      banners: [],
      "board-skins": [],
      "ui-icons": [],
      battlefx: []
    }
  };

  async function loadManifest() {
    if (window.PagkamakabayanAssetManifest) {
      return { ...fallbackManifest, ...window.PagkamakabayanAssetManifest };
    }

    try {
      const response = await fetch(manifestPath, { cache: "no-store" });
      if (!response.ok) {
        throw new Error(`Manifest request failed with ${response.status}`);
      }
      const data = await response.json();
      return { ...fallbackManifest, ...data };
    } catch (error) {
      console.warn("Asset manifest fallback active.", error);
      return fallbackManifest;
    }
  }

  function firstAsset(manifest, category) {
    const list = manifest?.assets?.[category] || [];
    return list[0] || null;
  }

  function normalizeName(fileName) {
    return fileName
      .replace(/\.[^/.]+$/, "")
      .replace(/[-_]+/g, " ")
      .replace(/\b\w/g, (letter) => letter.toUpperCase());
  }

  window.PagkamakabayanAssets = {
    loadManifest,
    firstAsset,
    normalizeName
  };

  window.siteAssets = loadManifest();
})();
