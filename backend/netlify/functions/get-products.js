// backend/netlify/functions/get-products.js
// Public, read-only endpoint. Serves the live catalog (categories,
// products, bundles, promo settings) from Supabase, reshaped into the
// exact same property names js/products-data.js's static arrays use
// (coverDose, image, researchApplications, thinData, inStock,
// etc) so the frontend doesn't need two different data shapes.
//
// Called by js/products-data.js's loadLiveCatalog() on every page load.
// If Supabase isn't connected yet, or any of this fails, we return a
// non-200 response - the frontend's fetch call treats that as "keep using
// the static fallback data baked into products-data.js", which is the
// correct behavior before the backend is wired up.

const { createClient } = require("@supabase/supabase-js");

exports.handler = async () => {
  if (!process.env.SUPABASE_URL || !process.env.SUPABASE_ANON_KEY) {
    return { statusCode: 503, body: JSON.stringify({ error: "Supabase not configured yet" }) };
  }

  try {
    const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);

    const [{ data: categoriesRows, error: cErr }, { data: productsRows, error: pErr },
           { data: bundlesRows, error: bErr }, { data: settingsRows, error: sErr }] = await Promise.all([
      supabase.from("categories").select("*"),
      supabase.from("products").select("*"),
      supabase.from("bundles").select("*"),
      supabase.from("settings").select("*").eq("id", 1).limit(1),
    ]);
    if (cErr) throw cErr;
    if (pErr) throw pErr;
    if (bErr) throw bErr;
    if (sErr) throw sErr;

    const categories = (categoriesRows || []).map((c) => ({
      slug: c.slug,
      name: c.name,
      blurb: c.blurb,
      image: c.image_url,
    }));

    const products = (productsRows || []).map((p) => {
      return {
        slug: p.slug,
        name: p.name,
        categories: p.categories || [],
        appearance: p.appearance,
        coverDose: p.cover_dose,
        doses: p.doses || [],
        summary: p.summary,
        researchApplications: p.research_applications || [],
        image: p.image_url,
        sds: p.sds_url,
        chem: (p.chem_cas || p.chem_formula || p.chem_mw)
          ? { cas: p.chem_cas, formula: p.chem_formula, mw: p.chem_mw }
          : null,
        thinData: !!p.thin_data,
        inStock: p.in_stock !== false,
      };
    });

    const combos = (bundlesRows || []).map((b) => ({
      slug: b.slug,
      name: b.name,
      blurb: b.blurb,
      image: b.image_url,
      tiers: b.tiers || [],
    }));

    const s = (settingsRows && settingsRows[0]) || null;
    const settings = s
      ? {
          mixMatchTiers: s.mix_match_tiers,
          welcomeCode: s.welcome_code,
          welcomePct: s.welcome_pct,
          freeShippingThresholdCents: s.free_shipping_threshold_cents,
          cryptoDiscountPct: s.crypto_discount_pct,
          announcements: s.announcements,
          contactEmail: s.contact_email,
          contactPhone: s.contact_phone,
          contactAddress: s.contact_address,
          chatHours: s.chat_hours,
          paymentMethods: s.payment_methods,
          promoCodes: s.promo_codes,
          insulatedPackagingLabel: s.insulated_packaging_label,
          siteContent: s.site_content,
          faqs: s.faqs,
        }
      : null;

    return {
      statusCode: 200,
      headers: { "Content-Type": "application/json", "Cache-Control": "public, max-age=60" },
      body: JSON.stringify({ categories, products, combos, settings }),
    };
  } catch (err) {
    return { statusCode: 500, body: JSON.stringify({ error: err.message }) };
  }
};
