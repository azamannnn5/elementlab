-- ElementLab Peptides - Supabase schema
-- Run this in the Supabase SQL editor once the project is created.

create table if not exists categories (
  slug text primary key,
  name text not null,
  blurb text,
  image_url text
);

-- Full product catalog, editable from /admin.html. doses is a JSON array
-- of {label, priceCents} objects - e.g. [{"label":"5mg","priceCents":3499}].
create table if not exists products (
  slug text primary key,
  name text not null,
  categories text[] not null default '{}',
  appearance text,
  cover_dose text,
  doses jsonb not null default '[]',
  summary text,
  research_applications text[] default '{}',
  image_url text,
  sds_url text,
  chem_cas text,
  chem_formula text,
  chem_mw text,
  thin_data boolean default false,
  in_stock boolean default true,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Safe to re-run: adds sds_url if this table already existed before it
-- did (it was missing from the original schema entirely - the SDS PDF
-- link only ever worked from the static fallback data in
-- js/products-data.js, never from the live Supabase-backed catalog).
alter table products add column if not exists sds_url text;
-- Same story for CAS number / molecular formula / molecular weight -
-- worked from static fallback data only, never wired into the live
-- catalog at all.
alter table products add column if not exists chem_cas text;
alter table products add column if not exists chem_formula text;
alter table products add column if not exists chem_mw text;

-- Bundle Deals, editable from /admin.html. tiers is a JSON array of
-- {label, items:[{slug,dose}], separateCents, bundleCents} objects.
create table if not exists bundles (
  slug text primary key,
  name text not null,
  blurb text,
  image_url text,
  tiers jsonb not null default '[]',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Single-row table of site-wide promo/discount settings, editable from
-- /admin.html. id is always 1 - this is a settings singleton, not a list.
-- mix_match_tiers is a JSON array of {min, pct}; announcements is a plain
-- text array (the rotating messages in the top announcement bar).
create table if not exists settings (
  id integer primary key default 1,
  mix_match_tiers jsonb not null default '[{"min":10,"pct":10},{"min":6,"pct":7},{"min":3,"pct":5}]',
  welcome_code text default 'WELCOME10',
  welcome_pct integer default 10,
  free_shipping_threshold_cents integer default 20000,
  crypto_discount_pct integer default 5,
  announcements text[] default '{"Research peptides: laboratory use only, not for human or veterinary use. Creatine and supplements also available.","Up to 20% off kits • 99%+ HPLC purity • batch COA","Fast, tracked US dispatch"}',
  contact_email text default 'contact@elementlabpeptides.com',
  contact_phone text,
  contact_address text,
  chat_hours text,
  insulated_packaging_label text default 'Insulated packaging (free)',
  payment_methods jsonb not null default '[{"name":"Bitcoin","active":true},{"name":"USDT","active":true},{"name":"PayPal","active":true},{"name":"Apple Pay","active":true},{"name":"Google Pay","active":true},{"name":"Cash App","active":true},{"name":"Venmo","active":true},{"name":"Zelle","active":true},{"name":"Chime","active":true},{"name":"Bank Transfer","active":true},{"name":"Wise","active":true},{"name":"Revolut","active":true},{"name":"Gift Cards","active":true},{"name":"TapTap Send","active":true},{"name":"Remitly","active":true}]',
  promo_codes jsonb not null default '[{"code":"RUM266","pct":15,"active":true,"startDate":"","endDate":"","placements":[],"label":"","popupDelaySec":5},{"code":"LUXPD","pct":15,"active":true,"startDate":"","endDate":"","placements":[],"label":"","popupDelaySec":5}]',
  -- site_content holds all the editable copy for the home, about, and
  -- delivery pages, plus the footer link columns - see
  -- js/site-content.js for the full default shape and every key it reads.
  site_content jsonb not null default '{}',
  -- faqs is the single list of {id, q, a} pairs used by both faq.html
  -- (shows all of them) and the homepage (shows the ids picked in
  -- site_content.home.faqIds).
  faqs jsonb not null default '[]',
  updated_at timestamptz default now(),
  constraint settings_singleton check (id = 1)
);
insert into settings (id) values (1) on conflict (id) do nothing;

-- Safe to re-run: adds the new contact/payment fields if this table
-- already existed before they did.
alter table settings add column if not exists contact_email text default 'contact@elementlabpeptides.com';
alter table settings add column if not exists contact_phone text;
alter table settings add column if not exists contact_address text;
alter table settings add column if not exists chat_hours text;
alter table settings add column if not exists payment_methods jsonb not null default '[{"name":"Bitcoin","active":true},{"name":"USDT","active":true},{"name":"PayPal","active":true},{"name":"Apple Pay","active":true},{"name":"Google Pay","active":true},{"name":"Cash App","active":true},{"name":"Venmo","active":true},{"name":"Zelle","active":true},{"name":"Chime","active":true},{"name":"Bank Transfer","active":true},{"name":"Wise","active":true},{"name":"Revolut","active":true},{"name":"Gift Cards","active":true},{"name":"TapTap Send","active":true},{"name":"Remitly","active":true}]';
-- Promo codes are a plain jsonb list of {code, pct} objects - admin-
-- editable from Site Settings, no code changes needed to add a new one
-- (this replaces the earlier single-hardcoded-WELCOME10-code setup, see
-- BUILD_NOTES-equivalent reasoning: the whole point is never needing a
-- redeploy just to add a promo code again).
alter table settings add column if not exists promo_codes jsonb not null default '[{"code":"RUM266","pct":15,"active":true,"startDate":"","endDate":"","placements":[],"label":"","popupDelaySec":5},{"code":"LUXPD","pct":15,"active":true,"startDate":"","endDate":"","placements":[],"label":"","popupDelaySec":5}]';
alter table settings add column if not exists site_content jsonb not null default '{}';
alter table settings add column if not exists faqs jsonb not null default '[]';
alter table settings add column if not exists insulated_packaging_label text default 'Insulated packaging (free)';

-- ============================================
-- Storage bucket for admin-uploaded files (product images, SDS PDFs). Public read (product photos and documents need to be
-- viewable by any site visitor), writes only via the service-role key
-- (see admin-upload.js) - the same access pattern as every other
-- admin-only write path on this site.
-- ============================================
insert into storage.buckets (id, name, public)
values ('product-files', 'product-files', true)
on conflict (id) do nothing;

drop policy if exists "public read product-files" on storage.objects;
create policy "public read product-files" on storage.objects
  for select using (bucket_id = 'product-files');
-- No public insert/update/delete policy, on purpose - uploads only ever
-- go through admin-upload.js using the service role key, which bypasses
-- RLS entirely (same reasoning as every other admin write in this file).

-- Newsletter/promo signups (used by the homepage + contact opt-in form).
-- discount_used enforces the WELCOME10 code being first-order-only once
-- this is checked server-side. Implemented in
-- backend/netlify/functions/confirm-order.js (checked/set on order submit)
-- - the client-side half in js/promo.js via localStorage only guards the
-- same browser; this is what stops the same email across devices.
create table if not exists subscribers (
  id uuid primary key default gen_random_uuid(),
  email text not null unique,
  promo_opt_in boolean default true,
  discount_used boolean default false,
  created_at timestamptz default now()
);

-- Contact form submissions
create table if not exists contact_messages (
  id uuid primary key default gen_random_uuid(),
  name text,
  email text,
  org text,
  message text,
  product_slug text,
  created_at timestamptz default now()
);

-- Order log. confirm-order.js writes here in addition to sending the two
-- Resend emails, so there's a persistent, properly structured record of
-- every submitted order independent of email delivery - previously
-- orders were only ever crammed as unstructured text into
-- contact_messages (meant for actual contact form submissions), mixing
-- two unrelated things together with no way to query orders separately.
create table if not exists orders (
  id uuid primary key default gen_random_uuid(),
  name text,
  email text not null,
  phone text,
  country text,
  address text,
  payment_method text,
  promo_code text,
  items text not null,
  subtotal_cents integer,
  discounts jsonb not null default '[]'::jsonb,
  discount_cents integer,
  shipping_label text,
  total_cents integer,
  emails_sent boolean not null default false,
  created_at timestamptz not null default now()
);
alter table orders enable row level security;
-- No public policies, on purpose - only reachable through the service
-- role key (same access pattern as every other admin/order-only write
-- on this site).

-- Row Level Security: public can read products/categories/bundles/
-- settings, but only service-role (Netlify Functions) can write. All
-- admin writes go through the /admin.html panel's protected Netlify
-- Functions (admin-save-product.js etc), which check a shared admin
-- password against ADMIN_PASSWORD before touching the database - there is
-- no Supabase Auth / user login involved.
alter table products enable row level security;
alter table categories enable row level security;
alter table subscribers enable row level security;
alter table contact_messages enable row level security;
alter table bundles enable row level security;
alter table settings enable row level security;

drop policy if exists "public read products" on products;
create policy "public read products" on products for select using (true);
drop policy if exists "public read categories" on categories;
create policy "public read categories" on categories for select using (true);
drop policy if exists "public read bundles" on bundles;
create policy "public read bundles" on bundles for select using (true);
drop policy if exists "public read settings" on settings;
create policy "public read settings" on settings for select using (true);
-- subscribers/contact_messages: no public select policy - writes only via
-- the service-role key inside Netlify Functions, never from the browser.
--
-- No login/auth system is in place for customers - "account" on the site
-- is just the promo email signup (subscribers table above). The admin
-- panel is a separate, password-gated area for the site owner only (see
-- admin.html + backend/netlify/functions/admin-*.js).

-- Admin Inbox: read/unread and email-delivery status
alter table contact_messages add column if not exists read_at timestamptz;
alter table contact_messages add column if not exists emails_sent boolean;
alter table contact_messages add column if not exists email_error text;
alter table orders add column if not exists read_at timestamptz;
alter table orders add column if not exists email_error text;
