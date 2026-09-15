#!/usr/bin/env node
// PAYLOAD SCRIPT — discoverable MIGRATE / upgrade entry ( / H2d).
// Self-contained: Node builtins only.
//
// Compares.governance/manifest.json governance_version to an expected version
// (package.json version of the skill/repo, or --expect). Prints a migration
// checklist; does not auto-mutate the tree.
//
// Usage:
// node scripts/migrate-governance.js [--json] [--expect <semver>]
// Exit: 0 up-to-date · 2 upgrade advised · 1 error

"use strict";

const fs = require("fs");
const path = require("path");

function printHelp() {
  console.log(`Usage:
  migrate-governance.js [--json] [--expect <semver>]
Exit: 0 current · 2 upgrade advised · 1 error
Does not modify files; prints a checklist for human/agent-driven migration.`);
}

function readJson(p) {
  return JSON.parse(fs.readFileSync(p, "utf8"));
}

function argValue(flag) {
  const i = process.argv.indexOf(flag);
  if (i < 0 || i + 1 >= process.argv.length) return null;
  return process.argv[i + 1];
}

function parseSemver(s) {
  const m = String(s || "").trim().match(/^(\d+)\.(\d+)\.(\d+)/);
  if (!m) return null;
  return { major: +m[1], minor: +m[2], patch: +m[3], raw: `${m[1]}.${m[2]}.${m[3]}` };
}

function cmp(a, b) {
  if (a.major !== b.major) return a.major < b.major ? -1 : 1;
  if (a.minor !== b.minor) return a.minor < b.minor ? -1 : 1;
  if (a.patch !== b.patch) return a.patch < b.patch ? -1 : 1;
  return 0;
}

if (process.argv.includes("--help") || process.argv.includes("-h")) {
  printHelp();
  process.exit(0);
}

const root = process.cwd();
const json = process.argv.includes("--json");
const manifestPath = path.join(root, ".governance", "manifest.json");
const pkgPath = path.join(root, "package.json");

let current = null;
let expectRaw = argValue("--expect");
let error = null;

try {
  if (fs.existsSync(manifestPath)) {
    const man = readJson(manifestPath);
    current = man.governance_version || man.version || null;
  }
  if (!expectRaw && fs.existsSync(pkgPath)) {
    expectRaw = readJson(pkgPath).version || null;
  }
} catch (e) {
  error = e.message;
}

if (error) {
  if (json) process.stdout.write(JSON.stringify({ ok: false, error }, null, 2) + "\n");
  else console.error(`migrate-governance: ${error}`);
  process.exit(1);
}

if (!current) {
  const out = {
    ok: false,
    status: "no_manifest",
    current: null,
    expect: expectRaw,
    checklist: [
      "Run INIT / generate-governance to create .governance/manifest.json",
      "Re-run: node scripts/migrate-governance.js",
    ],
  };
  if (json) process.stdout.write(JSON.stringify(out, null, 2) + "\n");
  else {
    console.error("migrate-governance: no .governance/manifest.json governance_version");
    for (const c of out.checklist) console.error(`  - ${c}`);
  }
  process.exit(2);
}

if (!expectRaw) {
  if (json) {
    process.stdout.write(
      JSON.stringify({ ok: false, error: "no expected version (pass --expect or package.json)" }, null, 2) +
        "\n"
    );
  } else console.error("migrate-governance: pass --expect <semver> or provide package.json");
  process.exit(1);
}

const cur = parseSemver(current);
const exp = parseSemver(expectRaw);
if (!cur || !exp) {
  if (json) {
    process.stdout.write(
      JSON.stringify({ ok: false, error: "unparseable semver", current, expect: expectRaw }, null, 2) +
        "\n"
    );
  } else console.error(`migrate-governance: bad semver current=${current} expect=${expectRaw}`);
  process.exit(1);
}

const order = cmp(cur, exp);
const upToDate = order >= 0;
const checklist = upToDate
  ? ["No migration required", `governance_version ${cur.raw} >= expect ${exp.raw}`]
  : [
      `Upgrade governance_version ${cur.raw} → ${exp.raw}`,
      "Read skill CHANGELOG / migration notes for the version range",
      "Re-run INIT Phase C or apply documented file migrations",
      "node scripts/verify-governance.js (or project equivalent)",
      "node scripts/check-sibling-closure.js (if contracts present)",
      "Update .governance/manifest.json governance_version only after checks pass",
    ];

const out = {
  ok: true,
  status: upToDate ? "current" : "upgrade_advised",
  current: cur.raw,
  expect: exp.raw,
  checklist,
};

if (json) process.stdout.write(JSON.stringify(out, null, 2) + "\n");
else {
  console.log(`migrate-governance: ${out.status} (current ${out.current}, expect ${out.expect})`);
  for (const c of checklist) console.log(`  - ${c}`);
}

process.exit(upToDate ? 0 : 2);
