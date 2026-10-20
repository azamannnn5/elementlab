<?php
if (!defined('ABSPATH')) exit;

add_action('admin_init', function () {
    foreach (array('ib_email', 'ib_phone', 'ib_smtp_host', 'ib_smtp_user', 'ib_min_order') as $k) register_setting('ib_settings', $k, array('sanitize_callback' => 'sanitize_text_field'));
    register_setting('ib_settings', 'ib_smtp_port', array('sanitize_callback' => 'absint'));
    register_setting('ib_settings', 'ib_smtp_pass', array('sanitize_callback' => function ($v) {
        $v = (string) $v;
        return $v === '' ? (string) get_option('ib_smtp_pass', '') : $v;
    }));
});

add_action('admin_menu', function () {
    add_menu_page('Imperial Blowork', 'Imperial Blowork', 'manage_options', 'imperial-blowork', 'ib_admin_page', 'dashicons-store', 56);
});

function ib_admin_page() {
    global $wpdb;
    $rows = $wpdb->get_results('SELECT id,type,mail_sent,mail_error,order_id,created FROM ' . ib_table() . ' ORDER BY id DESC LIMIT 10');
    $nonce = wp_create_nonce('ib_admin');
    ?>
    <div class="wrap">
      <h1>Imperial Blowork</h1>
      <form method="post" action="options.php">
        <?php settings_fields('ib_settings'); ?>
        <h2>Contact and email</h2>
        <table class="form-table" role="presentation">
          <tr><th>Email (receives carts and messages)</th><td><input class="regular-text" type="email" name="ib_email" value="<?php echo esc_attr(ib_email()); ?>"></td></tr>
          <tr><th>Phone (shown on the site only when filled in)</th><td><input class="regular-text" type="text" name="ib_phone" value="<?php echo esc_attr(get_option('ib_phone', '')); ?>"></td></tr>
          <tr><th>Minimum order (USD)</th><td><input class="small-text" type="number" min="1" name="ib_min_order" value="<?php echo esc_attr(ib_num(ib_min_order())); ?>"></td></tr>
          <tr><th>SMTP host</th><td><input class="regular-text" type="text" name="ib_smtp_host" value="<?php echo esc_attr(get_option('ib_smtp_host', 'smtp.hostinger.com')); ?>"></td></tr>
          <tr><th>SMTP port</th><td><input class="small-text" type="number" name="ib_smtp_port" value="<?php echo esc_attr(get_option('ib_smtp_port', 465)); ?>"> <span class="description">465 (SSL) or 587 (TLS)</span></td></tr>
          <tr><th>SMTP user</th><td><input class="regular-text" type="text" name="ib_smtp_user" value="<?php echo esc_attr(get_option('ib_smtp_user', '')); ?>" placeholder="<?php echo esc_attr(ib_email()); ?>"></td></tr>
          <tr><th>SMTP password</th><td><input class="regular-text" type="password" name="ib_smtp_pass" value="" autocomplete="new-password" placeholder="<?php echo get_option('ib_smtp_pass', '') !== '' ? 'saved (leave blank to keep)' : 'mailbox password'; ?>"></td></tr>
        </table>
        <?php submit_button('Save'); ?>
      </form>
      <hr>
      <h2>Setup and import</h2>
      <p><button class="button" id="ib-setup">Run setup</button> <button class="button button-primary" id="ib-import">Import products</button></p>
      <pre id="ib-log" style="background:#fff;padding:10px;max-height:260px;overflow:auto;border:1px solid #ccd0d4"></pre>
      <hr>
      <h2>Latest carts and messages</h2>
      <table class="widefat striped"><thead><tr><th>ID</th><th>Type</th><th>Order</th><th>Email sent</th><th>Error</th><th>Time (UTC)</th></tr></thead><tbody>
      <?php foreach ($rows as $r) : ?>
        <tr><td><?php echo (int) $r->id; ?></td><td><?php echo esc_html($r->type); ?></td><td><?php echo $r->order_id ? '#' . (int) $r->order_id : '-'; ?></td><td><?php echo $r->mail_sent ? 'yes' : 'NO'; ?></td><td><?php echo esc_html($r->mail_error); ?></td><td><?php echo esc_html($r->created); ?></td></tr>
      <?php endforeach; if (!$rows) echo '<tr><td colspan="6">Nothing yet.</td></tr>'; ?>
      </tbody></table>
    </div>
    <script>
    (function(){
      var nonce = <?php echo wp_json_encode($nonce); ?>, log = document.getElementById('ib-log');
      function post(data){ var b = new URLSearchParams(data); b.append('nonce', nonce); return fetch(ajaxurl, {method:'POST', credentials:'same-origin', headers:{'Content-Type':'application/x-www-form-urlencoded'}, body:b.toString()}).then(function(r){return r.json();}); }
      function say(t){ log.textContent += t + "\n"; log.scrollTop = log.scrollHeight; }
      document.getElementById('ib-setup').onclick = function(){ post({action:'ib_setup'}).then(function(r){ say(JSON.stringify(r)); }); };
      document.getElementById('ib-import').onclick = function(){
        var run = function(off){ post({action:'ib_import', offset:off}).then(function(r){
          if(!r.success){ say('ERROR ' + JSON.stringify(r)); return; }
          say(r.data.log.join(', '));
          if(r.data.done){ say('IMPORT DONE ' + r.data.total); } else { run(r.data.next); }
        }).catch(function(e){ say('ERROR ' + e); }); };
        run(0);
      };
    })();
    </script>
    <?php
}
