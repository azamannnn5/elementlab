// Guards against the "invisible card" bug: any element with the .reveal
// fade-in class that gets created by a SECOND render pass (the live-data
// refresh after catalogReadyPromise resolves) must include .in as well,
// since the one-time scroll IntersectionObserver scan will never see it.
const { makeDom, delayedFetch, wait } = require("./helpers");

const liveDataThatReplacesContent = {
  categories: [{ slug: "test-cat", name: "Test Category", blurb: "x", image: null }],
  products: [
    {
      slug: "test-product", name: "Test Product", categories: ["test-cat"],
      appearance: "Powder", coverDose: "10mg", doses: [{ label: "10mg", priceCents: 1000 }],
      summary: "test", researchApplications: [], image: null, thinData: false,
      inStock: true,
    },
  ],
  combos: [],
  settings: null,
};

async function run() {
  const failures = [];

  // --- Homepage: category grid + featured products must survive a live-data refresh ---
  {
    const dom = makeDom("index.html", { fetchImpl: delayedFetch(liveDataThatReplacesContent, 100) });
    await wait(400); // let the delayed fetch resolve and the second render happen
    const doc = dom.window.document;
    const revealEls = doc.querySelectorAll(".cat-card.reveal, #home-combo-grid .reveal, #home-featured-grid .reveal");
    revealEls.forEach((el) => {
      if (!el.classList.contains("in")) {
        failures.push(`index.html: element with class "${el.className}" is a .reveal without .in (stuck invisible)`);
      }
    });
    dom.window.close();
  }

  return failures;
}

module.exports = { name: "reveal-visibility", run };
