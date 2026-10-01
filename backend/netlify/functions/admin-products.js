// backend/netlify/functions/admin-products.js
// Protected CRUD for the products table, used by /admin.html.
// POST   -> upsert (create or update) a product by slug
// DELETE -> remove a product by slug (?slug=xxx)
// Every request must include a correct x-admin-password header - see
// _admin-auth.js. Public reads go through get-products.js instead, which
// needs no password.

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
    if (event.httpMethod === "POST") {
      const p = JSON.parse(event.body || "{}");
      if (!p.slug || !p.name) {
        return { statusCode: 400, body: JSON.stringify({ error: "slug and name are required" }) };
      }
      const row = {
        slug: p.slug,
        name: p.name,
        categories: p.categories || [],
        appearance: p.appearance || null,
        cover_dose: p.coverDose || null,
        doses: p.doses || [],
        summary: p.summary || null,
        research_applications: p.researchApplications || [],
        image_url: p.image || null,
        sds_url: p.sds || null,
        chem_cas: (p.chem && p.chem.cas) || null,
        chem_formula: (p.chem && p.chem.formula) || null,
        chem_mw: (p.chem && p.chem.mw) || null,
        thin_data: !!p.thinData,
        in_stock: p.inStock !== false,
        updated_at: new Date().toISOString(),
      };
      const { error } = await supabase.from("products").upsert(row, { onConflict: "slug" });
      if (error) throw error;

      return { statusCode: 200, body: JSON.stringify({ ok: true }) };
    }

    if (event.httpMethod === "DELETE") {
      const slug = event.queryStringParameters && event.queryStringParameters.slug;
      if (!slug) return { statusCode: 400, body: JSON.stringify({ error: "slug query param required" }) };
      const { error } = await supabase.from("products").delete().eq("slug", slug);
      if (error) throw error;
      return { statusCode: 200, body: JSON.stringify({ ok: true }) };
    }

    return { statusCode: 405, body: "Method Not Allowed" };
  } catch (err) {
    return { statusCode: 500, body: JSON.stringify({ error: err.message }) };
  }
};
