<?php
if (!defined('ABSPATH')) exit;

/* The admin panel lives at /admin. It is a single page (admin-app/admin.js) that talks to the REST API. */
add_action('init', function () {
    if (empty($_SERVER['REQUEST_URI'])) return;
    $path = (string) wp_parse_url(wp_unslash($_SERVER['REQUEST_URI']), PHP_URL_PATH);
    $home = rtrim((string) wp_parse_url(home_url('/'), PHP_URL_PATH), '/');
    $p = rtrim($path, '/');
    if ($p !== $home . '/admin') return;
    ib_render_admin_page();
    exit;
}, 1);

function ib_render_admin_page() {
    nocache_headers();
    header('X-Robots-Tag: noindex, nofollow');
    header('Content-Type: text/html; charset=utf-8');
    if (has_action('litespeed_control_set_nocache')) do_action('litespeed_control_set_nocache', 'admin panel');
    if (!defined('DONOTCACHEPAGE')) define('DONOTCACHEPAGE', true);
    $logged = is_user_logged_in() && ib_role_key() !== '';
    $boot = array(
        'api' => home_url('/?rest_route=/ib/v1/admin'),
        'nonce' => $logged ? wp_create_nonce('wp_rest') : '',
        'logged' => $logged,
        'site' => home_url('/'),
        'lost' => wp_lostpassword_url(home_url('/admin/')),
        'woo_ready' => function_exists('wc_get_product'),
    );
    $css = plugins_url('admin-app/admin.css', IB_CORE_FILE);
    $js = plugins_url('admin-app/admin.js', IB_CORE_FILE);
    $v = filemtime(IB_CORE_PATH . 'admin-app/admin.js') ?: IB_CORE_VER;
    $v2 = filemtime(IB_CORE_PATH . 'admin-app/admin.css') ?: IB_CORE_VER;
    echo '<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">'
        . '<meta name="robots" content="noindex, nofollow"><title>Imperial Blowork Admin</title>'
        . '<link rel="icon" href="' . esc_url(set_url_scheme(trailingslashit(get_template_directory_uri()) . 'site/assets/img/favicon.png')) . '">'
        . '<link rel="stylesheet" href="' . esc_url($css . '?v=' . $v2) . '"></head><body>'
        . '<div id="app"><p style="padding:40px;font-family:system-ui">Loading the admin panel...</p></div>'
        . '<noscript><p style="padding:40px;font-family:system-ui">The admin panel needs JavaScript.</p></noscript>'
        . '<script>window.IB_ADMIN=' . wp_json_encode($boot, JSON_UNESCAPED_SLASHES | JSON_HEX_TAG | JSON_HEX_AMP) . ';</script>'
        . '<script src="' . esc_url($js . '?v=' . $v) . '"></script></body></html>';
}
