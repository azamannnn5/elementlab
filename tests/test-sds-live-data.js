// Guards against the "SDS silently disappears once live data loads" bug:
// get-products.js's product mapping used to omit `sds` entirely, so once
// window.catalogReadyPromise resolved and overwrote the static fallback
// data, every product's SDS button vanished (p.sds was undefined) even
// though the static fallback always had it. Mocks Supabase's REST API
// (which @supabase/supabase-js calls over fetch) so this runs without a
// real database.
const path = require("path");

async function run() {
  const failures = [];

  process.env.SUPABASE_URL = "https://fake-project.supabase.co";
  process.env.SUPABASE_ANON_KEY = "fake-anon-key";

  const fakeProductRow = {
    slug: "bpc-157", name: "BPC-157", categories: ["tissue-repair"],
    appearance: "White Lyophilized Powder", cover_dose: "10mg",
    doses: [{ label: "10mg", priceCents: 5499 }], summary: "test",
    research_applications: [], image_url: "assets/img/products/bpc-157.jpg",
    sds_url: "assets/sds/bpc-157-sds.pdf",
    thin_data: false, in_stock: true,
  };

  global.fetch = async (url) => {
    const u = String(url);
    const respond = (data) => ({ ok: true, status: 200, json: async () => data, text: async () => JSON.stringify(data), headers: { get: () => "application/json" } });
    if (u.includes("/rest/v1/products")) return respond([fakeProductRow]);
    if (u.includes("/rest/v1/categories")) return respond([]);
    if (u.includes("/rest/v1/bundles")) return respond([]);
    if (u.includes("/rest/v1/settings")) return respond([]);
    return respond({});
  };

  const modulePath = path.join(__dirname, "..", "backend", "netlify", "functions", "get-products.js");
  delete require.cache[require.resolve(modulePath)];
  const { handler } = require(modulePath);

  const res = await handler();
  if (res.statusCode !== 200) {
    failures.push(`get-products.js: expected 200, got ${res.statusCode} - ${res.body}`);
  } else {
    const body = JSON.parse(res.body);
    const product = (body.products || [])[0];
    if (!product) {
      failures.push("get-products.js: no products returned");
    } else if (!product.sds) {
      failures.push(`get-products.js: live product data is missing the sds field entirely (this is the bug - SDS worked from static fallback but silently vanished once live data loaded). Got: ${JSON.stringify(product)}`);
    } else if (product.sds !== "assets/sds/bpc-157-sds.pdf") {
      failures.push(`get-products.js: sds field has wrong value - got "${product.sds}"`);
    }
  }

  delete process.env.SUPABASE_URL;
  delete process.env.SUPABASE_ANON_KEY;

  return failures;
}

module.exports = { name: "sds-live-data", run };
