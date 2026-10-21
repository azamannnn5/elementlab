<?php
if (!defined('ABSPATH')) exit;

/* ---------- Tables ---------- */
function ib_install_cms_tables() {
    global $wpdb;
    require_once ABSPATH . 'wp-admin/includes/upgrade.php';
    $c = $wpdb->get_charset_collate();
    dbDelta('CREATE TABLE ' . $wpdb->prefix . "ib_history (
        id bigint(20) unsigned NOT NULL AUTO_INCREMENT,
        user_id bigint(20) unsigned NOT NULL DEFAULT 0,
        user_name varchar(100) NOT NULL DEFAULT '',
        kind varchar(20) NOT NULL,
        ref varchar(190) NOT NULL DEFAULT '',
        label varchar(255) NOT NULL DEFAULT '',
        old_value longtext NULL,
        new_value longtext NULL,
        created datetime NOT NULL,
        PRIMARY KEY  (id),
        KEY kind_ref (kind, ref(100))
    ) $c;");
    dbDelta('CREATE TABLE ' . $wpdb->prefix . "ib_coupons (
        id bigint(20) unsigned NOT NULL AUTO_INCREMENT,
        code varchar(60) NOT NULL,
        type varchar(10) NOT NULL DEFAULT 'percent',
        amount decimal(10,2) NOT NULL DEFAULT 0,
        min_order decimal(10,2) NOT NULL DEFAULT 0,
        starts date NULL,
        ends date NULL,
        max_uses int NOT NULL DEFAULT 0,
        used int NOT NULL DEFAULT 0,
        active tinyint(1) NOT NULL DEFAULT 1,
        note text NULL,
        PRIMARY KEY  (id),
        UNIQUE KEY code (code)
    ) $c;");
    dbDelta('CREATE TABLE ' . ib_table() . " (
        id bigint(20) unsigned NOT NULL AUTO_INCREMENT,
        type varchar(20) NOT NULL,
        payload longtext NOT NULL,
        mail_sent tinyint(1) NOT NULL DEFAULT 0,
        mail_error text NULL,
        order_id bigint(20) unsigned NULL,
        status varchar(12) NOT NULL DEFAULT 'new',
        created datetime NOT NULL,
        PRIMARY KEY  (id)
    ) $c;");
    update_option('ib_db_v', '2');
}
add_action('plugins_loaded', function () {
    if (get_option('ib_db_v') !== '2') ib_install_cms_tables();
}, 20);

/* ---------- Roles ---------- */
add_action('init', function () {
    if (!get_role('ib_viewer')) add_role('ib_viewer', 'Viewer (read only)', array('read' => true));
}, 5);

function ib_role_key($user = null) {
    $user = $user ?: wp_get_current_user();
    if (!$user || !$user->ID) return '';
    $r = (array) $user->roles;
    if (in_array('administrator', $r, true)) return 'owner';
    if (in_array('shop_manager', $r, true)) return 'admin';
    if (in_array('editor', $r, true)) return 'editor';
    if (in_array('ib_viewer', $r, true)) return 'viewer';
    return '';
}

function ib_perms($role = null) {
    $role = $role ?: ib_role_key();
    $all = array('read', 'content', 'products', 'media', 'inbox', 'settings', 'promo', 'seo', 'code_css', 'history', 'backup', 'team', 'code_js');
    $map = array(
        'owner' => $all,
        'admin' => array_values(array_diff($all, array('team', 'code_js'))),
        'editor' => array('read', 'content', 'products', 'media', 'inbox'),
        'viewer' => array('read'),
    );
    return isset($map[$role]) ? $map[$role] : array();
}
function ib_can($perm) {
    return in_array($perm, ib_perms(), true);
}

/* ---------- Settings: schema, defaults, sanitizers ---------- */
function ib_fonts() {
    return array('Chakra Petch', 'Inter', 'Roboto', 'Montserrat', 'Poppins', 'Oswald', 'Rajdhani', 'Orbitron', 'Barlow', 'Open Sans', 'Lato', 'Space Grotesk', 'Playfair Display', 'DM Sans', 'Manrope');
}

function ib_cms_defaults() {
    return array(
        'banner' => array('on' => 0, 'text' => '', 'link' => '', 'bg' => '#ff2433', 'color' => '#ffffff'),
        'popup' => array('on' => 0, 'title' => '', 'text' => '', 'image' => '', 'btn_text' => '', 'btn_link' => '', 'delay' => 5, 'repeat_days' => 7, 'pages' => 'all'),
        'shipping' => array('fee' => 0, 'free_over' => 0, 'label' => 'Shipping'),
        'discounts' => array('on' => 0, 'steps' => array()),
        'shop' => array('min_order' => 80, 'max_qty' => 99),
        'seo' => array('site_name' => 'Imperial Blowork', 'description' => '', 'share_image' => '', 'favicon' => '', 'noindex' => 0, 'pages' => new stdClass()),
        'look' => array('c_red' => '#ff2433', 'c_red_d' => '#c4121f', 'c_bg' => '#050507', 'c_panel' => '#0f0f14', 'c_silver' => '#d9dde3', 'c_white' => '#f6f7f9',
            'font_head' => 'Chakra Petch', 'font_body' => 'Inter', 'custom_css' => ''),
        'tracking' => array('ga_id' => '', 'pixel_id' => '', 'head_code' => '', 'body_code' => ''),
        'redirects' => array('list' => array()),
        'maintenance' => array('on' => 0, 'title' => 'We will be right back', 'message' => 'The site is being updated. Please check again soon.', 'bypass' => ''),
        'messages' => array(
            'checkout_ok' => 'Your cart has been sent. We will reply shortly to confirm your items, total and payment.',
            'checkout_err' => 'We could not send that right now. Please try again, or reach us through the Contact page.',
            'empty_cart' => 'Your cart is empty. Add at least one product first.',
            'contact_ok' => 'Message sent. We will reply by email.',
            'contact_err' => 'We could not send that right now. Please try again shortly.',
            'added_toast' => '{name} added to cart',
            'add_btn' => 'Add to cart',
            'min_note' => 'Minimum order is {min}. Add {more} more to check out.',
            'out_of_stock' => 'Out of stock',
        ),
        'contact' => array('email' => 'info@imperialblowork.com', 'phone' => '', 'smtp_host' => 'smtp.hostinger.com', 'smtp_port' => 465, 'smtp_user' => '', 'smtp_pass' => ''),
    );
}

/** field => type */
function ib_cms_schema() {
    $msg = array_fill_keys(array_keys(ib_cms_defaults()['messages']), 'text');
    return array(
        'banner' => array('on' => 'bool', 'text' => 'rich', 'link' => 'url', 'bg' => 'color', 'color' => 'color'),
        'popup' => array('on' => 'bool', 'title' => 'text', 'text' => 'rich', 'image' => 'url', 'btn_text' => 'text', 'btn_link' => 'url', 'delay' => 'int', 'repeat_days' => 'int', 'pages' => 'text'),
        'shipping' => array('fee' => 'float', 'free_over' => 'float', 'label' => 'text'),
        'discounts' => array('on' => 'bool', 'steps' => 'steps'),
        'shop' => array('min_order' => 'float', 'max_qty' => 'int'),
        'seo' => array('site_name' => 'text', 'description' => 'text', 'share_image' => 'url', 'favicon' => 'url', 'noindex' => 'bool', 'pages' => 'seopages'),
        'look' => array('c_red' => 'color', 'c_red_d' => 'color', 'c_bg' => 'color', 'c_panel' => 'color', 'c_silver' => 'color', 'c_white' => 'color', 'font_head' => 'font', 'font_body' => 'font', 'custom_css' => 'css'),
        'tracking' => array('ga_id' => 'id', 'pixel_id' => 'id', 'head_code' => 'code', 'body_code' => 'code'),
        'redirects' => array('list' => 'redirects'),
        'maintenance' => array('on' => 'bool', 'title' => 'text', 'message' => 'rich', 'bypass' => 'text'),
        'messages' => $msg,
        'contact' => array('email' => 'email', 'phone' => 'text', 'smtp_host' => 'text', 'smtp_port' => 'int', 'smtp_user' => 'text', 'smtp_pass' => 'secret'),
    );
}

function ib_cms_settings() {
    $saved = get_option('ib_cms_settings', array());
    if (!is_array($saved)) $saved = array();
    $out = ib_cms_defaults();
    foreach ($out as $g => $vals) {
        if (isset($saved[$g]) && is_array($saved[$g])) $out[$g] = array_merge($vals, array_intersect_key($saved[$g], $vals));
    }
    // contact lives in its own options (older code and the Settings page use them)
    $out['contact']['email'] = ib_email();
    $out['contact']['phone'] = (string) get_option('ib_phone', '');
    $out['contact']['smtp_host'] = (string) get_option('ib_smtp_host', 'smtp.hostinger.com');
    $out['contact']['smtp_port'] = (int) get_option('ib_smtp_port', 465);
    $out['contact']['smtp_user'] = (string) get_option('ib_smtp_user', '');
    $out['contact']['smtp_pass'] = '';
    $out['contact']['smtp_pass_set'] = get_option('ib_smtp_pass', '') !== '' ? 1 : 0;
    $out['shop']['min_order'] = ib_min_order();
    return $out;
}

function ib_cms_url($v) {
    $v = trim((string) $v);
    if ($v === '') return '';
    if (preg_match('~^(/|#|\?|mailto:|tel:)~i', $v) || preg_match('~^[\w./-]+\.html(\?.*)?(#.*)?$~i', $v)) return preg_replace('~[\s"<>]~', '', $v);
    return esc_url_raw($v);
}

function ib_cms_clean_value($type, $v) {
    switch ($type) {
        case 'bool': return !empty($v) && $v !== 'false' && $v !== '0' ? 1 : 0;
        case 'int': return max(0, (int) $v);
        case 'float': return max(0, round((float) $v, 2));
        case 'text': return sanitize_text_field((string) $v);
        case 'secret': return trim((string) $v);
        case 'rich': return ib_cms_clean_rich($v);
        case 'url': return ib_cms_url($v);
        case 'email': $e = sanitize_email((string) $v); return is_email($e) ? $e : '';
        case 'color': $c = trim((string) $v); return preg_match('/^#[0-9a-fA-F]{3,8}$/', $c) ? $c : '';
        case 'font': return in_array($v, ib_fonts(), true) ? $v : '';
        case 'id': return preg_match('/^[A-Za-z0-9_-]{3,40}$/', (string) $v) ? (string) $v : '';
        case 'css':
            $c = str_replace(array('<', '>'), '', (string) $v);
            $c = preg_replace('~(expression\s*\(|javascript\s*:|@import|behavior\s*:)~i', '', $c);
            return mb_substr($c, 0, 20000);
        case 'code': return mb_substr((string) $v, 0, 20000);
        case 'steps':
            $out = array();
            foreach ((array) $v as $s) {
                $min = (int) ($s['min'] ?? 0); $pct = round((float) ($s['pct'] ?? 0), 2);
                if ($min > 1 && $pct > 0 && $pct < 100) $out[] = array('min' => $min, 'pct' => $pct);
            }
            usort($out, function ($a, $b) { return $a['min'] <=> $b['min']; });
            return array_slice($out, 0, 12);
        case 'redirects':
            $out = array();
            foreach ((array) $v as $r) {
                $from = '/' . ltrim(trim((string) ($r['from'] ?? '')), '/');
                $to = ib_cms_url($r['to'] ?? '');
                if ($from === '/' || $to === '' || strpos($from, '/admin') === 0 || strpos($from, '/wp-') === 0) continue;
                $out[] = array('from' => preg_replace('~[\s"<>]~', '', $from), 'to' => $to, 'code' => ((int) ($r['code'] ?? 301)) === 302 ? 302 : 301, 'on' => empty($r['on']) ? 0 : 1);
            }
            return array_slice($out, 0, 200);
        case 'seopages':
            $out = array();
            foreach ((array) $v as $page => $d) {
                $page = sanitize_key($page);
                if (!$page || !is_array($d)) continue;
                $out[$page] = array('title' => sanitize_text_field($d['title'] ?? ''), 'description' => sanitize_text_field($d['description'] ?? ''), 'noindex' => empty($d['noindex']) ? 0 : 1);
            }
            return $out ?: new stdClass();
    }
    return '';
}

/** Returns array(cleaned_group, blocked_fields). */
function ib_cms_clean_group($group, $data) {
    $schema = ib_cms_schema();
    if (!isset($schema[$group]) || !is_array($data)) return array(null, array());
    $clean = array(); $blocked = array();
    $cur = ib_cms_settings()[$group];
    foreach ($schema[$group] as $k => $type) {
        if (!array_key_exists($k, $data)) { $clean[$k] = $cur[$k]; continue; }
        if ($group === 'contact' && strpos($k, 'smtp_') === 0 && !ib_can('code_js')) { $clean[$k] = $cur[$k]; continue; }
        if ($type === 'code' && !ib_can('code_js')) { $blocked[] = $k; $clean[$k] = $cur[$k]; continue; }
        if ($type === 'css' && !ib_can('code_css')) { $blocked[] = $k; $clean[$k] = $cur[$k]; continue; }
        $clean[$k] = ib_cms_clean_value($type, $data[$k]);
        if ($clean[$k] === '' && in_array($type, array('color', 'font'), true)) $clean[$k] = ib_cms_defaults()[$group][$k];
    }
    return array($clean, $blocked);
}

/* ---------- Content overrides ---------- */
function ib_cms_fields() {
    static $f = null;
    if ($f === null) {
        $j = json_decode((string) @file_get_contents(get_template_directory() . '/cms-defaults.json'), true);
        $f = is_array($j) && isset($j['fields']) ? $j['fields'] : array();
    }
    return $f;
}
function ib_cms_kinds() {
    static $k = null;
    if ($k === null) { $k = array(); foreach (ib_cms_fields() as $f) $k[$f['key']] = $f['kind']; }
    return $k;
}
function ib_cms_content() {
    $c = get_option('ib_cms_content', array());
    return is_array($c) ? $c : array();
}

/** Clean a content value by its kind. Returns null when the key is unknown. */
function ib_cms_clean_content($key, $v) {
    $kinds = ib_cms_kinds();
    if (!isset($kinds[$key])) return null;
    switch ($kinds[$key]) {
        case 'rich': return ib_cms_clean_rich($v);
        case 'link': return ib_cms_url($v);
        case 'image': return ib_cms_url($v);
        default: return sanitize_text_field((string) $v);
    }
}

/* ---------- History ---------- */
function ib_history($kind, $ref, $label, $old, $new) {
    global $wpdb;
    $u = wp_get_current_user();
    $wpdb->insert($wpdb->prefix . 'ib_history', array(
        'user_id' => $u->ID, 'user_name' => $u->display_name ?: $u->user_login,
        'kind' => $kind, 'ref' => mb_substr((string) $ref, 0, 190), 'label' => mb_substr((string) $label, 0, 250),
        'old_value' => is_string($old) ? $old : wp_json_encode($old, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES),
        'new_value' => is_string($new) ? $new : wp_json_encode($new, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES),
        'created' => current_time('mysql', true),
    ));
}
