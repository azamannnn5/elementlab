// Guards the new email-signup pop-up: must exist, must appear after age
// verification, and must never print the actual promo code anywhere in
// its markup or messages (code is only ever sent by email).
const { makeDom, wait } = require("./helpers");

async function run() {
  const failures = [];

  const dom = makeDom("index.html", {
    fetchImpl: async () => ({ ok: false, status: 404, json: async () => ({}) }),
    seedLocalStorage: { pf_age_verified: "true" }, // simulate a returning, age-verified visitor
  });
  await wait(1500); // popup has a 1.2s delayed show
  const doc = dom.window.document;

  const popup = doc.getElementById("promo-popup");
  if (!popup) {
    failures.push("promo-popup element is missing from the page");
  } else {
    if (popup.hidden) {
      failures.push("promo-popup should be visible ~1.2s after an age-verified visitor loads the page");
    }
    if (/welcome10/i.test(popup.innerHTML)) {
      failures.push("promo-popup markup reveals the promo code - it should never be shown in the UI, only sent by email");
    }
  }

  dom.window.close();
  return failures;
}

module.exports = { name: "promo-popup", run };
