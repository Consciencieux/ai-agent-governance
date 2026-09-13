#!/usr/bin/env node
// PAYLOAD SCRIPT — sibling-instance closure carrier (FINDING-0003 / PLAN-0050).
// Self-contained: Node builtins only.
//
// Reads one or more sibling-closure contracts (JSON). Each contract declares
// instances that must all exist (paths relative to cwd). Missing instance → deny.
//
// Usage:
//   node scripts/check-sibling-closure.js [--json] [--contract <file>]...
//   node scripts/check-sibling-closure.js --dir <dir>
// Default dir: .governance/sibling-closure
// Exit 0 allow · 1 deny (missing/invalid) · 2 no contracts found (warn / require_review)

"use strict";

const fs = require("fs");
const path = require("path");

function printHelp() {
  console.log(`Usage:
  check-sibling-closure.js [--json] [--contract <file>]...
  check-sibling-closure.js [--json] [--dir <dir>]
Default --dir: .governance/sibling-closure
Exit: 0 all instances present · 1 missing/invalid · 2 no contracts (require_review)`);
}

function loadContract(file) {
  const raw = fs.readFileSync(file, "utf8");
  const doc = JSON.parse(raw);
  if (!doc || typeof doc !== "object") throw new Error(`${file}: not an object`);
  if (!doc.id || !Array.isArray(doc.instances)) {
    throw new Error(`${file}: requires id and instances[]`);
  }
  return { file, doc };
}

function collectContracts(argv) {
  const files = [];
  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === "--contract" && argv[i + 1]) {
      files.push(path.resolve(argv[++i]));
    }
  }
  if (files.length) return files;
  let dir = path.join(process.cwd(), ".governance", "sibling-closure");
  const di = argv.indexOf("--dir");
  if (di >= 0 && argv[di + 1]) dir = path.resolve(argv[di + 1]);
  if (!fs.existsSync(dir)) return [];
  return fs
    .readdirSync(dir)
    .filter((f) => f.endsWith(".json"))
    .map((f) => path.join(dir, f));
}

function evaluate(contracts, root) {
  const results = [];
  let decision = "allow";
  for (const { file, doc } of contracts) {
    const missing = [];
    const present = [];
    for (const inst of doc.instances) {
      const rel = typeof inst === "string" ? inst : inst && inst.path;
      if (!rel || typeof rel !== "string") {
        missing.push({ path: String(rel), error: "instance missing path" });
        continue;
      }
      if (rel.includes("..") || path.isAbsolute(rel)) {
        missing.push({ path: rel, error: "path must be repo-relative" });
        continue;
      }
      const abs = path.join(root, rel);
      if (fs.existsSync(abs)) present.push(rel);
      else missing.push({ path: rel, error: "missing" });
    }
    const ok = missing.length === 0;
    if (!ok) decision = "deny";
    results.push({
      id: doc.id,
      file: path.relative(root, file) || file,
      marking: doc.marking || "mechanical",
      enforcement: doc.enforcement || "deny",
      rule_ref: doc.rule_ref || null,
      ok,
      present,
      missing,
    });
  }
  return { decision, results };
}

if (process.argv.includes("--help") || process.argv.includes("-h")) {
  printHelp();
  process.exit(0);
}

const json = process.argv.includes("--json");
const root = process.cwd();
let contracts;
try {
  const files = collectContracts(process.argv.slice(2));
  if (!files.length) {
    const out = {
      decision: "require_review",
      reason: "no sibling-closure contracts found",
      results: [],
    };
    if (json) process.stdout.write(JSON.stringify(out, null, 2) + "\n");
    else console.error("check-sibling-closure: no contracts — require_review");
    process.exit(2);
  }
  contracts = files.map((f) => loadContract(f));
} catch (e) {
  if (json) {
    process.stdout.write(JSON.stringify({ decision: "deny", error: e.message }, null, 2) + "\n");
  } else {
    console.error(`check-sibling-closure: ${e.message}`);
  }
  process.exit(1);
}

const out = evaluate(contracts, root);
if (json) {
  process.stdout.write(JSON.stringify(out, null, 2) + "\n");
} else if (out.decision === "allow") {
  console.log(`check-sibling-closure: allow (${out.results.length} contract(s))`);
  for (const r of out.results) {
    console.log(`  ${r.id}: ${r.present.length} instance(s) present`);
  }
} else {
  console.error("check-sibling-closure: deny — missing sibling instances");
  for (const r of out.results) {
    if (r.ok) continue;
    for (const m of r.missing) {
      console.error(`  ${r.id}: ${m.path} (${m.error})`);
    }
  }
}

process.exit(out.decision === "allow" ? 0 : 1);
