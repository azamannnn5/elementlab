// Guards against the "chem data silently disappears once live data loads"
// bug: get-products.js's product mapping used to omit `chem` (CAS number,
// molecular formula, molecular weight) entirely, so once
// window.catalogReadyPromise resolved and overwrote the static fallback
// data, the whole CAS/formula/MW table on the product page vanished
// (p.chem was undefined) even though the static fallback always had it.
// Mocks Supabase's REST API (which @supabase/supabase-js calls over
// fetch) so this runs without a real database.
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
    chem_cas: "137525-51-0 (free base); 1628202-19-6 (acetate)",
    chem_formula: "C62H98N16O22",
    chem_mw: "1419.55 g/mol",
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
    } else if (!product.chem) {
      failures.push(`get-products.js: live product data is missing the chem field entirely (this is the bug - CAS/formula/MW worked from static fallback but silently vanished once live data loaded). Got: ${JSON.stringify(product)}`);
    } else if (product.chem.cas !== fakeProductRow.chem_cas || product.chem.formula !== fakeProductRow.chem_formula || product.chem.mw !== fakeProductRow.chem_mw) {
      failures.push(`get-products.js: chem field has wrong values - got ${JSON.stringify(product.chem)}`);
    }
  }

  delete process.env.SUPABASE_URL;
  delete process.env.SUPABASE_ANON_KEY;

  return failures;
}

module.exports = { name: "chem-live-data", run };
