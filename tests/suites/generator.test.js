// tests/suites/generator.test.js — batch-1 migration from tests/run-tests.js (anti-patch plan §3).
// Verbatim region move (marker-to-marker); helper consolidation into tests/support/ is batch 2.


const { spawnSync } = require("child_process");
const fs = require("fs");
const path = require("path");

module.exports = (test) => {
test("generate-governance: Phase A creates expected file tree", () => {
  const dir = tmp("gen-tree");
  const r = spawnSync(process.execPath, [GENERATOR, "--target", dir, "--project-name", "TestApp", "--phase", "A"], { encoding: "utf8" });
  if (r.status !== 0) return false;
  const expected = [
    "docs/rules/lifecycle.md",
    "docs/rules/git-policy.md",
    "docs/rules/security.md",
    "docs/rules/coding.md",
    "docs/rules/testing.md",
    "docs/rules/governance-files.md",
    "docs/features/_TEMPLATE.md",
    "AGENTS.md",
    "CHANGELOG.md",
    "README.md",
    "docs/plans/DEVELOPMENT_PLAN.md",
    "docs/plans/archive/.gitkeep",
    "docs/ARCHITECTURE.md",
  ];
  const actual = [];
  // Deduplicate: a file present twice in the expected list would push twice and the count
  // assertion would pass vacuously (found by review).
  const seen = new Set();
  for (const e of expected) {
    if (seen.has(e)) continue;
    seen.add(e);
    if (fs.existsSync(path.join(dir, e))) actual.push(e);
  }
  return actual.length === expected.length;
});

test("generate-governance: determinism — same inputs produce byte-identical full trees", () => {
  const d1 = tmp("gen-det-a");
  const d2 = tmp("gen-det-b");
  const a = spawnSync(process.execPath, [GENERATOR, "--target", d1, "--project-name", "DetTest", "--phase", "B"], { encoding: "utf8" });
  const b = spawnSync(process.execPath, [GENERATOR, "--target", d2, "--project-name", "DetTest", "--phase", "B"], { encoding: "utf8" });
  if (a.status !== 0 || b.status !== 0) return false;
  const f1 = listFiles(d1);
  const f2 = listFiles(d2);
  if (f1.length !== f2.length || f1.length === 0) return false;
  for (let i = 0; i < f1.length; i++) {
    if (path.relative(d1, f1[i]) !== path.relative(d2, f2[i])) return false;
    if (!fs.readFileSync(f1[i]).equals(fs.readFileSync(f2[i]))) return false;
  }
  return true;
});

test("generate-governance: AGENTS.md has resolved placeholders", () => {
  const dir = tmp("gen-placeholder");
  spawnSync(process.execPath, [GENERATOR, "--target", dir, "--project-name", "MyProject", "--phase", "A"]);
  const content = fs.readFileSync(path.join(dir, "AGENTS.md"), "utf8");
  return content.includes("MyProject") && content.includes("## Generated Skills") && content.includes("review-manager") && content.includes(".governance/generated/skills/review-manager/SKILL.md") && content.includes("not scripts") && !content.includes("{{PROJECT_NAME}}") && !content.includes("{{GENERATED_SKILL_REGISTRY}}");
});

test("generate-governance: manifest lists created artifacts with correct types", () => {
  const dir = tmp("gen-manifest");
  const r = spawnSync(process.execPath, [GENERATOR, "--target", dir, "--project-name", "TypeTest", "--phase", "B"], { encoding: "utf8" });
  if (r.status !== 0) return false;
  const m = JSON.parse(fs.readFileSync(path.join(dir, ".governance/manifest.json"), "utf8"));
  const count = (t) => m.artifacts.filter((a) => a.type === t).length;
  const validKinds = m.artifacts.every((a) => a.kind === "file" || a.kind === "dir");
  const agentsType = m.artifacts.find((a) => a.path === "AGENTS.md").type;
  return count("policy") === 10 && count("script") === 5 && count("state") === 6 && validKinds && agentsType === "policy";
});

test("generate-governance: gitignore covers sensitive filenames", () => {
  const dir = tmp("gen-gitignore-security");
  const r = spawnSync(process.execPath, [GENERATOR, "--target", dir, "--project-name", "Security", "--phase", "B"], { encoding: "utf8" });
  if (r.status !== 0) return false;
  const content = fs.readFileSync(path.join(dir, ".gitignore"), "utf8");
  return ["*.p12", "*.pfx", "id_rsa", "credentials.json", "secrets.*", "*.log", "logs/"].every((entry) => content.includes(entry));
});

test("generate-governance: manifest omits release for fresh INIT", () => {
  const dir = tmp("gen-norelease");
  spawnSync(process.execPath, [GENERATOR, "--target", dir, "--project-name", "Fresh", "--phase", "B"]);
  const m = JSON.parse(fs.readFileSync(path.join(dir, ".governance/manifest.json"), "utf8"));
  return m.release === undefined;
});

test("generate-governance: git-policy.json and sync-rules.json are valid JSON", () => {
  const dir = tmp("gen-jsonval");
  spawnSync(process.execPath, [GENERATOR, "--target", dir, "--project-name", "JsonVal", "--phase", "B"]);
  const gp = JSON.parse(fs.readFileSync(path.join(dir, ".governance/git-policy.json"), "utf8"));
  const sr = JSON.parse(fs.readFileSync(path.join(dir, ".governance/sync-rules.json"), "utf8"));
  return Array.isArray(gp.protectedBranches) && gp.protectedBranches.length > 0 &&
    typeof gp.directPush === "boolean" && Array.isArray(sr.syncGroups) && sr.syncGroups.length > 0;
});

test("generate-governance: end-to-end — Phase B output passes verify-governance.js", () => {
  const dir = tmp("gen-e2e");
  const g = spawnSync(process.execPath, [GENERATOR, "--target", dir, "--project-name", "E2EApp", "--phase", "B"], { encoding: "utf8" });
  if (g.status !== 0) return false;
  const v = spawnSync(process.execPath, [VALIDATOR], { cwd: dir, encoding: "utf8" });
  return v.status === 0;
});

test("generate-governance: existing files are skipped, not overwritten", () => {
  const dir = tmp("gen-skip");
  fs.mkdirSync(path.join(dir, "docs/rules"), { recursive: true });
  fs.writeFileSync(path.join(dir, "docs/rules/lifecycle.md"), "CUSTOM CONTENT", "utf8");
  const r = spawnSync(process.execPath, [GENERATOR, "--target", dir, "--project-name", "SkipTest", "--phase", "A"], { encoding: "utf8" });
  if (r.status !== 0) return false;
  const content = fs.readFileSync(path.join(dir, "docs/rules/lifecycle.md"), "utf8");
  return content === "CUSTOM CONTENT";
});

test("generate-governance: --dry-run creates nothing", () => {
  const dir = tmp("gen-dryrun");
  const r = spawnSync(process.execPath, [GENERATOR, "--target", dir, "--project-name", "Dry", "--phase", "A", "--dry-run", "--json"], { encoding: "utf8" });
  return r.status === 0 && !fs.existsSync(dir + "/AGENTS.md") && JSON.parse(r.stdout).results.some((a) => a.action === "would-create");
});

test("generate-governance: --json outputs structured result", () => {
  const dir = tmp("gen-jsonout");
  const r = spawnSync(process.execPath, [GENERATOR, "--target", dir, "--project-name", "JsonTest", "--phase", "A", "--json"], { encoding: "utf8" });
  if (r.status !== 0) return false;
  const out = JSON.parse(r.stdout);
  return out.phase === "A" && Array.isArray(out.results) && out.results.length === 15;
});

test("generate-governance: missing --project-name exits 2", () => {
  const dir = tmp("gen-noname");
  const r = spawnSync(process.execPath, [GENERATOR, "--target", dir], { encoding: "utf8" });
  return r.status === 2;
});

// Phase-marker grammar (N20). The first implementation silently swallowed the rest of the
// file when a marker was left unclosed — taking "never force push" and the protected-file
// list with it — and accepted typos like `phase:A+` by excluding them from every stage.
// A generated governance artifact that is silently truncated is worse than a loud failure,
// so the grammar is strict and unbalanced markers are a hard error.
function withTemplate(body, fn) {
  const T = path.join(SKILL_ROOT, "references", "templates", "agents-md.template.md");
  const original = fs.readFileSync(T, "utf8");
  const fence = original.indexOf("```");
  const head = original.slice(0, fence);
  try {
    fs.writeFileSync(T, head + "```\n# {{PROJECT_NAME}}\n\n" + body + "\n```\n", "utf8");
    return fn();
  } finally {
    fs.writeFileSync(T, original, "utf8");
    // G11: verify the template was restored — the real template must not be left mutated
    const restored = fs.readFileSync(T, "utf8");
    if (restored !== original) console.error("  withTemplate: FAILED to restore the original template");
  }
}
function genInto(phase) {
  const dir = tmp("gen-marker-" + phase + "-" + Math.random().toString(36).slice(2, 7));
  const r = spawnSync(process.execPath, [GENERATOR, "--target", dir, "--project-name", "demo", "--phase", phase], { encoding: "utf8" });
  return { r, dir, agents: path.join(dir, "AGENTS.md") };
}

test("phase markers: an unclosed block is a hard error, never a silent truncation", () => {
  return withTemplate("<!-- phase:B+ -->\nKEEP-B\nTAIL-MUST-NOT-VANISH", () => {
    const { r, agents } = genInto("C");
    if (r.status === 0) return false;                       // must not succeed
    if (fs.existsSync(agents)) {
      const body = fs.readFileSync(agents, "utf8");
      if (!/TAIL-MUST-NOT-VANISH/.test(body)) return false; // must not write a truncated file
    }
    return /unclosed/i.test(String(r.stderr || r.stdout));
  });
});

test("phase markers: an unknown spec is rejected instead of silently excluded", () => {
  return withTemplate("<!-- phase:A+ -->\nTYPO\n<!-- /phase -->", () => {
    const { r } = genInto("A");
    return r.status !== 0 && /unknown phase marker/i.test(String(r.stderr || r.stdout));
  });
});

test("phase markers: a stray closing marker is rejected", () => {
  return withTemplate("BODY\n<!-- /phase -->", () => {
    const { r } = genInto("A");
    return r.status !== 0 && /stray/i.test(String(r.stderr || r.stdout));
  });
});

test("phase markers: nesting restores the enclosing block's state", () => {
  // outer excluded at Phase A; the inner close must NOT resurrect the tail of the outer block
  return withTemplate("<!-- phase:C -->\nOUT\n<!-- phase:C -->\nIN\n<!-- /phase -->\nAFTER-INNER\n<!-- /phase -->\nNEUTRAL", () => {
    const { r, agents } = genInto("A");
    if (r.status !== 0) return false;
    const body = fs.readFileSync(agents, "utf8");
    return /NEUTRAL/.test(body) && !/OUT/.test(body) && !/IN/.test(body) && !/AFTER-INNER/.test(body);
  });
});

test("payload: generated rules carry the governance lessons (declaration-mechanism gap, evidence tiers, test activity, enumeration re-check)", () => {
  const dir = tmp("gen-payload-lessons");
  const r = spawnSync(process.execPath, [GENERATOR, "--target", dir, "--project-name", "PayloadLessons", "--phase", "C"], { encoding: "utf8" });
  if (r.status !== 0) return false;
  const required = [
    ["docs/rules/lifecycle.md", "声明与机制的差距"],
    ["docs/rules/lifecycle.md", "必须挂三级之一"],
    ["docs/rules/lifecycle.md", "人工背书（human-attested）"],
    ["docs/rules/lifecycle.md", "枚举复查"],
    ["docs/rules/testing.md", "测试活性"],
    ["docs/rules/testing.md", "事实源规定"],
    ["docs/rules/testing.md", "空洞测试定义"],
    ["docs/rules/coding.md", "移动/重命名后复查硬编码枚举"],
    ["AGENTS.md", "Declaration vs mechanism"],
    ["AGENTS.md", "evidence tier"],
  ];
  let checked = 0;
  for (const [file, needle] of required) {
    const p = path.join(dir, file);
    if (!fs.existsSync(p)) { console.error("  missing generated file: " + file); return false; }
    if (!fs.readFileSync(p, "utf8").includes(needle)) { console.error("  " + file + " lacks: " + needle); return false; }
    checked++;
  }
  // liveness: a passing run must have read every declared pair
  return checked === required.length;
});

test("generate-governance: phase C is fully implemented (no stubs left)", () => {
  const dir = tmp("gen-phase-c");
  const r = spawnSync(process.execPath, [GENERATOR, "--target", dir, "--project-name", "S", "--phase", "C", "--json"], { encoding: "utf8" });
  if (r.status !== 0) return false;
  const out = JSON.parse(r.stdout);
  const stubs = out.results.filter((x) => x.action === "skipped" && /not implemented/.test(x.note || ""));
  return stubs.length === 0;
});


test("generate-governance: sub-skills generator writes all 8 sub-skills", () => {
  const dir = tmp("gen-subskills");
  const r = spawnSync(process.execPath, [GENERATOR, "--target", dir, "--project-name", "S", "--phase", "C"], { encoding: "utf8" });
  if (r.status !== 0) return false;
  const base = path.join(dir, ".governance/generated/skills");
  if (!fs.existsSync(base)) return false;
  const names = fs.readdirSync(base);
  const expected = ["repository-inspection", "ci-generator", "governance-validator", "state-manager", "drift-check", "release-manager", "plan-manager", "review-manager"];
  return expected.every((e) => names.includes(e) && fs.existsSync(path.join(base, e, "SKILL.md")));
});


test("generate-governance: state includes the rule-capture recovery scaffold", () => {
  const dir = tmp("gen-rule-state");
  const r = spawnSync(process.execPath, [GENERATOR, "--target", dir, "--project-name", "RuleState", "--phase", "B"], { encoding: "utf8" });
  if (r.status !== 0) return false;
  const state = JSON.parse(fs.readFileSync(path.join(dir, ".governance/state.json"), "utf8"));
  return state.rule_capture && state.rule_capture.status === "none" &&
    state.rule_capture.task_id === "" && Array.isArray(state.rule_capture.candidates);
});


test("generate-governance: CI workflow is selected by stack", () => {
  const nodeDir = tmp("gen-ci-node");
  spawnSync(process.execPath, [GENERATOR, "--target", nodeDir, "--project-name", "S", "--phase", "B", "--stack", "node"], { encoding: "utf8" });
  const pyDir = tmp("gen-ci-py");
  spawnSync(process.execPath, [GENERATOR, "--target", pyDir, "--project-name", "S", "--phase", "B", "--stack", "python"], { encoding: "utf8" });
  const nodeCi = path.join(nodeDir, ".github/workflows/ci.yml");
  const pyCi = path.join(pyDir, ".github/workflows/ci.yml");
  if (!fs.existsSync(nodeCi) || !fs.existsSync(pyCi)) return false;
  return fs.readFileSync(nodeCi, "utf8").includes("pnpm") && fs.readFileSync(pyCi, "utf8").includes("ruff");
});


test("generate-governance: gitlab platform writes .gitlab-ci.yml, none skips CI", () => {
  const glDir = tmp("gen-ci-gl");
  spawnSync(process.execPath, [GENERATOR, "--target", glDir, "--project-name", "S", "--phase", "B", "--ci-platform", "gitlab"], { encoding: "utf8" });
  const noneDir = tmp("gen-ci-none");
  spawnSync(process.execPath, [GENERATOR, "--target", noneDir, "--project-name", "S", "--phase", "B", "--ci-platform", "none"], { encoding: "utf8" });
  return fs.existsSync(path.join(glDir, ".gitlab-ci.yml")) && !fs.existsSync(path.join(noneDir, ".github/workflows/ci.yml"));
});


test("generate-governance: L0/L1 write, L3 audits only, --force-l3 overrides", () => {
  const l0 = tmp("gen-l0");
  spawnSync(process.execPath, [GENERATOR, "--target", l0, "--project-name", "S", "--phase", "B", "--maturity", "LEVEL_0_EMPTY"], { encoding: "utf8" });
  const l1 = tmp("gen-l1");
  spawnSync(process.execPath, [GENERATOR, "--target", l1, "--project-name", "S", "--phase", "B", "--maturity", "LEVEL_1_PROTOTYPE"], { encoding: "utf8" });
  const l3 = tmp("gen-l3");
  const r3 = spawnSync(process.execPath, [GENERATOR, "--target", l3, "--project-name", "S", "--phase", "B", "--maturity", "LEVEL_3_PRODUCTION"], { encoding: "utf8" });
  const l3f = tmp("gen-l3-force");
  spawnSync(process.execPath, [GENERATOR, "--target", l3f, "--project-name", "S", "--phase", "B", "--maturity", "LEVEL_3_PRODUCTION", "--force-l3"], { encoding: "utf8" });
  return fs.existsSync(path.join(l0, "AGENTS.md")) &&
    fs.existsSync(path.join(l1, "AGENTS.md")) &&
    r3.status === 0 && !fs.existsSync(path.join(l3, "AGENTS.md")) &&
    fs.existsSync(path.join(l3f, "AGENTS.md"));
});


test("generate-governance: existing doc root is respected (doc_root remap)", () => {
  const dir = tmp("gen-docroot");
  const r = spawnSync(process.execPath, [GENERATOR, "--target", dir, "--project-name", "S", "--phase", "B", "--doc-root", "documentation"], { encoding: "utf8" });
  if (r.status !== 0) return false;
  const m = JSON.parse(fs.readFileSync(path.join(dir, ".governance/manifest.json"), "utf8"));
  return fs.existsSync(path.join(dir, "documentation/ARCHITECTURE.md")) &&
    !fs.existsSync(path.join(dir, "docs")) &&
    m.doc_root === "documentation" &&
    m.artifacts.some((a) => a.path.startsWith("documentation/"));
});


test("generate-governance: --doc-root with .. cannot escape the target (containment)", () => {
  const dir = tmp("gen-docroot-escape");
  // Place a sibling dir two levels up (inside tmp) that a crafted doc-root would target.
  const escapeTarget = path.resolve(dir, "../../escape-sentinel");
  const r = spawnSync(process.execPath, [GENERATOR, "--target", dir, "--project-name", "S", "--phase", "C", "--doc-root", "../../escape-sentinel"], { encoding: "utf8" });
  // The generator must fail (blocked) rather than write outside. Allow either a nonzero
  // exit or an exit-0 run that reports the traversal paths as errors — but NEVER write the
  // sentinel files outside the target.
  return r.status !== 0 && !fs.existsSync(escapeTarget);
});


test("generate-governance: L3 audit writes nothing at all (manifest included)", () => {
  const dir = tmp("gen-l3-nowrite");
  const r = spawnSync(process.execPath, [GENERATOR, "--target", dir, "--project-name", "S", "--phase", "B", "--maturity", "LEVEL_3_PRODUCTION"], { encoding: "utf8" });
  if (r.status !== 0) return false;
  return !fs.existsSync(path.join(dir, "AGENTS.md")) && !fs.existsSync(path.join(dir, ".governance/manifest.json"));
});


test("generate-governance: second identical run creates nothing (true idempotency)", () => {
  const dir = tmp("gen-idem");
  spawnSync(process.execPath, [GENERATOR, "--target", dir, "--project-name", "S", "--phase", "C"], { encoding: "utf8" });
  const r = spawnSync(process.execPath, [GENERATOR, "--target", dir, "--project-name", "S", "--phase", "C", "--json"], { encoding: "utf8" });
  if (r.status !== 0) return false;
  const out = JSON.parse(r.stdout);
  const created = out.results.filter((x) => x.action === "created" || x.action === "created-dir");
  return created.length === 0;
});


test("generate-governance: manifest records the platform-specific CI path", () => {
  const gh = tmp("gen-mani-gh");
  spawnSync(process.execPath, [GENERATOR, "--target", gh, "--project-name", "S", "--phase", "B", "--ci-platform", "github", "--stack", "node"], { encoding: "utf8" });
  const gl = tmp("gen-mani-gl");
  spawnSync(process.execPath, [GENERATOR, "--target", gl, "--project-name", "S", "--phase", "B", "--ci-platform", "gitlab", "--stack", "node"], { encoding: "utf8" });
  const mgh = JSON.parse(fs.readFileSync(path.join(gh, ".governance/manifest.json"), "utf8"));
  const mgl = JSON.parse(fs.readFileSync(path.join(gl, ".governance/manifest.json"), "utf8"));
  const ghOk = mgh.artifacts.some((a) => a.path === ".github/workflows/ci.yml");
  const glOk = mgl.artifacts.some((a) => a.path === ".gitlab-ci.yml");
  // every manifest-listed artifact must actually exist
  const allExist = mgl.artifacts.every((a) => fs.existsSync(path.join(gl, a.path)));
  return ghOk && glOk && allExist;
});


test("generate-governance: default manifest version matches package.json", () => {
  const dir = tmp("gen-version");
  const r = spawnSync(process.execPath, [GENERATOR, "--target", dir, "--project-name", "Version", "--phase", "B"], { encoding: "utf8" });
  if (r.status !== 0) return false;
  const pkg = JSON.parse(fs.readFileSync(path.join(SKILL_ROOT, "package.json"), "utf8"));
  const manifest = JSON.parse(fs.readFileSync(path.join(dir, ".governance/manifest.json"), "utf8"));
  return manifest.governance_version === pkg.version;
});


test("generate-governance: hook artifacts use the first complete fence and are typed as scripts", () => {
  const dir = tmp("gen-hooks");
  const r = spawnSync(process.execPath, [GENERATOR, "--target", dir, "--project-name", "Hooks", "--phase", "C"], { encoding: "utf8" });
  if (r.status !== 0) return false;
  const hook = fs.readFileSync(path.join(dir, ".githooks/pre-commit"), "utf8");
  const msgHook = fs.readFileSync(path.join(dir, ".githooks/commit-msg"), "utf8");
  const manifest = JSON.parse(fs.readFileSync(path.join(dir, ".governance/manifest.json"), "utf8"));
  const hookEntries = manifest.artifacts.filter((a) => a.path.startsWith(".githooks/"));
  const modeOk = process.platform === "win32" || ((fs.statSync(path.join(dir, ".githooks/pre-commit")).mode & 0o111) !== 0 && (fs.statSync(path.join(dir, ".githooks/commit-msg")).mode & 0o111) !== 0);
  return hook.startsWith("#!/bin/sh") && msgHook === hook && !hook.includes('"staged": [') &&
    hookEntries.length === 2 && hookEntries.every((a) => a.type === "script") &&
    fs.readFileSync(path.join(dir, ".gitignore"), "utf8").includes(".governance/consent.json") && modeOk;
});


test("generate-governance: --file phase drives generation (not just the echoed input)", () => {
  const dir = tmp("gen-file-phase");
  const input = path.join(dir, "input.json");
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(input, JSON.stringify({ project_name: "FilePhase", phase: "C" }));
  const target = path.join(dir, "proj");
  const r = spawnSync(process.execPath, [GENERATOR, "--target", target, "--file", input, "--json"], { encoding: "utf8" });
  if (r.status !== 0) return false;
  const out = JSON.parse(r.stdout);
  const skills = fs.existsSync(path.join(target, ".governance/generated/skills"));
  const agents = fs.readFileSync(path.join(target, "AGENTS.md"), "utf8");
  return out.phase === "C" && skills && !agents.includes("**Availability:**");
});


test("generate-governance: registry caps triggers for BOTH separator styles", () => {
  const dir = tmp("gen-registry-density");
  const r = spawnSync(process.execPath, [GENERATOR, "--target", dir, "--project-name", "Density", "--phase", "A"], { encoding: "utf8" });
  if (r.status !== 0) return false;
  const rows = fs.readFileSync(path.join(dir, "AGENTS.md"), "utf8")
    .split("\n")
    .filter((l) => l.startsWith("| ") && l.includes(".governance/generated/skills/"));
  if (rows.length === 0) return false;
  // review-manager separates triggers with "·" — the previous comma-only split left it
  // uncapped at 700+ chars. Every row must now stay bounded.
  return rows.every((l) => l.length < 320);
});


test("generate-governance: partial init registry notes Phase C availability (full init omits note)", () => {
  const dirA = tmp("gen-registry-a");
  spawnSync(process.execPath, [GENERATOR, "--target", dirA, "--project-name", "RegA", "--phase", "A"]);
  const a = fs.readFileSync(path.join(dirA, "AGENTS.md"), "utf8");
  if (!a.includes("**Availability:**") || !a.includes("Phase C")) return false;
  const dirC = tmp("gen-registry-c");
  spawnSync(process.execPath, [GENERATOR, "--target", dirC, "--project-name", "RegC", "--phase", "C"]);
  const c = fs.readFileSync(path.join(dirC, "AGENTS.md"), "utf8");
  return c.includes("review-manager") && !c.includes("**Availability:**");
});

};
