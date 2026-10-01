// backend/netlify/functions/admin-inbox.js
// Protected read/update for the admin Inbox tab (/admin.html).
// GET  -> recent orders, contact messages and signups, plus unread counts.
//         Everything is stored in Supabase before any email is attempted, so
//         nothing is lost if an email never reaches the team inbox.
// POST -> { table: "orders" | "contact_messages", id, read: true|false }
//         or { table, all: true } to mark every unread item as read.
// Same auth pattern as the other admin-*.js functions - see _admin-auth.js.

const { createClient } = require("@supabase/supabase-js");
const { checkAdminAuth } = require("./_admin-auth");

let supabase = null;
if (process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY) {
  supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
}

const TABLES = ["orders", "contact_messages"];

exports.handler = async (event) => {
  const auth = checkAdminAuth(event);
  if (!auth.ok) return { statusCode: auth.statusCode, body: JSON.stringify({ error: auth.error }) };
  if (!supabase) {
    return { statusCode: 500, body: JSON.stringify({ error: "Supabase is not configured (missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY env var)" }) };
  }

  try {
    if (event.httpMethod === "GET") {
      const [orders, messages, subscribers] = await Promise.all([
        supabase.from("orders").select("*").order("created_at", { ascending: false }).limit(100),
        supabase.from("contact_messages").select("*").order("created_at", { ascending: false }).limit(100),
        supabase.from("subscribers").select("email, created_at").order("created_at", { ascending: false }).limit(100),
      ]);
      for (const r of [orders, messages, subscribers]) if (r.error) throw r.error;
      const unread = (rows) => (rows || []).filter((r) => !r.read_at).length;
      return {
        statusCode: 200,
        body: JSON.stringify({
          orders: orders.data || [],
          messages: messages.data || [],
          subscribers: subscribers.data || [],
          unread: { orders: unread(orders.data), messages: unread(messages.data) },
        }),
      };
    }

    if (event.httpMethod === "POST") {
      const body = JSON.parse(event.body || "{}");
      if (!TABLES.includes(body.table)) {
        return { statusCode: 400, body: JSON.stringify({ error: "table must be orders or contact_messages" }) };
      }
      let q;
      if (body.all) {
        q = supabase.from(body.table).update({ read_at: new Date().toISOString() }).is("read_at", null);
      } else {
        if (!body.id) return { statusCode: 400, body: JSON.stringify({ error: "id required" }) };
        q = supabase.from(body.table).update({ read_at: body.read === false ? null : new Date().toISOString() }).eq("id", body.id);
      }
      const { error } = await q;
      if (error) {
        const hint = /read_at/.test(error.message) ? " Run backend/migration-supplements-inbox.sql in the Supabase SQL editor first." : "";
        return { statusCode: 500, body: JSON.stringify({ error: error.message + hint }) };
      }
      return { statusCode: 200, body: JSON.stringify({ ok: true }) };
    }

    return { statusCode: 405, body: "Method Not Allowed" };
  } catch (err) {
    return { statusCode: 500, body: JSON.stringify({ error: err.message }) };
  }
};
