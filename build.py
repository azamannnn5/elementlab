import os, re, glob, hashlib

ROOT = os.path.dirname(os.path.abspath(__file__))
PARTIALS = os.path.join(ROOT, "partials")
PAGES = os.path.join(ROOT, "pages")
SITE_URL = "https://elementlabpeptides.com"

# ---------- cache-busting ----------
# Every css/js reference gets ?v=<hash of all css+js files>. Each deploy that
# changes any of them gives browsers a new URL, so visitors never see a stale
# stylesheet or script (this is what left a fixed banner unreadable before).
def _asset_hash():
    h = hashlib.sha1()
    for p in sorted(glob.glob(os.path.join(ROOT, "css", "*.css")) + glob.glob(os.path.join(ROOT, "js", "*.js"))):
        h.update(os.path.basename(p).encode())
        with open(p, "rb") as fh:
            h.update(fh.read())
    return h.hexdigest()[:10]

ASSET_V = _asset_hash()
_ASSET_RE = re.compile(r'((?:src|href)=")((?:css|js)/[A-Za-z0-9_\-.]+\.(?:css|js))(?:\?v=[A-Za-z0-9]+)?(")')

def version_assets(html):
    return _ASSET_RE.sub(lambda m: f"{m.group(1)}{m.group(2)}?v={ASSET_V}{m.group(3)}", html)

with open(os.path.join(PARTIALS, "header.html")) as f:
    HEADER = f.read()
with open(os.path.join(PARTIALS, "footer.html")) as f:
    FOOTER = f.read()

SHELL = """<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>{title}</title>
<meta name="description" content="{description}" />
<meta name="robots" content="index, follow" />
<link rel="canonical" href="{canonical}" />
<meta property="og:type" content="website" />
<meta property="og:site_name" content="ElementLab Peptides" />
<meta property="og:title" content="{title}" />
<meta property="og:description" content="{description}" />
<meta property="og:url" content="{canonical}" />
<meta property="og:image" content="{site_url}/assets/img/hero/hero-vials.jpg" />
<meta name="twitter:card" content="summary_large_image" />
<meta name="twitter:title" content="{title}" />
<meta name="twitter:description" content="{description}" />
<meta name="twitter:image" content="{site_url}/assets/img/hero/hero-vials.jpg" />
<link rel="icon" href="favicon.ico" sizes="any" />
<link rel="icon" type="image/png" sizes="32x32" href="assets/img/favicon-32.png" />
<link rel="apple-touch-icon" href="assets/img/apple-touch-icon.png" />
<meta name="theme-color" content="#1E7CF2" />
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet">
<link rel="stylesheet" href="css/style.css" />
<script type="application/ld+json">
{{
  "@context": "https://schema.org",
  "@type": "Organization",
  "name": "ElementLab Peptides",
  "url": "{site_url}/",
  "logo": "{site_url}/assets/img/logo.png",
  "email": "contact@elementlabpeptides.com",
  "description": "Research-grade peptides, independently third-party tested, plus creatine supplements. Peptides are research use only."
}}
</script>
</head>
<body>
<script src="js/products-data.js"></script>
<script src="js/site-content.js"></script>
<script src="js/cart.js"></script>
<script src="js/promo.js"></script>
<script src="js/shipping.js"></script>
{header}
{body}
{footer}
{extra_script}
<script src="js/main.js"></script>
<!-- Smartsupp Live Chat script -->
<script type="text/javascript">
var _smartsupp = _smartsupp || {{}};
_smartsupp.key = 'c49ca806f17cb1adeacba7803e40a1023f98c2df';
window.smartsupp||(function(d) {{
  var s,c,o=smartsupp=function(){{ o._.push(arguments)}};o._=[];
  s=d.getElementsByTagName('script')[0];c=d.createElement('script');
  c.type='text/javascript';c.charset='utf-8';c.async=true;
  c.src='https://www.smartsuppchat.com/loader.js?';s.parentNode.insertBefore(c,s);
}})(document);
</script>
<noscript>Powered by <a href="https://www.smartsupp.com" target="_blank">Smartsupp</a></noscript>
</body>
</html>
"""

# (filename, title, description, extra_script_tag)
PAGES_META = {
    "index.html": ("ElementLab Peptides | Research Peptides & Creatine Supplements", "Premium research-grade peptides plus creatine supplements. Pure. Precise. Performance. Fast, tracked US dispatch and worldwide shipping. Peptides are research use only.", ""),
    "shop.html": ("Shop All Products | ElementLab Peptides", "Browse the full ElementLab Peptides catalog of research peptides, laboratory supplies and creatine supplements by category.", '<script src="js/shop.js"></script>'),
    "product.html": ("Product | ElementLab Peptides", "Research peptide product detail, available sizes, and specifications.", '<script src="js/product.js"></script>'),
    "reconstitution-calculator.html": ("Peptide Reconstitution Calculator | ElementLab Peptides", "Calculate the correct volume to draw when reconstituting research peptides with bacteriostatic water.", '<script src="js/reconstitution-calculator.js"></script>'),
    "about.html": ("About Us | ElementLab Peptides", "About ElementLab Peptides, our research peptides and creatine supplements, and our research-use-only compliance commitments.", ""),
    "faq.html": ("FAQs | ElementLab Peptides", "Frequently asked questions about ElementLab Peptides research peptides, storage, orders, and shipping.", ""),
    "contact.html": ("Contact Us | ElementLab Peptides", "Get in touch with the ElementLab Peptides team.", ""),
    "cart.html": ("Your Order | ElementLab Peptides", "Review your ElementLab Peptides order and submit your order details.", ""),
    "blog.html": ("Research Notes | ElementLab Peptides", "Educational research notes from ElementLab Peptides.", ""),
    "terms.html": ("Terms & Conditions | ElementLab Peptides", "ElementLab Peptides Terms and Conditions.", ""),
    "privacy.html": ("Privacy Policy | ElementLab Peptides", "ElementLab Peptides Privacy Policy.", ""),
    "payments.html": ("Payment Methods | ElementLab Peptides", "Accepted payment methods at ElementLab Peptides.", ""),
    "shipping.html": ("Delivery Information | ElementLab Peptides", "Fast US dispatch and reliable worldwide shipping options from ElementLab Peptides.", ""),
    "returns.html": ("Return Policy | ElementLab Peptides", "ElementLab Peptides Return Policy.", ""),
    "zero-tolerance.html": ("Zero Tolerance Policy | ElementLab Peptides", "ElementLab Peptides Zero Tolerance Policy on research-use-only compliance.", ""),
}

count = 0
for fname, (title, desc, extra) in PAGES_META.items():
    body_path = os.path.join(PAGES, fname)
    if not os.path.exists(body_path):
        print("MISSING page body:", fname)
        continue
    with open(body_path) as f:
        body = f.read()
    html = SHELL.format(title=title, description=desc, header=HEADER, body=body, footer=FOOTER, extra_script=extra,
                         canonical=f"{SITE_URL}/{fname}" if fname != "index.html" else f"{SITE_URL}/", site_url=SITE_URL)
    with open(os.path.join(ROOT, fname), "w") as f:
        f.write(version_assets(html))
    count += 1

# admin.html is hand-written (not built from pages/), so version it in place.
_admin = os.path.join(ROOT, "admin.html")
if os.path.exists(_admin):
    with open(_admin) as f:
        _a = f.read()
    with open(_admin, "w") as f:
        f.write(version_assets(_a))

print(f"Built {count} pages.")

# ---------- sitemap.xml ----------
# Static pages, weighted by how likely they are to be a search entry point.
STATIC_SITEMAP_ENTRIES = [
    ("index.html", "1.0", "weekly"),
    ("shop.html", "0.9", "weekly"),
    ("reconstitution-calculator.html", "0.7", "monthly"),
    ("about.html", "0.6", "monthly"),
    ("faq.html", "0.7", "monthly"),
    ("contact.html", "0.5", "monthly"),
    ("blog.html", "0.5", "monthly"),
    ("terms.html", "0.2", "yearly"),
    ("privacy.html", "0.2", "yearly"),
    ("shipping.html", "0.4", "monthly"),
    ("payments.html", "0.4", "monthly"),
    ("returns.html", "0.4", "monthly"),
    ("zero-tolerance.html", "0.2", "yearly"),
]

# Pull product slugs directly out of products-data.js so every product page
# gets its own sitemap entry without hand-maintaining a second list.
with open(os.path.join(ROOT, "js", "products-data.js")) as f:
    _pdata = f.read()
_products_section = _pdata.split("const PRODUCTS")[1].split("const COMBOS")[0]
PRODUCT_SLUGS = re.findall(r'"?slug"?\s*:\s*"([^"]+)"', _products_section)

sitemap_urls = []
for fname, priority, freq in STATIC_SITEMAP_ENTRIES:
    loc = f"{SITE_URL}/" if fname == "index.html" else f"{SITE_URL}/{fname}"
    sitemap_urls.append((loc, priority, freq))
for slug in PRODUCT_SLUGS:
    sitemap_urls.append((f"{SITE_URL}/product.html?slug={slug}", "0.7", "weekly"))

sitemap_xml = ['<?xml version="1.0" encoding="UTF-8"?>',
               '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">']
for loc, priority, freq in sitemap_urls:
    sitemap_xml.append(f"  <url><loc>{loc}</loc><changefreq>{freq}</changefreq><priority>{priority}</priority></url>")
sitemap_xml.append("</urlset>")

with open(os.path.join(ROOT, "sitemap.xml"), "w") as f:
    f.write("\n".join(sitemap_xml) + "\n")

print(f"Built sitemap.xml with {len(sitemap_urls)} URLs.")
