// PLAN-0055 Stage 4Q rebuild — must_ship generate-governance.js (born 2026-08-21).
// Gen1 suite archive deleted; extend from current INIT obligations only.
"use strict";

const { spawnSync } = require("child_process");
const fs = require("fs");
const path = require("path");

module.exports = (test) => {
  test("generate-governance: Phase A creates expected file tree", () => {
    const dir = tmp("gen-tree");
    const r = spawnSync(process.execPath, [GENERATOR, "--target", dir, "--project-name", "TestApp", "--phase", "A"], {
      encoding: "utf8",
    });
    if (r.status !== 0) {
      console.error(r.stderr || r.stdout);
      return false;
    }
    const expected = ["AGENTS.md", "CHANGELOG.md", "docs/ARCHITECTURE.md", "docs/plans/DEVELOPMENT_PLAN.md"];
    return expected.every((e) => fs.existsSync(path.join(dir, e)));
  });

  test("generate-governance: determinism — same inputs produce byte-identical trees", () => {
    const d1 = tmp("gen-det-a");
    const d2 = tmp("gen-det-b");
    const args = (d) => [GENERATOR, "--target", d, "--project-name", "DetTest", "--phase", "A"];
    const a = spawnSync(process.execPath, args(d1), { encoding: "utf8" });
    const b = spawnSync(process.execPath, args(d2), { encoding: "utf8" });
    if (a.status !== 0 || b.status !== 0) return false;
    const f1 = listFiles(d1).map((f) => path.relative(d1, f)).sort();
    const f2 = listFiles(d2).map((f) => path.relative(d2, f)).sort();
    if (f1.length !== f2.length || f1.length === 0) return false;
    for (let i = 0; i < f1.length; i++) {
      if (f1[i] !== f2[i]) return false;
      if (!fs.readFileSync(path.join(d1, f1[i])).equals(fs.readFileSync(path.join(d2, f2[i])))) return false;
    }
    return true;
  });

  test("generate-governance: missing --project-name exits 2", () => {
    const dir = tmp("gen-noname");
    const r = spawnSync(process.execPath, [GENERATOR, "--target", dir, "--phase", "A"], { encoding: "utf8" });
    return r.status === 2;
  });

  test("generate-governance: --dry-run creates nothing", () => {
    const dir = tmp("gen-dry");
    const before = listFiles(dir);
    const r = spawnSync(
      process.execPath,
      [GENERATOR, "--target", dir, "--project-name", "Dry", "--phase", "A", "--dry-run"],
      { encoding: "utf8" }
    );
    if (r.status !== 0) return false;
    return listFiles(dir).length === before.length;
  });

  test("generate-governance: Phase B output loads without MODULE_NOT_FOUND under verify_governance", () => {
    const dir = tmp("gen-verify");
    const g = spawnSync(process.execPath, [GENERATOR, "--target", dir, "--project-name", "VerifyMe", "--phase", "B"], {
      encoding: "utf8",
    });
    if (g.status !== 0) {
      console.error(g.stderr || g.stdout);
      return false;
    }
    const r = spawnSync(process.execPath, [VALIDATOR], { cwd: dir, encoding: "utf8" });
    const out = String(r.stdout || "") + String(r.stderr || "");
    return !/MODULE_NOT_FOUND|Cannot find module/i.test(out);
  });
};
