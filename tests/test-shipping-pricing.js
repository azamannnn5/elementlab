// Guards the new shipping calculator and cart discount display logic.
const { makeDom, delayedFetch, wait } = require("./helpers");

async function run() {
  const failures = [];

  const dom = makeDom("cart.html", {
    fetchImpl: delayedFetch({ categories: [], products: [], combos: [], settings: null }, 50),
    seedLocalStorage: {
      pf_cart_v2: JSON.stringify([{ type: "product", slug: "bpc-157", dose: "10mg", qty: 1 }]),
    },
  });
  await wait(300);
  const doc = dom.window.document;
  const win = dom.window;

  // --- calculateShipping exists and behaves sanely ---
  // Free at $300+, otherwise "confirmed after order request" with no
  // dollar amount - no weight tiers, no country argument anymore (see
  // js/shipping.js). Matches the same simplification made to VoltReserve.
  if (typeof win.calculateShipping !== "function") {
    failures.push("cart.html: calculateShipping is not defined");
  } else {
    // FREE_SHIPPING_THRESHOLD_CENTS is a top-level `let` in promo.js, so it's
    // not exposed as a window property (that's normal JS scoping, not a
    // bug) - hardcode the known default ($300) rather than reading it externally.
    const free = win.calculateShipping(30000);
    if (!free.isFree || free.cents !== 0) failures.push(`calculateShipping(30000): expected free with cents:0, got ${JSON.stringify(free)}`);

    const under = win.calculateShipping(1000);
    if (under.isFree || under.cents !== 0) failures.push(`calculateShipping(1000): expected not free but cents:0 (no calculated amount), got ${JSON.stringify(under)}`);
    if (!/confirmed after order request/i.test(under.label)) failures.push(`calculateShipping(1000): label should say "confirmed after order request", got "${under.label}"`);

    if (win.calculateShipping.length > 1) {
      failures.push(`calculateShipping should take exactly one argument (subtotalCents) - country-based branching was removed (function signature suggests otherwise, length=${win.calculateShipping.length})`);
    }
  }

  // --- Country selector exists and defaults sensibly ---
  const countrySelect = doc.getElementById("o-country");
  if (!countrySelect) {
    failures.push("cart.html: missing #o-country selector");
  }

  // --- Shipping row is visible when cart has items ---
  const shipRow = doc.getElementById("sum-shipping-row");
  if (!shipRow || shipRow.style.display === "none") {
    failures.push("cart.html: shipping row should be visible when the cart has items");
  }

  // --- Strikethrough total appears when a discount is active ---
  // Force a mix-and-match discount by adding enough items to hit a tier.
  win.localStorage.setItem("pf_cart_v2", JSON.stringify(
    Array.from({ length: 6 }, () => ({ type: "product", slug: "bpc-157", dose: "10mg", qty: 1 }))
  ));
  win.renderCart();
  await wait(50);
  const discRowsEl = doc.getElementById("sum-discount-rows");
  const originalTotalEl = doc.getElementById("sum-total-original");
  if (!discRowsEl.innerHTML.trim()) {
    failures.push("cart.html: 6-item cart should trigger a mix-and-match discount");
  }
  if (originalTotalEl.style.display === "none" || !originalTotalEl.textContent.includes("$")) {
    failures.push("cart.html: original (pre-discount) total should show struck through when a discount applies");
  }

  // --- Order button text ---
  const submitBtn = doc.getElementById("submit-order-btn");
  if (!submitBtn || !/Submit Order Request/i.test(submitBtn.textContent)) {
    failures.push(`cart.html: submit button should read "Submit Order Request", found "${submitBtn ? submitBtn.textContent : "MISSING"}"`);
  }

  // --- Promo placeholder must not reveal the code ---
  const promoInput = doc.getElementById("o-promo");
  if (promoInput && /welcome/i.test(promoInput.getAttribute("placeholder") || "")) {
    failures.push("cart.html: promo code input placeholder should not reveal the actual code");
  }

  // --- Submitting the order shows the success modal, and no shipping
  //     cost is ever calculated or sent ---
  doc.getElementById("o-name").value = "Test User";
  doc.getElementById("o-phone").value = "555-1234";
  doc.getElementById("o-email").value = "test@example.com";
  doc.getElementById("o-address").value = "123 Test St";
  doc.getElementById("o-payment").value = "Cash App";

  let sentBody = null;
  win.fetch = async (url, opts) => {
    if (typeof url === "string" && url.includes("confirm-order")) {
      sentBody = JSON.parse(opts.body);
      return { ok: true, status: 200, json: async () => ({ ok: true }) };
    }
    return { ok: false, status: 404, json: async () => ({}) };
  };

  const form = doc.getElementById("order-form");
  form.dispatchEvent(new win.Event("submit", { bubbles: true, cancelable: true }));
  const modal = doc.getElementById("order-success-modal");
  if (!modal || modal.hidden) {
    failures.push("cart.html: order-success-modal should be visible after a successful submit");
  }
  if (sentBody && sentBody.shippingCents !== 0) {
    failures.push(`cart.html: order payload sent shippingCents=${sentBody.shippingCents}, expected 0 (no cost should ever be calculated/sent)`);
  }

  dom.window.close();
  return failures;
}

module.exports = { name: "shipping-and-pricing", run };
