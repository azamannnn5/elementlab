// Guards the new file upload function: must require admin auth, restrict
// uploads to known folders, restrict file types/size, and on success
// actually call Supabase Storage and return a public URL.
const path = require("path");

async function run() {
  const failures = [];

  process.env.SUPABASE_URL = "https://fake-project.supabase.co";
  process.env.SUPABASE_SERVICE_ROLE_KEY = "fake-service-key";
  process.env.ADMIN_PASSWORD = "test-password-123";

  const storageCalls = [];
  global.fetch = async (url, opts = {}) => {
    const u = String(url);
    storageCalls.push({ url: u, method: opts.method });
    if (u.includes("/storage/v1/object/product-files/")) {
      return { ok: true, status: 200, json: async () => ({ Key: "product-files/test" }), text: async () => "{}" };
    }
    return { ok: true, status: 200, json: async () => ({}), text: async () => "{}" };
  };

  const modulePath = path.join(__dirname, "..", "backend", "netlify", "functions", "admin-upload.js");
  delete require.cache[require.resolve(modulePath)];
  const { handler } = require(modulePath);

  const validBody = JSON.stringify({
    filename: "bpc-157.jpg",
    folder: "products",
    contentBase64: Buffer.from("fake image bytes").toString("base64"),
    contentType: "image/jpeg",
  });

  // --- No auth header at all -> rejected ---
  const noAuthRes = await handler({ httpMethod: "POST", headers: {}, body: validBody });
  if (noAuthRes.statusCode !== 401 && noAuthRes.statusCode !== 503) {
    failures.push(`admin-upload.js: request with no admin password should be rejected, got ${noAuthRes.statusCode}`);
  }

  // --- Wrong password -> rejected ---
  const wrongAuthRes = await handler({ httpMethod: "POST", headers: { "x-admin-password": "wrong" }, body: validBody });
  if (wrongAuthRes.statusCode !== 401) {
    failures.push(`admin-upload.js: wrong admin password should be rejected with 401, got ${wrongAuthRes.statusCode}`);
  }

  const authHeaders = { "x-admin-password": "test-password-123" };

  // --- Disallowed folder -> rejected ---
  const badFolderRes = await handler({
    httpMethod: "POST", headers: authHeaders,
    body: JSON.stringify({ filename: "x.jpg", folder: "../../etc", contentBase64: "abc", contentType: "image/jpeg" }),
  });
  if (badFolderRes.statusCode !== 400) {
    failures.push(`admin-upload.js: an unlisted folder should be rejected with 400, got ${badFolderRes.statusCode}`);
  }

  // --- Disallowed content type -> rejected ---
  const badTypeRes = await handler({
    httpMethod: "POST", headers: authHeaders,
    body: JSON.stringify({ filename: "x.exe", folder: "products", contentBase64: "abc", contentType: "application/x-msdownload" }),
  });
  if (badTypeRes.statusCode !== 400) {
    failures.push(`admin-upload.js: a disallowed file type should be rejected with 400, got ${badTypeRes.statusCode}`);
  }

  // --- Valid upload -> succeeds and calls Supabase Storage ---
  const okRes = await handler({ httpMethod: "POST", headers: authHeaders, body: validBody });
  if (okRes.statusCode !== 200) {
    failures.push(`admin-upload.js: a valid upload should succeed, got ${okRes.statusCode} - ${okRes.body}`);
  } else {
    const body = JSON.parse(okRes.body);
    if (!body.url) failures.push("admin-upload.js: successful upload response is missing a url");
  }
  const storageUploadCall = storageCalls.find((c) => c.url.includes("/storage/v1/object/product-files/") && c.method === "POST");
  if (!storageUploadCall) {
    failures.push("admin-upload.js: no request was actually made to Supabase Storage for the valid upload");
  }

  delete process.env.SUPABASE_URL;
  delete process.env.SUPABASE_SERVICE_ROLE_KEY;
  delete process.env.ADMIN_PASSWORD;

  return failures;
}

module.exports = { name: "admin-upload", run };
