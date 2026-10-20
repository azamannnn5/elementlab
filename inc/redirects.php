<?php
if (!defined('ABSPATH')) exit;

/* The storefront has its own cart, product and catalog pages. Send WooCommerce's default pages there. */
add_action('template_redirect', function () {
    if (is_admin() || !function_exists('is_woocommerce')) return;
    $go = '';
    if (function_exists('is_cart') && (is_cart() || is_checkout() || is_account_page())) {
        $go = home_url('/cart.html');
    } elseif (is_page(array('cart', 'checkout', 'my-account'))) {
        $go = home_url('/cart.html');
    } elseif (is_shop() || is_page('shop') || is_tax('product_tag')) {
        $go = home_url('/products.html');
    } elseif (is_tax('product_cat')) {
        $t = get_queried_object();
        $go = home_url('/products.html?c=' . rawurlencode($t->slug));
    } elseif (is_singular('product')) {
        $pid = get_queried_object_id();
        $ibid = get_post_meta($pid, '_ib_id', true);
        if ($ibid === '' || $ibid === false) $ibid = get_post_field('post_name', $pid);
        $go = home_url('/product.html?id=' . rawurlencode($ibid));
    }
    if ($go) {
        wp_safe_redirect($go, 301);
        exit;
    }
}, 0);
