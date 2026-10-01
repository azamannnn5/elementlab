// Guards the actual math in the reconstitution calculator, plus the
// mg/mcg mutual-exclusivity behavior (filling one should clear the
// other, so it's never ambiguous which dose the user meant).
const { makeDom, wait } = require("./helpers");

function setValue(doc, id, value) {
  const el = doc.getElementById(id);
  el.value = value;
  el.dispatchEvent(new el.ownerDocument.defaultView.Event("input", { bubbles: true }));
}

async function run() {
  const failures = [];

  const dom = makeDom("reconstitution-calculator.html", {
    fetchImpl: async () => ({ ok: false, status: 404, json: async () => ({}) }),
  });
  await wait(200);
  const doc = dom.window.document;

  // Matches the example values shown in the page's own placeholders:
  // syringe 1ml, 20mg vial, 2ml water, 2.5mg dose.
  // Expected: concentration = 10 mg/ml, volume = 0.25 ml, doses = 8.
  setValue(doc, "rc-syringe", "1");
  setValue(doc, "rc-vial", "20");
  setValue(doc, "rc-water", "2");
  setValue(doc, "rc-dose-mg", "2.5");
  await wait(50);

  const resultsEl = doc.getElementById("rc-results");
  if (resultsEl.style.display === "none") {
    failures.push("reconstitution-calculator.html: results should be visible once all fields are filled with valid values");
  }

  const volumeText = doc.getElementById("rc-result-volume").textContent;
  if (!volumeText.includes("0.250")) {
    failures.push(`reconstitution-calculator.html: expected volume "0.250 ml", got "${volumeText}"`);
  }
  const concentrationText = doc.getElementById("rc-result-concentration").textContent;
  if (!concentrationText.includes("10.00")) {
    failures.push(`reconstitution-calculator.html: expected concentration "10.00 mg/ml", got "${concentrationText}"`);
  }
  const dosesText = doc.getElementById("rc-result-doses").textContent;
  if (!dosesText.includes("8")) {
    failures.push(`reconstitution-calculator.html: expected "8 doses", got "${dosesText}"`);
  }
  const unitsText = doc.getElementById("rc-result-units").textContent;
  if (!unitsText.includes("25")) {
    failures.push(`reconstitution-calculator.html: expected "25 units" on a 1ml/100-unit syringe, got "${unitsText}"`);
  }

  // --- mg and mcg fields are mutually exclusive ---
  setValue(doc, "rc-dose-mcg", "500");
  await wait(50);
  const mgFieldAfter = doc.getElementById("rc-dose-mg").value;
  if (mgFieldAfter !== "") {
    failures.push(`reconstitution-calculator.html: filling the mcg field should clear the mg field, but mg field still has "${mgFieldAfter}"`);
  }

  // --- Dose larger than the whole vial is rejected with a clear error ---
  setValue(doc, "rc-dose-mcg", "");
  setValue(doc, "rc-dose-mg", "999");
  await wait(50);
  const errorEl = doc.getElementById("rc-error");
  if (errorEl.style.display === "none") {
    failures.push("reconstitution-calculator.html: a dose larger than the vial quantity should show an error");
  }

  dom.window.close();
  return failures;
}

module.exports = { name: "reconstitution-calculator", run };
