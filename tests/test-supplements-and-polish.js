// Guards the Supplements launch + polish pass:
//  - home FAQs are visible (items created by the live-data re-render must have .in)
//  - the placeholder phone is gone; "Phone: ..." only appears once a number is set
//  - the home creatine section is a small teaser with a Browse button
//  - product page: Request / Quantity / Add to Cart order, qty stepper, size-aware request link
//  - contact page pre-fills the message from ?product=&size=
//  - order/contact emails use tables (Gmail ignores flexbox, which glued labels to values)
//  - admin Payment Methods editor reads plain-name lists and labels its columns
const fs = require("fs");
const path = require("path");
const { makeDom, delayedFetch, wait, ROOT } = require("./helpers");

async function run() {
  const failures = [];
  const live = (settings) => ({ categories: [], products: [], combos: [], settings });

  // --- FAQ visible ---
  {
    const dom = makeDom("index.html", { fetchImpl: delayedFetch(live(null), 60) });
    await wait(350);
    const items = [...dom.window.document.querySelectorAll("#home-faq-list .faq-item")];
    if (items.length === 0) failures.push("home: no FAQ items rendered");
    if (items.some((el) => !el.classList.contains("in"))) failures.push("home: FAQ items are missing the .in class (they would stay invisible)");
  }

  // --- Phone hidden by default, shown with label when set ---
  for (const page of ["index.html", "contact.html", "about.html", "shipping.html"]) {
    const html = fs.readFileSync(path.join(ROOT, page), "utf8");
    if (html.includes("000) 000-0000")) failures.push(`${page}: still contains the placeholder phone number`);
  }
  {
    const dom = makeDom("contact.html", { fetchImpl: delayedFetch(live({ contactPhone: "+1 555 123 4567" }), 30) });
    await wait(300);
    const d = dom.window.document;
    const link = d.querySelector(".js-contact-phone-link");
    if (!link || link.style.display === "none" || !/Phone:\s*\+1 555 123 4567/.test(link.textContent)) failures.push("footer: 'Phone: <number>' did not appear once a phone was set");
    if (link && link.getAttribute("href") !== "tel:+15551234567") failures.push(`footer: phone link should be tel:+15551234567, got ${link && link.getAttribute("href")}`);
    const row = d.querySelector(".js-contact-phone-row");
    if (row && row.style.display === "none") failures.push("contact page: Phone row should show once a phone is set");
  }
  {
    const dom = makeDom("contact.html");
    await wait(150);
    const d = dom.window.document;
    const link = d.querySelector(".js-contact-phone-link");
    if (link && link.style.display !== "none") failures.push("footer: phone line should stay hidden when no phone is set");
    const row = d.querySelector(".js-contact-phone-row");
    if (row && row.style.display !== "none") failures.push("contact page: Phone row should stay hidden when no phone is set");
  }

  // --- Home creatine teaser ---
  {
    const dom = makeDom("index.html");
    await wait(200);
    const d = dom.window.document;
    const cards = d.querySelectorAll("#home-creatine-grid .product-card");
    if (cards.length !== 4) failures.push(`home: creatine teaser should show 4 products, showed ${cards.length}`);
    const btn = d.getElementById("h-creatine-btn");
    if (!btn || !/shop\.html\?cat=supplements/.test(btn.getAttribute("href")) || !/Browse/i.test(btn.textContent)) failures.push("home: missing 'Browse all supplements' button to the Supplements category");
  }

  // --- Product page ---
  {
    const dom = makeDom("product.html", { urlPath: "product.html?slug=on-creatine-tablets-180" });
    await wait(250);
    const d = dom.window.document;
    const kids = [...d.querySelectorAll(".product-actions > *")];
    const order = kids.map((el) => (el.id === "request-btn" ? "request" : el.classList.contains("qty-pill") ? "qty" : el.id === "add-to-cart-btn" ? "add" : "?"));
    if (order.join(",") !== "request,qty,add") failures.push(`product: button order should be request,qty,add - got ${order.join(",")}`);
    const req = d.getElementById("request-btn");
    if (!req || !/contact\.html\?product=on-creatine-tablets-180&size=180%20tablets/.test(req.getAttribute("href"))) failures.push(`product: request link should carry product + size, got ${req && req.getAttribute("href")}`);
    const input = d.getElementById("qty-on-creatine-tablets-180");
    d.querySelector('[data-qty-step="1"]').click();
    d.querySelector('[data-qty-step="1"]').click();
    if (!input || input.value !== "3") failures.push(`product: + button should raise qty to 3, got ${input && input.value}`);
    d.querySelector('[data-qty-step="-1"]').click();
    d.querySelector('[data-qty-step="-1"]').click();
    d.querySelector('[data-qty-step="-1"]').click();
    if (!input || input.value !== "1") failures.push(`product: qty should never go below 1, got ${input && input.value}`);
  }

  // --- Contact pre-fill ---
  {
    const dom = makeDom("contact.html", { urlPath: "contact.html?product=on-creatine-tablets-180&size=180%20tablets" });
    await wait(250);
    const d = dom.window.document;
    const msg = d.getElementById("c-msg").value;
    if (!/Optimum Nutrition Creatine Tablets/.test(msg) || !/180 tablets/.test(msg)) failures.push(`contact: message not pre-filled with the product, got: ${JSON.stringify(msg)}`);
    if (d.getElementById("c-product").value !== "on-creatine-tablets-180") failures.push("contact: hidden product field not set");
  }

  // --- Emails: tables, not flexbox ---
  for (const f of ["confirm-order.js", "contact.js"]) {
    const src = fs.readFileSync(path.join(ROOT, "backend", "netlify", "functions", f), "utf8");
    if (/display:\s*flex/.test(src)) failures.push(`${f}: email HTML still uses display:flex (Gmail ignores it)`);
    if (!/<table role="presentation"/.test(src)) failures.push(`${f}: email rows should be table-based`);
  }

  // --- Admin payment methods editor ---
  {
    const html = fs.readFileSync(path.join(ROOT, "admin.html"), "utf8");
    if (!/Payment method name/.test(html) || !/Show on site/.test(html)) failures.push("admin: payment method columns are not labelled");
    if (!/typeof m === "string" \? \{ name: m, active: true \}/.test(html)) failures.push("admin: payment editor must read plain-name lists from the database");
    if (!/data-target="inbox"/.test(html) || !/id="panel-inbox"/.test(html)) failures.push("admin: Inbox tab missing");
  }

  return failures;
}

module.exports = { name: "supplements-and-polish", run };
