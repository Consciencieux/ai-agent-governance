// tests/suites/validator.test.js — batch-1 migration from tests/run-tests.js (anti-patch plan §3).
// Verbatim region move (marker-to-marker); helper consolidation into tests/support/ is batch 2.


const fs = require("fs");
const path = require("path");

module.exports = (test) => {
test("empty project exits 1 (governance missing)", () => {
  const dir = tmp("empty");
  const r = run(dir);
  return r.status === 1;
});

test("full default structure exits 0 (defaults mode)", () => {  const dir = tmp("full");
  buildFullDefault(dir);

  const r = run(dir, ["--json"]);
  if (r.status !== 0) return false;
  const out = JSON.parse(r.stdout);
  // 21 = the DEFAULTS baseline; generated-skills checks append only when the
  // .governance/generated/skills/ tree exists (this fixture has none).
  return out.total === 21 && out.total === out.passed;
});

test("empty CI workflow directory does not satisfy the validator", () => {
  const dir = tmp("empty-ci");
  buildFullDefault(dir);
  fs.rmSync(path.join(dir, ".github/workflows/ci.yml"));
  const r = run(dir, ["--json"]);
  if (r.status !== 1) return false;
  const report = JSON.parse(r.stdout);
  const ci = report.results.find((x) => x.name === "CI workflow");
  return ci && ci.ok === false;
});

test("skeleton ARCHITECTURE.md fails (wrong-but-present)", () => {
  const dir = tmp("arch-skeleton");
  buildFullDefault(dir);
  write(path.join(dir, "docs", "ARCHITECTURE.md"), "# Architecture\n\n## Component Registry\n\n| Component | Responsibility | Dependencies | Entry |\n| --- | --- | --- | --- |\n| <!-- add rows as components are registered --> | | | |\n");
  const r = run(dir);
  return r.status === 1 && r.stdout.includes("Architecture doc");
});

test("ARCHITECTURE.md in list/prose form passes (form is not constrained)", () => {
  const dir = tmp("arch-list");
  buildFullDefault(dir);
  write(path.join(dir, "docs", "ARCHITECTURE.md"), "# Architecture\n\n## Components\n\n- auth: login (src/auth.ts)\n- db: persistence\n");
  const r = run(dir);
  return r.status === 0;
});

test("ARCHITECTURE.md unreplaced placeholder fails", () => {
  const dir = tmp("arch-placeholder");
  buildFullDefault(dir);
  write(path.join(dir, "docs", "ARCHITECTURE.md"), "# Architecture\n\n{{ONE_SENTENCE_DESCRIPTION}}\n");
  const r = run(dir);
  return r.status === 1;
});

test("ARCHITECTURE.md headings-only skeleton fails", () => {
  const dir = tmp("arch-headings");
  buildFullDefault(dir);
  write(path.join(dir, "docs", "ARCHITECTURE.md"), "# Architecture\n\n## Overview\n\n## Data Flow\n\n<!-- describe -->\n");
  const r = run(dir);
  return r.status === 1;
});

test("custom doc root (documentation/) follows manifest (manifest mode)", () => {
  const dir = tmp("custom");
  const dirs = ["documentation/features", "documentation/plans", "documentation/rules", ".governance", ".github/workflows", "scripts"];
  for (const d of dirs) fs.mkdirSync(path.join(dir, d), { recursive: true });
  const files = [
    ["AGENTS.md", "x"],
    ["CHANGELOG.md", "## [Unreleased]\n"],
    ["documentation/ARCHITECTURE.md", "x"],
    ["documentation/features/auth.md", "x"],
    ["documentation/plans/DEVELOPMENT_PLAN.md", "x"],
    ["documentation/rules/lifecycle.md", "x"],
    [".gitignore", "x"],
    [".env.example", "x"],
    [".github/workflows/ci.yml", "x"],
    [".governance/state.json", "{}"],
    [".governance/preflight.json", "{}"],
  ];
  for (const [p, c] of files) write(path.join(dir, p), c);
  const manifest = {
    schema_version: "1.0",
    governance_version: "1.0.0",
    release: { version: "1.0.0", tag: "v1.0.0", validated: false },
    doc_root: "documentation",
    artifacts: [
      { name: "AGENTS.md", path: "AGENTS.md", kind: "file" },
      { name: "CHANGELOG.md", path: "CHANGELOG.md", kind: "file" },
      { name: "Architecture doc", path: "documentation/ARCHITECTURE.md", kind: "file" },
      { name: "Feature registry", path: "documentation/features", kind: "dir" },
      { name: "Plans", path: "documentation/plans", kind: "dir" },
      { name: "Rules", path: "documentation/rules", kind: "dir" },
    ],
  };
  write(path.join(dir, ".governance/manifest.json"), JSON.stringify(manifest));
  write(path.join(dir, ".governance/git-policy.json"), JSON.stringify({ protectedBranches: ["main"], directPush: false, requireReview: true, allowForcePush: false }));
  fs.copyFileSync(VALIDATOR, path.join(dir, "scripts/verify-governance.js"));
  fs.copyFileSync(SYNC_CHECK, path.join(dir, "scripts/check-sync.js"));

  const r = run(dir);
  return r.status === 0 && r.stdout.includes("mode: manifest") && r.stdout.includes("13/13 checks passed.");
});

test("manifest without governance_version exits 1", () => {
  const dir = tmp("noversion");
  fs.mkdirSync(path.join(dir, ".governance"), { recursive: true });
  fs.mkdirSync(path.join(dir, "scripts"), { recursive: true });
  write(path.join(dir, ".governance/manifest.json"), JSON.stringify({ schema_version: "1.0", artifacts: [] }));
  fs.copyFileSync(VALIDATOR, path.join(dir, "scripts/verify-governance.js"));

  const r = run(dir);
  return r.status === 1 && r.stdout.includes("Governance version");
});

test("--json reports passedAll, mode and governance_version", () => {
  const dir = tmp("json");
  buildFullDefault(dir);

  const r = run(dir, ["--json"]);
  if (r.status !== 0) return false;
  const out = JSON.parse(r.stdout);
  return (
    out.mode === "defaults" &&
    out.passedAll === true &&
    out.governance_version === "1.0.0" &&
    Array.isArray(out.results) &&
    out.results.length === 21 &&
    out.score === 1
  );
});

test("--json score reflects partial failures (20/21)", () => {
  const dir = tmp("score");
  buildFullDefault(dir);
  fs.rmSync(path.join(dir, ".env.example"));

  const r = run(dir, ["--json"]);
  if (r.status !== 1) return false;
  const out = JSON.parse(r.stdout);
  return out.total === 21 && out.passed === 20 && Math.abs(out.score - 20 / 21) < 1e-9;
});

test("--help exits 0 and prints usage", () => {
  const dir = tmp("help");
  const r = run(dir, ["--help"]);
  return r.status === 0 && r.stdout.includes("Usage:") && r.stdout.includes("--json");
});

test("validator uses .governance only and leaves no .agent dir", () => {
  const dir = tmp("noagent");
  buildFullDefault(dir);
  const r = run(dir);
  return (
    r.status === 0 &&
    r.stdout.includes(".governance manifest") &&
    !fs.existsSync(path.join(dir, ".agent"))
  );
});

test("validation.json present is optional and still passes", () => {
  const dir = tmp("withval");
  buildFullDefault(dir);
  write(path.join(dir, ".governance/validation.json"), "{}");
  const r = run(dir);
  return (
    r.status === 0 &&
    r.stdout.includes("21/21 checks passed.") &&
    !r.stdout.includes(".governance validation")
  );
});


test("validator: missing .governance dir exits 1", () => {
  const dir = tmp("no-gov-dir");
  buildFullDefault(dir);
  fs.rmSync(path.join(dir, ".governance"), { recursive: true, force: true });
  const r = run(dir);
  return r.status === 1 && r.stdout.includes(".governance state dir");
});

test("validator: malformed manifest.json falls back to defaults, exits 1", () => {
  const dir = tmp("bad-manifest-json");
  buildFullDefault(dir);
  write(path.join(dir, ".governance/manifest.json"), "{ not valid json");
  const r = run(dir);
  // unparseable manifest => loadManifestChecks() returns null => defaults mode,
  // and "Governance version" cannot be read => must fail, never silently pass
  return r.status === 1 && r.stdout.includes("mode: defaults") && r.stdout.includes("Governance version");
});

// v1.0.0 pair regression: the release's manifest carried version 1.0.0 next to tag
// v0.15.0 in the shipped examples (check-doc-consistency's pair check reaches .md only,
// not JSON). checkReleaseMeta now enforces tag === "v" + version in the real manifest
// file — the state a release reads. Both shapes pinned. Uses a manifest-mode fixture
// (buildFullDefault has artifacts: [] so it runs DEFAULTS mode, where release is not
// checked — a real governed project runs this check in manifest mode).
function buildReleaseMetaFixture(dir, rel) {
  const dirs = ["docs/features", "docs/plans", "docs/rules", ".governance", ".github/workflows", "scripts"];
  for (const d of dirs) fs.mkdirSync(path.join(dir, d), { recursive: true });
  write(path.join(dir, "AGENTS.md"), "x");
  write(path.join(dir, "CHANGELOG.md"), "## [Unreleased]\n");
  write(path.join(dir, "docs/ARCHITECTURE.md"), "# Arch\n\n## Component Registry\n\n| Component | Responsibility |\n| --- | --- |\n| auth | login |\n");
  write(path.join(dir, "docs/features/auth.md"), "x");
  write(path.join(dir, "docs/plans/DEVELOPMENT_PLAN.md"), "x");
  write(path.join(dir, "docs/rules/lifecycle.md"), "x");
  write(path.join(dir, ".gitignore"), "x");
  write(path.join(dir, ".env.example"), "x");
  write(path.join(dir, ".github/workflows/ci.yml"), "x");
  write(path.join(dir, ".governance/state.json"), "{}");
  write(path.join(dir, ".governance/preflight.json"), "{}");
  const manifest = {
    schema_version: "1.0",
    governance_version: "1.0.0",
    release: rel,
    doc_root: "docs",
    artifacts: [
      { name: "AGENTS.md", path: "AGENTS.md", kind: "file" },
      { name: "CHANGELOG.md", path: "CHANGELOG.md", kind: "file" },
      { name: "Architecture doc", path: "docs/ARCHITECTURE.md", kind: "file" },
      { name: "Feature registry", path: "docs/features", kind: "dir" },
      { name: "Plans", path: "docs/plans", kind: "dir" },
      { name: "Rules", path: "docs/rules", kind: "dir" },
      { name: ".gitignore", path: ".gitignore", kind: "file" },
      { name: ".env.example", path: ".env.example", kind: "file" },
      { name: "CI workflow", path: ".github/workflows/ci.yml", kind: "file" },
    ],
  };
  write(path.join(dir, ".governance/manifest.json"), JSON.stringify(manifest));
  write(path.join(dir, ".governance/git-policy.json"), JSON.stringify({ protectedBranches: ["main", "master"], directPush: false, requireReview: true, allowForcePush: false }));
  fs.copyFileSync(VALIDATOR, path.join(dir, "scripts/verify-governance.js"));
  fs.copyFileSync(GIT_POLICY_CHECK, path.join(dir, "scripts/check-git-policy.js"));
  fs.copyFileSync(SYNC_CHECK, path.join(dir, "scripts/check-sync.js"));
  write(path.join(dir, ".governance/sync-rules.json"), JSON.stringify({ groups: [] }));
}

test("validator: manifest release tag must match its version", () => {
  const dir = tmp("rel-tag-stale");
  buildReleaseMetaFixture(dir, { version: "1.0.0", tag: "v0.15.0", validated: false });
  const r = run(dir);
  return r.status === 1 && r.stdout.includes("Release metadata");
});

test("validator: manifest release tag matching its version passes", () => {
  const dir = tmp("rel-tag-ok");
  buildReleaseMetaFixture(dir, { version: "1.0.0", tag: "v1.0.0", validated: false });
  const r = run(dir);
  return r.status === 0 && !r.stdout.includes("Release metadata ✗");
});

};
