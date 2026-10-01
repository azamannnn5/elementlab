// backend/netlify/functions/contact.js
// Stores contact-form submissions and sends TWO emails via the Titan mailbox (SMTP):
//   1. To the team inbox (contact@elementlabpeptides.com) with the message.
//   2. A branded confirmation to the customer, confirming their message
//      was received - matches the pattern used for order confirmations
//      (confirm-order.js) and the promo signup email (subscribe.js).
//
// Requires SMTP_USER and SMTP_PASS (see _mailer.js). If they're not set, this function still stores
// the message (when Supabase is configured) and returns 200 - email
// sending is optional, not a hard requirement.

const { emailEnabled, sendMail } = require("./_mailer");

const DEFAULT_TEAM_EMAIL = "contact@elementlabpeptides.com";
const BRAND_NAVY = "#082c42";
const BRAND_TEAL = "#2fb8c4";

let supabase = null;
if (process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY) {
  const { createClient } = require("@supabase/supabase-js");
  supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
}

// The contact/support email is admin-editable (Site Settings > Contact
// Info), so this always checks the live settings row instead of hardcoding
// the address - changing it in the admin panel actually changes where
// contact form notifications get sent, with no redeploy needed.
async function getTeamEmail() {
  if (!supabase) return DEFAULT_TEAM_EMAIL;
  try {
    const { data } = await supabase.from("settings").select("contact_email").eq("id", 1).maybeSingle();
    return (data && data.contact_email) || DEFAULT_TEAM_EMAIL;
  } catch (err) {
    console.error("getTeamEmail failed, using default:", err.message);
    return DEFAULT_TEAM_EMAIL;
  }
}

async function sendEmail({ to, subject, html, text }) {
  return sendMail({ to, subject, html, text });
}

function emailShell(bodyHtml) {
  return `
  <div style="background:#f3f6f8; padding:32px 16px; font-family:-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;">
    <div style="max-width:520px; margin:0 auto; background:#ffffff; border-radius:14px; overflow:hidden; border:1px solid #e3e9ec;">
      <div style="background:${BRAND_NAVY}; padding:22px 28px;">
        <span style="color:#ffffff; font-size:18px; font-weight:800; letter-spacing:0.3px;">ElementLab Peptides</span>
      </div>
      <div style="padding:28px;">
        ${bodyHtml}
      </div>
      <div style="padding:18px 28px; background:#f8fafb; border-top:1px solid #e3e9ec; font-size:12px; color:#8a97a0;">
        ElementLab Peptides &middot; Peptides are for research use only; supplements are food supplements for adults 18+ &middot; contact@elementlabpeptides.com
      </div>
    </div>
  </div>`;
}

function customerEmailHtml({ name, message, teamEmail }) {
  return emailShell(`
    <p style="color:${BRAND_TEAL}; font-weight:700; letter-spacing:0.5px; font-size:12px; text-transform:uppercase; margin:0 0 8px;">Message Received</p>
    <h1 style="color:${BRAND_NAVY}; font-size:22px; margin:0 0 16px;">We've got your message</h1>
    <p style="color:#5b6b74; font-size:14px; line-height:1.6; margin:0 0 20px;">
      Hi ${name || "there"}, thanks for reaching out. Our team will reply shortly, usually within 1-2 business days.
    </p>
    <div style="border-top:1px solid #eef2f4; padding-top:16px;">
      <p style="font-size:12px; color:#8a97a0; text-transform:uppercase; letter-spacing:0.4px; margin:0 0 8px;">Your message</p>
      <p style="font-size:14px; color:${BRAND_NAVY}; white-space:pre-wrap; margin:0;">${escapeHtml(message)}</p>
    </div>
    <p style="color:#5b6b74; font-size:13px; line-height:1.6; margin:24px 0 0;">
      Need something sooner? Use the chat button on the site, reply to this email, or reach us at
      <a href="mailto:${teamEmail}" style="color:${BRAND_TEAL}; font-weight:600;">${teamEmail}</a>.
    </p>
  `);
}

function teamEmailHtml({ name, email, org, product_slug, message }) {
  // Two-column table rows: email clients ignore flexbox (labels and values ran together).
  const detailRow = (label, value) => `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="width:100%; border-collapse:collapse; border-bottom:1px solid #eef2f4;">
    <tr>
      <td align="left" valign="top" style="padding:7px 14px 7px 0; text-align:left; white-space:nowrap; font-size:13px; color:#8a97a0;">${label}</td>
      <td align="right" valign="top" style="padding:7px 0; text-align:right; font-size:13px; color:${BRAND_NAVY}; font-weight:600;">${value || "-"}</td>
    </tr>
  </table>`;
  return emailShell(`
    <p style="color:${BRAND_TEAL}; font-weight:700; letter-spacing:0.5px; font-size:12px; text-transform:uppercase; margin:0 0 8px;">Website Contact</p>
    <h1 style="color:${BRAND_NAVY}; font-size:20px; margin:0 0 16px;">New message from ${escapeHtml(name || email)}</h1>
    ${detailRow("Name", escapeHtml(name || "Not provided"))}
    ${detailRow("Email", escapeHtml(email))}
    ${detailRow("Organization", escapeHtml(org || "Not provided"))}
    ${detailRow("Product", escapeHtml(product_slug || "Not provided"))}
    <p style="font-size:14px; color:${BRAND_NAVY}; white-space:pre-wrap; border-top:1px solid #eef2f4; padding-top:16px; margin-top:16px;">${escapeHtml(message)}</p>
  `);
}

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

exports.handler = async (event) => {
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: "Method Not Allowed" };
  }

  try {
    const { name, email, org, message, product_slug } = JSON.parse(event.body || "{}");
    if (!email || !message) {
      return { statusCode: 400, body: JSON.stringify({ error: "Email and message required" }) };
    }

    let messageId = null;
    if (supabase) {
      const { data, error } = await supabase
        .from("contact_messages")
        .insert({ name, email, org, message, product_slug: product_slug || null })
        .select("id")
        .maybeSingle();
      if (error) throw error;
      messageId = data && data.id;
    }

    if (emailEnabled()) {
      const teamEmail = await getTeamEmail();
      const results = await Promise.all([
        sendEmail({
          to: teamEmail,
          subject: `New contact form message from ${name || email}`,
          html: teamEmailHtml({ name, email, org, product_slug, message }),
          text: `From: ${name || "N/A"} <${email}>\nOrg: ${org || "N/A"}\nProduct: ${product_slug || "N/A"}\n\n${message}`,
        }),
        sendEmail({
          to: email,
          subject: "We've received your message - ElementLab Peptides",
          html: customerEmailHtml({ name, message, teamEmail }),
          text: `Hi ${name || "there"},\n\nThanks for reaching out. Our team will reply shortly, usually within 1-2 business days.\n\nYour message:\n${message}\n\n- ElementLab Peptides`,
        }),
      ]);
      if (supabase && messageId) {
        const failure = results.find((r) => r && r.ok === false);
        try {
          await supabase.from("contact_messages").update({
            emails_sent: !failure,
            email_error: failure ? (failure.error || "Email failed to send") : null,
          }).eq("id", messageId);
        } catch (e) { /* columns not added yet */ }
      }
    } else if (supabase && messageId) {
      try {
        await supabase.from("contact_messages").update({
          emails_sent: false,
          email_error: "Email is not set up (SMTP_USER / SMTP_PASS missing in Netlify)",
        }).eq("id", messageId);
      } catch (e) { /* columns not added yet */ }
    }

    return { statusCode: 200, body: JSON.stringify({ ok: true }) };
  } catch (err) {
    return { statusCode: 500, body: JSON.stringify({ error: err.message }) };
  }
};
