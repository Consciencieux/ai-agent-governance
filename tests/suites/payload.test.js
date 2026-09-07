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

  // G2: completeness must judge the ENUMERATION BLOCK, not the whole file. A path still
  // mentioned in operational prose (a gate clause on a later line) used to satisfy the
  // completeness check, so deleting its entry from the protected enumeration went
  // unnoticed while the pipeline stayed green (audit 2026-09-07).
  test("payload: deleting a protected-list entry is caught even when prose still mentions the path", () => {
    const dir = tmp("payload-protected-mention");
    spawnSync(process.execPath, [GENERATOR, "--target", dir, "--project-name", "Mention", "--phase", "C"], { encoding: "utf8" });
    const ag = path.join(dir, "AGENTS.md");
    const orig = fs.readFileSync(ag, "utf8");
    // the generated AGENTS.md states scripts in prose too (gate section), so a file-wide
    // includes() would see the path even after its enumeration entry is deleted
    const entry = "- `scripts/check-secrets.js`\n";
    if (!orig.includes(entry)) return false;
    fs.writeFileSync(ag, orig.replace(entry, ""));
    const r = spawnSync(process.execPath, [path.join(dir, "scripts", "check-doc-consistency.js"), "--gate", "--json"], { cwd: dir, encoding: "utf8" });
    if (r.status !== 1) {
      console.error("  enumeration deletion passed --gate despite the path being mentioned elsewhere in the file");
      return false;
    }
    const out = JSON.parse(r.stdout);
    return out.gateIssues.some((g) => g.kind === "protected_lists" && /missing (?:scripts\/)?check-secrets/.test(g.item));
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
    const ROLE_CHECK = path.join(__dirname, "..", "..", "repo-tools", "check-role-completeness.js");
    const repo = path.join(__dirname, "..", "..");
    const r = spawnSync(process.execPath, [ROLE_CHECK, "--gate", "--json"], { cwd: repo, encoding: "utf8" });
    if (r.status !== 0) return false;
    const o = JSON.parse(r.stdout);
    return o.gatePass === true && o.counts.undecided === 0 && o.counts.installed > 0 && o.counts.skillInternal > 0;
  });

  test("role completeness: an unclassified file under scripts/ fails the gate", () => {
    const ROLE_CHECK = path.join(__dirname, "..", "..", "repo-tools", "check-role-completeness.js");
    const dir = tmp("role-unclassified");
    fs.mkdirSync(path.join(dir, "references", "policies"), { recursive: true });
    fs.mkdirSync(path.join(dir, "scripts"), { recursive: true });
    write(path.join(dir, "references", "policies", "x.policy.md"), "# x\n");
    write(path.join(dir, "scripts", "stray.js"), "// unclassified\n");
    write(path.join(dir, "repo-tools", "package-skill.sh"), 'cp SKILL.md "$STAGING/"\ncp -R references "$STAGING/"\ncp -R scripts "$STAGING/"\n');
    write(path.join(dir, "references", "init-spec.json"), JSON.stringify({
      artifacts: [{ path: "docs/rules/x.md", source: "references/policies/x.policy.md", type: "copy" }],
      distribution: { skillInternal: ["references/init-spec.json", "repo-tools/package-skill.sh"], undecided: {} },
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

// ---------------------------------------------------------------------------
// Phase contract (N20). AGENTS.md is a Phase A artifact while the scripts it
// commands are installed at Phase B/C, so a Phase A project used to receive an
// AGENTS.md ordering it to run files that do not exist. The three regressions the
// plan requires, plus the upgrade path that the first fix attempt broke.
// ---------------------------------------------------------------------------

const PHASE_GEN = path.join(SKILL_ROOT, "scripts", "generate-governance.js");

function genPhase(dir, phase) {
  return spawnSync(process.execPath, [PHASE_GEN, "--target", dir, "--project-name", "demo", "--phase", phase], { cwd: SKILL_ROOT, encoding: "utf8" });
}
function installedScripts(dir) {
  const p = path.join(dir, "scripts");
  return fs.existsSync(p) ? fs.readdirSync(p) : [];
}
// An EXECUTABLE instruction, per the plan's §3a grammar — not every mention of a path.
// A line that tells the agent to run something ("run `node scripts/x.js`", "- `scripts/x.js`"
// in the protected list) must resolve; a line that explains a script obligation is DEFERRED
// is prose about the rule, and requiring it to resolve would forbid the very sentence that
// warns the reader the script is absent.
function commandedScriptsIn(text) {
  const out = new Set();
  for (const line of String(text).split("\n")) {
    if (/\bdeferred, not waived\b/i.test(line)) continue;          // the Phase A deferral notice
    if (/^\s*>/.test(line) && !/\brun\b/i.test(line)) continue;    // block-quoted explanation
    for (const m of line.matchAll(/scripts\/([\w.-]+\.js)/g)) out.add(m[1]);
  }
  return [...out];
}

test("phase contract: Phase A AGENTS.md names no script Phase A does not install", () => {
  const dir = tmp("phase-a-no-uninstalled");
  if (genPhase(dir, "A").status !== 0) return false;
  const body = fs.readFileSync(path.join(dir, "AGENTS.md"), "utf8");
  const installed = installedScripts(dir);
  const broken = commandedScriptsIn(body).filter((n) => !installed.includes(n));
  if (broken.length > 0) {
    console.error("  Phase A AGENTS.md commands uninstalled scripts: " + broken.join(", "));
    return false;
  }
  return true;
});

test("phase contract: Phase A AGENTS.md is marked initialization-incomplete", () => {
  const dir = tmp("phase-a-marked");
  if (genPhase(dir, "A").status !== 0) return false;
  const body = fs.readFileSync(path.join(dir, "AGENTS.md"), "utf8");
  // and the deferral must be explicit: a missing gate is not a passed gate
  return /initialization is incomplete/i.test(body) && /deferred, not waived/i.test(body);
});

test("phase contract: Phase B/C AGENTS.md carries the requirements for the scripts that stage installs", () => {
  for (const phase of ["B", "C"]) {
    const dir = tmp("phase-" + phase + "-carries");
    if (genPhase(dir, phase).status !== 0) return false;
    const body = fs.readFileSync(path.join(dir, "AGENTS.md"), "utf8");
    if (/initialization is incomplete/i.test(body)) return false;
    if (!/check-secrets\.js/.test(body)) return false;           // Phase B script
    if (phase === "C" && !/check-doc-consistency\.js/.test(body)) return false; // Phase C script
    const broken = commandedScriptsIn(body).filter((n) => !installedScripts(dir).includes(n));
    if (broken.length > 0) {
      console.error("  Phase " + phase + " names uninstalled: " + broken.join(", "));
      return false;
    }
  }
  return true;
});

// The first fix pruned the template but kept writeIfAbsent, so a project initialized at
// Phase A kept the Phase A body forever: after A -> B -> C it still showed the bootstrap
// banner and still lacked every gate requirement whose scripts had just been installed.
// Staged artifacts must be upgraded, and the result must equal a fresh install.
test("phase contract: A -> B -> C upgrades AGENTS.md to be byte-identical with a fresh Phase C install", () => {
  const inc = tmp("phase-upgrade-inc");
  for (const ph of ["A", "B", "C"]) if (genPhase(inc, ph).status !== 0) return false;
  const fresh = tmp("phase-upgrade-fresh");
  if (genPhase(fresh, "C").status !== 0) return false;
  const a = fs.readFileSync(path.join(inc, "AGENTS.md"), "utf8");
  const b = fs.readFileSync(path.join(fresh, "AGENTS.md"), "utf8");
  if (a !== b) {
    console.error("  incremental Phase C body differs from a fresh Phase C install");
    return false;
  }
  return !/initialization is incomplete/i.test(a);
});

// The upgrade must never clobber human edits: only a byte-exact earlier-phase rendering
// is replaced.
test("phase contract: a locally modified AGENTS.md is never overwritten by a later phase", () => {
  const dir = tmp("phase-local-edit");
  if (genPhase(dir, "A").status !== 0) return false;
  const marker = "\n<!-- operator's own rule -->\n";
  fs.appendFileSync(path.join(dir, "AGENTS.md"), marker, "utf8");
  if (genPhase(dir, "C").status !== 0) return false;
  return fs.readFileSync(path.join(dir, "AGENTS.md"), "utf8").includes("operator's own rule");
});

// ---------------------------------------------------------------------------
// §3a/§3c — closure of the GENERATED project. The gates in this repo check
// declarations, structure and paths; none of them resolves a reference in the place
// it is actually read. These two do, on a real fixture: every executable instruction
// must name a file the target HAS, and every relative link must stay inside it.
// Scope is all generated governance text — AGENTS.md, docs/rules/*.md AND the
// generated sub-skills, which is where two of the audited leaks lived.
// ---------------------------------------------------------------------------

function generatedProject(label) {
  const dir = tmp(label);
  const r = spawnSync(process.execPath, [PHASE_GEN, "--target", dir, "--project-name", "closure", "--phase", "C"], { cwd: SKILL_ROOT, encoding: "utf8" });
  return r.status === 0 ? dir : null;
}
function markdownFiles(root) {
  const out = [];
  (function walk(d) {
    for (const e of fs.readdirSync(d, { withFileTypes: true })) {
      const p = path.join(d, e.name);
      if (e.isDirectory()) { if (!/^(node_modules|\.git)$/.test(e.name)) walk(p); }
      else if (e.name.endsWith(".md")) out.push(p);
    }
  })(root);
  return out;
}

test("payload closure: every executable instruction in the generated project resolves there", () => {
  const dir = generatedProject("closure-exec");
  if (!dir) return false;
  const offenders = [];
  for (const file of markdownFiles(dir)) {
    const rel = path.relative(dir, file).replace(/\\/g, "/");
    fs.readFileSync(file, "utf8").split("\n").forEach((line, i) => {
      // §3a grammar: only lines that TELL the agent to run something. Prose that explains
      // a deferral or cites provenance is not an executable instruction.
      if (/deferred, not waived/i.test(line)) return;
      if (/^\s*>/.test(line) && !/\brun\b/i.test(line)) return;
      const runsSomething = /(^|\s)(run|运行|執行)\b/i.test(line) || /^\s*[-*]\s*`?(node|bash)\s/.test(line) || /^\s*```/.test(line) === false && /`(node|bash) [\w./-]+`/.test(line);
      for (const m of line.matchAll(/\b(?:node|bash)\s+(scripts\/[\w.-]+\.(?:js|sh))/g)) {
        if (!fs.existsSync(path.join(dir, m[1]))) offenders.push(`${rel}:${i + 1} -> ${m[1]}`);
      }
      if (!runsSomething) return;
      for (const m of line.matchAll(/`(scripts\/[\w.-]+\.(?:js|sh))`/g)) {
        if (!fs.existsSync(path.join(dir, m[1]))) offenders.push(`${rel}:${i + 1} -> ${m[1]}`);
      }
    });
  }
  if (offenders.length) {
    console.error("  instructions naming absent files:\n    " + [...new Set(offenders)].join("\n    "));
    return false;
  }
  return true;
});

test("payload closure: no generated file points at a skill-repo-only path", () => {
  const dir = generatedProject("closure-repoonly");
  if (!dir) return false;
  // This repo's own npm scripts. A governed project defines its OWN scripts (the generated
  // AGENTS.md has a Development Commands section, and two sub-skills offer `npm run
  // governance-check` as a registered-script alternative) — those are the target's, not
  // ours, and flagging them would be a false positive. Only THIS repo's script names and
  // payload-internal paths are leaks.
  const repoScripts = Object.keys(JSON.parse(fs.readFileSync(path.join(SKILL_ROOT, "package.json"), "utf8")).scripts || {});
  const offenders = [];
  for (const file of markdownFiles(dir)) {
    const rel = path.relative(dir, file).replace(/\\/g, "/");
    fs.readFileSync(file, "utf8").split("\n").forEach((line, i) => {
      // `references/…` is renamed or not installed by INIT; docs/{en,zh-CN,zh-TW} is this
      // repo's trilingual tree and does not exist in a governed project.
      for (const m of line.matchAll(/`(references\/[\w./-]+|docs\/(?:en|zh-CN|zh-TW)\/[\w./-]+)`/g)) {
        offenders.push(`${rel}:${i + 1} -> ${m[1]}`);
      }
      for (const m of line.matchAll(/`npm run ([\w:-]+)`/g)) {
        if (repoScripts.includes(m[1])) offenders.push(`${rel}:${i + 1} -> npm run ${m[1]} (this repo's script)`);
      }
    });
  }
  if (offenders.length) {
    console.error("  repo-only references inside the generated project:\n    " + [...new Set(offenders)].join("\n    "));
    return false;
  }
  return true;
});

test("payload closure: every relative markdown link stays inside the generated project", () => {
  const dir = generatedProject("closure-links");
  if (!dir) return false;
  const offenders = [];
  for (const file of markdownFiles(dir)) {
    const rel = path.relative(dir, file).replace(/\\/g, "/");
    const base = path.dirname(file);
    fs.readFileSync(file, "utf8").split("\n").forEach((line, i) => {
      for (const m of line.matchAll(/\[[^\]]*\]\(([^)]+)\)/g)) {
        const href = m[1].trim();
        if (/^(https?:|mailto:|#)/.test(href)) continue;
        const clean = href.split("#")[0];
        if (!clean) continue;
        const resolved = path.resolve(base, clean);
        if (!resolved.startsWith(path.resolve(dir))) { offenders.push(`${rel}:${i + 1} -> ${href} (escapes the project)`); continue; }
        if (!fs.existsSync(resolved)) offenders.push(`${rel}:${i + 1} -> ${href} (dead)`);
      }
    });
  }
  if (offenders.length) {
    console.error("  dead or escaping links:\n    " + [...new Set(offenders)].join("\n    "));
    return false;
  }
  return true;
});
// ---------------------------------------------------------------------------
// Boundary split (repository-boundary-split plan §5). The distribution boundary is
// PHYSICAL: package-skill.sh copies whole directories, so what ships is decided by
// where a file lives, not by what init-spec.json declares about it. Before the split,
// 7 repo-maintenance files (skill-release.md, package-skill.sh and five repo-only
// gates) shipped to every user purely because they sat under references/ or scripts/.
// These tests assert the two layers agree: declarations == packaging.
// ---------------------------------------------------------------------------

test("boundary: tarball manifest equals the declared allow-set exactly", () => {
  const sh = findBashShell();
  if (!sh) { console.error("  no bash available (package-skill.sh declares a bash shebang)"); return false; }
  const pack = spawnSync(sh, ["repo-tools/package-skill.sh", "0.0.0-test"], { cwd: SKILL_ROOT, encoding: "utf8" });
  if (pack.status !== 0) { console.error("  packaging failed: " + (pack.stderr || "").slice(0, 200)); return false; }

  const tarOut = spawnSync("tar", ["-tzf", path.join(SKILL_ROOT, "dist", "ai-agent-governance-skill.tar.gz")], { encoding: "utf8" });
  if (tarOut.status !== 0) { console.error("  tar listing failed"); return false; }
  // normalization: strip "./", force "/", drop directory entries
  const members = String(tarOut.stdout).split(/\r?\n/).map((m) => m.trim()).filter(Boolean)
    .map((m) => m.replace(/^\.\//, "").replace(/\\/g, "/"))
    .filter((m) => m && !m.endsWith("/"));

  const spec = JSON.parse(fs.readFileSync(path.join(SKILL_ROOT, "references/init-spec.json"), "utf8"));
  const declared = new Set(["SKILL.md", "LICENSE"]);
  for (const a of spec.artifacts || []) if (a.source) declared.add(a.source);
  for (const s of (spec.distribution || {}).skillInternal || []) declared.add(s);

  const memberSet = new Set(members);
  const extra = members.filter((m) => !declared.has(m));
  const missing = [...declared].filter((d) => !memberSet.has(d));
  if (extra.length || missing.length) {
    if (extra.length) console.error("  shipped but not declared: " + extra.join(", "));
    if (missing.length) console.error("  declared but not shipped: " + missing.join(", "));
    return false;
  }
  return members.length > 0;
});

test("boundary: no repo-only path is present anywhere in the tarball", () => {
  const tarball = path.join(SKILL_ROOT, "dist", "ai-agent-governance-skill.tar.gz");
  if (!fs.existsSync(tarball)) return false;               // previous test builds it
  const tarOut = spawnSync("tar", ["-tzf", tarball], { encoding: "utf8" });
  if (tarOut.status !== 0) return false;
  const members = String(tarOut.stdout).split(/\r?\n/).map((m) => m.trim().replace(/^\.\//, "").replace(/\\/g, "/")).filter(Boolean);
  // Recursive, not top-level-only: the pre-split leaks all sat BELOW the four roots.
  const forbidden = [/^repo-tools\//, /^repo-workflows\//, /^docs\//, /^tests\//, /^\.github\//, /^package\.json$/, /^AGENTS\.md$/, /^CHANGELOG\.md$/];
  const bad = members.filter((m) => forbidden.some((re) => re.test(m)));
  if (bad.length) { console.error("  repo-only members in tarball: " + bad.join(", ")); return false; }
  return true;
});

test("boundary: declaring a repo-only file as distributed fails the role gate", () => {
  const dir = tmp("boundary-reverse");
  // minimal repo shape: references/ + scripts/ + a repo-tools file wrongly declared
  fs.mkdirSync(path.join(dir, "references"), { recursive: true });
  fs.mkdirSync(path.join(dir, "scripts"), { recursive: true });
  fs.mkdirSync(path.join(dir, "repo-tools"), { recursive: true });
  fs.writeFileSync(path.join(dir, "scripts", "a.js"), "// x", "utf8");
  fs.writeFileSync(path.join(dir, "repo-tools", "tool.js"), "// repo-only", "utf8");
  fs.writeFileSync(path.join(dir, "references", "init-spec.json"), JSON.stringify({
    artifacts: [{ path: "scripts/a.js", source: "scripts/a.js", type: "copy", phase: "B" }],
    distribution: { skillInternal: ["references/init-spec.json", "repo-tools/tool.js"], undecided: {} }
  }), "utf8");
  const r = spawnSync(process.execPath, [ROLE_CHECK, "--json", "--gate"], { cwd: dir, encoding: "utf8" });
  if (r.status !== 1) { console.error("  expected the reverse check to fail the gate"); return false; }
  const out = JSON.parse(r.stdout);
  return (out.issues.overlap || []).some((i) => /repo-only directory/.test(i));
});

// v0.13.1 shipped 34 AppleDouble members (._SKILL.md, scripts/._generate-governance.js,
// one per payload file) because it was packaged on macOS, where cp/tar carry extended
// attributes into the archive. No governance boundary was crossed, but every user
// unpacked a directory of junk twins. The packaging script now suppresses them AND
// refuses to publish an archive that still contains any.
test("packaging: the tarball carries no platform metadata files", () => {
  const tarball = path.join(SKILL_ROOT, "dist", "ai-agent-governance-skill.tar.gz");
  if (!fs.existsSync(tarball)) {
    // Prerequisite missing: the manifest test above builds it, and it skips (not fails)
    // when no POSIX shell exists. Distinguish that environment gap from a metadata leak
    // instead of failing silently.
    console.error("  prerequisite tarball missing — skipping (no POSIX shell on this machine?)");
    return false;
  }
  const tarOut = spawnSync("tar", ["-tzf", tarball], { encoding: "utf8" });
  if (tarOut.status !== 0) return false;
  const junk = String(tarOut.stdout).split(/\r?\n/).map((m) => m.trim()).filter(Boolean)
    .filter((m) => /(^|\/)\._/.test(m) || /(^|\/)\.DS_Store$/.test(m));
  if (junk.length) { console.error("  platform metadata in tarball: " + junk.slice(0, 6).join(", ")); return false; }
  return true;
});

test("packaging: metadata surviving the copy step aborts the build instead of shipping", () => {
  const sh = findBashShell();
  if (!sh) { console.error("  no bash available (package-skill.sh declares a bash shebang)"); return false; }
  // The mutation must run against an ISOLATED mini-repo, never the real checkout: this
  // plants a junk metadata file (._probe) in a shipped dir and asserts the packaging
  // pipeline strips it (or refuses the build). Running against the real repo would add
  // junk to the real references/ tree and mutate shared dist/ state.
  const dir = tmp("packaging-mutation-isolated");
  for (const d of ["references", "scripts", "repo-tools"]) fs.mkdirSync(path.join(dir, d), { recursive: true });
  fs.cpSync(path.join(SKILL_ROOT, "SKILL.md"), path.join(dir, "SKILL.md"));
  fs.cpSync(path.join(SKILL_ROOT, "LICENSE"), path.join(dir, "LICENSE"));
  fs.cpSync(path.join(SKILL_ROOT, "package.json"), path.join(dir, "package.json"));
  fs.cpSync(path.join(SKILL_ROOT, "references"), path.join(dir, "references"), { recursive: true });
  fs.cpSync(path.join(SKILL_ROOT, "scripts"), path.join(dir, "scripts"), { recursive: true });
  fs.cpSync(path.join(SKILL_ROOT, "repo-tools", "package-skill.sh"), path.join(dir, "repo-tools", "package-skill.sh"));

  const junkFile = path.join(dir, "references", "._probe");
  const tarball = path.join(dir, "dist", "ai-agent-governance-skill.tar.gz");

  // Mutation: a junk metadata file (._probe) planted in a shipped dir must NEVER reach
  // the tarball. The defence is stacked (copy flags + find-strip + tar flag detection +
  // JUNK gate), so the assertion is behavioural: list the produced tarball and require
  // zero ._* / .DS_Store members. Earlier revisions weakened individual lines and
  // asserted failure; the defence has since evolved to stack (COPYFILE_DISABLE, -X,
  // --no-mac-metadata detection, final JUNK grep), so the invariant to pin is the
  // outcome, not a specific line.
  fs.writeFileSync(junkFile, "x", "utf8");

  const r = spawnSync(sh, ["repo-tools/package-skill.sh", "0.0.0-probe"], { cwd: dir, encoding: "utf8" });
  if (r.status !== 0) { console.error("  packaging failed: " + String(r.stderr || r.stdout)); return false; }
  if (!fs.existsSync(tarball)) { console.error("  tarball not produced"); return false; }
  const members = spawnSync("tar", ["-tzf", tarball], { cwd: dir, encoding: "utf8" }).stdout;
  if (/\._|\.DS_Store/.test(members)) {
    console.error("  junk metadata file reached the tarball: " + members.split("\n").filter((l) => /\._|\.DS_Store/.test(l)).join(","));
    return false;
  }
  return true;
});

// check-plan-delivery verifies identifiers against a search corpus. When the boundary
// split moved six gates into repo-tools/, SEARCH_ROOTS still named the old trees, so an
// identifier wired into one of those files would have been reported as never delivered.
// A mutation test removing the two roots passed green — nothing pinned the set — so both
// the enumerated set AND the behavioural path are pinned here.
test("plan delivery: search roots cover every tree a plan can deliver into", () => {
  const src = fs.readFileSync(path.join(SKILL_ROOT, "repo-tools", "check-plan-delivery.js"), "utf8");
  const m = /const SEARCH_ROOTS = \[([^\]]+)\]/.exec(src);
  if (!m) { console.error("  SEARCH_ROOTS not found"); return false; }
  const roots = m[1].split(",").map((s) => s.trim().replace(/^["']|["']$/g, "")).filter(Boolean);
  // all nine entries: the five source trees AND the four root files. Pinning only the
  // trees left the root files unpinned — dropping package.json from the list would stop
  // identifier verification against it with the test still green.
  for (const need of ["references", "scripts", "repo-tools", "repo-workflows", "tests", "AGENTS.md", "SKILL.md", "package.json", "CHANGELOG.md"]) {
    if (!roots.includes(need)) { console.error("  missing search root: " + need); return false; }
  }
  return true;
});

test("plan delivery: an identifier wired into repo-tools/ verifies as delivered", () => {
  const dir = tmp("delivery-repo-tools");
  const planDir = path.join(dir, "docs", "en", "plans");
  fs.mkdirSync(planDir, { recursive: true });
  fs.mkdirSync(path.join(dir, "repo-tools"), { recursive: true });
  fs.mkdirSync(path.join(dir, "references"), { recursive: true });
  fs.mkdirSync(path.join(dir, "scripts"), { recursive: true });
  // The identifier must be a token inside Affected Files: that is the section the checker
  // mechanically extracts identifier declarations from. An earlier version of this test
  // declared it in Validation Method (narrative) and passed even when the identifier was
  // never wired anywhere — the assertion was vacuous and its mutation correspondence did
  // not hold.
  fs.writeFileSync(path.join(planDir, "probe.md"), [
    "# Probe (TASK plan)", "", "> **Status: implemented.**", "", "**Target: repo-infra**", "",
    "### Affected Files", "", "- `zzz_delivered_flag` — wired in repo-tools/probe-tool.js"
  ].join("\n"), "utf8");
  fs.writeFileSync(path.join(dir, "repo-tools", "probe-tool.js"), "// zzz_delivered_flag\n", "utf8");
  const r = spawnSync(process.execPath, [PLAN_DELIVERY, "--json"], { cwd: dir, encoding: "utf8" });
  let j;
  try { j = JSON.parse(r.stdout); } catch { return false; }
  const flagged = JSON.stringify(j).includes("zzz_delivered_flag");
  if (flagged) console.error("  a wired repo-tools identifier was reported undelivered: " + JSON.stringify(j).slice(0, 300));
  return !flagged;
});

// The name-scrape pin at the test above asserts the set; this one proves each root FILE
// actually contributes, not just that it is listed. The repo's own lesson: a rule that
// declares a set and a mechanism that covers a subset. Wires one identifier per root and
// expects each to verify as delivered. A root that stopped being searched would flag it.
// CHANGELOG.md is deliberately NOT probed: the checker excludes it by design (a mention in
// a CHANGELOG entry is narration, not a wiring).
test("plan delivery: an identifier wired into EVERY root file verifies as delivered", () => {
  const dir = tmp("delivery-root-files");
  const planDir = path.join(dir, "docs", "en", "plans");
  fs.mkdirSync(planDir, { recursive: true });
  fs.mkdirSync(path.join(dir, "references"), { recursive: true });
  fs.mkdirSync(path.join(dir, "scripts"), { recursive: true });
  const roots = [
    ["AGENTS.md", "# AGENTS\n\nzzz_root_flag_agents\n"],
    ["SKILL.md", "# SKILL\n\nzzz_root_flag_skill\n"],
    ["package.json", JSON.stringify({ name: "probe", version: "0.0.0", flag: "zzz_root_flag_pkg" })],
  ];
  const flags = roots.map(([, content]) => (content.match(/zzz_root_flag_\w+/) || ["zzz_root_flag_unknown"])[0]);
  for (const [file, content] of roots) fs.writeFileSync(path.join(dir, file), content, "utf8");
  fs.writeFileSync(path.join(planDir, "probe.md"), [
    "# Probe (TASK plan)", "", "> **Status: implemented.**", "", "**Target: repo-infra**", "",
    "### Affected Files", "", ...flags.map((f) => "- `" + f + "` (root file probe)")
  ].join("\n"), "utf8");
  const run = spawnSync(process.execPath, [PLAN_DELIVERY, "--json"], { cwd: dir, encoding: "utf8" });
  let j;
  try { j = JSON.parse(run.stdout); } catch { return false; }
  const bad = flags.filter((f) => JSON.stringify(j).includes(f));
  if (bad.length) {
    console.error("  root-file identifiers reported undelivered: " + bad.join(", "));
    return false;
  }
  return run.status === 0;
});
// ---------------------------------------------------------------------------
// Plan sync (scripts/check-plan-sync.js) — INSTALLED. The lifecycle policy says "tick the
// milestone when the task completes", but a documented rule with no failure feedback is
// the shape that keeps failing: an agent updates TASK_<name>.md and forgets
// DEVELOPMENT_PLAN.md. Three decidable relations only, advisory by default, fail-closed
// at release, no-op when the project does not use this structure (ADR-0009).
// ---------------------------------------------------------------------------

const PLAN_SYNC = path.join(SKILL_ROOT, "scripts", "check-plan-sync.js");

function planSyncFixture(name, files) {
  const dir = tmp(name);
  for (const [rel, body] of Object.entries(files)) {
    const abs = path.join(dir, rel);
    fs.mkdirSync(path.dirname(abs), { recursive: true });
    fs.writeFileSync(abs, body, "utf8");
  }
  return dir;
}
function runPlanSync(dir, flags) {
  const r = spawnSync(process.execPath, [PLAN_SYNC, "--json", ...(flags || [])], { cwd: dir, encoding: "utf8" });
  let j = null;
  try { j = JSON.parse(r.stdout); } catch {}
  return { status: r.status, json: j };
}

test("plan sync: an implemented TASK plan with no milestone is advisory, then blocks at release", () => {
  const files = {
    "docs/plans/DEVELOPMENT_PLAN.md": "# Development Plan\n\n## Milestones\n\n- [ ] M1: something else\n",
    "docs/plans/TASK_alpha.md": "# Alpha\n\n> **Status: implemented.**\n"
  };
  const advisory = runPlanSync(planSyncFixture("psync-advisory", files));
  const release = runPlanSync(planSyncFixture("psync-release", files), ["--release-gate"]);
  // default mode reports but never blocks a commit; release mode is fail-closed
  return advisory.status === 0
    && advisory.json.issues.implemented_without_milestone.length === 1
    && release.status === 1;
});

test("plan sync: an archived plan pointed at by an unchecked milestone fails at release", () => {
  const dir = planSyncFixture("psync-archived", {
    "docs/plans/DEVELOPMENT_PLAN.md": "# DP\n\n## Milestones\n\n- [ ] M1: finish TASK_beta.md\n",
    "docs/plans/archive/TASK_beta.md": "# Beta\n\n> **Status: archived.**\n"
  });
  const r = runPlanSync(dir, ["--release-gate"]);
  return r.status === 1 && r.json.issues.archived_still_pending.length === 1;
});

test("plan sync: a milestone naming a nonexistent TASK plan fails at release", () => {
  const dir = planSyncFixture("psync-ghost", {
    "docs/plans/DEVELOPMENT_PLAN.md": "# DP\n\n## Milestones\n\n- [ ] M1: see TASK_ghost.md\n"
  });
  const r = runPlanSync(dir, ["--release-gate"]);
  return r.status === 1 && r.json.issues.milestone_plan_missing.length === 1;
});

test("plan sync: legitimate shapes pass (checked milestone for an archived plan, design plan without a milestone)", () => {
  const checked = runPlanSync(planSyncFixture("psync-checked", {
    "docs/plans/DEVELOPMENT_PLAN.md": "# DP\n\n## Milestones\n\n- [x] M1: done via TASK_beta.md\n",
    "docs/plans/archive/TASK_beta.md": "# Beta\n\n> **Status: archived.**\n"
  }), ["--release-gate"]);
  const design = runPlanSync(planSyncFixture("psync-design", {
    "docs/plans/DEVELOPMENT_PLAN.md": "# DP\n\n## Milestones\n\n- [ ] M1: unrelated\n",
    "docs/plans/TASK_gamma.md": "# G\n\n> **Status: design plan, not implemented.**\n"
  }), ["--release-gate"]);
  // "design plan, not implemented" must not be read as implemented (substring trap)
  return checked.status === 0 && design.status === 0;
});

test("plan sync: a project without this structure is not applicable (never forces a layout)", () => {
  const noPlans = runPlanSync(planSyncFixture("psync-noplans", { "README.md": "# proj\n" }), ["--release-gate"]);
  const noIndex = runPlanSync(planSyncFixture("psync-noindex", { "docs/plans/TASK_x.md": "# X\n\n> **Status: implemented.**\n" }), ["--release-gate"]);
  return noPlans.status === 0 && noPlans.json.applicable === false
    && noIndex.status === 0 && noIndex.json.applicable === false;
});

test("plan sync: INIT installs it and it runs standalone in the generated project", () => {
  const dir = tmp("psync-installed");
  const gen = spawnSync(process.execPath, [GENERATOR, "--target", dir, "--project-name", "demo", "--phase", "C"], { cwd: SKILL_ROOT, encoding: "utf8" });
  if (gen.status !== 0) return false;
  const installed = path.join(dir, "scripts", "check-plan-sync.js");
  if (!fs.existsSync(installed)) { console.error("  INIT did not install check-plan-sync.js"); return false; }
  // self-contained: no sibling require
  const body = fs.readFileSync(installed, "utf8");
  if (/require\(\s*['"]\.[^'"]+['"]\s*\)/.test(body)) { console.error("  copied script has a local require"); return false; }
  const r = spawnSync(process.execPath, ["scripts/check-plan-sync.js", "--release-gate", "--json"], { cwd: dir, encoding: "utf8" });
  if (r.status !== 0) return false;
  const j = JSON.parse(r.stdout);
  return j.applicable === true && j.gatePass === true;
});
};
