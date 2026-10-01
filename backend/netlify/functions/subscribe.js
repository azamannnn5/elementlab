// backend/netlify/functions/subscribe.js
// Adds an email to the subscribers table and sends a welcome email (via the Titan mailbox, SMTP)
// confirming their first-order discount.
//
// IMPORTANT: the welcome discount auto-applies at checkout now - it's
// no longer a code the customer has to type in (see js/promo.js for
// why: the cart only has one Promo Code field, and the business wants
// that field free for OTHER codes like RUM266/LUXPD to stack alongside
// welcome on the same order). This email used to tell customers "use
// code WELCOME10 at checkout" - that's now wrong and would confuse
// customers who type it and see no matching line, since nothing checks
// that string anymore. This version just confirms the discount is
// already active for their first order, no code needed.
//
// The percentage shown here always reflects whatever is currently set
// in the admin panel (Site Settings > Welcome Discount %) - falls back
// to 10% if Supabase isn't connected yet or no row exists.

const DEFAULT_PROMO_PCT = 10;
const BRAND_NAVY = "#082c42";
const BRAND_TEAL = "#2fb8c4";

const { emailEnabled, sendMail } = require("./_mailer");
let supabase = null;
if (process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY) {
  const { createClient } = require("@supabase/supabase-js");
  supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
}

async function getWelcomePct() {
  if (!supabase) return DEFAULT_PROMO_PCT;
  try {
    const { data } = await supabase.from("settings").select("welcome_pct").eq("id", 1).maybeSingle();
    return data && data.welcome_pct != null ? data.welcome_pct : DEFAULT_PROMO_PCT;
  } catch (err) {
    console.error("getWelcomePct failed, using default:", err.message);
    return DEFAULT_PROMO_PCT;
  }
}

function promoEmailHtml(pct) {
  return `
  <div style="background:#f3f6f8; padding:32px 16px; font-family:-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;">
    <div style="max-width:480px; margin:0 auto; background:#ffffff; border-radius:14px; overflow:hidden; border:1px solid #e3e9ec;">
      <div style="background:${BRAND_NAVY}; padding:22px 28px;">
        <span style="color:#ffffff; font-size:18px; font-weight:800; letter-spacing:0.3px;">ElementLab Peptides</span>
      </div>
      <div style="padding:32px 28px; text-align:center;">
        <p style="color:${BRAND_TEAL}; font-weight:700; letter-spacing:0.5px; font-size:12px; text-transform:uppercase; margin:0 0 10px;">Welcome</p>
        <h1 style="color:${BRAND_NAVY}; font-size:24px; margin:0 0 14px;">Here's your ${pct}% off</h1>
        <p style="color:#5b6b74; font-size:14px; line-height:1.6; margin:0 0 24px;">
          Thanks for signing up. Your ${pct}% first-order discount is already active on this device - no code needed, it'll be applied automatically at checkout.
        </p>
        <p style="color:#8a97a0; font-size:12px; margin:0 0 24px;">Valid on your first order only. One use per customer.</p>
        <a href="https://elementlabpeptides.com/shop.html" style="display:inline-block; background:${BRAND_NAVY}; color:#ffffff; text-decoration:none; font-weight:700; font-size:14px; padding:12px 28px; border-radius:8px;">Start Shopping</a>
      </div>
      <div style="padding:18px 28px; background:#f8fafb; border-top:1px solid #e3e9ec; font-size:12px; color:#8a97a0; text-align:center;">
        ElementLab Peptides &middot; Peptides are for research use only; supplements are food supplements for adults 18+ &middot; contact@elementlabpeptides.com
      </div>
    </div>
  </div>`;
}

async function sendPromoEmail(email, pct) {
  return sendMail({
    to: email,
    subject: `Your ${pct}% off is ready - ElementLab Peptides`,
    html: promoEmailHtml(pct),
    text: `Thanks for signing up! Your ${pct}% first-order discount is already active - no code needed, it applies automatically at checkout at elementlabpeptides.com. Valid on your first order only, one use per customer.`,
  });
}

exports.handler = async (event) => {
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: "Method Not Allowed" };
  }

  try {
    const { email } = JSON.parse(event.body || "{}");
    if (!email || !/^\S+@\S+\.\S+$/.test(email)) {
      return { statusCode: 400, body: JSON.stringify({ error: "Valid email required" }) };
    }

    if (supabase) {
      const { error } = await supabase
        .from("subscribers")
        .upsert({ email, promo_opt_in: true }, { onConflict: "email", ignoreDuplicates: true });
      if (error) throw error;
    }

    if (emailEnabled()) {
      const pct = await getWelcomePct();
      await sendPromoEmail(email, pct);
    }

    return { statusCode: 200, body: JSON.stringify({ ok: true }) };
  } catch (err) {
    return { statusCode: 500, body: JSON.stringify({ error: err.message }) };
  }
};
