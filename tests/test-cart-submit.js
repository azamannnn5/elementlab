// Guards against a regression where re-rendering the cart page (immediate +
// live-data refresh) could double-bind the order-submit listener and fire
// submitOrder() more than once for a single click.
const { makeDom, delayedFetch, wait } = require("./helpers");

async function run() {
  const failures = [];

  const dom = makeDom("cart.html", {
    fetchImpl: delayedFetch({ categories: [], products: [], combos: [], settings: null }, 1500),
    seedLocalStorage: {
      pf_cart_v2: JSON.stringify([{ type: "product", slug: "bpc-157", dose: "10mg", qty: 1 }]),
    },
  });

  await wait(300);
  const doc = dom.window.document;
  const cartList = doc.getElementById("cart-list");
  if (!cartList || cartList.children.length === 0) {
    failures.push("cart.html: cart-list is empty at 300ms (should render instantly from localStorage + fallback data)");
  }

  await wait(2000); // let the slow fetch resolve and the refresh re-render happen

  const cartListAfter = doc.getElementById("cart-list");
  if (!cartListAfter || cartListAfter.children.length !== 1) {
    failures.push(`cart.html: expected 1 cart item after live-data refresh, found ${cartListAfter ? cartListAfter.children.length : "none"} (possible duplication)`);
  }

  let submitCalls = 0;
  dom.window.submitOrder = () => { submitCalls++; };
  const form = doc.getElementById("order-form");
  form.dispatchEvent(new dom.window.Event("submit", { bubbles: true, cancelable: true }));
  if (submitCalls !== 1) {
    failures.push(`cart.html: submitOrder called ${submitCalls} times for a single submit (expected exactly 1 - listener may be double-bound)`);
  }

  dom.window.close();
  return failures;
}

module.exports = { name: "cart-submit-safety", run };
