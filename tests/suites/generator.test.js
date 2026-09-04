// tests/suites/generator.test.js — batch-1 migration from tests/run-tests.js (anti-patch plan §3).
// Verbatim region move (marker-to-marker); helper consolidation into tests/support/ is batch 2.


const { spawnSync } = require("child_process");
const fs = require("fs");
const path = require("path");

module.exports = (test) => {
function listFiles(dir) {
  const out = [];
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) out.push(...listFiles(p));
    else out.push(p);
  }
  return out.sort();
}

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
    "AGENTS.md",
    "CHANGELOG.md",
    "README.md",
    "docs/features/.gitkeep",
    "docs/plans/DEVELOPMENT_PLAN.md",
    "docs/plans/archive/.gitkeep",
    "docs/ARCHITECTURE.md",
  ];
  const actual = [];
  for (const e of expected) {
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
  return count("policy") === 9 && count("script") === 5 && count("state") === 6 && validKinds && agentsType === "policy";
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
  const r = spawnSync(process.execPath, [GENERATOR, "--target", dir, "--project-name", "Dry", "--phase", "A", "--dry-run"], { encoding: "utf8" });
  return r.status === 0 && !fs.existsSync(dir + "/AGENTS.md");
});

test("generate-governance: --json outputs structured result", () => {
  const dir = tmp("gen-jsonout");
  const r = spawnSync(process.execPath, [GENERATOR, "--target", dir, "--project-name", "JsonTest", "--phase", "A", "--json"], { encoding: "utf8" });
  if (r.status !== 0) return false;
  const out = JSON.parse(r.stdout);
  return out.phase === "A" && Array.isArray(out.results) && out.results.length === 13;
});

test("generate-governance: missing --project-name exits 2", () => {
  const dir = tmp("gen-noname");
  const r = spawnSync(process.execPath, [GENERATOR, "--target", dir], { encoding: "utf8" });
  return r.status === 2;
});

};
