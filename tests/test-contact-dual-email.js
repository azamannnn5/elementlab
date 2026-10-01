// Guards the contact form's email flow: submitting a message should send
// TWO emails via Titan SMTP - one to the team inbox, one to the customer
// confirming their message was received. Previously only the team email
// existed; the customer got no confirmation at all.
const path = require("path");

async function run() {
  const failures = [];
  const mailCalls = [];
  require(require("path").join(__dirname, "..", "backend", "netlify", "functions", "_mailer.js")).setTransport({ sendMail: async (o) => { mailCalls.push(o); return {}; } });

  process.env.SMTP_USER = "contact@elementlabpeptides.com";
  process.env.SMTP_PASS = "fake-pass";
  delete process.env.SUPABASE_URL;
  delete process.env.SUPABASE_SERVICE_ROLE_KEY;

  global.fetch = async (url, opts = {}) => {
    return { ok: true, status: 200, json: async () => ({}) };
  };

  const modulePath = path.join(__dirname, "..", "backend", "netlify", "functions", "contact.js");
  delete require.cache[require.resolve(modulePath)];
  const { handler } = require(modulePath);

  const res = await handler({
    httpMethod: "POST",
    body: JSON.stringify({
      name: "Test User",
      email: "customer@example.com",
      org: "Test Org",
      message: "Do you have storage guidance for BPC-157?",
    }),
  });

  if (res.statusCode !== 200) {
    failures.push(`contact.js: expected 200, got ${res.statusCode} - ${res.body}`);
  }

  if (mailCalls.length !== 2) {
    failures.push(`contact.js: expected 2 emails (team + customer confirmation), saw ${mailCalls.length}`);
  } else {
    const toTeam = mailCalls.find((c) => c.to === "contact@elementlabpeptides.com");
    const toCustomer = mailCalls.find((c) => c.to === "customer@example.com");
    if (!toTeam) failures.push("contact.js: no email sent to the team inbox (contact@elementlabpeptides.com)");
    if (!toCustomer) failures.push("contact.js: no confirmation email sent to the customer - this was the actual bug being fixed");
    if (toCustomer && !/received|thanks/i.test(toCustomer.html || "")) {
      failures.push("contact.js: customer email doesn't look like a confirmation (missing expected wording)");
    }
  }

  delete process.env.SMTP_USER;
  delete process.env.SMTP_PASS;

  return failures;
}

module.exports = { name: "contact-dual-email", run };
