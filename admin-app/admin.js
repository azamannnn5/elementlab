/* Imperial Blowork admin panel. Plain JavaScript, no libraries. Talks to /?rest_route=/ib/v1/admin */
(function () {
  'use strict';
  const CFG = window.IB_ADMIN || {};
  const $ = (s, r) => (r || document).querySelector(s);
  const $$ = (s, r) => Array.from((r || document).querySelectorAll(s));
  const esc = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const money = (n) => '$' + Number(n || 0).toLocaleString('en-US', { maximumFractionDigits: 2 });
  const clone = (o) => JSON.parse(JSON.stringify(o));
  const same = (a, b) => JSON.stringify(a) === JSON.stringify(b);
  const strip = (h) => { const d = document.createElement('div'); d.innerHTML = h; return (d.textContent || '').replace(/\s+/g, ' ').trim(); };
  const app = $('#app');

  /* ---------- API ---------- */
  async function api(path, opt) {
    opt = opt || {};
    let url = CFG.api + '/' + path + (opt.query ? '&' + new URLSearchParams(opt.query).toString() : '');
    const init = { method: opt.method || (opt.body || opt.form ? 'POST' : 'GET'), credentials: 'same-origin', headers: { 'Accept': 'application/json' } };
    if (CFG.nonce) init.headers['X-WP-Nonce'] = CFG.nonce;
    if (opt.form) init.body = opt.form;
    else if (opt.body) { init.headers['Content-Type'] = 'application/json'; init.body = JSON.stringify(opt.body); }
    let res;
    try { res = await fetch(url, init); } catch (e) { throw new Error('No connection. Check your internet and try again.'); }
    let out = {};
    try { out = await res.json(); } catch (e) { /* not json */ }
    if (res.status === 401 || res.status === 403) {
      if (out && out.code === 'rest_cookie_invalid_nonce') throw new Error('Your session expired. Reload the page and sign in again.');
    }
    if (!res.ok || out.ok === false) throw new Error(out.message || ('Something went wrong (' + res.status + ').'));
    return out;
  }

  /* ---------- state ---------- */
  const S = { boot: null, st: { content: {}, settings: {}, products: {}, cats: {}, pages: {}, order: null, del: [] }, open: {}, focus: null, q: '', tmp: {} };
  let saving = false;
  const kindOf = {};
  function emptyStaged() { return { content: {}, settings: {}, products: {}, cats: {}, pages: {}, order: null, del: [] }; }

  /* ---------- helpers: values ---------- */
  const B = () => S.boot;
  const fieldByKey = (k) => (B().fields.find((f) => f.key === k) || null);
  function cval(f) {
    const k = f.key;
    if (k in S.st.content) return S.st.content[k] === null ? f.value : S.st.content[k];
    return (k in B().content) ? B().content[k] : f.value;
  }
  function cedited(f) { return cval(f) !== f.value; }
  function cstaged(f) { return f.key in S.st.content; }
  function setContent(f, v) {
    const saved = (f.key in B().content);
    if (v === f.value && !saved) delete S.st.content[f.key]; else S.st.content[f.key] = v;
    bar();
  }
  function resetContent(f) {
    if (f.key in B().content) S.st.content[f.key] = null; else delete S.st.content[f.key];
    bar();
  }
  function sget(g) { return S.st.settings[g] ? S.st.settings[g] : B().settings[g]; }
  function sset(g, k, v) {
    if (!S.st.settings[g]) S.st.settings[g] = clone(B().settings[g]);
    S.st.settings[g][k] = v;
    if (same(S.st.settings[g], B().settings[g])) delete S.st.settings[g];
    bar();
  }
  function sreplace(g, obj) { S.st.settings[g] = obj; if (same(obj, B().settings[g])) delete S.st.settings[g]; bar(); }
  function pget(p) { return Object.assign({}, p, S.st.products[p.pid] || {}); }
  function pset(pid, k, v) {
    const base = B().products.find((x) => String(x.pid) === String(pid)) || (S.st.products[pid] && S.st.products[pid].__new ? {} : null);
    if (!S.st.products[pid]) S.st.products[pid] = {};
    S.st.products[pid][k] = v;
    if (base && base.pid && same(v, base[k])) { delete S.st.products[pid][k]; if (!Object.keys(S.st.products[pid]).length) delete S.st.products[pid]; }
    bar();
  }
  function changeCount() {
    const s = S.st;
    return Object.keys(s.content).length + Object.keys(s.settings).length + Object.keys(s.products).length + Object.keys(s.cats).length + Object.keys(s.pages).length + (s.order ? 1 : 0) + s.del.length;
  }
  const can = (p) => (B().perms || []).indexOf(p) >= 0;

  /* ---------- tiny UI helpers ---------- */
  let toastT;
  function toast(msg, err) {
    $$('.toast').forEach((e) => e.remove());
    const t = document.createElement('div'); t.className = 'toast' + (err ? ' err' : ''); t.textContent = msg; document.body.appendChild(t);
    clearTimeout(toastT); toastT = setTimeout(() => t.remove(), err ? 6000 : 2600);
  }
  function modal(html, cls) {
    const bg = document.createElement('div'); bg.className = 'modal-bg';
    bg.innerHTML = '<div class="modal ' + (cls || '') + '" role="dialog" aria-modal="true">' + html + '</div>';
    document.body.appendChild(bg);
    const close = () => bg.remove();
    bg.addEventListener('click', (e) => { if (e.target === bg) close(); });
    return { el: bg, close };
  }
  function ask(msg, ok, danger) {
    return new Promise((res) => {
      const m = modal('<h2>Please confirm</h2><p>' + esc(msg) + '</p><div class="actions" style="justify-content:flex-end;margin-top:16px"><button class="btn ghost" data-x="0">Cancel</button><button class="btn ' + (danger ? 'danger' : '') + '" data-x="1">' + esc(ok || 'OK') + '</button></div>', 'sm');
      m.el.addEventListener('click', (e) => { const b = e.target.closest('[data-x]'); if (b) { m.close(); res(b.dataset.x === '1'); } });
    });
  }
  const note = (t, kind) => '<div class="note ' + (kind || '') + '">' + t + '</div>';
  const chip = (k, label) => '<span class="chip chip-' + k + '">' + esc(label) + '</span>';
  function pill(text, cls) { return '<span class="pill ' + (cls || '') + '">' + esc(text) + '</span>'; }
  function head(title, sub, actions) {
    return '<div class="page-head"><div><h1>' + esc(title) + '</h1>' + (sub ? '<p>' + sub + '</p>' : '') + '</div><div class="actions">' + (actions || '') + '</div></div>';
  }
  function locked(perm, what) {
    if (can(perm)) return '';
    return note('You can look at this screen, but your role cannot change ' + esc(what) + '. Ask the owner if you need access.', 'warn');
  }
  const dis = (perm) => (can(perm) ? '' : ' disabled');

  /* ---------- navigation ---------- */
  const NAV = [
    { g: 'Overview', items: [['', 'Dashboard', 'read']] },
    { g: 'Content', items: [['pages', 'Pages', 'content'], ['shared/header', 'Header and menu', 'content'], ['shared/footer', 'Footer and floating cart', 'content'], ['media', 'Images and files', 'media']] },
    { g: 'Shop', items: [['products', 'All products', 'products'], ['prices', 'Quick price and stock list', 'products'], ['collections', 'Collections', 'products'], ['page/product', 'Text shared by all product pages', 'content'], ['discounts', 'Quantity discounts', 'settings'], ['shipping', 'Shipping and cart rules', 'settings'], ['promo', 'Promo codes', 'promo']] },
    { g: 'Promotions', items: [['banner', 'Top banner', 'settings'], ['popup', 'Pop-up message', 'settings']] },
    { g: 'Customers', items: [['inbox', 'Inbox', 'inbox'], ['messages', 'Cart and form messages', 'settings']] },
    { g: 'Site', items: [['seo', 'Search and sharing', 'seo'], ['look', 'Look and feel', 'settings'], ['tracking', 'Tracking and code', 'settings'], ['redirects', 'Redirects', 'settings'], ['maintenance', 'Maintenance mode', 'settings'], ['contact', 'Contact details and email', 'settings']] },
    { g: 'Admin', items: [['history', 'Activity and undo', 'history'], ['backup', 'Backup and restore', 'backup'], ['team', 'Team', 'team'], ['help', 'Help and guide', 'read']] },
  ];
  const TITLES = {};
  NAV.forEach((g) => g.items.forEach((i) => { TITLES[i[0]] = i[1]; }));
  const PAGE_DEFS = [
    { file: 'index', name: 'Home', group: 'Main pages', live: '' },
    { file: 'products', name: 'Products page', group: 'Main pages', live: 'products.html' },
    { file: 'product', name: 'Product details page', group: 'Main pages', live: 'products.html' },
    { file: 'contact', name: 'Contact', group: 'Main pages', live: 'contact.html' },
    { file: 'help', name: 'Help Center', group: 'Main pages', live: 'help.html' },
    { file: 'terms', name: 'Terms of Service', group: 'Policies and legal', live: 'terms.html' },
    { file: 'privacy', name: 'Privacy Policy', group: 'Policies and legal', live: 'privacy.html' },
    { file: 'refunds', name: 'Refunds and Returns', group: 'Policies and legal', live: 'refunds.html' },
    { file: 'cart', name: 'Cart and checkout', group: 'Account and cart pages', live: 'cart.html' },
  ];
  const route = () => (location.hash || '#/').replace(/^#\/?/, '').replace(/\/$/, '');
  const go = (r) => { location.hash = '#/' + r; };

  /* ---------- sidebar + shell ---------- */
  function shell() {
    const nav = NAV.map((g) => '<div class="nav-group"><div class="nav-title">' + g.g + '</div><nav class="nav">' + g.items.map((i) => {
      const lock = can(i[2]) ? '' : '<span class="lock">view only</span>';
      const badge = i[0] === 'inbox' && B().counts.new_messages + B().counts.new_carts > 0 ? '<span class="badge">' + (B().counts.new_messages + B().counts.new_carts) + '</span>' : '';
      return '<a href="#/' + i[0] + '" data-r="' + i[0] + '">' + esc(i[1]) + lock + badge + '</a>';
    }).join('') + '</nav></div>').join('');
    app.innerHTML = '<div class="shell"><aside class="side" id="side"><div class="brand"><i></i>Imperial Blowork</div>' + nav + '</aside>'
      + '<div class="main"><div class="top"><button class="menu-btn" id="menu-btn" aria-label="Open menu">Menu</button><div class="crumbs" id="crumbs"></div>'
      + '<div class="gsearch"><input id="gs" type="search" placeholder="Search everything" autocomplete="off" aria-label="Search everything"><kbd>/</kbd><div class="results" id="results" hidden></div></div>'
      + '<div class="userbox"><span>' + esc(B().user.name) + ' (' + esc(B().user.role) + ')</span><a class="btn ghost sm" href="' + esc(CFG.site) + '" target="_blank" rel="noopener">View site</a><button class="btn ghost sm" id="logout">Sign out</button></div></div>'
      + '<div class="page" id="view"></div></div></div><div class="savebar" id="savebar" hidden></div>';
  }
  function crumbs(parts) {
    $('#crumbs').innerHTML = parts.map((p, i) => (p[1] && i < parts.length - 1 ? '<a href="#/' + p[1] + '">' + esc(p[0]) + '</a>' : (i === parts.length - 1 ? '<b>' + esc(p[0]) + '</b>' : esc(p[0])))).join(' / ');
  }
  function bar() {
    const n = changeCount(), el = $('#savebar'); if (!el) return;
    el.hidden = n === 0;
    el.innerHTML = '<div class="txt">' + n + ' unsaved change' + (n === 1 ? '' : 's') + '<small>Nothing is live until you press Save.</small></div><button class="btn ghost" data-act="discard">Discard</button><button class="btn" data-act="save"' + (saving ? ' disabled' : '') + '>' + (saving ? 'Saving...' : 'Save and publish') + '</button>';
    $$('.field').forEach((el2) => { const k = el2.dataset.fkey; if (k) { const f = fieldByKey(k); if (f) el2.classList.toggle('edited', cedited(f)); } });
  }
  window.addEventListener('beforeunload', (e) => { if (changeCount() > 0) { e.preventDefault(); e.returnValue = ''; } });

  /* ---------- save ---------- */
  function buildChanges() {
    const ch = []; const s = S.st;
    Object.keys(s.content).forEach((k) => ch.push({ t: 'content', key: k, v: s.content[k] }));
    Object.keys(s.settings).forEach((g) => ch.push({ t: 'setting', group: g, data: s.settings[g] }));
    Object.keys(s.cats).forEach((id) => ch.push({ t: 'category', term_id: s.cats[id].term_id || 0, data: s.cats[id] }));
    Object.keys(s.pages).forEach((id) => ch.push({ t: 'page', id: Number(id), data: s.pages[id] }));
    Object.keys(s.products).forEach((pid) => { const d = Object.assign({}, s.products[pid]); const isNew = d.__new; delete d.__new; ch.push({ t: 'product', pid: isNew ? 0 : Number(pid), data: d }); });
    s.del.forEach((pid) => ch.push({ t: 'product_delete', pid }));
    if (s.order) ch.push({ t: 'order', ids: s.order });
    return ch;
  }
  async function save() {
    if (saving || !changeCount()) return;
    saving = true; bar();
    try {
      const out = await api('save', { body: { changes: buildChanges() } });
      S.st = emptyStaged();
      await load();
      toast(out.errors && out.errors.length ? 'Saved, with notes. See below.' : 'Saved. Your changes are live.');
      render();
      if (out.errors && out.errors.length) { const v = $('#view'); v.insertAdjacentHTML('afterbegin', '<div class="errlist"><b>Some changes were not saved:</b><br>' + out.errors.map(esc).join('<br>') + '</div>'); }
    } catch (e) { toast(e.message, true); }
    saving = false; bar();
  }
  async function discard() {
    if (!(await ask('Throw away all unsaved changes?', 'Discard', true))) return;
    S.st = emptyStaged(); render(); toast('Changes discarded.');
  }

  /* ---------- load ---------- */
  async function load() {
    const out = await api('bootstrap');
    S.boot = out;
    out.fields.forEach((f) => { kindOf[f.key] = f.kind; });
    return out;
  }

  /* ---------- login ---------- */
  function loginScreen(msg) {
    app.innerHTML = '<div class="login"><form class="login-card" id="lf"><h1>Imperial Blowork</h1><p class="muted">Sign in to edit your site.</p>'
      + (CFG.woo_ready === false ? note('WooCommerce is not active, so the shop screens will be empty.', 'warn') : '')
      + (msg ? '<div class="errlist" id="lerr">' + esc(msg) + '</div>' : '<div id="lerr" class="errlist" hidden></div>')
      + '<label>Username or email<input type="text" name="user" autocomplete="username" required></label>'
      + '<label>Password<input type="password" name="pass" autocomplete="current-password" required></label>'
      + '<button class="btn" type="submit">Sign in</button><p style="margin-top:14px"><a href="' + esc(CFG.lost) + '">Forgot password?</a></p></form></div>';
    $('#lf').addEventListener('submit', async (e) => {
      e.preventDefault(); const f = e.target; const btn = $('button', f); btn.disabled = true; btn.textContent = 'Signing in...';
      try {
        await api('login', { body: { user: f.user.value, pass: f.pass.value } });
        location.reload();
      } catch (er) { const box = $('#lerr'); box.hidden = false; box.textContent = er.message; btn.disabled = false; btn.textContent = 'Sign in'; }
    });
  }

  /* ---------- global search ---------- */
  const SETTING_INDEX = [];
  function buildSearchIndex() {
    const idx = [];
    NAV.forEach((g) => g.items.forEach((i) => idx.push({ grp: 'Screens', title: i[1], sub: g.g, to: i[0], text: i[1] + ' ' + g.g })));
    Object.keys(SCHEMA).forEach((gk) => {
      const sc = SCHEMA[gk];
      (sc.fields || []).forEach((f) => idx.push({ grp: 'Settings', title: f.label, sub: sc.title, to: sc.route, sfield: gk + '.' + f.k, text: f.label + ' ' + sc.title + ' ' + (f.help || '') }));
    });
    PAGE_DEFS.forEach((p) => idx.push({ grp: 'Pages', title: p.name, sub: p.group, to: 'page/' + p.file, text: p.name + ' ' + p.group }));
    B().products.forEach((p) => idx.push({ grp: 'Products', title: pget(p).name, sub: (pget(p).cat || '') + ' ' + money(pget(p).price), to: 'product/' + p.pid, text: [p.name, p.id, p.cat, p.short, p.form, p.strength].join(' ') }));
    B().coupons.forEach((c) => idx.push({ grp: 'Promo codes', title: c.code, sub: c.type + ' ' + c.amount, to: 'promo', text: c.code + ' ' + (c.note || '') }));
    B().fields.forEach((f) => {
      const where = f.page === 'shared' ? (f.section === 'shared.header' ? 'shared/header' : f.section === 'shared.menu' ? 'shared/header' : 'shared/footer') : 'page/' + f.page;
      idx.push({ grp: 'Text, links and images', title: f.label, sub: (f.page === 'shared' ? 'Shared' : (PAGE_DEFS.find((p) => p.file === f.page) || {}).name) + ' / ' + f.section_label, to: where, ckey: f.key, text: f.label + ' ' + strip(String(cval(f))) + ' ' + f.value });
    });
    return idx;
  }
  let SIDX = null, resSel = -1, resList = [];
  function runSearch(q) {
    const box = $('#results'); q = q.trim().toLowerCase();
    if (!q) { box.hidden = true; return; }
    if (!SIDX) SIDX = buildSearchIndex();
    const terms = q.split(/\s+/);
    const hits = SIDX.filter((e) => { const t = e.text.toLowerCase(); return terms.every((w) => t.indexOf(w) >= 0); });
    const groups = {};
    hits.slice(0, 80).forEach((h) => { (groups[h.grp] = groups[h.grp] || []).push(h); });
    resList = []; let html = '';
    Object.keys(groups).forEach((g) => {
      html += '<div class="res-group"><div class="res-title">' + esc(g) + '</div>';
      groups[g].slice(0, 8).forEach((h) => { resList.push(h); html += '<a class="res" data-i="' + (resList.length - 1) + '"><b>' + esc(String(h.title).slice(0, 70)) + '</b><small>' + esc(h.sub || '') + '</small></a>'; });
      html += '</div>';
    });
    box.innerHTML = html || '<div class="res muted">Nothing found. Try a different word.</div>';
    box.hidden = false; resSel = -1;
  }
  function openResult(h) {
    $('#results').hidden = true; $('#gs').value = '';
    S.focus = h.ckey ? { ckey: h.ckey } : (h.sfield ? { sfield: h.sfield } : null);
    if (route() === h.to) render(); else go(h.to);
  }
  function applyFocus() {
    const f = S.focus; if (!f) return; S.focus = null;
    setTimeout(() => {
      let el = f.ckey ? $('[data-fkey="' + f.ckey.replace(/"/g, '') + '"]') : $('[data-fs="' + f.sfield + '"]');
      if (!el) return;
      const d = el.closest('details'); if (d) d.open = true;
      el.scrollIntoView({ block: 'center' }); el.classList.add('hl');
      const inp = $('input,textarea,[contenteditable]', el); if (inp) inp.focus({ preventScroll: true });
    }, 60);
  }

  /* ---------- settings schema (what each settings screen shows) ---------- */
  const SCHEMA = {
    banner: { title: 'Top banner', route: 'banner', fields: [
      { k: 'on', t: 'bool', label: 'Show the top banner', help: 'A thin bar across the top of every page.' },
      { k: 'text', t: 'rich', label: 'Banner text' },
      { k: 'link', t: 'url', label: 'Banner link (optional)', help: 'Where the banner goes when clicked. Example: products.html' },
      { k: 'bg', t: 'color', label: 'Banner colour' }, { k: 'color', t: 'color', label: 'Banner text colour' }] },
    popup: { title: 'Pop-up message', route: 'popup', fields: [
      { k: 'on', t: 'bool', label: 'Show the pop-up' },
      { k: 'title', t: 'text', label: 'Pop-up title' }, { k: 'text', t: 'rich', label: 'Pop-up text' },
      { k: 'image', t: 'image', label: 'Pop-up picture (optional)' },
      { k: 'btn_text', t: 'text', label: 'Button text (optional)' }, { k: 'btn_link', t: 'url', label: 'Button link' },
      { k: 'delay', t: 'int', label: 'Show after (seconds)', help: 'How long a visitor waits before it appears.' },
      { k: 'repeat_days', t: 'int', label: 'Show again after (days)', help: 'Use 0 to show once per visit.' },
      { k: 'pages', t: 'text', label: 'Pages', help: 'Type all, or page names separated by commas: home, products, product, cart, contact, help.' }] },
    shipping: { title: 'Shipping fee', route: 'shipping', fields: [
      { k: 'fee', t: 'money', label: 'Shipping fee (USD)', help: 'Added to every cart. Use 0 for no fee. The cart shows it as a separate line.' },
      { k: 'free_over', t: 'money', label: 'Free shipping over (USD)', help: 'Carts at or above this amount pay no fee. Use 0 to turn this off.' },
      { k: 'label', t: 'text', label: 'Name shown for the fee' }] },
    shop: { title: 'Cart limits', route: 'shipping', fields: [
      { k: 'min_order', t: 'money', label: 'Minimum order (USD)', help: 'Carts below this cannot be sent. The text on the site updates too.' },
      { k: 'max_qty', t: 'int', label: 'Most of one item per cart', help: 'A product can set its own lower limit.' }] },
    discounts: { title: 'Quantity discounts', route: 'discounts', fields: [{ k: 'on', t: 'bool', label: 'Turn on quantity discounts for all products' }] },
    seo: { title: 'Search and sharing', route: 'seo', fields: [
      { k: 'site_name', t: 'text', label: 'Site name' },
      { k: 'description', t: 'textarea', label: 'Home page description', help: 'Shown by search engines under the page title. About 150 characters.' },
      { k: 'share_image', t: 'image', label: 'Sharing picture', help: 'Shown when the site is shared in chats and social media.' },
      { k: 'favicon', t: 'image', label: 'Favicon (small browser icon)' },
      { k: 'noindex', t: 'bool', label: 'Hide the whole site from search engines', help: 'Turn this on while testing. Turn it off before launch.' }] },
    look: { title: 'Look and feel', route: 'look', fields: [
      { k: 'c_red', t: 'color', label: 'Accent colour' }, { k: 'c_red_d', t: 'color', label: 'Accent colour (darker)' },
      { k: 'c_bg', t: 'color', label: 'Page background' }, { k: 'c_panel', t: 'color', label: 'Panel background' },
      { k: 'c_silver', t: 'color', label: 'Body text colour' }, { k: 'c_white', t: 'color', label: 'Heading colour' },
      { k: 'font_head', t: 'font', label: 'Heading font' }, { k: 'font_body', t: 'font', label: 'Body font' },
      { k: 'custom_css', t: 'css', label: 'Custom CSS', help: 'For designers. Added at the end of every page.', perm: 'code_css' }] },
    tracking: { title: 'Tracking and code', route: 'tracking', fields: [
      { k: 'ga_id', t: 'text', label: 'Google Analytics ID', help: 'Looks like G-XXXXXXXXXX.' },
      { k: 'pixel_id', t: 'text', label: 'Meta (Facebook) Pixel ID', help: 'Numbers only.' },
      { k: 'head_code', t: 'code', label: 'Custom code for the top of every page', help: 'Owner only. Wrong code can break the site.', perm: 'code_js' },
      { k: 'body_code', t: 'code', label: 'Custom code for the bottom of every page', help: 'Owner only.', perm: 'code_js' }] },
    maintenance: { title: 'Maintenance mode', route: 'maintenance', fields: [
      { k: 'on', t: 'bool', label: 'Turn on maintenance mode', help: 'Visitors see a message. You stay signed in and can still see the site.' },
      { k: 'title', t: 'text', label: 'Title' }, { k: 'message', t: 'rich', label: 'Message' },
      { k: 'bypass', t: 'text', label: 'Preview key (optional)', help: 'Anyone who opens the site address followed by ?preview=KEY can see the real site.' }] },
    messages: { title: 'Cart and form messages', route: 'messages', fields: [
      { k: 'checkout_ok', t: 'textarea', label: 'After a cart is sent' }, { k: 'checkout_err', t: 'textarea', label: 'When a cart could not be sent' },
      { k: 'empty_cart', t: 'text', label: 'When the cart is empty' }, { k: 'contact_ok', t: 'text', label: 'After a contact message is sent' },
      { k: 'contact_err', t: 'text', label: 'When a contact message could not be sent' },
      { k: 'added_toast', t: 'text', label: 'Small notice after adding to cart', help: 'Use {name} where the product name goes.' },
      { k: 'add_btn', t: 'text', label: 'Add to cart button text' },
      { k: 'min_note', t: 'text', label: 'Minimum order notice', help: 'Use {min} and {more} for the amounts.' },
      { k: 'out_of_stock', t: 'text', label: 'Out of stock label' }] },
    contact: { title: 'Contact details and email', route: 'contact', fields: [
      { k: 'email', t: 'text', label: 'Email address', help: 'Shown on the site. Carts and messages are sent here.' },
      { k: 'phone', t: 'text', label: 'Phone number', help: 'Shown on the site only when filled in.' },
      { k: 'smtp_host', t: 'text', label: 'Mail server (SMTP host)', perm: 'code_js' }, { k: 'smtp_port', t: 'int', label: 'Mail server port', help: '465 or 587.', perm: 'code_js' },
      { k: 'smtp_user', t: 'text', label: 'Mail login', help: 'Usually the same as the email address.', perm: 'code_js' },
      { k: 'smtp_pass', t: 'secret', label: 'Mail password', help: 'The password of the mailbox info@imperialblowork.com (the one you use to open that inbox in Hostinger Email). Saved privately, never shown again.', perm: 'code_js' }] },
  };

  /* ---------- rich text editor ---------- */
  function normRich(h) {
    return h.replace(/<(div|p)[^>]*>/gi, '<br>').replace(/<\/(div|p)>/gi, '').replace(/^(<br>)+/i, '').replace(/ style="[^"]*"/g, '').replace(/&nbsp;/g, ' ').replace(/<span>([^<]*)<\/span>/g, '$1');
  }
  function rte(attrs, html) {
    return '<div class="rte" ' + attrs + '><div class="rte-bar"><button type="button" data-rte="bold" title="Bold"><b>B</b></button><button type="button" data-rte="italic" title="Italic"><i>I</i></button>'
      + '<button type="button" data-rte="link">Link</button><button type="button" data-rte="unlink">Remove link</button><button type="button" data-rte="clear">Clear style</button><button type="button" data-rte="html">HTML</button>'
      + '<span class="url" hidden><input type="text" placeholder="https://... or page.html"><button type="button" data-rte="apply">Apply</button></span></div>'
      + '<div class="rte-body" contenteditable="true" spellcheck="true">' + html + '</div><textarea class="rte-html" hidden spellcheck="false"></textarea></div>';
  }
  let savedRange = null;
  function commitRte(w, val) {
    const d = w.dataset;
    if (d.ckey) setContent(fieldByKey(d.ckey), val);
    else if (d.sg) sset(d.sg, d.sk, val);
    else if (d.pg) { const pg = B().legal.find((x) => String(x.id) === d.pg); S.st.pages[d.pg] = Object.assign({ title: pg.title, content: pg.content }, S.st.pages[d.pg] || {}, { content: val }); if (same(S.st.pages[d.pg], { title: pg.title, content: pg.content })) delete S.st.pages[d.pg]; bar(); }
  }
  function rteAction(btn) {
    const w = btn.closest('.rte'), body = $('.rte-body', w), ta = $('.rte-html', w), url = $('.url', w);
    const a = btn.dataset.rte;
    if (a === 'html') {
      const to = ta.hidden; // switching to html view
      if (to) { ta.value = normRich(body.innerHTML); ta.hidden = false; body.hidden = true; btn.classList.add('on'); }
      else { body.innerHTML = ta.value; ta.hidden = true; body.hidden = false; btn.classList.remove('on'); }
      return;
    }
    body.focus();
    if (a === 'bold') document.execCommand('bold');
    else if (a === 'italic') document.execCommand('italic');
    else if (a === 'unlink') document.execCommand('unlink');
    else if (a === 'clear') { document.execCommand('removeFormat'); document.execCommand('unlink'); }
    else if (a === 'link') {
      const sel = window.getSelection(); savedRange = sel.rangeCount ? sel.getRangeAt(0).cloneRange() : null;
      url.hidden = !url.hidden; if (!url.hidden) $('input', url).focus(); return;
    } else if (a === 'apply') {
      const v = $('input', url).value.trim();
      if (savedRange) { const sel = window.getSelection(); sel.removeAllRanges(); sel.addRange(savedRange); }
      if (v) document.execCommand('createLink', false, v);
      url.hidden = true; $('input', url).value = '';
    }
    commitRte(w, normRich(body.innerHTML));
  }

  /* ---------- image picker (media modal) ---------- */
  function imgPick(attrs, url) {
    return '<div class="imgpick" ' + attrs + '>' + (url ? '<img class="thumb" src="' + esc(url) + '" alt="">' : '<div class="thumb empty">No image</div>')
      + '<div class="col"><input type="text" data-imgurl value="' + esc(url) + '" placeholder="Choose an image or paste an address"><div class="row"><button type="button" class="btn ghost sm" data-act="pick-img">Choose image</button><button type="button" class="btn ghost sm" data-act="clear-img">Remove</button></div></div></div>';
  }
  function commitImg(w, url) {
    const d = w.dataset;
    if (d.ckey) setContent(fieldByKey(d.ckey), url);
    else if (d.sg) sset(d.sg, d.sk, url);
    else if (d.pf) pset(d.pid, 'img', url);
    const th = $('.thumb', w), inp = $('[data-imgurl]', w);
    if (inp && inp.value !== url) inp.value = url;
    if (th) { if (th.tagName === 'IMG') th.src = url || ''; else if (url) th.outerHTML = '<img class="thumb" src="' + esc(url) + '" alt="">'; }
  }
  function pickImage() {
    return new Promise((resolve) => {
      let tab = 'up', page = 1, term = '', done = false;
      const m = modal('<h2>Choose an image</h2><div class="tabs"><button class="on" data-t="up">Uploads</button><button data-t="site">Already on the site</button></div><div id="pk-body"><p class="muted">Loading...</p></div>');
      const finish = (u) => { if (done) return; done = true; m.close(); resolve(u); };
      m.el.addEventListener('click', (e) => { if (e.target === m.el) finish(null); });
      async function draw() {
        const body = $('#pk-body', m.el);
        if (tab === 'site') {
          body.innerHTML = '<div class="mgrid">' + B().site_images.map((i) => '<div class="mitem pick" data-url="' + esc(i.url) + '"><img src="' + esc(i.url) + '" alt=""><div class="meta">' + esc(i.name) + '</div></div>').join('') + '</div>';
          return;
        }
        body.innerHTML = '<div class="toolbar"><input type="search" id="pk-s" placeholder="Search uploads" value="' + esc(term) + '"><label class="btn sm">Upload new image<input type="file" id="pk-f" accept="image/jpeg,image/png,image/gif,image/webp" hidden></label></div><div id="pk-grid"><p class="muted">Loading...</p></div>';
        try {
          const out = await api('media', { query: { page, s: term } });
          $('#pk-grid', m.el).innerHTML = out.items.length ? '<div class="mgrid">' + out.items.map((i) => '<div class="mitem pick" data-url="' + esc(i.url) + '"><img src="' + esc(i.thumb) + '" alt=""><div class="meta">' + esc(i.name) + '</div></div>').join('') + '</div>' : '<p class="muted">No images yet. Upload one.</p>';
        } catch (er) { $('#pk-grid', m.el).innerHTML = '<p class="muted">' + esc(er.message) + '</p>'; }
      }
      m.el.addEventListener('click', (e) => {
        const t = e.target.closest('[data-t]'); if (t) { tab = t.dataset.t; $$('.tabs button', m.el).forEach((b) => b.classList.toggle('on', b === t)); draw(); return; }
        const it = e.target.closest('.mitem.pick'); if (it) finish(it.dataset.url);
      });
      m.el.addEventListener('input', (e) => { if (e.target.id === 'pk-s') { term = e.target.value; clearTimeout(pickImage.t); pickImage.t = setTimeout(draw, 300); } });
      m.el.addEventListener('change', async (e) => {
        if (e.target.id !== 'pk-f' || !e.target.files[0]) return;
        const fd = new FormData(); fd.append('file', e.target.files[0]);
        try { const out = await api('media/upload', { form: fd }); toast('Image uploaded.'); finish(out.url); } catch (er) { toast(er.message, true); }
      });
      draw();
    });
  }

  /* ---------- content field renderer ---------- */
  const KIND_CHIP = { text: ['text', 'Text'], rich: ['text', 'Text'], lead: ['text', 'Text'], alt: ['text', 'Image description'], link: ['link', 'Link'], image: ['image', 'Image'] };
  function cfield(f) {
    const v = cval(f), a = 'data-ckey="' + esc(f.key) + '"'; let input;
    if (f.kind === 'rich') input = rte(a, v);
    else if (f.kind === 'image') input = imgPick(a, v);
    else if ((f.kind === 'text' || f.kind === 'lead' || f.kind === 'alt') && (String(f.value).length > 80 || /\n/.test(f.value))) input = '<textarea ' + a + ' rows="3" placeholder="' + esc(f.value) + '">' + esc(v) + '</textarea>';
    else input = '<input type="text" ' + a + ' value="' + esc(v) + '" placeholder="' + esc(f.value) + '">';
    const kc = KIND_CHIP[f.kind] || ['text', 'Text'];
    const orig = f.kind === 'rich' ? strip(f.value) : f.value;
    return '<div class="field' + (cedited(f) ? ' edited' : '') + '" data-fkey="' + esc(f.key) + '" data-search="' + esc((f.label + ' ' + orig).toLowerCase()) + '"><div class="f-head">' + chip(kc[0], kc[1]) + '<span class="f-label">' + esc(f.label) + '</span><button type="button" class="link f-reset" data-act="reset-field" data-key="' + esc(f.key) + '">Reset to original</button></div>'
      + (f.kind === 'link' ? '<div class="help">Use a page like products.html, a section like index.html#care, or a full address starting with https://</div>' : '') + input
      + '<div class="orig">Original: ' + esc(String(orig).slice(0, 160)) + '</div></div>';
  }

  /* ---------- settings field renderer ---------- */
  function sfield(gk, f) {
    const cur = sget(gk)[f.k]; const a = 'data-sg="' + gk + '" data-sk="' + f.k + '"'; let input = '';
    const locked_ = f.perm && !can(f.perm);
    const ro = locked_ ? ' disabled' : '';
    switch (f.t) {
      case 'bool': input = '<label class="checkline"><input type="checkbox" ' + a + (cur ? ' checked' : '') + ro + '> ' + esc(f.label) + '</label>'; break;
      case 'rich': input = rte(a, cur || ''); break;
      case 'image': input = imgPick(a, cur || ''); break;
      case 'color': input = '<div class="color"><input type="color" ' + a + ' value="' + esc(/^#[0-9a-f]{6}$/i.test(cur) ? cur : '#000000') + '"' + ro + '><input type="text" data-hex ' + a + ' value="' + esc(cur) + '"' + ro + '></div>'; break;
      case 'font': input = '<select ' + a + ro + '>' + B().fonts.map((x) => '<option' + (x === cur ? ' selected' : '') + '>' + esc(x) + '</option>').join('') + '</select>'; break;
      case 'textarea': input = '<textarea ' + a + ro + ' rows="3">' + esc(cur) + '</textarea>'; break;
      case 'css': case 'code': input = '<textarea class="code" ' + a + ro + ' spellcheck="false">' + esc(cur) + '</textarea>'; break;
      case 'int': case 'money': input = '<input type="number" min="0" step="' + (f.t === 'money' ? '0.01' : '1') + '" ' + a + ro + ' value="' + esc(cur) + '">'; break;
      case 'secret': input = '<input type="password" autocomplete="new-password" ' + a + ro + ' value="" placeholder="' + (sget(gk).smtp_pass_set ? 'Saved. Type to replace it.' : 'Type the mailbox password') + '">'; break;
      default: input = '<input type="text" ' + a + ro + ' value="' + esc(cur) + '">';
    }
    const kind = f.t === 'code' || f.t === 'css' ? ['code', 'Code'] : (f.t === 'image' ? ['image', 'Image'] : (f.t === 'money' ? ['price', 'Price'] : ['setting', 'Setting']));
    const def = B().defaults[gk] ? B().defaults[gk][f.k] : null;
    const edited = !same(cur, def) && f.t !== 'secret';
    return '<div class="field' + (edited ? ' edited' : '') + '" data-fs="' + gk + '.' + f.k + '" data-search="' + esc((f.label + ' ' + (f.help || '')).toLowerCase()) + '"><div class="f-head">' + chip(kind[0], kind[1]) + (f.t === 'bool' ? '' : '<span class="f-label">' + esc(f.label) + '</span>')
      + (locked_ ? '<span class="pill warn">owner only</span>' : '') + '</div>' + (f.help ? '<div class="help">' + esc(f.help) + '</div>' : '') + input
      + (f.t !== 'bool' && f.t !== 'secret' && def !== null && def !== '' && edited ? '<div class="orig">Original: ' + esc(typeof def === 'object' ? '' : String(def)) + ' <button type="button" class="link" data-act="reset-setting" data-g="' + gk + '" data-k="' + f.k + '">Reset to original</button></div>' : '') + '</div>';
  }
  function settingsCard(gk, only) {
    const sc = SCHEMA[gk];
    return '<div class="card">' + (sc.fields.filter((f) => !only || only.indexOf(f.k) >= 0).map((f) => sfield(gk, f)).join('')) + '</div>';
  }

  /* ================= VIEWS ================= */
  const V = {};
  const VIEW = () => $('#view');

  /* ---------- dashboard ---------- */
  V.dash = () => {
    crumbs([['Dashboard']]);
    const s = B().settings, c = B().counts, pr = B().products;
    const hidden = pr.filter((p) => pget(p).hidden).length;
    const act = B().coupons.filter((x) => x.active).length;
    const st = (label, on, to, extra) => '<a class="li click" href="#/' + to + '" style="text-decoration:none;color:inherit"><div class="grow"><b>' + esc(label) + '</b>' + (extra ? '<small>' + esc(extra) + '</small>' : '') + '</div>' + pill(on ? 'On' : 'Off', on ? 'on' : 'off') + '</a>';
    return head('Dashboard', 'A quick look at your site. Everything you change here goes live the moment you press Save.')
      + '<div class="grid g4" style="margin-bottom:16px"><div class="stat"><b>' + (pr.length - hidden) + '</b><span>Products showing' + (hidden ? ' (' + hidden + ' hidden)' : '') + '</span></div>'
      + '<div class="stat"><b>' + c.new_carts + '</b><span>New carts sent</span></div><div class="stat"><b>' + c.new_messages + '</b><span>New messages</span></div><div class="stat"><b>' + act + '</b><span>Active promo codes</span></div></div>'
      + '<div class="grid g2"><div><div class="group-title">Site status</div><div class="list">'
      + st('Top banner', s.banner.on, 'banner') + st('Pop-up', s.popup.on, 'popup') + st('Maintenance mode', s.maintenance.on, 'maintenance', s.maintenance.on ? 'Visitors see the maintenance message' : '')
      + st('Quantity discounts', s.discounts.on, 'discounts') + st('Shipping fee', Number(s.shipping.fee) > 0, 'shipping', Number(s.shipping.fee) > 0 ? money(s.shipping.fee) : '')
      + st('Hidden from search engines', s.seo.noindex, 'seo', s.seo.noindex ? 'Turn this off before launch' : '') + '</div>'
      + '<div class="group-title">Quick links</div><div class="actions"><a class="btn ghost sm" href="#/products">Edit products</a><a class="btn ghost sm" href="#/page/index">Edit home page</a><a class="btn ghost sm" href="#/inbox">Open inbox</a><a class="btn ghost sm" href="#/promo">Promo codes</a><a class="btn ghost sm" href="#/media">Images</a></div></div>'
      + '<div><div class="group-title">Recent activity</div><div class="list">' + (B().history.length ? B().history.map((h) => '<div class="li"><div class="grow"><b>' + esc(h.label || h.ref) + '</b><small>' + esc(h.user_name) + ' &middot; ' + esc(h.created) + ' UTC</small></div></div>').join('') : '<div class="li muted">Nothing yet.</div>') + '</div>'
      + '<p style="margin-top:8px"><a href="#/history">See all activity</a></p></div></div>';
  };

  /* ---------- pages ---------- */
  V.pages = () => {
    crumbs([['Content'], ['Pages']]);
    let html = head('Pages', 'Pick a page to edit its text, links and pictures. Shared parts such as the menu and footer have their own screens.')
      + note('Each page shows everything you can change, in the same order as on the live page. Articles are not part of this site yet.');
    ['Main pages', 'Policies and legal', 'Account and cart pages'].forEach((g) => {
      html += '<div class="group-title">' + g + '</div><div class="list">';
      PAGE_DEFS.filter((p) => p.group === g).forEach((p) => {
        const fl = B().fields.filter((f) => f.page === p.file); const ed = fl.filter(cedited).length;
        html += '<a class="li click" href="#/page/' + p.file + '" style="text-decoration:none;color:inherit"><div class="grow"><b>' + esc(p.name) + '</b><small>' + fl.length + ' editable item' + (fl.length === 1 ? '' : 's') + '</small></div>' + (ed ? pill(ed + ' edited', 'red') : pill('Original', 'off')) + '</a>';
      });
      html += '</div>';
    });
    return html;
  };

  function sectionsHtml(fields) {
    const order = []; const map = {};
    fields.forEach((f) => { if (!map[f.section]) { map[f.section] = { label: f.section_label, fields: [] }; order.push(f.section); } map[f.section].fields.push(f); });
    return order.map((sk, i) => {
      const sec = map[sk]; const open = (sk in S.open) ? S.open[sk] : i === 0 || S.focusOpen;
      return '<details class="sec" data-sec="' + esc(sk) + '"' + (open ? ' open' : '') + '><summary>' + esc(sec.label) + '<span class="count">' + sec.fields.length + ' item' + (sec.fields.length === 1 ? '' : 's') + '</span></summary><div class="body">' + sec.fields.map(cfield).join('') + '</div></details>';
    }).join('');
  }
  function editorTools(fields, liveUrl) {
    const edited = fields.filter((f) => cedited(f) || cstaged(f)).length;
    return '<div class="toolbar"><input type="search" id="psearch" class="grow" placeholder="Search in this page" aria-label="Search in this page"><span class="muted small">' + fields.length + ' editable items' + (edited ? ', ' + edited + ' edited' : '') + '</span>'
      + '<button class="btn ghost sm" data-act="expand-all">Open all sections</button></div>';
  }
  V.page = (file) => {
    const def = PAGE_DEFS.find((p) => p.file === file); if (!def) return '<p>Page not found.</p>';
    crumbs([['Content'], ['Pages', 'pages'], [def.name]]);
    const fields = B().fields.filter((f) => f.page === file);
    const legal = B().legal.find((l) => l.file === file);
    let html = head(def.name, 'Change text, links and pictures on this page. Edited items are marked in red. Nothing is live until you press Save.',
      '<a class="btn ghost" href="' + esc(CFG.site + def.live) + '" target="_blank" rel="noopener">View live page</a><button class="btn ghost" data-act="reset-page" data-fields="page:' + file + '">Reset page</button>')
      + locked('content', 'page content') + note('<b>What you can change here:</b> text (blue label), links (purple), pictures (green). Save publishes right away. "Reset to original" puts back the first version.');
    if (legal) {
      const pg = Object.assign({ title: legal.title, content: legal.content }, S.st.pages[legal.id] || {});
      html += '<details class="sec" open data-sec="legal"><summary>Policy text</summary><div class="body"><div class="field"><div class="f-head">' + chip('text', 'Text') + '<span class="f-label">Page title</span></div><input type="text" data-pgt="' + legal.id + '" value="' + esc(pg.title) + '"></div>'
        + '<div class="field"><div class="f-head">' + chip('text', 'Text') + '<span class="f-label">Policy text</span></div><div class="help">Section headings are shown in bold capitals on the site. Use the HTML button to edit headings and paragraphs directly.</div>' + rte('data-pg="' + legal.id + '"', pg.content) + '</div></div></details>';
    }
    html += editorTools(fields) + sectionsHtml(fields);
    return html;
  };
  V.shared = (which) => {
    const isHead = which === 'header';
    const secs = isHead ? ['shared.header', 'shared.menu'] : ['shared.footer', 'shared.floating'];
    crumbs([['Content'], [isHead ? 'Header and menu' : 'Footer and floating cart']]);
    const fields = B().fields.filter((f) => secs.indexOf(f.section) >= 0);
    return head(isHead ? 'Header and menu' : 'Footer and floating cart', 'These parts appear on every page, so one change updates the whole site.',
      '<button class="btn ghost" data-act="reset-page" data-fields="sec:' + secs.join(',') + '">Reset these</button>')
      + locked('content', 'page content') + note('Menu links to product collections point to <b>products.html?c=NAME</b>. If you add a collection, add its menu link here too.')
      + editorTools(fields) + sectionsHtml(fields);
  };

  /* ---------- media ---------- */
  V.media = () => {
    crumbs([['Content'], ['Images and files']]);
    return head('Images and files', 'Upload pictures and use them anywhere on the site. Photos that came with the site are under "Already on the site" when you choose an image.',
      '<label class="btn">Upload image<input type="file" id="mu" accept="image/jpeg,image/png,image/gif,image/webp" hidden></label>')
      + locked('media', 'images') + '<div class="toolbar"><input type="search" id="ms" placeholder="Search images" class="grow"></div><div id="mgrid"><p class="muted">Loading...</p></div>';
  };
  V.media.after = async () => {
    const draw = async () => {
      try {
        const out = await api('media', { query: { s: ($('#ms') || {}).value || '' } });
        if (!$('#mgrid')) return; $('#mgrid').innerHTML = out.items.length ? '<div class="mgrid">' + out.items.map((i) => '<div class="mitem" data-id="' + i.id + '"><img src="' + esc(i.thumb) + '" alt=""><div class="meta"><b>' + esc(i.name) + '</b><span class="muted">' + i.w + ' x ' + i.h + '</span>'
          + '<input type="text" data-malt placeholder="Image description" value="' + esc(i.alt) + '"><div class="row"><button class="btn ghost sm" data-act="copy-url" data-url="' + esc(i.url) + '">Copy address</button><button class="btn danger sm" data-act="del-media" data-id="' + i.id + '">Delete</button></div></div></div>').join('') + '</div>' : '<p class="muted">No images yet.</p>';
      } catch (e) { if (!$('#mgrid')) return; $('#mgrid').innerHTML = '<p class="muted">' + esc(e.message) + '</p>'; }
    };
    $('#ms').addEventListener('input', () => { clearTimeout(V.media.t); V.media.t = setTimeout(draw, 300); });
    $('#mu').addEventListener('change', async (e) => {
      if (!e.target.files[0]) return; const fd = new FormData(); fd.append('file', e.target.files[0]);
      try { await api('media/upload', { form: fd }); toast('Image uploaded.'); draw(); } catch (er) { toast(er.message, true); }
    });
    draw();
  };

  /* ---------- products ---------- */
  function effOrder() { return S.st.order || B().products.map((p) => String(p.pid)); }
  function newProducts() { return Object.keys(S.st.products).filter((k) => S.st.products[k].__new).map((k) => Object.assign({ pid: k }, S.st.products[k])); }
  V.products = () => {
    crumbs([['Shop'], ['All products']]);
    const cats = B().categories; const q = (S.tmp.pq || '').toLowerCase(); const cf = S.tmp.pc || ''; const sf = S.tmp.ps || '';
    const base = effOrder().map((id) => B().products.find((p) => String(p.pid) === id)).filter(Boolean).filter((p) => S.st.del.indexOf(p.pid) < 0);
    const rows = newProducts().concat(base).map((p) => ({ raw: p, p: pget(p) }));
    const list = rows.filter((r) => (!q || (r.p.name + ' ' + r.p.id).toLowerCase().indexOf(q) >= 0) && (!cf || r.p.cat === cf) && (!sf || (sf === 'hidden' ? r.p.hidden : !r.p.hidden)));
    return head('All products', 'Click a product to change its name, picture, prices, stock and more. Use the arrows to change the order shown on the site.', '<button class="btn" data-act="new-product"' + dis('products') + '>Add product</button>')
      + locked('products', 'products')
      + '<div class="toolbar"><input type="search" id="pq" class="grow" placeholder="Search products" value="' + esc(S.tmp.pq || '') + '"><select id="pc"><option value="">All collections</option>' + cats.map((c) => '<option value="' + esc(c.id) + '"' + (c.id === cf ? ' selected' : '') + '>' + esc(c.name) + '</option>').join('') + '</select>'
      + '<select id="ps"><option value="">Showing and hidden</option><option value="showing"' + (sf === 'showing' ? ' selected' : '') + '>Showing only</option><option value="hidden"' + (sf === 'hidden' ? ' selected' : '') + '>Hidden only</option></select></div>'
      + '<div class="list">' + (list.map((r) => {
        const p = r.p, id = String(r.raw.pid), isNew = !!r.raw.__new || String(id).charAt(0) === 'n';
        const out = p.variable ? (!p.stock_single || (p.has_kit && !p.stock_kit)) : !p.stock_all;
        return '<div class="li"><a href="#/product/' + id + '" class="li click" style="text-decoration:none;color:inherit;padding:0;border:0;flex:1;min-width:0">' + (p.img ? '<img src="' + esc(p.img) + '" alt="">' : '<img alt="">') + '<div class="grow"><b>' + esc(p.name || 'New product') + '</b><small>' + esc((cats.find((c) => c.id === p.cat) || {}).name || 'No collection') + ' &middot; ' + money(p.price) + (p.has_kit ? ' / 10-pack ' + money(p.kit) : '') + '</small></div></a>'
          + (isNew ? pill('New', 'on') : '') + (p.hidden ? pill('Hidden', 'warn') : '') + (out ? pill('Out of stock', 'red') : '')
          + '<button class="btn ghost sm" data-act="mv-up" data-id="' + id + '" title="Move up"' + (isNew ? ' disabled' : '') + '>&uarr;</button><button class="btn ghost sm" data-act="mv-down" data-id="' + id + '" title="Move down"' + (isNew ? ' disabled' : '') + '>&darr;</button></div>';
      }).join('') || '<div class="li muted">No products match.</div>') + '</div>';
  };
  V.products.after = () => {
    const re = () => { render(); };
    $('#pq').addEventListener('input', (e) => { S.tmp.pq = e.target.value; clearTimeout(V.products.t); V.products.t = setTimeout(() => { re(); const i = $('#pq'); i.focus(); i.setSelectionRange(i.value.length, i.value.length); }, 250); });
    $('#pc').addEventListener('change', (e) => { S.tmp.pc = e.target.value; re(); });
    $('#ps').addEventListener('change', (e) => { S.tmp.ps = e.target.value; re(); });
  };

  const stepsEditor = (steps, attr) => '<div class="help">Buy this many or more, get this percent off the price of each item.</div>' + steps.map((s, i) => '<div class="step"><input type="number" min="2" placeholder="Quantity (for example 10)" data-step="' + i + '" data-sf="min" ' + attr + ' value="' + esc(s.min) + '"><input type="number" min="1" max="99" step="0.5" placeholder="Percent off" data-step="' + i + '" data-sf="pct" ' + attr + ' value="' + esc(s.pct) + '"><button class="btn danger sm" data-act="step-del" data-i="' + i + '" ' + attr + '>Remove</button></div>').join('') + '<button class="btn ghost sm" data-act="step-add" ' + attr + '>Add a step</button>';

  V.product = (pid) => {
    const base = B().products.find((p) => String(p.pid) === pid);
    const isNew = !base && S.st.products[pid] && S.st.products[pid].__new;
    if (!base && !isNew) return '<p>Product not found. <a href="#/products">Back to products</a></p>';
    const p = pget(base || { pid }); const cats = B().categories; const a = 'data-pid="' + esc(pid) + '"';
    crumbs([['Shop'], ['All products', 'products'], [p.name || 'New product']]);
    const inp = (f, label, type, help, extra) => '<div class="field"><div class="f-head"><span class="f-label">' + label + '</span></div>' + (help ? '<div class="help">' + help + '</div>' : '') + '<input type="' + (type || 'text') + '" data-pf="' + f + '" ' + a + ' value="' + esc(p[f]) + '"' + (extra || '') + dis('products') + '></div>';
    const tog = (f, label, help) => '<div class="field"><label class="checkline"><input type="checkbox" data-pf="' + f + '" ' + a + (p[f] ? ' checked' : '') + dis('products') + '> ' + label + '</label>' + (help ? '<div class="help">' + help + '</div>' : '') + '</div>';
    const disc = p.disc === 'none' ? 'none' : (Array.isArray(p.disc) ? 'custom' : 'default');
    const specs = (p.specs || []).map((s, i) => '<div class="kv"><input type="text" data-spec="' + i + '" data-sp="0" ' + a + ' value="' + esc(s[0]) + '" placeholder="Label"><input type="text" data-spec="' + i + '" data-sp="1" ' + a + ' value="' + esc(s[1]) + '" placeholder="Value"><button class="btn danger sm" data-act="spec-del" data-i="' + i + '" ' + a + '>Remove</button></div>').join('');
    const recs = (p.recs || []).map((s, i) => '<div class="kv" style="grid-template-columns:1fr auto"><input type="text" data-rec="' + i + '" ' + a + ' value="' + esc(s) + '"><button class="btn danger sm" data-act="rec-del" data-i="' + i + '" ' + a + '>Remove</button></div>').join('');
    return head(p.name || 'New product', 'Everything about this product. Changes show on the site after you press Save.',
      (isNew ? '' : '<a class="btn ghost" target="_blank" rel="noopener" href="' + esc(CFG.site + 'product.html?id=' + encodeURIComponent(p.id)) + '">View live page</a>') + '<button class="btn danger" data-act="del-product" data-id="' + esc(pid) + '"' + dis('products') + '>' + (isNew ? 'Discard product' : 'Delete product') + '</button>')
      + locked('products', 'products')
      + '<div class="card"><h2>Basics</h2>' + inp('name', 'Product name') + '<div class="field"><div class="f-head"><span class="f-label">Collection (the label customers see)</span></div><select data-pf="cat" ' + a + dis('products') + '><option value="">None</option>' + cats.map((c) => '<option value="' + esc(c.id) + '"' + (c.id === p.cat ? ' selected' : '') + '>' + esc(c.name) + '</option>').join('') + '</select></div>'
      + '<div class="field"><div class="f-head">' + chip('image', 'Image') + '<span class="f-label">Product picture</span></div>' + imgPick('data-pf="img" ' + a, p.img) + '</div>'
      + '<div class="field"><div class="f-head"><span class="f-label">Short description</span></div><textarea data-pf="short" ' + a + ' rows="2"' + dis('products') + '>' + esc(p.short) + '</textarea></div>'
      + '<div class="field"><div class="f-head"><span class="f-label">Full description</span></div><div class="help">Leave a blank line between paragraphs.</div><textarea data-pf="desc" ' + a + ' rows="6"' + dis('products') + '>' + esc(p.desc) + '</textarea></div></div>'
      + '<div class="card"><h2>Price</h2><div class="grid g2">' + inp('price', 'Price (USD)', 'number', '', ' min="0" step="0.01"') + (p.has_kit ? inp('kit', '10-pack price (USD)', 'number', '', ' min="0" step="0.01"') : '') + '</div>' + (isNew ? '' : (p.has_kit ? '' : '<p class="help">This product is sold by the single item.</p>')) + '</div>'
      + '<div class="card"><h2>Stock and limits</h2>' + (p.variable ? tog('stock_single', 'Single vial is in stock') + (p.has_kit ? tog('stock_kit', '10-pack is in stock') : '') : tog('stock_all', 'In stock', 'Turn this off to show "Out of stock" and stop it being added to a cart.'))
      + inp('max', 'Most of this item per cart', 'number', 'Leave at 0 to use the site-wide limit.', ' min="0"') + tog('hidden', 'Hide this product', 'Hidden products disappear from the site. Their page shows "product not found".') + '</div>'
      + '<div class="card"><h2>Quantity discount</h2><div class="field"><label class="checkline"><input type="radio" name="dm" data-dm="default" ' + a + (disc === 'default' ? ' checked' : '') + dis('products') + '> Use the site-wide discount steps</label><label class="checkline"><input type="radio" name="dm" data-dm="none" ' + a + (disc === 'none' ? ' checked' : '') + dis('products') + '> No discount for this product</label><label class="checkline"><input type="radio" name="dm" data-dm="custom" ' + a + (disc === 'custom' ? ' checked' : '') + dis('products') + '> Custom steps for this product</label></div>'
      + (disc === 'custom' ? '<div class="field">' + stepsEditor(Array.isArray(p.disc) ? p.disc : [], a + ' data-scope="product"') + '</div>' : '') + '</div>'
      + '<div class="card"><h2>Details shown on the product page</h2>' + inp('form', 'Form (for example Lyophilized powder)') + inp('strength', 'Strength') + '<div class="field"><div class="f-head"><span class="f-label">Details list</span></div>' + specs + '<button class="btn ghost sm" data-act="spec-add" ' + a + dis('products') + '>Add a line</button></div>'
      + '<div class="field"><div class="f-head"><span class="f-label">Storage and handling notes</span></div>' + recs + '<button class="btn ghost sm" data-act="rec-add" ' + a + dis('products') + '>Add a note</button></div>'
      + '<div class="field"><div class="f-head"><span class="f-label">Related products</span></div><div class="help">Product IDs separated by commas. Example: rt20, rt30</div><input type="text" data-rel ' + a + ' value="' + esc((p.related || []).join(', ')) + '"' + dis('products') + '></div></div>';
  };

  V.prices = () => {
    crumbs([['Shop'], ['Quick price and stock list']]);
    const rows = effOrder().map((id) => B().products.find((p) => String(p.pid) === id)).filter(Boolean);
    return head('Quick price and stock list', 'Change many prices and stock settings in one place.') + locked('products', 'prices')
      + '<div class="list"><div class="pricegrid head"><span>Product</span><span>Price</span><span>10-pack</span><span>In stock</span><span>10-pack stock</span></div>'
      + rows.map((r) => { const p = pget(r), a = 'data-pid="' + r.pid + '"';
        const s1 = p.variable ? p.stock_single : p.stock_all;
        const lb = (t, inner) => '<label class="pc"><span class="l">' + t + '</span>' + inner + '</label>';
        return '<div class="pricegrid"><span><b>' + esc(p.name) + '</b></span>' + lb('Price', '<input type="number" min="0" step="0.01" data-pf="price" ' + a + ' value="' + esc(p.price) + '"' + dis('products') + '>')
          + (p.has_kit ? lb('10-pack price', '<input type="number" min="0" step="0.01" data-pf="kit" ' + a + ' value="' + esc(p.kit) + '"' + dis('products') + '>') : '<span class="muted pc-none">-</span>')
          + lb('In stock', '<input type="checkbox" data-pf="' + (p.variable ? 'stock_single' : 'stock_all') + '" ' + a + (s1 ? ' checked' : '') + dis('products') + '>')
          + (p.has_kit ? lb('10-pack in stock', '<input type="checkbox" data-pf="stock_kit" ' + a + (p.stock_kit ? ' checked' : '') + dis('products') + '>') : '<span class="muted pc-none">-</span>') + '</div>'; }).join('') + '</div>';
  };

  V.collections = () => {
    crumbs([['Shop'], ['Collections']]);
    const cats = B().categories.map((c) => Object.assign({}, c, S.st.cats[c.term_id] || {}));
    const nw = S.st.cats.new ? [Object.assign({ term_id: 0, name: '', blurb: '', order: 99 }, S.st.cats.new)] : [];
    return head('Collections', 'The groups products belong to, such as Peptides or Orals. The name and the short line show on the products page.', '<button class="btn" data-act="new-cat"' + dis('products') + '>Add collection</button>')
      + locked('products', 'collections') + '<div class="card">' + nw.concat(cats).map((c) => { const k = c.term_id || 'new';
        return '<div class="field"><div class="grid g2"><label>Name<input type="text" data-cat="' + k + '" data-cf="name" value="' + esc(c.name) + '"' + dis('products') + '></label><label>Show order<input type="number" data-cat="' + k + '" data-cf="order" value="' + esc(c.order) + '"' + dis('products') + '></label></div>'
          + '<label style="display:block;margin-top:8px">Short line<input type="text" data-cat="' + k + '" data-cf="blurb" value="' + esc(c.blurb) + '"' + dis('products') + '></label>' + (c.id ? '<div class="orig" style="display:block">Link name: ' + esc(c.id) + ' &middot; ' + (c.count || 0) + ' products</div>' : '') + '</div>'; }).join('') + '</div>';
  };

  /* ---------- shop rules ---------- */
  V.discounts = () => {
    crumbs([['Shop'], ['Quantity discounts']]);
    const g = sget('discounts');
    return head('Quantity discounts', 'Give a percent off when a customer buys several of the same item. Product pages show the steps and the cart applies them.')
      + locked('settings', 'discounts') + note('Steps apply to each item line. For example: 10 or more gets 5 percent off. A product can have its own steps or none, in the product screen.')
      + settingsCard('discounts') + '<div class="card"><h2>Steps for all products</h2>' + stepsEditor(g.steps || [], 'data-scope="site"' + dis('settings')) + '</div>';
  };
  V.shipping = () => {
    crumbs([['Shop'], ['Shipping and cart rules']]);
    return head('Shipping and cart rules', 'A shipping fee, the minimum order and the most of one item per cart.') + locked('settings', 'these rules')
      + note('The fee shows as its own line in the cart and in the emails. Leave it at 0 and nothing changes on the site.') + settingsCard('shipping') + settingsCard('shop');
  };

  /* ---------- promo codes (saved immediately) ---------- */
  V.promo = () => {
    crumbs([['Shop'], ['Promo codes']]);
    const e = S.tmp.coupon;
    const cl = B().coupons;
    let html = head('Promo codes', 'Codes customers type in the cart. They are checked on our server, so nobody can see the list.', '<button class="btn" data-act="coupon-new"' + dis('promo') + '>New code</button>')
      + locked('promo', 'promo codes') + note('<b>Promo codes save immediately</b> when you press their own Save button. They are not part of the Save and publish bar.', 'warn');
    if (e) {
      html += '<div class="card"><h2>' + (e.id ? 'Edit code' : 'New code') + '</h2><div class="grid g3">'
        + '<label>Code<input type="text" data-cp="code" value="' + esc(e.code || '') + '" placeholder="SAVE10"></label>'
        + '<label>Type<select data-cp="type"><option value="percent"' + (e.type === 'percent' ? ' selected' : '') + '>Percent off</option><option value="fixed"' + (e.type === 'fixed' ? ' selected' : '') + '>Fixed amount off</option><option value="shipping"' + (e.type === 'shipping' ? ' selected' : '') + '>Free shipping</option></select></label>'
        + '<label>Amount<input type="number" min="0" step="0.01" data-cp="amount" value="' + esc(e.amount || 0) + '"></label>'
        + '<label>Minimum cart (USD)<input type="number" min="0" step="0.01" data-cp="min_order" value="' + esc(e.min_order || 0) + '"></label>'
        + '<label>Starts<input type="date" data-cp="starts" value="' + esc(e.starts || '') + '"></label><label>Ends<input type="date" data-cp="ends" value="' + esc(e.ends || '') + '"></label>'
        + '<label>Use limit (0 = no limit)<input type="number" min="0" data-cp="max_uses" value="' + esc(e.max_uses || 0) + '"></label>'
        + '<label>Note (only you see it)<input type="text" data-cp="note" value="' + esc(e.note || '') + '"></label>'
        + '<label class="checkline" style="align-self:end"><input type="checkbox" data-cp="active"' + (e.active ? ' checked' : '') + '> Active</label></div>'
        + '<div class="actions" style="margin-top:14px"><button class="btn" data-act="coupon-save">Save code now</button><button class="btn ghost" data-act="coupon-cancel">Cancel</button></div></div>';
    }
    html += '<div class="list">' + (cl.length ? cl.map((c) => '<div class="li"><div class="grow"><b>' + esc(c.code) + '</b><small>' + (c.type === 'percent' ? Number(c.amount) + '% off' : c.type === 'fixed' ? money(c.amount) + ' off' : 'Free shipping') + (Number(c.min_order) ? ', cart over ' + money(c.min_order) : '') + (c.ends ? ', ends ' + esc(c.ends) : '') + ' &middot; used ' + Number(c.used) + (Number(c.max_uses) ? ' of ' + Number(c.max_uses) : '') + (c.note ? ' &middot; ' + esc(c.note) : '') + '</small></div>' + pill(Number(c.active) ? 'Active' : 'Off', Number(c.active) ? 'on' : 'off')
      + '<button class="btn ghost sm" data-act="coupon-edit" data-id="' + c.id + '"' + dis('promo') + '>Edit</button><button class="btn danger sm" data-act="coupon-del" data-id="' + c.id + '"' + dis('promo') + '>Delete</button></div>').join('') : '<div class="li muted">No codes yet.</div>') + '</div>';
    return html;
  };

  /* ---------- simple settings screens ---------- */
  const simple = (gk, title, sub, perm, extra) => () => {
    crumbs([[(NAV.find((g) => g.items.some((i) => i[0] === SCHEMA[gk].route)) || {}).g || 'Site'], [title]]);
    return head(title, sub) + locked(perm || 'settings', 'these settings') + (extra || '') + settingsCard(gk);
  };
  V.banner = simple('banner', 'Top banner', 'A thin message bar across the top of every page, for sales and news.');
  V.popup = simple('popup', 'Pop-up message', 'A small window that appears once in a while, for example for a welcome offer.');
  V.messages = simple('messages', 'Cart and form messages', 'The short messages visitors see when they use the cart and the contact form.', 'settings', note('Texts on the pages themselves are in Pages. These are the messages the site creates while someone is using it.'));
  V.look = simple('look', 'Look and feel', 'Colours and fonts used across the whole site. Change one and every page follows.', 'settings', note('Only change these if you want the site to look different. "Reset to original" under a field brings back the first colour.'));
  V.tracking = simple('tracking', 'Tracking and code', 'Connect Google Analytics or the Meta Pixel. The code boxes are for the owner only.', 'settings');
  V.maintenance = simple('maintenance', 'Maintenance mode', 'Close the site for visitors while you work on it. You stay signed in and can still see it.', 'settings', note('Turn this on, press Save, and the public sees your message instead of the site. Remember to turn it off after.', 'warn'));
  V.contact = () => {
    crumbs([['Site'], ['Contact details and email']]);
    return head('Contact details and email', 'The address that shows on the site and receives carts and messages.', '<button class="btn ghost" data-act="test-email">Send a test email</button>')
      + locked('settings', 'contact details') + note('The phone number shows on the site only when you fill it in. Save first, then send the test email.') + settingsCard('contact');
  };
  function seoPages() {
    const cur = sget('seo').pages; const pg = (cur && !Array.isArray(cur)) ? cur : {}; const meta = B().page_meta || {};
    const rows = PAGE_DEFS.map((p) => { const m = meta[p.file] || {}; const v = pg[p.file] || {}; const a = 'data-sp="' + p.file + '"';
      return '<div class="field" data-search="' + esc((p.name + ' ' + (m.title || '') + ' ' + (m.desc || '')).toLowerCase()) + '"><div class="f-head">' + chip('setting', 'Setting') + '<span class="f-label">' + esc(p.name) + '</span></div>'
        + '<label>Title shown in Google<input type="text" ' + a + ' data-spf="title" value="' + esc(v.title || '') + '" placeholder="' + esc(m.title || '') + '"' + dis('seo') + '></label>'
        + '<label style="display:block;margin-top:8px">Description<textarea rows="2" ' + a + ' data-spf="description" placeholder="' + esc(m.desc || '') + '"' + dis('seo') + '>' + esc(v.description || '') + '</textarea></label>'
        + '<label class="checkline" style="margin-top:6px"><input type="checkbox" ' + a + ' data-spf="noindex"' + (v.noindex ? ' checked' : '') + dis('seo') + '> Hide this page from search engines</label>'
        + (p.file === 'product' ? '<div class="help">Each product page uses its own product name as the title.</div>' : '') + '</div>'; }).join('');
    return '<div class="card"><h2>Title and description for each page</h2><div class="help">Leave a box empty to keep the original shown in grey.</div>' + rows + '</div>';
  }
  V.seo = () => {
    crumbs([['Site'], ['Search and sharing']]);
    return head('Search and sharing', 'How the site looks in Google and when shared in chats.') + locked('seo', 'search settings')
      + (B().site.seo_plugin ? note('An SEO plugin is active, so it controls page titles and descriptions. Only the items it does not cover apply here.', 'warn') : '')
      + settingsCard('seo') + seoPages();
  };

  /* ---------- redirects ---------- */
  V.redirects = () => {
    crumbs([['Site'], ['Redirects']]);
    const list = sget('redirects').list || [];
    return head('Redirects', 'Send an old address to a new one so visitors do not land on an error.', '<button class="btn" data-act="redir-add"' + dis('settings') + '>Add redirect</button>')
      + locked('settings', 'redirects') + note('Use a path like /old-page on the left. On the right use a page like products.html or a full address. 301 means moved for good.')
      + '<div class="card">' + (list.length ? list.map((r, i) => '<div class="kv redir"><input type="text" data-rd="' + i + '" data-rf="from" value="' + esc(r.from) + '" placeholder="/old-page"' + dis('settings') + '><input type="text" data-rd="' + i + '" data-rf="to" value="' + esc(r.to) + '" placeholder="products.html"' + dis('settings') + '>'
        + '<select data-rd="' + i + '" data-rf="code"' + dis('settings') + '><option value="301"' + (Number(r.code) === 301 ? ' selected' : '') + '>301</option><option value="302"' + (Number(r.code) === 302 ? ' selected' : '') + '>302</option></select>'
        + '<label class="checkline"><input type="checkbox" data-rd="' + i + '" data-rf="on"' + (r.on ? ' checked' : '') + dis('settings') + '> On</label><button class="btn danger sm" data-act="redir-del" data-i="' + i + '"' + dis('settings') + '>Remove</button></div>').join('') : '<p class="muted">No redirects yet.</p>') + '</div>';
  };

  /* ---------- inbox ---------- */
  V.inbox = () => {
    crumbs([['Customers'], ['Inbox']]);
    return head('Inbox', 'Carts customers sent and messages from the contact form. They are also emailed to you.') + locked('inbox', 'the inbox')
      + '<div class="toolbar"><select id="ib-type"><option value="">Carts and messages</option><option value="checkout">Carts only</option><option value="contact">Messages only</option></select><select id="ib-status"><option value="">Any status</option><option value="new">New</option><option value="read">Read</option><option value="done">Done</option><option value="spam">Spam</option></select></div><div id="ib-list"><p class="muted">Loading...</p></div>';
  };
  V.inbox.after = () => {
    const draw = async () => {
      try {
        const out = await api('inbox', { query: { type: $('#ib-type').value, status: $('#ib-status').value } });
        S.tmp.inbox = out.rows;
        if (!$('#ib-list')) return; $('#ib-list').innerHTML = out.rows.length ? '<div class="list">' + out.rows.map((r) => {
          const p = r.payload || {}; const isC = r.type === 'checkout';
          const lines = isC ? (p.lines || []).map((l) => esc((l.qty || l.q || 1) + ' x ' + (l.name || l.id || '') + (l.option ? ' (' + l.option + ')' : '') + (l.line != null ? ' = ' + money(l.line) : ''))).join('<br>') : '';
          return '<details class="li msg" data-id="' + r.id + '"><summary><b>' + esc(p.name || 'Unknown') + '</b> ' + pill(isC ? 'Cart' : 'Message', isC ? 'on' : 'off') + (isC && r.order_status ? ' ' + pill({ 'on-hold': 'Awaiting payment', pending: 'Awaiting payment', processing: 'Paid', completed: 'Shipped', cancelled: 'Cancelled' }[r.order_status] || r.order_status, r.order_status === 'completed' || r.order_status === 'processing' ? 'on' : 'warn') : '') + ' ' + pill(r.status, r.status === 'new' ? 'red' : 'off') + '<small>' + esc(r.created) + ' UTC' + (isC ? ' &middot; ' + money(p.total) : '') + '</small></summary><div class="body">'
            + '<p><a href="mailto:' + esc(p.email) + '">' + esc(p.email) + '</a>' + (p.phone ? ' &middot; ' + esc(p.phone) : '') + '</p>'
            + (isC ? '<p>' + lines + '</p><p class="muted">Subtotal ' + money(p.subtotal) + (Number(p.discount) ? ', discount -' + money(p.discount) : '') + (Number(p.shipping) ? ', shipping ' + money(p.shipping) : '') + ', total ' + money(p.total) + (p.promo ? ', code ' + esc(p.promo) : '') + '</p>' + (p.address ? '<p>' + esc(typeof p.address === 'string' ? p.address : JSON.stringify(p.address)) + '</p>' : '') + (p.payment_options ? '<p class="muted">Payment: ' + esc(Array.isArray(p.payment_options) ? p.payment_options.join(', ') : p.payment_options) + '</p>' : '') : '<p>' + esc(p.message).replace(/\n/g, '<br>') + '</p>' + (p.order_reference ? '<p class="muted">Order: ' + esc(p.order_reference) + '</p>' : ''))
            + (isC && r.order_id ? '<div class="orderbox"><b>Order #' + esc(r.order_id) + '</b><select data-ordsel>' + [['on-hold', 'Awaiting payment'], ['processing', 'Paid'], ['completed', 'Shipped'], ['cancelled', 'Cancelled']].map((o) => '<option value="' + o[0] + '"' + ((r.order_status === o[0] || (r.order_status === 'pending' && o[0] === 'on-hold')) ? ' selected' : '') + '>' + o[1] + '</option>').join('') + '</select><label class="checkline"><input type="checkbox" data-ordnotify> Email the customer</label><button class="btn sm" data-act="ord-set" data-id="' + r.id + '"' + dis('inbox') + '>Update order</button></div>' : '')
            + '<div class="actions"><button class="btn ghost sm" data-act="msg-status" data-id="' + r.id + '" data-s="read"' + dis('inbox') + '>Mark read</button><button class="btn ghost sm" data-act="msg-status" data-id="' + r.id + '" data-s="done"' + dis('inbox') + '>Mark done</button><button class="btn ghost sm" data-act="msg-status" data-id="' + r.id + '" data-s="spam"' + dis('inbox') + '>Spam</button><button class="btn sm" data-act="msg-reply" data-id="' + r.id + '"' + dis('inbox') + '>Reply</button><button class="btn danger sm" data-act="msg-del" data-id="' + r.id + '"' + dis('inbox') + '>Delete</button></div></div></details>';
        }).join('') + '</div>' : '<p class="muted">Nothing here yet.</p>';
      } catch (e) { if (!$('#ib-list')) return; $('#ib-list').innerHTML = '<p class="muted">' + esc(e.message) + '</p>'; }
    };
    V.inbox.draw = draw;
    $('#ib-type').addEventListener('change', draw); $('#ib-status').addEventListener('change', draw);
    draw();
  };

  /* ---------- history and undo ---------- */
  V.history = () => {
    crumbs([['Admin'], ['Activity and undo']]);
    return head('Activity and undo', 'Everything that was changed, by whom, and when. Restore an older value and then press Save.') + locked('history', 'history')
      + '<div class="toolbar"><select id="h-kind"><option value="">All changes</option><option value="content">Page text</option><option value="setting">Settings</option><option value="product">Products</option><option value="page">Policy pages</option><option value="coupon">Promo codes</option><option value="team">Team</option></select></div><div id="h-list"><p class="muted">Loading...</p></div>';
  };
  V.history.after = () => {
    const draw = async () => {
      try {
        const out = await api('history', { query: { kind: $('#h-kind').value } }); S.tmp.hist = out.rows;
        if (!$('#h-list')) return; $('#h-list').innerHTML = out.rows.length ? '<div class="list">' + out.rows.map((h, i) => {
          const undoable = ['content', 'setting', 'page'].indexOf(h.kind) >= 0 || (h.kind === 'product' && h.old_value && typeof h.old_value === 'object' && h.new_value);
          return '<div class="li"><div class="grow"><b>' + esc(h.label || h.ref) + '</b><small>' + esc(h.user_name) + ' &middot; ' + esc(h.created) + ' UTC &middot; ' + esc(h.kind) + '</small></div>' + (undoable ? '<button class="btn ghost sm" data-act="undo" data-i="' + i + '"' + dis('content') + '>Restore the older value</button>' : '') + '</div>';
        }).join('') + '</div>' : '<p class="muted">No activity yet.</p>';
      } catch (e) { if (!$('#h-list')) return; $('#h-list').innerHTML = '<p class="muted">' + esc(e.message) + '</p>'; }
    };
    $('#h-kind').addEventListener('change', draw); draw();
  };
  function undo(h) {
    if (h.kind === 'content') {
      const f = fieldByKey(h.ref); if (!f) return toast('That item no longer exists.', true);
      if (h.old_value === null || h.old_value === undefined) resetContent(f); else setContent(f, typeof h.old_value === 'string' ? h.old_value : String(h.old_value));
    } else if (h.kind === 'setting') {
      const g = h.ref; if (!B().settings[g]) return;
      sreplace(g, h.old_value && typeof h.old_value === 'object' ? Object.assign({}, B().defaults[g] || {}, h.old_value) : clone(B().defaults[g]));
    } else if (h.kind === 'page') {
      const pg = B().legal.find((x) => x.slug === h.ref); if (!pg || !h.old_value) return;
      S.st.pages[pg.id] = { title: h.old_value.title, content: h.old_value.content }; bar();
    } else if (h.kind === 'product') {
      const p = B().products.find((x) => x.id === h.ref); if (!p) return toast('That product no longer exists.', true);
      ['name', 'cat', 'short', 'desc', 'img', 'price', 'kit', 'stock_all', 'stock_single', 'stock_kit', 'max', 'hidden', 'specs', 'form', 'strength', 'recs', 'related', 'disc'].forEach((k) => { if (k in h.old_value) pset(p.pid, k, h.old_value[k]); });
    }
    toast('Restored. Review it, then press Save.');
  }

  /* ---------- backup ---------- */
  V.backup = () => {
    crumbs([['Admin'], ['Backup and restore']]);
    return head('Backup and restore', 'Download everything you have edited in one file, or put an older file back.') + locked('backup', 'backups')
      + note('A backup holds your edits, products, collections, policy pages and promo codes. It does not include images or customer messages. Restoring is staged: you review it and press Save.')
      + '<div class="card"><h2>Download a backup</h2><button class="btn" data-act="backup-dl"' + dis('backup') + '>Download backup file</button></div>'
      + '<div class="card"><h2>Restore from a file</h2><label class="btn ghost">Choose backup file<input type="file" id="bk-file" accept="application/json,.json" hidden></label><p class="muted" id="bk-msg"></p></div>';
  };
  V.backup.after = () => {
    $('#bk-file').addEventListener('change', async (e) => {
      const file = e.target.files[0]; if (!file) return;
      let j; try { j = JSON.parse(await file.text()); } catch (er) { return toast('That file is not a valid backup.', true); }
      if (j.format !== 'imperial-blowork-admin-backup') return toast('That file is not an Imperial Blowork backup.', true);
      if (!(await ask('Stage this backup? It replaces your current edits after you press Save. Promo codes are replaced right away.', 'Stage backup'))) return;
      S.st.content = {}; Object.keys(B().content).forEach((k) => { if (!(k in j.content)) S.st.content[k] = null; });
      Object.keys(j.content || {}).forEach((k) => { const f = fieldByKey(k); if (f && j.content[k] !== B().content[k]) S.st.content[k] = j.content[k]; });
      Object.keys(j.settings || {}).forEach((g) => { if (B().settings[g]) { const o = Object.assign({}, j.settings[g]); if ('smtp_pass_set' in o) delete o.smtp_pass_set; delete o.smtp_pass; const cur = clone(B().settings[g]); delete cur.smtp_pass_set; const merged = Object.assign(clone(B().settings[g]), o); if (!same(merged, B().settings[g])) S.st.settings[g] = merged; } });
      (j.products || []).forEach((p) => { const b = B().products.find((x) => x.id === p.id); if (!b) return; ['name', 'cat', 'short', 'desc', 'img', 'price', 'kit', 'stock_all', 'stock_single', 'stock_kit', 'max', 'hidden', 'specs', 'form', 'strength', 'recs', 'related', 'disc'].forEach((k) => { if (k in p && !same(p[k], b[k])) { S.st.products[b.pid] = S.st.products[b.pid] || {}; S.st.products[b.pid][k] = p[k]; } }); });
      (j.pages || []).forEach((p) => { const b = B().legal.find((x) => x.slug === p.slug); if (b && (b.title !== p.title || b.content !== p.content)) S.st.pages[b.id] = { title: p.title, content: p.content }; });
      if (can('backup') && Array.isArray(j.coupons)) { try { await api('coupons/replace', { body: { coupons: j.coupons } }); await load(); } catch (er) { toast(er.message, true); } }
      bar(); $('#bk-msg').textContent = 'Staged. ' + changeCount() + ' changes are waiting. Press Save and publish to apply them.';
    });
  };

  /* ---------- team ---------- */
  V.team = () => {
    crumbs([['Admin'], ['Team']]);
    return head('Team', 'Who can sign in at this address and what they can do.') + locked('team', 'the team')
      + note('<b>Owner</b> can do everything. <b>Admin</b> manages the shop and content. <b>Editor</b> edits page text and images. <b>Viewer</b> can look but not change. New people get an email to set their own password.')
      + '<div id="tm"><p class="muted">Loading...</p></div>';
  };
  V.team.after = async () => {
    const roles = ['owner', 'admin', 'editor', 'viewer'];
    const paint = (team) => {
      if (!$('#tm')) return; $('#tm').innerHTML = '<div class="list">' + team.map((u) => '<div class="li"><div class="grow"><b>' + esc(u.name) + '</b><small>' + esc(u.email) + '</small></div><select data-tmrole="' + u.id + '"' + (u.id === B().user.id ? ' disabled' : '') + '>' + roles.map((r) => '<option' + (r === u.role ? ' selected' : '') + '>' + r + '</option>').join('') + '</select><button class="btn danger sm" data-act="tm-del" data-id="' + u.id + '"' + (u.id === B().user.id ? ' disabled' : '') + '>Remove</button></div>').join('') + '</div>'
        + '<div class="card" style="margin-top:16px"><h2>Add a person</h2><div class="grid g3"><label>Name<input type="text" id="tm-name"></label><label>Email<input type="email" id="tm-email"></label><label>Role<select id="tm-role">' + roles.map((r) => '<option' + (r === 'editor' ? ' selected' : '') + '>' + r + '</option>').join('') + '</select></label></div><button class="btn" style="margin-top:12px" data-act="tm-add">Add and send invite</button></div>';
    };
    V.team.paint = paint;
    try { paint((await api('team')).team); } catch (e) { $('#tm').innerHTML = '<p class="muted">' + esc(e.message) + '</p>'; }
  };

  /* ---------- help ---------- */
  V.help = () => {
    crumbs([['Admin'], ['Help and guide']]);
    return head('Help and guide', 'How this panel works, in a few lines.')
      + '<div class="card"><h2>The basics</h2><ul class="guide"><li>Edit anything, then press <b>Save and publish</b> in the bar at the bottom. Nothing is live until then.</li><li>Press <b>/</b> on your keyboard to search everything. The result opens with the field highlighted.</li><li>Red marks show what you changed. <b>Reset to original</b> puts back the first version.</li><li>Colour labels: <b>Text</b> blue, <b>Link</b> purple, <b>Image</b> green, <b>Setting</b> grey, <b>Price</b> amber, <b>Code</b> dark.</li><li>Made a mistake? Open <b>Activity and undo</b> and restore the older value.</li></ul></div>'
      + '<div class="card"><h2>Good to know</h2><ul class="guide"><li>Promo codes save at once, not with the Save bar.</li><li>Hidden products disappear from the site. Out of stock products stay visible but cannot be added.</li><li>The Frequently Asked Questions can be reworded but not added or removed here.</li><li>Policy pages (Terms, Privacy, Refunds) are edited as text in their page screens.</li><li>Download a backup before big changes.</li></ul></div>';
  };

  /* ================= ROUTER ================= */
  function resolve(r) {
    if (r === '' ) return [V.dash];
    const p = r.split('/');
    if (p[0] === 'page') return [V.page, p[1]];
    if (p[0] === 'shared') return [V.shared, p[1]];
    if (p[0] === 'product') return [V.product, p.slice(1).join('/')];
    return [V[p[0]]];
  }
  function render() {
    const r = route(); const [fn, arg] = resolve(r);
    $$('.nav a').forEach((a) => a.classList.toggle('on', a.dataset.r === r || (a.dataset.r === 'products' && /^product\//.test(r))));
    const v = $('#view'); S.focusOpen = !!S.focus;
    v.innerHTML = fn ? fn(arg) : '<p>That screen does not exist. <a href="#/">Go to the dashboard</a></p>';
    if (fn && fn.after) fn.after(arg);
    $('#side').classList.remove('open');
    bar(); applyFocus();
    if (!S.focus) window.scrollTo(0, 0);
  }

  /* ================= EVENTS ================= */
  function stepsList(el) {
    const scope = el.dataset.scope;
    if (scope === 'product') { const p = pget(B().products.find((x) => String(x.pid) === el.dataset.pid) || { pid: el.dataset.pid }); return Array.isArray(p.disc) ? clone(p.disc) : []; }
    return clone(sget('discounts').steps || []);
  }
  function stepsSave(el, steps) {
    if (el.dataset.scope === 'product') pset(el.dataset.pid, 'disc', steps); else sset('discounts', 'steps', steps);
  }
  function setField(t) {
    const w = t.closest('.rte');
    if (w) { if (t.classList.contains('rte-html')) commitRte(w, t.value); else if (t.classList.contains('rte-body')) commitRte(w, normRich(t.innerHTML)); return; }
    const ip = t.closest('.imgpick');
    if (ip && t.matches('[data-imgurl]')) { commitImg(ip, t.value.trim()); return; }
    if (t.dataset.ckey) { setContent(fieldByKey(t.dataset.ckey), t.value); return; }
    if (t.dataset.sg) {
      const f = SCHEMA[t.dataset.sg].fields.find((x) => x.k === t.dataset.sk);
      let v = t.type === 'checkbox' ? (t.checked ? 1 : 0) : t.value;
      if (f && (f.t === 'int')) v = Math.max(0, Math.round(Number(v) || 0)); else if (f && f.t === 'money') v = Math.max(0, Number(v) || 0);
      sset(t.dataset.sg, t.dataset.sk, v);
      if (f && f.t === 'color') { const pair = $$('[data-sg="' + t.dataset.sg + '"][data-sk="' + t.dataset.sk + '"]'); pair.forEach((x) => { if (x !== t && x.value !== t.value && (x.type !== 'color' || /^#[0-9a-f]{6}$/i.test(t.value))) x.value = t.value; }); }
      return;
    }
    if (t.dataset.pf) {
      let v = t.type === 'checkbox' ? (t.checked ? 1 : 0) : t.value;
      if (t.type === 'number') v = v === '' ? 0 : Number(v);
      pset(t.dataset.pid, t.dataset.pf, v); return;
    }
    if (t.dataset.step !== undefined) {
      const steps = stepsList(t), i = Number(t.dataset.step); steps[i] = steps[i] || { min: 0, pct: 0 }; steps[i][t.dataset.sf] = Number(t.value) || 0; stepsSave(t, steps); return;
    }
    if (t.dataset.spec !== undefined) {
      const p = pget(B().products.find((x) => String(x.pid) === t.dataset.pid) || { pid: t.dataset.pid, specs: [] }); const sp = clone(p.specs || []); const i = Number(t.dataset.spec); sp[i] = sp[i] || ['', '']; sp[i][Number(t.dataset.sp)] = t.value; pset(t.dataset.pid, 'specs', sp); return;
    }
    if (t.dataset.rec !== undefined) {
      const p = pget(B().products.find((x) => String(x.pid) === t.dataset.pid) || { pid: t.dataset.pid, recs: [] }); const r = clone(p.recs || []); r[Number(t.dataset.rec)] = t.value; pset(t.dataset.pid, 'recs', r); return;
    }
    if (t.dataset.rel !== undefined) { pset(t.dataset.pid, 'related', t.value.split(',').map((x) => x.trim()).filter(Boolean)); return; }
    if (t.dataset.sp) {
      const cur = sget('seo').pages; const pg = clone((cur && !Array.isArray(cur)) ? cur : {}); const f = t.dataset.spf;
      pg[t.dataset.sp] = Object.assign({ title: '', description: '', noindex: 0 }, pg[t.dataset.sp] || {});
      pg[t.dataset.sp][f] = f === 'noindex' ? (t.checked ? 1 : 0) : t.value;
      const e = pg[t.dataset.sp]; if (!e.title && !e.description && !e.noindex) delete pg[t.dataset.sp];
      const base = B().settings.seo.pages; sset('seo', 'pages', (Object.keys(pg).length || (base && !Array.isArray(base) && Object.keys(base).length)) ? pg : (Array.isArray(base) ? [] : {})); return;
    }
    if (t.dataset.dm) { if (!t.checked) return; const m = t.dataset.dm; pset(t.dataset.pid, 'disc', m === 'custom' ? [{ min: 10, pct: 5 }] : m); render(); return; }
    if (t.dataset.cat) {
      const k = t.dataset.cat; const base = B().categories.find((c) => String(c.term_id) === k) || { term_id: 0, name: '', blurb: '', order: 99 };
      const cur = Object.assign({ term_id: base.term_id, name: base.name, blurb: base.blurb, order: base.order }, S.st.cats[k] || {}); cur[t.dataset.cf] = t.dataset.cf === 'order' ? Number(t.value) || 0 : t.value;
      if (k !== 'new' && cur.name === base.name && cur.blurb === base.blurb && Number(cur.order) === Number(base.order)) delete S.st.cats[k]; else S.st.cats[k] = cur; bar(); return;
    }
    if (t.dataset.pgt) { const pg = B().legal.find((x) => String(x.id) === t.dataset.pgt); S.st.pages[pg.id] = Object.assign({ title: pg.title, content: pg.content }, S.st.pages[pg.id] || {}, { title: t.value }); if (same(S.st.pages[pg.id], { title: pg.title, content: pg.content })) delete S.st.pages[pg.id]; bar(); return; }
    if (t.dataset.rd !== undefined) {
      const l = clone(sget('redirects').list || []); const i = Number(t.dataset.rd); const f = t.dataset.rf;
      l[i][f] = t.type === 'checkbox' ? (t.checked ? 1 : 0) : (f === 'code' ? Number(t.value) : t.value); sreplace('redirects', { list: l }); return;
    }
    if (t.dataset.cp) { S.tmp.coupon[t.dataset.cp] = t.type === 'checkbox' ? (t.checked ? 1 : 0) : (t.type === 'number' ? Number(t.value) || 0 : t.value); return; }
    if (t.dataset.malt !== undefined) { clearTimeout(t._t); t._t = setTimeout(() => api('media/alt', { body: { id: Number(t.closest('.mitem').dataset.id), alt: t.value } }).then(() => toast('Description saved.')).catch((e) => toast(e.message, true)), 600); }
  }
  document.addEventListener('input', (e) => {
    const t = e.target;
    if (t.id === 'gs') { runSearch(t.value); return; }
    if (t.id === 'psearch') { const q = t.value.toLowerCase().trim(); $$('#view .field').forEach((f) => { f.hidden = q && f.dataset.search.indexOf(q) < 0; }); if (q) $$('#view details.sec').forEach((d) => { d.open = true; d.hidden = !$$('.field', d).some((f) => !f.hidden); }); else $$('#view details.sec').forEach((d) => { d.hidden = false; }); return; }
    if (t.closest && t.closest('#view')) setField(t);
  });
  document.addEventListener('change', (e) => {
    const t = e.target;
    if (t.dataset && t.dataset.tmrole) { api('team/role', { body: { id: Number(t.dataset.tmrole), role: t.value } }).then((o) => { V.team.paint(o.team); toast('Role changed.'); }).catch((er) => { toast(er.message, true); V.team.after(); }); return; }
    if (t.closest && t.closest('#view') && (t.type === 'checkbox' || t.tagName === 'SELECT' || t.type === 'radio' || t.type === 'color')) setField(t);
  });
  document.addEventListener('toggle', (e) => { const d = e.target; if (d.matches && d.matches('details.sec') && d.dataset.sec) S.open[d.dataset.sec] = d.open; }, true);
  document.addEventListener('keydown', (e) => {
    const t = e.target, typing = /^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName) || t.isContentEditable;
    if (e.key === '/' && !typing && $('#gs')) { e.preventDefault(); $('#gs').focus(); return; }
    if (t.id === 'gs') {
      const items = $$('#results .res[data-i]');
      if (e.key === 'ArrowDown') { e.preventDefault(); resSel = Math.min(items.length - 1, resSel + 1); } else if (e.key === 'ArrowUp') { e.preventDefault(); resSel = Math.max(0, resSel - 1); }
      else if (e.key === 'Enter') { const h = resList[resSel >= 0 ? resSel : 0]; if (h) openResult(h); return; } else if (e.key === 'Escape') { $('#results').hidden = true; t.blur(); return; } else return;
      items.forEach((x, i) => x.classList.toggle('on', i === resSel));
    }
  });
  document.addEventListener('mousedown', (e) => { const r = e.target.closest && e.target.closest('#results .res[data-i]'); if (r) { e.preventDefault(); openResult(resList[Number(r.dataset.i)]); } });
  document.addEventListener('focusout', (e) => { if (e.target.id === 'gs') setTimeout(() => { const r = $('#results'); if (r) r.hidden = true; }, 150); });
  window.addEventListener('hashchange', () => { if (S.boot) render(); });

  const ACT = {
    save, discard,
    'reset-field': (b) => { const f = fieldByKey(b.dataset.key); resetContent(f); render(); },
    'reset-setting': (b) => { const g = b.dataset.g, k = b.dataset.k; sset(g, k, clone(B().defaults[g][k])); render(); },
    'reset-page': async (b) => {
      const spec = b.dataset.fields; let fl;
      if (spec.indexOf('page:') === 0) fl = B().fields.filter((f) => f.page === spec.slice(5)); else { const secs = spec.slice(4).split(','); fl = B().fields.filter((f) => secs.indexOf(f.section) >= 0); }
      fl = fl.filter((f) => cedited(f) || cstaged(f)); if (!fl.length) return toast('Nothing to reset here.');
      if (!(await ask('Put ' + fl.length + ' edited item' + (fl.length === 1 ? '' : 's') + ' back to the original? This is staged until you press Save.', 'Reset', true))) return;
      fl.forEach(resetContent); render();
    },
    'expand-all': () => { $$('#view details.sec').forEach((d) => { d.open = true; }); },
    'pick-img': async (b) => { const w = b.closest('.imgpick'); const u = await pickImage(); if (u) commitImg(w, u); },
    'clear-img': (b) => commitImg(b.closest('.imgpick'), ''),
    'copy-url': (b) => { try { navigator.clipboard.writeText(b.dataset.url); toast('Address copied.'); } catch (e) { toast(b.dataset.url); } },
    'del-media': async (b) => { if (!(await ask('Delete this image for good? Pages using it will show a gap.', 'Delete', true))) return; try { await api('media/delete', { body: { id: Number(b.dataset.id) } }); toast('Image deleted.'); b.closest('.mitem').remove(); } catch (e) { toast(e.message, true); } },
    'new-product': () => { const id = 'n' + Date.now(); S.st.products[id] = { __new: true, name: 'New product', cat: '', short: '', desc: '', img: '', price: 0, kit: null, has_kit: false, variable: false, stock_all: 1, stock_single: 1, stock_kit: 1, max: 0, hidden: 0, specs: [], form: '', strength: '', recs: [], related: [], disc: 'default' }; bar(); go('product/' + id); },
    'del-product': async (b) => {
      const id = b.dataset.id;
      if (S.st.products[id] && S.st.products[id].__new) { delete S.st.products[id]; bar(); return go('products'); }
      if (!(await ask('Delete this product? It moves to the WordPress trash when you press Save.', 'Delete product', true))) return;
      S.st.del.push(Number(id)); bar(); go('products');
    },
    'mv-up': (b) => moveProd(b.dataset.id, -1), 'mv-down': (b) => moveProd(b.dataset.id, 1),
    'step-add': (b) => { const s = stepsList(b); s.push({ min: (s.length ? s[s.length - 1].min : 5) + 5, pct: (s.length ? s[s.length - 1].pct : 0) + 5 }); stepsSave(b, s); render(); },
    'step-del': (b) => { const s = stepsList(b); s.splice(Number(b.dataset.i), 1); stepsSave(b, s); render(); },
    'spec-add': (b) => { const p = pget(B().products.find((x) => String(x.pid) === b.dataset.pid) || { pid: b.dataset.pid, specs: [] }); pset(b.dataset.pid, 'specs', (p.specs || []).concat([['', '']])); render(); },
    'spec-del': (b) => { const p = pget(B().products.find((x) => String(x.pid) === b.dataset.pid) || { pid: b.dataset.pid, specs: [] }); const s = clone(p.specs || []); s.splice(Number(b.dataset.i), 1); pset(b.dataset.pid, 'specs', s); render(); },
    'rec-add': (b) => { const p = pget(B().products.find((x) => String(x.pid) === b.dataset.pid) || { pid: b.dataset.pid, recs: [] }); pset(b.dataset.pid, 'recs', (p.recs || []).concat([''])); render(); },
    'rec-del': (b) => { const p = pget(B().products.find((x) => String(x.pid) === b.dataset.pid) || { pid: b.dataset.pid, recs: [] }); const s = clone(p.recs || []); s.splice(Number(b.dataset.i), 1); pset(b.dataset.pid, 'recs', s); render(); },
    'new-cat': () => { S.st.cats.new = { term_id: 0, name: '', blurb: '', order: 99 }; bar(); render(); },
    'redir-add': () => { const l = clone(sget('redirects').list || []); l.push({ from: '/', to: '', code: 301, on: 1 }); sreplace('redirects', { list: l }); render(); },
    'redir-del': (b) => { const l = clone(sget('redirects').list || []); l.splice(Number(b.dataset.i), 1); sreplace('redirects', { list: l }); render(); },
    'coupon-new': () => { S.tmp.coupon = { id: 0, code: '', type: 'percent', amount: 10, min_order: 0, starts: '', ends: '', max_uses: 0, note: '', active: 1 }; render(); },
    'coupon-edit': (b) => { S.tmp.coupon = clone(B().coupons.find((c) => String(c.id) === b.dataset.id)); render(); },
    'coupon-cancel': () => { S.tmp.coupon = null; render(); },
    'coupon-save': async () => { try { const o = await api('coupon', { body: S.tmp.coupon }); B().coupons = o.coupons; S.tmp.coupon = null; SIDX = null; toast('Promo code saved.'); render(); } catch (e) { toast(e.message, true); } },
    'coupon-del': async (b) => { if (!(await ask('Delete this promo code?', 'Delete', true))) return; try { const o = await api('coupon/delete', { body: { id: Number(b.dataset.id) } }); B().coupons = o.coupons; SIDX = null; render(); toast('Deleted.'); } catch (e) { toast(e.message, true); } },
    'msg-status': async (b) => { try { await api('inbox/status', { body: { id: Number(b.dataset.id), status: b.dataset.s } }); V.inbox.draw(); refreshCounts(); } catch (e) { toast(e.message, true); } },
    'ord-set': async (b) => { const box = b.closest('.orderbox'); try { const o = await api('inbox/order', { body: { id: Number(b.dataset.id), status: $('[data-ordsel]', box).value, notify: $('[data-ordnotify]', box).checked ? 1 : 0 } }); toast(o.sent ? 'Order updated and customer emailed.' : 'Order updated.'); V.inbox.draw(); refreshCounts(); } catch (e) { toast(e.message, true); } },
    'msg-del': async (b) => { if (!(await ask('Delete this for good?', 'Delete', true))) return; try { await api('inbox/delete', { body: { id: Number(b.dataset.id) } }); V.inbox.draw(); refreshCounts(); } catch (e) { toast(e.message, true); } },
    'msg-reply': (b) => {
      const r = (S.tmp.inbox || []).find((x) => String(x.id) === b.dataset.id); const p = r.payload || {};
      const m = modal('<h2>Reply to ' + esc(p.name) + '</h2><p class="muted">Sent to ' + esc(p.email) + ' from your site email.</p><label>Subject<input type="text" id="rp-s" value="Re: your message to Imperial Blowork"></label><label>Message<textarea id="rp-b" rows="7"></textarea></label><div class="actions" style="justify-content:flex-end;margin-top:12px"><button class="btn ghost" data-x="0">Cancel</button><button class="btn" data-x="1">Send reply</button></div>', 'sm');
      m.el.addEventListener('click', async (e) => { const x = e.target.closest('[data-x]'); if (!x) return; if (x.dataset.x === '0') return m.close(); x.disabled = true; try { await api('inbox/reply', { body: { id: r.id, subject: $('#rp-s', m.el).value, body: $('#rp-b', m.el).value } }); m.close(); toast('Reply sent.'); V.inbox.draw(); } catch (er) { toast(er.message, true); x.disabled = false; } });
    },
    undo: (b) => undo(S.tmp.hist[Number(b.dataset.i)]),
    'backup-dl': async () => { try { const o = await api('backup'); const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([JSON.stringify(o.backup, null, 2)], { type: 'application/json' })); a.download = 'imperial-blowork-backup-' + new Date().toISOString().slice(0, 10) + '.json'; a.click(); toast('Backup downloaded.'); } catch (e) { toast(e.message, true); } },
    'tm-add': async () => { try { const o = await api('team/add', { body: { name: $('#tm-name').value, email: $('#tm-email').value, role: $('#tm-role').value } }); V.team.paint(o.team); toast('Invite sent.'); } catch (e) { toast(e.message, true); } },
    'tm-del': async (b) => { if (!(await ask('Remove this person?', 'Remove', true))) return; try { const o = await api('team/delete', { body: { id: Number(b.dataset.id) } }); V.team.paint(o.team); } catch (e) { toast(e.message, true); } },
    'test-email': async () => { try { const o = await api('test-email', { body: {} }); toast(o.message || 'Sent.'); } catch (e) { toast(e.message, true); } },
  };
  function moveProd(id, d) {
    const o = effOrder().slice(); const i = o.indexOf(String(id)); const j = i + d; if (i < 0 || j < 0 || j >= o.length) return;
    o.splice(i, 1); o.splice(j, 0, String(id)); S.st.order = same(o, B().products.map((p) => String(p.pid))) ? null : o; bar(); render();
  }
  async function refreshCounts() { try { const o = await api('bootstrap'); B().counts = o.counts; shellBadge(); } catch (e) { /* ignore */ } }
  function shellBadge() { const a = $('.nav a[data-r="inbox"]'); if (!a) return; const n = B().counts.new_messages + B().counts.new_carts; let b = $('.badge', a); if (b) b.remove(); if (n > 0) a.insertAdjacentHTML('beforeend', '<span class="badge">' + n + '</span>'); }
  document.addEventListener('click', async (e) => {
    const rb = e.target.closest('[data-rte]'); if (rb) { e.preventDefault(); rteAction(rb); return; }
    const a = e.target.closest('[data-act]');
    if (a && ACT[a.dataset.act]) { e.preventDefault(); try { await ACT[a.dataset.act](a); } catch (er) { toast(er.message, true); } return; }
    if (e.target.id === 'menu-btn') { $('#side').classList.toggle('open'); return; }
    if (e.target.id === 'logout') { try { await api('logout', { body: {} }); } catch (er) { /* ignore */ } location.reload(); }
  });
  document.addEventListener('mousedown', (e) => { if (e.target.closest && e.target.closest('.rte-bar button')) e.preventDefault(); });

  /* ================= BOOT ================= */
  async function boot() {
    if (!CFG.logged) return loginScreen();
    app.innerHTML = '<p class="muted" style="padding:40px">Loading...</p>';
    try { await load(); } catch (e) { return loginScreen(e.message); }
    shell(); render();
  }
  boot();
})();
