<?php
/**
 * Imperial Blowork theme.
 * Serves the original HTML/CSS/JS design from /site unchanged.
 * Products, orders and settings come from WooCommerce and the Imperial Blowork Core plugin.
 */
if (!defined('ABSPATH')) exit;

define('IB_DIR', get_template_directory());

/** WordPress page slug => static file name (without .html) */
function ib_map() {
    return array(
        'home'             => 'index',
        'products'         => 'products',
        'product-details'  => 'product',
        'ib-cart'          => 'cart',
        'contact'          => 'contact',
        'help'             => 'help',
        'terms-of-service' => 'terms',
        'privacy-policy'   => 'privacy',
        'refunds-returns'  => 'refunds',
    );
}

function ib_opt($key, $default = '') {
    $v = get_option($key, $default);
    return ($v === '' || $v === false) ? $default : $v;
}

function ib_seo_active() {
    return defined('WPSEO_VERSION') || defined('RANK_MATH_VERSION') || defined('AIOSEO_VERSION')
        || defined('SEOPRESS_VERSION') || defined('THE_SEO_FRAMEWORK_VERSION') || defined('SLIM_SEO_VER');
}

function ib_meta() {
    static $m = null;
    if ($m === null) {
        $m = json_decode((string) @file_get_contents(IB_DIR . '/page-meta.json'), true);
        if (!is_array($m)) $m = array();
    }
    return $m;
}

/** Which static page (file name) does this request map to? Returns '' if none. */
function ib_current_file() {
    if (is_admin()) return '';
    $map = ib_map();
    $obj = get_queried_object();
    if (is_page() && $obj instanceof WP_Post && isset($map[$obj->post_name])) return $map[$obj->post_name];
    if (is_front_page() && $obj instanceof WP_Post && $obj->post_name === 'home') return 'index';
    return '';
}

add_action('after_setup_theme', function () {
    add_theme_support('title-tag');
    add_theme_support('post-thumbnails');
    add_theme_support('woocommerce');
});

add_filter('show_admin_bar', '__return_false');

/* ---------- URLs: keep the original .html addresses ---------- */
add_action('init', function () {
    foreach (ib_map() as $slug => $file) {
        if ($file === 'index') continue;
        add_rewrite_rule('^' . $file . '\.html/?$', 'index.php?pagename=' . $slug, 'top');
    }
});

add_filter('page_link', function ($link, $id) {
    $p = get_post($id);
    $map = ib_map();
    if ($p && isset($map[$p->post_name])) {
        $f = $map[$p->post_name];
        return $f === 'index' ? home_url('/') : home_url('/' . $f . '.html');
    }
    return $link;
}, 10, 2);

add_filter('redirect_canonical', function ($redirect) {
    return ib_current_file() !== '' ? false : $redirect;
});

add_action('template_redirect', function () {
    $path = isset($_SERVER['REQUEST_URI']) ? wp_parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH) : '';
    if ($path && substr($path, -11) === '/index.html') {
        wp_safe_redirect(home_url('/'), 301);
        exit;
    }
}, 1);

add_action('after_switch_theme', function () {
    flush_rewrite_rules();
});

/* ---------- Template: output the original markup ---------- */
add_filter('template_include', function ($tpl) {
    if (is_admin() || is_feed() || is_robots() || is_embed() || (function_exists('wp_is_json_request') && wp_is_json_request())) return $tpl;
    return IB_DIR . '/render.php';
}, 99);

/* ---------- Clean head: no WordPress or WooCommerce front-end styles or scripts ---------- */
add_action('wp_enqueue_scripts', function () {
    wp_styles()->queue = array();
    wp_scripts()->queue = array();
}, 99999);
remove_action('wp_head', 'print_emoji_detection_script', 7);
remove_action('wp_print_styles', 'print_emoji_styles');
remove_action('wp_head', 'wp_generator');
remove_action('wp_head', 'wlwmanifest_link');
remove_action('wp_head', 'rsd_link');
remove_action('wp_head', 'wp_shortlink_wp_head');
remove_action('wp_enqueue_scripts', 'wp_enqueue_global_styles');
remove_action('wp_footer', 'wp_enqueue_global_styles', 1);
remove_action('wp_body_open', 'wp_global_styles_render_svg_filters');
add_filter('woocommerce_enqueue_styles', '__return_empty_array');

/* ---------- Titles and meta (only when no SEO plugin is active) ---------- */
add_filter('pre_get_document_title', function ($t) {
    if (ib_seo_active()) return $t;
    $f = ib_current_file();
    $m = ib_meta();
    if ($f && isset($m[$f])) { $x = apply_filters('ib_page_meta', $m[$f], $f); return $x['title']; }
    if (is_404()) return 'Page not found | Imperial Blowork';
    return $t;
});

add_action('wp_head', function () {
    if (ib_seo_active()) return;
    $f = ib_current_file();
    $m = ib_meta();
    if (!$f || !isset($m[$f])) return;
    $x = apply_filters('ib_page_meta', $m[$f], $f);
    $title = esc_attr($x['title']);
    $desc = esc_attr($x['desc']);
    $img = esc_url(!empty($x['image']) ? $x['image'] : get_template_directory_uri() . '/site/assets/img/logo.png');
    echo '<meta name="description" content="' . $desc . '">' . "\n";
    echo '<meta property="og:title" content="' . $title . '">' . "\n";
    echo '<meta property="og:description" content="' . $desc . '">' . "\n";
    echo '<meta property="og:image" content="' . $img . '">' . "\n";
    if (!empty($x['site_name'])) echo '<meta property="og:site_name" content="' . esc_attr($x['site_name']) . '">' . "\n";
    if (!empty($x['noindex'])) echo '<meta name="robots" content="noindex, nofollow">' . "\n";
}, 1);

/* ---------- Render ---------- */
function ib_render() {
    $file = ib_current_file();
    $generic = false;
    if ($file === '') {
        $file = 'generic';
        $generic = true;
    }
    $path = IB_DIR . '/site/' . $file . '.html';
    $html = @file_get_contents($path);
    if ($html === false) {
        status_header(500);
        echo 'Template missing.';
        return;
    }

    // Owner edits (Imperial Blowork Core plugin). Without the plugin the edit keys are simply removed.
    if (has_filter('ib_render_html')) {
        $html = apply_filters('ib_render_html', $html, $file);
    } else {
        $html = preg_replace('/ data-cms(?:-(?:href|src|alt|lead))?="[^"]*"/', '', $html);
    }

    $base = trailingslashit(get_template_directory_uri()) . 'site/';
    $base = set_url_scheme($base);
    $dir = IB_DIR . '/site/';

    // cache-bust css/js by file time
    $html = preg_replace_callback('~\{\{T\}\}((?:css|js)/[\w.\-]+\.(?:css|js))~', function ($m) use ($base, $dir) {
        $ver = @filemtime($dir . $m[1]);
        return $base . $m[1] . ($ver ? '?v=' . $ver : '');
    }, $html);
    $html = str_replace('{{T}}', $base, $html);

    $rel = wp_make_link_relative(home_url('/'));
    $dataVer = (int) get_option('ib_data_v', 1);
    $html = str_replace('{{DATA}}', esc_url($rel . 'js/data.js?v=' . $dataVer), $html);

    // head and footer hooks (SEO plugins and others print here)
    ob_start();
    wp_head();
    $head = ob_get_clean();
    $head .= '<script>var IB_API=' . wp_json_encode($rel . '?rest_route=/ib/v1') . ';</script>';
    ob_start();
    wp_footer();
    $foot = ob_get_clean();
    $html = str_replace('<!--IB:HEAD-->', $head, $html);
    $html = str_replace('<!--IB:FOOT-->', $foot, $html);

    // contact details
    $email = ib_opt('ib_email', 'info@imperialblowork.com');
    $phone = trim((string) get_option('ib_phone', ''));
    $tel = preg_replace('~[^\d+]~', '', $phone);
    $phoneHtml = $phone !== '' ? ' &middot; <a href="tel:' . esc_attr($tel) . '">' . esc_html($phone) . '</a>' : '';
    $phoneSentence = $phone !== '' ? ' or call <a class="ulink" href="tel:' . esc_attr($tel) . '">' . esc_html($phone) . '</a>' : '';
    $html = str_replace(
        array('%%PHONE_SENTENCE%%', '%%PHONE%%', '%%EMAIL%%'),
        array($phoneSentence, $phoneHtml, esc_html($email)),
        $html
    );
    // mailto href needs the raw address (esc_html is safe for a plain address)

    // WordPress-managed content (legal pages, generic pages, 404)
    if (strpos($html, '<!--IB:CONTENT-->') !== false) {
        $obj = get_queried_object();
        if (is_404()) {
            $title = 'Page not found';
            $content = '<p>That page does not exist. Try the <a href="/products.html">products page</a> or go back to the <a href="/">home page</a>.</p>';
        } elseif ($obj instanceof WP_Post) {
            $title = get_the_title($obj);
            $content = apply_filters('the_content', $obj->post_content);
        } else {
            $title = 'Imperial Blowork';
            $content = '';
        }
        $html = str_replace('%%TITLE%%', esc_html($title), $html);
        $html = str_replace('<!--IB:CONTENT-->', $content, $html);
    }

    if (!headers_sent()) header('Content-Type: text/html; charset=' . get_bloginfo('charset'));
    echo $html;
}
