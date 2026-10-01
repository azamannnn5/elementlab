document.addEventListener("DOMContentLoaded", () => {
  const grid = document.getElementById("shop-grid");
  const bar = document.getElementById("filter-bar");
  const banner = document.getElementById("cat-banner");
  const sortSelect = document.getElementById("sort-select");
  const resultsCount = document.getElementById("results-count");
  const titleEl = document.getElementById("shop-title");
  const subtitleEl = document.getElementById("shop-subtitle");
  const params = new URLSearchParams(window.location.search);
  let activeCat = params.get("cat") || "all";
  let sortBy = "default";

  function skuCount() {
    return PRODUCTS.reduce((n, p) => n + p.doses.length, 0);
  }
  function doseSummary(p) {
    const labels = p.doses.map((d) => d.label);
    return labels.length > 3 ? `${labels[0]} - ${labels[labels.length - 1]}` : labels.join(" / ");
  }

  function pillHtml(slug, label) {
    return `<button class="filter-pill ${activeCat === slug ? "active" : ""}" data-cat="${slug}">${label}</button>`;
  }

  // "peptides" is a group filter: every category except Laboratory Supplies and Supplements.
  const LAB_SUPPLIES = "mixing";
  const SUPPS = "supplements";
  function inActiveCat(p) {
    if (activeCat === "all") return true;
    if (activeCat === "peptides") return !p.categories.includes(LAB_SUPPLIES) && !p.categories.includes(SUPPS);
    return p.categories.includes(activeCat);
  }

  bar.innerHTML =
    pillHtml("all", "All Products") +
    pillHtml("peptides", "Peptides") +
    CATEGORIES.map((c) => pillHtml(c.slug, c.name)).join("");

  function renderBanner() {
    if (activeCat === "all") {
      banner.style.display = "none";
      titleEl.textContent = "All Products";
      subtitleEl.textContent = `${skuCount()} products across ${CATEGORIES.length} categories. Every listing shows appearance and available sizes.`;
      return;
    }
    if (activeCat === "peptides") {
      banner.style.display = "none";
      titleEl.textContent = "Peptides";
      subtitleEl.textContent = "Every research peptide in the catalog. Laboratory supplies and supplements are listed separately.";
      return;
    }
    const cat = getCategory(activeCat);
    if (!cat) {
      banner.style.display = "none";
      return;
    }
    titleEl.textContent = cat.name;
    subtitleEl.textContent = cat.blurb;
    if (cat.image) {
      banner.style.display = "flex";
      banner.innerHTML = `
        <img src="${cat.image}" alt="${cat.name}" />
        <div class="cat-banner-copy">
          <span class="eyebrow">${activeCat === SUPPS ? "Product Category" : "Research Category"}</span>
          <h2>${cat.name}</h2>
          <p>${cat.blurb}</p>
        </div>`;
    } else {
      banner.style.display = "none";
    }
  }

  function sortList(list) {
    const sorted = [...list];
    if (sortBy === "price-asc") sorted.sort((a, b) => getCoverDose(a).priceCents - getCoverDose(b).priceCents);
    else if (sortBy === "price-desc") sorted.sort((a, b) => getCoverDose(b).priceCents - getCoverDose(a).priceCents);
    else if (sortBy === "name-asc") sorted.sort((a, b) => a.name.localeCompare(b.name));
    return sorted;
  }

  function render() {
    renderBanner();
    let list = PRODUCTS.filter(inActiveCat);
    list = sortList(list);
    resultsCount.textContent = `${list.length} listing${list.length === 1 ? "" : "s"} · ${list.reduce((n, p) => n + p.doses.length, 0)} sizes & formats`;

    grid.innerHTML = list
      .map((p) => {
        const doseLabels = escapeHtml(doseSummary(p));
        return `
        <a class="product-card reveal in" href="product.html?slug=${p.slug}">
          <div class="thumb">
            <span class="purity-chip">${isSupplement(p) ? "SUPPLEMENT" : "RESEARCH USE"}</span>
            ${p.image ? `<img src="${p.image}" alt="${escapeHtml(p.name)}" loading="lazy" />` : `<span style="font-family:var(--font-mono); color:var(--navy-800); font-weight:700; text-align:center; padding:0 10px;">${escapeHtml(p.name)}</span>`}
          </div>
          <div class="body">
            <span class="cat-tag">${escapeHtml(getCategory(p.categories[0]).name)}</span>
            <h3>${escapeHtml(p.name)}</h3>
            <p class="sub">${escapeHtml(p.appearance)} · ${doseLabels}</p>
            <div class="row">
              <span class="price-tag">${formatPrice(p)}</span>
              ${doseCountBadgeHtml(p)}
            </div>
            <button class="btn btn-outline btn-sm btn-block" style="margin-top:10px;" data-add-to-cart="${p.slug}" data-dose="${p.coverDose || p.doses[0].label}">Add to Cart</button>
          </div>
        </a>`;
      })
      .join("");
  }

  bar.addEventListener("click", (e) => {
    const btn = e.target.closest(".filter-pill");
    if (!btn) return;
    activeCat = btn.dataset.cat;
    bar.querySelectorAll(".filter-pill").forEach((p) => p.classList.remove("active"));
    btn.classList.add("active");
    const url = new URL(window.location);
    if (activeCat === "all") url.searchParams.delete("cat");
    else url.searchParams.set("cat", activeCat);
    window.history.replaceState({}, "", url);
    render();
  });

  sortSelect.addEventListener("change", () => {
    sortBy = sortSelect.value;
    render();
  });

  render();

  // Render immediately with the static fallback catalog above (so there's
  // never a blank page while the live-data fetch is in flight, including
  // on Netlify Function cold starts) - then quietly re-render once live
  // data has loaded, in case anything changed (price, stock, new items).
  window.catalogReadyPromise.then(() => {
    bar.innerHTML =
      pillHtml("all", "All Products") +
      CATEGORIES.map((c) => pillHtml(c.slug, c.name)).join("");
    render();
  });
});
