document.addEventListener("DOMContentLoaded", async () => {
  const root = document.getElementById("product-root");
  const doRender = async () => {
    try {
      await renderProduct(root);
    } catch (err) {
      // A data problem (bad live-catalog row, etc) should never leave the
      // customer looking at a blank page with no explanation.
      console.error("Product page failed to render:", err);
      root.innerHTML = `<div style="padding:60px 0; text-align:center;">
        <h2>Something went wrong loading this product</h2>
        <p>Please try refreshing, or contact us if this keeps happening.</p>
        <a href="shop.html" class="btn btn-primary">Back to Shop</a>
      </div>`;
    }
  };
  // Render immediately with the static fallback catalog (no blank page
  // during a Netlify Function cold start), then render again once live
  // data has loaded in case anything changed.
  await doRender();
  window.catalogReadyPromise.then(doRender);
});

async function renderProduct(root) {
  const params = new URLSearchParams(window.location.search);
  const slug = params.get("slug");
  const p = getProduct(slug);

  if (!p) {
    root.innerHTML = `<div style="padding:60px 0; text-align:center;">
      <h2>Product not found</h2>
      <p>That product may have been removed or renamed.</p>
      <a href="shop.html" class="btn btn-primary">Back to Shop</a>
    </div>`;
    return;
  }

  document.title = `${p.name} | ElementLab Peptides`;
  document.getElementById("crumb-name").textContent = p.name;
  trackRecentlyViewed(p.slug);

  // SEO: dynamic meta description + Product JSON-LD, since this is a
  // single static product.html templated by ?slug= - the build-time meta
  // tags in <head> are generic, so we sharpen them here once we know
  // which product loaded. Search engines that execute JS (Googlebot does)
  // pick this up; it also improves social-share previews for JS-aware
  // crawlers, though not universally (a known limitation of a static,
  // client-rendered product page without server-side rendering).
  const metaDesc = document.querySelector('meta[name="description"]');
  const pageDesc = isSupplement(p) ? `${p.name} - food supplement, ${p.appearance}, ${p.doses.map((d) => d.label).join("/")}. Adults 18+.` : `${p.name} - research material, ${p.appearance}, sizes ${p.doses.map((d) => d.label).join("/")}. Third-party HPLC/mass-spec tested. Research use only.`;
  if (metaDesc) metaDesc.setAttribute("content", pageDesc);
  // Self-referencing canonical + og:url per product, so Google treats each ?slug= URL as its own page.
  const productUrl = `https://elementlabpeptides.com/product.html?slug=${encodeURIComponent(p.slug)}`;
  const canonEl = document.querySelector('link[rel="canonical"]');
  if (canonEl) canonEl.setAttribute("href", productUrl);
  const ogUrlEl = document.querySelector('meta[property="og:url"]');
  if (ogUrlEl) ogUrlEl.setAttribute("content", productUrl);
  const ldScript = document.createElement("script");
  ldScript.type = "application/ld+json";
  ldScript.id = "product-ld-json";
  // Remove any previous run's structured-data tag before adding a new one -
  // renderProduct() can run twice (immediate static render, then again once
  // live catalog data arrives), and duplicate ld+json tags would confuse
  // search engine crawlers.
  const prevLd = document.getElementById("product-ld-json");
  if (prevLd) prevLd.remove();
  ldScript.textContent = JSON.stringify({
    "@context": "https://schema.org",
    "@type": "Product",
    name: p.name,
    description: pageDesc,
    image: getDoseImage(p, p.coverDose || p.doses[0].label) ? `${window.location.origin}/${getDoseImage(p, p.coverDose || p.doses[0].label)}` : undefined,
    sku: p.slug,
    brand: { "@type": "Brand", name: "ElementLab Peptides" },
    offers: {
      "@type": "Offer",
      price: (getDose(p, p.coverDose || p.doses[0].label).priceCents / 100).toFixed(2),
      priceCurrency: "USD",
      availability: "https://schema.org/InStock",
      url: window.location.href,
    },
  });
  document.head.appendChild(ldScript);

  const catNames = p.categories.map((c) => getCategory(c).name).join(", ");
  const startDose = p.coverDose || p.doses[0].label;

  root.innerHTML = `
    <div>
      <div class="product-gallery">
        ${getDoseImage(p, startDose) ? `<img id="product-main-img" src="${getDoseImage(p, startDose)}" alt="${escapeHtml(p.name)} ${escapeHtml(startDose)}" />` : `<div style="font-family:var(--font-mono); font-size:1.4rem; color:var(--navy-800); font-weight:700; padding:120px 0;">${escapeHtml(p.name)}</div>`}
      </div>
      <div class="trust-row">
        ${isSupplement(p) ? `<div class="trust-item">Food Supplement</div>
        <div class="trust-item">Adults 18+</div>` : `<div class="trust-item">3rd-Party Lab Tested</div>
        <div class="trust-item">Research Use Only</div>`}
      </div>
    </div>
    <div class="product-info">
      <span class="cat-tag">${catNames}</span>
      <h1 style="margin-top:10px;">${escapeHtml(p.name)}</h1>
      <p class="lead">${escapeHtml(p.summary)}</p>

      <div class="dose-options">
        ${p.doses.map((d) => `<span class="dose-pill ${d.label === startDose ? "active" : ""}" data-dose="${d.label}">${d.label}</span>`).join("")}
      </div>
      ${/lyophilized/i.test(p.appearance) ? `<p style="margin:-4px 0 18px;"><a href="reconstitution-calculator.html?vial=${encodeURIComponent(parseFloat(startDose) || "")}" style="font-size:0.82rem; color:var(--teal-500); font-weight:600;">Calculate reconstitution volume →</a></p>` : ""}

      <div class="row" style="margin-bottom:6px; gap:10px; flex-wrap:wrap;">
        <span class="price-tag" id="selected-price" style="font-size:1.3rem;">${money(getDose(p, startDose).priceCents)}</span>
      </div>
      <p class="stock-status-text ${getStockStatus(p) === "out" ? "out" : "in"}" id="stock-status-text" style="margin-bottom:10px;">${getStockStatus(p) === "out" ? "Out of Stock" : "In Stock"}</p>
      <div id="product-promo-badge"></div>

      <div class="product-actions">
        <a href="contact.html?product=${encodeURIComponent(p.slug)}&size=${encodeURIComponent(startDose)}" class="btn btn-outline btn-block" id="request-btn">Request This Product</a>
        <div class="qty-pill">
          <button type="button" class="qty-btn" data-qty-step="-1" aria-label="Decrease quantity" ${getStockStatus(p) === "out" ? "disabled" : ""}>&minus;</button>
          <input type="number" id="qty-${p.slug}" min="1" value="1" inputmode="numeric" aria-label="Quantity" ${getStockStatus(p) === "out" ? "disabled" : ""} />
          <button type="button" class="qty-btn" data-qty-step="1" aria-label="Increase quantity" ${getStockStatus(p) === "out" ? "disabled" : ""}>+</button>
        </div>
        <button class="btn btn-primary btn-block" data-add-to-cart="${p.slug}" data-dose="${startDose}" id="add-to-cart-btn" ${getStockStatus(p) === "out" ? "disabled" : ""}>${getStockStatus(p) === "out" ? "Out of Stock" : "Add to Cart"}</button>
      </div>

      ${p.researchApplications && p.researchApplications.length ? `
      <div style="margin-top:26px;">
        <h3 style="font-size:0.9rem; text-transform:uppercase; letter-spacing:0.05em; color:var(--ink-soft); margin-bottom:10px;">${isSupplement(p) ? "Key Features" : "Research Applications"}</h3>
        <ul style="margin:0; padding-left:20px; color:var(--ink-soft); font-size:0.9rem;">
          ${p.researchApplications.map((r) => `<li style="margin-bottom:6px;">${r}</li>`).join("")}
        </ul>
      </div>` : ""}

      <table class="spec-table">
        <tr><td>Appearance</td><td>${escapeHtml(p.appearance)}</td></tr>
        <tr><td>Available sizes</td><td>${p.doses.map((d) => escapeHtml(d.label)).join(", ")}</td></tr>
        ${p.chem ? `
        <tr><td>CAS Number</td><td>${escapeHtml(p.chem.cas)}</td></tr>
        <tr><td>Molecular Formula</td><td>${escapeHtml(p.chem.formula)}</td></tr>
        <tr><td>Molecular Weight</td><td>${escapeHtml(p.chem.mw)}</td></tr>
        ` : ""}
        <tr><td>Intended use</td><td>${isSupplement(p) ? "Food supplement (adults 18+)" : "Laboratory research only"}</td></tr>
        <tr><td>Storage</td><td>${escapeHtml(p.storage || (isSupplement(p) ? "Store in a cool, dry place away from direct sunlight. Keep tightly closed." : "Store lyophilized powder at -20°C; protect from light"))}</td></tr>
      </table>

      <div class="tab-bar">
        ${p.sds ? `<div class="tab-btn active" data-tab="docs">Safety Data</div>` : ""}
        <div class="tab-btn ${p.sds ? "" : "active"}" data-tab="compliance">Compliance</div>
      </div>
      ${p.sds ? `<div class="tab-panel active" data-panel="docs">
        <p>The Safety Data Sheet for ${escapeHtml(p.name)} is available to download below.</p>
        <a href="${p.sds}" target="_blank" class="btn btn-outline">SDS PDF</a>
      </div>` : ""}
      <div class="tab-panel ${p.sds ? "" : "active"}" data-panel="compliance">
        ${isSupplement(p) ? `<p>Food supplement. Not a substitute for a varied and balanced diet and a healthy lifestyle. Do not exceed the recommended daily dose on the label. Keep out of reach of children. Not for use by anyone under 18. If you are pregnant, breastfeeding, taking medication or under medical supervision, consult a healthcare professional before use.</p>` : `<p>This product is sold strictly for in-vitro laboratory research use. It is not a drug, dietary supplement, or cosmetic, and is not intended for human or animal consumption, diagnosis, treatment, cure, or prevention of any disease. By purchasing, you certify that you are a qualified researcher affiliated with a legitimate laboratory, academic, or scientific institution. See our <a href="zero-tolerance.html">Zero Tolerance Policy</a> for full terms.</p>`}
      </div>
    </div>
  `;

  const priceEl = document.getElementById("selected-price");
  const addBtn = document.getElementById("add-to-cart-btn");
  const reconLink = root.querySelector('a[href^="reconstitution-calculator.html"]');

  root.querySelectorAll("[data-qty-step]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const input = document.getElementById(`qty-${p.slug}`);
      if (!input) return;
      const next = Math.max(1, (parseInt(input.value, 10) || 1) + Number(btn.dataset.qtyStep));
      input.value = next;
    });
  });

  root.querySelectorAll(".dose-pill").forEach((pill) => {
    pill.addEventListener("click", () => {
      root.querySelectorAll(".dose-pill").forEach((x) => x.classList.remove("active"));
      pill.classList.add("active");
      const selectedDose = pill.dataset.dose;
      const d = getDose(p, selectedDose);
      priceEl.textContent = money(d.priceCents);
      addBtn.dataset.dose = selectedDose;
      const reqBtn = document.getElementById("request-btn");
      if (reqBtn) reqBtn.href = `contact.html?product=${encodeURIComponent(p.slug)}&size=${encodeURIComponent(selectedDose)}`;
      renderProductPromoBadge();
      const mainImg = document.getElementById("product-main-img");
      const di = getDoseImage(p, selectedDose);
      if (mainImg && di) { mainImg.src = di; mainImg.alt = `${p.name} ${selectedDose}`; }
      if (reconLink) {
        const mgValue = parseFloat(selectedDose);
        reconLink.href = `reconstitution-calculator.html?vial=${encodeURIComponent(isNaN(mgValue) ? "" : mgValue)}`;
      }
    });
  });

  root.querySelectorAll(".tab-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      root.querySelectorAll(".tab-btn").forEach((b) => b.classList.remove("active"));
      root.querySelectorAll(".tab-panel").forEach((pn) => pn.classList.remove("active"));
      btn.classList.add("active");
      root.querySelector(`.tab-panel[data-panel="${btn.dataset.tab}"]`).classList.add("active");
    });
  });

  // ---------- You Might Also Like ----------
  const relatedRoot = document.getElementById("related-root");
  const matchedCombos = combosForProduct(p.slug);
  let relatedHtml = "";

  if (matchedCombos.length) {
    relatedHtml += `<div class="section-head left"><span class="eyebrow">Save When Bundled</span><h2 style="margin-bottom:0;">Pairs well with</h2></div>`;
    relatedHtml += `<div class="combo-grid" style="margin-bottom:50px;">`;
    matchedCombos.forEach((c) => {
      const tier = c.tiers[0];
      const savings = tier.separateCents - tier.bundleCents;
      relatedHtml += `
        <a class="combo-card reveal in" href="combos.html#${c.slug}" style="text-decoration:none; color:inherit;">
          <div class="combo-thumb"><img src="${c.image}" alt="${c.name}" /></div>
          <div class="combo-body">
            <h3>${c.name}</h3>
            <p class="combo-items">${tier.label}</p>
            <p class="combo-save">Save ${money(savings)} as a bundle</p>
          </div>
        </a>`;
    });
    relatedHtml += `</div>`;
  }

  const sameCategory = productsInCategory(p.categories[0]).filter((x) => x.slug !== p.slug).slice(0, 4);
  if (sameCategory.length) {
    relatedHtml += `<div class="section-head left"><span class="eyebrow">More in ${getCategory(p.categories[0]).name}</span><h2 style="margin-bottom:0;">You might also like</h2></div>`;
    relatedHtml += `<div class="product-grid">`;
    sameCategory.forEach((rp) => {
      relatedHtml += `
        <a class="product-card reveal in" href="product.html?slug=${rp.slug}">
          <div class="thumb">
            <span class="purity-chip">${isSupplement(rp) ? "SUPPLEMENT" : "RESEARCH USE"}</span>
            ${rp.image ? `<img src="${rp.image}" alt="${escapeHtml(rp.name)}" loading="lazy" />` : ""}
          </div>
          <div class="body">
            <span class="cat-tag">${getCategory(rp.categories[0]).name}</span>
            <h3>${rp.name}</h3>
            <p class="sub">${doseRange(rp)}</p>
            <div class="row"><span class="price-tag">${formatPrice(rp)}</span>${doseCountBadgeHtml(rp)}</div>
          </div>
        </a>`;
    });
    relatedHtml += `</div>`;
  }

  relatedRoot.innerHTML = relatedHtml;

  renderRecentlyViewed("recently-viewed-section", "recently-viewed-strip", p.slug);
}
