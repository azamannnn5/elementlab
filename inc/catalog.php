<?php
if (!defined('ABSPATH')) exit;

/**
 * Builds the product list in the exact shape the storefront JavaScript expects.
 * Source of truth: WooCommerce products and categories.
 */

function ib_bust_catalog() {
    delete_transient('ib_catalog_v2');
    update_option('ib_data_v', time(), false);
}
foreach (array('save_post_product', 'woocommerce_update_product', 'woocommerce_new_product', 'woocommerce_update_product_variation', 'woocommerce_new_product_variation', 'deleted_post', 'trashed_post', 'untrashed_post', 'created_product_cat', 'edited_product_cat', 'delete_product_cat') as $h) {
    add_action($h, 'ib_bust_catalog');
}
add_action('save_post_product', function () {
    if (function_exists('ib_purge_caches')) ib_purge_caches();
}, 99);

function ib_num($n) {
    $n = (float) $n;
    return floor($n) == $n ? (int) $n : round($n, 2);
}

function ib_lines_to_array($v) {
    return is_array($v) ? array_values($v) : array();
}

function ib_category_list() {
    if (!taxonomy_exists('product_cat')) return array();
    $terms = get_terms(array('taxonomy' => 'product_cat', 'hide_empty' => true, 'meta_key' => 'order', 'orderby' => 'meta_value_num', 'order' => 'ASC'));
    if (is_wp_error($terms)) return array();
    $out = array();
    foreach ($terms as $t) {
        if ($t->slug === 'uncategorized') continue;
        $out[] = array('id' => $t->slug, 'name' => $t->name, 'blurb' => trim(wp_strip_all_tags($t->description)));
    }
    return $out;
}

/** Full catalog (cached). Keys starting with "_" are private (server use only). */
function ib_catalog() {
    $cached = get_transient('ib_catalog_v2');
    if (is_array($cached)) return $cached;
    $items = array();
    if (!function_exists('wc_get_product')) return $items;
    $ids = get_posts(array(
        'post_type' => 'product', 'post_status' => 'publish', 'numberposts' => -1, 'fields' => 'ids',
        'orderby' => array('menu_order' => 'ASC', 'ID' => 'ASC'),
    ));
    foreach ($ids as $pid) {
        $p = wc_get_product($pid);
        if (!$p) continue;
        $ibid = get_post_meta($pid, '_ib_id', true);
        if ($ibid === '' || $ibid === false) $ibid = $p->get_slug();
        $cat = '';
        foreach (wp_get_post_terms($pid, 'product_cat') as $t) {
            if ($t->slug !== 'uncategorized') { $cat = $t->slug; break; }
        }
        $price = 0; $kit = null; $single_id = $pid; $kit_id = 0;
        if ($p->is_type('variable')) {
            foreach ($p->get_children() as $vid) {
                $v = wc_get_product($vid);
                if (!$v || !$v->is_purchasable()) continue;
                $attrs = array_map('strtolower', array_values($v->get_attributes()));
                $val = (float) $v->get_price();
                if (in_array('10-pack', $attrs, true)) { $kit = $val; $kit_id = $vid; }
                else { $price = $val; $single_id = $vid; }
            }
        } else {
            $price = (float) $p->get_price();
        }
        $content = trim(wp_strip_all_tags((string) $p->get_description(), false));
        $desc = $content === '' ? array() : array_values(array_filter(array_map('trim', preg_split('/\R\s*\R/', $content))));
        $img = '';
        $thumb = $p->get_image_id();
        if ($thumb) $img = (string) wp_get_attachment_url($thumb);
        $specs = array();
        foreach (ib_lines_to_array(get_post_meta($pid, '_ib_specs', true)) as $row) {
            if (is_array($row) && count($row) >= 2) $specs[] = array((string) $row[0], (string) $row[1]);
        }
        $item = array(
            'id' => (string) $ibid,
            'name' => $p->get_name(),
            'cat' => $cat,
            'price' => ib_num($price),
        );
        if ($kit !== null) $item['kit'] = ib_num($kit);
        $item['img'] = $img;
        $item['specs'] = $specs;
        $item['form'] = (string) get_post_meta($pid, '_ib_form', true);
        $item['strength'] = (string) get_post_meta($pid, '_ib_strength', true);
        $item['desc'] = $desc;
        $item['recs'] = array_map('strval', ib_lines_to_array(get_post_meta($pid, '_ib_recs', true)));
        $item['short'] = trim(wp_strip_all_tags($p->get_short_description()));
        $item['related'] = array_map('strval', ib_lines_to_array(get_post_meta($pid, '_ib_related', true)));
        $item['_pid'] = $pid; $item['_single_id'] = $single_id; $item['_kit_id'] = $kit_id;
        $items[] = $item;
    }
    set_transient('ib_catalog_v2', $items, 12 * HOUR_IN_SECONDS);
    return $items;
}

function ib_catalog_by_id() {
    $map = array();
    foreach (ib_catalog() as $it) $map[$it['id']] = $it;
    return $map;
}

function ib_public_catalog() {
    $out = array();
    foreach (ib_catalog() as $it) {
        foreach (array_keys($it) as $k) if ($k[0] === '_') unset($it[$k]);
        $out[] = $it;
    }
    return $out;
}

/* ---------- /js/data.js ---------- */
add_action('init', function () {
    $path = isset($_SERVER['REQUEST_URI']) ? wp_parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH) : '';
    if (!$path) return;
    $home = rtrim((string) wp_parse_url(home_url('/'), PHP_URL_PATH), '/');
    if ($path !== $home . '/js/data.js') return;
    $flags = JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES | JSON_PRETTY_PRINT;
    nocache_headers();
    header('Content-Type: application/javascript; charset=utf-8');
    header('Cache-Control: public, max-age=300');
    echo "// Imperial Blowork product list data. Managed in WooCommerce.\n";
    echo 'const CATEGORIES = ' . wp_json_encode(ib_category_list(), $flags) . ";\n";
    echo 'const PRODUCTS = ' . wp_json_encode(ib_public_catalog(), $flags) . ";\n";
    echo 'const MIN_ORDER = ' . ib_num(ib_min_order()) . ";\n";
    exit;
}, 1);
