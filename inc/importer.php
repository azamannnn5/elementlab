<?php
if (!defined('ABSPATH')) exit;

/* One-time product import from data/products.json into WooCommerce. Safe to run again (skips existing). */

function ib_import_data() {
    $d = json_decode((string) @file_get_contents(IB_CORE_PATH . 'data/products.json'), true);
    return is_array($d) ? $d : array('categories' => array(), 'products' => array());
}

function ib_import_categories($cats) {
    $i = 0;
    foreach ($cats as $c) {
        $i++;
        $t = get_term_by('slug', $c['id'], 'product_cat');
        if (!$t) {
            $r = wp_insert_term($c['name'], 'product_cat', array('slug' => $c['id'], 'description' => $c['blurb']));
            if (is_wp_error($r)) continue;
            $tid = $r['term_id'];
        } else {
            $tid = $t->term_id;
            wp_update_term($tid, 'product_cat', array('name' => $c['name'], 'description' => $c['blurb']));
        }
        update_term_meta($tid, 'order', $i);
    }
}

function ib_sideload_image($file, $title) {
    $existing = get_posts(array('post_type' => 'attachment', 'post_status' => 'inherit', 'meta_key' => '_ib_src', 'meta_value' => $file, 'numberposts' => 1, 'fields' => 'ids'));
    if ($existing) return (int) $existing[0];
    $src = IB_CORE_PATH . 'data/img/' . $file;
    if (!file_exists($src)) return 0;
    require_once ABSPATH . 'wp-admin/includes/file.php';
    require_once ABSPATH . 'wp-admin/includes/media.php';
    require_once ABSPATH . 'wp-admin/includes/image.php';
    $tmp = wp_tempnam($file);
    if (!$tmp || !copy($src, $tmp)) return 0;
    $id = media_handle_sideload(array('name' => $file, 'tmp_name' => $tmp), 0, $title, array('post_title' => $title));
    if (is_wp_error($id)) { @unlink($tmp); return 0; }
    update_post_meta($id, '_ib_src', $file);
    update_post_meta($id, '_wp_attachment_image_alt', $title);
    return (int) $id;
}

/** Returns 'created' | 'exists' | 'error'. */
function ib_import_product($p, $order) {
    $found = get_posts(array('post_type' => 'product', 'post_status' => 'any', 'meta_key' => '_ib_id', 'meta_value' => $p['id'], 'numberposts' => 1, 'fields' => 'ids'));
    if ($found) return 'exists';

    $term = get_term_by('slug', $p['cat'], 'product_cat');
    $variable = isset($p['kit']);
    $prod = $variable ? new WC_Product_Variable() : new WC_Product_Simple();
    $prod->set_name($p['name']);
    $prod->set_status('publish');
    $prod->set_catalog_visibility('visible');
    $prod->set_short_description($p['short']);
    $prod->set_description(implode("\n\n", $p['desc']));
    $prod->set_menu_order($order);
    $prod->set_manage_stock(false);
    $prod->set_stock_status('instock');
    $prod->set_virtual(false);
    if ($term) $prod->set_category_ids(array($term->term_id));
    $img = ib_sideload_image($p['img'], $p['name']);
    if ($img) $prod->set_image_id($img);

    if ($variable) {
        $attr = new WC_Product_Attribute();
        $attr->set_id(0);
        $attr->set_name('Size');
        $attr->set_options(array('Single vial', '10-pack'));
        $attr->set_position(0);
        $attr->set_visible(true);
        $attr->set_variation(true);
        $prod->set_attributes(array($attr));
    } else {
        $prod->set_regular_price((string) $p['price']);
    }
    $pid = $prod->save();
    if (!$pid) return 'error';

    update_post_meta($pid, '_ib_id', $p['id']);
    update_post_meta($pid, '_ib_specs', $p['specs']);
    update_post_meta($pid, '_ib_form', $p['form']);
    update_post_meta($pid, '_ib_strength', $p['strength']);
    update_post_meta($pid, '_ib_recs', $p['recs']);
    update_post_meta($pid, '_ib_related', $p['related']);

    if ($variable) {
        foreach (array(array('Single vial', $p['price']), array('10-pack', $p['kit'])) as $v) {
            $var = new WC_Product_Variation();
            $var->set_parent_id($pid);
            $var->set_attributes(array('size' => $v[0]));
            $var->set_regular_price((string) $v[1]);
            $var->set_status('publish');
            $var->set_manage_stock(false);
            $var->set_stock_status('instock');
            $var->save();
        }
        WC_Product_Variable::sync($pid);
    }
    return 'created';
}

add_action('wp_ajax_ib_import', function () {
    check_ajax_referer('ib_admin', 'nonce');
    if (!current_user_can('manage_options')) wp_send_json_error('forbidden', 403);
    if (!function_exists('wc_get_product')) wp_send_json_error('WooCommerce is not active.');
    @set_time_limit(120);
    $d = ib_import_data();
    $offset = max(0, (int) ($_POST['offset'] ?? 0));
    $limit = 4;
    if ($offset === 0) ib_import_categories($d['categories']);
    $slice = array_slice($d['products'], $offset, $limit);
    $log = array();
    foreach ($slice as $i => $p) {
        $log[] = $p['id'] . ': ' . ib_import_product($p, $offset + $i + 1);
    }
    $next = $offset + $limit;
    $done = $next >= count($d['products']);
    if ($done) { ib_bust_catalog(); ib_purge_caches(); }
    wp_send_json_success(array('next' => $next, 'total' => count($d['products']), 'done' => $done, 'log' => $log));
});
