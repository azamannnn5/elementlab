// Guards the new settings fields: get-products.js must expose
// contactEmail, contactPhone, contactAddress, chatHours, and
// paymentMethods to the frontend, since that's what promo.js's
// applyLiveSettings() and cart.html's renderPaymentOptions() read from.
const path = require("path");

async function run() {
  const failures = [];

  process.env.SUPABASE_URL = "https://fake-project.supabase.co";
  process.env.SUPABASE_ANON_KEY = "fake-anon-key";

  const fakeSettingsRow = {
    mix_match_tiers: [], welcome_code: "WELCOME10", welcome_pct: 10,
    free_shipping_threshold_cents: 30000, crypto_discount_pct: 5, announcements: [],
    contact_email: "support@example.com",
    contact_phone: "+1 555-0100",
    contact_address: "123 Test St",
    chat_hours: "Mon-Fri 9am-6pm",
    payment_methods: ["Cash App", "Venmo"],
  };

  global.fetch = async (url) => {
    const u = String(url);
    const respond = (data) => ({ ok: true, status: 200, json: async () => data, text: async () => JSON.stringify(data), headers: { get: () => "application/json" } });
    if (u.includes("/rest/v1/settings")) return respond([fakeSettingsRow]);
    if (u.includes("/rest/v1/products")) return respond([]);
    if (u.includes("/rest/v1/categories")) return respond([]);
    if (u.includes("/rest/v1/bundles")) return respond([]);
    return respond({});
  };

  const modulePath = path.join(__dirname, "..", "backend", "netlify", "functions", "get-products.js");
  delete require.cache[require.resolve(modulePath)];
  const { handler } = require(modulePath);

  const res = await handler();
  if (res.statusCode !== 200) {
    failures.push(`get-products.js: expected 200, got ${res.statusCode} - ${res.body}`);
  } else {
    const body = JSON.parse(res.body);
    const s = body.settings;
    if (!s) {
      failures.push("get-products.js: no settings returned at all");
    } else {
      if (s.contactEmail !== "support@example.com") failures.push(`get-products.js: settings.contactEmail wrong, got "${s.contactEmail}"`);
      if (s.contactPhone !== "+1 555-0100") failures.push(`get-products.js: settings.contactPhone wrong, got "${s.contactPhone}"`);
      if (s.contactAddress !== "123 Test St") failures.push(`get-products.js: settings.contactAddress wrong, got "${s.contactAddress}"`);
      if (s.chatHours !== "Mon-Fri 9am-6pm") failures.push(`get-products.js: settings.chatHours wrong, got "${s.chatHours}"`);
      if (!Array.isArray(s.paymentMethods) || s.paymentMethods.length !== 2) failures.push(`get-products.js: settings.paymentMethods wrong, got ${JSON.stringify(s.paymentMethods)}`);
    }
  }

  delete process.env.SUPABASE_URL;
  delete process.env.SUPABASE_ANON_KEY;

  return failures;
}

module.exports = { name: "settings-live-data", run };
