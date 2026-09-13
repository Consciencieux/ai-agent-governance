// PLAN-0055 Stage 4Q rebuild — INIT payload integrity (product_cli / must_ship adjacent).
// Gen1 suite archive deleted; extend from current INIT/payload obligations only.
"use strict";

const { spawnSync } = require("child_process");
const fs = require("fs");
const path = require("path");

module.exports = (test) => {
  test("payload: copied gate scripts' relative requires close under INSTALLED sources", () => {
    const sources = new Set(copiedScriptSources().map((s) => s.source.replace(/\\/g, "/")));
    const offenders = [];
    for (const { source } of copiedScriptSources()) {
      const normSource = source.replace(/\\/g, "/");
      const c = fs.readFileSync(path.join(SKILL_ROOT, source), "utf8");
      const dir = path.posix.dirname(normSource);
      for (const m of c.matchAll(/require\(\s*['"](\.[^'"]+)['"]\s*\)/g)) {
        const resolved = path.posix.normalize(path.posix.join(dir, m[1]));
        const candidates = resolved.endsWith(".js") ? [resolved] : [resolved, resolved + ".js"];
        if (!candidates.some((cand) => sources.has(cand))) offenders.push(`${normSource} -> ${m[1]}`);
      }
    }
    if (offenders.length) {
      console.error("  INSTALLED require closure broken:\n    " + offenders.join("\n    "));
      return false;
    }
    return true;
  });

  test("payload: init-spec copy list matches what INIT actually writes", () => {
    const dir = tmp("payload-list");
    const r = spawnSync(process.execPath, [GENERATOR, "--target", dir, "--project-name", "PayloadList", "--phase", "C"], {
      encoding: "utf8",
    });
    if (r.status !== 0) {
      console.error(r.stderr || r.stdout);
      return false;
    }
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
    const g = spawnSync(process.execPath, [GENERATOR, "--target", dir, "--project-name", "PayloadE2E", "--phase", "C"], {
      encoding: "utf8",
    });
    if (g.status !== 0) return false;
    for (const { target } of copiedScriptSources()) {
      const script = path.join(dir, target);
      if (!fs.existsSync(script)) return false;
      const src = fs.readFileSync(script, "utf8");
      for (const m of src.matchAll(/require\(\s*['"](\.[^'"]+)['"]\s*\)/g)) {
        const dep = path.resolve(path.dirname(script), m[1]);
        const withExt = fs.existsSync(dep) ? dep : dep + ".js";
        if (!fs.existsSync(withExt)) {
          console.error(`  ${target} requires ${m[1]}, absent from payload`);
          return false;
        }
      }
      const r = spawnSync(process.execPath, [script], { cwd: dir, encoding: "utf8" });
      const out = String(r.stdout || "") + String(r.stderr || "");
      if (/MODULE_NOT_FOUND|Cannot find module/.test(out)) {
        console.error(`  ${target} MODULE_NOT_FOUND in governed project`);
        return false;
      }
    }
    return true;
  });

  test("role completeness: every file under references/ and scripts/ carries a declared role", () => {
    const r = spawnSync(process.execPath, [ROLE_CHECK, "--gate", "--json"], { cwd: SKILL_ROOT, encoding: "utf8" });
    if (r.status !== 0) {
      console.error(r.stdout || r.stderr);
      return false;
    }
    const o = JSON.parse(r.stdout);
    return o.gatePass === true && o.counts.undecided === 0 && o.counts.installed > 0;
  });

  test("role completeness: an unclassified file under scripts/ fails the gate", () => {
    const dir = tmp("role-unclassified");
    fs.mkdirSync(path.join(dir, "references", "policies"), { recursive: true });
    fs.mkdirSync(path.join(dir, "scripts"), { recursive: true });
    fs.mkdirSync(path.join(dir, "repo-tools"), { recursive: true });
    write(path.join(dir, "references", "policies", "x.policy.md"), "# x\n");
    write(path.join(dir, "scripts", "stray.js"), "// unclassified\n");
    write(path.join(dir, "repo-tools", "package-skill.sh"), 'cp SKILL.md "$STAGING/"\ncp -R references "$STAGING/"\ncp -R scripts "$STAGING/"\n');
    write(
      path.join(dir, "references", "init-spec.json"),
      JSON.stringify({
        artifacts: [{ path: "docs/rules/x.md", source: "references/policies/x.policy.md", type: "copy" }],
        distribution: { skillInternal: ["references/init-spec.json", "repo-tools/package-skill.sh"], undecided: {} },
      })
    );
    const r = spawnSync(process.execPath, [ROLE_CHECK, "--gate", "--json"], { cwd: dir, encoding: "utf8" });
    if (r.status !== 1) return false;
    return JSON.parse(r.stdout).gateIssues.some((g) => g.kind === "unclassified" && g.item.includes("stray.js"));
  });
};
