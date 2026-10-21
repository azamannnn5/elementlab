<?php
if (!defined('ABSPATH')) exit;

/* Everything the owner can switch on from /admin that shows on the public site. All of it is off or unchanged by default. */

function ib_page_name($file) {
    return $file === 'index' ? 'home' : $file;
}

add_filter('ib_render_html', function ($html, $file) {
    try {
        return ib_effects_html($html, $file);
    } catch (Throwable $e) {
        return function_exists('ib_cms_strip') ? ib_cms_strip($html) : $html;
    }
}, 10, 2);

function ib_insert_before($html, $needle, $text) {
    $p = strpos($html, $needle);
    return $p === false ? $html . $text : substr_replace($html, $text, $p, 0);
}

function ib_font_family_css($name) {
    return "'" . $name . "',system-ui,sans-serif";
}

function ib_effects_html($html, $file) {
    $s = ib_cms_settings();
    $over = ib_cms_content();
    $html = ib_cms_apply($html, $over, ib_cms_kinds());

    // Static text that mentions the minimum order
    $min = ib_min_order();
    if ((float) $min !== 80.0) $html = str_replace('$80', ib_money($min), $html);

    $head = ''; $css = ''; $bodyEnd = ''; $bodyClass = '';

    // Look and feel
    $d = ib_cms_defaults()['look']; $l = $s['look'];
    $vars = array('c_red' => '--red', 'c_red_d' => '--red-d', 'c_bg' => '--bg', 'c_panel' => '--panel', 'c_silver' => '--silver', 'c_white' => '--white');
    $root = '';
    foreach ($vars as $k => $v) if (strcasecmp($l[$k], $d[$k]) !== 0 && $l[$k] !== '') $root .= $v . ':' . $l[$k] . ';';
    foreach (array('font_head' => '--head', 'font_body' => '--body') as $k => $v) {
        if ($l[$k] !== $d[$k] && in_array($l[$k], ib_fonts(), true)) {
            $root .= $v . ':' . ib_font_family_css($l[$k]) . ';';
            $head .= '<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=' . str_replace('%20', '+', rawurlencode($l[$k])) . ':wght@400;500;600;700&display=swap">';
        }
    }
    if ($root !== '') $css .= ':root{' . $root . '}';
    if ($file === 'index' && !empty($over['index.hero.bg'])) {
        $u = str_replace(array('"', '\\', "\n", "\r"), '', $over['index.hero.bg']);
        $css .= '.hero-bg{background:radial-gradient(ellipse at 50% 38%,rgba(255,36,51,.18),transparent 58%),linear-gradient(180deg,rgba(5,5,7,.55),rgba(5,5,7,.96)),url("' . $u . '") center/cover no-repeat}';
    }
    if ($l['custom_css'] !== '') $css .= $l['custom_css'];

    // Banner
    $b = $s['banner'];
    if (!empty($b['on']) && trim(wp_strip_all_tags($b['text'])) !== '') {
        $inner = $b['text'];
        if ($b['link'] !== '' && stripos($inner, '<a ') === false) $inner = '<a href="' . esc_url($b['link']) . '">' . $inner . '</a>';
        $css .= '.ib-banner{position:fixed;top:0;left:0;right:0;height:38px;z-index:55;display:flex;align-items:center;justify-content:center;padding:0 14px;font:600 .78rem var(--head);letter-spacing:.08em;text-align:center;overflow:hidden;background:' . esc_attr($b['bg']) . ';color:' . esc_attr($b['color']) . '}.ib-banner a{color:inherit;text-decoration:underline}body.ib-has-banner{padding-top:38px}body.ib-has-banner .bar{top:38px}';
        $bodyClass .= ' ib-has-banner';
        $banner = '<div class="ib-banner" id="ib-banner" role="region" aria-label="Notice">' . $inner . '</div>';
    } else {
        $banner = '';
    }

    // Tracking
    $t = $s['tracking'];
    if ($t['ga_id'] !== '') $head .= '<script async src="https://www.googletagmanager.com/gtag/js?id=' . esc_attr($t['ga_id']) . '"></script><script>window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments)}gtag("js",new Date());gtag("config",' . wp_json_encode($t['ga_id']) . ');</script>';
    if ($t['pixel_id'] !== '') $head .= '<script>!function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version="2.0";n.queue=[];t=b.createElement(e);t.async=!0;t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window,document,"script","https://connect.facebook.net/en_US/fbevents.js");fbq("init",' . wp_json_encode($t['pixel_id']) . ');fbq("track","PageView");</script>';
    if ($t['head_code'] !== '') $head .= $t['head_code'];
    if ($t['body_code'] !== '') $bodyEnd .= $t['body_code'];

    // Popup
    $p = $s['popup'];
    $pages = strtolower(trim($p['pages']));
    $show_here = $pages === '' || $pages === 'all' || in_array(ib_page_name($file), array_map('trim', explode(',', $pages)), true);
    if (!empty($p['on']) && $show_here && (trim($p['title']) !== '' || trim(wp_strip_all_tags($p['text'])) !== '')) {
        $css .= '.ib-popup{position:fixed;inset:0;z-index:80;background:rgba(5,5,7,.8);display:flex;align-items:center;justify-content:center;padding:18px}.ib-popup[hidden]{display:none}.ib-popup-card{position:relative;max-width:440px;width:100%;background:var(--panel);border:1px solid var(--line2);padding:30px 24px;text-align:center;color:var(--silver)}.ib-popup-card img{margin:0 auto 16px;max-height:200px;width:auto}.ib-popup-card h2{font:600 1.4rem var(--head);color:var(--white);margin-bottom:10px}.ib-popup-card .btn{margin-top:18px}.ib-popup-x{position:absolute;top:8px;right:12px;font-size:1.6rem;line-height:1;color:var(--silver)}';
        $img = $p['image'] !== '' ? '<img src="' . esc_url($p['image']) . '" alt="">' : '';
        $btn = ($p['btn_text'] !== '' && $p['btn_link'] !== '') ? '<a class="btn btn-red" href="' . esc_url($p['btn_link']) . '">' . esc_html($p['btn_text']) . '</a>' : '';
        $bodyEnd .= '<div class="ib-popup" id="ib-popup" hidden role="dialog" aria-modal="true" aria-label="' . esc_attr($p['title'] ?: 'Notice') . '"><div class="ib-popup-card"><button class="ib-popup-x" type="button" aria-label="Close">&times;</button>'
            . $img . ($p['title'] !== '' ? '<h2>' . esc_html($p['title']) . '</h2>' : '') . '<div>' . $p['text'] . '</div>' . $btn . '</div></div>'
            . '<script>(function(){var el=document.getElementById("ib-popup"),days=' . (int) $p['repeat_days'] . ',delay=' . max(0, (int) $p['delay']) . ';var K="ib_popup_seen";try{var s=localStorage.getItem(K);if(days>0&&s&&Date.now()-Number(s)<days*864e5)return;if(days===0&&sessionStorage.getItem(K))return}catch(e){}'
            . 'function close(){el.hidden=true;try{if(days>0)localStorage.setItem(K,String(Date.now()));else sessionStorage.setItem(K,"1")}catch(e){}}'
            . 'setTimeout(function(){el.hidden=false},delay*1000);el.addEventListener("click",function(e){if(e.target===el||e.target.closest(".ib-popup-x")||e.target.closest("a"))close()});document.addEventListener("keydown",function(e){if(e.key==="Escape"&&!el.hidden)close()})})();</script>';
    }

    // Settings for the storefront scripts (no codes, no secrets)
    global $wpdb;
    $has_promo = (int) $wpdb->get_var('SELECT COUNT(*) FROM ' . $wpdb->prefix . 'ib_coupons WHERE active=1 AND (ends IS NULL OR ends >= CURDATE())') > 0;
    $cfg = array('msgs' => $s['messages'], 'shipping' => $s['shipping'], 'disc' => array('on' => (int) $s['discounts']['on'], 'steps' => $s['discounts']['steps']),
        'promo' => $has_promo, 'min' => ib_min_order(), 'maxq' => (int) $s['shop']['max_qty']);
    $head .= '<script>var IB_CFG=' . wp_json_encode($cfg, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES | JSON_HEX_TAG | JSON_HEX_AMP) . ';</script>';

    // Favicon
    $se = $s['seo'];
    if ($se['favicon'] !== '') {
        $p = strpos($html, '<link rel="icon"');
        $q = $p === false ? false : strpos($html, '>', $p);
        if ($q !== false) $html = substr_replace($html, '<link rel="icon" href="' . esc_url($se['favicon']) . '">', $p, $q + 1 - $p);
    }

    if ($css !== '') $head .= '<style id="ib-custom">' . $css . '</style>';
    if ($head !== '') $html = ib_insert_before($html, '</head>', $head);
    if ($bodyClass !== '') {
        $p = strpos($html, '<body class="');
        if ($p !== false) { $q = strpos($html, '"', $p + 13); if ($q !== false) $html = substr_replace($html, $bodyClass, $q, 0); }
    }
    if ($banner !== '') {
        $p = strpos($html, '<body');
        $q = $p === false ? false : strpos($html, '>', $p);
        if ($q !== false) $html = substr_replace($html, $banner, $q + 1, 0);
    }
    if ($bodyEnd !== '') $html = ib_insert_before($html, '</body>', $bodyEnd);
    return $html;
}

/* ---------- SEO ---------- */
add_filter('ib_page_meta', function ($m, $file) {
    $se = ib_cms_settings()['seo'];
    $pg = (array) $se['pages'];
    $pg = isset($pg[$file]) ? (array) $pg[$file] : array();
    if (!empty($pg['title'])) $m['title'] = $pg['title'];
    if (!empty($pg['description'])) $m['desc'] = $pg['description'];
    elseif ($se['description'] !== '' && $file === 'index') $m['desc'] = $se['description'];
    if (!empty($pg['noindex']) || !empty($se['noindex'])) $m['noindex'] = 1;
    if ($se['share_image'] !== '') $m['image'] = $se['share_image'];
    if ($se['site_name'] !== '') $m['site_name'] = $se['site_name'];
    return $m;
}, 10, 2);

add_filter('wp_robots', function ($r) {
    if (!empty(ib_cms_settings()['seo']['noindex'])) { $r['noindex'] = true; $r['nofollow'] = true; }
    return $r;
});

/* ---------- Redirects (also used to hide a page) ---------- */
add_action('init', function () {
    if (is_admin() || (defined('REST_REQUEST') && REST_REQUEST)) return;
    $list = ib_cms_settings()['redirects']['list'];
    if (!$list || empty($_SERVER['REQUEST_URI'])) return;
    $uri = wp_unslash($_SERVER['REQUEST_URI']);
    $path = rawurldecode((string) wp_parse_url($uri, PHP_URL_PATH));
    if (strpos($path, '/admin') === 0 || strpos($path, '/wp-') === 0) return;
    $query = (string) wp_parse_url($uri, PHP_URL_QUERY);
    $norm = function ($p) { $p = strtolower($p); return $p === '/' ? $p : rtrim($p, '/'); };
    foreach ($list as $r) {
        if (empty($r['on'])) continue;
        $from = (string) $r['from'];
        $hit = strpos($from, '?') !== false ? (strtolower($path . '?' . $query) === strtolower($from)) : ($norm($path) === $norm($from));
        if ($hit) {
            $to = $r['to'];
            if ($to[0] === '/') $to = home_url($to);
            wp_redirect($to, (int) $r['code']);
            exit;
        }
    }
}, 3);

/* ---------- Maintenance mode ---------- */
function ib_maintenance_blocked() {
    $m = ib_cms_settings()['maintenance'];
    if (empty($m['on'])) return false;
    if (is_user_logged_in() && ib_role_key() !== '') return false;
    if ($m['bypass'] !== '' && isset($_COOKIE['ib_bypass']) && hash_equals(md5($m['bypass']), (string) $_COOKIE['ib_bypass'])) return false;
    return true;
}
add_action('template_redirect', function () {
    $m = ib_cms_settings()['maintenance'];
    if (empty($m['on'])) return;
    if ($m['bypass'] !== '' && isset($_GET['preview']) && hash_equals($m['bypass'], (string) wp_unslash($_GET['preview']))) {
        setcookie('ib_bypass', md5($m['bypass']), time() + 12 * HOUR_IN_SECONDS, '/', '', is_ssl(), true);
        $_COOKIE['ib_bypass'] = md5($m['bypass']);
    }
    if (!ib_maintenance_blocked()) return;
    status_header(503);
    header('Retry-After: 3600');
    header('Cache-Control: no-store');
    nocache_headers();
    $l = ib_cms_settings()['look'];
    echo '<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex"><title>' . esc_html($m['title']) . '</title>'
        . '<style>body{margin:0;min-height:100vh;display:flex;align-items:center;justify-content:center;background:' . esc_attr($l['c_bg']) . ';color:' . esc_attr($l['c_silver']) . ';font:400 16px/1.6 system-ui,sans-serif;text-align:center;padding:24px}h1{color:' . esc_attr($l['c_white']) . ';font-size:1.8rem;margin:0 0 10px}p{max-width:46ch;margin:0 auto}</style></head><body><div><h1>' . esc_html($m['title']) . '</h1><p>' . $m['message'] . '</p></div></body></html>';
    exit;
}, 0);
