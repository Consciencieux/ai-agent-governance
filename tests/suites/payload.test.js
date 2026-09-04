// tests/suites/payload.test.js — batch-1 migration from tests/run-tests.js (anti-patch plan §3).
// Verbatim region move (marker-to-marker); helper consolidation into tests/support/ is batch 2.


const { spawnSync } = require("child_process");
const fs = require("fs");
const path = require("path");

module.exports = (test) => {
// Why: init-spec.json copies gate scripts into governed projects FILE BY FILE, so each
// one must be self-contained. A shared-library refactor once broke this (scripts started
// requiring ./_lib.js, which was never added to the copy list) and the whole suite stayed
// green, because tests only ever ran inside this repo where the helper sits next door.
// Two layers: a static invariant check (precise) and an end-to-end run (trusts nothing).

const SKILL_ROOT = path.join(__dirname, "..", "..");

function copiedScriptSources() {
  const spec = JSON.parse(fs.readFileSync(path.join(SKILL_ROOT, "references", "init-spec.json"), "utf8"));
  return spec.artifacts
    .filter((a) => a.type === "copy" && a.path.startsWith("scripts/"))
    .map((a) => ({ source: a.source, target: a.path }));
}

test("payload: copied gate scripts declare no local require (self-containment)", () => {
  const offenders = [];
  for (const { source } of copiedScriptSources()) {
    const c = fs.readFileSync(path.join(SKILL_ROOT, source), "utf8");
    // relative requires only — node builtins ("fs", "path") are always available
    for (const m of c.matchAll(/require\(\s*['"](\.[^'"]+)['"]\s*\)/g)) {
      offenders.push(`${source} -> ${m[1]}`);
    }
  }
  if (offenders.length > 0) {
    console.error("  copied scripts must be self-contained; found: " + offenders.join("; "));
    return false;
  }
  return offenders.length === 0;
});

test("payload: init-spec copy list matches what INIT actually writes", () => {
  const dir = tmp("payload-list");
  const r = spawnSync(process.execPath, [GENERATOR, "--target", dir, "--project-name", "PayloadList", "--phase", "C"], { encoding: "utf8" });
  if (r.status !== 0) return false;
  for (const { target } of copiedScriptSources()) {
    if (!fs.existsSync(path.join(dir, target))) {
      console.error("  declared in init-spec but not written by INIT: " + target);
      return false;
    }
  }
  return true;
});

test("payload: every copied gate script loads in a governed project (no MODULE_NOT_FOUND)", () => {
  const dir = tmp("payload-e2e");
  const g = spawnSync(process.execPath, [GENERATOR, "--target", dir, "--project-name", "PayloadE2E", "--phase", "C"], { encoding: "utf8" });
  if (g.status !== 0) return false;
  for (const { target } of copiedScriptSources()) {
    const script = path.join(dir, target);
    if (!fs.existsSync(script)) return false;

    // Two probes, because neither alone is sufficient:
    //
    // (a) Module resolution. `--check` only parses; it does NOT resolve require()
    //     targets, so a missing dependency slips through. Loading the module for
    //     real is the only way to prove its requires resolve — but a plain run can
    //     exit early on unrelated grounds (check-sync bails out with "cannot
    //     determine task-start SHA" before reaching any interesting code), which is
    //     exactly how a broken payload could look healthy. So resolution is probed
    //     directly via require.resolve on each declared dependency.
    const src = fs.readFileSync(script, "utf8");
    for (const m of src.matchAll(/require\(\s*['"](\.[^'"]+)['"]\s*\)/g)) {
      const dep = path.resolve(path.dirname(script), m[1]);
      const withExt = fs.existsSync(dep) ? dep : dep + ".js";
      if (!fs.existsSync(withExt)) {
        console.error(`  ${target} requires ${m[1]}, which is absent from the payload`);
        return false;
      }
    }

    // (b) Actually execute it. Exit code is NOT asserted — outside a git repo several
    //     gates legitimately exit 1 — but a module-resolution crash must never appear.
    const r = spawnSync(process.execPath, [script], { cwd: dir, encoding: "utf8" });
    const out = String(r.stdout || "") + String(r.stderr || "");
    if (/MODULE_NOT_FOUND|Cannot find module/.test(out)) {
      console.error(`  ${target} crashed on module resolution in the governed project`);
      return false;
    }
  }
  return true;
});

};
