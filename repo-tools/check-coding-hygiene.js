#!/usr/bin/env node
// Coding Hygiene Check — governs THIS repo's test architecture (anti-patch plan §5).
// REPO-ONLY: lives under repo-tools/, which the packaging step cannot reach — it never
// travels in the tarball and never reaches a governed project. Shape-guard below still
// applies: without tests/run-tests.js AND tests/suites/ the check reports "not applicable"
// and exits 0 (a guarded baseline, kept per engineering restraint — it costs nothing and
// protects against a future file wrongly moved back into a shipped dir).
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
//      governance surfaces (scripts/, repo-tools/, repo-workflows/, references/, tests/
//      excluding suite fixtures) are
//      unadjudicated patch debt. Narrowest: markers lacking "(owner)"; report-only
//      (advisory class — wording/ownership is a human judgement, never gate it here).
// NOT verifiable/refused to fake: "root cause is truly correct" / semantic quality of
// a fix / "before-fix fail" of historical commits — those stay judgement + evidence.
// Usage: node repo-tools/check-coding-hygiene.js [--json] [--gate]
// Exit: --gate fails only on checks 1-2 (mechanical); 3 is advisory (exit 0).
const fs = require("fs");
const path = require("path");

const ROOT = process.cwd();
const RUN_TESTS = path.join(ROOT, "tests", "run-tests.js");
const SUITES_DIR = path.join(ROOT, "tests", "suites");
// Residue scanning covers every source tree this repository maintains. `repo-tools/`
// joined the list when the payload/repo-tools boundary split moved six gate scripts out
// of `scripts/`: for that window the gates themselves — including this one — were the only
// JavaScript in the repo exempt from the hygiene check, because the enumeration still
// named the directory they had left. Same defect class as the release sync points that
// listed five sources while the gate verified two (v0.13.1 follow-up): a rule declares a
// set, the mechanism silently covers a subset. Adding a directory to the repo means adding
// it here.
const SCAN_DIRS = ["scripts", "repo-tools", "repo-workflows", "references", "tests"];
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

  // 4. deletion/rename hygiene (consent-and-change-hygiene plan §2). When a
  // .governance/change-hygiene.json exists, reconcile declared deletions/renames
  // against the actual git diff. Advisory only — the plan's own Risks section
  // warns that requiring migration files for every internal rename creates false
  // positives, so this check is intentionally narrow: it only reports when a
  // declaration is missing for a deletion/rename that actually happened, or when
  // a declared migration file does not exist. It does NOT require declarations
  // for every change — that would be the false-positive risk the plan flagged.
  const HYGIENE_FILE = path.join(ROOT, ".governance", "change-hygiene.json");
  if (fs.existsSync(HYGIENE_FILE)) {
    let hygiene;
    try { hygiene = JSON.parse(fs.readFileSync(HYGIENE_FILE, "utf8")); } catch { hygiene = null; }
    if (hygiene) {
      const { spawnSync } = require("child_process");
      const deletions = Array.isArray(hygiene.deletions) ? hygiene.deletions : [];
      const renames = Array.isArray(hygiene.renames) ? hygiene.renames : [];
      const declaredDeletions = new Set(deletions.map((d) => d.path));
      const declaredRenames = new Set(renames.map((r) => r.from));

      // Check each declared migration file exists
      for (const d of deletions) {
        if (d.migration && !fs.existsSync(path.join(ROOT, d.migration))) {
          issues.unresolved_marker.push(`change-hygiene: declared migration for ${d.path} (${d.migration}) not found`);
        }
      }

      // Check declared references exist
      for (const d of [...deletions, ...renames]) {
        for (const ref of (d.references || [])) {
          if (!fs.existsSync(path.join(ROOT, ref))) {
            issues.unresolved_marker.push(`change-hygiene: ${d.path} references ${ref} which does not exist`);
          }
        }
      }

      // Run git diff to find undeclared deletions/renames
      const diff = spawnSync("git", ["diff", "--name-status", "--find-renames", "HEAD"], { cwd: ROOT, encoding: "utf8" });
      if (diff.status === 0 && diff.stdout) {
        for (const line of diff.stdout.split("\n").filter(Boolean)) {
          const parts = line.split("\t");
          const status = parts[0] || "";
          const oldPath = parts[1];
          const newPath = parts[2]; // only present for renames
          if (!oldPath) continue;
          // Status: D=deletion, R<number>=rename (e.g. R100), A=addition, M=modification
          const isDeletion = status === "D" || status.startsWith("R");
          if (isDeletion && !declaredDeletions.has(oldPath) && !declaredRenames.has(oldPath)) {
            const renamesMatch = renames.some((r) => r.from === oldPath || r.to === oldPath || r.to === newPath);
            if (!renamesMatch) {
              issues.unresolved_marker.push(`change-hygiene: undeclared deletion/rename: ${oldPath} (${status}) — add to change-hygiene.json`);
            }
          }
        }
      }
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
