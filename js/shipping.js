/* ElementLab Peptides - shipping
   Free at the admin-set subtotal threshold (FREE_SHIPPING_THRESHOLD_CENTS,
   see promo.js - defaults to $200 but is overridden by whatever's set in
   Site Settings). Below that, no dollar amount is calculated or shown at
   all - just "Shipping cost confirmed after order request", the same
   message for every country and address. No weight-based calculation, no
   separate international-vs-domestic distinction - there's no longer a
   cost difference to show between them. */

function calculateShipping(subtotalCents) {
  if (subtotalCents >= FREE_SHIPPING_THRESHOLD_CENTS) {
    return { cents: 0, isFree: true, label: "Free" };
  }
  return { cents: 0, isFree: false, label: "Shipping cost confirmed after order request" };
}
