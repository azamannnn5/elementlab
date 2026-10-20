<?php
/**
 * Plugin Name: Imperial Blowork Core
 * Description: Checkout, contact form, email, WooCommerce product feed and product import for the Imperial Blowork storefront theme.
 * Version: 1.0.0
 * Requires PHP: 7.4
 * Author: Imperial Blowork
 * Text Domain: imperial-blowork-core
 */
if (!defined('ABSPATH')) exit;

define('IB_CORE_VER', '1.0.0');
define('IB_CORE_PATH', plugin_dir_path(__FILE__));

require_once IB_CORE_PATH . 'inc/helpers.php';
require_once IB_CORE_PATH . 'inc/mail.php';
require_once IB_CORE_PATH . 'inc/catalog.php';
require_once IB_CORE_PATH . 'inc/rest.php';
require_once IB_CORE_PATH . 'inc/redirects.php';
require_once IB_CORE_PATH . 'inc/metabox.php';
require_once IB_CORE_PATH . 'inc/importer.php';
require_once IB_CORE_PATH . 'inc/setup.php';
require_once IB_CORE_PATH . 'inc/admin.php';

register_activation_hook(__FILE__, function () {
    ib_install_table();
    if (get_option('ib_email', '') === '') update_option('ib_email', 'info@imperialblowork.com');
    flush_rewrite_rules();
});

add_action('plugins_loaded', function () {
    if (get_option('ib_db_v') !== '1') ib_install_table();
});
