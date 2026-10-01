// backend/netlify/functions/admin-categories.js
// Protected CRUD for the categories table, used by /admin.html.
// POST   -> upsert (create or update) a category by slug
// DELETE -> remove a category by slug (?slug=xxx)
// Same auth pattern as admin-products.js - see _admin-auth.js. Public
// reads go through get-products.js instead, which needs no password.

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
      const c = JSON.parse(event.body || "{}");
      if (!c.slug || !c.name) {
        return { statusCode: 400, body: JSON.stringify({ error: "slug and name are required" }) };
      }
      const row = { slug: c.slug, name: c.name, blurb: c.blurb || null, image_url: c.image || null };
      const { error } = await supabase.from("categories").upsert(row, { onConflict: "slug" });
      if (error) throw error;
      return { statusCode: 200, body: JSON.stringify({ ok: true }) };
    }

    if (event.httpMethod === "DELETE") {
      const slug = event.queryStringParameters && event.queryStringParameters.slug;
      if (!slug) return { statusCode: 400, body: JSON.stringify({ error: "slug query param required" }) };
      const { error } = await supabase.from("categories").delete().eq("slug", slug);
      if (error) throw error;
      return { statusCode: 200, body: JSON.stringify({ ok: true }) };
    }

    return { statusCode: 405, body: "Method Not Allowed" };
  } catch (err) {
    return { statusCode: 500, body: JSON.stringify({ error: err.message }) };
  }
};
