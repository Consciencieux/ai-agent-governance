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


test("payload: INIT installs the protected-files list the installed check reads", () => {
    const dir = tmp("payload-protected-list");
    const g = spawnSync(process.execPath, [GENERATOR, "--target", dir, "--project-name", "ProtList", "--phase", "C"], { encoding: "utf8" });
    if (g.status !== 0) return false;
    const installed = path.join(dir, "docs", "rules", "governance-files.md");
    if (!fs.existsSync(installed)) return false;
    const body = fs.readFileSync(installed, "utf8");
    if (!body.includes("AGENTS.md") || !body.includes("check-secrets.js")) return false;
    const run = spawnSync(process.execPath, [path.join(dir, "scripts", "check-doc-consistency.js"), "--gate", "--json"], { cwd: dir, encoding: "utf8" });
    if (run.status !== 0) return false;
    return JSON.parse(run.stdout).gatePass === true;
  });

  test("payload: a governed project missing the protected list fails loudly, not silently", () => {
    const dir = tmp("payload-protected-missing");
    spawnSync(process.execPath, [GENERATOR, "--target", dir, "--project-name", "NoList", "--phase", "C"], { encoding: "utf8" });
    fs.unlinkSync(path.join(dir, "docs", "rules", "governance-files.md"));
    const run = spawnSync(process.execPath, [path.join(dir, "scripts", "check-doc-consistency.js"), "--release-gate", "--json"], { cwd: dir, encoding: "utf8" });
    if (run.status !== 1) return false;
    return JSON.parse(run.stdout).issues.protected_lists.some((i) => i.includes("source missing"));
  });

  test("payload: INIT installs the feature-doc template SKILL.md tells agents to copy", () => {
    const dir = tmp("payload-feature-template");
    const g = spawnSync(process.execPath, [GENERATOR, "--target", dir, "--project-name", "FeatTpl", "--phase", "C"], { encoding: "utf8" });
    if (g.status !== 0) return false;
    const tpl = path.join(dir, "docs", "features", "_TEMPLATE.md");
    if (!fs.existsSync(tpl)) return false;
    const body = fs.readFileSync(tpl, "utf8");
    // content check, not mere existence: the anti-fabrication contract must travel with it
    return /PLACEHOLDER/.test(body) && body.length > 200;
  });

  test("role completeness: every file under references/ and scripts/ carries a declared role", () => {
    const ROLE_CHECK = path.join(__dirname, "..", "..", "scripts", "check-role-completeness.js");
    const repo = path.join(__dirname, "..", "..");
    const r = spawnSync(process.execPath, [ROLE_CHECK, "--gate", "--json"], { cwd: repo, encoding: "utf8" });
    if (r.status !== 0) return false;
    const o = JSON.parse(r.stdout);
    return o.gatePass === true && o.counts.undecided === 0 && o.counts.installed > 0 && o.counts.skillInternal > 0;
  });

  test("role completeness: an unclassified file under scripts/ fails the gate", () => {
    const ROLE_CHECK = path.join(__dirname, "..", "..", "scripts", "check-role-completeness.js");
    const dir = tmp("role-unclassified");
    fs.mkdirSync(path.join(dir, "references", "policies"), { recursive: true });
    fs.mkdirSync(path.join(dir, "scripts"), { recursive: true });
    write(path.join(dir, "references", "policies", "x.policy.md"), "# x\n");
    write(path.join(dir, "scripts", "stray.js"), "// unclassified\n");
    write(path.join(dir, "scripts", "package-skill.sh"), 'cp SKILL.md "$STAGING/"\ncp -R references "$STAGING/"\ncp -R scripts "$STAGING/"\n');
    write(path.join(dir, "references", "init-spec.json"), JSON.stringify({
      artifacts: [{ path: "docs/rules/x.md", source: "references/policies/x.policy.md", type: "copy" }],
      distribution: { skillInternal: ["references/init-spec.json", "scripts/package-skill.sh"], undecided: {} },
    }));
    const r = spawnSync(process.execPath, [ROLE_CHECK, "--gate", "--json"], { cwd: dir, encoding: "utf8" });
    if (r.status !== 1) return false;
    return JSON.parse(r.stdout).gateIssues.some((g) => g.kind === "unclassified" && g.item.includes("stray.js"));
  });

  // A governed project's AGENTS.md is generated from agents-md.template.md. That summary
  // used to be a comma-separated prose sentence, which the consistency gate's declaration
  // parser (fenced blocks / tables / list runs) could not see — so the protected-files
  // list in EVERY generated project could drift from the policy unnoticed. Reshaping the
  // template into a list closed that hole; this pins both the shape and the detection.
  test("payload: a generated project's protected-files summary is gate-checked", () => {
    const dir = tmp("payload-protected-drift");
    const gen = spawnSync(process.execPath, [GENERATOR, "--target", dir, "--project-name", "demo", "--phase", "C"], { encoding: "utf8" });
    if (gen.status !== 0) return false;
    const rules = path.join(dir, "docs/rules/governance-files.md");
    const agents = path.join(dir, "AGENTS.md");
    if (!fs.existsSync(rules) || !fs.existsSync(agents)) return false;
    // The summary must be in a parseable shape, not prose.
    if (!/^- `scripts\/check-lock\.js`$/m.test(fs.readFileSync(agents, "utf8"))) return false;
    // Rename one entry in the AUTHORITATIVE list only; the summary is now stale.
    fs.writeFileSync(rules, fs.readFileSync(rules, "utf8").replace(/scripts\/check-lock\.js/g, "scripts/check-renamed.js"));
    fs.copyFileSync(CONSISTENCY_CHECK, path.join(dir, "scripts/check-doc-consistency.js"));
    const r = spawnSync(process.execPath, ["scripts/check-doc-consistency.js", "--gate", "--json"], { cwd: dir, encoding: "utf8" });
    if (r.status !== 1) return false;
    const out = JSON.parse(r.stdout);
    return out.gateIssues.some((g) => g.kind === "protected_lists" && g.item.includes("check-lock.js"));
  });

  // The generated release-manager sub-skill invokes scripts/release-manager.js, but the
  // script was declared SKILL-INTERNAL, so INIT never installed it and a governed
  // project's release flow stopped at step 8 on a missing file. Adjudicated to INSTALLED
  // (it requires no sibling module and reads nothing from the skill repo). These two tests
  // pin the runtime dependency the sub-skill actually has.
  test("payload: INIT installs the release tag executor the sub-skill invokes", () => {
    const dir = tmp("payload-release-manager");
    const gen = spawnSync(process.execPath, [GENERATOR, "--target", dir, "--project-name", "demo", "--phase", "C"], { encoding: "utf8" });
    if (gen.status !== 0) return false;
    const installed = path.join(dir, "scripts/release-manager.js");
    if (!fs.existsSync(installed)) return false;
    // Every path the generated sub-skill tells the agent to run must resolve.
    const skill = path.join(dir, ".governance/generated/skills/release-manager/SKILL.md");
    if (!fs.existsSync(skill)) return false;
    const body = fs.readFileSync(skill, "utf8");
    for (const m of body.match(/(?:node|bash|sh)\s+(scripts\/[\w.-]+)/g) || []) {
      const rel = m.replace(/^(?:node|bash|sh)\s+/, "");
      if (!fs.existsSync(path.join(dir, rel))) return false;
    }
    return true;
  });

  test("payload: the installed release executor runs standalone and refuses to write", () => {
    const dir = tmp("payload-release-manager-run");
    const gen = spawnSync(process.execPath, [GENERATOR, "--target", dir, "--project-name", "demo", "--phase", "C"], { encoding: "utf8" });
    if (gen.status !== 0) return false;
    // Loads with Node builtins only, inside a project that has no skill-repo files.
    const plan = spawnSync(process.execPath, ["scripts/release-manager.js", "plan", "--json", JSON.stringify({ current: "1.0.0", changes: [{ type: "fix", description: "x" }] })], { cwd: dir, encoding: "utf8" });
    if (plan.status !== 0) return false;
    let proposal;
    try { proposal = JSON.parse(plan.stdout); } catch { return false; }
    if (!proposal.recommended || !proposal.riskLevel) return false;
    // Without --yes it must perform no write operation.
    fs.writeFileSync(path.join(dir, "p.json"), JSON.stringify(proposal));
    const exec = spawnSync(process.execPath, ["scripts/release-manager.js", "execute", "--proposal", "p.json"], { cwd: dir, encoding: "utf8" });
    return exec.status !== 0 && /NOT approved/i.test(String(exec.stderr || exec.stdout));
  });
};
