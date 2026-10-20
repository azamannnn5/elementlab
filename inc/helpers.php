<?php
if (!defined('ABSPATH')) exit;

function ib_table() {
    global $wpdb;
    return $wpdb->prefix . 'ib_requests';
}

function ib_install_table() {
    global $wpdb;
    require_once ABSPATH . 'wp-admin/includes/upgrade.php';
    $charset = $wpdb->get_charset_collate();
    $sql = 'CREATE TABLE ' . ib_table() . " (
        id bigint(20) unsigned NOT NULL AUTO_INCREMENT,
        type varchar(20) NOT NULL,
        payload longtext NOT NULL,
        mail_sent tinyint(1) NOT NULL DEFAULT 0,
        mail_error text NULL,
        order_id bigint(20) unsigned NULL,
        created datetime NOT NULL,
        PRIMARY KEY  (id)
    ) $charset;";
    dbDelta($sql);
    update_option('ib_db_v', '1');
}

function ib_email() {
    $e = get_option('ib_email', '');
    return is_email($e) ? $e : 'info@imperialblowork.com';
}

function ib_min_order() {
    $m = (float) get_option('ib_min_order', 80);
    return $m > 0 ? $m : 80;
}

function ib_money($n) {
    $n = (float) $n;
    return '$' . (floor($n) == $n ? number_format($n, 0) : number_format($n, 2));
}

function ib_client_ip() {
    return isset($_SERVER['REMOTE_ADDR']) ? sanitize_text_field(wp_unslash($_SERVER['REMOTE_ADDR'])) : '0';
}

function ib_clean_line($s, $max = 200) {
    $s = sanitize_text_field((string) $s);
    return function_exists('mb_substr') ? mb_substr($s, 0, $max) : substr($s, 0, $max);
}

function ib_clean_text($s, $max = 4000) {
    $s = sanitize_textarea_field((string) $s);
    return function_exists('mb_substr') ? mb_substr($s, 0, $max) : substr($s, 0, $max);
}

/** Clear page caches (LiteSpeed on Hostinger) after catalog changes. */
function ib_purge_caches() {
    if (has_action('litespeed_purge_all')) do_action('litespeed_purge_all');
    if (function_exists('wp_cache_flush')) wp_cache_flush();
}
