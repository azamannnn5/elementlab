/* Imperial Blowork storefront logic: products, product page, cart, checkout, carousel, scroll text. */
(function () {
  'use strict';
  const $ = (s, r) => (r || document).querySelector(s);
  const $$ = (s, r) => Array.from((r || document).querySelectorAll(s));
  const money = (n) => '$' + Number(n).toLocaleString('en-US', { maximumFractionDigits: 2 });
  const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const CART_KEY = 'ib_cart_v1';
  const params = new URLSearchParams(location.search);
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function load() { try { return JSON.parse(localStorage.getItem(CART_KEY)) || []; } catch (e) { return []; } }
  function save(c) { try { localStorage.setItem(CART_KEY, JSON.stringify(c)); } catch (e) { /* private mode */ } }
  let cart = load().filter((l) => PRODUCTS.some((p) => p.id === l.id));
  const byId = (id) => PRODUCTS.find((p) => p.id === id);
  const lineUnit = (l) => { const p = byId(l.id); return l.opt === 'kit' && p.kit ? p.kit : p.price; };
  const totals = () => ({ n: cart.reduce((s, l) => s + l.qty, 0), sub: cart.reduce((s, l) => s + lineUnit(l) * l.qty, 0) });

  /* ---------- top bar + menu ---------- */
  const bar = $('#bar');
  const onScroll = () => bar.classList.toggle('solid', window.scrollY > 40);
  onScroll();
  const overlay = $('#overlay'), openBtn = $('#menu-open');
  function setMenu(open) {
    overlay.classList.toggle('open', open);
    overlay.setAttribute('aria-hidden', String(!open));
    openBtn.setAttribute('aria-expanded', String(open));
    document.body.style.overflow = open ? 'hidden' : '';
  }
  openBtn.addEventListener('click', () => setMenu(true));
  $('#menu-close').addEventListener('click', () => setMenu(false));
  overlay.addEventListener('click', (e) => { if (e.target.closest('a')) setMenu(false); });
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') setMenu(false); });
  const dropBtn = $('#drop-btn');
  dropBtn.addEventListener('click', () => {
    const open = dropBtn.getAttribute('aria-expanded') !== 'true';
    dropBtn.setAttribute('aria-expanded', String(open));
    $('#drop').classList.toggle('open', open);
  });
  if (document.body.classList.contains('p-products')) { dropBtn.setAttribute('aria-expanded', 'true'); $('#drop').classList.add('open'); }

  /* ---------- cart state + badges ---------- */
  function addToCart(id, opt, qty) {
    const l = cart.find((x) => x.id === id && x.opt === opt);
    if (l) l.qty = Math.min(99, l.qty + qty); else cart.push({ id, opt, qty });
    save(cart); badges(); toast(byId(id).name + ' added to cart');
  }
  function badges() {
    const t = totals();
    $('#bar-count').textContent = t.n;
    const pill = $('#pill');
    pill.hidden = t.n === 0 || document.body.classList.contains('p-cart');
    $('#pill-text').textContent = t.n + (t.n === 1 ? ' item' : ' items');
    $('#pill-total').textContent = money(t.sub);
  }

  /* ---------- cards ---------- */
  const priceLabel = (p) => `${p.kit ? '<small>From</small>' : ''}${money(p.price)}`;
  function cardHtml(p) {
    const meta = [p.strength, p.form].filter(Boolean).join(' · ');
    return `<article class="card">
      <a class="card-open" href="product.html?id=${encodeURIComponent(p.id)}" aria-label="View ${esc(p.name)}">
        <div class="card-img"><img src="${p.img}" alt="${esc(p.name)}" loading="lazy" width="400" height="400"></div>
        <h3>${esc(p.name)}</h3>
        <p class="meta">${esc(meta)}</p>
      </a>
      <p class="price">${priceLabel(p)}</p>
      <button class="btn btn-red" data-add="${p.id}">Add to cart</button>
    </article>`;
  }
  document.addEventListener('click', (e) => {
    const add = e.target.closest('[data-add]');
    if (add) addToCart(add.dataset.add, 'single', 1);
  });

  /* ---------- products page ---------- */
  const grid = $('#grid');
  if (grid && document.body.classList.contains('p-products')) {
    const chips = $('#chips'), blurb = $('#cat-blurb'), empty = $('#empty'), search = $('#search'), title = $('#lu-title');
    let activeCat = params.get('c') || 'all';
    if (activeCat !== 'all' && !CATEGORIES.some((c) => c.id === activeCat)) activeCat = 'all';
    const renderChips = () => {
      chips.innerHTML = [{ id: 'all', name: 'All' }].concat(CATEGORIES).map((c) =>
        `<button class="chip" data-cat="${c.id}" aria-pressed="${c.id === activeCat}">${esc(c.name)}</button>`).join('');
    };
    const render = () => {
      const q = search.value.trim().toLowerCase();
      let list = PRODUCTS.filter((p) => activeCat === 'all' || p.cat === activeCat);
      if (q) list = PRODUCTS.filter((p) => (p.name + ' ' + p.short + ' ' + p.specs.map((s) => s[1]).join(' ')).toLowerCase().includes(q));
      grid.innerHTML = list.map(cardHtml).join('');
      empty.hidden = list.length > 0;
      const c = CATEGORIES.find((x) => x.id === activeCat);
      title.textContent = q ? 'Search results' : (c ? c.name : 'All products');
      blurb.textContent = q ? `${list.length} result${list.length === 1 ? '' : 's'} for "${search.value.trim()}"` : (c ? c.blurb : 'Every product in one place.');
      document.title = (q ? 'Search' : (c ? c.name : 'All products')) + ' | Imperial Blowork';
    };
    chips.addEventListener('click', (e) => {
      const b = e.target.closest('.chip'); if (!b) return;
      activeCat = b.dataset.cat; search.value = '';
      history.replaceState(null, '', 'products.html?c=' + activeCat);
      renderChips(); render();
    });
    search.addEventListener('input', () => { renderChips(); render(); });
    renderChips(); render();
  }

  /* ---------- price board ---------- */
  const boardEl = $('#board');
  if (boardEl) {
    const peps = PRODUCTS.filter((p) => p.cat === 'peptides');
    const order = ['rt10', 'rt20', 'rt30', '|', 'klow', 'ghk', 'ipa-cjc10', 'bpc10', '|', 'mots-c-10', 'nad', 'tesa20', 'glutathione-750', 'bac-water'];
    let html = '<div class="board-head"><span>Peptides</span><span>Single</span><span>10 pack</span></div>';
    order.forEach((id) => {
      if (id === '|') { html += '<div class="board-sep"></div>'; return; }
      const p = peps.find((x) => x.id === id); if (!p) return;
      html += `<a class="board-row" href="product.html?id=${p.id}"><span class="nm">${esc(p.name)}</span><span class="p">${money(p.price)}</span><span class="p ${p.kit ? '' : 'none'}">${p.kit ? money(p.kit) : '-'}</span></a>`;
    });
    boardEl.innerHTML = html;
  }

  /* ---------- product page ---------- */
  if (document.body.classList.contains('p-product')) {
    const cur = byId(params.get('id') || '');
    if (!cur) { $('#pd-missing').hidden = false; }
    else {
      let curOpt = 'single', curQty = 1;
      const cat = CATEGORIES.find((c) => c.id === cur.cat);
      document.title = cur.name + ' | Imperial Blowork';
      const md = document.querySelector('meta[name=description]'); if (md) md.content = cur.short;
      $('#pdp').hidden = false;
      $('#pd-img').src = cur.img; $('#pd-img').alt = cur.name;
      $('#pd-cat').textContent = cat.name; $('#pd-cat').href = 'products.html?c=' + cat.id;
      $('#pd-name').textContent = cur.name;
      $('#crumbs').innerHTML = `<a href="products.html?c=all">Products</a><span>/</span><a href="products.html?c=${cat.id}">${esc(cat.name)}</a><span>/</span><b>${esc(cur.name)}</b>`;
      $('#pd-desc').innerHTML = cur.desc.map((t) => `<p>${esc(t)}</p>`).join('');
      $('#pd-specs').innerHTML = cur.specs.map((s) => `<div><dt>${esc(s[0])}</dt><dd>${esc(s[1])}</dd></div>`).join('');
      $('#pd-recs').innerHTML = cur.recs.map((t) => `<li>${esc(t)}</li>`).join('');
      const opts = $('#pd-opts');
      if (cur.kit) {
        opts.hidden = false;
        opts.innerHTML = '<button type="button" data-opt="single" aria-pressed="true">Single vial</button><button type="button" data-opt="kit" aria-pressed="false">10-pack</button>';
      }
      const unit = () => (curOpt === 'kit' ? cur.kit : cur.price);
      const refresh = () => {
        $('#pd-price').textContent = money(unit()) + (cur.kit ? (curOpt === 'kit' ? ' per 10-pack' : ' per vial') : '');
        $('#q-val').textContent = curQty;
        $$('#pd-opts button').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.opt === curOpt)));
        $('#pd-add').textContent = 'Add to cart · ' + money(unit() * curQty);
      };
      opts.addEventListener('click', (e) => { const b = e.target.closest('[data-opt]'); if (!b) return; curOpt = b.dataset.opt; refresh(); });
      $('#q-minus').addEventListener('click', () => { curQty = Math.max(1, curQty - 1); refresh(); });
      $('#q-plus').addEventListener('click', () => { curQty = Math.min(99, curQty + 1); refresh(); });
      $('#pd-add').addEventListener('click', () => addToCart(cur.id, curOpt, curQty));
      refresh();
      let rel = (cur.related || []).map(byId).filter(Boolean);
      if (rel.length < 3) rel = rel.concat(PRODUCTS.filter((p) => p.id !== cur.id && !rel.includes(p) && p.cat !== cur.cat).slice(0, 3 - rel.length));
      $('#rel-grid').innerHTML = rel.map(cardHtml).join('');
      $('#pd-rel').hidden = false;
    }
  }

  /* ---------- cart page ---------- */
  const list = $('#cart-list');
  function summaryText() {
    if (!cart.length) return 'No items';
    const lines = cart.map((l) => { const p = byId(l.id); return `${l.qty} x ${p.name}${l.opt === 'kit' ? ' (10-pack)' : ''} @ ${money(lineUnit(l))} = ${money(lineUnit(l) * l.qty)}`; });
    return lines.join('\n') + '\nSubtotal: ' + money(totals().sub);
  }
  function renderCart() {
    list.innerHTML = cart.map((l, i) => {
      const p = byId(l.id), u = lineUnit(l);
      return `<li data-i="${i}">
        <a href="product.html?id=${p.id}"><img src="${p.img}" alt=""></a>
        <div class="ci-name"><a href="product.html?id=${p.id}">${esc(p.name)}</a><small>${l.opt === 'kit' ? '10-pack' : esc(p.form || '')}</small></div>
        <div class="ci-row"><span class="qty"><button data-dec aria-label="Less">&minus;</button><span>${l.qty}</span><button data-inc aria-label="More">+</button></span>
        <span><span class="ci-price">${money(u * l.qty)}</span><button class="ci-x" data-rm>Remove</button></span></div>
      </li>`;
    }).join('');
    const t = totals();
    $('#cart-empty').hidden = t.n > 0;
    $('#cart-total').hidden = t.n === 0; $('#cart-note').hidden = t.n === 0;
    $('#subtotal').textContent = money(t.sub);
    const mn = $('#min-note'), short = MIN_ORDER - t.sub;
    mn.hidden = t.n === 0 || short <= 0;
    mn.textContent = `Minimum order is ${money(MIN_ORDER)}. Add ${money(short)} more to check out.`;
    const btn = $('#submit-btn');
    btn.classList.toggle('is-off', t.n === 0 || short > 0);
    badges();
  }
  if (list) {
    list.addEventListener('click', (e) => {
      const li = e.target.closest('li'); if (!li) return;
      const i = +li.dataset.i, l = cart[i];
      if (e.target.closest('[data-inc]')) l.qty = Math.min(99, l.qty + 1);
      else if (e.target.closest('[data-dec]')) l.qty = Math.max(1, l.qty - 1);
      else if (e.target.closest('[data-rm]')) cart.splice(i, 1);
      else return;
      save(cart); renderCart();
    });
    renderCart();

    const form = $('#checkout-form'), msg = $('#form-msg');
    const say = (text, kind) => { msg.hidden = false; msg.className = 'form-msg ' + (kind || ''); msg.textContent = text; msg.scrollIntoView({ block: 'center', behavior: reduce ? 'auto' : 'smooth' }); };
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const t = totals();
      if (!cart.length) { say('Your cart is empty. Add at least one product first.', 'err'); return; }
      if (t.sub < MIN_ORDER) { say(`Minimum order is ${money(MIN_ORDER)}. Add ${money(MIN_ORDER - t.sub)} more to check out.`, 'err'); return; }
      if (!$$('input[name=payment_options]:checked', form).length) { say('Please choose at least one payment option.', 'err'); return; }
      $('#cart-summary').value = summaryText();
      const btn = $('#submit-btn'); btn.disabled = true; btn.textContent = 'Sending...';
      try {
        const fd = new FormData(form);
        const payload = { name: fd.get('name'), email: fd.get('email'), phone: fd.get('phone') || '', address: fd.get('address'),
          payment_options: fd.getAll('payment_options'), agree: fd.get('agree') || '', bot_field: fd.get('bot-field') || '',
          cart: cart.map((l) => ({ id: l.id, opt: l.opt, qty: l.qty })), cart_summary: summaryText() };
        const res = await fetch(IB_API + '/checkout', { method: 'POST', headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' }, body: JSON.stringify(payload) });
        const out = await res.json().catch(() => ({}));
        if (!res.ok || !out.ok) { const er = new Error('bad status'); if (res.status === 400 && out.message) er.userMessage = out.message; throw er; }
        cart = []; save(cart); renderCart(); form.reset();
        say('Your cart has been sent. We will reply shortly to confirm your items, total and payment.', 'ok');
      } catch (err) {
        say(err.userMessage || 'We could not send that right now. Please try again, or reach us through the Contact page.', 'err');
      } finally { btn.disabled = false; btn.textContent = 'Check out'; }
    });
  }

  /* ---------- contact form ---------- */
  const cform = $('#contact-form');
  if (cform) {
    cform.addEventListener('submit', async (e) => {
      e.preventDefault();
      const m = $('#contact-msg'), btn = $('#contact-btn'); btn.disabled = true; btn.textContent = 'Sending...';
      try {
        const fd = new FormData(cform);
        const payload = { name: fd.get('name'), email: fd.get('email'), order_reference: fd.get('order_reference') || '', message: fd.get('message'), bot_field: fd.get('bot-field') || '' };
        const res = await fetch(IB_API + '/contact', { method: 'POST', headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' }, body: JSON.stringify(payload) });
        const out = await res.json().catch(() => ({}));
        if (!res.ok || !out.ok) { const er = new Error('bad'); if (res.status === 400 && out.message) er.userMessage = out.message; throw er; }
        cform.reset(); m.className = 'form-msg ok'; m.textContent = 'Message sent. We will reply by email.';
      } catch (err) { m.className = 'form-msg err'; m.textContent = err.userMessage || 'We could not send that right now. Please try again shortly.'; }
      m.hidden = false; btn.disabled = false; btn.textContent = 'Send message';
    });
  }

  /* ---------- swipe carousel (auto-advance, centre slide highlighted) ---------- */
  const swipe = $('#swipe');
  if (swipe) {
    const slides = $$('.slide', swipe), n = slides.length, dots = $('#swipe-dots');
    let idx = 0, timer = null, startX = null;
    dots.innerHTML = slides.map((_, i) => `<button aria-label="Show photo ${i + 1}" data-i="${i}"></button>`).join('');
    const place = () => {
      slides.forEach((s, i) => {
        const d = ((i - idx + n + Math.floor(n / 2)) % n) - Math.floor(n / 2);
        s.dataset.pos = d === 0 ? 'cur' : (d < 0 ? 'prev' : 'next');
        s.classList.toggle('is-on', d === 0);
        s.setAttribute('aria-hidden', String(d !== 0));
      });
      $$('button', dots).forEach((b, i) => b.classList.toggle('on', i === idx));
    };
    const go = (i) => { idx = (i + n) % n; place(); };
    const play = () => { if (reduce) return; clearInterval(timer); timer = setInterval(() => go(idx + 1), 3200); };
    dots.addEventListener('click', (e) => { const b = e.target.closest('button'); if (b) { go(+b.dataset.i); play(); } });
    swipe.addEventListener('pointerdown', (e) => { startX = e.clientX; clearInterval(timer); });
    swipe.addEventListener('pointerup', (e) => {
      if (startX !== null) { const dx = e.clientX - startX; if (Math.abs(dx) > 40) go(idx + (dx < 0 ? 1 : -1)); }
      startX = null; play();
    });
    swipe.addEventListener('pointerleave', () => { startX = null; });
    swipe.addEventListener('mouseenter', () => clearInterval(timer));
    swipe.addEventListener('mouseleave', play);
    slides.forEach((s, i) => s.addEventListener('click', () => { if (i !== idx) { go(i); play(); } }));
    place();
    new IntersectionObserver((en) => { if (en[0].isIntersecting) play(); else clearInterval(timer); }).observe(swipe);
  }

  /* split headings into words so they rise in one by one */
  $$('.split').forEach((h) => {
    const words = h.textContent.trim().split(/\s+/);
    h.innerHTML = words.map((w, i) => `<span class="w" style="--d:${i * 70}ms"><span>${esc(w)}</span></span>`).join(' ');
  });

  window.addEventListener('scroll', onScroll, { passive: true });

  /* ---------- toast + reveal ---------- */
  let tt;
  function toast(t) { const el = $('#toast'); el.textContent = t; el.classList.add('show'); clearTimeout(tt); tt = setTimeout(() => el.classList.remove('show'), 1800); }
  const io = new IntersectionObserver((en) => en.forEach((x) => { if (x.isIntersecting) { x.target.classList.add('in'); io.unobserve(x.target); } }), { threshold: 0.12 });
  $$('.reveal').forEach((el) => io.observe(el));

  badges();
})();
