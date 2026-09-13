// PLAN-0046 — instruction-surface 2.0 characterization:
// leaf schema, must-ship coverage inventory, no third disposition ledger.

const fs = require("fs");
const path = require("path");

const INV = path.join(SKILL_ROOT, "repo-tools/instruction-surface-leaves.v0.json");
const CAP_DIR = path.join(SKILL_ROOT, "references/capabilities");
const ADR24 = path.join(SKILL_ROOT, "docs/design-decisions/ADR-0024-gen2-product-freeze.md");

module.exports = (test) => {
  test("instruction-surface: inventory loads and lists leaves", () => {
    const inv = JSON.parse(fs.readFileSync(INV, "utf8"));
    if (!Array.isArray(inv.leaves) || inv.leaves.length < 1) {
      console.error("  inventory.leaves empty");
      return false;
    }
    if (!Array.isArray(inv.required_sections) || inv.required_sections.length < 5) {
      console.error("  required_sections incomplete");
      return false;
    }
    return true;
  });

  test("instruction-surface: every inventory path exists and carries required sections", () => {
    const inv = JSON.parse(fs.readFileSync(INV, "utf8"));
    for (const leaf of inv.leaves) {
      const abs = path.join(SKILL_ROOT, leaf.path);
      if (!fs.existsSync(abs)) {
        console.error("  missing " + leaf.path);
        return false;
      }
      const body = fs.readFileSync(abs, "utf8");
      for (const sec of inv.required_sections) {
        if (!body.includes(sec)) {
          console.error("  " + leaf.path + " missing " + sec);
          return false;
        }
      }
    }
    return true;
  });

  test("instruction-surface: capabilities dir has no orphan md outside inventory", () => {
    const inv = JSON.parse(fs.readFileSync(INV, "utf8"));
    const listed = new Set(inv.leaves.map((l) => path.basename(l.path)));
    for (const name of fs.readdirSync(CAP_DIR)) {
      if (!name.endsWith(".md")) continue;
      if (!listed.has(name)) {
        console.error("  orphan capability leaf not in inventory: " + name);
        return false;
      }
    }
    return true;
  });

  test("instruction-surface: must-ship leaves are covered (coverage map only)", () => {
    const inv = JSON.parse(fs.readFileSync(INV, "utf8"));
    const must = inv.leaves.filter((l) => l.disposition === "must-ship");
    if (must.length < 20) {
      console.error("  must-ship leaf count too low: " + must.length);
      return false;
    }
    if (!String(inv.index_pointer || "").includes("RESEARCH-0006")) {
      console.error("  inventory must point at RESEARCH-0006 as index, not mint disposition authority");
      return false;
    }
    if (!fs.existsSync(ADR24)) {
      console.error("  ADR-0024 missing at " + ADR24);
      return false;
    }
    const adr = fs.readFileSync(ADR24, "utf8");
    if (!/must-ship/.test(adr)) {
      console.error("  ADR-0024 missing must-ship vocabulary");
      return false;
    }
    return true;
  });

  test("instruction-surface: SKILL and AGENTS route to capabilities/", () => {
    const skill = fs.readFileSync(path.join(SKILL_ROOT, "SKILL.md"), "utf8");
    const agents = fs.readFileSync(path.join(SKILL_ROOT, "AGENTS.md"), "utf8");
    if (!/references\/capabilities\//.test(skill)) {
      console.error("  SKILL.md missing capabilities/ routing pointer");
      return false;
    }
    if (!/references\/capabilities\//.test(agents) && !/instruction-surface-leaves/.test(agents)) {
      console.error("  AGENTS.md missing capabilities/ or inventory pointer");
      return false;
    }
    return true;
  });
};
