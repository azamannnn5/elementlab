/* ElementLab Peptides - shared front-end behavior */

// ---------- Scroll-reveal ("swipe/fade into place") ----------
function initReveal() {
  const items = document.querySelectorAll(".reveal");
  if (!("IntersectionObserver" in window) || items.length === 0) {
    items.forEach((el) => el.classList.add("in"));
    return;
  }
  const io = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("in");
          io.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.15, rootMargin: "0px 0px -40px 0px" }
  );
  items.forEach((el) => io.observe(el));
}

// Auto-tag common blocks with .reveal so pages don't need it hand-added everywhere
function autoTagReveal() {
  const selectors = [
    ".cat-card", ".product-card", ".step-card",
    ".policy-body h2", ".value-card",
  ];
  document.querySelectorAll(selectors.join(",")).forEach((el) => {
    if (!el.classList.contains("reveal")) el.classList.add("reveal");
  });
}

// ---------- Mobile nav ----------
function initMobileNav() {
  const toggle = document.querySelector(".menu-toggle");
  const nav = document.querySelector(".nav-links");
  if (!toggle || !nav) return;
  toggle.addEventListener("click", () => {
    nav.classList.toggle("mobile-open");
  });
}

// ---------- Header shadow on scroll ----------
function initHeaderScroll() {
  const header = document.querySelector(".site-header");
  if (!header) return;
  window.addEventListener("scroll", () => {
    header.style.boxShadow = window.scrollY > 8 ? "var(--shadow-sm)" : "none";
  });
}

// ---------- Promo/account signup form ----------
function initSignupForms() {
  document.querySelectorAll("[data-signup-form]").forEach((form) => {
    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      const msg = form.querySelector(".form-msg");
      const email = form.querySelector('input[type="email"]').value.trim();
      const btn = form.querySelector('button[type="submit"]');
      if (!email) return;
      btn.disabled = true;
      btn.textContent = "Submitting…";

      // Grant the first-order discount eligibility locally right away - the
      // actual code is only ever revealed by email (see
      // backend/netlify/functions/subscribe.js), and redemption is
      // re-verified server-side per email address at checkout.
      localStorage.setItem("pf_email_discount_available", "true");

      try {
        await fetch("/.netlify/functions/subscribe", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email }),
        });
      } catch (err) {
        // Backend not connected yet - the code still gets emailed once it is.
      }

      msg.textContent = "You're in! 10% off is now active for your first order - no code needed.";
      msg.className = "form-msg show ok";
      form.reset();
      btn.disabled = false;
      btn.textContent = "Sign up";
    });
  });
}

// ---------- Contact form ----------
function initContactForms() {
  document.querySelectorAll("[data-contact-form]").forEach((form) => {
    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      const msg = form.querySelector(".form-msg");
      const btn = form.querySelector('button[type="submit"]');
      const payload = {
        name: form.querySelector("#c-name")?.value.trim(),
        email: form.querySelector('input[type="email"]')?.value.trim(),
        org: form.querySelector("#c-org")?.value.trim(),
        message: form.querySelector("#c-msg")?.value.trim(),
        product_slug: form.querySelector("#c-product")?.value || undefined,
      };
      btn.disabled = true;
      btn.textContent = "Sending…";
      try {
        const res = await fetch("/.netlify/functions/contact", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        if (!res.ok) throw new Error("Request failed");
        // Replace the whole form with a clear confirmation state, rather
        // than a small inline message easy to miss under the submit button.
        const card = form.closest(".form-card") || form.parentElement;
        card.innerHTML = `
          <div style="text-align:center; padding:20px 0;">
            <div style="width:52px; height:52px; border-radius:50%; background:var(--green-600); display:flex; align-items:center; justify-content:center; margin:0 auto 16px;">
              <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
            </div>
            <h3 style="margin-bottom:8px;">Message sent</h3>
            <p style="margin-bottom:0; color:var(--ink-soft);">We'll reply within 1–2 business days. You can also reach us anytime at <a href="mailto:contact@elementlabpeptides.com" style="color:var(--teal-500); font-weight:600;">contact@elementlabpeptides.com</a>.</p>
          </div>`;
      } catch (err) {
        msg.textContent = "Something went wrong. Please email contact@elementlabpeptides.com directly.";
        msg.className = "form-msg show err";
        btn.disabled = false;
        btn.textContent = "Send Message";
      }
    });
  });
}

// ---------- Age gate (21+) ----------
// Visibility is set synchronously by an inline script in header.html
// (before paint, to avoid a flash of hidden/visible content). This just
// wires up the buttons.
function initAgeGate() {
  const gate = document.getElementById("age-gate");
  if (!gate) return;
  document.getElementById("age-gate-yes").addEventListener("click", () => {
    localStorage.setItem("pf_age_verified", "true");
    gate.hidden = true;
    document.documentElement.style.overflow = "";
    scheduleAllPopups();
  });
  document.getElementById("age-gate-no").addEventListener("click", () => {
    window.location.href = "https://www.google.com";
  });

  // Age already verified in an earlier visit (gate never shown this load) -
  // still eligible for the promo pop-up.
  if (localStorage.getItem("pf_age_verified") === "true") {
    scheduleAllPopups();
  }
}

// ---------- Popup scheduling ----------
// Every popup on the site (the Welcome email-signup popup, plus any
// admin-configured promo popups) shares one queue: only one is ever
// visible at a time, and each is shown at most once EVER per browser -
// not just once per visit. A popup with a longer delay doesn't get
// skipped if an earlier one is already showing; it just waits its turn.
let popupBusy = false;
const popupQueue = [];
function queuePopup(delaySec, showFn) {
  setTimeout(() => {
    popupQueue.push(showFn);
    drainPopupQueue();
  }, Math.max(0, delaySec) * 1000);
}
function drainPopupQueue() {
  if (popupBusy || popupQueue.length === 0) return;
  popupBusy = true;
  const showFn = popupQueue.shift();
  showFn(() => {
    popupBusy = false;
    drainPopupQueue();
  });
}
function seenPopups() {
  try {
    return JSON.parse(localStorage.getItem("pf_seen_popups") || "[]");
  } catch (err) {
    return [];
  }
}
function markPopupSeen(key) {
  const seen = seenPopups();
  if (!seen.includes(key)) {
    seen.push(key);
    localStorage.setItem("pf_seen_popups", JSON.stringify(seen));
  }
}
function popupAlreadySeen(key) {
  return seenPopups().includes(key);
}

// Called once age verification is done (see initAgeGate below) - schedules
// the Welcome popup and every currently-active admin promo popup that
// this browser hasn't seen yet, each on its own timer.
// Tracks which popups have already been scheduled THIS page load, so
// calling scheduleAllPopups() again after live settings arrive (see
// promo.js's refreshPromoPlacements) never double-queues the same one.
const scheduledPopupKeys = new Set();
function scheduleAllPopups() {
  if (!scheduledPopupKeys.has("welcome") && !popupAlreadySeen("welcome") && document.getElementById("promo-popup")) {
    scheduledPopupKeys.add("welcome");
    queuePopup(1.2, (done) => showWelcomePopup(done));
  }
  if (typeof promosForPlacement === "function") {
    promosForPlacement("popup").forEach((promo) => {
      const key = "promo:" + promo.code;
      if (scheduledPopupKeys.has(key) || popupAlreadySeen(key)) return;
      scheduledPopupKeys.add(key);
      const delay = promo.popupDelaySec != null ? promo.popupDelaySec : 5;
      queuePopup(delay, (done) => showActivePromoPopup(promo, done));
    });
  }
}

// ---------- Welcome pop-up (10% off signup) ----------
// Never reveals the actual promo code - that's only ever sent by email
// (see backend/netlify/functions/subscribe.js), so redeeming it requires
// checking your inbox.
function showWelcomePopup(done) {
  const popup = document.getElementById("promo-popup");
  if (!popup || popupAlreadySeen("welcome")) return done();
  popup.hidden = false;
  document.documentElement.style.overflow = "hidden";
  popup.dataset.onCloseDone = "1";
  popup._popupDone = done;
}

// ---------- Active-promo pop-up (admin-configured, code shown directly) ----------
// Advertises a specific, currently-active admin-created promo by showing
// the code itself, no email required. Each promo popup that fires reuses
// this one piece of markup, filling in that promo's text/code right
// before it's shown - only one popup is ever on screen at a time (see
// the queue above), so this is safe even with several promos queued up.
function showActivePromoPopup(promo, done) {
  const popup = document.getElementById("active-promo-popup");
  if (!popup || popupAlreadySeen("promo:" + promo.code)) return done();
  document.getElementById("active-promo-text").textContent = promoDisplayText(promo);
  document.getElementById("active-promo-code").textContent = promo.code.toUpperCase();
  popup.hidden = false;
  document.documentElement.style.overflow = "hidden";
  popup._popupDone = done;
  popup._popupKey = "promo:" + promo.code;
}

function initActivePromoPopup() {
  const popup = document.getElementById("active-promo-popup");
  if (!popup) return;
  const close = () => {
    if (popup._popupKey) markPopupSeen(popup._popupKey);
    popup.hidden = true;
    document.documentElement.style.overflow = "";
    const done = popup._popupDone;
    popup._popupDone = null;
    if (done) done();
  };
  document.getElementById("active-promo-close").addEventListener("click", close);
  document.getElementById("active-promo-shop").addEventListener("click", close);
  document.getElementById("active-promo-copy").addEventListener("click", () => {
    const code = document.getElementById("active-promo-code").textContent;
    navigator.clipboard?.writeText(code).catch(() => {});
    const btn = document.getElementById("active-promo-copy");
    const original = btn.textContent;
    btn.textContent = "Copied";
    setTimeout(() => (btn.textContent = original), 1400);
  });
}

function initPromoPopup() {
  const popup = document.getElementById("promo-popup");
  if (!popup) return;

  const close = () => {
    markPopupSeen("welcome");
    popup.hidden = true;
    document.documentElement.style.overflow = "";
    const done = popup._popupDone;
    popup._popupDone = null;
    if (done) done();
  };

  document.getElementById("promo-popup-close").addEventListener("click", close);
  document.getElementById("promo-popup-dismiss").addEventListener("click", close);

  document.getElementById("promo-popup-form").addEventListener("submit", async (e) => {
    e.preventDefault();
    const email = document.getElementById("promo-popup-email").value.trim();
    if (!email) return;
    const btn = document.getElementById("promo-popup-submit");
    const msg = document.getElementById("promo-popup-msg");
    btn.disabled = true;
    btn.textContent = "Sending…";

    // Grant the first-order discount eligibility locally right away - the
    // actual code is only ever revealed by email, and redemption is
    // re-verified server-side per email address at checkout (see
    // confirm-order.js), so this local flag alone can't let the code be
    // reused across devices.
    localStorage.setItem("pf_email_discount_available", "true");

    try {
      await fetch("/.netlify/functions/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
    } catch (err) {
      // Backend not connected yet - we still show the same message below;
      // there's nothing meaningfully different the customer can do here.
    }

    document.getElementById("promo-popup-form").style.display = "none";
    msg.textContent = "You're in! 10% off is now active for your first order - no code needed.";
    msg.style.display = "block";
    markPopupSeen("welcome");
    setTimeout(close, 2200);
  });
}

// ---------- Dark mode ----------
function initThemeToggle() {
  // Saved theme is already applied synchronously by an inline script in
  // header.html (before paint), to avoid a flash of the wrong theme.
  // This just wires up the toggle button's click behavior.
  const btn = document.getElementById("theme-toggle-btn");
  if (!btn) return;
  btn.addEventListener("click", () => {
    const isDark = document.documentElement.getAttribute("data-theme") === "dark";
    if (isDark) {
      document.documentElement.removeAttribute("data-theme");
      localStorage.setItem("pf_theme", "light");
    } else {
      document.documentElement.setAttribute("data-theme", "dark");
      localStorage.setItem("pf_theme", "dark");
    }
  });
}

// ---------- Search ----------
function initSearch() {
  const toggleBtn = document.getElementById("search-toggle-btn");
  const panel = document.getElementById("search-panel");
  const backdrop = document.getElementById("search-backdrop");
  const closeBtn = document.getElementById("search-close-btn");
  const input = document.getElementById("search-input");
  const results = document.getElementById("search-results");
  if (!toggleBtn || !panel || typeof PRODUCTS === "undefined") return;

  function openSearch() {
    panel.classList.add("open");
    backdrop.classList.add("open");
    setTimeout(() => input.focus(), 150);
  }
  function closeSearch() {
    panel.classList.remove("open");
    backdrop.classList.remove("open");
  }

  toggleBtn.addEventListener("click", openSearch);
  closeBtn.addEventListener("click", closeSearch);
  backdrop.addEventListener("click", closeSearch);
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") closeSearch();
    if ((e.key === "k" || e.key === "K") && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      openSearch();
    }
  });

  function render(query) {
    const q = query.trim().toLowerCase();
    if (!q) {
      results.innerHTML = "";
      return;
    }
    const matches = PRODUCTS.filter((p) => {
      const cats = p.categories.map((c) => getCategory(c)?.name || "").join(" ");
      return (
        p.name.toLowerCase().includes(q) ||
        cats.toLowerCase().includes(q) ||
        (p.summary || "").toLowerCase().includes(q)
      );
    }).slice(0, 8);

    if (matches.length === 0) {
      results.innerHTML = `<div class="search-empty">No products match "${query}". Try a compound name or category, like "tissue repair" or "BPC-157".</div>`;
      return;
    }

    results.innerHTML = matches
      .map(
        (p) => `
      <a class="search-result-item" href="product.html?slug=${p.slug}">
        <img src="${thumbOf(p.image) || "assets/img/logo-mark.png"}" alt="${p.name}" />
        <div>
          <div class="name">${p.name}</div>
          <div class="cat">${getCategory(p.categories[0])?.name || ""}</div>
        </div>
        <span class="price">${formatPrice(p)}</span>
      </a>`
      )
      .join("");
  }

  input.addEventListener("input", () => render(input.value));
}

// ---------- Recently viewed ----------
const RECENTLY_VIEWED_KEY = "pf_recently_viewed";
const RECENTLY_VIEWED_MAX = 8;

function trackRecentlyViewed(slug) {
  if (!slug) return;
  let list = [];
  try {
    list = JSON.parse(localStorage.getItem(RECENTLY_VIEWED_KEY)) || [];
  } catch {
    list = [];
  }
  list = list.filter((s) => s !== slug);
  list.unshift(slug);
  list = list.slice(0, RECENTLY_VIEWED_MAX);
  localStorage.setItem(RECENTLY_VIEWED_KEY, JSON.stringify(list));
}

function renderRecentlyViewed(sectionId, containerId, excludeSlug) {
  const section = document.getElementById(sectionId);
  const container = document.getElementById(containerId);
  if (!section || !container || typeof getProduct === "undefined") return;

  let list = [];
  try {
    list = JSON.parse(localStorage.getItem(RECENTLY_VIEWED_KEY)) || [];
  } catch {
    list = [];
  }
  const items = list
    .filter((s) => s !== excludeSlug)
    .map((s) => getProduct(s))
    .filter(Boolean)
    .slice(0, 6);

  if (items.length === 0) {
    section.style.display = "none";
    return;
  }
  section.style.display = "";
  container.innerHTML = items
    .map(
      (p) => `
    <a class="rv-card reveal in" href="product.html?slug=${p.slug}">
      <div class="thumb">${p.image ? `<img src="${thumbOf(p.image)}" alt="${p.name}" />` : ""}</div>
      <div class="name">${p.name}</div>
      <div class="price">${formatPrice(p)}</div>
    </a>`
    )
    .join("");
}

// ---------- Announcement bar ----------
function initAnnounceBar() {
  const el = document.getElementById("announce-msg");
  if (!el) return;
  let messages = [
    "Research peptides: laboratory use only, not for human or veterinary use. Creatine and supplements also available.",
    "Up to 20% off kits • 99%+ HPLC purity • batch COA",
    "Fast, tracked US dispatch",
  ];
  let i = 0;
  // Swap in admin-edited messages once the live catalog fetch resolves,
  // without delaying the first paint of the bar.
  function withPromoMessages(base) {
    const promoMsgs = (typeof promosForPlacement === "function" ? promosForPlacement("banner") : [])
      .map((p) => promoDisplayText(p));
    return promoMsgs.length ? base.concat(promoMsgs) : base;
  }
  messages = withPromoMessages(messages);
  window.renderPromoBannerMessages = () => {
    const base = (window.LIVE_SETTINGS && Array.isArray(window.LIVE_SETTINGS.announcements) && window.LIVE_SETTINGS.announcements.length)
      ? window.LIVE_SETTINGS.announcements
      : ["10% off your first order - sign up below", "Free shipping on orders over $200", "15% off - code only on our socials"];
    messages = withPromoMessages(base);
    i = 0;
    el.textContent = messages[0];
  };
  if (window.catalogReadyPromise) {
    window.catalogReadyPromise.then(() => window.renderPromoBannerMessages());
  }
  setInterval(() => {
    el.classList.add("fade");
    setTimeout(() => {
      i = (i + 1) % messages.length;
      el.textContent = messages[i];
      el.classList.remove("fade");
    }, 400);
  }, 4500);
}

// ---------- Footer link columns (editable from Site Settings > Footer) ----------
function renderFooterLinks() {
  const shopEl = document.getElementById("footer-shop-links");
  const companyEl = document.getElementById("footer-company-links");
  if (!shopEl || !companyEl || typeof mergeContent !== "function") return;
  const f = mergeContent("footer", DEFAULT_FOOTER);
  const linkHtml = (l) => `<a href="${escapeHtml(l.url)}">${escapeHtml(l.label)}</a>`;
  shopEl.innerHTML = f.shopLinks.map(linkHtml).join("");
  companyEl.innerHTML = f.companyLinks.map(linkHtml).join("");
}

document.addEventListener("DOMContentLoaded", () => {
  renderFooterLinks();
  if (window.catalogReadyPromise) window.catalogReadyPromise.then(renderFooterLinks);

  initAgeGate();
  initPromoPopup();
  initActivePromoPopup();
  initAnnounceBar();
  autoTagReveal();
  initReveal();
  initMobileNav();
  initHeaderScroll();
  initSignupForms();
  initContactForms();
  initThemeToggle();
  initSearch();
});
