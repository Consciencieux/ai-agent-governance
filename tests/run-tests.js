#!/usr/bin/env node
// Test harness for the governance scripts — verify_governance.js, check-lock.js,
// check-git-policy.js, check-secrets.js, check-doc-parity.js, release-manager.js.
// Plain Node, no dependencies.
// Usage: npm test   (or: node tests/run-tests.js)
// Structure (anti-patch plan §3): this file is the single discovery entry — it owns the
// runner and the summary only. Shared fixtures/helpers live in tests/support/helpers.js;
// tests live in tests/suites/*.test.js and receive the registrar via module.exports.
// The support module is mirrored onto global so suites read helpers by bare name, exactly
// as they did inside the former single file.

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
];
for (const s of SUITES) require(s)(test);

// ---------- runner (must stay after ALL test registrations) ----------
let failed = 0;
for (const t of tests) {
  let ok;
  try {
    ok = t.fn();
  } catch (e) {
    ok = false;
    console.error(`  threw: ${e.message}`);
  }
  if (ok) {
    console.log(`✓ ${t.name}`);
  } else {
    console.log(`✗ ${t.name}`);
    failed += 1;
  }
}

H.cleanup();

console.log(`\n${tests.length - failed}/${tests.length} tests passed.`);
process.exit(failed === 0 ? 0 : 1);

