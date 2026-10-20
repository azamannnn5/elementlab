<?php
if (!defined('ABSPATH')) exit;

add_filter('wp_mail_from', function () {
    return ib_email();
});
add_filter('wp_mail_from_name', function () {
    return 'Imperial Blowork';
});

/* Use the mailbox's SMTP server once the password is saved in Settings > Imperial Blowork. */
add_action('phpmailer_init', function ($m) {
    $pass = (string) get_option('ib_smtp_pass', '');
    if ($pass === '') return;
    $host = trim((string) get_option('ib_smtp_host', 'smtp.hostinger.com'));
    $port = (int) get_option('ib_smtp_port', 465);
    $user = trim((string) get_option('ib_smtp_user', ''));
    if ($user === '') $user = ib_email();
    $m->isSMTP();
    $m->Host = $host;
    $m->Port = $port;
    $m->SMTPAuth = true;
    $m->Username = $user;
    $m->Password = $pass;
    $m->SMTPSecure = $port === 465 ? 'ssl' : 'tls';
    $m->SMTPAutoTLS = $port !== 465;
    $m->Sender = $user;
});

/* WooCommerce would send its own copies; the plugin sends the branded ones. */
add_filter('woocommerce_email_enabled_new_order', '__return_false');
add_filter('woocommerce_email_enabled_customer_on_hold_order', '__return_false');
add_filter('woocommerce_email_enabled_customer_processing_order', '__return_false');

$GLOBALS['ib_mail_error'] = '';
add_action('wp_mail_failed', function ($err) {
    $GLOBALS['ib_mail_error'] = is_wp_error($err) ? $err->get_error_message() : 'unknown';
});

function ib_header_name($name) {
    return trim(str_replace(array('"', '<', '>', ',', "\r", "\n"), '', (string) $name));
}

/** Send an HTML email. Returns bool. */
function ib_send($to, $subject, $body, $reply_to = '', $reply_name = '') {
    $headers = array('Content-Type: text/html; charset=UTF-8');
    if (is_email($reply_to)) {
        $headers[] = 'Reply-To: ' . ($reply_name !== '' ? ib_header_name($reply_name) . ' <' . $reply_to . '>' : $reply_to);
    }
    $wrapped = '<div style="font-family:Arial,Helvetica,sans-serif;font-size:15px;line-height:1.55;color:#111;max-width:620px">' . $body . '</div>';
    return (bool) wp_mail($to, $subject, $wrapped, $headers);
}
