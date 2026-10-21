<?php
if (!defined('ABSPATH')) exit;

add_action('rest_api_init', function () {
    register_rest_route('ib/v1', '/checkout', array('methods' => 'POST', 'callback' => 'ib_rest_checkout', 'permission_callback' => '__return_true'));
    register_rest_route('ib/v1', '/promo', array('methods' => 'POST', 'callback' => 'ib_rest_promo', 'permission_callback' => '__return_true'));
    register_rest_route('ib/v1', '/contact', array('methods' => 'POST', 'callback' => 'ib_rest_contact', 'permission_callback' => '__return_true'));
});

function ib_reply($ok, $message = '', $status = 200, $extra = array()) {
    return new WP_REST_Response(array_merge(array('ok' => $ok, 'message' => $message), $extra), $status);
}

/** Max 6 submissions per IP per 10 minutes. */
function ib_rate_limited() {
    $key = 'ib_rl_' . md5(ib_client_ip());
    $n = (int) get_transient($key);
    if ($n >= 6) return true;
    set_transient($key, $n + 1, 10 * MINUTE_IN_SECONDS);
    return false;
}

function ib_log_request($type, $payload) {
    global $wpdb;
    $wpdb->insert(ib_table(), array(
        'type' => $type,
        'payload' => wp_json_encode($payload, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES),
        'created' => current_time('mysql', true),
    ));
    return (int) $wpdb->insert_id;
}

function ib_log_update($id, $data) {
    global $wpdb;
    $wpdb->update(ib_table(), $data, array('id' => $id));
}

function ib_row($label, $value) {
    return '<tr><td style="padding:4px 14px 4px 0;color:#666;vertical-align:top;white-space:nowrap">' . esc_html($label) . '</td><td style="padding:4px 0">' . $value . '</td></tr>';
}

/* ---------------- Checkout ---------------- */
function ib_rest_checkout(WP_REST_Request $req) {
    $d = $req->get_json_params();
    if (!is_array($d)) $d = $req->get_params();

    // Honeypot: pretend success.
    if (!empty($d['bot_field'])) return ib_reply(true, 'ok');
    if (function_exists('ib_maintenance_blocked') && ib_maintenance_blocked()) return ib_reply(false, 'The site is being updated. Please try again soon.', 503);
    if (ib_rate_limited()) return ib_reply(false, 'Too many requests. Please try again in a few minutes.', 429);

    $name = ib_clean_line($d['name'] ?? '', 120);
    $email = sanitize_email($d['email'] ?? '');
    $phone = ib_clean_line($d['phone'] ?? '', 40);
    $address = ib_clean_text($d['address'] ?? '', 600);
    $agree = ($d['agree'] ?? '') === 'yes';
    $allowed = array('Bitcoin', 'Cashapp', 'Apple Pay', 'Zelle', 'Chime');
    $pay = array();
    foreach ((array) ($d['payment_options'] ?? array()) as $o) {
        $o = ib_clean_line($o, 30);
        if (in_array($o, $allowed, true) && !in_array($o, $pay, true)) $pay[] = $o;
    }
    if ($name === '' || !is_email($email) || $address === '') return ib_reply(false, 'Please fill in your name, email and shipping address.', 400);
    if (!$pay) return ib_reply(false, 'Please choose at least one payment option.', 400);
    if (!$agree) return ib_reply(false, 'Please agree to the Terms of Service, Privacy Policy and Refunds & Returns Policy.', 400);

    // Recompute everything from WooCommerce prices. Never trust browser totals.
    $promo = ib_clean_line($d['promo'] ?? '', 40);
    $priced = ib_price_cart($d['cart'] ?? array(), $promo);
    if (!$priced['ok']) return ib_reply(false, $priced['error'], 400);
    $lines = $priced['lines']; $subtotal = $priced['subtotal']; $count = $priced['count'];

    $log_id = ib_log_request('checkout', array(
        'name' => $name, 'email' => $email, 'phone' => $phone, 'address' => $address, 'payment_options' => $pay,
        'lines' => $lines, 'subtotal' => $subtotal, 'discount' => $priced['discount'], 'shipping' => $priced['shipping'], 'promo' => $priced['promo'] ? $priced['promo']['code'] : '', 'total' => $priced['total'], 'ip' => ib_client_ip(),
    ));
    $ref = 'IB-' . $log_id;

    // WooCommerce order (best effort; the logged request is the safety net).
    $order_id = 0;
    try {
        if (function_exists('wc_create_order')) {
            $order = wc_create_order(array('status' => 'pending'));
            foreach ($lines as $l) {
                $prod = wc_get_product($l['wc_id']);
                if ($prod) $order->add_product($prod, $l['qty'], array('subtotal' => $l['total'], 'total' => $l['total']));
            }
            if ($priced['discount'] > 0) {
                $fee = new WC_Order_Item_Fee(); $fee->set_name('Promo ' . $priced['promo']['code']); $fee->set_total(-$priced['discount']); $fee->set_tax_status('none'); $order->add_item($fee);
            }
            if ($priced['shipping'] > 0) {
                $fee = new WC_Order_Item_Fee(); $fee->set_name(ib_cms_settings()['shipping']['label'] ?: 'Shipping'); $fee->set_total($priced['shipping']); $fee->set_tax_status('none'); $order->add_item($fee);
            }
            $parts = explode(' ', $name, 2);
            $addr = array('first_name' => $parts[0], 'last_name' => $parts[1] ?? '', 'email' => $email, 'phone' => $phone, 'address_1' => $address, 'country' => 'US');
            $order->set_address($addr, 'billing');
            $order->set_address($addr, 'shipping');
            $order->set_payment_method_title('To confirm by email: ' . implode(', ', $pay));
            $order->update_meta_data('_ib_ref', $ref);
            $order->update_meta_data('_ib_payment_options', implode(', ', $pay));
            $order->calculate_totals(false);
            $order->update_status('on-hold', 'Cart sent from the website. Payment options chosen: ' . implode(', ', $pay) . '. ');
            $order->save();
            $order_id = $order->get_id();
        }
    } catch (Throwable $e) {
        $order_id = 0;
    }
    if ($order_id) ib_log_update($log_id, array('order_id' => $order_id));
    if ($priced['promo']) { global $wpdb; $wpdb->query($wpdb->prepare('UPDATE ' . $wpdb->prefix . 'ib_coupons SET used = used + 1 WHERE id = %d', $priced['promo']['id'])); }

    // Emails
    $rows = '';
    foreach ($lines as $l) {
        $rows .= '<tr><td style="padding:6px 10px 6px 0;border-bottom:1px solid #eee">' . esc_html($l['name']) . ($l['opt'] === 'kit' ? ' (10-pack)' : '') . '</td>'
            . '<td style="padding:6px 10px;border-bottom:1px solid #eee;text-align:center">' . (int) $l['qty'] . '</td>'
            . '<td style="padding:6px 10px;border-bottom:1px solid #eee;text-align:right">' . esc_html(ib_money($l['unit'])) . '</td>'
            . '<td style="padding:6px 0 6px 10px;border-bottom:1px solid #eee;text-align:right">' . esc_html(ib_money($l['total'])) . '</td></tr>';
    }
    $extra = '';
    if ($priced['discount'] > 0) $extra .= '<tr><td colspan="3" style="padding:4px 10px 0 0;text-align:right">Promo ' . esc_html($priced['promo']['code']) . '</td><td style="padding:4px 0 0 10px;text-align:right">-' . esc_html(ib_money($priced['discount'])) . '</td></tr>';
    if ($priced['shipping'] > 0) $extra .= '<tr><td colspan="3" style="padding:4px 10px 0 0;text-align:right">' . esc_html(ib_cms_settings()['shipping']['label']) . '</td><td style="padding:4px 0 0 10px;text-align:right">' . esc_html(ib_money($priced['shipping'])) . '</td></tr>';
    if ($priced['promo'] && $priced['free_shipping']) $extra .= '<tr><td colspan="3" style="padding:4px 10px 0 0;text-align:right">Promo ' . esc_html($priced['promo']['code']) . '</td><td style="padding:4px 0 0 10px;text-align:right">free shipping</td></tr>';
    $items = '<table style="border-collapse:collapse;width:100%;margin:10px 0"><tr style="text-align:left;color:#666"><th style="padding:4px 10px 4px 0">Item</th><th style="padding:4px 10px;text-align:center">Qty</th><th style="padding:4px 10px;text-align:right">Each</th><th style="padding:4px 0 4px 10px;text-align:right">Total</th></tr>'
        . $rows . '<tr><td colspan="3" style="padding:8px 10px 0 0;text-align:right">Subtotal</td><td style="padding:8px 0 0 10px;text-align:right">' . esc_html(ib_money($subtotal)) . '</td></tr>' . $extra
        . '<tr><td colspan="3" style="padding:8px 10px 0 0;text-align:right"><strong>Total</strong></td><td style="padding:8px 0 0 10px;text-align:right"><strong>' . esc_html(ib_money($priced['total'])) . '</strong></td></tr></table>';

    $admin = '<h2 style="margin:0 0 6px">New cart ' . esc_html($ref) . '</h2><p style="margin:0 0 10px">' . (int) $count . ' item(s), total ' . esc_html(ib_money($priced['total'])) . '. Reply to this email to answer the customer.</p>'
        . '<table style="border-collapse:collapse">'
        . ib_row('Name', esc_html($name)) . ib_row('Email', '<a href="mailto:' . esc_attr($email) . '">' . esc_html($email) . '</a>')
        . ib_row('Phone', $phone !== '' ? esc_html($phone) : '-') . ib_row('Address', nl2br(esc_html($address)))
        . ib_row('Payment options', esc_html(implode(', ', $pay)))
        . ($order_id ? ib_row('Order', '#' . (int) $order_id . ' (on hold in WooCommerce)') : '')
        . '</table>' . $items;
    $sent = ib_send(ib_email(), 'New cart ' . $ref . ' from ' . ib_header_name($name) . ' (' . ib_money($priced['total']) . ')', $admin, $email, $name);
    $err = $sent ? '' : $GLOBALS['ib_mail_error'];

    $cust = '<h2 style="margin:0 0 6px">We received your cart</h2><p>Hi ' . esc_html($name) . ', thank you. Your cart reference is <strong>' . esc_html($ref) . '</strong>.</p>'
        . '<p>We will reply by email to confirm your items, total and payment. Nothing is charged until we confirm.</p>' . $items
        . '<p style="margin-top:14px"><strong>Payment options chosen:</strong> ' . esc_html(implode(', ', $pay)) . '<br><strong>Shipping address:</strong><br>' . nl2br(esc_html($address)) . '</p>'
        . '<p style="color:#666">Questions? Reply to this email or write to ' . esc_html(ib_email()) . '.</p>';
    $sent2 = ib_send($email, 'Your Imperial Blowork cart ' . $ref, $cust, ib_email(), 'Imperial Blowork');
    if (!$sent2 && $err === '') $err = $GLOBALS['ib_mail_error'];
    ib_log_update($log_id, array('mail_sent' => $sent ? 1 : 0, 'mail_error' => $err));

    // Mail trouble is never shown to the customer: the request is saved either way.
    return ib_reply(true, 'ok', 200, array('ref' => $ref));
}

/* ---------------- Contact ---------------- */
function ib_rest_contact(WP_REST_Request $req) {
    $d = $req->get_json_params();
    if (!is_array($d)) $d = $req->get_params();
    if (!empty($d['bot_field'])) return ib_reply(true, 'ok');
    if (function_exists('ib_maintenance_blocked') && ib_maintenance_blocked()) return ib_reply(false, 'The site is being updated. Please try again soon.', 503);
    if (ib_rate_limited()) return ib_reply(false, 'Too many requests. Please try again in a few minutes.', 429);

    $name = ib_clean_line($d['name'] ?? '', 120);
    $email = sanitize_email($d['email'] ?? '');
    $ref = ib_clean_line($d['order_reference'] ?? '', 60);
    $msg = ib_clean_text($d['message'] ?? '', 4000);
    if ($name === '' || !is_email($email) || $msg === '') return ib_reply(false, 'Please fill in your name, email and message.', 400);

    $log_id = ib_log_request('contact', array('name' => $name, 'email' => $email, 'order_reference' => $ref, 'message' => $msg, 'ip' => ib_client_ip()));
    $body = '<h2 style="margin:0 0 6px">New message MSG-' . (int) $log_id . '</h2><p style="margin:0 0 10px">Reply to this email to answer the customer.</p>'
        . '<table style="border-collapse:collapse">' . ib_row('Name', esc_html($name))
        . ib_row('Email', '<a href="mailto:' . esc_attr($email) . '">' . esc_html($email) . '</a>')
        . ib_row('Order reference', $ref !== '' ? esc_html($ref) : '-') . '</table>'
        . '<p style="margin-top:12px;padding:12px;background:#f5f5f5;white-space:pre-wrap">' . esc_html($msg) . '</p>';
    $sent = ib_send(ib_email(), 'Website message from ' . ib_header_name($name), $body, $email, $name);
    ib_log_update($log_id, array('mail_sent' => $sent ? 1 : 0, 'mail_error' => $sent ? '' : $GLOBALS['ib_mail_error']));
    return ib_reply(true, 'ok');
}

/* ---------------- Promo code check (never lists codes) ---------------- */
function ib_rest_promo(WP_REST_Request $req) {
    $d = $req->get_json_params();
    $key = 'ib_rlp_' . md5(ib_client_ip());
    $n = (int) get_transient($key);
    if ($n >= 30) return ib_reply(false, 'Too many tries. Please wait a few minutes.', 429);
    set_transient($key, $n + 1, 10 * MINUTE_IN_SECONDS);
    $code = ib_clean_line($d['code'] ?? '', 40);
    $cart = is_array($d['cart'] ?? null) ? $d['cart'] : array();
    // Price without the promo first, so a minimum-order message does not hide a bad code.
    $base = ib_price_cart($cart, '');
    $subtotal = 0;
    if (!empty($base['subtotal'])) $subtotal = $base['subtotal'];
    $c = ib_coupon_find($code);
    $err = ib_coupon_check($c, $subtotal);
    if ($err) return ib_reply(false, $err, 200);
    return ib_reply(true, 'Code applied.', 200, array('code' => $c->code, 'type' => $c->type, 'amount' => (float) $c->amount));
}
