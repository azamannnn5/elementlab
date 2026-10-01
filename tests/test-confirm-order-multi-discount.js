// Guards confirm-order.js's handling of the new discounts array (plural,
// replacing the old single discountLabel/discountCents), and the fix to
// how single-use enforcement is triggered - it used to check whether a
// promoCode was typed, which broke once welcome started auto-applying
// with no code at all. It's now driven by an explicit usedWelcomeDiscount
// flag sent from the frontend instead.
const path = require("path");

async function run() {
  const failures = [];
  process.env.SUPABASE_URL = "https://fake-project.supabase.co";
  process.env.SUPABASE_SERVICE_ROLE_KEY = "fake-key";
  process.env.SMTP_USER = "contact@elementlabpeptides.com";
  process.env.SMTP_PASS = "fake-pass";

  const mailCalls = [];
  require(require("path").join(__dirname, "..", "backend", "netlify", "functions", "_mailer.js")).setTransport({ sendMail: async (o) => { mailCalls.push(o); return {}; } });
  const subscriberUpserts = [];
  global.fetch = async (url, opts = {}) => {
    const u = String(url);
    const respond = (data, status = 200) => ({
      ok: status < 300, status, json: async () => data, text: async () => JSON.stringify(data),
      headers: { get: () => "application/json" },
    });
    if (u.includes("/rest/v1/subscribers") && opts.method === "GET") {
      return respond([]); // not previously used
    }
    if (u.includes("/rest/v1/subscribers") && (opts.method === "POST" || opts.method === "PATCH")) {
      subscriberUpserts.push(opts.body ? JSON.parse(opts.body) : null);
      return respond([{}]);
    }
    if (u.includes("/rest/v1/settings")) {
      return respond([{ contact_email: "contact@elementlabpeptides.com" }]);
    }
    if (u.includes("/rest/v1/contact_messages")) {
      return respond([{}]);
    }
    return respond({});
  };

  const modulePath = path.join(__dirname, "..", "backend", "netlify", "functions", "confirm-order.js");
  delete require.cache[require.resolve(modulePath)];
  const { handler } = require(modulePath);

  // Order with THREE stacked discounts, no promo code typed at all
  // (welcome + mix + crypto - matches a real case where welcome
  // auto-applies with an empty Promo Code field).
  const payload = {
    name: "Test User", email: "test@example.com", address: "123 St",
    country: "US", payment: "Bitcoin", promoCode: null,
    items: "10 x BPC-157 (10mg) - $549.90",
    subtotalCents: 54990,
    discounts: [
      { label: "Mix & Match (10 items)", cents: 5499 },
      { label: "First Order (Welcome Discount)", cents: 5499 },
      { label: "Crypto Payment", cents: 2750 },
    ],
    usedWelcomeDiscount: true,
    shippingLabel: "Free",
    totalCents: 41242,
    total: "$412.42",
  };

  const res = await handler({ httpMethod: "POST", body: JSON.stringify(payload) });
  if (res.statusCode !== 200) {
    failures.push(`confirm-order.js: expected 200, got ${res.statusCode} - ${res.body}`);
  }

  if (mailCalls.length !== 2) {
    failures.push(`confirm-order.js: expected 2 emails (customer + team), got ${mailCalls.length}`);
  } else {
    const customerEmail = mailCalls.find((c) => c.to === "test@example.com");
    const teamEmail = mailCalls.find((c) => c.to === "contact@elementlabpeptides.com");
    if (!customerEmail) failures.push("confirm-order.js: no email sent to the customer");
    if (!teamEmail) failures.push("confirm-order.js: no email sent to the team inbox");

    // All three discount lines must actually appear in the rendered HTML,
    // not just the total - this is the actual thing the client noticed
    // was missing before this round's fix.
    [customerEmail, teamEmail].forEach((email, i) => {
      if (!email) return;
      const label = i === 0 ? "customer" : "team";
      ["Mix & Match (10 items)", "First Order (Welcome Discount)", "Crypto Payment"].forEach((discountLabel) => {
        if (!email.html.includes(discountLabel)) {
          failures.push(`confirm-order.js: ${label} email is missing the "${discountLabel}" discount line`);
        }
      });
    });
  }

  // Since usedWelcomeDiscount was true, the subscribers table should have
  // been updated to mark it used - even though no promoCode was typed.
  if (subscriberUpserts.length === 0) {
    failures.push("confirm-order.js: usedWelcomeDiscount was true but no subscribers table update was made - single-use enforcement is broken for the no-code-typed case");
  }

  delete process.env.SUPABASE_URL;
  delete process.env.SUPABASE_SERVICE_ROLE_KEY;
  delete process.env.SMTP_USER;
  delete process.env.SMTP_PASS;

  return failures;
}

module.exports = { name: "confirm-order-multi-discount", run };
