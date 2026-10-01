// Guards against the "blank page on cold start" bug: every page that shows
// catalog data must render immediately from the bundled fallback data,
// never wait on the network for first paint.
const { makeDom, delayedFetch, hangingFetch, wait } = require("./helpers");

async function run() {
  const failures = [];

  // --- Homepage: content must appear before a slow (2.5s) fetch resolves ---
  {
    const dom = makeDom("index.html", {
      fetchImpl: delayedFetch({ categories: [], products: [], combos: [], settings: null }, 2500),
    });
    await wait(200);
    const doc = dom.window.document;
    for (const id of ["home-featured-grid", "home-payment-chips"]) {
      const el = doc.getElementById(id);
      if (!el || el.children.length === 0) {
        failures.push(`index.html #${id} is empty at 200ms (should render instantly from fallback data)`);
      }
    }
    // NOTE: intentionally not closing this window here - its fetch mock
    // resolves at 2500ms, well after this test moves on. Closing early
    // tears down `document`, so that later callback would throw when it
    // fires (noisy but harmless - Node's timers keep running regardless of
    // which test is "current"). Leaving it open lets it resolve naturally;
    // process.exit() in the runner cleans everything up either way.
  }

  // --- Homepage: must never hang, even if the backend never responds at all ---
  {
    const dom = makeDom("index.html", { fetchImpl: hangingFetch() });
    await wait(200);
    const doc = dom.window.document;
    const grid = doc.getElementById("home-featured-grid");
    if (!grid || grid.children.length === 0) {
      failures.push("index.html home-featured-grid is empty when backend fetch hangs forever");
    }
    dom.window.close();
  }

  // --- Shop page ---
  {
    const dom = makeDom("shop.html", { fetchImpl: hangingFetch() });
    await wait(200);
    const grid = dom.window.document.getElementById("shop-grid");
    if (!grid || grid.children.length === 0) {
      failures.push("shop.html shop-grid is empty when backend fetch hangs forever");
    }
    dom.window.close();
  }

  // --- Product page ---
  {
    const dom = makeDom("product.html", { fetchImpl: hangingFetch(), urlPath: "product.html?slug=bpc-157" });
    await wait(200);
    const root = dom.window.document.getElementById("product-root");
    if (!root || !root.innerHTML.trim()) {
      failures.push("product.html product-root is empty when backend fetch hangs forever");
    }
    dom.window.close();
  }

  return failures;
}

module.exports = { name: "instant-render", run };
