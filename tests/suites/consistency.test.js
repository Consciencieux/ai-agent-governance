// tests/suites/consistency.test.js — batch-1 migration from tests/run-tests.js (anti-patch plan §3).
// Verbatim region move (marker-to-marker); helper consolidation into tests/support/ is batch 2.


const { spawnSync } = require("child_process");
const fs = require("fs");
const path = require("path");

module.exports = (test) => {

test("check-sync: changed src without ARCHITECTURE.md exits 1", () => {
  const dir = tmp("sync-unsynced");
  gitInit(dir);
  fs.mkdirSync(path.join(dir, "src"), { recursive: true });
  write(path.join(dir, "src", "a.ts"), "x");
  spawnSync("git", ["add", "src/a.ts"], { cwd: dir });
  write(
    path.join(dir, ".governance", "sync-rules.json"),
    JSON.stringify({ syncGroups: [{ name: "api-architecture", watch: ["src/**"], require: ["docs/ARCHITECTURE.md"] }] })
  );
  write(path.join(dir, ".governance", "state.json"), JSON.stringify({ task_start_sha: "" }));
  fs.mkdirSync(path.join(dir, "scripts"), { recursive: true });
  fs.copyFileSync(SYNC_CHECK, path.join(dir, "scripts/check-sync.js"));
  const r = spawnSync(process.execPath, [SYNC_CHECK], { cwd: dir, encoding: "utf8" });
  return r.status === 1 && r.stderr.includes("api-architecture");
});

test("check-sync: changed src AND ARCHITECTURE.md exits 0", () => {
  const dir = tmp("sync-ok");
  gitInit(dir);
  fs.mkdirSync(path.join(dir, "src"), { recursive: true });
  fs.mkdirSync(path.join(dir, "docs"), { recursive: true });
  write(path.join(dir, "src", "a.ts"), "x");
  write(path.join(dir, "docs", "ARCHITECTURE.md"), "y");
  spawnSync("git", ["add", "src/a.ts", "docs/ARCHITECTURE.md"], { cwd: dir });
  write(
    path.join(dir, ".governance", "sync-rules.json"),
    JSON.stringify({ syncGroups: [{ name: "api-architecture", watch: ["src/**"], require: ["docs/ARCHITECTURE.md"] }] })
  );
  write(path.join(dir, ".governance", "state.json"), JSON.stringify({ task_start_sha: "" }));
  fs.mkdirSync(path.join(dir, "scripts"), { recursive: true });
  fs.copyFileSync(SYNC_CHECK, path.join(dir, "scripts/check-sync.js"));
  const r = spawnSync(process.execPath, [SYNC_CHECK], { cwd: dir, encoding: "utf8" });
  return r.status === 0;
});

test("check-sync: existing task_start_sha is honoured (resume, not recomputed)", () => {
  const dir = tmp("sync-resume");
  gitInit(dir);
  const firstSha = gitHead(dir);
  // a second commit happens mid-task: the recorded task_start_sha must still be the first
  fs.mkdirSync(path.join(dir, "src"), { recursive: true });
  write(path.join(dir, "src", "a.ts"), "x");
  spawnSync("git", ["add", "src/a.ts"], { cwd: dir });
  spawnSync("git", ["commit", "-q", "-m", "mid-task commit"], { cwd: dir });
  write(path.join(dir, ".governance", "sync-rules.json"),
    JSON.stringify({ syncGroups: [{ name: "api-architecture", watch: ["src/**"], require: ["docs/ARCHITECTURE.md"] }] }));
  write(path.join(dir, ".governance", "state.json"), JSON.stringify({ task_start_sha: firstSha }));
  const r = spawnSync(process.execPath, [SYNC_CHECK, "--json"], { cwd: dir, encoding: "utf8" });
  const out = JSON.parse(r.stdout);
  // base must equal the recorded SHA (resume), and the committed src change must be detected
  return out.base === firstSha && r.status === 1 && out.unsynced.some((u) => u.group === "api-architecture");
});

test("check-sync: writes the sync section into drift-report.json", () => {
  const dir = tmp("sync-drift");
  gitInit(dir);
  fs.mkdirSync(path.join(dir, "src"), { recursive: true });
  write(path.join(dir, "src", "a.ts"), "x");
  spawnSync("git", ["add", "src/a.ts"], { cwd: dir });
  write(path.join(dir, ".governance", "sync-rules.json"),
    JSON.stringify({ syncGroups: [{ name: "api-architecture", watch: ["src/**"], require: ["docs/ARCHITECTURE.md"] }] }));
  write(path.join(dir, ".governance", "state.json"), JSON.stringify({ task_start_sha: "" }));
  spawnSync(process.execPath, [SYNC_CHECK], { cwd: dir, encoding: "utf8" });
  const dr = path.join(dir, ".governance", "drift-report.json");
  if (!fs.existsSync(dr)) return false;
  const j = JSON.parse(fs.readFileSync(dr, "utf8"));
  return j.sync && j.sync.clean === false && j.sync.unsynced.includes("api-architecture");
});

test("check-sync: NUL status parsing preserves untracked unicode/space paths", () => {
  const dir = tmp("sync-untracked-paths");
  gitInit(dir);
  write(path.join(dir, "src", "new file 中文.ts"), "x");
  write(path.join(dir, "docs", "ARCHITECTURE.md"), "architecture");
  write(path.join(dir, ".governance", "sync-rules.json"),
    JSON.stringify({ syncGroups: [{ name: "api-architecture", watch: ["src/**"], require: ["docs/ARCHITECTURE.md"] }] }));
  write(path.join(dir, ".governance", "state.json"), JSON.stringify({ task_start_sha: "" }));
  const r = spawnSync(process.execPath, [SYNC_CHECK, "--json"], { cwd: dir, encoding: "utf8" });
  if (r.status !== 0) return false;
  const out = JSON.parse(r.stdout);
  return out.clean === true && out.unsynced.length === 0;
});

test("check-sync: --advisory reports unsynced groups but exits 0", () => {
  const dir = tmp("sync-advisory");
  gitInit(dir);
  fs.mkdirSync(path.join(dir, "src"), { recursive: true });
  write(path.join(dir, "src", "a.ts"), "x");
  spawnSync("git", ["add", "src/a.ts"], { cwd: dir });
  write(path.join(dir, ".governance", "sync-rules.json"),
    JSON.stringify({ syncGroups: [{ name: "api-architecture", watch: ["src/**"], require: ["docs/ARCHITECTURE.md"] }] }));
  write(path.join(dir, ".governance", "state.json"), JSON.stringify({ task_start_sha: "" }));
  const r = spawnSync(process.execPath, [SYNC_CHECK, "--advisory", "--json"], { cwd: dir, encoding: "utf8" });
  if (r.status !== 0) return false;
  const out = JSON.parse(r.stdout);
  return out.clean === false && out.unsynced.some((u) => u.group === "api-architecture");
});

test("check-secrets: github_pat_ form hits github-pat pattern", () => {
  const dir = tmp("secrets-pat2");
  gitInit(dir);
  const value = assemble("github_pat_", "Q0ABCDEFGHIJKLMNOPQRSTUV1234567890");
  write(path.join(dir, "ci.yml"), assemble("token: ", value));
  spawnSync("git", ["add", "ci.yml"], { cwd: dir });
  const r = spawnSync(process.execPath, [SECRET_CHECK], { cwd: dir, encoding: "utf8" });
  return r.status === 1 && r.stderr.includes("github-pat") && !r.stderr.includes(value);
});

test("check-secrets: generic connection string hits generic-connection-string pattern", () => {
  const dir = tmp("secrets-connstr");
  gitInit(dir);
  const value = assemble("mongodb://", "appuser:supersecretpass", "@db.internal:27017/app");
  write(path.join(dir, "config.js"), assemble("const db = '", value, "';"));
  spawnSync("git", ["add", "config.js"], { cwd: dir });
  const r = spawnSync(process.execPath, [SECRET_CHECK], { cwd: dir, encoding: "utf8" });
  return r.status === 1 && r.stderr.includes("generic-connection-string") && !r.stderr.includes("supersecretpass");
});

test("check-secrets: modified-file hunk reports the correct line number", () => {
  const dir = tmp("secrets-modified");
  gitInit(dir);
  // COMMIT the baseline first: only then is the staged diff a real modification hunk
  // (@@ -1,3 +1,4 @@ with context lines), which is what exercises the line counter.
  write(path.join(dir, "app.js"), "const a = 1;\nconst b = 2;\nconst c = 3;\n");
  spawnSync("git", ["add", "app.js"], { cwd: dir });
  spawnSync("git", ["-c", "user.email=t@t", "-c", "user.name=t", "commit", "-q", "-m", "baseline"], { cwd: dir });
  const secretLine = assemble("const to", "ken = 'abcdefgh", "12345678';");
  write(path.join(dir, "app.js"), "const a = 1;\nconst b = 2;\nconst c = 3;\n" + secretLine + "\n");
  spawnSync("git", ["add", "app.js"], { cwd: dir });
  const raw = spawnSync("git", ["diff", "--cached", "-U0"], { cwd: dir, encoding: "utf8" });
  if (!/^@@ -\d+(,\d+)? \+\d+/m.test(String(raw.stdout)) || /@@ -0,0/.test(String(raw.stdout))) return false;
  const r = spawnSync(process.execPath, [SECRET_CHECK, "--json"], { cwd: dir, encoding: "utf8" });
  if (r.status !== 1) return false;
  const out = JSON.parse(r.stdout);
  return out.hits.length === 1 && out.hits[0].pattern === "credential-assignment" && out.hits[0].line === 4;
});

test("check-sync: rename matching uses the destination path", () => {
  const dir = tmp("sync-rename-path");
  gitInit(dir);
  write(path.join(dir, "legacy", "old name 中文.ts"), "x");
  spawnSync("git", ["add", "legacy"], { cwd: dir });
  spawnSync("git", ["commit", "-q", "-m", "add legacy file"], { cwd: dir });
  fs.mkdirSync(path.join(dir, "src"), { recursive: true });
  fs.renameSync(path.join(dir, "legacy", "old name 中文.ts"), path.join(dir, "src", "new name 中文.ts"));
  spawnSync("git", ["add", "-A"], { cwd: dir });
  write(path.join(dir, ".governance", "sync-rules.json"),
    JSON.stringify({ syncGroups: [
      { name: "new-path", watch: ["src/**"], require: ["docs/ARCHITECTURE.md"] },
      { name: "old-path", watch: ["legacy/**"], require: ["docs/ARCHITECTURE.md"] },
    ] }));
  write(path.join(dir, ".governance", "state.json"), JSON.stringify({ task_start_sha: "" }));
  const r = spawnSync(process.execPath, [SYNC_CHECK, "--json"], { cwd: dir, encoding: "utf8" });
  if (r.status !== 1) return false;
  const out = JSON.parse(r.stdout);
  return out.unsynced.some((u) => u.group === "new-path") && !out.unsynced.some((u) => u.group === "old-path");
});

test("check-sync: malformed policy and state exit 1 (fail-closed)", () => {
  const badPolicy = tmp("sync-bad-policy");
  gitInit(badPolicy);
  write(path.join(badPolicy, ".governance/sync-rules.json"), "{ not valid json");
  const p = spawnSync(process.execPath, [SYNC_CHECK], { cwd: badPolicy, encoding: "utf8" });
  const badState = tmp("sync-bad-state");
  gitInit(badState);
  write(path.join(badState, ".governance/sync-rules.json"), JSON.stringify({ syncGroups: [] }));
  write(path.join(badState, ".governance/state.json"), "{ not valid json");
  const s = spawnSync(process.execPath, [SYNC_CHECK], { cwd: badState, encoding: "utf8" });
  return p.status === 1 && s.status === 1 && /refusing to proceed/.test(p.stderr) && /refusing to proceed/.test(s.stderr);
});

test("validator: missing check-sync.js exits 1", () => {
  const dir = tmp("nosync");
  buildFullDefault(dir);
  fs.rmSync(path.join(dir, "scripts/check-sync.js"));
  const r = run(dir);
  return r.status === 1 && r.stdout.includes("Sync groups check");
});

test("validator: manifest sync check keeps an explicit false ok field", () => {
  const dir = tmp("nosync-json");
  buildFullDefault(dir);
  fs.rmSync(path.join(dir, "scripts/check-sync.js"));
  const r = run(dir, ["--json"]);
  if (r.status !== 1) return false;
  const out = JSON.parse(r.stdout);
  const check = out.results.find((x) => x.name === "Sync groups check");
  return check && check.ok === false;
});


test("doc consistency: clean repo exits 0 with no issues", () => {
  const dir = tmp("consistency-clean");
  // minimal valid repo: version example matches package.json, protected-files source present
  write(path.join(dir, "package.json"), JSON.stringify({ version: "1.2.3" }));
  write(path.join(dir, "docs", "rules", "governance-files.md"), "| Path | Nature |\n| --- | --- |\n| `AGENTS.md` | entry |\n");
  write(path.join(dir, "docs", "en", "doc.md"), "# Doc\n\n## Section\n");
  write(path.join(dir, "docs", "zh-CN", "doc.md"), "# Doc\n\n## Section\n");
  write(path.join(dir, "docs", "zh-TW", "doc.md"), "# Doc\n\n## Section\n");
  write(path.join(dir, "docs", "zh-CN", "README.md"), "# R\n\n## S\n");
  write(path.join(dir, "docs", "zh-TW", "README.md"), "# R\n\n## S\n");
  write(path.join(dir, "README.md"), "# R\n\n## S\n");
  const r = spawnSync(process.execPath, [CONSISTENCY_CHECK, "--json"], { cwd: dir, encoding: "utf8" });
  const out = JSON.parse(r.stdout);
  return r.status === 0 && Object.values(out.issues).every((v) => (Array.isArray(v) ? v.length === 0 : true));
});

test("doc consistency: stale version example in SKILL.md-style doc is flagged", () => {
  const dir = tmp("consistency-version");
  write(path.join(dir, "package.json"), JSON.stringify({ version: "2.0.0" }));
  write(path.join(dir, "SKILL.md"), 'governance_version": "1.0.0"');
  const r = spawnSync(process.execPath, [CONSISTENCY_CHECK, "--json"], { cwd: dir, encoding: "utf8" });
  const out = JSON.parse(r.stdout);
  return r.status === 0 && out.issues.version_examples.some((i) => i.includes("1.0.0"));
});

test("doc consistency: broken relative link is flagged", () => {
  const dir = tmp("consistency-link");
  write(path.join(dir, "README.md"), "[missing](docs/does-not-exist.md)");
  const r = spawnSync(process.execPath, [CONSISTENCY_CHECK, "--json"], { cwd: dir, encoding: "utf8" });
  const out = JSON.parse(r.stdout);
  return r.status === 0 && out.issues.broken_links.some((i) => i.includes("does-not-exist.md"));
});

test("doc consistency: archive links are scanned on Windows path separators", () => {
  const dir = tmp("consistency-archive-link");
  write(path.join(dir, "package.json"), JSON.stringify({ version: "1.0.0" }));
  write(path.join(dir, "docs/archive/old.md"), "[missing](../does-not-exist.md)\n");
  const r = spawnSync(process.execPath, [CONSISTENCY_CHECK, "--json"], { cwd: dir, encoding: "utf8" });
  const out = JSON.parse(r.stdout);
  return r.status === 0 && out.issues.broken_links.some((i) => i.includes("docs/archive/old.md") && i.includes("does-not-exist.md"));
});


test("doc consistency: numeric claim mismatch with validator source is flagged", () => {
  const dir = tmp("consistency-numeric");
  // 20-item DEFAULTS array + README claiming 99
  write(path.join(dir, "scripts", "verify_governance.js"),
    "const DEFAULTS = [\n  [\"a\", \"a\", isFile],\n  [\"b\", \"b\", isFile],\n  [\"c\", \"c\", isFile],\n  [\"d\", \"d\", isFile],\n  [\"e\", \"e\", isFile],\n];\n");
  write(path.join(dir, "README.md"), "the validator has 99 checks");
  const r = spawnSync(process.execPath, [CONSISTENCY_CHECK, "--json"], { cwd: dir, encoding: "utf8" });
  const out = JSON.parse(r.stdout);
  return r.status === 0 && out.issues.numeric_claims.some((i) => i.includes("99"));
});

test("doc consistency: parity unavailable is reported, not claimed as pass", () => {
  const dir = tmp("consistency-noparity");
  write(path.join(dir, "package.json"), JSON.stringify({ version: "1.0.0" }));
  // no scripts/check-doc-parity.js in this fixture
  const r = spawnSync(process.execPath, [CONSISTENCY_CHECK, "--json"], { cwd: dir, encoding: "utf8" });
  const out = JSON.parse(r.stdout);
  return r.status === 0 && out.parity === "unavailable";
});

test("doc consistency: sub-skill trigger missing from commands.md is flagged", () => {
  const dir = tmp("consistency-prompt");
  // fixture: sub-skills.md with one trigger, commands.md without it
  write(path.join(dir, "references", "templates", "sub-skills.md"),
    'description: ... Triggers on "unique-trigger-xyz".');
  write(path.join(dir, "docs", "en", "commands.md"), "# Commands\n\nno such trigger here\n");
  const r = spawnSync(process.execPath, [CONSISTENCY_CHECK, "--json"], { cwd: dir, encoding: "utf8" });
  const out = JSON.parse(r.stdout);
  return r.status === 0 && out.issues.prompt_sync.some((i) => i.includes("unique-trigger-xyz"));
});

test("check-plan-delivery: archived plan declaring a missing file exits 1 in gate mode", () => {
  const dir = tmp("plandel-missing");
  buildPlanRepo(dir, "# P\n\n### Affected Files\n\n- `references/templates/never-created.md` — new\n");
  const r = spawnSync(process.execPath, [PLAN_DELIVERY, "--gate"], { cwd: dir, encoding: "utf8" });
  return r.status === 1 && r.stdout.includes("never-created.md");
});

test("check-plan-delivery: delivered declaration exits 0", () => {
  const dir = tmp("plandel-ok");
  buildPlanRepo(dir, "# P\n\n### Affected Files\n\n- `references/templates/real.md` — new\n");
  fs.writeFileSync(path.join(dir, "references/templates/real.md"), "x", "utf8");
  const r = spawnSync(process.execPath, [PLAN_DELIVERY, "--gate"], { cwd: dir, encoding: "utf8" });
  return r.status === 0;
});

test("check-plan-delivery: design-only plan is skipped", () => {
  const dir = tmp("plandel-design");
  fs.mkdirSync(path.join(dir, "docs/en/plans"), { recursive: true });
  fs.writeFileSync(path.join(dir, "docs/en/plans/future.md"), "# F\n\n> **Status: design plan, not implemented.**\n\n### Affected Files\n\n- `references/templates/not-yet.md` — new\n", "utf8");
  const r = spawnSync(process.execPath, [PLAN_DELIVERY, "--gate"], { cwd: dir, encoding: "utf8" });
  return r.status === 0;
});

test("check-plan-delivery: behavioural declaration is verified (writes: X in Y)", () => {
  const dir = tmp("plandel-behaviour");
  fs.mkdirSync(path.join(dir, "docs/archive"), { recursive: true });
  fs.mkdirSync(path.join(dir, "scripts"), { recursive: true });
  write(path.join(dir, "docs/archive/p.md"), "# P\n\n### Affected Files\n\n- writes: `report.json` in `scripts/x.js`\n");
  write(path.join(dir, "scripts/x.js"), "// nothing");
  const bad = spawnSync(process.execPath, [PLAN_DELIVERY, "--gate"], { cwd: dir, encoding: "utf8" });
  write(path.join(dir, "scripts/x.js"), "fs.writeFileSync(\"report.json\", d)");
  const good = spawnSync(process.execPath, [PLAN_DELIVERY, "--gate"], { cwd: dir, encoding: "utf8" });
  return bad.status === 1 && /behaviour/.test(bad.stdout) && good.status === 0;
});

test("check-plan-delivery: --plan on a missing file errors, not silent pass", () => {
  const dir = tmp("plandel-planmissing");
  fs.mkdirSync(path.join(dir, "docs/en/plans"), { recursive: true });
  const r = spawnSync(process.execPath, [PLAN_DELIVERY, "--plan", "docs/en/plans/absent.md"], { cwd: dir, encoding: "utf8" });
  return r.status === 1 && r.stdout.includes("plan not found");
});

test("check-plan-delivery: a bare bashname matches its runtime artifact (normalisation)", () => {
  // A plan citing the bare "git-policy.json" resolves to the .governance/git-policy.json
  // runtime artifact — must NOT be a vacuous substring pass of an unrelated fragment.
  const dir = tmp("plandel-basename");
  fs.mkdirSync(path.join(dir, "docs/archive"), { recursive: true });
  fs.mkdirSync(path.join(dir, "references/templates"), { recursive: true });
  fs.mkdirSync(path.join(dir, "scripts"), { recursive: true });
  fs.writeFileSync(path.join(dir, "references/templates/git-policy.template.md"), "x git-policy.json x", "utf8");
  fs.writeFileSync(path.join(dir, "scripts/verify_governance.js"), "// governance git-policy.json", "utf8");
  // A plan declaring "git-policy.json" must resolve (its generating logic exists), and the
  // identifier corpus must be able to find it WITHOUT the checker's own source counting.
  fs.writeFileSync(path.join(dir, "docs/archive/p.md"),
    "# P\n\n### Affected Files\n\n- `git-policy.json` — runtime artifact\n");
  const r = spawnSync(process.execPath, [PLAN_DELIVERY, "--gate"], { cwd: dir, encoding: "utf8" });
  return r.status === 0;
});

test("check-plan-delivery: ## Affected Files is extracted (template heading level)", () => {
  // C1: the section anchor was the literal "###", which matches inside "####" but never
  // inside "##" — so a plan written with `## Affected Files` extracted nothing and the
  // script still printed "every declared path delivered". That is the heading level the
  // SHIPPED plan template uses (references/templates/sub-skills.md), so every plan written
  // to this skill's own template was unverifiable in a governed project (audit 2026-09-05).
  const dir = tmp("plandel-h2");
  buildPlanRepo(dir, "# P\n\n## Affected Files\n\n- `references/templates/never-created-h2.md` — new\n");
  const r = spawnSync(process.execPath, [PLAN_DELIVERY, "--gate"], { cwd: dir, encoding: "utf8" });
  return r.status === 1 && r.stdout.includes("never-created-h2.md");
});

test("check-plan-delivery: every Affected Files section is scanned, not just the first", () => {
  // Review finding: returning the first matching heading level discarded the others, so a
  // plan with BOTH `## Affected Files` and a later `### Affected Files` had its H2
  // declarations silently dropped — the same vacuous-pass class the H2 fix was closing.
  const dir = tmp("plandel-multi-section");
  buildPlanRepo(dir, "# P\n\n## Affected Files\n\n- `scripts/ghost-in-h2.js` — new\n\n### Affected Files\n\n- `scripts/x.js` — new\n");
  fs.writeFileSync(path.join(dir, "scripts/x.js"), "x", "utf8");
  const r = spawnSync(process.execPath, [PLAN_DELIVERY, "--gate"], { cwd: dir, encoding: "utf8" });
  return r.status === 1 && r.stdout.includes("ghost-in-h2.js");
});

test("check-plan-delivery: a second same-level Affected Files section is also scanned", () => {
  const dir = tmp("plandel-two-sections");
  buildPlanRepo(dir, "# P\n\n## Affected Files\n\n- `scripts/x.js` — new\n\n## Notes\n\ntext\n\n## Affected Files\n\n- `scripts/ghost-second.js` — new\n");
  fs.writeFileSync(path.join(dir, "scripts/x.js"), "x", "utf8");
  const r = spawnSync(process.execPath, [PLAN_DELIVERY, "--gate"], { cwd: dir, encoding: "utf8" });
  return r.status === 1 && r.stdout.includes("ghost-second.js");
});

test("check-plan-delivery: #### subsection declarations are verified (extraction regression)", () => {
  // The section regex used to stop at the `\n###` prefix of `####` subsection lines, so an
  // Affected Files section written with #### subsections extracted as empty and its
  // declarations were never verified (vacuous pass). A missing file inside a ####
  // subsection must now exit 1.
  const dir = tmp("plandel-subsec-missing");
  buildPlanRepo(dir, "# P\n\n### Affected Files\n\n#### Payload\n\n- `references/templates/never-created.md` — new\n\n#### Repo-infra\n\n- `scripts/x.js` — new\n");
  fs.writeFileSync(path.join(dir, "scripts/x.js"), "x", "utf8");
  const r = spawnSync(process.execPath, [PLAN_DELIVERY, "--gate"], { cwd: dir, encoding: "utf8" });
  return r.status === 1 && r.stdout.includes("never-created.md");
});

test("check-plan-delivery: #### content is in scope but the next ### section is not", () => {
  // The section must include #### subsections but stop at the next ### (#3-level) heading;
  // an example path in a later validation section (src/a.ts) must NOT be treated as a
  // declaration, or the gate would flag a fixture example as undelivered.
  const dir = tmp("plandel-subsec-boundary");
  fs.mkdirSync(path.join(dir, "docs/archive"), { recursive: true });
  fs.mkdirSync(path.join(dir, "references/templates"), { recursive: true });
  write(path.join(dir, "docs/archive/p.md"),
    "# P\n\n### Affected Files\n\n- `references/templates/real.md` — new\n\n#### Payload\n\n- `references/templates/real2.md` — new\n\n### Validation Method\n\n- Fixture: change `src/a.ts` -> exit 1\n");
  fs.writeFileSync(path.join(dir, "references/templates/real.md"), "x", "utf8");
  fs.writeFileSync(path.join(dir, "references/templates/real2.md"), "x", "utf8");
  const r = spawnSync(process.execPath, [PLAN_DELIVERY, "--gate"], { cwd: dir, encoding: "utf8" });
  return r.status === 0;
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

test("payload: generated agent and sub-skills carry change-hygiene and rule-capture contracts", () => {
  const dir = tmp("gen-change-contract");
  const r = spawnSync(process.execPath, [GENERATOR, "--target", dir, "--project-name", "ChangeContract", "--phase", "C"], { encoding: "utf8" });
  if (r.status !== 0) return false;
  const agents = fs.readFileSync(path.join(dir, "AGENTS.md"), "utf8");
  const stateSkill = fs.readFileSync(path.join(dir, ".governance/generated/skills/state-manager/SKILL.md"), "utf8");
  const driftSkill = fs.readFileSync(path.join(dir, ".governance/generated/skills/drift-check/SKILL.md"), "utf8");
  return /Change hygiene/i.test(agents) && /Rule Capture/i.test(agents) &&
    /rule_capture/.test(stateSkill) && /rules_captured/.test(stateSkill) &&
    /rules_pending/.test(stateSkill) && /rules_resolved/.test(stateSkill) &&
    /current unresolved candidates/.test(driftSkill);
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

test("payload: hooks pass sh -n and real git commit matrix", () => {
  const shell = findPosixShell();
  if (!shell) {
    console.error("  sh unavailable; hook execution test skipped in this environment");
    return true;
  }
  const dir = tmp("hook-commit-matrix");
  const generated = spawnSync(process.execPath, [GENERATOR, "--target", dir, "--project-name", "HookMatrix", "--phase", "C"], { encoding: "utf8" });
  if (generated.status !== 0) return false;
  const pre = path.join(dir, ".githooks/pre-commit");
  const msg = path.join(dir, ".githooks/commit-msg");
  if (spawnSync(shell, ["-n", pre], { encoding: "utf8" }).status !== 0 || spawnSync(shell, ["-n", msg], { encoding: "utf8" }).status !== 0) return false;

  gitInit(dir);
  spawnSync("git", ["config", "core.hooksPath", ".githooks"], { cwd: dir });
  const first = "文档/带 空格.md";
  write(path.join(dir, first), "first\n");
  spawnSync("git", ["add", "--", first], { cwd: dir });
  write(path.join(dir, ".governance/consent.json"), JSON.stringify({ staged: [first], message: ["fix: approved"] }));
  const matching = spawnSync("git", ["commit", "-q", "-m", "fix: approved"], { cwd: dir, encoding: "utf8" });
  if (matching.status !== 0) return false;

  const second = "second file.txt";
  write(path.join(dir, second), "second\n");
  spawnSync("git", ["add", "--", second], { cwd: dir });
  write(path.join(dir, ".governance/consent.json"), JSON.stringify({ staged: [second], message: ["fix: approved"] }));
  const mismatchedMessage = spawnSync("git", ["commit", "-q", "-m", "feat: unapproved"], { cwd: dir, encoding: "utf8" });
  if (mismatchedMessage.status !== 1) return false;

  const third = "third.txt";
  write(path.join(dir, third), "third\n");
  spawnSync("git", ["add", "--", third], { cwd: dir });
  fs.rmSync(path.join(dir, ".governance/consent.json"));
  const missingConsent = spawnSync("git", ["commit", "-q", "-m", "fix: missing consent"], { cwd: dir, encoding: "utf8" });
  return missingConsent.status === 1;
});



test("consistency --gate: complete five sync points exit 0", () => {
  const dir = tmp("consent-ok");
  write(path.join(dir, "package.json"), JSON.stringify({ version: "1.0.0" }));
  for (const rel of ["AGENTS.md", "references/policies/git.policy.md", "references/policies/lifecycle.policy.md", "references/templates/agents-md.template.md", "SKILL.md"]) {
    writeConsentSyncPoint(dir, rel, CONSENT_THREE_MARKERS_TEXT);
  }
  const r = spawnSync(process.execPath, [CONSISTENCY, "--gate", "--json"], { cwd: dir, encoding: "utf8" });
  if (r.status !== 0) return false;
  const out = JSON.parse(r.stdout);
  return out.gatePass === true && out.gateIssues.length === 0;
});

test("consistency --gate: Chinese-language markers satisfy the sync clamp (bilingual)", () => {
  // The consent markers carry Chinese branches (回显, 命令序列, 意图对齐, 覆盖, 非快进).
  // Exercise them so a regression that breaks the Chinese patterns is caught, not just
  // the English path exercised by CONSENT_THREE_MARKERS_TEXT.
  const zh =
    "一次确认 per 变更集 — 提交前回显完整 git 命令序列，并一次确认 add → commit → push。\n" +
    "计划批准是意图对齐，不是提交授权。\n" +
    "一次 Proposal 获批准即覆盖整个发布序列。\n" +
    "任一步失败：停止并报告，绝不换方式重试。\n" +
    "若 push 被拒（非快进），停止并报告，绝不自行 pull/rebase。";
  const dir = tmp("consent-zh");
  write(path.join(dir, "package.json"), JSON.stringify({ version: "1.0.0" }));
  for (const rel of ["AGENTS.md", "references/policies/git.policy.md", "references/policies/lifecycle.policy.md", "references/templates/agents-md.template.md", "SKILL.md"]) {
    writeConsentSyncPoint(dir, rel, zh);
  }
  const r = spawnSync(process.execPath, [CONSISTENCY, "--gate", "--json"], { cwd: dir, encoding: "utf8" });
  if (r.status !== 0) return false;
  const out = JSON.parse(r.stdout);
  return out.gatePass === true && out.gateIssues.length === 0;
});

test("consistency --gate: marker removed from one sync point exits 1 and names it", () => {
  const dir = tmp("consent-missing");
  write(path.join(dir, "package.json"), JSON.stringify({ version: "1.0.0" }));
  for (const rel of ["AGENTS.md", "references/policies/git.policy.md", "references/policies/lifecycle.policy.md", "references/templates/agents-md.template.md", "SKILL.md"]) {
    writeConsentSyncPoint(dir, rel, CONSENT_THREE_MARKERS_TEXT);
  }
  // strip the intent-alignment marker from SKILL.md
  const skillPath = path.join(dir, "SKILL.md");
  write(skillPath, CONSENT_THREE_MARKERS_TEXT.split("\n").filter((l) => !/intent alignment/i.test(l)).join("\n"));
  const r = spawnSync(process.execPath, [CONSISTENCY, "--gate", "--json"], { cwd: dir, encoding: "utf8" });
  if (r.status !== 1) return false;
  const out = JSON.parse(r.stdout);
  return out.gatePass === false && out.gateIssues.some((g) => g.item.includes("SKILL.md") && g.item.includes("intent alignment"));
});

test("consistency --gate: governed-project shape skips absent sync points (3 of 5 exist)", () => {
  const dir = tmp("consent-governed");
  write(path.join(dir, "package.json"), JSON.stringify({ version: "1.0.0" }));
  // the protected-files source must exist so the check doesn't report "source missing"
  write(path.join(dir, "docs", "rules", "governance-files.md"), "| Path | Nature |\n| --- | --- |\n| `AGENTS.md` | entry |\n");
  // generated AGENTS.md + docs/rules/git-policy.md + docs/rules/lifecycle.md exist in a governed project
  writeConsentSyncPoint(dir, "AGENTS.md", CONSENT_THREE_MARKERS_TEXT);
  writeConsentSyncPoint(dir, "docs/rules/git-policy.md", CONSENT_THREE_MARKERS_TEXT);
  writeConsentSyncPoint(dir, "docs/rules/lifecycle.md", CONSENT_THREE_MARKERS_TEXT);
  const r = spawnSync(process.execPath, [CONSISTENCY, "--gate"], { cwd: dir, encoding: "utf8" });
  return r.status === 0 && r.stdout.includes("no consistency issues");
});

test("consistency --gate: missing markers in a governed-project sync point exit 1", () => {
  const dir = tmp("consent-governed-missing");
  write(path.join(dir, "package.json"), JSON.stringify({ version: "1.0.0" }));
  writeConsentSyncPoint(dir, "AGENTS.md", CONSENT_THREE_MARKERS_TEXT);
  const gitPolicy = CONSENT_THREE_MARKERS_TEXT.replace(/intent alignment[^\n]*\n/, "");
  writeConsentSyncPoint(dir, "docs/rules/git-policy.md", gitPolicy);
  const r = spawnSync(process.execPath, [CONSISTENCY, "--gate", "--json"], { cwd: dir, encoding: "utf8" });
  if (r.status !== 1) return false;
  const out = JSON.parse(r.stdout);
  return out.gateIssues.some((g) => g.item.includes("docs/rules/git-policy.md") && g.item.includes("intent alignment"));
});

test("consistency --gate: lifecycle doc is exempt from the release marker", () => {
  // lifecycle.policy.md carries no release clause by design; the release marker's files
  // list must not require it from docs/rules/lifecycle.md (m3 files restriction).
  const dir = tmp("consent-lifecycle-exempt");
  write(path.join(dir, "package.json"), JSON.stringify({ version: "1.0.0" }));
  writeConsentSyncPoint(dir, "AGENTS.md", CONSENT_THREE_MARKERS_TEXT);
  writeConsentSyncPoint(dir, "references/policies/git.policy.md", CONSENT_THREE_MARKERS_TEXT);
  // lifecycle WITHOUT the release marker — permitted (m3 files restriction)
  writeConsentSyncPoint(dir, "references/policies/lifecycle.policy.md",
    "One confirmation per change set — echo the full git command sequence before committing.\nPlan approval is intent alignment, not a commit authorisation workaround.\n");
  writeConsentSyncPoint(dir, "docs/rules/lifecycle.md",
    "One confirmation per change set — echo the full git command sequence before committing.\nPlan approval is intent alignment, not a commit authorisation workaround.\n");
  const r = spawnSync(process.execPath, [CONSISTENCY, "--gate", "--json"], { cwd: dir, encoding: "utf8" });
  if (r.status !== 0) return false;
  const out = JSON.parse(r.stdout);
  return !out.gateIssues.some((g) => g.item.includes("lifecycle"));
});

test("consistency --gate: mid-sequence failure marker removed → gate red (regression)", () => {
  const dir = tmp("consent-fail-missing");
  write(path.join(dir, "package.json"), JSON.stringify({ version: "1.0.0" }));
  for (const rel of ["AGENTS.md", "references/policies/git.policy.md", "references/templates/agents-md.template.md", "SKILL.md"]) {
    writeConsentSyncPoint(dir, rel, CONSENT_THREE_MARKERS_TEXT);
  }
  // strip the failure clause from SKILL.md
  const skillPath = path.join(dir, "SKILL.md");
  write(skillPath, CONSENT_THREE_MARKERS_TEXT.split("\n").filter((l) => !/stop and report/i.test(l)).join("\n"));
  const r = spawnSync(process.execPath, [CONSISTENCY, "--gate", "--json"], { cwd: dir, encoding: "utf8" });
  if (r.status !== 1) return false;
  const out = JSON.parse(r.stdout);
  return out.gatePass === false && out.gateIssues.some((g) => g.item.includes("SKILL.md") && g.item.includes("mid-sequence failure"));
});

test("consistency --gate: gutted lifecycle.policy.md turns gate red (5th sync point, regression)", () => {
  // The 5th consent sync point (lifecycle.policy.md) must be a real sync GROUP. Gutting it
  // of all consent substance must turn the gate red — a bare "一次确认" heading or a mention
  // in another table must not satisfy it.
  const dir = tmp("consent-lifecycle-gut");
  write(path.join(dir, "package.json"), JSON.stringify({ version: "1.0.0" }));
  for (const rel of ["AGENTS.md", "references/policies/git.policy.md", "references/templates/agents-md.template.md", "SKILL.md"]) {
    writeConsentSyncPoint(dir, rel, CONSENT_THREE_MARKERS_TEXT);
  }
  writeConsentSyncPoint(dir, "references/policies/lifecycle.policy.md", "# Lifecycle\n\nNo consent rules here.\n");
  const r = spawnSync(process.execPath, [CONSISTENCY, "--gate", "--json"], { cwd: dir, encoding: "utf8" });
  if (r.status !== 1) return false;
  const out = JSON.parse(r.stdout);
  return out.gateIssues.some((g) => g.item.includes("lifecycle.policy.md") && g.item.includes("one confirmation per change set"));
});

test("consistency --gate: a section heading alone is not the one-confirmation principle (M1 regression)", () => {
  // M1 must anchor on the echo + full-sequence substance, NOT the bare "一次确认" wording.
  // A heading like "确认范围（一次确认 per 变更集）" with no echo/sequence must not satisfy it.
  const dir = tmp("consent-m1-heading");
  write(path.join(dir, "package.json"), JSON.stringify({ version: "1.0.0" }));
  for (const rel of ["AGENTS.md", "references/policies/git.policy.md", "references/templates/agents-md.template.md", "SKILL.md"]) {
    writeConsentSyncPoint(dir, rel,
      "## 确认范围（一次确认 per 变更集）\n\nPlan approval is intent alignment, not a commit authorisation.\n" +
      "A Proposal approved at the Approval Gate covers the release sequence.\n" +
      "If any step fails, stop and report — never retry differently.\n" +
      "If push is rejected (non-fast-forward), stop and report — never pull/rebase.\n");
  }
  writeConsentSyncPoint(dir, "references/policies/lifecycle.policy.md",
    "## 确认范围（一次确认 per 变更集）\n\nPlan approval is intent alignment, not a commit authorisation.\n");
  const r = spawnSync(process.execPath, [CONSISTENCY, "--gate", "--json"], { cwd: dir, encoding: "utf8" });
  if (r.status !== 1) return false;
  const out = JSON.parse(r.stdout);
  return out.gateIssues.some((g) => g.item.includes("one confirmation per change set"));
});

test("consistency --gate: bare Approval Gate mention is not the release-clause marker (M3 regression)", () => {
  // M3 must anchor on approval COVERING the sequence/write-ops, not the bare "Approval Gate"
  // token that also appears in a git-tag bullet. Removing the release clause while leaving a
  // bare Approval Gate must turn the gate red.
  const dir = tmp("consent-m3-bare");
  write(path.join(dir, "package.json"), JSON.stringify({ version: "1.0.0" }));
  for (const rel of ["AGENTS.md", "references/policies/git.policy.md", "references/templates/agents-md.template.md", "SKILL.md"]) {
    writeConsentSyncPoint(dir, rel,
      "One confirmation per change set — echo the full git command sequence before committing.\n" +
      "Plan approval is intent alignment, not a commit authorisation.\n" +
      "A release needs to pass through the Approval Gate.\n" +   // bare token, no coverage
      "If any step fails, stop and report — never retry differently.\n" +
      "If push is rejected (non-fast-forward), stop and report — never pull/rebase.\n");
  }
  writeConsentSyncPoint(dir, "references/policies/lifecycle.policy.md", CONSENT_THREE_MARKERS_TEXT);
  const r = spawnSync(process.execPath, [CONSISTENCY, "--gate", "--json"], { cwd: dir, encoding: "utf8" });
  if (r.status !== 1) return false;
  const out = JSON.parse(r.stdout);
  return out.gateIssues.some((g) => g.item.includes("Approval Gate covers the sequence"));
});

test("consistency --gate: governed-project git-policy.md is held to release/mid-sequence markers (files regression)", () => {
  // The files restriction must match the governed rendering docs/rules/git-policy.md on M3/M4/M5
  // (basename normalised: git.policy.md == git-policy.md), not just the skill-repo path.
  const dir = tmp("consent-governed-m345");
  write(path.join(dir, "package.json"), JSON.stringify({ version: "1.0.0" }));
  writeConsentSyncPoint(dir, "AGENTS.md", CONSENT_THREE_MARKERS_TEXT);
  writeConsentSyncPoint(dir, "docs/rules/git-policy.md", /** no M3/M4/M5 */ "One confirmation per change set — echo the full git command sequence before committing.\nPlan approval is intent alignment, not a commit authorisation.\n");
  const r = spawnSync(process.execPath, [CONSISTENCY, "--gate", "--json"], { cwd: dir, encoding: "utf8" });
  if (r.status !== 1) return false;
  const out = JSON.parse(r.stdout);
  return out.gateIssues.some((g) => g.item.includes("docs/rules/git-policy.md") && /Approval Gate covers the sequence|mid-sequence failure|push rejected/.test(g.item));
});

test("consistency --gate: protected list trigger is tightened (mere mention exempt)", () => {
  const dir = tmp("proto-exempt");
  write(path.join(dir, "package.json"), JSON.stringify({ version: "1.0.0" }));
  write(path.join(dir, "references/policies/governance-files.policy.md"),
    "| `AGENTS.md` | policy |\n| `docs/rules/**` | policy |\n");
  // mentions the protection flow in the exact casing the regex matches (Governance File
  // Protection flow) but does NOT claim to enumerate the list
  write(path.join(dir, "docs/en/README.md"), "# R\n\nThis change should follow the Governance File Protection flow.\n");
  fs.mkdirSync(path.join(dir, "docs/zh-CN"), { recursive: true });
  fs.mkdirSync(path.join(dir, "docs/zh-TW"), { recursive: true });
  write(path.join(dir, "docs/zh-CN/README.md"), "# R\n");
  write(path.join(dir, "docs/zh-TW/README.md"), "# R\n");
  const r = spawnSync(process.execPath, [CONSISTENCY, "--gate", "--json"], { cwd: dir, encoding: "utf8" });
  if (r.status !== 0) return false;
  const out = JSON.parse(r.stdout);
  return out.gatePass === true && !out.gateIssues.some((g) => g.kind === "protected_lists");
});

test("consistency --gate: claimed enumeration with a missing entry still fails", () => {
  const dir = tmp("proto-flagged");
  write(path.join(dir, "package.json"), JSON.stringify({ version: "1.0.0" }));
  write(path.join(dir, "references/policies/governance-files.policy.md"),
    "| `AGENTS.md` | policy |\n| `docs/rules/**` | policy |\n| `scripts/check-secrets.js` | script |\n");
  // mentions the protection flow AND claims to enumerate its list — but omits check-secrets.js
  write(path.join(dir, "docs/en/README.md"), "# R\n\nThe Governance File Protection list is:\n- `AGENTS.md`\n");
  fs.mkdirSync(path.join(dir, "docs/zh-CN"), { recursive: true });
  fs.mkdirSync(path.join(dir, "docs/zh-TW"), { recursive: true });
  write(path.join(dir, "docs/zh-CN/README.md"), "# R\n");
  write(path.join(dir, "docs/zh-TW/README.md"), "# R\n");
  const r = spawnSync(process.execPath, [CONSISTENCY, "--gate", "--json"], { cwd: dir, encoding: "utf8" });
  if (r.status !== 1) return false;
  const out = JSON.parse(r.stdout);
  return out.gateIssues.some((g) => g.kind === "protected_lists" && g.item.includes("check-secrets.js"));
});

// --- A1 regression set: governance-list declaration check (audit 2026-09-05) ---
// The cluster previously parsed the policy table with `slice(0, search(/\n## /))`, which
// truncated BEFORE the table in the real document (its own heading precedes it) — so the
// authoritative set was empty and the whole cluster was inert in production. The old
// fixtures hid it by writing bare tables with no heading. These four use the REAL document
// shape (heading + table) and pin the pointer semantics:
//   pointer excuses INCOMPLETENESS, never INCORRECTNESS.

function writeRealShapePolicy(dir, rows) {
  // Real shape: H1 + intro prose + "## 受保护文件" heading + table. The heading before the
  // table is the exact condition the old parser could not survive.
  write(path.join(dir, "references/policies/governance-files.policy.md"),
    "# 治理文件清单（单一事实源）\n\n本文件是唯一清单来源。\n\n## 受保护文件（修改需走流程）\n\n| 路径 | 性质 |\n| --- | --- |\n" + rows + "\n## .governance/ Git 跟踪策略\n\n| 路径 | 跟踪 |\n| --- | --- |\n| `docs/plans/archive/` | tracked |\n");
  fs.mkdirSync(path.join(dir, "docs/zh-CN"), { recursive: true });
  fs.mkdirSync(path.join(dir, "docs/zh-TW"), { recursive: true });
  write(path.join(dir, "docs/zh-CN/README.md"), "# R\n");
  write(path.join(dir, "docs/zh-TW/README.md"), "# R\n");
}

test("consistency --gate: A1 pure pointer with no declared paths passes", () => {
  const dir = tmp("a1-pointer");
  write(path.join(dir, "package.json"), JSON.stringify({ version: "1.0.0" }));
  writeRealShapePolicy(dir, "| `AGENTS.md` | entry |\n| `scripts/check-secrets.js` | script |\n");
  // Claims enumeration + defers to the source, declares NOTHING itself.
  write(path.join(dir, "docs/en/README.md"),
    "# R\n\n## 治理文件保护\n\n受保护文件的完整清单见 `references/policies/governance-files.policy.md`（单一事实源）。\n");
  const r = spawnSync(process.execPath, [CONSISTENCY, "--gate", "--json"], { cwd: dir, encoding: "utf8" });
  if (r.status !== 0) return false;
  const out = JSON.parse(r.stdout);
  if (out.gatePass !== true || out.gateIssues.some((g) => g.kind === "protected_lists")) return false;
  // LIVENESS CONTROL: an "expected pass" assertion is vacuous if the cluster is dead — it
  // would pass equally against a disabled gate (proven by mutation). Add one ghost path to
  // the SAME fixture and require the cluster to react, so this test can only pass when the
  // gate is actually running. The wording must be one CLAIMS_PROTECTED_LIST recognises,
  // otherwise the document is not judged at all and the control proves nothing.
  write(path.join(dir, "docs/en/README.md"),
    "# R\n\n## 治理文件保护\n\n受保护文件清单为（完整清单见 `references/policies/governance-files.policy.md`，单一事实源）：\n\n- `scripts/check-ghost.js`\n");
  const live = spawnSync(process.execPath, [CONSISTENCY, "--gate", "--json"], { cwd: dir, encoding: "utf8" });
  return live.status === 1 && JSON.parse(live.stdout).gateIssues.some((g) => g.kind === "protected_lists");
});

test("consistency --gate: A1 partial list + pointer may omit entries (incompleteness excused)", () => {
  const dir = tmp("a1-partial-ok");
  write(path.join(dir, "package.json"), JSON.stringify({ version: "1.0.0" }));
  writeRealShapePolicy(dir, "| `AGENTS.md` | entry |\n| `scripts/check-secrets.js` | script |\n| `scripts/check-lock.js` | script |\n");
  // Lists only ONE of three, but points at the single source of truth: legitimate summary.
  write(path.join(dir, "docs/en/README.md"),
    "# R\n\n## 治理文件保护\n\n受保护文件清单为（完整清单见 `references/policies/governance-files.policy.md`，单一事实源）：\n\n- `AGENTS.md`\n");
  const r = spawnSync(process.execPath, [CONSISTENCY, "--gate", "--json"], { cwd: dir, encoding: "utf8" });
  if (r.status !== 0) return false;
  const out = JSON.parse(r.stdout);
  if (out.gatePass !== true || out.gateIssues.some((g) => g.kind === "protected_lists")) return false;
  // LIVENESS CONTROL (see above): the omission is excused, but a WRONG entry in the very
  // same list must still fail — otherwise this fixture proves nothing about the rule.
  write(path.join(dir, "docs/en/README.md"),
    "# R\n\n## 治理文件保护\n\n受保护文件清单为（完整清单见 `references/policies/governance-files.policy.md`，单一事实源）：\n\n- `AGENTS.md`\n- `scripts/check-renamed-away.js`\n");
  const live = spawnSync(process.execPath, [CONSISTENCY, "--gate", "--json"], { cwd: dir, encoding: "utf8" });
  return live.status === 1 && JSON.parse(live.stdout).gateIssues.some((g) => g.item.includes("check-renamed-away.js"));
});

test("consistency --gate: A1 partial list + pointer still fails on a ghost/renamed path", () => {
  const dir = tmp("a1-ghost");
  write(path.join(dir, "package.json"), JSON.stringify({ version: "1.0.0" }));
  writeRealShapePolicy(dir, "| `AGENTS.md` | entry |\n| `scripts/check-secrets.js` | script |\n");
  // Pointer present, but declares a path that is NOT in the authoritative list — the
  // stale-entry case a rename leaves behind. The pointer must NOT excuse this.
  write(path.join(dir, "docs/en/README.md"),
    "# R\n\n## 治理文件保护\n\n受保护文件清单为（完整清单见 `references/policies/governance-files.policy.md`，单一事实源）：\n\n- `AGENTS.md`\n- `scripts/check-OLDNAME.js`\n");
  const r = spawnSync(process.execPath, [CONSISTENCY, "--gate", "--json"], { cwd: dir, encoding: "utf8" });
  if (r.status !== 1) return false;
  const out = JSON.parse(r.stdout);
  return out.gateIssues.some((g) => g.kind === "protected_lists" && g.item.includes("check-OLDNAME.js"));
});

test("consistency --gate: A1 stale path inside a fenced code block is detected", () => {
  const dir = tmp("a1-codeblock");
  write(path.join(dir, "package.json"), JSON.stringify({ version: "1.0.0" }));
  writeRealShapePolicy(dir, "| `AGENTS.md` | entry |\n| `scripts/check-secrets.js` | script |\n");
  // SKILL.md / agents-md.template.md declare their summary in a fenced block, not a table.
  // Parsing only tables is what let those two drift unchecked.
  write(path.join(dir, "docs/en/README.md"),
    "# R\n\n## 治理文件保护\n\n受保护文件清单为（完整清单见 `references/policies/governance-files.policy.md`，单一事实源）：\n\n```\nAGENTS.md\nscripts/check-GONE.js\n```\n");
  const r = spawnSync(process.execPath, [CONSISTENCY, "--gate", "--json"], { cwd: dir, encoding: "utf8" });
  if (r.status !== 1) return false;
  const out = JSON.parse(r.stdout);
  return out.gateIssues.some((g) => g.kind === "protected_lists" && g.item.includes("check-GONE.js"));
});

// A5 regression: SKILL.md frontmatter version is a release sync point but the version
// regex required quoted forms, so unquoted YAML `version: X.Y.Z` never matched and a
// stale skill version passed every gate (audit 2026-09-05).
test("consistency --gate: stale frontmatter version fails the gate", () => {
  const dir = tmp("a5-frontmatter-stale");
  write(path.join(dir, "package.json"), JSON.stringify({ version: "2.0.0" }));
  // Not SKILL.md: that filename is a consent sync point, so its markers would turn the
  // gate red for an unrelated reason and the assertion below would pass vacuously.
  write(path.join(dir, "docs/en/guide.md"), "---\nname: x\nversion: 1.4.9\n---\n\n# Guide\n");
  const r = spawnSync(process.execPath, [CONSISTENCY, "--gate", "--json"], { cwd: dir, encoding: "utf8" });
  if (r.status !== 1) return false;
  const out = JSON.parse(r.stdout);
  // The frontmatter finding must be the reason, not a side effect of another cluster.
  return out.gateIssues.some((g) => g.kind === "version_examples" && g.item.includes("frontmatter version 1.4.9"));
});

test("consistency --gate: matching frontmatter version passes", () => {
  const dir = tmp("a5-frontmatter-ok");
  write(path.join(dir, "package.json"), JSON.stringify({ version: "2.0.0" }));
  // Not SKILL.md: that filename is a consent sync point and would fail this fixture on
  // unrelated markers. The frontmatter check is filename-independent by design.
  write(path.join(dir, "docs/en/guide.md"), "---\nname: x\nversion: 2.0.0\n---\n\n# Guide\n");
  const r = spawnSync(process.execPath, [CONSISTENCY, "--gate", "--json"], { cwd: dir, encoding: "utf8" });
  if (r.status !== 0) return false;
  const out = JSON.parse(r.stdout);
  return !out.gateIssues.some((g) => g.kind === "version_examples");
});

// A6 regression: docs/archive/ was never scanned, so an archived plan could keep saying
// "已实现（待 Release 归档）" — a pending-archive claim inside the archive — forever.
// The archive IS the completed state, so a file living there must say archived.
test("consistency --release-gate: archived plan still claiming implemented fails", () => {
  const dir = tmp("a6-archive-stale");
  write(path.join(dir, "package.json"), JSON.stringify({ version: "1.0.0" }));
  write(path.join(dir, "CHANGELOG.md"), "# Changelog\n\n## [Unreleased]\n\n### Fixed\n\n- x\n");
  write(path.join(dir, "docs/archive/old-plan.md"),
    "# Old Plan\n\n> **Status: implemented.**（已实现，待 Release 归档。）\n");
  const r = spawnSync(process.execPath, [CONSISTENCY, "--release-gate", "--json"], { cwd: dir, encoding: "utf8" });
  if (r.status !== 1) return false;
  const out = JSON.parse(r.stdout);
  return out.gateIssues.some((g) => g.kind === "plans_status_unknown" && g.item.includes("old-plan.md") && /still claims/.test(g.item));
});

test("consistency --release-gate: archived plan with no Status line fails", () => {
  const dir = tmp("a6-archive-nostatus");
  write(path.join(dir, "package.json"), JSON.stringify({ version: "1.0.0" }));
  write(path.join(dir, "CHANGELOG.md"), "# Changelog\n\n## [Unreleased]\n\n### Fixed\n\n- x\n");
  write(path.join(dir, "docs/archive/no-status.md"), "# No Status Plan\n\nSome design text.\n");
  const r = spawnSync(process.execPath, [CONSISTENCY, "--release-gate", "--json"], { cwd: dir, encoding: "utf8" });
  if (r.status !== 1) return false;
  const out = JSON.parse(r.stdout);
  return out.gateIssues.some((g) => g.kind === "plans_status_unknown" && g.item.includes("no-status.md"));
});

test("consistency: a properly archived plan passes and is counted", () => {
  const dir = tmp("a6-archive-ok");
  write(path.join(dir, "package.json"), JSON.stringify({ version: "1.0.0" }));
  write(path.join(dir, "CHANGELOG.md"), "# Changelog\n\n## [Unreleased]\n\n### Fixed\n\n- x\n");
  write(path.join(dir, "docs/archive/good.md"),
    "# Good Plan\n\n> **Status: archived.**（已归档。归档即断言完成。）\n");
  const r = spawnSync(process.execPath, [CONSISTENCY, "--release-gate", "--json"], { cwd: dir, encoding: "utf8" });
  if (r.status !== 0) return false;
  const out = JSON.parse(r.stdout);
  return out.planStatuses.some((p) => p.plan === "docs/archive/good.md" && p.status === "archived");
});

// ADR-0008: the commands.md trigger inventory is a deliberate controlled copy, so the
// prompt-sync cluster is gate class and BOTH directions are defects. Previously it was
// advisory and only checked "missing", while AGENTS.md claimed it "enforces" the sync.
test("consistency --gate: a trigger missing from commands.md fails the gate", () => {
  const dir = tmp("adr8-missing");
  write(path.join(dir, "package.json"), JSON.stringify({ version: "1.0.0" }));
  write(path.join(dir, "references/templates/sub-skills.md"),
    'name: demo-skill\ndescription: Does a thing. Triggers on "do the thing", "run demo".\n');
  for (const lang of ["en", "zh-CN", "zh-TW"]) {
    write(path.join(dir, `docs/${lang}/commands.md`), "# Commands\n\n| Case | Trigger |\n| --- | --- |\n| A | `do the thing` |\n");
  }
  const r = spawnSync(process.execPath, [CONSISTENCY, "--gate", "--json"], { cwd: dir, encoding: "utf8" });
  if (r.status !== 1) return false;
  const out = JSON.parse(r.stdout);
  return out.gateIssues.some((g) => g.kind === "prompt_sync" && g.item.includes("run demo"));
});

test("consistency --gate: a stale trigger left in commands.md fails the gate", () => {
  const dir = tmp("adr8-stale");
  write(path.join(dir, "package.json"), JSON.stringify({ version: "1.0.0" }));
  write(path.join(dir, "references/templates/sub-skills.md"),
    'name: demo-skill\ndescription: Does a thing. Triggers on "do the thing".\n');
  for (const lang of ["en", "zh-CN", "zh-TW"]) {
    // advertises a trigger no source declares — the removal case the old check was blind to
    write(path.join(dir, `docs/${lang}/commands.md`),
      "# Commands\n\n| Case | Trigger |\n| --- | --- |\n| A | `do the thing` |\n| B | `removed trigger phrase` |\n");
  }
  const r = spawnSync(process.execPath, [CONSISTENCY, "--gate", "--json"], { cwd: dir, encoding: "utf8" });
  if (r.status !== 1) return false;
  const out = JSON.parse(r.stdout);
  return out.gateIssues.some((g) => g.kind === "prompt_sync" && g.item.includes("removed trigger phrase"));
});

test("consistency --gate: a main-skill trigger declared in SKILL.md is not stale", () => {
  const dir = tmp("adr8-mainskill");
  write(path.join(dir, "package.json"), JSON.stringify({ version: "1.0.0" }));
  write(path.join(dir, "references/templates/sub-skills.md"),
    'name: demo-skill\ndescription: Does a thing. Triggers on "do the thing".\n');
  // SKILL.md owns the main skill's mode triggers; sub-skills.md owns sub-skill triggers.
  // Judging the manual against sub-skills.md alone flagged every mode trigger as stale.
  write(path.join(dir, "SKILL.md"),
    '---\nname: x\nversion: 1.0.0\ndescription: Triggers on "audit governance".\n---\n\n# X\n');
  for (const lang of ["en", "zh-CN", "zh-TW"]) {
    write(path.join(dir, `docs/${lang}/commands.md`),
      "# Commands\n\n| Case | Trigger |\n| --- | --- |\n| A | `do the thing` |\n| B | `audit governance` |\n");
  }
  const r = spawnSync(process.execPath, [CONSISTENCY, "--gate", "--json"], { cwd: dir, encoding: "utf8" });
  const out = JSON.parse(r.stdout);
  return !out.gateIssues.some((g) => g.kind === "prompt_sync");
});

// C2: the template documents a trailing-slash directory form and the DEFAULT shipped
// sync-rules uses it (feature-registry's `require: ["docs/features/"]`), but globMatch
// never implemented it — so that group was permanently unsatisfiable in every INITed
// project, producing a false BLOCK (audit 2026-09-05).
test("check-sync: a trailing-slash require pattern matches files under it", () => {
  const dir = tmp("sync-trailing-slash");
  gitInit(dir);
  write(path.join(dir, "seed.txt"), "seed");
  spawnSync("git", ["add", "-A"], { cwd: dir });
  spawnSync("git", ["commit", "-q", "-m", "seed"], { cwd: dir });
  const base = String(spawnSync("git", ["rev-parse", "HEAD"], { cwd: dir, encoding: "utf8" }).stdout).trim();
  write(path.join(dir, ".governance/sync-rules.json"), JSON.stringify({
    syncGroups: [{ name: "feature-registry", watch: ["src/**"], require: ["docs/features/"] }],
  }));
  write(path.join(dir, "src/a.ts"), "x");
  write(path.join(dir, "docs/features/login.md"), "y");
  spawnSync("git", ["add", "-A"], { cwd: dir });
  const r = spawnSync(process.execPath, [SYNC_CHECK, "--json", "--base", base], { cwd: dir, encoding: "utf8" });
  const out = JSON.parse(r.stdout);
  return r.status === 0 && out.clean === true;
});

// A wildcard-segment pattern silently matched nothing, so a project believed it had a rule
// that could never fire. Unsupported forms now fail loudly instead of passing green.
test("check-sync: an unsupported wildcard-segment pattern blocks instead of silently missing", () => {
  const dir = tmp("sync-bad-pattern");
  gitInit(dir);
  write(path.join(dir, "seed.txt"), "seed");
  spawnSync("git", ["add", "-A"], { cwd: dir });
  spawnSync("git", ["commit", "-q", "-m", "seed"], { cwd: dir });
  const base = String(spawnSync("git", ["rev-parse", "HEAD"], { cwd: dir, encoding: "utf8" }).stdout).trim();
  write(path.join(dir, ".governance/sync-rules.json"), JSON.stringify({
    syncGroups: [{ name: "g", watch: ["packages/*/src/**"], require: ["docs/x.md"] }],
  }));
  write(path.join(dir, "packages/a/src/i.ts"), "x");
  spawnSync("git", ["add", "-A"], { cwd: dir });
  const r = spawnSync(process.execPath, [SYNC_CHECK, "--json", "--base", base], { cwd: dir, encoding: "utf8" });
  if (r.status !== 1) return false;
  const out = JSON.parse(r.stdout);
  return (out.unsupportedPatterns || []).some((b) => b.pattern === "packages/*/src/**");
});

// The scan set used to be 4 top-level files + docs/, so references/ was never examined —
// the INSTALLED policy and template bodies (including the agents-md template that becomes
// every governed project's AGENTS.md) could carry a stale protected-files summary and no
// gate would ever look. This was the real reason the template appeared exempt long after
// its section parsed correctly; wording and block shape were red herrings.
test("consistency --gate: references/ is in the scan set (installed bodies are judged)", () => {
  const dir = tmp("refs-scanned");
  write(path.join(dir, "package.json"), JSON.stringify({ version: "1.0.0" }));
  writeRealShapePolicy(dir, "| `AGENTS.md` | entry |\n| `scripts/check-secrets.js` | script |\n");
  // An installed template body that names a path the policy does not have.
  write(path.join(dir, "references/templates/agents-md.template.md"),
    "# AGENTS.md\n\n## Governance File Protection\n\nThe protected files list is:\n\n- `AGENTS.md`\n- `scripts/check-gone.js`\n");
  const r = spawnSync(process.execPath, [CONSISTENCY, "--gate", "--json"], { cwd: dir, encoding: "utf8" });
  if (r.status !== 1) return false;
  const out = JSON.parse(r.stdout);
  return out.gateIssues.some((g) => g.kind === "protected_lists" && g.item.includes("agents-md.template.md") && g.item.includes("check-gone.js"));
});

test("consistency: advisory mode stays exit 0 even with gate-class violations", () => {
  const dir = tmp("consent-advisory");
  write(path.join(dir, "package.json"), JSON.stringify({ version: "1.0.0" }));
  // only AGENTS.md present, missing Exception C marker entirely — advisory never blocks
  writeConsentSyncPoint(dir, "AGENTS.md", "some text without any markers");
  const r = spawnSync(process.execPath, [CONSISTENCY], { cwd: dir, encoding: "utf8" });
  return r.status === 0;
});

test("consistency --gate: principles-index pointer to a missing file exits 1", () => {
  const dir = tmp("index-broken");
  write(path.join(dir, "package.json"), JSON.stringify({ version: "1.0.0" }));
  write(path.join(dir, "AGENTS.md"),
    "# AGENTS.md\n\n## Governance principles index\n\n| Principle | Authoritative source | Scope |\n| --- | --- | --- |\n| Something | `references/does-not-exist.md` | payload |\n");
  const r = spawnSync(process.execPath, [CONSISTENCY, "--gate", "--json"], { cwd: dir, encoding: "utf8" });
  if (r.status !== 1) return false;
  const out = JSON.parse(r.stdout);
  return out.gateIssues.some((g) => g.kind === "principles_index" && g.item.includes("references/does-not-exist.md"));
});

test("consistency --gate: principles index with resolving pointers exits 0", () => {
  const dir = tmp("index-ok");
  write(path.join(dir, "package.json"), JSON.stringify({ version: "1.0.0" }));
  write(path.join(dir, "references/policies/git.policy.md"), CONSENT_THREE_MARKERS_TEXT);
  write(path.join(dir, "AGENTS.md"),
    "# AGENTS.md\n\n## Governance principles index\n\n| Principle | Authoritative source | Scope |\n| --- | --- | --- |\n| Consent | `references/policies/git.policy.md` | both |\n\n" + CONSENT_THREE_MARKERS_TEXT + "\n");
  const r = spawnSync(process.execPath, [CONSISTENCY, "--gate"], { cwd: dir, encoding: "utf8" });
  return r.status === 0;
});

test("consistency --gate: governed project without an index skips check 9", () => {
  const dir = tmp("index-absent");
  write(path.join(dir, "package.json"), JSON.stringify({ version: "1.0.0" }));
  writeConsentSyncPoint(dir, "AGENTS.md", CONSENT_THREE_MARKERS_TEXT); // no index section
  const r = spawnSync(process.execPath, [CONSISTENCY, "--gate", "--json"], { cwd: dir, encoding: "utf8" });
  if (r.status !== 0) return false;
  const out = JSON.parse(r.stdout);
  return !out.gateIssues.some((g) => g.kind === "principles_index");
});

test("consistency --gate: a partial marker phrase is not a full principle (regression)", () => {
  // A phrase like "一次确认" can appear alone without the intent-alignment or release
  // semantics. Deleting the full principles while leaving a partial phrase must NOT pass.
  const dir = tmp("consent-partial");
  write(path.join(dir, "package.json"), JSON.stringify({ version: "1.0.0" }));
  for (const rel of ["AGENTS.md", "references/templates/agents-md.template.md"]) {
    writeConsentSyncPoint(dir, rel, CONSENT_THREE_MARKERS_TEXT);
  }
  // SKILL.md carries only a partial phrase — no intent alignment, no release
  writeConsentSyncPoint(dir, "SKILL.md", "一次确认。\n");
  writeConsentSyncPoint(dir, "references/policies/git.policy.md", CONSENT_THREE_MARKERS_TEXT);
  const r = spawnSync(process.execPath, [CONSISTENCY, "--gate", "--json"], { cwd: dir, encoding: "utf8" });
  if (r.status !== 1) return false;
  const out = JSON.parse(r.stdout);
  return out.gatePass === false && out.gateIssues.some((g) => g.item.includes("SKILL.md") && g.item.includes("intent alignment"));
});

test("consistency: implemented plan is pending-archive — advisory in --gate, fail-closed in --release-gate", () => {
  // The documented lifecycle lets a completed plan wait in plans/ for the release commit,
  // so the always-on gate must stay green (advisory only); the release flow's
  // --release-gate must fail and name the plan.
  const dir = tmp("plans-pending");
  write(path.join(dir, "package.json"), JSON.stringify({ version: "1.0.0" }));
  fs.mkdirSync(path.join(dir, "docs/en/plans"), { recursive: true });
  write(path.join(dir, "docs/en/plans/done.md"), "# P\n\n> **Status: implemented (2026-08-30, pending Release archive).**\n");
  const gate = spawnSync(process.execPath, [CONSISTENCY, "--gate", "--json"], { cwd: dir, encoding: "utf8" });
  if (gate.status !== 0) return false;
  const gateOut = JSON.parse(gate.stdout);
  if (!gateOut.issues.plans_pending_archive || gateOut.issues.plans_pending_archive.length !== 1) return false;
  const rel = spawnSync(process.execPath, [CONSISTENCY, "--release-gate", "--json"], { cwd: dir, encoding: "utf8" });
  if (rel.status !== 1) return false;
  const relOut = JSON.parse(rel.stdout);
  return relOut.gateIssues.some((g) => g.kind === "plans_pending_archive" && g.item.includes("done.md"));
});

test("consistency --gate: unknown plan status exits 1 (fixable on the spot)", () => {
  const dir = tmp("plans-unknown");
  write(path.join(dir, "package.json"), JSON.stringify({ version: "1.0.0" }));
  fs.mkdirSync(path.join(dir, "docs/en/plans"), { recursive: true });
  write(path.join(dir, "docs/en/plans/no-status.md"), "# P\n\n### Task Purpose\n");
  const r = spawnSync(process.execPath, [CONSISTENCY, "--gate", "--json"], { cwd: dir, encoding: "utf8" });
  if (r.status !== 1) return false;
  const out = JSON.parse(r.stdout);
  return out.gateIssues.some((g) => g.kind === "plans_status_unknown" && g.item.includes("no-status.md"));
});

test("consistency: design and archived plan statuses are never flagged", () => {
  const dir = tmp("plans-clean");
  write(path.join(dir, "package.json"), JSON.stringify({ version: "1.0.0" }));
  fs.mkdirSync(path.join(dir, "docs/en/plans"), { recursive: true });
  write(path.join(dir, "docs/en/plans/design.md"), "# P\n\n> **Status: design plan, not implemented.**\n");
  write(path.join(dir, "docs/en/plans/done-archived.md"), "# P\n\n> **Status: archived**\n");
  const gate = spawnSync(process.execPath, [CONSISTENCY, "--gate", "--json"], { cwd: dir, encoding: "utf8" });
  if (gate.status !== 0) return false;
  const out = JSON.parse(gate.stdout);
  return out.planStatuses.every((p) => p.status === "design" || p.status === "archived") && out.pendingArchive === 0;
});

test("consistency: zh-CN and zh-TW keyword variants are classified", () => {
  const dir = tmp("plans-trilingual");
  write(path.join(dir, "package.json"), JSON.stringify({ version: "1.0.0" }));
  for (const lang of ["en", "zh-CN", "zh-TW"]) fs.mkdirSync(path.join(dir, `docs/${lang}/plans`), { recursive: true });
  write(path.join(dir, "docs/en/plans/imp.md"), "# P\n\n> **Status: implemented**\n");
  write(path.join(dir, "docs/zh-CN/plans/imp.md"), "# P\n\n> **状态：已实现（2026-08-30，待归档）。**\n");
  write(path.join(dir, "docs/zh-TW/plans/imp.md"), "# P\n\n> **狀態：已實作（2026-08-30，待歸檔）。**\n");
  const gate = spawnSync(process.execPath, [CONSISTENCY, "--gate", "--json"], { cwd: dir, encoding: "utf8" });
  if (gate.status !== 0) return false;
  const out = JSON.parse(gate.stdout);
  if (out.planStatuses.length !== 3 || out.pendingArchive !== 3) return false;
  return out.planStatuses.every((p) => p.status === "implemented");
});

test("consistency --release-gate: zh-TW implemented keyword triggers pending-archive", () => {
  const dir = tmp("plans-tw-pending");
  write(path.join(dir, "package.json"), JSON.stringify({ version: "1.0.0" }));
  fs.mkdirSync(path.join(dir, "docs/zh-TW/plans"), { recursive: true });
  write(path.join(dir, "docs/zh-TW/plans/imp.md"), "# P\n\n> **狀態：已實作（2026-08-30，待歸檔）。**\n");
  const r = spawnSync(process.execPath, [CONSISTENCY, "--release-gate", "--json"], { cwd: dir, encoding: "utf8" });
  if (r.status !== 1) return false;
  return JSON.parse(r.stdout).gateIssues.some((g) => g.kind === "plans_pending_archive");
});

test("consistency --json: per-plan classification and pending count (progress view)", () => {
  const dir = tmp("plans-progress");
  write(path.join(dir, "package.json"), JSON.stringify({ version: "1.0.0" }));
  fs.mkdirSync(path.join(dir, "docs/en/plans"), { recursive: true });
  write(path.join(dir, "docs/en/plans/design.md"), "# P\n\n> **Status: design plan, not implemented.**\n");
  write(path.join(dir, "docs/en/plans/wip.md"), "# P\n\n> **Status: Active**\n");
  const r = spawnSync(process.execPath, [CONSISTENCY, "--json"], { cwd: dir, encoding: "utf8" });
  if (r.status !== 0) return false;
  const out = JSON.parse(r.stdout);
  const byPlan = Object.fromEntries(out.planStatuses.map((p) => [p.plan, p.status]));
  return byPlan["docs/en/plans/design.md"] === "design" && byPlan["docs/en/plans/wip.md"] === "active" && out.pendingArchive === 0;
});

test("consistency --release-gate: versioned changelog section satisfies coverage (post-rename regression)", () => {
  const dir = tmp("changelog-rename");
  gitInit(dir);
  // a governed file change (package.json: not a consent sync point) makes changelogCoverage applicable
  write(path.join(dir, "package.json"), JSON.stringify({ version: "1.0.0" }));
  // daily state: [Unreleased] present with a category -> passes
  write(path.join(dir, "CHANGELOG.md"), "## [Unreleased]\n\n### Added\n- x\n");
  const daily = spawnSync(process.execPath, [CONSISTENCY, "--release-gate"], { cwd: dir, encoding: "utf8" });
  if (daily.status !== 0) return false;
  // the standard release step renames [Unreleased] -> [X.Y.Z] BEFORE the gate runs;
  // the gate must accept the versioned section (semantic: change is recorded)
  write(path.join(dir, "CHANGELOG.md"), "## [0.11.1] - 2026-09-03\n\n### Added\n- x\n");
  const r = spawnSync(process.execPath, [CONSISTENCY, "--release-gate"], { cwd: dir, encoding: "utf8" });
  return r.status === 0;
});

test("consistency --release-gate: versioned changelog without category still fails", () => {
  const dir = tmp("changelog-nocat");
  gitInit(dir);
  write(path.join(dir, "package.json"), JSON.stringify({ version: "1.0.0" }));
  write(path.join(dir, "CHANGELOG.md"), "## [0.11.1] - 2026-09-03\n");
  const r = spawnSync(process.execPath, [CONSISTENCY, "--release-gate", "--json"], { cwd: dir, encoding: "utf8" });
  if (r.status !== 1) return false;
  return JSON.parse(r.stdout).gateIssues.some((g) => g.kind === "changelog_coverage");
});

test("consistency --release-gate: oldest section category does not cover the empty newest section (regression)", () => {
  // A category in an OLD versioned section must not satisfy coverage for the change
  // the newest section claims (recorded elsewhere or not at all).
  const dir = tmp("changelog-oldcat");
  gitInit(dir);
  write(path.join(dir, "package.json"), JSON.stringify({ version: "1.0.0" }));
  write(path.join(dir, "CHANGELOG.md"), "## [0.11.1] - 2026-09-03\n\n## [0.11.0] - 2026-08-30\n\n### Added\n- y\n");
  const r = spawnSync(process.execPath, [CONSISTENCY, "--release-gate", "--json"], { cwd: dir, encoding: "utf8" });
  if (r.status !== 1) return false;
  return JSON.parse(r.stdout).gateIssues.some((g) => g.kind === "changelog_coverage");
});

test("consistency --gate: daily mode still requires [Unreleased] after a release (old-vs-new section)", () => {
  // Post-release repo shape: only versioned sections exist. Daily mode must keep
  // reporting the advisory (which is why the next change adds a fresh [Unreleased]),
  // while the release date's own name matches the topmost versioned section.
  const dir = tmp("changelog-daily");
  gitInit(dir);
  write(path.join(dir, "package.json"), JSON.stringify({ version: "1.0.0" }));
  write(path.join(dir, "CHANGELOG.md"), "## [0.11.1] - 2026-09-03\n\n### Added\n- x\n");
  const r = spawnSync(process.execPath, [CONSISTENCY, "--gate", "--json"], { cwd: dir, encoding: "utf8" });
  if (r.status !== 0) return false;
  const out = JSON.parse(r.stdout);
  return out.issues.changelog_coverage.length === 1;
});

test("consistency --release-gate: AGENTS.md-only change is doc-only and exempt from changelog coverage", () => {
  const dir = tmp("changelog-doconly");
  gitInit(dir);
  // AGENTS.md is a consent sync point, so the fixture must carry the full markers;
  // the point under test is that a doc-only AGENTS.md edit is NOT a changelog-required change.
  writeConsentSyncPoint(dir, "AGENTS.md", CONSENT_THREE_MARKERS_TEXT);
  const r = spawnSync(process.execPath, [CONSISTENCY, "--release-gate", "--json"], { cwd: dir, encoding: "utf8" });
  if (r.status !== 0) return false;
  const out = JSON.parse(r.stdout);
  return out.gateIssues.length === 0 && !out.issues.changelog_coverage.length;
});

test("consistency --release-gate: references change without changelog record still fails", () => {
  const dir = tmp("changelog-refcat");
  gitInit(dir);
  write(path.join(dir, "package.json"), JSON.stringify({ version: "1.0.0" }));
  write(path.join(dir, "references/policies/coding.policy.md"), "# Coding\n");
  const r = spawnSync(process.execPath, [CONSISTENCY, "--release-gate", "--json"], { cwd: dir, encoding: "utf8" });
  if (r.status !== 1) return false;
  return JSON.parse(r.stdout).gateIssues.some((g) => g.kind === "changelog_coverage");
});

test("validator: generated skill missing SKILL.md exits 1 (no longer masked by dir entry)", () => {
  const dir = tmp("noskill-file");
  buildFullDefault(dir);
  fs.mkdirSync(path.join(dir, ".governance/generated/skills/review-manager"), { recursive: true });
  const r = run(dir);
  return r.status === 1 && r.stdout.includes("Generated skill") && r.stdout.includes("review-manager/SKILL.md");
});

test("consistency --release-gate: docs/rules change (governed-project rule) still requires changelog", () => {
  const dir = tmp("changelog-docrules");
  gitInit(dir);
  write(path.join(dir, "docs/rules/lifecycle.md"), "# Lifecycle\n");
  const r = spawnSync(process.execPath, [CONSISTENCY, "--release-gate", "--json"], { cwd: dir, encoding: "utf8" });
  return r.status === 1 && JSON.parse(r.stdout).gateIssues.some((g) => g.kind === "changelog_coverage");
});

test("validator: manifest artifact path escaping ROOT fails (containment)", () => {
  const dir = tmp("escape-artifact");
  buildFullDefault(dir);
  // The escape target must EXIST outside ROOT, otherwise the assertion passes for the
  // trivial reason that the file is missing and containment is never exercised.
  fs.writeFileSync(path.join(path.dirname(dir), "escape-sentinel.txt"), "x");
  const m = JSON.parse(fs.readFileSync(path.join(dir, ".governance/manifest.json"), "utf8"));
  m.artifacts.push({ name: "escape", path: "../escape-sentinel.txt", kind: "file" });
  fs.writeFileSync(path.join(dir, ".governance/manifest.json"), JSON.stringify(m));
  const r = run(dir, ["--json"]);
  if (r.status !== 1) return false;
  const out = JSON.parse(r.stdout);
  const check = out.results.find((x) => x.name === "escape");
  return check !== undefined && check.ok === false;
});

test("validator: a project reached through a symlinked root still validates", () => {
  const dir = tmp("symlink-root");
  buildFullDefault(dir);
  // Manifest mode is where the containment comparison runs, so the fixture needs real
  // artifacts declared; with an empty array the validator falls back to defaults mode
  // and the symlinked-root path is never exercised.
  const artifacts = ["AGENTS.md", "CHANGELOG.md", ".gitignore", ".env.example"].map((p) => ({ name: p, path: p, kind: "file" }));
  const m = JSON.parse(fs.readFileSync(path.join(dir, ".governance/manifest.json"), "utf8"));
  m.schema_version = "1";
  m.artifacts = artifacts;
  fs.writeFileSync(path.join(dir, ".governance/manifest.json"), JSON.stringify(m));
  const link = path.join(path.dirname(dir), path.basename(dir) + "-link");
  if (!linkDir(dir, link)) {
    console.log("  (skipped: directory links not permitted on this platform)");
    return true;
  }
  const direct = run(dir, ["--json"]);
  const viaLink = spawnSync(process.execPath, [VALIDATOR, "--json"], { cwd: link, encoding: "utf8" });
  const a = JSON.parse(direct.stdout);
  const b = JSON.parse(viaLink.stdout);
  // Same tree, same verdict: the containment check must not treat the canonical path as
  // out-of-tree just because the cwd was reached through a link.
  return a.mode === "manifest" && b.mode === "manifest" &&
    a.passed === b.passed && a.total === b.total && direct.status === viaLink.status;
});

// Windows blocks file symlinks without developer mode but allows directory junctions;
// POSIX allows both. Returns false when the platform refuses, so a test can skip openly.
test("validator: a skill directory symlinked out of the tree is rejected", () => {
  const dir = tmp("symlink-skilldir");
  buildFullDefault(dir);
  const outside = path.join(path.dirname(dir), path.basename(dir) + "-outside");
  fs.mkdirSync(outside, { recursive: true });
  fs.writeFileSync(path.join(outside, "SKILL.md"), "# Evil\n");
  fs.mkdirSync(path.join(dir, ".governance/generated/skills"), { recursive: true });
  if (!linkDir(outside, path.join(dir, ".governance/generated/skills/evil"))) {
    console.log("  (skipped: directory links not permitted on this platform)");
    return true;
  }
  const r = run(dir, ["--json"]);
  if (r.status !== 1) return false;
  const check = JSON.parse(r.stdout).results.find((x) => x.name === "Generated skill: evil/SKILL.md");
  // The out-of-tree junction must be enumerated AND rejected — not silently accepted
  // because lstat only guards the final path component.
  return check !== undefined && check.ok === false;
});

test("validator: symlinked generated SKILL.md is rejected (real file required)", () => {
  const dir = tmp("symlink-skill");
  buildFullDefault(dir);
  const sk = path.join(dir, ".governance/generated/skills/review-manager");
  fs.mkdirSync(sk, { recursive: true });
  fs.writeFileSync(path.join(dir, "outside.txt"), "x");
  try {
    fs.symlinkSync(path.join(dir, "outside.txt"), path.join(sk, "SKILL.md"), "file");
  } catch (e) {
    console.log("  (skipped: symlink creation not permitted — " + e.code + ")");
    return true;
  }
  return run(dir).status === 1;
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

test("consistency: ordinary source/test/scratch changes do NOT demand a changelog", () => {
  const cases = ["src/app.js", "tests/foo.test.js", "notes.txt"];
  return cases.every((f) => {
    const dir = tmp("changelog-scope-" + path.basename(f, path.extname(f)));
    gitInit(dir);
    fs.mkdirSync(path.dirname(path.join(dir, f)), { recursive: true });
    write(path.join(dir, f), "x");
    write(path.join(dir, "CHANGELOG.md"), "## [0.1.0] - 2026-01-01\n");
    const r = spawnSync(process.execPath, [CONSISTENCY, "--release-gate", "--json"], { cwd: dir, encoding: "utf8" });
    if (r.status !== 0) return false;
    return !JSON.parse(r.stdout).gateIssues.some((g) => g.kind === "changelog_coverage");
  });
});

test("check-plan-delivery: a directory artifact still matches its descendants", () => {
  const dir = tmp("plandel-dirfrag");
  fs.mkdirSync(path.join(dir, "docs/en/plans"), { recursive: true });
  write(path.join(dir, "docs/en/plans/x.md"),
    "# X\n\n> **Status: implemented**\n\n> **Target: payload**\n\n### Affected Files\n\n- `.governance/generated/skills/review-manager/SKILL.md` — generated skill\n");
  fs.mkdirSync(path.join(dir, "references/templates"), { recursive: true });
  write(path.join(dir, "references/templates/sub-skills.md"), "## 1. review-manager\n\n.governance/generated/skills\n");
  const r = spawnSync(process.execPath, [PLAN_DELIVERY, "--gate", "--json"], { cwd: dir, encoding: "utf8" });
  const out = JSON.parse(r.stdout);
  return r.status === 0 && out.undelivered === 0;
});

test("check-lock: control characters in state fields cannot repaint the terminal", () => {
  const dir = tmp("lock-ansi");
  fs.mkdirSync(path.join(dir, ".governance"), { recursive: true });
  write(path.join(dir, ".governance/state.json"), JSON.stringify({
    locked: "holder",
    agent_id: "\u001b[31mFAKE\u001b[0m NO LOCK HELD",
    task_id: "t\u0000x",
  }));
  const r = spawnSync(process.execPath, [LOCK_CHECK], { cwd: dir, encoding: "utf8" });
  return r.status === 1 && !r.stderr.includes("\u001b") && !r.stderr.includes("\u0000");
});

test("validator: complete generated skills pass and the check is reported", () => {
  const dir = tmp("skill-ok");
  buildFullDefault(dir);
  const sk = path.join(dir, ".governance/generated/skills/drift-check");
  fs.mkdirSync(sk, { recursive: true });
  write(path.join(sk, "SKILL.md"), "# Drift Check\n");
  const r = run(dir, ["--json"]);
  if (r.status !== 0) return false;
  const out = JSON.parse(r.stdout);
  return out.results.some((x) => x.name === "Generated skill: drift-check/SKILL.md" && x.ok === true);
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
