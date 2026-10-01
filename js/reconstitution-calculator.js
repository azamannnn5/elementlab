// js/reconstitution-calculator.js
// Pure client-side math - no backend, nothing to fetch, nothing to save.
// See pages/reconstitution-calculator.html for the markup this drives.

(function () {
  const syringeEl = document.getElementById("rc-syringe");
  const vialEl = document.getElementById("rc-vial");
  const waterEl = document.getElementById("rc-water");
  const doseMgEl = document.getElementById("rc-dose-mg");
  const doseMcgEl = document.getElementById("rc-dose-mcg");
  const errorEl = document.getElementById("rc-error");
  const resultsEl = document.getElementById("rc-results");
  if (!syringeEl) return; // not on this page

  const volumeEl = document.getElementById("rc-result-volume");
  const unitsEl = document.getElementById("rc-result-units");
  const concentrationEl = document.getElementById("rc-result-concentration");
  const dosesEl = document.getElementById("rc-result-doses");

  function showError(msg) {
    errorEl.textContent = msg;
    errorEl.style.display = "block";
    resultsEl.style.display = "none";
  }

  function clearError() {
    errorEl.style.display = "none";
  }

  // Prevent filling both dose fields at once, which would leave it
  // ambiguous which one the user actually meant - clearing the other
  // field is simpler and less surprising than silently picking one.
  doseMgEl.addEventListener("input", () => { if (doseMgEl.value) doseMcgEl.value = ""; calculate(); });
  doseMcgEl.addEventListener("input", () => { if (doseMcgEl.value) doseMgEl.value = ""; calculate(); });
  [syringeEl, vialEl, waterEl].forEach((el) => el.addEventListener("input", calculate));

  function calculate() {
    const syringeMl = parseFloat(syringeEl.value);
    const vialMg = parseFloat(vialEl.value);
    const waterMl = parseFloat(waterEl.value);
    const doseMg = parseFloat(doseMgEl.value);
    const doseMcg = parseFloat(doseMcgEl.value);

    const haveDose = !isNaN(doseMg) || !isNaN(doseMcg);
    if (isNaN(vialMg) || isNaN(waterMl) || !haveDose) {
      clearError();
      resultsEl.style.display = "none";
      return; // not enough entered yet, just wait quietly rather than nag
    }

    if (vialMg <= 0 || waterMl <= 0) {
      showError("Vial quantity and water volume must be greater than zero.");
      return;
    }

    // Normalize the dose to mg regardless of which field was filled.
    const doseInMg = !isNaN(doseMg) ? doseMg : doseMcg / 1000;
    if (doseInMg <= 0) {
      showError("Desired dosage must be greater than zero.");
      return;
    }

    const concentrationMgPerMl = vialMg / waterMl; // mg per ml once reconstituted
    const volumeMl = doseInMg / concentrationMgPerMl; // ml to draw for this dose
    const totalDoses = vialMg / doseInMg;

    if (doseInMg > vialMg) {
      showError("Desired dosage is larger than the total amount of peptide in the vial.");
      return;
    }

    clearError();
    resultsEl.style.display = "block";

    // Show the draw volume in whichever unit is easiest to read on a
    // syringe - insulin syringes are usually marked in "units" (100
    // units = 1ml) as well as ml, so show both when a syringe size was
    // given, since that's what someone is actually lining the plunger
    // up against.
    volumeEl.textContent = `${volumeMl.toFixed(3)} ml`;
    if (!isNaN(syringeMl) && syringeMl > 0) {
      const units = (volumeMl / syringeMl) * 100; // "units" scale, assuming a 100-unit syringe barrel
      unitsEl.textContent = `≈ ${Math.round(units)} units on a 100-unit (${syringeMl}ml) syringe`;
      if (volumeMl > syringeMl) {
        unitsEl.textContent += " - exceeds your syringe size, split across multiple draws";
        unitsEl.style.color = "var(--danger)";
      } else {
        unitsEl.style.color = "";
      }
    } else {
      unitsEl.textContent = "Enter your syringe size to see this in units";
    }

    concentrationEl.textContent = `${concentrationMgPerMl.toFixed(2)} mg/ml`;
    dosesEl.textContent = `${Math.floor(totalDoses)} doses`;
  }

  // Optional deep-link from a product page: reconstitution-calculator.html?vial=20
  // pre-fills the vial quantity so a customer doesn't have to look it up
  // and retype it. See product.js for where this link gets built.
  const params = new URLSearchParams(window.location.search);
  const vialParam = params.get("vial");
  if (vialParam && !isNaN(parseFloat(vialParam))) {
    vialEl.value = parseFloat(vialParam);
  }
})();
