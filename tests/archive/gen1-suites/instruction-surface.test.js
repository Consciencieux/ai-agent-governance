// PLAN-0046 — instruction-surface 2.0 characterization:
// leaf schema, must-ship coverage inventory, no third disposition ledger.

const { spawnSync } = require("child_process");
const fs = require("fs");
const path = require("path");

const INV = path.join(SKILL_ROOT, "repo-tools/instruction-surface-leaves.v0.json");
const CAP_DIR = path.join(SKILL_ROOT, "references/capabilities");
const ADR24 = path.join(SKILL_ROOT, "docs/design-decisions/ADR-0024-gen2-product-freeze.md");
const TAR = path.join(SKILL_ROOT, "dist", "ai-agent-governance-skill.tar.gz");

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

  // Y5 — clean-target leaf closure: package ships leaves; INIT installs them under
  // docs/rules/capabilities/ with required sections; bodies stay payload-portable.
  test("instruction-surface: clean-target INIT installs capability leaves (Y5)", () => {
    const inv = JSON.parse(fs.readFileSync(INV, "utf8"));
    const sh = findBashShell();
    if (!sh) return "skip: no bash for package-skill.sh";

    const pack = spawnSync(sh, ["repo-tools/package-skill.sh", "0.0.0-surface-y5"], {
      cwd: SKILL_ROOT,
      encoding: "utf8",
    });
    if (pack.status !== 0) {
      console.error("  package failed: " + (pack.stderr || pack.stdout || "").slice(0, 500));
      return false;
    }
    if (!fs.existsSync(TAR)) {
      console.error("  missing tarball " + TAR);
      return false;
    }
    const listing = spawnSync("tar", ["-tzf", TAR], { encoding: "utf8" });
    if (listing.status !== 0) {
      console.error("  tar list failed");
      return false;
    }
    const members = new Set(
      listing.stdout.split(/\r?\n/).filter(Boolean).map((m) => m.replace(/^\.\//, ""))
    );
    for (const leaf of inv.leaves) {
      if (!members.has(leaf.path)) {
        console.error("  tarball missing " + leaf.path);
        return false;
      }
    }

    const dir = tmp("instruction-surface-y5");
    const g = spawnSync(
      process.execPath,
      [GENERATOR, "--target", dir, "--project-name", "SurfaceY5", "--phase", "C"],
      { encoding: "utf8" }
    );
    if (g.status !== 0) {
      console.error("  INIT failed: " + (g.stderr || g.stdout || "").slice(0, 500));
      return false;
    }

    const installedRoot = path.join(dir, "docs/rules/capabilities");
    if (!fs.existsSync(installedRoot)) {
      console.error("  INIT did not create docs/rules/capabilities/");
      return false;
    }
    const leak = /references\/|repo-tools\/|SKILL\.md|npm run /;
    for (const leaf of inv.leaves) {
      const base = path.basename(leaf.path);
      const dest = path.join(installedRoot, base);
      if (!fs.existsSync(dest)) {
        console.error("  INIT missing installed leaf " + base);
        return false;
      }
      const body = fs.readFileSync(dest, "utf8");
      for (const sec of inv.required_sections) {
        if (!body.includes(sec)) {
          console.error("  installed " + base + " missing " + sec);
          return false;
        }
      }
      if (leak.test(body)) {
        console.error("  installed " + base + " leaks non-portable paths");
        return false;
      }
    }
    return true;
  });
};
