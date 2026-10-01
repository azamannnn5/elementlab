// backend/netlify/functions/confirm-order.js
// Sends TWO emails via the Titan mailbox (SMTP) when a customer submits an order:
//   1. A branded confirmation email to the customer.
//   2. The full order summary to the team inbox (contact@elementlabpeptides.com).
// Also does the real server-side single-use check on the welcome
// discount (subscribers.discount_used in Supabase) - the frontend's
// localStorage check only stops the same browser from reusing it;
// this is what actually stops the same email being reused across devices.
//
// Requires SMTP_USER and SMTP_PASS (see _mailer.js and backend/README.md). If they're not set, this
// function is a no-op that still returns 200 - the frontend calls it
// fire-and-forget and never blocks the on-page order confirmation on it.

const DEFAULT_TEAM_EMAIL = "contact@elementlabpeptides.com";
const BRAND_NAVY = "#082c42";
const BRAND_TEAL = "#2fb8c4";

const { emailEnabled, sendMail } = require("./_mailer");
let supabase = null;
if (process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY) {
  const { createClient } = require("@supabase/supabase-js");
  supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
}

// Admin-editable (Site Settings > Contact Info) - see contact.js for the
// same pattern. Changing the email in the admin panel actually changes
// where order notifications go, no redeploy needed.
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

function itemsListHtml(itemsText) {
  const lines = (itemsText || "").split("\n").filter(Boolean);
  return `<ul style="margin:0 0 18px; padding:0; list-style:none;">
    ${lines.map((line) => `<li style="padding:8px 0; border-bottom:1px solid #eef2f4; font-size:14px; color:${BRAND_NAVY};">${line}</li>`).join("")}
  </ul>`;
}

// Email clients (Gmail, Apple Mail, Outlook) ignore flexbox, which is what made
// labels and values run together. Two-column tables are the layout that renders
// everywhere: label on the left, value on the right.
function tableRow(label, value, { labelStyle = "", valueStyle = "", pad = "6px 0", border = "" } = {}) {
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="width:100%; border-collapse:collapse;${border ? ` border-bottom:${border};` : ""}">
    <tr>
      <td align="left" valign="top" style="padding:${pad}; padding-right:14px; text-align:left; white-space:nowrap; ${labelStyle}">${label}</td>
      <td align="right" valign="top" style="padding:${pad}; text-align:right; ${valueStyle}">${value}</td>
    </tr>
  </table>`;
}

function moneyRow(label, value, opts = {}) {
  const strike = opts.strike ? "text-decoration:line-through; color:#8a97a0;" : "";
  const color = opts.color || BRAND_NAVY;
  const weight = opts.bold ? "700" : "500";
  const size = opts.bold ? "16px" : "14px";
  return tableRow(label, value, {
    labelStyle: `font-size:${size}; color:${opts.bold ? BRAND_NAVY : "#5b6b74"};`,
    valueStyle: `font-size:${size}; color:${color}; font-weight:${weight}; ${strike}`,
  });
}

function customerEmailHtml({ name, items, subtotalCents, discounts, shippingLabel, totalDisplay, teamEmail }) {
  const money = (c) => `$${(c / 100).toFixed(2)}`;
  const hasDiscounts = discounts && discounts.length > 0;
  return emailShell(`
    <p style="color:${BRAND_TEAL}; font-weight:700; letter-spacing:0.5px; font-size:12px; text-transform:uppercase; margin:0 0 8px;">Order Received</p>
    <h1 style="color:${BRAND_NAVY}; font-size:22px; margin:0 0 16px;">Thanks, your order request is in</h1>
    <p style="color:#5b6b74; font-size:14px; line-height:1.6; margin:0 0 20px;">
      Hi ${name || "there"}, here's what we received. Our team will reach out within 24 hours to confirm final pricing, payment, and shipping - nothing has been charged yet.
    </p>
    ${itemsListHtml(items)}
    <div style="border-top:1px solid #eef2f4; padding-top:12px;">
      ${moneyRow("Subtotal", money(subtotalCents), { strike: hasDiscounts })}
      ${hasDiscounts ? discounts.map((d) => moneyRow(d.label, `-${money(d.cents)}`, { color: "#2e9e4f" })).join("") : ""}
      ${moneyRow("Shipping", shippingLabel)}
      ${moneyRow("Estimated Total", totalDisplay, { bold: true })}
    </div>
    <p style="color:#5b6b74; font-size:13px; line-height:1.6; margin:24px 0 0;">
      Questions in the meantime? Use the chat button on the site, reply to this email, or reach us at
      <a href="mailto:${teamEmail}" style="color:${BRAND_TEAL}; font-weight:600;">${teamEmail}</a>.
    </p>
  `);
}

function teamEmailHtml({ name, email, phone, address, country, payment, items, subtotalCents, discounts, shippingLabel, totalDisplay, promoWarning }) {
  const money = (c) => `$${(c / 100).toFixed(2)}`;
  const hasDiscounts = discounts && discounts.length > 0;
  const detailRow = (label, value) => tableRow(label, value || "-", {
    labelStyle: "font-size:13px; color:#8a97a0;",
    valueStyle: `font-size:13px; color:${BRAND_NAVY}; font-weight:600;`,
    pad: "7px 0", border: "1px solid #eef2f4",
  });
  return emailShell(`
    <p style="color:${BRAND_TEAL}; font-weight:700; letter-spacing:0.5px; font-size:12px; text-transform:uppercase; margin:0 0 8px;">New Order Request</p>
    <h1 style="color:${BRAND_NAVY}; font-size:22px; margin:0 0 16px;">${name || email} - ${totalDisplay}</h1>
    ${itemsListHtml(items)}
    <div style="border-top:1px solid #eef2f4; padding-top:12px; margin-bottom:20px;">
      ${moneyRow("Subtotal", money(subtotalCents), { strike: hasDiscounts })}
      ${hasDiscounts ? discounts.map((d) => moneyRow(d.label, `-${money(d.cents)}`, { color: "#2e9e4f" })).join("") : ""}
      ${moneyRow("Shipping", shippingLabel)}
      ${moneyRow("Estimated Total", totalDisplay, { bold: true })}
    </div>
    ${promoWarning ? `<p style="margin:0 0 16px; font-size:13px; font-weight:600; color:#b4542a; background:#fdf3ec; padding:10px 12px; border-radius:8px;">${promoWarning}</p>` : ""}
    ${detailRow("Name", name)}
    ${detailRow("Email", email)}
    ${detailRow("Phone", phone)}
    ${detailRow("Country", country === "US" ? "United States" : "Other (international)")}
    ${detailRow("Delivery Address", address)}
    ${detailRow("Payment Method", payment)}
  `);
}

exports.handler = async (event) => {
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: "Method Not Allowed" };
  }

  try {
    const {
      name, email, phone, address, country, payment, promoCode,
      items, subtotalCents, discounts, usedWelcomeDiscount,
      shippingCents, shippingLabel, totalCents, total,
    } = JSON.parse(event.body || "{}");

    if (!email || !items) {
      return { statusCode: 400, body: JSON.stringify({ error: "Email and order items required" }) };
    }

    // --- Server-side single-use enforcement for the welcome discount ---
    // Keyed off usedWelcomeDiscount (an explicit flag sent from cart.js
    // based on whether the welcome discount was actually one of the
    // stacked discounts on this order), not off promoCode - the welcome
    // discount auto-applies now and no longer requires typing any code
    // (see promo.js), so a typed promoCode may be a completely separate
    // thing (like RUM266) that has nothing to do with welcome eligibility.
    // The frontend's localStorage check only stops the same browser from
    // reusing it; this is what actually stops the same email across
    // devices. If Supabase isn't connected yet, skip validation silently
    // (matches the rest of the site's "fallback gracefully" pattern) -
    // the discount still shows on the order as submitted, just without
    // the extra cross-device guarantee.
    let promoWarning = null;
    if (supabase && usedWelcomeDiscount) {
      try {
        const { data: sub } = await supabase
          .from("subscribers")
          .select("discount_used")
          .eq("email", email)
          .maybeSingle();

        if (sub && sub.discount_used) {
          promoWarning = "This email has already used the welcome discount before - please verify before honoring it on this order.";
        } else {
          await supabase.from("subscribers").upsert(
            { email, discount_used: true },
            { onConflict: "email" }
          );
        }
      } catch (err) {
        console.error("Welcome discount single-use check failed (order still proceeds):", err.message);
      }
    }

    const totalDisplay = total || "TBD";
    const discountList = Array.isArray(discounts) ? discounts : [];

    // Log the order FIRST, before attempting either email - this is the
    // persistent record that survives even if the mail server has an outage or
    // the API key is wrong. Checks the actual insert result rather than
    // assuming it worked - supabase-js doesn't throw on a failed insert
    // (an RLS violation, a schema mismatch, etc), it just returns an
    // {error} field, so this must be checked explicitly or a failed
    // order log is just as invisible as the silent email failures were.
    let orderId = null;
    if (supabase) {
      const { data, error } = await supabase.from("orders").insert({
        name, email, phone, country, address,
        payment_method: payment,
        promo_code: promoCode || null,
        items,
        subtotal_cents: subtotalCents || 0,
        discounts: discountList,
        discount_cents: discountList.reduce((sum, d) => sum + (d.cents || 0), 0),
        shipping_label: shippingLabel || null,
        total_cents: totalCents || null,
      }).select("id").single();
      if (error) {
        console.error("Failed to log order to the orders table (continuing to send emails anyway):", error.message);
      } else {
        orderId = data.id;
      }
    }

    if (emailEnabled()) {
      const teamEmail = await getTeamEmail();
      const customerRes = await sendEmail({
        to: email,
        subject: "We've received your order - ElementLab Peptides",
        html: customerEmailHtml({
          name, items, subtotalCents: subtotalCents || 0, discounts: discountList,
          shippingLabel: shippingLabel || "-", totalDisplay, teamEmail,
        }),
        text: `Hi ${name || "there"},\n\nThanks for your order request. Here's what we received:\n\n${items}\n\nEstimated Total: ${totalDisplay}\n\nOur team will confirm final pricing, payment, and shipping with you directly by email.\n\n- ElementLab Peptides`,
      });

      const teamRes = await sendEmail({
        to: teamEmail,
        subject: `New order request - ${name || email} (${totalDisplay})`,
        html: teamEmailHtml({
          name, email, phone, address, country, payment, items,
          subtotalCents: subtotalCents || 0, discounts: discountList,
          shippingLabel: shippingLabel || "-", totalDisplay, promoWarning,
        }),
        text: `New order submitted.\n\n${items}\n\nEstimated Total: ${totalDisplay}\n\nCustomer: ${name || "-"}\nEmail: ${email}\nPhone: ${phone || "-"}\nCountry: ${country || "-"}\nDelivery Address: ${address || "-"}\nPayment Method: ${payment || "-"}${promoWarning ? `\n\nWARNING: ${promoWarning}` : ""}`,
      });

      if (supabase && orderId) {
        const failure = [customerRes, teamRes].find((r) => !r.ok);
        const status = {
          emails_sent: customerRes.ok && teamRes.ok,
          // Why an email failed - shown in the admin Inbox.
          email_error: failure ? (failure.error || "Email failed to send") : null,
        };
        let { error } = await supabase.from("orders").update(status).eq("id", orderId);
        if (error) {
          // Database not migrated yet (no email_error column): still record emails_sent.
          ({ error } = await supabase.from("orders").update({ emails_sent: status.emails_sent }).eq("id", orderId));
        }
        if (error) console.error("Failed to update orders.emails_sent:", error.message);
      }
    } else if (supabase && orderId) {
      try {
        await supabase.from("orders").update({ email_error: "Email is not set up (SMTP_USER / SMTP_PASS missing in Netlify)" }).eq("id", orderId);
      } catch (e) { /* column not added yet */ }
    }

    return { statusCode: 200, body: JSON.stringify({ ok: true }) };
  } catch (err) {
    // Never surface this as a failure to the customer - the on-page
    // confirmation is what they see regardless of email delivery status.
    return { statusCode: 200, body: JSON.stringify({ ok: false, error: err.message }) };
  }
};
