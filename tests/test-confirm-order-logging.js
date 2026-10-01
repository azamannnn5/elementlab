// Guards the new `orders` table logging in confirm-order.js: every
// submitted order must be persisted to a real, structured database row -
// not just crammed as unstructured text into contact_messages (the
// previous behavior, which mixed real orders with actual contact form
// messages and had no error checking on the insert). Also confirms the
// order gets logged even in a run where the emails ultimately succeed,
// proving the log-before-email ordering doesn't accidentally get skipped.
const path = require("path");

async function run() {
  const failures = [];
  process.env.SUPABASE_URL = "https://fake-project.supabase.co";
  process.env.SUPABASE_SERVICE_ROLE_KEY = "fake-key";
  process.env.SMTP_USER = "contact@elementlabpeptides.com";
  process.env.SMTP_PASS = "fake-pass";

  require(require("path").join(__dirname, "..", "backend", "netlify", "functions", "_mailer.js")).setTransport({ sendMail: async () => ({}) });

  let ordersInsertBody = null;
  let ordersUpdateBody = null;
  global.fetch = async (url, opts = {}) => {
    const u = String(url);
    // Real Supabase/PostgREST returns a bare object (not an array) when
    // .single() is used - supabase-js signals this by sending
    // Accept: application/vnd.pgrst.object+json. A mock that always
    // returns an array regardless would make orderId always come back
    // undefined (data.id on an array is undefined), silently breaking
    // the whole "update emails_sent after sending" step without any
    // test failure pointing at the real cause - discovered exactly this
    // way while writing this test, see the debugging notes in chat.
    const wantsSingleObject = opts.headers && typeof opts.headers.get === "function"
      ? opts.headers.get("accept") === "application/vnd.pgrst.object+json"
      : opts.headers && opts.headers.accept === "application/vnd.pgrst.object+json";
    const respond = (rows, status = 200) => {
      const body = wantsSingleObject ? (rows[0] || null) : rows;
      return {
        ok: status < 300, status, json: async () => body, text: async () => JSON.stringify(body),
        headers: { get: () => "application/json" },
      };
    };
    if (u.includes("/rest/v1/orders") && opts.method === "POST") {
      ordersInsertBody = JSON.parse(opts.body);
      return respond([{ id: "fake-order-id-123" }], 201);
    }
    if (u.includes("/rest/v1/orders") && opts.method === "PATCH") {
      ordersUpdateBody = JSON.parse(opts.body);
      return respond([{ id: "fake-order-id-123" }]);
    }
    if (u.includes("/rest/v1/subscribers") && opts.method === "GET") return respond([]);
    if (u.includes("/rest/v1/subscribers")) return respond([{}]);
    if (u.includes("/rest/v1/settings")) return respond([{ contact_email: "contact@elementlabpeptides.com" }]);
    return respond([{}]);
  };

  const modulePath = path.join(__dirname, "..", "backend", "netlify", "functions", "confirm-order.js");
  delete require.cache[require.resolve(modulePath)];
  const { handler } = require(modulePath);

  const payload = {
    name: "Test User", email: "test@example.com", phone: "555-1234",
    address: "123 Test St", country: "US", payment: "Cash App", promoCode: null,
    items: "1 x BPC-157 (10mg) - $54.99",
    subtotalCents: 5499,
    discounts: [],
    usedWelcomeDiscount: false,
    shippingLabel: "Free",
    totalCents: 5499,
    total: "$54.99",
  };

  const res = await handler({ httpMethod: "POST", body: JSON.stringify(payload) });
  if (res.statusCode !== 200) {
    failures.push(`confirm-order.js: expected 200, got ${res.statusCode} - ${res.body}`);
  }

  if (!ordersInsertBody) {
    failures.push("confirm-order.js: no insert was made to the orders table - the order was never logged to the database, only emailed");
  } else {
    if (ordersInsertBody.email !== "test@example.com") failures.push(`confirm-order.js: orders insert has wrong email, got "${ordersInsertBody.email}"`);
    if (ordersInsertBody.total_cents !== 5499) failures.push(`confirm-order.js: orders insert has wrong total_cents, got ${ordersInsertBody.total_cents}`);
    if (ordersInsertBody.items !== payload.items) failures.push("confirm-order.js: orders insert is missing the items list");
  }

  if (!ordersUpdateBody) {
    failures.push("confirm-order.js: orders.emails_sent was never updated after a successful send");
  } else if (ordersUpdateBody.emails_sent !== true) {
    failures.push(`confirm-order.js: orders.emails_sent should be true after both emails succeed, got ${ordersUpdateBody.emails_sent}`);
  }

  delete process.env.SUPABASE_URL;
  delete process.env.SUPABASE_SERVICE_ROLE_KEY;
  delete process.env.SMTP_USER;
  delete process.env.SMTP_PASS;

  return failures;
}

module.exports = { name: "confirm-order-logging", run };
