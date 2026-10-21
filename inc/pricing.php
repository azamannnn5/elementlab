<?php
if (!defined('ABSPATH')) exit;

/* One place that prices a cart: used by checkout and the promo check. Never trust totals from the browser. */

function ib_coupon_find($code) {
    global $wpdb;
    $code = strtoupper(trim((string) $code));
    if ($code === '') return null;
    return $wpdb->get_row($wpdb->prepare('SELECT * FROM ' . $wpdb->prefix . 'ib_coupons WHERE code = %s', $code));
}

function ib_coupon_check($c, $subtotal) {
    if (!$c || !$c->active) return 'That code is not valid.';
    $today = current_time('Y-m-d');
    if ($c->starts && $today < $c->starts) return 'That code is not active yet.';
    if ($c->ends && $today > $c->ends) return 'That code has expired.';
    if ((int) $c->max_uses > 0 && (int) $c->used >= (int) $c->max_uses) return 'That code has been fully used.';
    if ((float) $c->min_order > 0 && $subtotal < (float) $c->min_order) return 'That code needs a cart of at least ' . ib_money($c->min_order) . '.';
    return '';
}

function ib_tier_pct($steps, $qty) {
    $pct = 0;
    foreach ((array) $steps as $s) if ($qty >= (int) $s['min']) $pct = (float) $s['pct'];
    return $pct;
}

/** $in: cart lines [{id,opt,qty}], $promo: code or ''. Returns array(ok, error, lines, subtotal, discount, shipping, total, count, promo). */
function ib_price_cart($in, $promo = '') {
    $cat = ib_catalog_by_id();
    $set = ib_cms_settings();
    $site_steps = !empty($set['discounts']['on']) ? $set['discounts']['steps'] : array();
    $max_global = max(1, (int) $set['shop']['max_qty']);
    $lines = array(); $subtotal = 0.0; $count = 0;
    foreach (array_slice((array) $in, 0, 60) as $l) {
        if (!is_array($l)) continue;
        $id = (string) ($l['id'] ?? '');
        if (!isset($cat[$id])) continue;
        $p = $cat[$id];
        $opt = (($l['opt'] ?? '') === 'kit' && isset($p['kit'])) ? 'kit' : 'single';
        $max = isset($p['max']) ? (int) $p['max'] : $max_global;
        $qty = max(1, min($max, 99, (int) ($l['qty'] ?? 1)));
        if (isset($p['stock']) && empty($p['stock'][$opt])) {
            return array('ok' => false, 'error' => $p['name'] . ' is out of stock. Please remove it from your cart.');
        }
        $base = $opt === 'kit' ? (float) $p['kit'] : (float) $p['price'];
        $steps = isset($p['disc']) ? ($p['disc'] === 'none' ? array() : $p['disc']) : $site_steps;
        $pct = ib_tier_pct($steps, $qty);
        $unit = round($base * (1 - $pct / 100), 2);
        $wc_id = $opt === 'kit' ? (int) $p['_kit_id'] : (int) $p['_single_id'];
        $lines[] = array('id' => $id, 'name' => $p['name'], 'opt' => $opt, 'qty' => $qty, 'base' => $base, 'pct' => $pct, 'unit' => $unit, 'total' => round($unit * $qty, 2), 'wc_id' => $wc_id);
        $subtotal += $unit * $qty; $count += $qty;
    }
    $subtotal = round($subtotal, 2);
    if (!$lines) return array('ok' => false, 'error' => 'Your cart is empty.');
    $res = array('ok' => true, 'error' => '', 'lines' => $lines, 'subtotal' => $subtotal, 'count' => $count, 'discount' => 0.0, 'shipping' => 0.0, 'promo' => null, 'free_shipping' => false);
    $min = ib_min_order();
    if ($subtotal < $min) return array('ok' => false, 'error' => 'Minimum order is ' . ib_money($min) . '. Add ' . ib_money($min - $subtotal) . ' more to check out.');
    if ($promo !== '') {
        $c = ib_coupon_find($promo);
        $err = ib_coupon_check($c, $subtotal);
        if ($err) return array('ok' => false, 'error' => $err, 'promo_error' => true);
        if ($c->type === 'percent') $res['discount'] = round($subtotal * min(100, (float) $c->amount) / 100, 2);
        elseif ($c->type === 'fixed') $res['discount'] = min($subtotal, round((float) $c->amount, 2));
        else $res['free_shipping'] = true;
        $res['promo'] = array('code' => $c->code, 'type' => $c->type, 'id' => (int) $c->id);
    }
    $fee = (float) $set['shipping']['fee'];
    $free_over = (float) $set['shipping']['free_over'];
    if ($fee > 0 && !$res['free_shipping'] && !($free_over > 0 && ($subtotal - $res['discount']) >= $free_over)) $res['shipping'] = $fee;
    $res['total'] = round($subtotal - $res['discount'] + $res['shipping'], 2);
    return $res;
}
