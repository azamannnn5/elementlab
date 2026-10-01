/* ElementLab Peptides - editable site copy
   Every string here is what the admin's Homepage / About / Delivery Info /
   Footer / FAQ sections let someone change without touching code. Each
   DEFAULT_* object below is also what renders if the backend isn't
   connected yet, or if a particular field was left blank in the admin
   panel (blank = "use the default", not "show nothing" - see
   mergeContent()). Keep these in sync with the *content*, not the layout:
   moving things around still needs a code change, but wording, numbers,
   and card text should never need one again. */

const DEFAULT_HOME = {
  heroEyebrow: "Research Peptides & Supplements",
  heroHeading: "Premium Research Peptides.",
  heroTagline: "Pure. Precise. Performance.",
  heroLead: "Discover premium research-grade peptides. Trusted by researchers worldwide for quality and reliability. Fast next-day US delivery and worldwide shipping. Also stocking creatine and sports-nutrition supplements.",
  stat1Num: ">99%",
  stat1Label: "Purity Focus",
  stat2Num: "US",
  stat2Label: "Based & Dispatch",
  heroBadge: "Fast, Tracked Dispatch",
  whyEyebrow: "Why Choose Us",
  whyHeading: "Why Choose ElementLab Peptides?",
  whySubtext: "Premium quality, professional service, and a seamless ordering experience for researchers across the US and beyond.",
  whyCards: [
    { title: "Premium Quality", text: "Sourced from trusted manufacturing partners and handled under strict quality standards for consistency and reliability.", image: "assets/img/why-choose/premium-quality.jpg" },
    { title: "US-Based Supplier", text: "Based in the United States with fast nationwide delivery and responsive local support.", image: "assets/img/why-choose/us-based-supplier.jpg" },
    { title: "Fast Delivery", text: "Orders are prepared and dispatched quickly, with tracking provided as soon as your order ships.", image: "assets/img/why-choose/fast-delivery.jpg" },
    { title: "Worldwide Shipping", text: "Reliable international delivery options so researchers around the world can access our range.", image: "assets/img/why-choose/worldwide-shipping.jpg" },
    { title: "Secure Packaging", text: "Every order is carefully packed to protect product integrity during transit.", image: "assets/img/why-choose/secure-packaging.jpg" },
    { title: "Reliable Support", text: "Clear communication and professional customer service when you need assistance.", image: "assets/img/why-choose/reliable-support.jpg" },
  ],
  featuredEyebrow: "Featured",
  featuredHeading: "Featured Research Peptides",
  featuredSubtext: "A selection of our most popular research-grade peptides. Full catalogue available on the products page.",
  featuredSlugs: ["retatrutide", "tirzepatide", "semaglutide", "bpc-157", "ipamorelin", "tb-500", "ghk-cu", "cjc-1295-no-dac"],
  processEyebrow: "Process",
  processHeading: "From synthesis to your lab.",
  processSteps: [
    { title: "Sourced for research quality", text: "We work with trusted manufacturing partners and maintain strict quality standards so every product is handled with care." },
    { title: "Quality focused", text: "Every product is selected for consistency and reliability. Research-grade materials intended for laboratory use only." },
    { title: "Fast, tracked dispatch", text: "Orders are prepared and dispatched quickly. Secure packaging and tracked delivery as standard." },
  ],
  careEyebrow: "Shipped With Care",
  careHeading: "Quality research materials, shipped with care.",
  careCards: [
    { title: "Fast, tracked dispatch", text: "Orders are prepared and dispatched quickly, with tracking across the US." },
    { title: "Secure packaging", text: "Every order is carefully packed to protect product integrity during transit." },
    { title: "Worldwide shipping", text: "Reliable international options so researchers worldwide can access our range." },
    { title: "US-based supplier", text: "Based in the United States with responsive local support and fast nationwide delivery." },
  ],
  bulkEyebrow: "Institutional & Bulk Orders",
  bulkHeading: "Wholesale & bulk research orders.",
  bulkText1: "Tiered pricing and dedicated support for universities, CROs and research groups.",
  minOrderUsd: 160,
  creatineEyebrow: "Supplements",
  creatineHeading: "Creatine & Supplements",
  creatineSubtext: "Alongside our research peptides, we stock a curated range of creatine supplements from leading brands.",
  creatineSlugs: ["on-micronised-creatine-powder-unflavoured-317g", "on-platinum-creatine-plus-orange-astragin-350g", "weider-micronized-creatine-unflavoured-310g", "gloryfeel-creatine-powder-500g"],
  creatineButton: "Browse all supplements",
  faqEyebrow: "Questions",
  faqHeading: "FAQs",
  faqIds: ["what-are-peptides", "purity-tested", "dispatch-speed", "ship-internationally", "payment-methods", "storage"],
  complianceHeading: "Research Use & Supplements Notice",
  complianceText: "ElementLab Peptides sells research peptides and laboratory materials intended for laboratory research purposes only. These are not intended for human consumption, therapeutic use, or veterinary use. Our creatine and other supplement products are food supplements for adults, sold separately from the research range and used as directed on their label. Customers are responsible for ensuring that their purchase and use of all products comply with all applicable laws and regulations in their jurisdiction.",
  paymentsEyebrow: "Payments",
  paymentsHeading: "Accepted payment methods",
  paymentsSubtext: "Choose a method that works for you.",
};

const DEFAULT_ABOUT = {
  tagline: "Premium-quality research peptides. Pure. Precise. Performance.",
  introHeading: "About ElementLab Peptides",
  introParagraphs: [
    "ElementLab Peptides is a US-based supplier of premium-quality research peptides, dedicated to providing researchers with reliable products and exceptional service. Our commitment to quality, consistency, and professionalism is at the core of everything we do.",
    "We continue the tradition of reliable supply, careful handling, and clear communication that researchers expect.",
    "We work with trusted manufacturing partners and maintain strict quality standards to ensure every product is sourced, handled, and packaged with care. Our goal is to provide dependable research materials backed by outstanding customer support and a seamless ordering experience.",
    "From our US base, we offer fast nationwide delivery across the United States as well as worldwide shipping to customers in many international destinations. Every order is securely packaged and dispatched with care to help ensure it arrives safely and efficiently.",
    "At ElementLab Peptides, we are committed to becoming one of the US's leading names in research peptides by combining premium-quality products, competitive pricing, fast delivery, and responsive customer service.",
    "Alongside our peptide range, we also stock a curated selection of creatine supplements from leading brands, so you can find your research materials and everyday supplements in one place.",
  ],
  whyHeading: "Why Choose ElementLab Peptides?",
  whyCards: [
    { title: "Premium quality", text: "Premium-quality research peptides." },
    { title: "US-based supplier", text: "A US-based supplier with responsive local support." },
    { title: "Nationwide delivery", text: "Fast nationwide delivery across the US." },
    { title: "Worldwide shipping", text: "Worldwide shipping available." },
    { title: "Secure packaging", text: "Secure and discreet packaging." },
    { title: "Reliable support", text: "Reliable customer support." },
    { title: "Competitive pricing", text: "Competitive pricing across the range." },
    { title: "Professionalism", text: "A commitment to quality and professionalism." },
  ],
  approachHeading: "Our Approach to Quality",
  approachP1: "Quality is non-negotiable. We carefully select manufacturing partners who share our standards and we maintain clear processes for handling, storage, and dispatch. Every product is treated as a research material that researchers depend on for accuracy and reproducibility.",
  approachP2: "We prioritize consistency between batches and clear product information so that laboratories and individual researchers can work with confidence. Our packaging is designed to protect product integrity from our facility to your bench.",
  serviceHeading: "Service You Can Rely On",
  serviceP1: "Research moves quickly. That's why we focus on clear communication, straightforward ordering, and dependable dispatch. Whether you are ordering a single vial or building a larger research inventory, we aim to make the process simple and professional.",
  serviceP2: "Our team understands the importance of reliable supply. We work to keep popular research peptides in stock and to provide timely updates when lead times change.",
  lookingHeading: "Looking Ahead",
  lookingP: "ElementLab Peptides is built for the long term. We continue to refine our processes, expand our range where it adds value for researchers, and strengthen the service experience. Our ambition is clear: to be recognized as a trusted US name for premium research peptides, defined by purity, precision, and performance.",
  contactIntro: "Have a question about an order, product availability, or delivery? Get in touch. We aim to respond promptly during business hours.",
  ruoP1: "ElementLab Peptides sells research peptides and laboratory materials intended for laboratory research purposes only. These are not intended for human consumption, therapeutic use, or veterinary use. Our creatine and other supplement products are food supplements for adults and are not covered by this restriction.",
  ruoP2: "Customers are responsible for ensuring that their purchase and use of these products comply with all applicable laws and regulations in their jurisdiction.",
  ruoP3: "By placing an order you confirm that you understand and accept these terms.",
};

const DEFAULT_DELIVERY = {
  intro: "At ElementLab Peptides we understand that timely delivery matters. We offer fast nationwide delivery across the United States and worldwide shipping to many international destinations. Every order is securely packaged and handled with care.",
  cards: [
    { title: "US Delivery", text: "Orders are prepared and dispatched quickly on business days (Monday to Friday). Most US customers receive their parcels quickly via trusted tracked services. Tracking information is provided once your order has been dispatched." },
    { title: "International Shipping", text: "We ship to many destinations worldwide using reliable carriers. International delivery times vary by location and customs processing. Tracking is provided where available. Please note that customs duties or import taxes may apply depending on your country, and these are the responsibility of the recipient." },
    { title: "Secure Packaging", text: "All products are carefully packed to protect them during transit. We use discreet outer packaging. Optional insulated packaging may be added at checkout for additional temperature protection where required, at no extra cost." },
    { title: "Track Your Order", text: "Once your order has been dispatched you will receive an email containing tracking details. Please allow a short time for the tracking information to update with the courier. It is the customer's responsibility to monitor the progress of their parcel." },
  ],
  notesHeading: "Important Delivery Notes",
  notes: [
    "Please ensure the delivery address provided at checkout is accurate and complete. We cannot redirect parcels once they are in transit.",
    "Delivery times are estimates and are not guaranteed unless a guaranteed service has been selected.",
    "In rare cases delays can occur due to circumstances outside our control (courier issues, weather, customs, etc.).",
    "We are unable to resend or refund parcels while they remain in transit. Lost or undelivered parcels are handled according to the courier's process and our terms.",
    "Dispatch times may be longer during peak periods, promotions, or when additional checks are required.",
  ],
  costsHeading: "Shipping Costs",
  costsText: "Orders of $200 or more ship free. Below that, shipping cost is confirmed by our team after you submit an order request, before any payment is finalized.",
  helpHeading: "Need Help?",
  helpText: "For delivery questions or tracking assistance, contact us at:",
  ruoTitle: "Research Use & Supplements",
  ruoText: "ElementLab Peptides sells research peptides and laboratory materials intended for laboratory research purposes only. These are not intended for human consumption, therapeutic use, or veterinary use. Our creatine and other supplement products are food supplements for adults, used as directed on their label. Customers are responsible for ensuring compliance with all applicable laws and regulations in their jurisdiction.",
  disclaimerTitle: "Disclaimer",
  disclaimerText: "By purchasing from ElementLab Peptides you acknowledge that all products are sold strictly for research and laboratory testing purposes. We do not provide advice on usage, concentration, or applications. Customers must carry out their own appropriate research.",
};

const DEFAULT_FOOTER = {
  tagline: "",
  shopLinks: [
    { label: "All Products", url: "shop.html" },
    { label: "Peptides", url: "shop.html?cat=peptides" },
    { label: "Laboratory Supplies", url: "shop.html?cat=mixing" },
    { label: "Supplements", url: "shop.html?cat=supplements" },
  ],
  companyLinks: [
    { label: "About ElementLab Peptides", url: "about.html" },
    { label: "Delivery Info", url: "shipping.html" },
    { label: "Payment Methods", url: "payments.html" },
    { label: "Research Use Only", url: "about.html#research-use-only" },
  ],
};

// id is stable and referenced from DEFAULT_HOME.faqIds - changing an id
// in the admin panel will stop it showing on the homepage until the
// homepage's FAQ picks are updated too, so ids are best left alone once
// in use (edit the question/answer text instead of the id).
const DEFAULT_FAQS = [
  { id: "what-are-peptides", q: "What are peptides?", a: "Peptides are short chains of amino acids - typically 2 to 50, sometimes up to about 100 - linked together by peptide bonds. They're essentially smaller versions of proteins and occur naturally in biological systems, where they play important roles in a wide range of physiological and cellular processes." },
  { id: "how-peptides-work", q: "How do peptides work?", a: "Most peptides work by binding to specific targets - typically receptors on the cell surface - triggering a biological response. Because each peptide has a distinct sequence, researchers can study very specific pathways with high precision." },
  { id: "storage", q: "How should I store peptides?", a: "<strong>Long-term storage (months to years):</strong> Store at -20°C (standard freezer) or preferably -80°C (ultra-low freezer) in a tightly sealed vial, protected from light. Most lyophilized peptides remain stable for several years under these conditions.\n\n<strong>Short-term storage (weeks to a few months):</strong> 4°C (refrigerator) is generally acceptable. Room temperature, in a cool, dry, dark place, is fine for days to weeks if you plan to use the material soon." },
  { id: "purity-tested", q: "Are your products tested for purity?", a: "Yes. Every ElementLab Peptides research peptide is independently tested by a third-party lab using HPLC (High-Performance Liquid Chromatography) and mass spectrometry. We stand behind 99%+ purity across our catalog. Every product also ships as a sealed vial (or pack) labeled with the compound name, quantity, and a research-use-only warning." },
  { id: "track-order", q: "How do I track my order?", a: "Once your order ships, you'll receive an email confirmation with a tracking number you can use to follow its progress with the courier." },
  { id: "payment-methods", q: "What payment methods do you accept?", a: "We accept {{PAYMENT_METHODS}}. Paying with Bitcoin gets you an automatic 5% discount. Payment details are confirmed after you place your order, via email." },
  { id: "dispatch-speed", q: "How quickly do you dispatch orders?", a: "Orders are prepared and dispatched quickly on business days (Monday to Friday). Tracking details are emailed to you once your order has been dispatched. Dispatch times may be longer during peak periods, promotions, or when additional checks are required. See our <a href=\"shipping.html\">Delivery Information</a> for full details." },
  { id: "ship-internationally", q: "Do you ship internationally?", a: "Yes. We offer fast nationwide delivery across the United States and worldwide shipping to many international destinations, using reliable carriers. Delivery times vary by location and customs processing, and any customs duties or import taxes are the responsibility of the recipient. If an order can't be shipped to your location, our team will reach out directly to discuss alternatives or issue a refund. See our <a href=\"shipping.html\">Delivery Information</a> for details." },
  { id: "creatine-supplements", q: "Are your creatine products for research use too?", a: "No. Our creatine products are food supplements for adults, sold in their original branded packaging and used as directed on the label. The research-use-only wording on this site applies to our research peptides and laboratory supplies, not to the supplements. You can browse them in the Supplements category." },
  { id: "who-can-purchase", q: "Who can purchase from ElementLab Peptides?", a: "Research peptides and laboratory supplies are sold strictly for in-vitro laboratory research use, to qualified researchers affiliated with a legitimate laboratory, academic, or scientific institution. You must be at least 21 years old to access or purchase from this site. See our <a href=\"zero-tolerance.html\">Zero Tolerance Policy</a> for full terms." },
];

// Merge an admin-edited section over its defaults. A field left blank (""
// or []) in the admin panel is treated as "not set" and falls back to the
// default, rather than blanking that part of the page - this is what
// keeps a half-filled-in admin form from breaking the live site.
function mergeContent(section, defaults) {
  const live = (window.LIVE_SETTINGS && window.LIVE_SETTINGS.siteContent && window.LIVE_SETTINGS.siteContent[section]) || {};
  const out = Object.assign({}, defaults);
  Object.keys(live).forEach((k) => {
    const v = live[k];
    const isEmptyArr = Array.isArray(v) && v.length === 0;
    const isEmptyStr = typeof v === "string" && v.trim() === "";
    if (v !== undefined && v !== null && !isEmptyArr && !isEmptyStr) out[k] = v;
  });
  return out;
}

function liveFaqs() {
  const live = window.LIVE_SETTINGS && window.LIVE_SETTINGS.faqs;
  return Array.isArray(live) && live.length ? live : DEFAULT_FAQS;
}
function faqById(id) {
  return liveFaqs().find((f) => f.id === id);
}
// The one answer that references the live payment-method list gets that
// list substituted in at render time, so it can never drift out of sync
// with what Payment Methods actually has switched on.
function faqAnswerHtml(f) {
  const sentence = typeof paymentMethodsSentence === "function" ? paymentMethodsSentence() : "Bitcoin, USDT, PayPal, Apple Pay, Google Pay, Cash App, Venmo, Zelle, Chime, Bank Transfer, Wise, Revolut, Gift Cards, TapTap Send, and Remitly";
  return f.a.replace(/\{\{PAYMENT_METHODS\}\}/g, sentence).split("\n\n").map((p) => `<p>${p}</p>`).join("");
}
function faqItemHtml(f, openFirst) {
  return `
    <details class="faq-item reveal in" ${openFirst ? "open" : ""}>
      <summary>${escapeHtml(f.q)} <span class="faq-icon">+</span></summary>
      <div class="faq-answer">${faqAnswerHtml(f)}</div>
    </details>`;
}
