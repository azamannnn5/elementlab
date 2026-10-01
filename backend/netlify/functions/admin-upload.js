// backend/netlify/functions/admin-upload.js
// Handles file uploads from the admin panel (product photos, SDS PDFs,
// SDS PDFs) - uploads to the "product-files" Supabase Storage
// bucket (see backend/schema.sql) and returns the public URL, which the
// admin panel then saves onto the product row like any other field.
//
// This is what makes "add a whole new product, photo and all, with no
// redeploy" actually work - before this, the image/SDS fields were
// just text boxes where you typed a path to a file that had to already
// exist in the deployed site's assets folder.
//
// Body: { filename, folder, contentBase64, contentType }
//   folder is restricted to a known set (see ALLOWED_FOLDERS below) so
//   uploads always land somewhere sane and predictable, not user-chosen.
// Response: { url }

const { createClient } = require("@supabase/supabase-js");
const { checkAdminAuth } = require("./_admin-auth");

const BUCKET = "product-files";
const ALLOWED_FOLDERS = new Set(["products", "combos", "sds"]);
const MAX_BYTES = 8 * 1024 * 1024; // 8MB - generous for a product photo or an SDS PDF, well under the free-tier 1GB total
const ALLOWED_CONTENT_TYPES = new Set([
  "image/jpeg", "image/png", "image/webp", "image/gif",
  "application/pdf",
]);

let supabase = null;
if (process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY) {
  supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
}

function safeFilename(name) {
  // Strips anything that isn't a letter, number, dot, or hyphen, so the
  // resulting storage path can't escape its folder or collide with
  // control characters - admin-only input, but no reason to trust it blindly.
  return String(name || "file")
    .toLowerCase()
    .replace(/[^a-z0-9.\-]/g, "-")
    .replace(/-+/g, "-")
    .slice(-120); // keep it short, avoids overly long storage keys
}

exports.handler = async (event) => {
  const auth = checkAdminAuth(event);
  if (!auth.ok) return { statusCode: auth.statusCode, body: JSON.stringify({ error: auth.error }) };
  if (!supabase) {
    return { statusCode: 500, body: JSON.stringify({ error: "Supabase is not configured (missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY env var)" }) };
  }
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: "Method Not Allowed" };
  }

  try {
    const { filename, folder, contentBase64, contentType } = JSON.parse(event.body || "{}");

    if (!ALLOWED_FOLDERS.has(folder)) {
      return { statusCode: 400, body: JSON.stringify({ error: `folder must be one of: ${[...ALLOWED_FOLDERS].join(", ")}` }) };
    }
    if (!ALLOWED_CONTENT_TYPES.has(contentType)) {
      return { statusCode: 400, body: JSON.stringify({ error: "Only JPEG/PNG/WEBP/GIF images or PDF files are allowed" }) };
    }
    if (!contentBase64) {
      return { statusCode: 400, body: JSON.stringify({ error: "No file content provided" }) };
    }

    const buffer = Buffer.from(contentBase64, "base64");
    if (buffer.length > MAX_BYTES) {
      return { statusCode: 400, body: JSON.stringify({ error: `File too large - max ${MAX_BYTES / 1024 / 1024}MB` }) };
    }

    // Prefix with a timestamp so re-uploading a file with the same name
    // (e.g. replacing a product photo) doesn't silently overwrite the old
    // one before the admin has confirmed the new one looks right, and so
    // the public URL always changes when the file changes (avoids stale
    // browser/CDN caching showing the old version at the same URL).
    const key = `${folder}/${Date.now()}-${safeFilename(filename)}`;

    const { error } = await supabase.storage
      .from(BUCKET)
      .upload(key, buffer, { contentType, upsert: false });
    if (error) throw error;

    const { data: publicUrlData } = supabase.storage.from(BUCKET).getPublicUrl(key);

    return { statusCode: 200, body: JSON.stringify({ url: publicUrlData.publicUrl, path: key }) };
  } catch (err) {
    return { statusCode: 500, body: JSON.stringify({ error: err.message }) };
  }
};
