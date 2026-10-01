# ElementLab Peptides - Backend Setup

Static frontend + Supabase + Netlify Functions.

## What's built
- `schema.sql` - database schema (products, categories, bundles, settings, orders, subscribers, contact_messages) with Row Level Security
- `seed.sql` - the current 93-SKU catalog (categories, products), generated from `js/products-data.js`. Run AFTER `schema.sql`.
- `full_reset_setup.sql` - wipe + rebuild + seed in one file (destroys existing data, including subscribers and messages)
- `netlify/functions/subscribe.js` - promo email signup (writes to `subscribers`)
- `netlify/functions/contact.js` - contact form handler (writes to `contact_messages`, optional email notification via Titan SMTP)
- `migration-supplements-inbox.sql` - ONE-TIME update for an existing database: adds the Supplements category + creatine products, fixes peptide image paths, adds the Inbox columns, clears the placeholder phone. Safe to re-run. (New projects don't need it - `full_reset_setup.sql` already includes everything.)
- `netlify/functions/admin-inbox.js` - powers the admin Inbox tab (orders, messages, signups, unread + email-failed status)
- `netlify/functions/_mailer.js` - shared Titan SMTP sender used by contact, confirm-order and subscribe
- `netlify/functions/get-products.js` - serves the live catalog to the storefront; if it fails the site falls back to the static data in `js/products-data.js`
- `netlify/functions/confirm-order.js` - order handoff: logs the order to `orders`, emails the customer a confirmation and notifies the team inbox
- `netlify/functions/admin-*.js` - password-protected admin panel API (`/admin.html`)
- **Order flow (`cart.html` + `js/cart.js`)**: customer builds a cart, fills in name/contact/delivery address/payment method/promo code and submits. The order is emailed via the Titan mailbox (SMTP) and logged in Supabase; the team then confirms payment by email. No payment processor, no live-chat widget.

## To go live
1. Create a Supabase project and run `full_reset_setup.sql` (new project) or `schema.sql` then `seed.sql` (existing project).
   - If you are migrating an existing ProFound database, run `full_reset_setup.sql` - it drops the retired `coas` table and reloads the catalog. Without this, the old catalog in Supabase will override the new static catalog on the live site.
2. In Netlify site settings add: `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `SMTP_USER` (contact@elementlabpeptides.com), `SMTP_PASS` (that mailbox's password), `ADMIN_PASSWORD`. Optional: `SMTP_HOST` (default smtp.titan.email), `SMTP_PORT` (default 465), `SMTP_FROM`.
3. Email is sent through the Titan mailbox (bought via name.com). DNS needs the Titan MX, SPF and DKIM records, plus a `_dmarc` TXT record (recommended). Emails are sent FROM the SMTP_USER mailbox, since Titan only allows that address (or an alias).
4. `npm install` inside `backend/` so Netlify Functions can resolve `@supabase/supabase-js`.
5. Deploy (`git add / commit / push` to the connected repo).

## Rebuilding pages
Page bodies live in `pages/`, shared header/footer in `partials/`. Run `python3 build.py` to regenerate the root `.html` files and `sitemap.xml`. Run `npm test` to run the regression suite.

## Catalog notes
- Bundle deals and customer accounts were discontinued (pages removed; the bundles table is emptied by the seed). The cart code still supports bundles if you bring them back.
- Accepted payment methods (15) live in `settings.payment_methods`; logos are in `assets/img/payments/`.
- Prices are USD, converted from the GBP price list at 1 GBP = 1.34 USD and rounded down to the nearest .99.
- Every size has its own product photo (`doses[].image`); thumbnails live in `assets/img/products/thumbs/`.
- There is no contact phone by default. Add one in Admin > Contact and a "Phone: ..." line appears in the footer and on the Contact, About and Shipping pages.
- Chemistry fields (CAS / formula / molecular weight) were left blank for ACE-031, Crystagen, Thymalin, Follistatin and DNSP-11 because they could not be verified. ADAMAX, Bronchogen and Cortagen show "Not assigned" for CAS.
- SDS PDFs and the COA lookup are removed for now. A product page shows a Safety Data tab again automatically once a product has an `sds` path.
- The Smartsupp chat widget has been removed.
