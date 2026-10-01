// backend/netlify/functions/_mailer.js
// Shared email sender. Sends through the Titan mailbox (bought via
// name.com) over SMTP, replacing the old Resend API.
//
// Netlify environment variables:
//   SMTP_USER  - the full Titan mailbox address, e.g. contact@elementlabpeptides.com
//   SMTP_PASS  - that mailbox's password
//   SMTP_HOST  - optional, defaults to smtp.titan.email
//   SMTP_PORT  - optional, defaults to 465 (SSL). Use 587 for STARTTLS.
//   SMTP_FROM  - optional display sender, defaults to "ElementLab Peptides <SMTP_USER>"
//
// If SMTP_USER / SMTP_PASS are not set, emailEnabled() is false and the
// functions skip sending (forms still save to Supabase), same as before.
// Titan only lets you send FROM the authenticated mailbox (or an alias on
// it), so the From address always defaults to SMTP_USER.

let transport = null;

function emailEnabled() {
  return !!(process.env.SMTP_USER && process.env.SMTP_PASS);
}

function getTransport() {
  if (transport) return transport;
  const nodemailer = require("nodemailer");
  const port = Number(process.env.SMTP_PORT) || 465;
  transport = nodemailer.createTransport({
    host: process.env.SMTP_HOST || "smtp.titan.email",
    port,
    secure: port === 465,
    auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
    connectionTimeout: 8000,
    socketTimeout: 8000,
  });
  return transport;
}

// Tests inject a fake transport here so no real SMTP connection is made.
function setTransport(t) {
  transport = t;
}

// Never throws: returns { ok: true } on success, { ok: false, error } on
// failure (and logs the real SMTP error), so a mail problem can't turn a
// saved form/order into a failed request.
async function sendMail({ to, subject, html, text }) {
  try {
    await getTransport().sendMail({
      from: process.env.SMTP_FROM || `ElementLab Peptides <${process.env.SMTP_USER}>`,
      to,
      subject,
      html,
      text,
    });
    return { ok: true };
  } catch (err) {
    console.error(`SMTP error sending to ${Array.isArray(to) ? to.join(", ") : to}: ${err.message}`);
    return { ok: false, error: err.message };
  }
}

module.exports = { emailEnabled, sendMail, setTransport };
