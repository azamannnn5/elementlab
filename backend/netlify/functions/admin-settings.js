// backend/netlify/functions/admin-settings.js
// Protected read/write for the settings singleton row (promo config +
// announcement bar messages), used by /admin.html.
// GET  -> current settings (admin panel pre-fills its form with this)
// POST -> update settings
// Same auth pattern as admin-products.js - see _admin-auth.js. Public
// storefront reads settings via get-products.js instead, which needs no
// password.

const { createClient } = require("@supabase/supabase-js");
const { checkAdminAuth } = require("./_admin-auth");

let supabase = null;
if (process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY) {
  supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
}

exports.handler = async (event) => {
  const auth = checkAdminAuth(event);
  if (!auth.ok) return { statusCode: auth.statusCode, body: JSON.stringify({ error: auth.error }) };
  if (!supabase) {
    return { statusCode: 500, body: JSON.stringify({ error: "Supabase is not configured (missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY env var)" }) };
  }

  try {
    if (event.httpMethod === "GET") {
      const { data, error } = await supabase.from("settings").select("*").eq("id", 1).limit(1);
      if (error) throw error;
      return { statusCode: 200, body: JSON.stringify({ settings: (data && data[0]) || null }) };
    }

    if (event.httpMethod === "POST") {
      const s = JSON.parse(event.body || "{}");

      // site_content holds FOUR sections (home/about/delivery/footer) in
      // one jsonb column. The admin panel saves one section at a time, so
      // a save here must MERGE the submitted section(s) into whatever is
      // already stored, not replace the whole column - otherwise saving
      // Homepage would silently wipe About/Delivery/Footer. Undefined
      // fields elsewhere in `row` below are simply omitted from the
      // upsert payload (see note above the return), which is what makes
      // every other section-by-section save safe already.
      let siteContent = s.siteContent;
      if (siteContent !== undefined) {
        const { data: existingRows, error: readErr } = await supabase.from("settings").select("site_content").eq("id", 1).limit(1);
        if (readErr) throw readErr;
        const existing = (existingRows && existingRows[0] && existingRows[0].site_content) || {};
        siteContent = Object.assign({}, existing, siteContent);
      }

      // Every key below is left OUT of the object entirely when the
      // matching field wasn't sent (rather than coerced to null/[]/{}),
      // so JSON.stringify() drops it and Supabase's upsert leaves that
      // column untouched. This is what lets each admin section save
      // independently without clobbering the others sharing this same
      // single settings row.
      const row = { id: 1, updated_at: new Date().toISOString() };
      if (s.mixMatchTiers !== undefined) row.mix_match_tiers = s.mixMatchTiers;
      if (s.welcomeCode !== undefined) row.welcome_code = s.welcomeCode;
      if (s.welcomePct !== undefined) row.welcome_pct = s.welcomePct;
      if (s.freeShippingThresholdCents !== undefined) row.free_shipping_threshold_cents = s.freeShippingThresholdCents;
      if (s.cryptoDiscountPct !== undefined) row.crypto_discount_pct = s.cryptoDiscountPct;
      if (s.announcements !== undefined) row.announcements = s.announcements;
      if (s.contactEmail !== undefined) row.contact_email = s.contactEmail;
      if (s.contactPhone !== undefined) row.contact_phone = s.contactPhone;
      if (s.contactAddress !== undefined) row.contact_address = s.contactAddress;
      if (s.chatHours !== undefined) row.chat_hours = s.chatHours;
      if (s.paymentMethods !== undefined) row.payment_methods = s.paymentMethods;
      if (s.promoCodes !== undefined) row.promo_codes = s.promoCodes;
      if (s.insulatedPackagingLabel !== undefined) row.insulated_packaging_label = s.insulatedPackagingLabel;
      if (siteContent !== undefined) row.site_content = siteContent;
      if (s.faqs !== undefined) row.faqs = s.faqs;

      const { error } = await supabase.from("settings").upsert(row, { onConflict: "id" });
      if (error) throw error;
      return { statusCode: 200, body: JSON.stringify({ ok: true }) };
    }

    return { statusCode: 405, body: "Method Not Allowed" };
  } catch (err) {
    return { statusCode: 500, body: JSON.stringify({ error: err.message }) };
  }
};
