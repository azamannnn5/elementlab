<?php
if (!defined('ABSPATH')) exit;

/* Read and write products for the admin panel (WooCommerce is the source of truth). */

function ib_admin_attachment_from_url($url) {
    $url = trim((string) $url);
    if ($url === '') return 0;
    $id = attachment_url_to_postid($url);
    if ($id) return (int) $id;
    // An image that ships with the theme: copy it into the media library.
    $theme = trailingslashit(get_template_directory_uri()) . 'site/';
    $theme_http = set_url_scheme($theme, 'http'); $theme_https = set_url_scheme($theme, 'https');
    foreach (array($theme_http, $theme_https) as $base) {
        if (strpos($url, $base) === 0) {
            $rel = ltrim(substr($url, strlen($base)), '/');
            $path = realpath(get_template_directory() . '/site/' . $rel);
            $root = realpath(get_template_directory() . '/site');
            if ($path && $root && strpos($path, $root) === 0 && is_file($path)) {
                require_once ABSPATH . 'wp-admin/includes/file.php';
                require_once ABSPATH . 'wp-admin/includes/media.php';
                require_once ABSPATH . 'wp-admin/includes/image.php';
                $tmp = wp_tempnam(basename($path));
                if ($tmp && copy($path, $tmp)) {
                    $att = media_handle_sideload(array('name' => basename($path), 'tmp_name' => $tmp), 0);
                    if (!is_wp_error($att)) return (int) $att;
                    @unlink($tmp);
                }
            }
        }
    }
    return 0;
}

function ib_admin_product($pid) {
    $p = wc_get_product($pid);
    if (!$p) return null;
    $ibid = get_post_meta($pid, '_ib_id', true);
    if ($ibid === '' || $ibid === false) $ibid = $p->get_slug();
    $cat = '';
    foreach (wp_get_post_terms($pid, 'product_cat') as $t) { if ($t->slug !== 'uncategorized') { $cat = $t->slug; break; } }
    $price = (float) $p->get_regular_price(); $kit = null;
    $in_single = $p->is_in_stock(); $in_kit = $in_single; $variable = $p->is_type('variable');
    if ($variable) {
        $in_single = $in_kit = false; $price = 0;
        foreach ($p->get_children() as $vid) {
            $v = wc_get_product($vid);
            if (!$v) continue;
            $attrs = array_map('strtolower', array_values($v->get_attributes()));
            if (in_array('10-pack', $attrs, true)) { $kit = (float) $v->get_regular_price(); $in_kit = $v->is_in_stock(); }
            else { $price = (float) $v->get_regular_price(); $in_single = $v->is_in_stock(); }
        }
    }
    $thumb = $p->get_image_id();
    $disc = get_post_meta($pid, '_ib_disc', true);
    return array(
        'pid' => $pid, 'id' => (string) $ibid, 'name' => $p->get_name(), 'cat' => $cat,
        'short' => wp_strip_all_tags($p->get_short_description()), 'desc' => trim(wp_strip_all_tags($p->get_description(), false)),
        'img' => $thumb ? (string) wp_get_attachment_url($thumb) : '',
        'price' => ib_num($price), 'kit' => $kit === null ? null : ib_num($kit), 'has_kit' => $kit !== null, 'variable' => $variable,
        'stock_all' => $p->is_in_stock() ? 1 : 0, 'stock_single' => $in_single ? 1 : 0, 'stock_kit' => $in_kit ? 1 : 0,
        'max' => (int) get_post_meta($pid, '_ib_max', true),
        'hidden' => $p->get_status() === 'publish' ? 0 : 1, 'order' => (int) $p->get_menu_order(),
        'specs' => array_values((array) get_post_meta($pid, '_ib_specs', true)),
        'form' => (string) get_post_meta($pid, '_ib_form', true), 'strength' => (string) get_post_meta($pid, '_ib_strength', true),
        'recs' => array_values((array) get_post_meta($pid, '_ib_recs', true)), 'related' => array_values((array) get_post_meta($pid, '_ib_related', true)),
        'disc' => $disc === 'none' ? 'none' : (is_array($disc) && $disc ? $disc : 'default'),
    );
}

function ib_admin_products() {
    $ids = get_posts(array('post_type' => 'product', 'post_status' => array('publish', 'draft', 'private'), 'numberposts' => -1, 'fields' => 'ids',
        'orderby' => array('menu_order' => 'ASC', 'ID' => 'ASC')));
    $out = array();
    foreach ($ids as $id) { $o = ib_admin_product($id); if ($o) $out[] = $o; }
    return $out;
}

function ib_admin_categories() {
    $terms = get_terms(array('taxonomy' => 'product_cat', 'hide_empty' => false, 'meta_key' => 'order', 'orderby' => 'meta_value_num', 'order' => 'ASC'));
    $out = array();
    if (is_wp_error($terms)) return $out;
    foreach ($terms as $t) {
        if ($t->slug === 'uncategorized') continue;
        $out[] = array('term_id' => $t->term_id, 'id' => $t->slug, 'name' => $t->name, 'blurb' => trim(wp_strip_all_tags($t->description)), 'order' => (int) get_term_meta($t->term_id, 'order', true), 'count' => (int) $t->count);
    }
    return $out;
}

/** Create or update. Returns the new pid, or WP_Error. */
function ib_admin_save_product($pid, $d) {
    if (!function_exists('wc_get_product')) return new WP_Error('wc', 'WooCommerce is not active.');
    $creating = !$pid;
    if ($creating) {
        $name = sanitize_text_field($d['name'] ?? '');
        if ($name === '') return new WP_Error('name', 'A new product needs a name.');
        $p = new WC_Product_Simple();
        $p->set_name($name); $p->set_status('publish'); $p->set_catalog_visibility('visible'); $p->set_manage_stock(false); $p->set_stock_status('instock');
        $p->set_regular_price((string) max(0, (float) ($d['price'] ?? 0)));
        $pid = $p->save();
        if (!$pid) return new WP_Error('create', 'Could not create the product.');
        update_post_meta($pid, '_ib_id', sanitize_title($p->get_slug() ?: $name));
        $p = wc_get_product($pid);
    } else {
        $p = wc_get_product($pid);
        if (!$p) return new WP_Error('missing', 'Product not found.');
    }
    $has = function ($k) use ($d) { return array_key_exists($k, $d); };
    if ($has('name') && trim($d['name']) !== '') $p->set_name(sanitize_text_field($d['name']));
    if ($has('short')) $p->set_short_description(sanitize_textarea_field($d['short']));
    if ($has('desc')) $p->set_description(sanitize_textarea_field($d['desc']));
    if ($has('cat')) { $t = get_term_by('slug', $d['cat'], 'product_cat'); if ($t) $p->set_category_ids(array($t->term_id)); }
    if ($has('img')) { $id = ib_admin_attachment_from_url($d['img']); $p->set_image_id($id ?: 0); }
    if ($has('hidden')) $p->set_status(empty($d['hidden']) ? 'publish' : 'draft');
    if ($has('order')) $p->set_menu_order((int) $d['order']);
    $variable = $p->is_type('variable');
    if (!$variable) {
        if ($has('price')) $p->set_regular_price((string) max(0, round((float) $d['price'], 2)));
        $in = $has('stock_all') ? !empty($d['stock_all']) : null;
        if ($in !== null) $p->set_stock_status($in ? 'instock' : 'outofstock');
    }
    $p->save();
    if ($variable) {
        foreach ($p->get_children() as $vid) {
            $v = wc_get_product($vid);
            if (!$v) continue;
            $kitv = in_array('10-pack', array_map('strtolower', array_values($v->get_attributes())), true);
            $pk = $kitv ? 'kit' : 'price'; $sk = $kitv ? 'stock_kit' : 'stock_single';
            if ($has($pk) && $d[$pk] !== null && $d[$pk] !== '') $v->set_regular_price((string) max(0, round((float) $d[$pk], 2)));
            if ($has($sk)) $v->set_stock_status(!empty($d[$sk]) ? 'instock' : 'outofstock');
            $v->save();
        }
        WC_Product_Variable::sync($pid);
    }
    if ($has('max')) { $m = max(0, (int) $d['max']); if ($m) update_post_meta($pid, '_ib_max', $m); else delete_post_meta($pid, '_ib_max'); }
    if ($has('form')) update_post_meta($pid, '_ib_form', sanitize_text_field($d['form']));
    if ($has('strength')) update_post_meta($pid, '_ib_strength', sanitize_text_field($d['strength']));
    if ($has('specs')) {
        $sp = array();
        foreach ((array) $d['specs'] as $r) if (is_array($r) && count($r) >= 2 && trim($r[0]) !== '') $sp[] = array(sanitize_text_field($r[0]), sanitize_text_field($r[1]));
        update_post_meta($pid, '_ib_specs', $sp);
    }
    if ($has('recs')) update_post_meta($pid, '_ib_recs', array_values(array_filter(array_map('sanitize_text_field', (array) $d['recs']))));
    if ($has('related')) update_post_meta($pid, '_ib_related', array_values(array_filter(array_map('sanitize_title', (array) $d['related']))));
    if ($has('disc')) {
        if ($d['disc'] === 'none') update_post_meta($pid, '_ib_disc', 'none');
        elseif (is_array($d['disc'])) { $st = ib_cms_clean_value('steps', $d['disc']); if ($st) update_post_meta($pid, '_ib_disc', $st); else delete_post_meta($pid, '_ib_disc'); }
        else delete_post_meta($pid, '_ib_disc');
    }
    return $pid;
}
