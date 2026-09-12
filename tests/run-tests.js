#!/usr/bin/env node
// Test harness for the governance scripts — verify_governance.js, check-lock.js,
// check-git-policy.js, check-secrets.js, check-doc-parity.js, release-manager.js.
// Plain Node, no dependencies.
// Usage: npm test   (or: node tests/run-tests.js)
//        node tests/run-tests.js --suite <name>   (one domain suite; dev loop only)
//        node tests/run-tests.js --list           (canonical suite names, SUITES order)
// Structure (anti-patch plan §3): this file is the single discovery entry — it owns the
// runner and the summary only. Shared fixtures/helpers live in tests/support/helpers.js;
// tests live in tests/suites/*.test.js and receive the registrar via module.exports.
// The support module is mirrored onto global so suites read helpers by bare name, exactly
// as they did inside the former single file.
//
// `--suite` is the domain-level runnable entry promised by anti-patch plan §3. It is a
// MANUAL dev-loop shortcut, never automatic scope routing: `npm test` and `npm run check`
// stay full, no gate selects a subset, and nothing infers a suite from a diff. Full
// regression before release/audit/commit is unchanged by design.

const H = require("./support/helpers");
for (const n of Object.keys(H)) {
  if (typeof global[n] === "undefined") global[n] = H[n];
}

const tests = [];
function test(name, fn) {
  tests.push({ name, fn });
}

const SUITES = [
  "./suites/validator.test.js",
  "./suites/security.test.js",
  "./suites/consistency.test.js",
  "./suites/docs.test.js",
  "./suites/release.test.js",
  "./suites/generator.test.js",
  "./suites/payload.test.js",
  "./suites/hygiene.test.js",
  "./suites/narration.test.js",
  "./suites/sync.test.js",
  "./suites/plan-delivery.test.js",
  "./suites/routing.test.js",
];

// Canonical suite name = path and `.test.js` stripped. This is the ONLY accepted form:
// `docs.test.js` and `./suites/docs.test.js` are rejected so a second naming rule cannot
// come into existence.
const canonical = (p) => p.replace(/^\.\/suites\//, "").replace(/\.test\.js$/, "");
const suiteNames = SUITES.map(canonical);

const argv = process.argv.slice(2);
if (argv.includes("--list")) {
  // Declaration order, never sorted: the output doubles as the visible registration order.
  for (const n of suiteNames) console.log(n);
  process.exit(0);
}

const suiteIdx = argv.indexOf("--suite");
let selected = SUITES;
if (suiteIdx >= 0) {
  const want = argv[suiteIdx + 1];
  if (!want || want.startsWith("--")) {
    console.error("--suite requires a suite name (see --list)");
    process.exit(1);
  }
  // `all` resolves to the untouched SUITES list — the same array the no-arg path uses, so
  // there is exactly one full-run code path.
  if (want !== "all") {
    const hit = SUITES.find((p) => canonical(p) === want);
    if (!hit) {
      console.error(`unknown suite: ${want}`);
      console.error(`available: ${suiteNames.join(", ")}`);
      process.exit(1);
    }
    selected = [hit];
  }
}

for (const s of selected) require(s)(test);

// ---------- runner (must stay after ALL test registrations) ----------
let failed = 0;
let skipped = 0;
for (const t of tests) {
  let ok;
  try {
    ok = t.fn();
  } catch (e) {
    ok = false;
    console.error(`  threw: ${e.message}`);
  }
  // A test may return a string starting with "skip:" — a platform limitation, not a
  // pass. Without this channel a skip printed `(skipped: ...)` and returned true, so the
  // 294/294 summary counted it as covered while nothing was asserted (audit 2026-09-07).
  if (typeof ok === "string" && ok.startsWith("skip:")) {
    console.log(`△ ${t.name} — ${ok.slice(5)}`);
    skipped += 1;
    continue;
  }
  if (ok) {
    console.log(`✓ ${t.name}`);
  } else {
    console.log(`✗ ${t.name}`);
    failed += 1;
  }
}

H.cleanup();

console.log(`\n${tests.length - failed - skipped}/${tests.length} tests passed, ${skipped} skipped.`);
process.exit(failed === 0 ? 0 : 1);

