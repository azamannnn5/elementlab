<?php
if (!defined('ABSPATH')) exit;

add_action('add_meta_boxes', function () {
    add_meta_box('ib_details', 'Storefront details', 'ib_metabox', 'product', 'normal', 'default');
});

function ib_metabox($post) {
    wp_nonce_field('ib_meta', 'ib_meta_nonce');
    $specs = get_post_meta($post->ID, '_ib_specs', true);
    $specs_txt = '';
    if (is_array($specs)) foreach ($specs as $r) if (is_array($r) && count($r) >= 2) $specs_txt .= $r[0] . ' | ' . $r[1] . "\n";
    $recs = get_post_meta($post->ID, '_ib_recs', true);
    $related = get_post_meta($post->ID, '_ib_related', true);
    $ibid = get_post_meta($post->ID, '_ib_id', true);
    echo '<p style="color:#666">Shown on the product page. Description goes in the main editor (one paragraph per blank line). Short description is the summary line. Peptides: add Single vial and 10-pack variations (attribute "Size").</p>';
    echo '<p><label><strong>Product ID (used in links)</strong><br><input type="text" class="widefat" name="ib_id" value="' . esc_attr($ibid) . '" placeholder="auto from name"></label></p>';
    echo '<p><label><strong>Details list</strong> (one per line, "Label | Value")<br><textarea class="widefat" rows="6" name="ib_specs">' . esc_textarea($specs_txt) . '</textarea></label></p>';
    echo '<p><label><strong>Form</strong><br><input type="text" class="widefat" name="ib_form" value="' . esc_attr(get_post_meta($post->ID, '_ib_form', true)) . '"></label></p>';
    echo '<p><label><strong>Strength</strong><br><input type="text" class="widefat" name="ib_strength" value="' . esc_attr(get_post_meta($post->ID, '_ib_strength', true)) . '"></label></p>';
    echo '<p><label><strong>Storage and handling notes</strong> (one per line)<br><textarea class="widefat" rows="4" name="ib_recs">' . esc_textarea(is_array($recs) ? implode("\n", $recs) : '') . '</textarea></label></p>';
    echo '<p><label><strong>Related product IDs</strong> (comma separated)<br><input type="text" class="widefat" name="ib_related" value="' . esc_attr(is_array($related) ? implode(', ', $related) : '') . '"></label></p>';
}

add_action('save_post_product', function ($post_id) {
    if (!isset($_POST['ib_meta_nonce']) || !wp_verify_nonce(sanitize_text_field(wp_unslash($_POST['ib_meta_nonce'])), 'ib_meta')) return;
    if (defined('DOING_AUTOSAVE') && DOING_AUTOSAVE) return;
    if (!current_user_can('edit_post', $post_id)) return;
    $g = function ($k) { return isset($_POST[$k]) ? wp_unslash($_POST[$k]) : ''; };
    $id = sanitize_title($g('ib_id'));
    if ($id === '') $id = get_post_field('post_name', $post_id);
    update_post_meta($post_id, '_ib_id', $id);
    $specs = array();
    foreach (preg_split('/\R/', (string) $g('ib_specs')) as $line) {
        $bits = array_map('trim', explode('|', $line, 2));
        if (count($bits) === 2 && $bits[0] !== '') $specs[] = array(sanitize_text_field($bits[0]), sanitize_text_field($bits[1]));
    }
    update_post_meta($post_id, '_ib_specs', $specs);
    update_post_meta($post_id, '_ib_form', sanitize_text_field($g('ib_form')));
    update_post_meta($post_id, '_ib_strength', sanitize_text_field($g('ib_strength')));
    $recs = array_values(array_filter(array_map('sanitize_text_field', preg_split('/\R/', (string) $g('ib_recs')))));
    update_post_meta($post_id, '_ib_recs', $recs);
    $rel = array_values(array_filter(array_map('sanitize_title', explode(',', (string) $g('ib_related')))));
    update_post_meta($post_id, '_ib_related', $rel);
});
