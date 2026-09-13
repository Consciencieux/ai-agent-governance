// PLAN-0055 Stage 4Q rebuild — repo_gate smoke after docs/product migration.
// Script birth: check-doc-parity 2026-08-14 · check-layout-sync 2026-08-21 ·
// check-doc-consistency 2026-08-16 (path vacuous fixed Stage 4).
"use strict";

const { spawnSync } = require("child_process");
const path = require("path");

module.exports = (test) => {
  test("layout-sync: this repo's docs/product trees are applicable and pass", () => {
    const r = spawnSync(process.execPath, [LAYOUT_CHECK], { cwd: SKILL_ROOT, encoding: "utf8" });
    const out = String(r.stdout || "") + String(r.stderr || "");
    if (/not applicable/i.test(out)) {
      console.error("  layout-sync still vacuous on docs/product shape");
      return false;
    }
    return r.status === 0;
  });

  test("doc-parity: this repo's product trees pass", () => {
    const r = spawnSync(process.execPath, [PARITY_CHECK], { cwd: SKILL_ROOT, encoding: "utf8" });
    return r.status === 0;
  });

  test("doc-consistency --gate: this repo exits 0 (REPO dogfood)", () => {
    const cli = path.join(SKILL_ROOT, "repo-tools", "check-doc-consistency.js");
    const r = spawnSync(process.execPath, [cli, "--gate"], { cwd: SKILL_ROOT, encoding: "utf8" });
    if (r.status !== 0) console.error(r.stdout || r.stderr);
    return r.status === 0;
  });

  test("doc-consistency: parity is delegated (no embedded double-run)", () => {
    const cli = path.join(SKILL_ROOT, "repo-tools", "check-doc-consistency.js");
    const r = spawnSync(process.execPath, [cli, "--json"], { cwd: SKILL_ROOT, encoding: "utf8" });
    let j;
    try {
      j = JSON.parse(r.stdout);
    } catch {
      console.error("  expected JSON stdout, got:", r.stdout);
      return false;
    }
    return j.parity === "delegated";
  });
};
