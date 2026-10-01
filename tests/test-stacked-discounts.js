// Guards the core behavior of this round's change: discounts no longer
// pick "best only" - every qualifying discount stacks. Also guards the
// design decision that made this possible: the welcome discount now
// auto-applies (no code needs to be typed), since the cart only has one
// Promo Code field and it needs to stay free for admin-added codes like
// RUM266/LUXPD to work alongside welcome on the same order.
const { makeDom, delayedFetch, wait } = require("./helpers");

async function run() {
  const failures = [];

  const dom = makeDom("cart.html", {
    fetchImpl: delayedFetch({
      categories: [], products: [], combos: [],
      settings: {
        mixMatchTiers: [{ min: 10, pct: 10 }, { min: 6, pct: 7 }, { min: 3, pct: 5 }],
        welcomePct: 10,
        freeShippingThresholdCents: 20000,
        cryptoDiscountPct: 5,
        announcements: [],
        promoCodes: [{ code: "RUM266", pct: 15 }, { code: "LUXPD", pct: 15 }],
      },
    }, 30),
    seedLocalStorage: {
      // 10 items -> top Mix & Match tier (10%)
      pf_cart_v2: JSON.stringify(Array.from({ length: 10 }, () => ({ type: "product", slug: "bpc-157", dose: "10mg", qty: 1 }))),
      // Eligible for the welcome discount (signed up, never used it)
      pf_email_discount_available: "true",
    },
  });
  await wait(300);
  const win = dom.window;
  const doc = win.document;

  // --- All four discounts should stack: 10 (mix) + 10 (welcome) + 5 (crypto) + 15 (RUM266) = 40% ---
  doc.getElementById("o-promo").value = "RUM266";
  doc.getElementById("o-payment").value = "Bitcoin";
  const stacked = win.stackedDiscount(10, "RUM266", "Bitcoin");
  if (!stacked) {
    failures.push("promo.js: expected a stacked discount to apply, got null");
  } else {
    if (stacked.pct !== 40) {
      failures.push(`promo.js: expected combined 40% (10+10+5+15), got ${stacked.pct}%`);
    }
    if (stacked.discounts.length !== 4) {
      failures.push(`promo.js: expected 4 separate stacked discounts, got ${stacked.discounts.length}: ${JSON.stringify(stacked.discounts)}`);
    }
    const types = stacked.discounts.map((d) => d.type).sort();
    const expectedTypes = ["code", "crypto", "email", "mix"].sort();
    if (JSON.stringify(types) !== JSON.stringify(expectedTypes)) {
      failures.push(`promo.js: expected discount types ${JSON.stringify(expectedTypes)}, got ${JSON.stringify(types)}`);
    }
  }

  // --- Welcome auto-applies with NO code typed at all (case-insensitive match still works for real codes too) ---
  const noCodeTyped = win.stackedDiscount(1, "", "Cash App");
  if (!noCodeTyped || !noCodeTyped.discounts.some((d) => d.type === "email")) {
    failures.push("promo.js: welcome discount should auto-apply even with an empty promo code field, as long as the customer is eligible");
  }

  // --- Case-insensitive code matching ---
  const lowerCase = win.stackedDiscount(1, "rum266", "Cash App");
  if (!lowerCase || !lowerCase.discounts.some((d) => d.type === "code")) {
    failures.push("promo.js: promo code matching should be case-insensitive (lowercase 'rum266' should still match RUM266)");
  }

  // --- Cart summary should show multiple discount lines, not just one ---
  const discRowsEl = doc.getElementById("sum-discount-rows");
  const rowCount = (discRowsEl.innerHTML.match(/class="row"/g) || []).length;
  if (rowCount < 2) {
    failures.push(`cart.html: expected multiple discount lines in the summary when several discounts stack, found ${rowCount}`);
  }

  dom.window.close();
  return failures;
}

module.exports = { name: "stacked-discounts", run };
