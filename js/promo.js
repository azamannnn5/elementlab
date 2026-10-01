/* ElementLab Peptides - promo engine
   Rules (locked in with the client, updated):
   - Mix & Match: 3-5 items 5%, 6-9 items 7%, 10+ items 10% (any products, any combos)
   - Welcome discount: 10% off, first order only - auto-applies once eligible
     (no code needs to be typed for this one anymore, see note below)
   - Free shipping: cart subtotal at/above the admin-set threshold
   - Crypto (Bitcoin) payment: 5% off
   - Promo codes (e.g. RUM266, LUXPD): admin-editable list of {code, pct}
     pairs, entered in the cart's Promo Code field - add/remove codes from
     Site Settings, no redeploy needed
   - ALL qualifying discounts STACK (sum of percentages applied to the
     subtotal) - this replaced an earlier "best discount only" rule.

   Why welcome no longer needs a typed code: with only one Promo Code text
   field on the cart page, requiring an exact code there would make it
   impossible to also enter a *different* code (like RUM266) on the same
   order - you could only ever get one or the other. Since the business
   wants both to be able to apply together, welcome eligibility is now
   checked automatically (the same emailDiscountAvailable() flag as
   before, set when someone signs up via the popup/homepage form) and the
   Promo Code field is reserved for the separate, admin-managed code list.

   Email-discount "first order only" enforcement: this is real but client-side
   only until Supabase is connected (see backend/README.md) - it stops the
   same browser reusing the code, tracked via localStorage. Full cross-device
   enforcement needs the `subscribers.discount_used` flag checked server-side
   once the backend is live; the schema for that is already in schema.sql. */

let FREE_SHIPPING_THRESHOLD_CENTS = 20000;
let CRYPTO_DISCOUNT_PCT = 5;
let EMAIL_DISCOUNT_PCT = 10;
// A promo is: { code, pct, active, startDate, endDate, placements, label }
//  - active: manual on/off switch, independent of the date window
//  - startDate / endDate: ISO datetime strings ("" or missing = no bound)
//  - placements: subset of ["banner", "product", "popup"] - where the promo
//    is advertised. The code always works when typed in the cart's Promo
//    Code field regardless of placements; placements only control where it
//    gets *advertised* to shoppers who haven't heard of it yet.
//  - label: optional custom text; falls back to "Use code X for Y% off"
let PROMO_CODES = [
  { code: "RUM266", pct: 15, active: true, startDate: "", endDate: "", placements: [], label: "" },
  { code: "LUXPD", pct: 15, active: true, startDate: "", endDate: "", placements: [], label: "" },
];
const MIX_AND_MATCH_TIERS = [
  { min: 10, pct: 10 },
  { min: 6, pct: 7 },
  { min: 3, pct: 5 },
];

// Called once the live catalog fetch resolves (see products-data.js /
// loadLiveCatalog) if the admin panel has saved custom promo settings.
// Falls back to the defaults above when Supabase isn't connected yet.
function applyLiveSettings(settings) {
  if (!settings) return;
  if (settings.freeShippingThresholdCents != null) FREE_SHIPPING_THRESHOLD_CENTS = settings.freeShippingThresholdCents;
  if (settings.cryptoDiscountPct != null) CRYPTO_DISCOUNT_PCT = settings.cryptoDiscountPct;
  if (settings.welcomePct != null) EMAIL_DISCOUNT_PCT = settings.welcomePct;
  if (Array.isArray(settings.promoCodes)) {
    PROMO_CODES = settings.promoCodes.filter((p) => p && p.code && p.pct != null);
  }
  refreshPromoPlacements();
  if (Array.isArray(settings.paymentMethods) && settings.paymentMethods.length) {
    // Accepts either the current shape ({name, active}) or a plain list
    // of name strings (the shape this column held before toggles existed,
    // in case an older settings row hasn't been re-saved yet) - either
    // way, every method defaults to active unless explicitly turned off.
    PAYMENT_METHODS = settings.paymentMethods
      .map((m) => (typeof m === "string" ? { name: m, active: true } : m))
      .filter((m) => m && m.name);
  }
  // Keeps any static "we accept X, Y, and Z" prose in sync with whatever's
  // actually switched on, so it can't go stale if an admin toggles a
  // method later without remembering to also edit that page's text.
  const methodsEl = document.getElementById("live-payment-methods-text");
  if (methodsEl) methodsEl.textContent = paymentMethodsSentence();
  if (Array.isArray(settings.mixMatchTiers) && settings.mixMatchTiers.length) {
    MIX_AND_MATCH_TIERS.length = 0;
    MIX_AND_MATCH_TIERS.push(...[...settings.mixMatchTiers].sort((a, b) => b.min - a.min));
  }
  applyLiveContactInfo(settings);
}

// Applies admin-edited contact info (Site Settings > Contact Info) to
// whichever of these elements happen to exist on the current page - most
// pages have none of them, so this is a no-op there. Uses .textContent
// (never innerHTML) for the values themselves, which is inherently safe
// against HTML injection regardless of what's typed in the admin panel.
function applyLiveContactInfo(settings) {
  // Every one of these can appear more than once on a page (footer +
  // page body), so this updates ALL matches by class, not just the first
  // element with a given id - a page-plus-footer combo used to mean only
  // one of the two ever actually got the live value.
  if (settings.contactEmail) {
    document.querySelectorAll(".js-contact-email").forEach((el) => {
      el.textContent = settings.contactEmail;
      if (el.tagName === "A") el.href = `mailto:${settings.contactEmail}`;
    });
  }
  if (settings.contactPhone) {
    document.querySelectorAll(".js-contact-phone").forEach((el) => {
      el.textContent = settings.contactPhone;
      if (el.tagName === "A") el.href = `tel:${settings.contactPhone.replace(/[^0-9+]/g, "")}`;
    });
    document.querySelectorAll(".js-contact-phone-link").forEach((el) => {
      el.href = `tel:${settings.contactPhone.replace(/[^0-9+]/g, "")}`;
      el.style.display = "";
    });
    document.querySelectorAll(".js-contact-phone-row").forEach((el) => (el.style.display = ""));
  }
  document.querySelectorAll(".js-contact-address-row").forEach((el) => {
    el.style.display = settings.contactAddress ? "" : "none";
  });
  if (settings.contactAddress) {
    document.querySelectorAll(".js-contact-address").forEach((el) => (el.textContent = settings.contactAddress));
  }
  document.querySelectorAll(".js-chat-hours-row").forEach((el) => {
    el.style.display = settings.chatHours ? "" : "none";
  });
  if (settings.chatHours) {
    document.querySelectorAll(".js-chat-hours").forEach((el) => (el.textContent = settings.chatHours));
  }
}

function mixAndMatchPct(itemCount) {
  for (const tier of MIX_AND_MATCH_TIERS) {
    if (itemCount >= tier.min) return tier.pct;
  }
  return 0;
}

function nextMixAndMatchTier(itemCount) {
  const remaining = [...MIX_AND_MATCH_TIERS].reverse();
  for (const tier of remaining) {
    if (itemCount < tier.min) return tier;
  }
  return null;
}

function emailDiscountAvailable() {
  return (
    localStorage.getItem("pf_email_discount_available") === "true" &&
    localStorage.getItem("pf_email_discount_used") !== "true"
  );
}

function markEmailDiscountUsed() {
  localStorage.setItem("pf_email_discount_used", "true");
}

function isPromoActive(p, now) {
  if (!p) return false;
  if (p.active === false) return false;
  now = now || new Date();
  if (p.startDate && now < new Date(p.startDate)) return false;
  if (p.endDate && now > new Date(p.endDate)) return false;
  return true;
}
function activePromoCodes() {
  const now = new Date();
  return PROMO_CODES.filter((p) => isPromoActive(p, now));
}
// Only an ACTIVE promo (right code, right time window) can be redeemed -
// an expired or paused code typed into the cart simply doesn't match.
function matchPromoCode(promoCode) {
  if (!promoCode) return null;
  const entered = promoCode.trim().toUpperCase();
  return activePromoCodes().find((p) => p.code.toUpperCase() === entered) || null;
}
function promoDisplayText(p) {
  return (p.label && p.label.trim()) || `Use code ${p.code.toUpperCase()} for ${p.pct}% off`;
}
// Promos advertised in a given spot (banner / product / popup), active right now.
function promosForPlacement(name) {
  return activePromoCodes().filter((p) => Array.isArray(p.placements) && p.placements.includes(name));
}
// Re-render every already-mounted placement whenever PROMO_CODES changes
// (called after applyLiveSettings, so live-catalog promos show up without
// a page reload even though the banner/popup may have already painted
// once with the static fallback list).
function refreshPromoPlacements() {
  if (typeof renderPromoBannerMessages === "function") renderPromoBannerMessages();
  if (typeof renderProductPromoBadge === "function") renderProductPromoBadge();
  // Newly-loaded live promos that want the popup placement need to be
  // scheduled too (the initial scheduleAllPopups() call runs before the
  // live settings fetch resolves, off the static fallback promo list).
  if (typeof scheduleAllPopups === "function" && localStorage.getItem("pf_age_verified") === "true") scheduleAllPopups();
}

// Returns every discount that currently applies, all stacked together -
// e.g. a first-time customer with 10+ items, paying by Bitcoin, who also
// enters RUM266, gets all four at once. Each entry is
// { type, pct, label }; the cart page sums their pct for the combined
// discount, and lists each one as its own line in the summary/email.
function applicableDiscounts(itemCount, promoCode, paymentMethod) {
  const discounts = [];

  const mmPct = mixAndMatchPct(itemCount);
  if (mmPct > 0) discounts.push({ type: "mix", pct: mmPct, label: `Mix & Match (${itemCount} items)` });

  if (emailDiscountAvailable()) {
    discounts.push({ type: "email", pct: EMAIL_DISCOUNT_PCT, label: "First Order (Welcome Discount)" });
  }

  if (paymentMethod === "Bitcoin") {
    discounts.push({ type: "crypto", pct: CRYPTO_DISCOUNT_PCT, label: "Crypto Payment" });
  }

  const matchedCode = matchPromoCode(promoCode);
  if (matchedCode) {
    discounts.push({ type: "code", pct: matchedCode.pct, label: `Promo Code (${matchedCode.code.toUpperCase()})` });
  }

  return discounts;
}

// Combines the stacked list above into one { pct, label } summary and the
// total cents it comes to - what the cart's total line and the order
// email both actually use.
function stackedDiscount(itemCount, promoCode, paymentMethod) {
  const discounts = applicableDiscounts(itemCount, promoCode, paymentMethod);
  if (discounts.length === 0) return null;
  const totalPct = discounts.reduce((sum, d) => sum + d.pct, 0);
  return { discounts, pct: totalPct };
}

function discountCents(subtotalCents, discount) {
  if (!discount) return 0;
  return Math.round((subtotalCents * discount.pct) / 100);
}


/* ---------- Accepted payment methods (single source of truth) ----------
   PAYMENT_METHODS is the default list; the admin panel's Payment Methods
   section (LIVE_SETTINGS.paymentMethods) overrides it once loaded. Logos
   live in assets/img/payments/, keyed by exact name. A method added from
   the admin panel with no matching logo falls back to a plain text tile. */
// Each payment method is { name, active }. "active: false" means switched
// off from the admin panel - it disappears from every spot it's shown
// (home page, Payment Methods page, cart dropdown, FAQ sentence) without
// being deleted, so it's one click to turn back on later.
let PAYMENT_METHODS = [
  { name: "Bitcoin", active: true }, { name: "USDT", active: true }, { name: "PayPal", active: true },
  { name: "Apple Pay", active: true }, { name: "Google Pay", active: true }, { name: "Cash App", active: true },
  { name: "Venmo", active: true }, { name: "Zelle", active: true }, { name: "Chime", active: true },
  { name: "Bank Transfer", active: true }, { name: "Wise", active: true }, { name: "Revolut", active: true },
  { name: "Gift Cards", active: true }, { name: "TapTap Send", active: true }, { name: "Remitly", active: true },
];
function activePaymentMethods() {
  return PAYMENT_METHODS.filter((m) => m.active !== false).map((m) => m.name);
}
function paymentMethodsSentence() {
  const methods = activePaymentMethods();
  if (methods.length === 0) return "";
  return methods.length > 1 ? `${methods.slice(0, -1).join(", ")}, and ${methods[methods.length - 1]}` : methods[0];
}
const PAYMENT_LOGOS = {
  "Bitcoin": "assets/img/payments/bitcoin.svg",
  "USDT": "assets/img/payments/usdt.svg",
  "PayPal": "assets/img/payments/paypal.svg",
  "Apple Pay": "assets/img/payments/apple-pay.svg",
  "Google Pay": "assets/img/payments/google-pay.svg",
  "Cash App": "assets/img/payments/cash-app.svg",
  "Venmo": "assets/img/payments/venmo.svg",
  "Zelle": "assets/img/payments/zelle.svg",
  "Chime": "assets/img/payments/chime.png",
  "Bank Transfer": "assets/img/payments/bank-transfer.svg",
  "Wise": "assets/img/payments/wise.svg",
  "Revolut": "assets/img/payments/revolut.svg",
  "Gift Cards": "assets/img/payments/gift-cards.svg",
  "TapTap Send": "assets/img/payments/taptap-send.png",
  "Remitly": "assets/img/payments/remitly.png",
};
function paymentTileHtml(name) {
  const src = PAYMENT_LOGOS[name];
  const mark = src
    ? `<img src="${src}" alt="${escapeHtml(name)} logo" />`
    : `<span class="pay-tile-fallback">${escapeHtml(name)}</span>`;
  return `<div class="pay-tile"><div class="pay-tile-logo">${mark}</div><span class="pay-tile-name">${escapeHtml(name)}</span></div>`;
}
function renderPaymentTiles(el) {
  if (!el) return;
  el.innerHTML = activePaymentMethods().map(paymentTileHtml).join("");
}
