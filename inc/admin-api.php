<?php
if (!defined('ABSPATH')) exit;

require_once IB_CORE_PATH . 'inc/admin-products.php';

function ib_admin_guard($perm = 'read') {
    return function () use ($perm) {
        return is_user_logged_in() && ib_role_key() !== '' && ib_can($perm);
    };
}

add_action('rest_api_init', function () {
    $r = function ($path, $method, $cb, $perm = 'read') {
        register_rest_route('ib/v1', '/admin/' . $path, array('methods' => $method, 'callback' => $cb, 'permission_callback' => ib_admin_guard($perm)));
    };
    register_rest_route('ib/v1', '/admin/login', array('methods' => 'POST', 'callback' => 'ib_api_login', 'permission_callback' => '__return_true'));
    $r('logout', 'POST', 'ib_api_logout');
    $r('bootstrap', 'GET', 'ib_api_bootstrap');
    $r('save', 'POST', 'ib_api_save');
    $r('inbox', 'GET', 'ib_api_inbox', 'inbox');
    $r('inbox/status', 'POST', 'ib_api_inbox_status', 'inbox');
    $r('inbox/reply', 'POST', 'ib_api_inbox_reply', 'inbox');
    $r('inbox/delete', 'POST', 'ib_api_inbox_delete', 'inbox');
    $r('inbox/order', 'POST', 'ib_api_inbox_order', 'inbox');
    $r('media', 'GET', 'ib_api_media_list', 'media');
    $r('media/upload', 'POST', 'ib_api_media_upload', 'media');
    $r('media/alt', 'POST', 'ib_api_media_alt', 'media');
    $r('media/delete', 'POST', 'ib_api_media_delete', 'media');
    $r('coupon', 'POST', 'ib_api_coupon_save', 'promo');
    $r('coupon/delete', 'POST', 'ib_api_coupon_delete', 'promo');
    $r('coupons/replace', 'POST', 'ib_api_coupons_replace', 'backup');
    $r('history', 'GET', 'ib_api_history');
    $r('backup', 'GET', 'ib_api_backup', 'backup');
    $r('team', 'GET', 'ib_api_team', 'team');
    $r('team/add', 'POST', 'ib_api_team_add', 'team');
    $r('team/role', 'POST', 'ib_api_team_role', 'team');
    $r('team/delete', 'POST', 'ib_api_team_delete', 'team');
    $r('test-email', 'POST', 'ib_api_test_email', 'settings');
});

function ib_ok($data = array(), $status = 200) {
    return new WP_REST_Response(array_merge(array('ok' => true), $data), $status);
}
function ib_fail($msg, $status = 400) {
    return new WP_REST_Response(array('ok' => false, 'message' => $msg), $status);
}

/* ---------- Login ---------- */
function ib_api_login(WP_REST_Request $req) {
    $key = 'ib_rll_' . md5(ib_client_ip());
    $n = (int) get_transient($key);
    if ($n >= 10) return ib_fail('Too many tries. Please wait 15 minutes.', 429);
    set_transient($key, $n + 1, 15 * MINUTE_IN_SECONDS);
    $d = $req->get_json_params();
    $login = trim((string) ($d['user'] ?? ''));
    $pass = (string) ($d['pass'] ?? '');
    if ($login === '' || $pass === '') return ib_fail('Enter your username or email and your password.');
    $u = wp_signon(array('user_login' => $login, 'user_password' => $pass, 'remember' => true), is_ssl());
    if (is_wp_error($u)) return ib_fail('That username or password is not right.', 401);
    if (ib_role_key($u) === '') { wp_clear_auth_cookie(); return ib_fail('This account does not have admin access.', 403); }
    delete_transient($key);
    return ib_ok();
}
function ib_api_logout() {
    wp_logout();
    return ib_ok();
}

/* ---------- Bootstrap ---------- */
function ib_theme_site_url() {
    return set_url_scheme(trailingslashit(get_template_directory_uri()) . 'site/');
}

function ib_admin_site_images() {
    $dir = get_template_directory() . '/site/assets/img';
    $out = array();
    foreach (glob($dir . '/*.{jpg,jpeg,png,webp}', GLOB_BRACE) ?: array() as $f) $out[] = array('name' => basename($f), 'url' => ib_theme_site_url() . 'assets/img/' . basename($f));
    return $out;
}

function ib_admin_coupons() {
    global $wpdb;
    return $wpdb->get_results('SELECT * FROM ' . $wpdb->prefix . 'ib_coupons ORDER BY id DESC', ARRAY_A) ?: array();
}

function ib_admin_legal() {
    $out = array();
    foreach (array('terms-of-service' => 'terms', 'privacy-policy' => 'privacy', 'refunds-returns' => 'refunds') as $slug => $file) {
        $pg = get_page_by_path($slug, OBJECT, 'page');
        if ($pg) $out[] = array('id' => $pg->ID, 'slug' => $slug, 'file' => $file, 'title' => $pg->post_title, 'content' => $pg->post_content);
    }
    return $out;
}

function ib_api_counts() {
    global $wpdb;
    $t = ib_table();
    return array(
        'new_messages' => (int) $wpdb->get_var("SELECT COUNT(*) FROM $t WHERE type='contact' AND status='new'"),
        'new_carts' => (int) $wpdb->get_var("SELECT COUNT(*) FROM $t WHERE type='checkout' AND status='new'"),
    );
}

function ib_api_bootstrap() {
    $theme = ib_theme_site_url();
    $fields = ib_cms_fields();
    foreach ($fields as &$f) {
        if (is_string($f['value'])) $f['value'] = str_replace('{{T}}', $theme, $f['value']);
    }
    unset($f);
    global $wpdb;
    $hist = $wpdb->get_results('SELECT id,user_name,kind,ref,label,created FROM ' . $wpdb->prefix . 'ib_history ORDER BY id DESC LIMIT 12', ARRAY_A) ?: array();
    $u = wp_get_current_user();
    return ib_ok(array(
        'user' => array('name' => $u->display_name ?: $u->user_login, 'email' => $u->user_email, 'role' => ib_role_key(), 'id' => $u->ID),
        'perms' => ib_perms(),
        'fields' => $fields,
        'content' => (object) ib_cms_content(),
        'settings' => ib_cms_settings(),
        'defaults' => ib_cms_defaults(),
        'products' => function_exists('wc_get_product') ? ib_admin_products() : array(),
        'categories' => function_exists('wc_get_product') ? ib_admin_categories() : array(),
        'coupons' => ib_admin_coupons(),
        'legal' => ib_admin_legal(),
        'counts' => ib_api_counts(),
        'history' => $hist,
        'site_images' => ib_admin_site_images(),
        'fonts' => ib_fonts(),
        'page_meta' => (object) (json_decode((string) @file_get_contents(get_template_directory() . '/page-meta.json'), true) ?: array()),
        'site' => array('url' => home_url('/'), 'name' => get_bloginfo('name'), 'wp_admin' => admin_url(), 'woo_orders' => admin_url('admin.php?page=wc-orders'), 'seo_plugin' => ib_seo_plugin_active(), 'theme_url' => $theme),
    ));
}

function ib_seo_plugin_active() {
    return defined('WPSEO_VERSION') || defined('RANK_MATH_VERSION') || defined('AIOSEO_VERSION') || defined('SEOPRESS_VERSION') || defined('THE_SEO_FRAMEWORK_VERSION') || defined('SLIM_SEO_VER');
}

/* ---------- Save (batch) ---------- */
function ib_api_save(WP_REST_Request $req) {
    $d = $req->get_json_params();
    $changes = isset($d['changes']) && is_array($d['changes']) ? $d['changes'] : array();
    if (!ib_can('read') || count($changes) > 2000) return ib_fail('Nothing to save.');
    $content = ib_cms_content();
    $settings = get_option('ib_cms_settings', array());
    if (!is_array($settings)) $settings = array();
    $kinds = ib_cms_kinds();
    $defaults = array();
    foreach (ib_cms_fields() as $f) $defaults[$f['key']] = is_string($f['value']) ? str_replace('{{T}}', ib_theme_site_url(), $f['value']) : $f['value'];
    $applied = 0; $errors = array();
    $cur_settings = ib_cms_settings();
    $setting_perm = array('seo' => 'seo');
    foreach ($changes as $c) {
        if (!is_array($c) || empty($c['t'])) continue;
        $t = $c['t'];
        try {
            if ($t === 'content') {
                if (!ib_can('content')) { $errors[] = 'You cannot edit page content.'; continue; }
                $key = (string) ($c['key'] ?? '');
                if (!isset($kinds[$key])) { $errors[] = 'Unknown field ' . $key; continue; }
                $old = $content[$key] ?? null;
                $label = $key;
                if (array_key_exists('v', $c) && $c['v'] !== null) {
                    $v = ib_cms_clean_content($key, $c['v']);
                    if ($v === (string) ($defaults[$key] ?? '')) { unset($content[$key]); $new = null; }
                    else { $content[$key] = $v; $new = $v; }
                } else { unset($content[$key]); $new = null; }
                if ($old !== $new) { ib_history('content', $key, $key, $old, $new); $applied++; }
            } elseif ($t === 'setting') {
                $g = (string) ($c['group'] ?? '');
                $perm = isset($setting_perm[$g]) ? $setting_perm[$g] : 'settings';
                if (!ib_can($perm)) { $errors[] = 'You cannot change ' . $g . ' settings.'; continue; }
                list($clean, $blocked) = ib_cms_clean_group($g, $c['data'] ?? null);
                if ($clean === null) { $errors[] = 'Unknown settings group ' . $g; continue; }
                foreach ($blocked as $b) $errors[] = 'Your role cannot change ' . $b . '.';
                $old = $cur_settings[$g];
                if ($g === 'contact') {
                    update_option('ib_email', $clean['email'] ?: ib_email());
                    update_option('ib_phone', $clean['phone']);
                    update_option('ib_whatsapp', $clean['whatsapp']);
                    if (ib_can('code_js')) {
                        update_option('ib_smtp_host', $clean['smtp_host'] ?: 'smtp.hostinger.com');
                        update_option('ib_smtp_port', $clean['smtp_port'] ?: 465);
                        update_option('ib_smtp_user', $clean['smtp_user']);
                        if ($clean['smtp_pass'] !== '') update_option('ib_smtp_pass', $clean['smtp_pass']);
                    }
                    $clean['smtp_pass'] = '';
                } elseif ($g === 'shop') {
                    update_option('ib_min_order', max(1, $clean['min_order']));
                    $settings[$g] = array('max_qty' => $clean['max_qty']);
                } else {
                    $settings[$g] = $clean;
                }
                $cur_settings[$g] = $clean;
                if ($old != $clean) { ib_history('setting', $g, 'Settings: ' . $g, $old, $clean); $applied++; }
            } elseif ($t === 'product') {
                if (!ib_can('products')) { $errors[] = 'You cannot edit products.'; continue; }
                $pid = (int) ($c['pid'] ?? 0);
                $old = $pid ? ib_admin_product($pid) : null;
                $r = ib_admin_save_product($pid, is_array($c['data'] ?? null) ? $c['data'] : array());
                if (is_wp_error($r)) { $errors[] = $r->get_error_message(); continue; }
                $new = ib_admin_product($r);
                ib_history('product', $new['id'], 'Product: ' . $new['name'], $old, $new); $applied++;
            } elseif ($t === 'product_delete') {
                if (!ib_can('products')) { $errors[] = 'You cannot delete products.'; continue; }
                $pid = (int) ($c['pid'] ?? 0);
                $old = $pid ? ib_admin_product($pid) : null;
                if ($old && wp_trash_post($pid)) { ib_history('product', $old['id'], 'Moved to trash: ' . $old['name'], $old, null); $applied++; }
            } elseif ($t === 'order') {
                if (!ib_can('products')) { $errors[] = 'You cannot reorder products.'; continue; }
                $i = 0;
                foreach ((array) ($c['ids'] ?? array()) as $pid) { $i++; wp_update_post(array('ID' => (int) $pid, 'menu_order' => $i)); }
                ib_history('product', 'order', 'Product order changed', null, array_slice((array) $c['ids'], 0, 100)); $applied++;
            } elseif ($t === 'category') {
                if (!ib_can('products')) { $errors[] = 'You cannot edit collections.'; continue; }
                $tid = (int) ($c['term_id'] ?? 0); $dd = is_array($c['data'] ?? null) ? $c['data'] : array();
                $name = sanitize_text_field($dd['name'] ?? ''); $blurb = sanitize_text_field($dd['blurb'] ?? '');
                if ($tid) {
                    $old = get_term($tid, 'product_cat');
                    if (!$old || is_wp_error($old)) continue;
                    wp_update_term($tid, 'product_cat', array('name' => $name ?: $old->name, 'description' => $blurb));
                    if (isset($dd['order'])) update_term_meta($tid, 'order', (int) $dd['order']);
                    ib_history('category', $old->slug, 'Collection: ' . $old->name, array('name' => $old->name, 'blurb' => $old->description), array('name' => $name, 'blurb' => $blurb));
                } elseif ($name !== '') {
                    $res = wp_insert_term($name, 'product_cat', array('description' => $blurb));
                    if (is_wp_error($res)) { $errors[] = $res->get_error_message(); continue; }
                    update_term_meta($res['term_id'], 'order', (int) ($dd['order'] ?? 99));
                    ib_history('category', sanitize_title($name), 'New collection: ' . $name, null, array('name' => $name));
                }
                $applied++;
            } elseif ($t === 'page') {
                if (!ib_can('content')) { $errors[] = 'You cannot edit pages.'; continue; }
                $legal = array_column(ib_admin_legal(), null, 'id');
                $id = (int) ($c['id'] ?? 0);
                if (!isset($legal[$id])) { $errors[] = 'That page cannot be edited here.'; continue; }
                $dd = is_array($c['data'] ?? null) ? $c['data'] : array();
                $new = array('title' => sanitize_text_field($dd['title'] ?? $legal[$id]['title']), 'content' => wp_kses_post($dd['content'] ?? $legal[$id]['content']));
                wp_update_post(array('ID' => $id, 'post_title' => $new['title'], 'post_content' => $new['content']));
                ib_history('page', $legal[$id]['slug'], 'Page: ' . $new['title'], array('title' => $legal[$id]['title'], 'content' => $legal[$id]['content']), $new); $applied++;
            }
        } catch (Throwable $e) {
            $errors[] = 'Could not save one change: ' . $e->getMessage();
        }
    }
    update_option('ib_cms_content', $content, false);
    update_option('ib_cms_settings', $settings, false);
    if (function_exists('ib_bust_catalog')) ib_bust_catalog();
    ib_purge_caches();
    return ib_ok(array('applied' => $applied, 'errors' => $errors));
}

/* ---------- Inbox ---------- */
function ib_api_inbox(WP_REST_Request $req) {
    global $wpdb;
    $type = $req->get_param('type') === 'checkout' ? 'checkout' : ($req->get_param('type') === 'contact' ? 'contact' : '');
    $status = in_array($req->get_param('status'), array('new', 'read', 'done', 'spam'), true) ? $req->get_param('status') : '';
    $where = array('1=1'); $args = array();
    if ($type) { $where[] = 'type = %s'; $args[] = $type; }
    if ($status) { $where[] = 'status = %s'; $args[] = $status; }
    $sql = 'SELECT * FROM ' . ib_table() . ' WHERE ' . implode(' AND ', $where) . ' ORDER BY id DESC LIMIT 300';
    $rows = $args ? $wpdb->get_results($wpdb->prepare($sql, $args), ARRAY_A) : $wpdb->get_results($sql, ARRAY_A);
    foreach ($rows as &$r) {
        $r['payload'] = json_decode($r['payload'], true);
        $r['order_status'] = '';
        if (!empty($r['order_id']) && function_exists('wc_get_order')) { $o = wc_get_order((int) $r['order_id']); if ($o) $r['order_status'] = $o->get_status(); }
    }
    unset($r);
    return ib_ok(array('rows' => $rows ?: array()));
}
function ib_api_inbox_status(WP_REST_Request $req) {
    global $wpdb;
    $d = $req->get_json_params();
    $st = $d['status'] ?? '';
    if (!in_array($st, array('new', 'read', 'done', 'spam'), true)) return ib_fail('Bad status.');
    $wpdb->update(ib_table(), array('status' => $st), array('id' => (int) ($d['id'] ?? 0)));
    return ib_ok();
}
function ib_api_inbox_reply(WP_REST_Request $req) {
    global $wpdb;
    $d = $req->get_json_params();
    $row = $wpdb->get_row($wpdb->prepare('SELECT * FROM ' . ib_table() . ' WHERE id = %d', (int) ($d['id'] ?? 0)), ARRAY_A);
    if (!$row) return ib_fail('Message not found.', 404);
    $p = json_decode($row['payload'], true);
    $to = $p['email'] ?? '';
    $body = ib_clean_text($d['body'] ?? '', 6000);
    if (!is_email($to) || $body === '') return ib_fail('Write a reply first.');
    $subject = ib_clean_line($d['subject'] ?? 'Your Imperial Blowork message', 150);
    $sent = ib_send($to, $subject, '<p>' . nl2br(esc_html($body)) . '</p>', ib_email(), 'Imperial Blowork');
    if (!$sent) return ib_fail('The email could not be sent. Check the email settings.', 500);
    $wpdb->update(ib_table(), array('status' => 'done'), array('id' => $row['id']));
    ib_history('reply', 'msg-' . $row['id'], 'Reply sent to ' . $to, null, $body);
    return ib_ok();
}
function ib_api_inbox_order(WP_REST_Request $req) {
    global $wpdb;
    $d = $req->get_json_params();
    $labels = array('on-hold' => 'Awaiting payment', 'processing' => 'Paid', 'completed' => 'Shipped', 'cancelled' => 'Cancelled');
    $st = (string) ($d['status'] ?? '');
    if (!isset($labels[$st])) return ib_fail('Choose a status.');
    $row = $wpdb->get_row($wpdb->prepare('SELECT * FROM ' . ib_table() . ' WHERE id = %d', (int) ($d['id'] ?? 0)), ARRAY_A);
    if (!$row || empty($row['order_id']) || !function_exists('wc_get_order')) return ib_fail('This cart has no order to update.', 404);
    $o = wc_get_order((int) $row['order_id']);
    if (!$o) return ib_fail('The order was not found.', 404);
    $old = $o->get_status();
    if ($old !== $st) $o->update_status($st, 'Status changed in the admin panel. ');
    $wpdb->update(ib_table(), array('status' => $st === 'on-hold' ? 'new' : 'done'), array('id' => $row['id']));
    $p = json_decode($row['payload'], true);
    $sent = false;
    if (!empty($d['notify']) && is_email($p['email'] ?? '')) {
        $ref = 'IB-' . $row['id'];
        $msg = array('processing' => 'We have received your payment. We are preparing your order.', 'completed' => 'Your order has been shipped.', 'cancelled' => 'Your order has been cancelled. Reply to this email if you have questions.', 'on-hold' => 'Your order is waiting for payment.');
        $note = ib_clean_text($d['note'] ?? '', 1000);
        $body = '<h2 style="margin:0 0 6px">Order ' . esc_html($ref) . ': ' . esc_html($labels[$st]) . '</h2><p>Hi ' . esc_html($p['name'] ?? '') . ', ' . esc_html($msg[$st]) . '</p>' . ($note !== '' ? '<p>' . nl2br(esc_html($note)) . '</p>' : '')
            . '<p style="color:#666">Questions? Reply to this email or write to ' . esc_html(ib_email()) . '.</p>';
        $sent = ib_send($p['email'], 'Order ' . $ref . ': ' . $labels[$st], $body, ib_email(), 'Imperial Blowork');
    }
    ib_history('order', 'IB-' . $row['id'], 'Order IB-' . $row['id'] . ': ' . $labels[$st], $old, $st);
    return ib_ok(array('sent' => $sent));
}
function ib_api_inbox_delete(WP_REST_Request $req) {
    global $wpdb;
    $d = $req->get_json_params();
    $wpdb->delete(ib_table(), array('id' => (int) ($d['id'] ?? 0)));
    return ib_ok();
}

/* ---------- Media ---------- */
function ib_api_media_list(WP_REST_Request $req) {
    $q = new WP_Query(array('post_type' => 'attachment', 'post_status' => 'inherit', 'post_mime_type' => 'image', 'posts_per_page' => 48,
        'paged' => max(1, (int) $req->get_param('page')), 's' => sanitize_text_field((string) $req->get_param('s')), 'orderby' => 'date', 'order' => 'DESC'));
    $items = array();
    foreach ($q->posts as $p) {
        $m = wp_get_attachment_metadata($p->ID);
        $thumb = wp_get_attachment_image_url($p->ID, 'medium') ?: wp_get_attachment_url($p->ID);
        $items[] = array('id' => $p->ID, 'url' => wp_get_attachment_url($p->ID), 'thumb' => $thumb, 'alt' => (string) get_post_meta($p->ID, '_wp_attachment_image_alt', true),
            'name' => basename(get_attached_file($p->ID)), 'w' => $m['width'] ?? 0, 'h' => $m['height'] ?? 0);
    }
    return ib_ok(array('items' => $items, 'pages' => (int) $q->max_num_pages));
}
function ib_api_media_upload(WP_REST_Request $req) {
    $files = $req->get_file_params();
    if (empty($files['file'])) return ib_fail('Choose an image first.');
    $f = $files['file'];
    if ($f['size'] > 8 * 1024 * 1024) return ib_fail('That image is bigger than 8 MB.');
    require_once ABSPATH . 'wp-admin/includes/file.php';
    require_once ABSPATH . 'wp-admin/includes/image.php';
    $r = wp_handle_upload($f, array('test_form' => false, 'mimes' => array('jpg|jpeg|jpe' => 'image/jpeg', 'png' => 'image/png', 'gif' => 'image/gif', 'webp' => 'image/webp')));
    if (!empty($r['error'])) return ib_fail($r['error']);
    $id = wp_insert_attachment(array('post_mime_type' => $r['type'], 'post_title' => sanitize_file_name(pathinfo($r['file'], PATHINFO_FILENAME)), 'post_status' => 'inherit'), $r['file']);
    if (is_wp_error($id)) return ib_fail('Could not save that image.');
    wp_update_attachment_metadata($id, wp_generate_attachment_metadata($id, $r['file']));
    ib_history('media', 'att-' . $id, 'Uploaded image ' . basename($r['file']), null, $r['url']);
    return ib_ok(array('id' => $id, 'url' => $r['url']));
}
function ib_api_media_alt(WP_REST_Request $req) {
    $d = $req->get_json_params(); $id = (int) ($d['id'] ?? 0);
    if (get_post_type($id) !== 'attachment') return ib_fail('Not found.', 404);
    update_post_meta($id, '_wp_attachment_image_alt', sanitize_text_field($d['alt'] ?? ''));
    return ib_ok();
}
function ib_api_media_delete(WP_REST_Request $req) {
    $d = $req->get_json_params(); $id = (int) ($d['id'] ?? 0);
    if (get_post_type($id) !== 'attachment') return ib_fail('Not found.', 404);
    $url = wp_get_attachment_url($id);
    wp_delete_attachment($id, true);
    ib_history('media', 'att-' . $id, 'Deleted image', $url, null);
    ib_bust_catalog();
    return ib_ok();
}

/* ---------- Promo codes (saved immediately) ---------- */
function ib_api_coupon_save(WP_REST_Request $req) {
    global $wpdb;
    $d = $req->get_json_params();
    $code = strtoupper(preg_replace('/[^A-Za-z0-9_-]/', '', (string) ($d['code'] ?? '')));
    if (strlen($code) < 3) return ib_fail('A code needs at least 3 letters or numbers.');
    $type = in_array($d['type'] ?? '', array('percent', 'fixed', 'shipping'), true) ? $d['type'] : 'percent';
    $date = function ($v) { return preg_match('/^\d{4}-\d{2}-\d{2}$/', (string) $v) ? $v : null; };
    $row = array('code' => $code, 'type' => $type, 'amount' => max(0, round((float) ($d['amount'] ?? 0), 2)), 'min_order' => max(0, round((float) ($d['min_order'] ?? 0), 2)),
        'starts' => $date($d['starts'] ?? ''), 'ends' => $date($d['ends'] ?? ''), 'max_uses' => max(0, (int) ($d['max_uses'] ?? 0)), 'active' => empty($d['active']) ? 0 : 1, 'note' => sanitize_text_field($d['note'] ?? ''));
    if ($type === 'percent' && $row['amount'] > 100) $row['amount'] = 100;
    $id = (int) ($d['id'] ?? 0);
    $old = $id ? $wpdb->get_row($wpdb->prepare('SELECT * FROM ' . $wpdb->prefix . 'ib_coupons WHERE id=%d', $id), ARRAY_A) : null;
    $dup = $wpdb->get_var($wpdb->prepare('SELECT id FROM ' . $wpdb->prefix . 'ib_coupons WHERE code=%s AND id<>%d', $code, $id));
    if ($dup) return ib_fail('That code already exists.');
    if ($id && $old) $wpdb->update($wpdb->prefix . 'ib_coupons', $row, array('id' => $id));
    else { $wpdb->insert($wpdb->prefix . 'ib_coupons', $row); $id = (int) $wpdb->insert_id; }
    ib_history('coupon', $code, 'Promo code ' . $code, $old, $row);
    return ib_ok(array('coupons' => ib_admin_coupons()));
}
function ib_api_coupon_delete(WP_REST_Request $req) {
    global $wpdb;
    $d = $req->get_json_params(); $id = (int) ($d['id'] ?? 0);
    $old = $wpdb->get_row($wpdb->prepare('SELECT * FROM ' . $wpdb->prefix . 'ib_coupons WHERE id=%d', $id), ARRAY_A);
    if ($old) { $wpdb->delete($wpdb->prefix . 'ib_coupons', array('id' => $id)); ib_history('coupon', $old['code'], 'Deleted promo code ' . $old['code'], $old, null); }
    return ib_ok(array('coupons' => ib_admin_coupons()));
}
function ib_api_coupons_replace(WP_REST_Request $req) {
    global $wpdb;
    $d = $req->get_json_params();
    $list = is_array($d['coupons'] ?? null) ? $d['coupons'] : array();
    $wpdb->query('DELETE FROM ' . $wpdb->prefix . 'ib_coupons');
    foreach (array_slice($list, 0, 500) as $c) {
        $code = strtoupper(preg_replace('/[^A-Za-z0-9_-]/', '', (string) ($c['code'] ?? '')));
        if (strlen($code) < 3) continue;
        $date = function ($v) { return preg_match('/^\d{4}-\d{2}-\d{2}$/', (string) $v) ? $v : null; };
        $wpdb->insert($wpdb->prefix . 'ib_coupons', array('code' => $code, 'type' => in_array($c['type'] ?? '', array('percent', 'fixed', 'shipping'), true) ? $c['type'] : 'percent',
            'amount' => (float) ($c['amount'] ?? 0), 'min_order' => (float) ($c['min_order'] ?? 0), 'starts' => $date($c['starts'] ?? ''), 'ends' => $date($c['ends'] ?? ''),
            'max_uses' => (int) ($c['max_uses'] ?? 0), 'used' => (int) ($c['used'] ?? 0), 'active' => empty($c['active']) ? 0 : 1, 'note' => sanitize_text_field($c['note'] ?? '')));
    }
    ib_history('coupon', 'all', 'Promo codes restored from backup', null, count($list));
    return ib_ok(array('coupons' => ib_admin_coupons()));
}

/* ---------- History, backup ---------- */
function ib_api_history(WP_REST_Request $req) {
    global $wpdb;
    $kind = sanitize_key((string) $req->get_param('kind'));
    $limit = min(300, max(10, (int) $req->get_param('limit') ?: 100));
    $t = $wpdb->prefix . 'ib_history';
    $rows = $kind ? $wpdb->get_results($wpdb->prepare("SELECT * FROM $t WHERE kind=%s ORDER BY id DESC LIMIT %d", $kind, $limit), ARRAY_A)
                  : $wpdb->get_results($wpdb->prepare("SELECT * FROM $t ORDER BY id DESC LIMIT %d", $limit), ARRAY_A);
    foreach ($rows as &$r) {
        foreach (array('old_value', 'new_value') as $k) {
            $j = json_decode((string) $r[$k], true);
            $r[$k] = json_last_error() === JSON_ERROR_NONE ? $j : $r[$k];
        }
    }
    return ib_ok(array('rows' => $rows ?: array()));
}
function ib_api_backup() {
    return ib_ok(array('backup' => array(
        'format' => 'imperial-blowork-admin-backup', 'version' => 1, 'created' => gmdate('c'), 'site' => home_url('/'),
        'content' => (object) ib_cms_content(), 'settings' => ib_cms_settings(), 'products' => ib_admin_products(), 'categories' => ib_admin_categories(),
        'coupons' => ib_admin_coupons(), 'pages' => ib_admin_legal(),
    )));
}

/* ---------- Team (owner only) ---------- */
function ib_wp_role_for($key) {
    $m = array('owner' => 'administrator', 'admin' => 'shop_manager', 'editor' => 'editor', 'viewer' => 'ib_viewer');
    return isset($m[$key]) ? $m[$key] : '';
}
function ib_api_team() {
    $out = array();
    foreach (get_users(array('role__in' => array('administrator', 'shop_manager', 'editor', 'ib_viewer'))) as $u) {
        $out[] = array('id' => $u->ID, 'name' => $u->display_name, 'email' => $u->user_email, 'login' => $u->user_login, 'role' => ib_role_key($u));
    }
    return ib_ok(array('team' => $out));
}
function ib_api_team_add(WP_REST_Request $req) {
    $d = $req->get_json_params();
    $email = sanitize_email($d['email'] ?? ''); $role = ib_wp_role_for($d['role'] ?? '');
    if (!is_email($email) || !$role) return ib_fail('Enter a valid email and choose a role.');
    if (email_exists($email)) return ib_fail('That email already has an account. Change its role below.');
    $id = wp_insert_user(array('user_login' => $email, 'user_email' => $email, 'display_name' => sanitize_text_field($d['name'] ?? '') ?: $email, 'role' => $role, 'user_pass' => wp_generate_password(24)));
    if (is_wp_error($id)) return ib_fail($id->get_error_message());
    wp_new_user_notification($id, null, 'user');
    ib_history('team', $email, 'Added team member ' . $email, null, $d['role']);
    return ib_api_team();
}
function ib_api_team_role(WP_REST_Request $req) {
    $d = $req->get_json_params(); $id = (int) ($d['id'] ?? 0); $role = ib_wp_role_for($d['role'] ?? '');
    $u = get_userdata($id);
    if (!$u || !$role) return ib_fail('Not found.', 404);
    if ($id === get_current_user_id()) return ib_fail('You cannot change your own role.');
    $u->set_role($role);
    ib_history('team', $u->user_email, 'Role changed for ' . $u->user_email, null, $d['role']);
    return ib_api_team();
}
function ib_api_team_delete(WP_REST_Request $req) {
    $d = $req->get_json_params(); $id = (int) ($d['id'] ?? 0);
    $u = get_userdata($id);
    if (!$u) return ib_fail('Not found.', 404);
    if ($id === get_current_user_id()) return ib_fail('You cannot remove yourself.');
    require_once ABSPATH . 'wp-admin/includes/user.php';
    wp_delete_user($id, get_current_user_id());
    ib_history('team', $u->user_email, 'Removed team member ' . $u->user_email, null, null);
    return ib_api_team();
}

function ib_api_test_email() {
    $to = ib_email();
    $ok = ib_send($to, 'Test email from your Imperial Blowork admin', '<p>This is a test. If you can read it, email from the site is working.</p>', $to, 'Imperial Blowork');
    return $ok ? ib_ok(array('message' => 'Test email sent to ' . $to . '.')) : ib_fail('The test email failed: ' . ($GLOBALS['ib_mail_error'] ?: 'unknown error'), 500);
}
