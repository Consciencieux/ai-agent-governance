#!/usr/bin/env node
// Characterization for repo-tools/script-inventory.v0.json (PLAN-0041 / FINDING-0028).
// Fail closed: every scripts/ and repo-tools/ .js|.sh entry must be inventoried;
// every inventory path must exist; disposition enums must be known; retire set empty in v0.
"use strict";

const fs = require("fs");
const path = require("path");

const ROOT = path.join(__dirname, "..", "..");
const INV_PATH = path.join(ROOT, "repo-tools", "script-inventory.v0.json");

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

  test("script-inventory: necessity field present; retire only with necessity=retire (PLAN-0055)", () => {
    const inv = JSON.parse(fs.readFileSync(INV_PATH, "utf8"));
    const NEC = new Set(["must_ship", "product_cli", "repo_gate", "debt", "retire"]);
    for (const e of inv.entries) {
      if (!NEC.has(e.necessity)) {
        console.error("  bad necessity", e.path, e.necessity);
        return false;
      }
      if (e.disposition === "retire" && e.necessity !== "retire") {
        console.error("  disposition retire without necessity=retire:", e.path);
        return false;
      }
    }
    if (!inv.summary || !inv.summary.short_lists) {
      console.error("  missing summary.short_lists (minimum-necessary doctrine)");
      return false;
    }
    const sl = inv.summary.short_lists;
    if (!Array.isArray(sl.must_ship) || !Array.isArray(sl.product_cli) || !Array.isArray(sl.repo_gate)) {
      console.error("  short_lists incomplete", sl);
      return false;
    }
    return true;
  });

  test("script-inventory: summary.total matches entries.length (PLAN-0055 R4)", () => {
    const inv = JSON.parse(fs.readFileSync(INV_PATH, "utf8"));
    if (!inv.summary || inv.summary.total !== inv.entries.length) {
      console.error(
        "  summary.total",
        inv.summary && inv.summary.total,
        "!== entries.length",
        inv.entries.length
      );
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
      "scripts/generate-governance.js",
    ];
    if (wrap.join("|") !== want.join("|")) {
      console.error("  wrap set", wrap, "!==", want);
      return false;
    }
    return true;
  });

  test("script-inventory: package.json dogfood of INSTALLED CLIs is declared dual_profile", () => {
    const inv = JSON.parse(fs.readFileSync(INV_PATH, "utf8"));
    const pkg = JSON.parse(fs.readFileSync(path.join(ROOT, "package.json"), "utf8"));
    const scriptText = JSON.stringify(pkg.scripts || {});
    const called = new Set();
    for (const m of scriptText.matchAll(/(?:node\s+)?(scripts\/[^"'\s]+\.js)/g)) called.add(m[1]);
    const byPath = new Map(inv.entries.map((e) => [e.path, e]));
    for (const p of called) {
      const e = byPath.get(p);
      if (!e) {
        console.error("  package.json calls uninventoried", p);
        return false;
      }
      if (e.distribution_role !== "INSTALLED") continue;
      if (!e.dogfood_from_repo_package_json) {
        console.error("  INSTALLED dogfood undeclared:", p);
        return false;
      }
      if (e.generation !== "dual_profile") {
        console.error("  INSTALLED dogfood must be dual_profile:", p, e.generation);
        return false;
      }
    }
    const summary = (inv.summary && inv.summary.dogfood_installed_from_repo) || [];
    const expected = [...called].filter((p) => {
      const e = byPath.get(p);
      return e && e.distribution_role === "INSTALLED";
    }).sort();
    if (summary.slice().sort().join("|") !== expected.join("|")) {
      console.error("  summary.dogfood_installed_from_repo", summary, "!==", expected);
      return false;
    }
    return true;
  });
};
