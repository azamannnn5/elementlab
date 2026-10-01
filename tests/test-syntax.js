// Cheap, fast smoke test: catches typos/syntax errors before they ever
// reach a browser. Checks every standalone .js file plus every inline
// <script>...</script> block in the built HTML pages.
const fs = require("fs");
const path = require("path");
const vm = require("vm");
const { ROOT } = require("./helpers");

function checkSyntax(code, label, failures) {
  try {
    new vm.Script(code, { filename: label });
  } catch (err) {
    failures.push(`${label}: ${err.message}`);
  }
}

async function run() {
  const failures = [];

  const jsDir = path.join(ROOT, "js");
  for (const file of fs.readdirSync(jsDir)) {
    if (!file.endsWith(".js")) continue;
    const code = fs.readFileSync(path.join(jsDir, file), "utf8");
    checkSyntax(code, `js/${file}`, failures);
  }

  const backendDir = path.join(ROOT, "backend", "netlify", "functions");
  if (fs.existsSync(backendDir)) {
    for (const file of fs.readdirSync(backendDir)) {
      if (!file.endsWith(".js")) continue;
      const code = fs.readFileSync(path.join(backendDir, file), "utf8");
      checkSyntax(code, `backend/netlify/functions/${file}`, failures);
    }
  }

  const htmlFiles = fs.readdirSync(ROOT).filter((f) => f.endsWith(".html"));
  for (const file of htmlFiles) {
    const html = fs.readFileSync(path.join(ROOT, file), "utf8");
    const scripts = [...html.matchAll(/<script>([\s\S]*?)<\/script>/g)];
    scripts.forEach((m, i) => checkSyntax(m[1], `${file} (inline script #${i + 1})`, failures));
  }

  return failures;
}

module.exports = { name: "syntax-check", run };
