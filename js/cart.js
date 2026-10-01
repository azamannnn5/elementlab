/* ElementLab Peptides - cart
   Cart items are one of two types:
   - product line: { type: "product", slug, dose, qty }
   - combo/bundle line: { type: "combo", slug, qty } - priced at the combo's
     bundleCents flat rate, not by summing components individually

   "Submit Order" sends a confirmation email to the customer and notifies
   the team inbox (contact@elementlabpeptides.com) via the confirm-order Netlify
   Function - see backend/README.md. */

const CART_KEY = "pf_cart_v2";

function getCart() {
  try {
    return JSON.parse(localStorage.getItem(CART_KEY)) || [];
  } catch {
    return [];
  }
}
function saveCart(cart) {
  localStorage.setItem(CART_KEY, JSON.stringify(cart));
  updateCartBadge();
}
function addToCart(slug, dose, qty = 1) {
  const cart = getCart();
  const existing = cart.find((i) => i.type === "product" && i.slug === slug && i.dose === dose);
  if (existing) existing.qty += qty;
  else cart.push({ type: "product", slug, dose, qty });
  saveCart(cart);
}
function addComboToCart(comboSlug, tierLabel, qty = 1) {
  const cart = getCart();
  const existing = cart.find((i) => i.type === "combo" && i.slug === comboSlug && i.tier === tierLabel);
  if (existing) existing.qty += qty;
  else cart.push({ type: "combo", slug: comboSlug, tier: tierLabel, qty });
  saveCart(cart);
}
function removeFromCart(index) {
  const cart = getCart();
  cart.splice(index, 1);
  saveCart(cart);
}

function clearCart() {
  saveCart([]);
}
function setQty(index, qty) {
  const cart = getCart();
  if (cart[index]) cart[index].qty = Math.max(1, qty);
  saveCart(cart);
}
function cartCount() {
  return getCart().reduce((sum, i) => sum + i.qty, 0);
}
function updateCartBadge() {
  const badge = document.getElementById("cart-count");
  if (!badge) return;
  const count = cartCount();
  badge.textContent = count;
  badge.style.display = count > 0 ? "flex" : "none";
}

function getComboTier(combo, tierLabel) {
  return combo.tiers.find((t) => t.label === tierLabel) || combo.tiers[0];
}

function lineUnitPriceCents(item) {
  if (item.type === "combo") {
    const c = getCombo(item.slug);
    if (!c) return 0;
    return getComboTier(c, item.tier).bundleCents;
  }
  const p = getProduct(item.slug);
  if (!p) return 0;
  const d = getDose(p, item.dose);
  return d ? d.priceCents : 0;
}

function cartEstimatedTotalCents() {
  return getCart().reduce((sum, item) => sum + lineUnitPriceCents(item) * item.qty, 0);
}

function cartOrderSummary() {
  return getCart()
    .map((item) => {
      if (item.type === "combo") {
        const c = getCombo(item.slug);
        if (!c) return null;
        return `${item.qty} x [Combo] ${c.name} (${item.tier}) - ${money(lineUnitPriceCents(item) * item.qty)}`;
      }
      const p = getProduct(item.slug);
      if (!p) return null;
      const lineTotal = lineUnitPriceCents(item) * item.qty;
      return `${item.qty} x ${p.name} (${item.dose}) - ${money(lineTotal)}`;
    })
    .filter(Boolean)
    .join("\n");
}

function submitOrder(details) {
  const summary = cartOrderSummary();
  if (!summary) return;

  const subtotal = cartEstimatedTotalCents();
  const discount = stackedDiscount(cartCount(), details.promo, details.payment);
  const discCents = discount ? discountCents(subtotal, discount) : 0;
  const afterDiscount = subtotal - discCents;
  const shipping = calculateShipping(afterDiscount);
  const total = afterDiscount;

  const messageLines = [
    "New order request:",
    summary,
    `Subtotal: ${money(subtotal)}`,
  ];
  if (discount) {
    // Every stacked discount gets its own line, so the team can see
    // exactly which ones applied on a given order (Mix & Match, promo
    // code, crypto, welcome - any combination).
    discount.discounts.forEach((d) => {
      messageLines.push(`Discount applied: ${d.label} (-${money(discountCents(subtotal, { pct: d.pct }))})`);
    });
  }
  messageLines.push(`Shipping: ${shipping.label}`);
  messageLines.push(`Estimated Total: ${money(total)}`);
  messageLines.push("");
  messageLines.push(`Name: ${details.name}`);
  messageLines.push(`Phone: ${details.phone}`);
  messageLines.push(`Email: ${details.email}`);
  messageLines.push(`Delivery Address: ${details.address}`);
  messageLines.push(`Country: ${details.country === "US" ? "United States" : "Other (international)"}`);
  messageLines.push(`Payment Method: ${details.payment}`);
  // Only echo the promo code into the order message if it actually
  // validated (right code, currently active, within its date window) -
  // an expired or mistyped code shouldn't show up looking legitimate.
  const validPromo = typeof matchPromoCode === "function" ? matchPromoCode(details.promo) : null;
  if (validPromo) messageLines.push(`Promo Code: ${validPromo.code.toUpperCase()} (${validPromo.pct}% off)`);
  if (details.insulated) messageLines.push("Insulated packaging: requested (free)");
  const message = messageLines.join("\n");

  const msg = document.querySelector("#order-form .form-msg");
  if (msg) {
    msg.textContent = "Order submitted - see the confirmation above.";
    msg.className = "form-msg show ok";
  }

  // The welcome discount now auto-applies whenever eligible, regardless
  // of what's typed in the Promo Code field (see promo.js for why) - so
  // it's marked used based on whether it was actually one of the
  // stacked discounts on this order, not by matching a typed code.
  if (discount && discount.discounts.some((d) => d.type === "email")) {
    markEmailDiscountUsed();
  }

  // Order handoff is email-based: this call sends a confirmation to the
  // customer AND notifies the team inbox (see confirm-order.js). It also
  // does the real server-side single-use check on the email discount code
  // (subscribers.discount_used in Supabase) - the localStorage check above
  // only stops the same browser from reusing it; this stops the same email
  // across devices. Fire-and-forget - never blocks or fails the on-page
  // confirmation above.
  try {
    fetch("/.netlify/functions/confirm-order", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: details.name,
        email: details.email,
        phone: details.phone,
        address: details.address,
        country: details.country,
        payment: details.payment,
        promoCode: details.promo || null,
        summary: message,
        items: cartOrderSummary(),
        subtotalCents: subtotal,
        discounts: discount ? discount.discounts.map((d) => ({
          label: d.label,
          cents: discountCents(subtotal, { pct: d.pct }),
        })) : [],
        usedWelcomeDiscount: discount ? discount.discounts.some((d) => d.type === "email") : false,
        discountCents: discCents,
        shippingCents: 0,
        shippingLabel: shipping.label,
        totalCents: total,
        total: money(total),
      }),
    }).catch(() => {});
  } catch (err) {
    // Backend not connected yet - the on-page confirmation above still shows.
  }

  clearCart();
}

document.addEventListener("DOMContentLoaded", () => {
  updateCartBadge();
});

// Event delegation: works for Add to Cart buttons injected after page load
// (product.js, shop.js, and combos.js render their markup dynamically)
document.addEventListener("click", (e) => {
  const comboBtn = e.target.closest("[data-add-combo]");
  if (comboBtn) {
    e.preventDefault();
    const comboSlug = comboBtn.dataset.addCombo;
    const tierSelect = document.getElementById(`tier-${comboSlug}`);
    const tier = tierSelect ? tierSelect.value : comboBtn.dataset.tier;
    addComboToCart(comboSlug, tier);
    const original = comboBtn.textContent;
    comboBtn.textContent = "Added ✓";
    setTimeout(() => (comboBtn.textContent = original), 1200);
    return;
  }

  const btn = e.target.closest("[data-add-to-cart]");
  if (!btn) return;
  e.preventDefault();
  const slug = btn.dataset.addToCart;
  const doseSelect = document.getElementById(`dose-${slug}`);
  const dose = doseSelect ? doseSelect.value : btn.dataset.dose;
  const qtyInput = document.getElementById(`qty-${slug}`);
  const qty = qtyInput ? parseInt(qtyInput.value, 10) || 1 : 1;
  addToCart(slug, dose, qty);
  const original = btn.textContent;
  btn.textContent = "Added ✓";
  setTimeout(() => (btn.textContent = original), 1200);
});
