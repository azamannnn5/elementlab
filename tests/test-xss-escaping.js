// Guards the structural-safety fix: any admin-editable text field (product
// name, summary, category blurb, etc.) must never be interpreted as real
// HTML on the live site, even if it contains something that looks like a
// tag. This is what makes it safe for a non-technical admin to paste text
// into the panel without any risk of breaking page layout or, worse,
// injecting a script.
const { makeDom, delayedFetch, wait } = require("./helpers");

const MALICIOUS_NAME = '<img src=x onerror=alert(1)>Evil Product';
const MALICIOUS_SUMMARY = '<script>window.__pwned = true;</script>Look here';

async function run() {
  const failures = [];

  const dom = makeDom("shop.html", {
    fetchImpl: delayedFetch({
      categories: [{ slug: "test-cat", name: "Test Category", blurb: "x", image: null }],
      products: [
        {
          slug: "evil-product", name: MALICIOUS_NAME, categories: ["test-cat"],
          appearance: "Powder", coverDose: "10mg", doses: [{ label: "10mg", priceCents: 1000 }],
          summary: MALICIOUS_SUMMARY, researchApplications: [], image: null, thinData: false,
          inStock: true,
        },
      ],
      combos: [], settings: null,
    }, 50),
  });
  await wait(300);
  const doc = dom.window.document;

  // If escaping failed, the <img onerror=...> tag would have been parsed
  // as a real element and actually be present in the DOM as an <img>.
  const injectedImg = doc.querySelector('img[onerror]');
  if (injectedImg) {
    failures.push("shop.html: a malicious product name was rendered as real HTML (found an <img onerror> element in the DOM) - escaping is not working");
  }

  // The literal text should still be visible on the page (as text, not markup).
  const grid = doc.getElementById("shop-grid");
  const gridText = grid ? grid.textContent : "";
  if (!gridText.includes("Evil Product")) {
    failures.push("shop.html: the product name text itself should still appear on the page (just as plain text, not markup)");
  }

  dom.window.close();
  return failures;
}

module.exports = { name: "xss-escaping", run };
