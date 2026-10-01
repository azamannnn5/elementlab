// Guards the payment dropdown being admin-editable: it must render from
// window.LIVE_SETTINGS.paymentMethods once live data loads, not just the
// hardcoded DEFAULT_PAYMENT_METHODS list forever.
const { makeDom, delayedFetch, wait } = require("./helpers");

async function run() {
  const failures = [];

  const dom = makeDom("cart.html", {
    fetchImpl: delayedFetch({
      categories: [], products: [], combos: [],
      settings: {
        mixMatchTiers: [], welcomeCode: "WELCOME10", welcomePct: 10,
        freeShippingThresholdCents: 30000, cryptoDiscountPct: 5, announcements: [],
        paymentMethods: ["Venmo", "PayPal"],
      },
    }, 50),
  });
  await wait(300);
  const doc = dom.window.document;

  const select = doc.getElementById("o-payment");
  if (!select) {
    failures.push("cart.html: #o-payment select is missing");
  } else {
    const optionValues = Array.from(select.options).map((o) => o.value).filter(Boolean);
    if (!optionValues.includes("Venmo") || !optionValues.includes("PayPal")) {
      failures.push(`cart.html: payment dropdown should reflect live settings' paymentMethods (Venmo, PayPal), got ${JSON.stringify(optionValues)}`);
    }
    if (optionValues.includes("Cash App")) {
      failures.push("cart.html: payment dropdown still shows the hardcoded default (Cash App) instead of switching to live settings");
    }
  }

  dom.window.close();
  return failures;
}

module.exports = { name: "payment-dropdown-live", run };
