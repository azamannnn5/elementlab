-- ElementLab Peptides: one-time update for the Supplements launch + admin Inbox
-- Run ONCE in Supabase: SQL Editor > New query > paste this whole file > Run.
-- Safe to run more than once. It only adds and updates rows: it does NOT
-- delete anything and does NOT change your prices or admin edits.
--
-- What it does
--   1. Adds the Inbox columns (read/unread + email status).
--   2. Clears the placeholder phone number (000) 000-0000.
--   3. Adds the "Supplements" category and the 18 creatine products.
--   4. Fixes the peptide product image paths (the old seed pointed at photos
--      that don't exist). Prices, sizes and any image you uploaded through the
--      admin panel are left alone.
--   5. Updates the wording that changed in this release, but ONLY where your
--      database still has the old default text (anything you rewrote yourself
--      in the admin panel is left as you wrote it).

-- 1. Inbox ------------------------------------------------------------------
-- Admin Inbox: read/unread and email-delivery status
alter table contact_messages add column if not exists read_at timestamptz;
alter table contact_messages add column if not exists emails_sent boolean;
alter table contact_messages add column if not exists email_error text;
alter table orders add column if not exists read_at timestamptz;
alter table orders add column if not exists email_error text;

-- 2. Phone ------------------------------------------------------------------
alter table settings alter column contact_phone drop default;
update settings set contact_phone = null where contact_phone = '(000) 000-0000';

-- 3. Supplements category + products ----------------------------------------
insert into categories (slug, name, blurb, image_url) values ('supplements', 'Supplements', 'Creatine and sports-nutrition supplements: powders, tablets, capsules, gummies and single-serve sachets from leading brands.', 'assets/img/categories/supplements.jpg') on conflict (slug) do nothing;
insert into products (slug, name, categories, appearance, cover_dose, doses, summary, research_applications, image_url, sds_url, chem_cas, chem_formula, chem_mw, thin_data, in_stock) values ('weider-micronized-creatine-blue-raspberry-300g', 'Weider Micronized Creatine Monohydrate - Blue Raspberry', array['supplements'], 'Flavoured Powder (Blue Raspberry Bubblegum)', '300g', '[{"label": "300g", "priceCents": 2499, "image": "assets/img/products/weider-micronized-creatine-blue-raspberry-300g.jpg"}]'::jsonb, 'Weider micronized creatine monohydrate powder in Blue Raspberry Bubblegum. 200 mesh ultrafine powder that mixes easily, with 60 servings per tub and AstraGin added.', array['200 mesh ultrafine micronized creatine monohydrate', '60 servings per 300g tub', 'Sugar free, fat free and stimulant free', 'Blue Raspberry Bubblegum flavour'], 'assets/img/products/weider-micronized-creatine-blue-raspberry-300g.jpg', null, null, null, null, false, true) on conflict (slug) do nothing;
insert into products (slug, name, categories, appearance, cover_dose, doses, summary, research_applications, image_url, sds_url, chem_cas, chem_formula, chem_mw, thin_data, in_stock) values ('weider-micronized-creatine-unflavoured-310g', 'Weider Micronized Creatine Monohydrate - Unflavoured', array['supplements'], 'Unflavoured Powder', '310g', '[{"label": "310g", "priceCents": 2399, "image": "assets/img/products/weider-micronized-creatine-unflavoured-310g.jpg"}]'::jsonb, 'Weider unflavoured micronized creatine monohydrate powder. 99% creatine monohydrate plus AstraGin, in a 200 mesh ultrafine grind for easy mixing.', array['99% creatine monohydrate + AstraGin', '200 mesh ultrafine powder', '62 servings per 310g tub', 'Sugar free, fat free and stimulant free'], 'assets/img/products/weider-micronized-creatine-unflavoured-310g.jpg', null, '6020-87-7', 'C4H9N3O2·H2O', '149.15 g/mol', false, true) on conflict (slug) do nothing;
insert into products (slug, name, categories, appearance, cover_dose, doses, summary, research_applications, image_url, sds_url, chem_cas, chem_formula, chem_mw, thin_data, in_stock) values ('weightworld-creatine-monohydrate-3000mg-270-tablets', 'WeightWorld Creatine Monohydrate 3000mg - 270 Tablets', array['supplements'], 'Tablets', '270 tablets', '[{"label": "270 tablets", "priceCents": 2799, "image": "assets/img/products/weightworld-creatine-monohydrate-3000mg-270-tablets.jpg"}]'::jsonb, 'WeightWorld creatine monohydrate tablets providing 3000mg per daily portion (3 tablets). A powder-free way to take creatine; vegan, gluten free and GMO free. The pack carries a French label.', array['3000mg creatine per portion (3 tablets daily)', '270 tablets, about a 3-month supply', 'Vegan and gluten free', 'French-language label'], 'assets/img/products/weightworld-creatine-monohydrate-3000mg-270-tablets.jpg', null, '6020-87-7', 'C4H9N3O2·H2O', '149.15 g/mol', false, true) on conflict (slug) do nothing;
insert into products (slug, name, categories, appearance, cover_dose, doses, summary, research_applications, image_url, sds_url, chem_cas, chem_formula, chem_mw, thin_data, in_stock) values ('weightworld-creatine-gummies-5k-lemon-90', 'WeightWorld Creatine Gummies 5K - Lemon', array['supplements'], 'Gummies (Natural Lemon Flavour)', '90 gummies', '[{"label": "90 gummies", "priceCents": 2799, "image": "assets/img/products/weightworld-creatine-gummies-5k-lemon-90.jpg"}]'::jsonb, 'Sugar-free creatine gummies delivering 5000mg per serving in a natural lemon flavour. Vegan and easy to take with no mixing. The pack carries a French label.', array['5000mg creatine per serving', '90 sugar-free vegan gummies', 'Natural lemon flavour', 'French-language label'], 'assets/img/products/weightworld-creatine-gummies-5k-lemon-90.jpg', null, null, null, null, false, true) on conflict (slug) do nothing;
insert into products (slug, name, categories, appearance, cover_dose, doses, summary, research_applications, image_url, sds_url, chem_cas, chem_formula, chem_mw, thin_data, in_stock) values ('gloryfeel-creatine-monohydrate-320-capsules', 'gloryfeel Creatine Monohydrate - 320 Capsules', array['supplements'], 'Capsules', '320 capsules', '[{"label": "320 capsules", "priceCents": 2699, "image": "assets/img/products/gloryfeel-creatine-monohydrate-320-capsules.jpg"}]'::jsonb, 'gloryfeel creatine monohydrate capsules providing 3000mg per daily dose (3 capsules). A large 320-capsule tub for long-term daily use without powder.', array['3000mg creatine per daily dose (3 capsules)', '320 capsules per tub', 'Powder-free and easy to take'], 'assets/img/products/gloryfeel-creatine-monohydrate-320-capsules.jpg', null, '6020-87-7', 'C4H9N3O2·H2O', '149.15 g/mol', false, true) on conflict (slug) do nothing;
insert into products (slug, name, categories, appearance, cover_dose, doses, summary, research_applications, image_url, sds_url, chem_cas, chem_formula, chem_mw, thin_data, in_stock) values ('gloryfeel-creatine-powder-500g', 'gloryfeel Creatine Powder - Pure Monohydrate', array['supplements'], 'Unflavoured Powder', '500g', '[{"label": "500g", "priceCents": 2999, "image": "assets/img/products/gloryfeel-creatine-powder-500g.jpg"}]'::jsonb, 'gloryfeel pure creatine monohydrate powder made with Creapure. Each serving gives 3409mg creatine monohydrate, of which 3000mg is creatine. Vegan.', array['Made with Creapure creatine monohydrate', '3409mg monohydrate per serving (3000mg creatine)', '500g tub, vegan'], 'assets/img/products/gloryfeel-creatine-powder-500g.jpg', null, '6020-87-7', 'C4H9N3O2·H2O', '149.15 g/mol', false, true) on conflict (slug) do nothing;
insert into products (slug, name, categories, appearance, cover_dose, doses, summary, research_applications, image_url, sds_url, chem_cas, chem_formula, chem_mw, thin_data, in_stock) values ('nutri-plus-creatine-powder-500g', 'nutri+ Creatin Powder', array['supplements'], 'Unflavoured Powder', '500g', '[{"label": "500g", "priceCents": 1999, "image": "assets/img/products/nutri-plus-creatine-powder-500g.jpg"}]'::jsonb, 'nutri+ plant-based unflavoured creatine powder in a resealable 500g pouch. Dissolves easily in water, juice or a shake.', array['Vegan, plant-based', 'Unflavoured, mixes into any drink', '500g resealable pouch'], 'assets/img/products/nutri-plus-creatine-powder-500g.jpg', null, '6020-87-7', 'C4H9N3O2·H2O', '149.15 g/mol', false, true) on conflict (slug) do nothing;
insert into products (slug, name, categories, appearance, cover_dose, doses, summary, research_applications, image_url, sds_url, chem_cas, chem_formula, chem_mw, thin_data, in_stock) values ('esn-ultrapure-creatine-300-capsules', 'ESN Ultrapure Creatine - 300 Vegan Capsules', array['supplements'], 'Vegan Capsules', '300 capsules', '[{"label": "300 capsules", "priceCents": 4999, "image": "assets/img/products/esn-ultrapure-creatine-300-capsules.jpg"}]'::jsonb, 'ESN Ultrapure Creatine, a premium-grade pure creatine monohydrate in 300 vegan capsules (100 servings) from Elite Sports Nutrition.', array['Premium grade pure creatine monohydrate', '300 vegan capsules, 100 servings', 'Improves strength performance (label claim)'], 'assets/img/products/esn-ultrapure-creatine-300-capsules.jpg', null, '6020-87-7', 'C4H9N3O2·H2O', '149.15 g/mol', false, true) on conflict (slug) do nothing;
insert into products (slug, name, categories, appearance, cover_dose, doses, summary, research_applications, image_url, sds_url, chem_cas, chem_formula, chem_mw, thin_data, in_stock) values ('on-micronised-creatine-powder-unflavoured-187g', 'Optimum Nutrition Micronised Creatine Powder - 187g', array['supplements'], 'Unflavoured Powder', '187g', '[{"label": "187g", "priceCents": 1999, "image": "assets/img/products/on-micronised-creatine-powder-unflavoured-187g.jpg"}]'::jsonb, 'Optimum Nutrition micronised creatine monohydrate powder in a 187g tub. 3g of creatine per serving, 55 servings; micronised for easy mixing.', array['3g creatine per serving', '55 servings per tub', 'Unflavoured, easy to stack with other supplements'], 'assets/img/products/on-micronised-creatine-powder-unflavoured-187g.jpg', null, '6020-87-7', 'C4H9N3O2·H2O', '149.15 g/mol', false, true) on conflict (slug) do nothing;
insert into products (slug, name, categories, appearance, cover_dose, doses, summary, research_applications, image_url, sds_url, chem_cas, chem_formula, chem_mw, thin_data, in_stock) values ('on-micronised-creatine-powder-unflavoured-317g', 'Optimum Nutrition Micronised Creatine Powder - 317g', array['supplements'], 'Unflavoured Powder', '317g', '[{"label": "317g", "priceCents": 2999, "image": "assets/img/products/on-micronised-creatine-powder-unflavoured-317g.jpg"}]'::jsonb, 'Optimum Nutrition 100% pure micronised creatine monohydrate powder in a 317g tub. 3g of creatine per serving, 93 servings; add to water, juice or a shake.', array['100% pure creatine monohydrate', '3g creatine per serving', '93 servings per tub'], 'assets/img/products/on-micronised-creatine-powder-unflavoured-317g.jpg', null, '6020-87-7', 'C4H9N3O2·H2O', '149.15 g/mol', false, true) on conflict (slug) do nothing;
insert into products (slug, name, categories, appearance, cover_dose, doses, summary, research_applications, image_url, sds_url, chem_cas, chem_formula, chem_mw, thin_data, in_stock) values ('on-micronised-creatine-powder-unflavoured-634g', 'Optimum Nutrition Micronised Creatine Powder - 634g', array['supplements'], 'Unflavoured Powder', '634g', '[{"label": "634g", "priceCents": 4499, "image": "assets/img/products/on-micronised-creatine-powder-unflavoured-634g.jpg"}]'::jsonb, 'Optimum Nutrition micronised creatine monohydrate powder in the large 634g tub. 3g of creatine per serving and 186 servings, the best value size in the range.', array['3g creatine per serving', '186 servings per tub', 'Unflavoured, micronised for solubility'], 'assets/img/products/on-micronised-creatine-powder-unflavoured-634g.jpg', null, '6020-87-7', 'C4H9N3O2·H2O', '149.15 g/mol', false, true) on conflict (slug) do nothing;
insert into products (slug, name, categories, appearance, cover_dose, doses, summary, research_applications, image_url, sds_url, chem_cas, chem_formula, chem_mw, thin_data, in_stock) values ('on-micronised-creatine-powder-orange-247g', 'Optimum Nutrition Micronised Creatine Powder - Orange', array['supplements'], 'Flavoured Powder (Orange)', '247.5g', '[{"label": "247.5g", "priceCents": 2499, "image": "assets/img/products/on-micronised-creatine-powder-orange-247g.jpg"}]'::jsonb, 'Optimum Nutrition micronised creatine powder in an orange flavour. 3g of creatine per serving and 55 servings in a 247.5g tub.', array['3g creatine per serving', '55 servings per tub', 'Orange flavour'], 'assets/img/products/on-micronised-creatine-powder-orange-247g.jpg', null, null, null, null, false, true) on conflict (slug) do nothing;
insert into products (slug, name, categories, appearance, cover_dose, doses, summary, research_applications, image_url, sds_url, chem_cas, chem_formula, chem_mw, thin_data, in_stock) values ('on-creatine-tablets-180', 'Optimum Nutrition Creatine Tablets', array['supplements'], 'Tablets', '180 tablets', '[{"label": "180 tablets", "priceCents": 2499, "image": "assets/img/products/on-creatine-tablets-180.jpg"}]'::jsonb, 'Optimum Nutrition creatine monohydrate tablets, 3.0g of creatine monohydrate per serving. 180 tablets per tub, a no-mix option for daily use.', array['3.0g creatine monohydrate per serving', '180 tablets per tub', 'Powder-free and easy to take'], 'assets/img/products/on-creatine-tablets-180.jpg', null, '6020-87-7', 'C4H9N3O2·H2O', '149.15 g/mol', false, true) on conflict (slug) do nothing;
insert into products (slug, name, categories, appearance, cover_dose, doses, summary, research_applications, image_url, sds_url, chem_cas, chem_formula, chem_mw, thin_data, in_stock) values ('on-micronised-creatine-sachets-unflavoured-3-pack', 'Optimum Nutrition Micronised Creatine Sachets - Unflavoured (3 Boxes)', array['supplements'], 'Unflavoured Sachets (3 boxes of 10)', '3 boxes', '[{"label": "3 boxes", "priceCents": 3499, "image": "assets/img/products/on-micronised-creatine-sachets-unflavoured-3-pack.jpg"}]'::jsonb, 'Three boxes of Optimum Nutrition micronised creatine sachets in one pack: 30 single-serve sachets in total (10 per 34g box), each with 3g of creatine. Ideal for travel and the gym bag.', array['Sold as 3 boxes in one order', '30 single-serve sachets in total', '3g creatine per sachet, unflavoured'], 'assets/img/products/on-micronised-creatine-sachets-unflavoured-3-pack.jpg', null, null, null, null, false, true) on conflict (slug) do nothing;
insert into products (slug, name, categories, appearance, cover_dose, doses, summary, research_applications, image_url, sds_url, chem_cas, chem_formula, chem_mw, thin_data, in_stock) values ('on-micronised-creatine-sachets-fruit-punch-45g', 'Optimum Nutrition Micronised Creatine Sachets - Fruit Punch', array['supplements'], 'Flavoured Sachets (Fruit Punch)', '10 sachets', '[{"label": "10 sachets", "priceCents": 1199, "image": "assets/img/products/on-micronised-creatine-sachets-fruit-punch-45g.jpg"}]'::jsonb, 'One box of 10 Optimum Nutrition micronised creatine sachets in Fruit Punch (45g). Each sachet gives 3g of creatine with no scooping or measuring.', array['10 single-serve sachets (45g)', '3g creatine per sachet', 'Fruit Punch flavour'], 'assets/img/products/on-micronised-creatine-sachets-fruit-punch-45g.jpg', null, null, null, null, false, true) on conflict (slug) do nothing;
insert into products (slug, name, categories, appearance, cover_dose, doses, summary, research_applications, image_url, sds_url, chem_cas, chem_formula, chem_mw, thin_data, in_stock) values ('on-platinum-creatine-plus-orange-astragin-350g', 'Optimum Nutrition Platinum Creatine Plus - Orange (AstraGin)', array['supplements'], 'Flavoured Powder (Orange)', '350g', '[{"label": "350g", "priceCents": 4499, "image": "assets/img/products/on-platinum-creatine-plus-orange-astragin-350g.jpg"}]'::jsonb, 'Optimum Nutrition''s advanced creatine formula with 3g of creatine, 500mg of AstraGin and 3mg of zinc per serving. Orange flavour, 50 servings. This is the AstraGin label version.', array['3g creatine, 500mg AstraGin and 3mg zinc per serving', 'Immunity and electrolyte support (label claim)', '50 servings per 350g tub, orange'], 'assets/img/products/on-platinum-creatine-plus-orange-astragin-350g.jpg', null, null, null, null, false, true) on conflict (slug) do nothing;
insert into products (slug, name, categories, appearance, cover_dose, doses, summary, research_applications, image_url, sds_url, chem_cas, chem_formula, chem_mw, thin_data, in_stock) values ('on-platinum-creatine-plus-orange-aquamin-350g', 'Optimum Nutrition Platinum Creatine Plus - Orange (Aquamin)', array['supplements'], 'Flavoured Powder (Orange)', '350g', '[{"label": "350g", "priceCents": 4499, "image": "assets/img/products/on-platinum-creatine-plus-orange-aquamin-350g.jpg"}]'::jsonb, 'Optimum Nutrition''s advanced creatine formula with 3g of creatine, 500mg of Aquamin and 3mg of zinc per serving. Orange flavour, 50 servings. This is the Aquamin label version.', array['3g creatine, 500mg Aquamin and 3mg zinc per serving', 'Immunity and electrolyte support (label claim)', '50 servings per 350g tub, orange'], 'assets/img/products/on-platinum-creatine-plus-orange-aquamin-350g.jpg', null, null, null, null, false, true) on conflict (slug) do nothing;
insert into products (slug, name, categories, appearance, cover_dose, doses, summary, research_applications, image_url, sds_url, chem_cas, chem_formula, chem_mw, thin_data, in_stock) values ('on-creatine-electrolyte-sachets-duo', 'Optimum Nutrition Creatine + Electrolyte Sachets Duo', array['supplements'], 'Sachets (2 boxes of 10)', '2 boxes', '[{"label": "2 boxes", "priceCents": 2299, "image": "assets/img/products/on-creatine-electrolyte-sachets-duo.jpg"}]'::jsonb, 'Two-box set sold together: Micronised Creatine Sachets in Fruit Punch (10 sachets, 45g) and Electrolyte Sachets in Forest Berries (10 sachets, 60g). Electrolytes per sachet: 400mg sodium, 300mg potassium, 113mg magnesium.', array['Sold as 2 boxes in one order', 'Creatine: 3g per sachet, Fruit Punch', 'Electrolytes: 400mg sodium, 300mg potassium, 113mg magnesium, Forest Berries'], 'assets/img/products/on-creatine-electrolyte-sachets-duo.jpg', null, null, null, null, false, true) on conflict (slug) do nothing;

-- 4. Peptide image paths ------------------------------------------------------
update products set
  image_url = case when image_url like 'http%' then image_url else 'assets/img/products/vial-blue-cap-white-powder.jpg' end,
  doses = (
    select coalesce(jsonb_agg(
      case when d->>'image' like 'http%' then d
           else d || jsonb_build_object('image', coalesce('{"5mg": "assets/img/products/vial-blue-cap-white-powder.jpg", "10mg": "assets/img/products/vial-blue-cap-white-powder.jpg", "15mg": "assets/img/products/vial-blue-cap-white-powder.jpg", "20mg": "assets/img/products/vial-blue-cap-white-powder.jpg", "30mg": "assets/img/products/vial-blue-cap-white-powder.jpg", "40mg": "assets/img/products/vial-blue-cap-white-powder.jpg", "50mg": "assets/img/products/vial-blue-cap-white-powder.jpg", "60mg": "assets/img/products/vial-blue-cap-white-powder.jpg"}'::jsonb ->> (d->>'label'), 'assets/img/products/vial-blue-cap-white-powder.jpg'))
      end order by ord), '[]'::jsonb)
    from jsonb_array_elements(doses) with ordinality as t(d, ord)
  )
where slug = 'retatrutide';
update products set
  image_url = case when image_url like 'http%' then image_url else 'assets/img/products/retatrutide-pen-40mg-box.jpg' end,
  doses = (
    select coalesce(jsonb_agg(
      case when d->>'image' like 'http%' then d
           else d || jsonb_build_object('image', coalesce('{"40mg": "assets/img/products/retatrutide-pen-40mg-box.jpg", "60mg": "assets/img/products/retatrutide-pen-60mg-box.jpg"}'::jsonb ->> (d->>'label'), 'assets/img/products/retatrutide-pen-40mg-box.jpg'))
      end order by ord), '[]'::jsonb)
    from jsonb_array_elements(doses) with ordinality as t(d, ord)
  )
where slug = 'retatrutide-pen';
update products set
  image_url = case when image_url like 'http%' then image_url else 'assets/img/products/retatrutide-pen-kit-40mg-box.jpg' end,
  doses = (
    select coalesce(jsonb_agg(
      case when d->>'image' like 'http%' then d
           else d || jsonb_build_object('image', coalesce('{"20mg": "assets/img/products/retatrutide-pen-kit-20mg-box.jpg", "40mg": "assets/img/products/retatrutide-pen-kit-40mg-box.jpg", "60mg": "assets/img/products/retatrutide-pen-kit-60mg-box.jpg"}'::jsonb ->> (d->>'label'), 'assets/img/products/retatrutide-pen-kit-40mg-box.jpg'))
      end order by ord), '[]'::jsonb)
    from jsonb_array_elements(doses) with ordinality as t(d, ord)
  )
where slug = 'retatrutide-pen-kit';
update products set
  image_url = case when image_url like 'http%' then image_url else 'assets/img/products/vial-blue-cap-white-powder.jpg' end,
  doses = (
    select coalesce(jsonb_agg(
      case when d->>'image' like 'http%' then d
           else d || jsonb_build_object('image', coalesce('{"5mg": "assets/img/products/vial-blue-cap-white-powder.jpg", "10mg": "assets/img/products/vial-blue-cap-white-powder.jpg", "15mg": "assets/img/products/vial-blue-cap-white-powder.jpg", "20mg": "assets/img/products/vial-blue-cap-white-powder.jpg", "30mg": "assets/img/products/vial-blue-cap-white-powder.jpg", "40mg": "assets/img/products/vial-blue-cap-white-powder.jpg", "50mg": "assets/img/products/vial-blue-cap-white-powder.jpg", "60mg": "assets/img/products/vial-blue-cap-white-powder.jpg"}'::jsonb ->> (d->>'label'), 'assets/img/products/vial-blue-cap-white-powder.jpg'))
      end order by ord), '[]'::jsonb)
    from jsonb_array_elements(doses) with ordinality as t(d, ord)
  )
where slug = 'tirzepatide';
update products set
  image_url = case when image_url like 'http%' then image_url else 'assets/img/products/vial-blue-cap-white-powder.jpg' end,
  doses = (
    select coalesce(jsonb_agg(
      case when d->>'image' like 'http%' then d
           else d || jsonb_build_object('image', coalesce('{"5mg": "assets/img/products/vial-blue-cap-white-powder.jpg", "10mg": "assets/img/products/vial-blue-cap-white-powder.jpg"}'::jsonb ->> (d->>'label'), 'assets/img/products/vial-blue-cap-white-powder.jpg'))
      end order by ord), '[]'::jsonb)
    from jsonb_array_elements(doses) with ordinality as t(d, ord)
  )
where slug = 'semaglutide';
update products set
  image_url = case when image_url like 'http%' then image_url else 'assets/img/products/vial-yellow-cap-white-powder.jpg' end,
  doses = (
    select coalesce(jsonb_agg(
      case when d->>'image' like 'http%' then d
           else d || jsonb_build_object('image', coalesce('{"5mg": "assets/img/products/vial-yellow-cap-white-powder.jpg", "10mg": "assets/img/products/vial-yellow-cap-white-powder.jpg"}'::jsonb ->> (d->>'label'), 'assets/img/products/vial-yellow-cap-white-powder.jpg'))
      end order by ord), '[]'::jsonb)
    from jsonb_array_elements(doses) with ordinality as t(d, ord)
  )
where slug = 'bpc-157';
update products set
  image_url = case when image_url like 'http%' then image_url else 'assets/img/products/vial-yellow-cap-white-powder.jpg' end,
  doses = (
    select coalesce(jsonb_agg(
      case when d->>'image' like 'http%' then d
           else d || jsonb_build_object('image', coalesce('{"2mg": "assets/img/products/vial-yellow-cap-white-powder.jpg", "5mg": "assets/img/products/vial-yellow-cap-white-powder.jpg", "10mg": "assets/img/products/vial-yellow-cap-white-powder.jpg"}'::jsonb ->> (d->>'label'), 'assets/img/products/vial-yellow-cap-white-powder.jpg'))
      end order by ord), '[]'::jsonb)
    from jsonb_array_elements(doses) with ordinality as t(d, ord)
  )
where slug = 'tb-500';
update products set
  image_url = case when image_url like 'http%' then image_url else 'assets/img/products/vial-yellow-cap-white-powder.jpg' end,
  doses = (
    select coalesce(jsonb_agg(
      case when d->>'image' like 'http%' then d
           else d || jsonb_build_object('image', coalesce('{"5mg": "assets/img/products/vial-yellow-cap-white-powder.jpg"}'::jsonb ->> (d->>'label'), 'assets/img/products/vial-yellow-cap-white-powder.jpg'))
      end order by ord), '[]'::jsonb)
    from jsonb_array_elements(doses) with ordinality as t(d, ord)
  )
where slug = 'thymosin-alpha-1';
update products set
  image_url = case when image_url like 'http%' then image_url else 'assets/img/products/vial-yellow-cap-white-powder.jpg' end,
  doses = (
    select coalesce(jsonb_agg(
      case when d->>'image' like 'http%' then d
           else d || jsonb_build_object('image', coalesce('{"2mg": "assets/img/products/vial-yellow-cap-white-powder.jpg", "5mg": "assets/img/products/vial-yellow-cap-white-powder.jpg"}'::jsonb ->> (d->>'label'), 'assets/img/products/vial-yellow-cap-white-powder.jpg'))
      end order by ord), '[]'::jsonb)
    from jsonb_array_elements(doses) with ordinality as t(d, ord)
  )
where slug = 'cjc-1295-no-dac';
update products set
  image_url = case when image_url like 'http%' then image_url else 'assets/img/products/vial-yellow-cap-white-powder.jpg' end,
  doses = (
    select coalesce(jsonb_agg(
      case when d->>'image' like 'http%' then d
           else d || jsonb_build_object('image', coalesce('{"2mg": "assets/img/products/vial-yellow-cap-white-powder.jpg", "5mg": "assets/img/products/vial-yellow-cap-white-powder.jpg"}'::jsonb ->> (d->>'label'), 'assets/img/products/vial-yellow-cap-white-powder.jpg'))
      end order by ord), '[]'::jsonb)
    from jsonb_array_elements(doses) with ordinality as t(d, ord)
  )
where slug = 'cjc-1295-dac';
update products set
  image_url = case when image_url like 'http%' then image_url else 'assets/img/products/vial-yellow-cap-white-powder.jpg' end,
  doses = (
    select coalesce(jsonb_agg(
      case when d->>'image' like 'http%' then d
           else d || jsonb_build_object('image', coalesce('{"2mg": "assets/img/products/vial-yellow-cap-white-powder.jpg", "5mg": "assets/img/products/vial-yellow-cap-white-powder.jpg"}'::jsonb ->> (d->>'label'), 'assets/img/products/vial-yellow-cap-white-powder.jpg'))
      end order by ord), '[]'::jsonb)
    from jsonb_array_elements(doses) with ordinality as t(d, ord)
  )
where slug = 'ipamorelin';
update products set
  image_url = case when image_url like 'http%' then image_url else 'assets/img/products/vial-yellow-cap-white-powder.jpg' end,
  doses = (
    select coalesce(jsonb_agg(
      case when d->>'image' like 'http%' then d
           else d || jsonb_build_object('image', coalesce('{"5mg": "assets/img/products/vial-yellow-cap-white-powder.jpg", "10mg": "assets/img/products/vial-yellow-cap-white-powder.jpg"}'::jsonb ->> (d->>'label'), 'assets/img/products/vial-yellow-cap-white-powder.jpg'))
      end order by ord), '[]'::jsonb)
    from jsonb_array_elements(doses) with ordinality as t(d, ord)
  )
where slug = 'ghrp-2';
update products set
  image_url = case when image_url like 'http%' then image_url else 'assets/img/products/vial-yellow-cap-white-powder.jpg' end,
  doses = (
    select coalesce(jsonb_agg(
      case when d->>'image' like 'http%' then d
           else d || jsonb_build_object('image', coalesce('{"5mg": "assets/img/products/vial-yellow-cap-white-powder.jpg", "10mg": "assets/img/products/vial-yellow-cap-white-powder.jpg"}'::jsonb ->> (d->>'label'), 'assets/img/products/vial-yellow-cap-white-powder.jpg'))
      end order by ord), '[]'::jsonb)
    from jsonb_array_elements(doses) with ordinality as t(d, ord)
  )
where slug = 'ghrp-6';
update products set
  image_url = case when image_url like 'http%' then image_url else 'assets/img/products/vial-yellow-cap-white-powder.jpg' end,
  doses = (
    select coalesce(jsonb_agg(
      case when d->>'image' like 'http%' then d
           else d || jsonb_build_object('image', coalesce('{"2mg": "assets/img/products/vial-yellow-cap-white-powder.jpg"}'::jsonb ->> (d->>'label'), 'assets/img/products/vial-yellow-cap-white-powder.jpg'))
      end order by ord), '[]'::jsonb)
    from jsonb_array_elements(doses) with ordinality as t(d, ord)
  )
where slug = 'hexarelin';
update products set
  image_url = case when image_url like 'http%' then image_url else 'assets/img/products/vial-yellow-cap-white-powder.jpg' end,
  doses = (
    select coalesce(jsonb_agg(
      case when d->>'image' like 'http%' then d
           else d || jsonb_build_object('image', coalesce('{"2mg": "assets/img/products/vial-yellow-cap-white-powder.jpg"}'::jsonb ->> (d->>'label'), 'assets/img/products/vial-yellow-cap-white-powder.jpg'))
      end order by ord), '[]'::jsonb)
    from jsonb_array_elements(doses) with ordinality as t(d, ord)
  )
where slug = 'tesamorelin';
update products set
  image_url = case when image_url like 'http%' then image_url else 'assets/img/products/vial-yellow-cap-white-powder.jpg' end,
  doses = (
    select coalesce(jsonb_agg(
      case when d->>'image' like 'http%' then d
           else d || jsonb_build_object('image', coalesce('{"2mg": "assets/img/products/vial-yellow-cap-white-powder.jpg", "5mg": "assets/img/products/vial-yellow-cap-white-powder.jpg"}'::jsonb ->> (d->>'label'), 'assets/img/products/vial-yellow-cap-white-powder.jpg'))
      end order by ord), '[]'::jsonb)
    from jsonb_array_elements(doses) with ordinality as t(d, ord)
  )
where slug = 'hgh-fragment-176-191';
update products set
  image_url = case when image_url like 'http%' then image_url else 'assets/img/products/vial-yellow-cap-white-powder.jpg' end,
  doses = (
    select coalesce(jsonb_agg(
      case when d->>'image' like 'http%' then d
           else d || jsonb_build_object('image', coalesce('{"1mg": "assets/img/products/vial-yellow-cap-white-powder.jpg"}'::jsonb ->> (d->>'label'), 'assets/img/products/vial-yellow-cap-white-powder.jpg'))
      end order by ord), '[]'::jsonb)
    from jsonb_array_elements(doses) with ordinality as t(d, ord)
  )
where slug = 'igf-lr3';
update products set
  image_url = case when image_url like 'http%' then image_url else 'assets/img/products/vial-yellow-cap-blue-powder.jpg' end,
  doses = (
    select coalesce(jsonb_agg(
      case when d->>'image' like 'http%' then d
           else d || jsonb_build_object('image', coalesce('{"50mg": "assets/img/products/vial-yellow-cap-blue-powder.jpg"}'::jsonb ->> (d->>'label'), 'assets/img/products/vial-yellow-cap-blue-powder.jpg'))
      end order by ord), '[]'::jsonb)
    from jsonb_array_elements(doses) with ordinality as t(d, ord)
  )
where slug = 'ghk-cu';
update products set
  image_url = case when image_url like 'http%' then image_url else 'assets/img/products/vial-red-cap-white-powder.jpg' end,
  doses = (
    select coalesce(jsonb_agg(
      case when d->>'image' like 'http%' then d
           else d || jsonb_build_object('image', coalesce('{"10mg": "assets/img/products/vial-red-cap-white-powder.jpg"}'::jsonb ->> (d->>'label'), 'assets/img/products/vial-red-cap-white-powder.jpg'))
      end order by ord), '[]'::jsonb)
    from jsonb_array_elements(doses) with ordinality as t(d, ord)
  )
where slug = 'epitalon';
update products set
  image_url = case when image_url like 'http%' then image_url else 'assets/img/products/vial-red-cap-white-powder.jpg' end,
  doses = (
    select coalesce(jsonb_agg(
      case when d->>'image' like 'http%' then d
           else d || jsonb_build_object('image', coalesce('{"5mg": "assets/img/products/vial-red-cap-white-powder.jpg"}'::jsonb ->> (d->>'label'), 'assets/img/products/vial-red-cap-white-powder.jpg'))
      end order by ord), '[]'::jsonb)
    from jsonb_array_elements(doses) with ordinality as t(d, ord)
  )
where slug = 'dsip';
update products set
  image_url = case when image_url like 'http%' then image_url else 'assets/img/products/vial-red-cap-white-powder.jpg' end,
  doses = (
    select coalesce(jsonb_agg(
      case when d->>'image' like 'http%' then d
           else d || jsonb_build_object('image', coalesce('{"10mg": "assets/img/products/vial-red-cap-white-powder.jpg"}'::jsonb ->> (d->>'label'), 'assets/img/products/vial-red-cap-white-powder.jpg'))
      end order by ord), '[]'::jsonb)
    from jsonb_array_elements(doses) with ordinality as t(d, ord)
  )
where slug = 'pt-141';
update products set
  image_url = case when image_url like 'http%' then image_url else 'assets/img/products/vial-red-cap-white-powder.jpg' end,
  doses = (
    select coalesce(jsonb_agg(
      case when d->>'image' like 'http%' then d
           else d || jsonb_build_object('image', coalesce('{"2mg": "assets/img/products/vial-red-cap-white-powder.jpg", "5mg": "assets/img/products/vial-red-cap-white-powder.jpg"}'::jsonb ->> (d->>'label'), 'assets/img/products/vial-red-cap-white-powder.jpg'))
      end order by ord), '[]'::jsonb)
    from jsonb_array_elements(doses) with ordinality as t(d, ord)
  )
where slug = 'aod-9604';
update products set
  image_url = case when image_url like 'http%' then image_url else 'assets/img/products/vial-red-cap-white-powder.jpg' end,
  doses = (
    select coalesce(jsonb_agg(
      case when d->>'image' like 'http%' then d
           else d || jsonb_build_object('image', coalesce('{"10mg": "assets/img/products/vial-red-cap-white-powder.jpg"}'::jsonb ->> (d->>'label'), 'assets/img/products/vial-red-cap-white-powder.jpg'))
      end order by ord), '[]'::jsonb)
    from jsonb_array_elements(doses) with ordinality as t(d, ord)
  )
where slug = 'mots-c';
update products set
  image_url = case when image_url like 'http%' then image_url else 'assets/img/products/vial-red-cap-white-powder.jpg' end,
  doses = (
    select coalesce(jsonb_agg(
      case when d->>'image' like 'http%' then d
           else d || jsonb_build_object('image', coalesce('{"5mg": "assets/img/products/vial-red-cap-white-powder.jpg", "10mg": "assets/img/products/vial-red-cap-white-powder.jpg"}'::jsonb ->> (d->>'label'), 'assets/img/products/vial-red-cap-white-powder.jpg'))
      end order by ord), '[]'::jsonb)
    from jsonb_array_elements(doses) with ordinality as t(d, ord)
  )
where slug = 'kpv';
update products set
  image_url = case when image_url like 'http%' then image_url else 'assets/img/products/vial-red-cap-white-powder.jpg' end,
  doses = (
    select coalesce(jsonb_agg(
      case when d->>'image' like 'http%' then d
           else d || jsonb_build_object('image', coalesce('{"5mg": "assets/img/products/vial-red-cap-white-powder.jpg"}'::jsonb ->> (d->>'label'), 'assets/img/products/vial-red-cap-white-powder.jpg'))
      end order by ord), '[]'::jsonb)
    from jsonb_array_elements(doses) with ordinality as t(d, ord)
  )
where slug = 'll-37';
update products set
  image_url = case when image_url like 'http%' then image_url else 'assets/img/products/vial-red-cap-white-powder.jpg' end,
  doses = (
    select coalesce(jsonb_agg(
      case when d->>'image' like 'http%' then d
           else d || jsonb_build_object('image', coalesce('{"10mg": "assets/img/products/vial-red-cap-white-powder.jpg"}'::jsonb ->> (d->>'label'), 'assets/img/products/vial-red-cap-white-powder.jpg'))
      end order by ord), '[]'::jsonb)
    from jsonb_array_elements(doses) with ordinality as t(d, ord)
  )
where slug = 'melanotan-2';
update products set
  image_url = case when image_url like 'http%' then image_url else 'assets/img/products/vial-red-cap-white-powder.jpg' end,
  doses = (
    select coalesce(jsonb_agg(
      case when d->>'image' like 'http%' then d
           else d || jsonb_build_object('image', coalesce('{"5mg": "assets/img/products/vial-red-cap-white-powder.jpg"}'::jsonb ->> (d->>'label'), 'assets/img/products/vial-red-cap-white-powder.jpg'))
      end order by ord), '[]'::jsonb)
    from jsonb_array_elements(doses) with ordinality as t(d, ord)
  )
where slug = 'selank';
update products set
  image_url = case when image_url like 'http%' then image_url else 'assets/img/products/vial-red-cap-white-powder.jpg' end,
  doses = (
    select coalesce(jsonb_agg(
      case when d->>'image' like 'http%' then d
           else d || jsonb_build_object('image', coalesce('{"5mg": "assets/img/products/vial-red-cap-white-powder.jpg"}'::jsonb ->> (d->>'label'), 'assets/img/products/vial-red-cap-white-powder.jpg'))
      end order by ord), '[]'::jsonb)
    from jsonb_array_elements(doses) with ordinality as t(d, ord)
  )
where slug = 'semax';
update products set
  image_url = case when image_url like 'http%' then image_url else 'assets/img/products/vial-red-cap-white-powder.jpg' end,
  doses = (
    select coalesce(jsonb_agg(
      case when d->>'image' like 'http%' then d
           else d || jsonb_build_object('image', coalesce('{"5mg": "assets/img/products/vial-red-cap-white-powder.jpg"}'::jsonb ->> (d->>'label'), 'assets/img/products/vial-red-cap-white-powder.jpg'))
      end order by ord), '[]'::jsonb)
    from jsonb_array_elements(doses) with ordinality as t(d, ord)
  )
where slug = 'kisspeptin-10';
update products set
  image_url = case when image_url like 'http%' then image_url else 'assets/img/products/vial-red-cap-white-powder.jpg' end,
  doses = (
    select coalesce(jsonb_agg(
      case when d->>'image' like 'http%' then d
           else d || jsonb_build_object('image', coalesce('{"1mg": "assets/img/products/vial-red-cap-white-powder.jpg"}'::jsonb ->> (d->>'label'), 'assets/img/products/vial-red-cap-white-powder.jpg'))
      end order by ord), '[]'::jsonb)
    from jsonb_array_elements(doses) with ordinality as t(d, ord)
  )
where slug = 'ace-031';
update products set
  image_url = case when image_url like 'http%' then image_url else 'assets/img/products/vial-red-cap-white-powder.jpg' end,
  doses = (
    select coalesce(jsonb_agg(
      case when d->>'image' like 'http%' then d
           else d || jsonb_build_object('image', coalesce('{"5mg": "assets/img/products/vial-red-cap-white-powder.jpg"}'::jsonb ->> (d->>'label'), 'assets/img/products/vial-red-cap-white-powder.jpg'))
      end order by ord), '[]'::jsonb)
    from jsonb_array_elements(doses) with ordinality as t(d, ord)
  )
where slug = 'adamax';
update products set
  image_url = case when image_url like 'http%' then image_url else 'assets/img/products/vial-red-cap-white-powder.jpg' end,
  doses = (
    select coalesce(jsonb_agg(
      case when d->>'image' like 'http%' then d
           else d || jsonb_build_object('image', coalesce('{"16mg": "assets/img/products/vial-red-cap-white-powder.jpg"}'::jsonb ->> (d->>'label'), 'assets/img/products/vial-red-cap-white-powder.jpg'))
      end order by ord), '[]'::jsonb)
    from jsonb_array_elements(doses) with ordinality as t(d, ord)
  )
where slug = 'ara-290';
update products set
  image_url = case when image_url like 'http%' then image_url else 'assets/img/products/vial-red-cap-white-powder.jpg' end,
  doses = (
    select coalesce(jsonb_agg(
      case when d->>'image' like 'http%' then d
           else d || jsonb_build_object('image', coalesce('{"20mg": "assets/img/products/vial-red-cap-white-powder.jpg"}'::jsonb ->> (d->>'label'), 'assets/img/products/vial-red-cap-white-powder.jpg'))
      end order by ord), '[]'::jsonb)
    from jsonb_array_elements(doses) with ordinality as t(d, ord)
  )
where slug = 'bronchogen';
update products set
  image_url = case when image_url like 'http%' then image_url else 'assets/img/products/vial-red-cap-white-powder.jpg' end,
  doses = (
    select coalesce(jsonb_agg(
      case when d->>'image' like 'http%' then d
           else d || jsonb_build_object('image', coalesce('{"20mg": "assets/img/products/vial-red-cap-white-powder.jpg"}'::jsonb ->> (d->>'label'), 'assets/img/products/vial-red-cap-white-powder.jpg'))
      end order by ord), '[]'::jsonb)
    from jsonb_array_elements(doses) with ordinality as t(d, ord)
  )
where slug = 'cartalax';
update products set
  image_url = case when image_url like 'http%' then image_url else 'assets/img/products/vial-red-cap-white-powder.jpg' end,
  doses = (
    select coalesce(jsonb_agg(
      case when d->>'image' like 'http%' then d
           else d || jsonb_build_object('image', coalesce('{"10mg": "assets/img/products/vial-red-cap-white-powder.jpg"}'::jsonb ->> (d->>'label'), 'assets/img/products/vial-red-cap-white-powder.jpg'))
      end order by ord), '[]'::jsonb)
    from jsonb_array_elements(doses) with ordinality as t(d, ord)
  )
where slug = 'colivelin';
update products set
  image_url = case when image_url like 'http%' then image_url else 'assets/img/products/vial-red-cap-white-powder.jpg' end,
  doses = (
    select coalesce(jsonb_agg(
      case when d->>'image' like 'http%' then d
           else d || jsonb_build_object('image', coalesce('{"20mg": "assets/img/products/vial-red-cap-white-powder.jpg"}'::jsonb ->> (d->>'label'), 'assets/img/products/vial-red-cap-white-powder.jpg'))
      end order by ord), '[]'::jsonb)
    from jsonb_array_elements(doses) with ordinality as t(d, ord)
  )
where slug = 'cortagen';
update products set
  image_url = case when image_url like 'http%' then image_url else 'assets/img/products/vial-red-cap-white-powder.jpg' end,
  doses = (
    select coalesce(jsonb_agg(
      case when d->>'image' like 'http%' then d
           else d || jsonb_build_object('image', coalesce('{"20mg": "assets/img/products/vial-red-cap-white-powder.jpg"}'::jsonb ->> (d->>'label'), 'assets/img/products/vial-red-cap-white-powder.jpg'))
      end order by ord), '[]'::jsonb)
    from jsonb_array_elements(doses) with ordinality as t(d, ord)
  )
where slug = 'crystagen';
update products set
  image_url = case when image_url like 'http%' then image_url else 'assets/img/products/vial-red-cap-white-powder.jpg' end,
  doses = (
    select coalesce(jsonb_agg(
      case when d->>'image' like 'http%' then d
           else d || jsonb_build_object('image', coalesce('{"2mg": "assets/img/products/vial-red-cap-white-powder.jpg"}'::jsonb ->> (d->>'label'), 'assets/img/products/vial-red-cap-white-powder.jpg'))
      end order by ord), '[]'::jsonb)
    from jsonb_array_elements(doses) with ordinality as t(d, ord)
  )
where slug = 'dermorphin';
update products set
  image_url = case when image_url like 'http%' then image_url else 'assets/img/products/vial-red-cap-white-powder.jpg' end,
  doses = (
    select coalesce(jsonb_agg(
      case when d->>'image' like 'http%' then d
           else d || jsonb_build_object('image', coalesce('{"10mg": "assets/img/products/vial-red-cap-white-powder.jpg"}'::jsonb ->> (d->>'label'), 'assets/img/products/vial-red-cap-white-powder.jpg'))
      end order by ord), '[]'::jsonb)
    from jsonb_array_elements(doses) with ordinality as t(d, ord)
  )
where slug = 'dihexa';
update products set
  image_url = case when image_url like 'http%' then image_url else 'assets/img/products/vial-red-cap-white-powder.jpg' end,
  doses = (
    select coalesce(jsonb_agg(
      case when d->>'image' like 'http%' then d
           else d || jsonb_build_object('image', coalesce('{"5mg": "assets/img/products/vial-red-cap-white-powder.jpg"}'::jsonb ->> (d->>'label'), 'assets/img/products/vial-red-cap-white-powder.jpg'))
      end order by ord), '[]'::jsonb)
    from jsonb_array_elements(doses) with ordinality as t(d, ord)
  )
where slug = 'dnsp-11';
update products set
  image_url = case when image_url like 'http%' then image_url else 'assets/img/products/vial-red-cap-white-powder.jpg' end,
  doses = (
    select coalesce(jsonb_agg(
      case when d->>'image' like 'http%' then d
           else d || jsonb_build_object('image', coalesce('{"1mg": "assets/img/products/vial-red-cap-white-powder.jpg"}'::jsonb ->> (d->>'label'), 'assets/img/products/vial-red-cap-white-powder.jpg'))
      end order by ord), '[]'::jsonb)
    from jsonb_array_elements(doses) with ordinality as t(d, ord)
  )
where slug = 'follistatin';
update products set
  image_url = case when image_url like 'http%' then image_url else 'assets/img/products/vial-red-cap-white-powder.jpg' end,
  doses = (
    select coalesce(jsonb_agg(
      case when d->>'image' like 'http%' then d
           else d || jsonb_build_object('image', coalesce('{"250mg": "assets/img/products/vial-red-cap-white-powder.jpg", "500mg": "assets/img/products/vial-red-cap-white-powder.jpg"}'::jsonb ->> (d->>'label'), 'assets/img/products/vial-red-cap-white-powder.jpg'))
      end order by ord), '[]'::jsonb)
    from jsonb_array_elements(doses) with ordinality as t(d, ord)
  )
where slug = 'nad-plus';
update products set
  image_url = case when image_url like 'http%' then image_url else 'assets/img/products/vial-red-cap-white-powder.jpg' end,
  doses = (
    select coalesce(jsonb_agg(
      case when d->>'image' like 'http%' then d
           else d || jsonb_build_object('image', coalesce('{"2mg": "assets/img/products/vial-red-cap-white-powder.jpg"}'::jsonb ->> (d->>'label'), 'assets/img/products/vial-red-cap-white-powder.jpg'))
      end order by ord), '[]'::jsonb)
    from jsonb_array_elements(doses) with ordinality as t(d, ord)
  )
where slug = 'thymalin';
update products set
  image_url = case when image_url like 'http%' then image_url else 'assets/img/products/vial-blue-cap-liquid.jpg' end,
  doses = (
    select coalesce(jsonb_agg(
      case when d->>'image' like 'http%' then d
           else d || jsonb_build_object('image', coalesce('{"10ml": "assets/img/products/vial-blue-cap-liquid.jpg"}'::jsonb ->> (d->>'label'), 'assets/img/products/vial-blue-cap-liquid.jpg'))
      end order by ord), '[]'::jsonb)
    from jsonb_array_elements(doses) with ordinality as t(d, ord)
  )
where slug = 'bacteriostatic-water';
update products set
  image_url = case when image_url like 'http%' then image_url else 'assets/img/products/vial-blue-cap-liquid.jpg' end,
  doses = (
    select coalesce(jsonb_agg(
      case when d->>'image' like 'http%' then d
           else d || jsonb_build_object('image', coalesce('{"10ml": "assets/img/products/vial-blue-cap-liquid.jpg"}'::jsonb ->> (d->>'label'), 'assets/img/products/vial-blue-cap-liquid.jpg'))
      end order by ord), '[]'::jsonb)
    from jsonb_array_elements(doses) with ordinality as t(d, ord)
  )
where slug = 'acetic-acid';

-- 5. Wording updates ------------------------------------------------------------
update settings set announcements = array_replace(announcements, 'Research materials for sale. Laboratory research use only. Not for human or veterinary use.', 'Research peptides: laboratory use only, not for human or veterinary use. Creatine and supplements also available.') where id = 1;

do $$
declare
  sc jsonb;
begin
  select site_content into sc from settings where id = 1;
  if sc is not null then
  if sc #>> '{home,heroEyebrow}' = $q$Research Use Only$q$ then
    sc := jsonb_set(sc, '{home,heroEyebrow}', to_jsonb($q$Research Peptides & Supplements$q$::text));
  end if;
  if sc #>> '{home,heroLead}' = $q$Discover premium research-grade peptides. Trusted by researchers worldwide for quality and reliability. Fast next-day US delivery and worldwide shipping.$q$ then
    sc := jsonb_set(sc, '{home,heroLead}', to_jsonb($q$Discover premium research-grade peptides. Trusted by researchers worldwide for quality and reliability. Fast next-day US delivery and worldwide shipping. Also stocking creatine and sports-nutrition supplements.$q$::text));
  end if;
  if sc #>> '{home,complianceHeading}' = $q$Research Use Only$q$ then
    sc := jsonb_set(sc, '{home,complianceHeading}', to_jsonb($q$Research Use & Supplements Notice$q$::text));
  end if;
  if sc #>> '{home,complianceText}' = $q$ElementLab Peptides sells premium research materials intended for laboratory research purposes only. They are not intended for human consumption, therapeutic use, or veterinary use. Customers are responsible for ensuring that their purchase and use of these products comply with all applicable laws and regulations in their jurisdiction.$q$ then
    sc := jsonb_set(sc, '{home,complianceText}', to_jsonb($q$ElementLab Peptides sells research peptides and laboratory materials intended for laboratory research purposes only. These are not intended for human consumption, therapeutic use, or veterinary use. Our creatine and other supplement products are food supplements for adults, sold separately from the research range and used as directed on their label. Customers are responsible for ensuring that their purchase and use of all products comply with all applicable laws and regulations in their jurisdiction.$q$::text));
  end if;
  if sc #>> '{about,ruoP1}' = $q$ElementLab Peptides sells premium research materials intended for laboratory research purposes only. They are not intended for human consumption, therapeutic use, or veterinary use.$q$ then
    sc := jsonb_set(sc, '{about,ruoP1}', to_jsonb($q$ElementLab Peptides sells research peptides and laboratory materials intended for laboratory research purposes only. These are not intended for human consumption, therapeutic use, or veterinary use. Our creatine and other supplement products are food supplements for adults and are not covered by this restriction.$q$::text));
  end if;
  if sc #>> '{delivery,ruoTitle}' = $q$Research Use Only$q$ then
    sc := jsonb_set(sc, '{delivery,ruoTitle}', to_jsonb($q$Research Use & Supplements$q$::text));
  end if;
  if sc #>> '{delivery,ruoText}' = $q$ElementLab Peptides sells premium research materials intended for laboratory research purposes only. They are not intended for human consumption, therapeutic use, or veterinary use. Customers are responsible for ensuring compliance with all applicable laws and regulations in their jurisdiction.$q$ then
    sc := jsonb_set(sc, '{delivery,ruoText}', to_jsonb($q$ElementLab Peptides sells research peptides and laboratory materials intended for laboratory research purposes only. These are not intended for human consumption, therapeutic use, or veterinary use. Our creatine and other supplement products are food supplements for adults, used as directed on their label. Customers are responsible for ensuring compliance with all applicable laws and regulations in their jurisdiction.$q$::text));
  end if;
    update settings set site_content = sc where id = 1;
  end if;
end $$;

-- FAQ list (only matters if you have saved FAQs in the admin panel)
update settings set faqs = replace(replace(faqs::text,
    'Every ElementLab Peptides product is independently tested', 'Every ElementLab Peptides research peptide is independently tested'),
    'All products are sold strictly for in-vitro laboratory research use', 'Research peptides and laboratory supplies are sold strictly for in-vitro laboratory research use')::jsonb
where id = 1 and jsonb_array_length(faqs) > 0;
update settings set faqs = faqs || $q$[{"id": "creatine-supplements", "q": "Are your creatine products for research use too?", "a": "No. Our creatine products are food supplements for adults, sold in their original branded packaging and used as directed on the label. The research-use-only wording on this site applies to our research peptides and laboratory supplies, not to the supplements. You can browse them in the Supplements category."}]$q$::jsonb
where id = 1 and jsonb_array_length(faqs) > 0 and not (faqs @> '[{"id":"creatine-supplements"}]'::jsonb);
