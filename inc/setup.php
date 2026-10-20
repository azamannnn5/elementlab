<?php
if (!defined('ABSPATH')) exit;

/* One-click setup: pages, permalinks, front page, WooCommerce settings. Safe to run again. */
function ib_run_setup() {
    $log = array();
    // Permalinks
    if (get_option('permalink_structure') !== '/%postname%/') {
        update_option('permalink_structure', '/%postname%/');
        $log[] = 'Permalinks set to post name.';
    }
    // Pages
    $titles = array(
        'home' => 'Home', 'products' => 'Products', 'product-details' => 'Product', 'ib-cart' => 'Cart',
        'contact' => 'Contact', 'help' => 'Help Center', 'terms-of-service' => 'Terms of Service',
        'privacy-policy' => 'Privacy Policy', 'refunds-returns' => 'Refunds & Returns Policy',
    );
    $legal = array('terms-of-service' => 'terms', 'privacy-policy' => 'privacy', 'refunds-returns' => 'refunds');
    $ids = array();
    foreach ($titles as $slug => $title) {
        $page = get_page_by_path($slug, OBJECT, 'page');
        if ($page && $page->post_status === 'trash') { wp_untrash_post($page->ID); }
        if (!$page) {
            $content = '';
            if (isset($legal[$slug])) $content = (string) @file_get_contents(IB_CORE_PATH . 'data/legal/' . $legal[$slug] . '.html');
            $id = wp_insert_post(array('post_type' => 'page', 'post_status' => 'publish', 'post_title' => $title, 'post_name' => $slug, 'post_content' => $content));
            $ids[$slug] = $id;
            $log[] = 'Created page: ' . $title;
        } else {
            $ids[$slug] = $page->ID;
            // WordPress ships a draft Privacy Policy template: replace it with the real text.
            if (isset($legal[$slug]) && $page->post_status !== 'publish') {
                wp_update_post(array('ID' => $page->ID, 'post_status' => 'publish', 'post_title' => $title, 'post_content' => (string) @file_get_contents(IB_CORE_PATH . 'data/legal/' . $legal[$slug] . '.html')));
                $log[] = 'Published page: ' . $title;
            }
        }
    }
    if (!empty($ids['home'])) {
        update_option('show_on_front', 'page');
        update_option('page_on_front', $ids['home']);
        update_option('page_for_posts', 0);
    }
    // Placeholder content
    foreach (array(array('hello-world', 'post'), array('sample-page', 'page')) as $x) {
        $o = get_page_by_path($x[0], OBJECT, $x[1]);
        if ($o && $o->post_status === 'publish') { wp_trash_post($o->ID); $log[] = 'Trashed placeholder: ' . $x[0]; }
    }
    // WooCommerce
    $wc = array(
        'woocommerce_coming_soon' => 'no', 'woocommerce_store_pages_only' => 'no',
        'woocommerce_calc_taxes' => 'no', 'woocommerce_ship_to_countries' => 'disabled',
        'woocommerce_currency' => 'USD', 'woocommerce_default_country' => 'US',
        'woocommerce_enable_guest_checkout' => 'yes', 'woocommerce_manage_stock' => 'no',
        'woocommerce_enable_reviews' => 'no',
    );
    foreach ($wc as $k => $v) update_option($k, $v);
    $log[] = 'WooCommerce set: public, USD, no shipping, no tax.';
    if (get_option('ib_email', '') === '') update_option('ib_email', 'info@imperialblowork.com');
    flush_rewrite_rules();
    ib_bust_catalog();
    ib_purge_caches();
    $log[] = 'Done.';
    return $log;
}

add_action('wp_ajax_ib_setup', function () {
    check_ajax_referer('ib_admin', 'nonce');
    if (!current_user_can('manage_options')) wp_send_json_error('forbidden', 403);
    wp_send_json_success(ib_run_setup());
});
