#!/usr/bin/env node
// Coding Hygiene Check — governs THIS repo's test architecture (anti-patch plan §5).
// It ships inside the payload tarball because packaging copies scripts/ wholesale, but it
// is NOT declared in references/init-spec.json, so INIT never installs or runs it in a
// governed project. Shape-guard below: without tests/run-tests.js AND tests/suites/ the
// check reports "not applicable" and exits 0 — a governed project must never see a
// failure from a check that does not describe its layout.
// Checks the mechanically verifiable subset of §5; each states the problem it solves and
// why it is the narrowest solution (engineering-restraint machinery test):
//   1. single-discovery entry — run-tests.js must not register tests anymore (monolith
//      regressions silently reintroduce the 2500-line file; the split deletes on move).
//      Narrowest: count test registrations in that one file, quote-style agnostic.
//   2. domain ownership — every tests/suites/*.test.js must carry at least one test
//      registration (an empty suite is a partition bug, tests were lost on migration).
//      Narrowest: per-file registration count > 0; non-suite files (fixtures, README)
//      are out of scope by extension.
//   3. unexplained residue — TODO/FIXME/HACK markers without an owner in current-layer
//      governance surfaces (scripts/, references/, tests/ excluding suite fixtures) are
//      unadjudicated patch debt. Narrowest: markers lacking "(owner)"; report-only
//      (advisory class — wording/ownership is a human judgement, never gate it here).
// NOT verifiable/refused to fake: "root cause is truly correct" / semantic quality of
// a fix / "before-fix fail" of historical commits — those stay judgement + evidence.
// Usage: node scripts/check-coding-hygiene.js [--json] [--gate]
// Exit: --gate fails only on checks 1-2 (mechanical); 3 is advisory (exit 0).
const fs = require("fs");
const path = require("path");

const ROOT = process.cwd();
const RUN_TESTS = path.join(ROOT, "tests", "run-tests.js");
const SUITES_DIR = path.join(ROOT, "tests", "suites");
const SCAN_DIRS = ["scripts", "references", "tests"];
// A test registration in any quote style — a monolith that re-registers with single
// quotes or template literals must not slip past check 1 (found by review).
const TEST_REGISTRATION = /^\s*test\(\s*["'`]/gm;

function countRegistrations(src) {
  return (String(src || "").match(TEST_REGISTRATION) || []).length;
}

function read(p) {
  try { return fs.readFileSync(p, "utf8"); } catch { return null; }
}

function walk(dir, base = dir) {
  const out = [];
  let entries;
  try { entries = fs.readdirSync(dir, { withFileTypes: true }); } catch { return out; }
  for (const e of entries) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) out.push(...walk(p, base));
    else if (/\.(js|ts|md|json)$/.test(e.name)) out.push(path.relative(base, p).replace(/\\/g, "/"));
  }
  return out;
}

function main() {
  const json = process.argv.includes("--json");
  const gate = process.argv.includes("--gate");
  const issues = { monolith_registration: [], empty_suite: [], unresolved_marker: [] };
  const gateIssues = [];

  // Shape guard: this check describes a suite-split test layout. A project without both
  // tests/run-tests.js and tests/suites/ (every governed project) is out of scope —
  // report not-applicable and exit 0 rather than inventing a violation.
  const applicable = fs.existsSync(RUN_TESTS) || fs.existsSync(SUITES_DIR);
  if (!applicable) {
    const out = { timestamp: new Date().toISOString(), applicable: false, issues, gate, gatePass: true, gateIssues, unresolvedMarkerCount: 0 };
    if (json) process.stdout.write(JSON.stringify(out, null, 2) + "\n");
    else console.log("✓ coding hygiene: not applicable (no suite-split test layout)");
    process.exit(0);
  }

  // 1. single discovery entry
  const runSrc = read(RUN_TESTS);
  if (runSrc === null) {
    issues.monolith_registration.push("tests/run-tests.js missing");
    gateIssues.push({ kind: "monolith_registration", item: "tests/run-tests.js missing" });
  } else {
    const regs = countRegistrations(runSrc);
    if (regs > 0) {
      const item = `tests/run-tests.js still registers ${regs} test(s) — move them into tests/suites/`;
      issues.monolith_registration.push(item);
      gateIssues.push({ kind: "monolith_registration", item });
    }
  }

  // 2. domain ownership — every SUITE FILE (*.test.js only; fixtures/READMEs are not
  //    suites — scoping to .md/.json too made a legitimate helper file fail the gate)
  if (fs.existsSync(SUITES_DIR)) {
    for (const rel of walk(SUITES_DIR).filter((r) => r.endsWith(".test.js"))) {
      const n = countRegistrations(read(path.join(SUITES_DIR, rel)));
      if (n === 0) {
        const item = `tests/suites/${rel} registers 0 tests`;
        issues.empty_suite.push(item);
        gateIssues.push({ kind: "empty_suite", item });
      }
    }
  }

  // 3. unexplained residue — marker without owner (advisory). Test fixtures are excluded:
  //    a marker inside a test's fixture string is test DATA, not patch debt (same reason
  //    check-secrets.js treats tests/ as repo infrastructure).
  for (const dir of SCAN_DIRS) {
    const abs = path.join(ROOT, dir);
    if (!fs.existsSync(abs)) continue;
    for (const rel of walk(abs)) {
      if (dir === "tests" && /(^|\/)suites\//.test(rel)) continue; // suite fixtures
      const c = read(path.join(abs, rel));
      if (!c) continue;
      const lines = c.split(/\r?\n/);
      lines.forEach((l, i) => {
        // template-contract text (feature-doc placeholder instructs the USER to fill in)
        if (l.includes("TODO: 业务确定后填充")) return;
        // owner form TODO(name) / TODO(name@host.tld) / TODO(#123) is adjudicated
        const m = l.match(/(\/\/|\/\*|\*|#|<!--)\s*(?:TODO|FIXME|HACK)(?!\s*\([^)\n]+\))/);
        if (m) issues.unresolved_marker.push(`${dir}/${rel}:${i + 1}`);
      });
    }
  }

  const report = { timestamp: new Date().toISOString(), applicable: true, issues, gate, gatePass: gateIssues.length === 0, gateIssues, unresolvedMarkerCount: issues.unresolved_marker.length };
  if (json) {
    process.stdout.write(JSON.stringify(report, null, 2) + "\n");
  } else {
    for (const g of gateIssues) console.log(`✗ ${g.item}`);
    if (issues.unresolved_marker.length > 0) {
      console.log(`⚠ ${issues.unresolved_marker.length} unresolved TODO/FIXME/HACK marker(s) (advisory)`);
      for (const m of issues.unresolved_marker.slice(0, 5)) console.log("  - " + m);
    }
    if (gateIssues.length === 0) console.log("✓ coding hygiene: no mechanical violations");
  }
  process.exit(gate && gateIssues.length > 0 ? 1 : 0);
}

main();
