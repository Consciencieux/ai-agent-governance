// PLAN-0057 — capability enforcement JSON completeness.
// Does NOT prove agents complied with unmechanized / inherent_judgment rows.
"use strict";

const fs = require("fs");
const path = require("path");

const ROOT = path.join(__dirname, "..", "..");
const INV = path.join(ROOT, "references", "capabilities", "enforcement.v0.json");
const CAP = path.join(ROOT, "references", "capabilities");

const MODES = new Set(["mechanical", "require_review", "unmechanized", "inherent_judgment"]);
const RESULTS = new Set(["allow", "deny", "warn", "require_review"]);
const SCOPES = new Set(["installed", "repo_only"]);

function walkMd(dir) {
  const out = [];
  for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, ent.name);
    if (ent.isDirectory()) out.push(...walkMd(p));
    else if (ent.name.endsWith(".md")) out.push(path.relative(ROOT, p).split(path.sep).join("/"));
  }
  return out.sort();
}

module.exports = function register(test) {
  test("capability-enforcement: inventory loads", () => {
    const inv = JSON.parse(fs.readFileSync(INV, "utf8"));
    if (!Array.isArray(inv.entries) || inv.entries.length < 1) {
      console.error("  empty entries");
      return false;
    }
    return true;
  });

  test("capability-enforcement: every capability markdown is declared", () => {
    const inv = JSON.parse(fs.readFileSync(INV, "utf8"));
    const declared = new Set(inv.entries.map((e) => e.leaf));
    const onDisk = walkMd(CAP);
    const missing = onDisk.filter((p) => !declared.has(p));
    if (missing.length) {
      console.error("  on disk but not in inventory:\n    " + missing.join("\n    "));
      return false;
    }
    return true;
  });

  test("capability-enforcement: every declared leaf exists; no ## Enforcement dual-write", () => {
    const inv = JSON.parse(fs.readFileSync(INV, "utf8"));
    for (const e of inv.entries) {
      const abs = path.join(ROOT, e.leaf);
      if (!fs.existsSync(abs)) {
        console.error("  missing leaf", e.leaf);
        return false;
      }
      const body = fs.readFileSync(abs, "utf8");
      if (/^## Enforcement\s*$/m.test(body)) {
        console.error("  dual-write ## Enforcement in", e.leaf);
        return false;
      }
    }
    return true;
  });

  test("capability-enforcement: obligation rows valid; mechanical carriers exist", () => {
    const inv = JSON.parse(fs.readFileSync(INV, "utf8"));
    const ids = new Set();
    for (const e of inv.entries) {
      if (ids.has(e.id)) {
        console.error("  duplicate entry id", e.id);
        return false;
      }
      ids.add(e.id);
      if (!Array.isArray(e.obligations) || e.obligations.length < 1) {
        console.error("  no obligations", e.id);
        return false;
      }
      const oids = new Set();
      for (const o of e.obligations) {
        if (oids.has(o.id)) {
          console.error("  duplicate obligation", e.id, o.id);
          return false;
        }
        oids.add(o.id);
        if (!MODES.has(o.mode) || !RESULTS.has(o.result) || !SCOPES.has(o.scope)) {
          console.error("  bad enum", e.id, o.id, o.mode, o.result, o.scope);
          return false;
        }
        if (typeof o.mechanizable !== "boolean") {
          console.error("  mechanizable not boolean", e.id, o.id);
          return false;
        }
        if (o.mode === "mechanical") {
          if (!o.carrier || typeof o.carrier !== "string") {
            console.error("  mechanical missing carrier", e.id, o.id);
            return false;
          }
          if (!fs.existsSync(path.join(ROOT, o.carrier))) {
            console.error("  missing carrier", e.id, o.id, o.carrier);
            return false;
          }
          if (o.mechanizable !== true) {
            console.error("  mechanical must be mechanizable", e.id, o.id);
            return false;
          }
        }
        if (o.mode === "unmechanized") {
          if (o.carrier !== null) {
            console.error("  unmechanized must have null carrier", e.id, o.id);
            return false;
          }
          if (o.mechanizable !== true) {
            console.error("  unmechanized must be mechanizable", e.id, o.id);
            return false;
          }
        }
        if (o.mode === "inherent_judgment") {
          if (o.carrier !== null) {
            console.error("  inherent_judgment must have null carrier", e.id, o.id);
            return false;
          }
          if (o.mechanizable !== false) {
            console.error("  inherent_judgment must not claim mechanizable", e.id, o.id);
            return false;
          }
        }
        if (o.mode === "require_review" && o.result !== "require_review") {
          console.error("  require_review mode must use require_review result", e.id, o.id);
          return false;
        }
      }
    }
    return true;
  });
};
