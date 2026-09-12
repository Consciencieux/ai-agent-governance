#!/usr/bin/env node
// Characterization for docs/research/working/script-inventory.v0.json (PLAN-0041 / FINDING-0028).
// Fail closed: every scripts/ and repo-tools/ .js|.sh entry must be inventoried;
// every inventory path must exist; disposition enums must be known; retire set empty in v0.
"use strict";

const fs = require("fs");
const path = require("path");

const ROOT = path.join(__dirname, "..", "..");
const INV_PATH = path.join(ROOT, "docs", "research", "working", "script-inventory.v0.json");

const ROLE = new Set(["INSTALLED", "SKILL-INTERNAL", "REPO-ONLY"]);
const GEN = new Set(["gen1_carrier", "gen2_native", "dual_profile"]);
const DISP = new Set(["keep", "wrap", "extract", "rewrite", "retire", "undecided"]);

function walk(dir, out) {
  if (!fs.existsSync(dir)) return;
  for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, ent.name);
    if (ent.isDirectory()) walk(p, out);
    else if (/\.(js|sh)$/.test(ent.name)) out.push(path.relative(ROOT, p).split(path.sep).join("/"));
  }
}

module.exports = function register(test) {
  test("script-inventory: file loads and lists entries", () => {
    const inv = JSON.parse(fs.readFileSync(INV_PATH, "utf8"));
    if (!Array.isArray(inv.entries) || inv.entries.length < 1) {
      console.error("  empty entries");
      return false;
    }
    if (inv.baseline_ref !== "v1.0.2") {
      console.error("  expected baseline_ref v1.0.2, got", inv.baseline_ref);
      return false;
    }
    return true;
  });

  test("script-inventory: every scripts/ and repo-tools/ entry is declared", () => {
    const inv = JSON.parse(fs.readFileSync(INV_PATH, "utf8"));
    const declared = new Set(inv.entries.map((e) => e.path));
    const onDisk = [];
    walk(path.join(ROOT, "scripts"), onDisk);
    walk(path.join(ROOT, "repo-tools"), onDisk);
    const missing = onDisk.filter((p) => !declared.has(p));
    if (missing.length) {
      console.error("  on disk but not inventoried:\n    " + missing.join("\n    "));
      return false;
    }
    return true;
  });

  test("script-inventory: every declared path exists with valid enums", () => {
    const inv = JSON.parse(fs.readFileSync(INV_PATH, "utf8"));
    for (const e of inv.entries) {
      const abs = path.join(ROOT, e.path);
      if (!fs.existsSync(abs)) {
        console.error("  missing path:", e.path);
        return false;
      }
      if (!ROLE.has(e.distribution_role)) {
        console.error("  bad role", e.path, e.distribution_role);
        return false;
      }
      if (!GEN.has(e.generation)) {
        console.error("  bad generation", e.path, e.generation);
        return false;
      }
      if (!DISP.has(e.disposition)) {
        console.error("  bad disposition", e.path, e.disposition);
        return false;
      }
    }
    return true;
  });

  test("script-inventory: v0 has no retire rows (no quarantine shortcut)", () => {
    const inv = JSON.parse(fs.readFileSync(INV_PATH, "utf8"));
    const retire = inv.entries.filter((e) => e.disposition === "retire");
    if (retire.length) {
      console.error("  unexpected retire:", retire.map((e) => e.path));
      return false;
    }
    if ((inv.summary && inv.summary.retire && inv.summary.retire.length) || 0) {
      console.error("  summary.retire non-empty");
      return false;
    }
    return true;
  });

  test("script-inventory: wrap CLIs are the known Phase-4 shells", () => {
    const inv = JSON.parse(fs.readFileSync(INV_PATH, "utf8"));
    const wrap = inv.entries.filter((e) => e.disposition === "wrap").map((e) => e.path).sort();
    const want = [
      "scripts/check-doc-consistency.js",
      "scripts/check-doc-freshness.js",
      "scripts/check-secrets.js",
    ];
    if (wrap.join("|") !== want.join("|")) {
      console.error("  wrap set", wrap, "!==", want);
      return false;
    }
    return true;
  });
};
