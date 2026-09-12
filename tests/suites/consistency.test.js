// tests/suites/consistency.test.js — batch-1 migration from tests/run-tests.js (anti-patch plan §3).
// Verbatim region move (marker-to-marker); helper consolidation into tests/support/ is batch 2.


const { spawnSync } = require("child_process");
const fs = require("fs");
const path = require("path");

module.exports = (test) => {



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
  return r.status === 0 && Object.values(out.issues).every((v) => (Array.isArray(v) ? v.length === 0 : true)) && out.gatePass === true;
});


test("doc consistency: stale version example in SKILL.md-style doc is flagged", () => {
  const dir = tmp("consistency-version");
  write(path.join(dir, "package.json"), JSON.stringify({ version: "2.0.0" }));
  write(path.join(dir, "SKILL.md"), '{"governance_version": "1.0.0"}');
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


test("CTRL-0006: missing relative link → evaluateBrokenLinks fail with evidence", () => {
  const { evaluateBrokenLinks } = require(path.join(SKILL_ROOT, "scripts/evaluators/ctrl-0006-broken-links.js"));
  const dir = tmp("ctrl-0006-missing");
  write(path.join(dir, "README.md"), "[missing](docs/does-not-exist.md)\n");
  const r = evaluateBrokenLinks({ root: dir });
  return (
    r.control === "CTRL-0006" &&
    r.verdict === "fail" &&
    !Object.prototype.hasOwnProperty.call(r, "decision_effect") &&
    r.evidence.broken_links.some((i) => i.includes("does-not-exist.md"))
  );
});


test("CTRL-0006: valid relative link → evaluateBrokenLinks pass", () => {
  const { evaluateBrokenLinks } = require(path.join(SKILL_ROOT, "scripts/evaluators/ctrl-0006-broken-links.js"));
  const dir = tmp("ctrl-0006-valid");
  write(path.join(dir, "docs/target.md"), "# ok\n");
  write(path.join(dir, "README.md"), "[ok](docs/target.md)\n");
  const r = evaluateBrokenLinks({ root: dir });
  return r.control === "CTRL-0006" && r.verdict === "pass" && r.applicable === true && r.evidence.broken_links.length === 0;
});


test("CTRL-0006: empty tree is applicable vacuous pass", () => {
  const { evaluateBrokenLinks } = require(path.join(SKILL_ROOT, "scripts/evaluators/ctrl-0006-broken-links.js"));
  const dir = tmp("ctrl-0006-empty");
  const r = evaluateBrokenLinks({ root: dir });
  return r.control === "CTRL-0006" && r.applicable === true && r.verdict === "pass" && r.evidence.broken_links.length === 0;
});


test("CTRL-0006: http(s)/mailto targets are skipped; httpfoo remains relative", () => {
  const { createMdLinkFacts } = require(path.join(SKILL_ROOT, "scripts/lib/md-link-facts.js"));
  const facts = createMdLinkFacts(tmp("ctrl-0006-proto"));
  const targets = facts.extractRelativeTargets(
    "[a](https://example.com/x) [b](HTTP://example.com/y) [c](mailto:a@b.c) [d](httpfoo.md) [e](docs/ok.md)\n"
  );
  return targets.length === 2 && targets.includes("httpfoo.md") && targets.includes("docs/ok.md");
});


test("CTRL-0006 binding: wrapper --gate still reports broken links without deny", () => {
  const dir = tmp("ctrl-0006-gate-advisory");
  write(path.join(dir, "README.md"), "[missing](docs/does-not-exist.md)\n");
  const r = spawnSync(process.execPath, [CONSISTENCY_CHECK, "--json", "--gate"], { cwd: dir, encoding: "utf8" });
  const out = JSON.parse(r.stdout);
  const gateKinds = (out.gateIssues || []).map((g) => g.kind);
  return (
    r.status === 0 &&
    out.gatePass === true &&
    out.issues.broken_links.some((i) => i.includes("does-not-exist.md")) &&
    !gateKinds.includes("broken_links")
  );
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
  // no repo-tools/check-doc-parity.js in this fixture
  const r = spawnSync(process.execPath, [CONSISTENCY_CHECK, "--json"], { cwd: dir, encoding: "utf8" });
  const out = JSON.parse(r.stdout);
  return r.status === 0 && out.parity === "unavailable";
});


test("doc consistency: parity delegate finds the script under repo-tools/ (first candidate)", () => {
  const dir = tmp("consistency-parity-repotools");
  write(path.join(dir, "package.json"), JSON.stringify({ version: "1.0.0" }));
  fs.mkdirSync(path.join(dir, "repo-tools"), { recursive: true });
  write(path.join(dir, "repo-tools", "check-doc-parity.js"),
    "process.stdout.write(JSON.stringify({ pass: true }));\n");
  const r = spawnSync(process.execPath, [CONSISTENCY_CHECK, "--json"], { cwd: dir, encoding: "utf8" });
  const out = JSON.parse(r.stdout);
  return r.status === 0 && out.parity === true;
});


test("doc consistency: parity delegate still finds the script under scripts/ (second candidate)", () => {
  const dir = tmp("consistency-parity-scripts");
  write(path.join(dir, "package.json"), JSON.stringify({ version: "1.0.0" }));
  fs.mkdirSync(path.join(dir, "scripts"), { recursive: true });
  write(path.join(dir, "scripts", "check-doc-parity.js"),
    "process.stdout.write(JSON.stringify({ pass: true }));\n");
  const r = spawnSync(process.execPath, [CONSISTENCY_CHECK, "--json"], { cwd: dir, encoding: "utf8" });
  const out = JSON.parse(r.stdout);
  return r.status === 0 && out.parity === true;
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


// v0.13.1 regression: the release shipped with 40 entries still under [Unreleased] and no
// [0.13.1] section — version sync skipped the CHANGELOG rename and every gate stayed green,
// because changelog_coverage only asks "is the change recorded", never "has the version
// section advanced". The newest versioned section is a release sync point like frontmatter.
test("consistency --gate: stale CHANGELOG version section fails the gate", () => {
  const dir = tmp("a5-changelog-stale");
  write(path.join(dir, "package.json"), JSON.stringify({ version: "0.13.1" }));
  write(path.join(dir, "CHANGELOG.md"),
    "# Changelog\n\n## [Unreleased]\n\n### Changed\n\n- unreleased work\n\n## [0.13.0] - 2026-09-05\n\n### Fixed\n\n- old\n");
  const r = spawnSync(process.execPath, [CONSISTENCY, "--gate", "--json"], { cwd: dir, encoding: "utf8" });
  if (r.status !== 1) return false;
  const out = JSON.parse(r.stdout);
  return out.gateIssues.some((g) => g.kind === "version_examples" && g.item.includes("newest version section [0.13.0]"));
});


test("consistency --gate: synced CHANGELOG version section passes", () => {
  const dir = tmp("a5-changelog-ok");
  write(path.join(dir, "package.json"), JSON.stringify({ version: "0.13.1" }));
  write(path.join(dir, "CHANGELOG.md"),
    "# Changelog\n\n## [Unreleased]\n\n## [0.13.1] - 2026-09-05\n\n### Fixed\n\n- the fix\n\n## [0.13.0] - 2026-09-05\n\n### Fixed\n\n- old\n");
  const r = spawnSync(process.execPath, [CONSISTENCY, "--gate", "--json"], { cwd: dir, encoding: "utf8" });
  if (r.status !== 0) return false;
  const out = JSON.parse(r.stdout);
  return !out.gateIssues.some((g) => g.kind === "version_examples" && g.item.includes("newest version section"));
});


// v1.0.0 regression: the release advanced `"version": "1.0.0"` but left `"tag": "v0.15.0"`
// in the manifest examples (SKILL.md + release.md). version_examples never looked at tag
// values, so the pairing contradiction shipped green. The cluster now pairs adjacent
// version/tag fields; pin both the fail and pass shapes here.
test("consistency --gate: release example pairing version with mismatched tag fails", () => {
  const dir = tmp("a5-tag-pair-stale");
  write(path.join(dir, "package.json"), JSON.stringify({ version: "1.0.0" }));
  fs.mkdirSync(path.join(dir, "docs", "en"), { recursive: true });
  write(path.join(dir, "docs/en/guide.md"),
    '{\n  "schema_version": "1.0",\n  "governance_version": "1.0.0",\n  "release": { "version": "1.0.0", "tag": "v0.15.0", "validated": false }\n}\n');
  const r = spawnSync(process.execPath, [CONSISTENCY, "--gate", "--json"], { cwd: dir, encoding: "utf8" });
  if (r.status !== 1) return false;
  const out = JSON.parse(r.stdout);
  return out.gateIssues.some((g) => g.kind === "version_examples" && g.item.includes("pairs version 1.0.0 with tag v0.15.0"));
});


test("consistency --gate: matching tag pairing passes", () => {
  const dir = tmp("a5-tag-pair-ok");
  write(path.join(dir, "package.json"), JSON.stringify({ version: "1.0.0" }));
  fs.mkdirSync(path.join(dir, "docs", "en"), { recursive: true });
  write(path.join(dir, "docs/en/guide.md"),
    '{\n  "schema_version": "1.0",\n  "governance_version": "1.0.0",\n  "release": { "version": "1.0.0", "tag": "v1.0.0", "validated": false }\n}\n');
  const r = spawnSync(process.execPath, [CONSISTENCY, "--gate", "--json"], { cwd: dir, encoding: "utf8" });
  if (r.status !== 0) return false;
  const out = JSON.parse(r.stdout);
  return !out.gateIssues.some((g) => g.kind === "version_examples" && g.item.includes("pairs version"));
});


// Generator sync points live outside .md files (mdFiles() cannot see them): init-spec.json
// `governance_version.default` stamps every new governed project and generate-governance.js's
// fallback sentinel is its last-resort default. A release that drifts either silently changes
// the version future INITs report — the v0.13.1 audit found no backstop for either.
test("consistency --gate: stale init-spec default fails the gate", () => {
  const dir = tmp("a5-initspec-stale");
  write(path.join(dir, "package.json"), JSON.stringify({ version: "0.13.1" }));
  fs.mkdirSync(path.join(dir, "references"), { recursive: true });
  write(path.join(dir, "references", "init-spec.json"),
    '{\n  "distribution": { "skillInternal": [] },\n  "inputs": {\n    "governance_version": {\n      "type": "string",\n      "default": "0.12.0",\n      "description": "x"\n    }\n  }\n}\n');
  const r = spawnSync(process.execPath, [CONSISTENCY, "--gate", "--json"], { cwd: dir, encoding: "utf8" });
  if (r.status !== 1) return false;
  const out = JSON.parse(r.stdout);
  return out.gateIssues.some((g) => g.kind === "version_examples" && g.item.includes("init-spec.json"));
});


test("consistency --gate: stale generator sentinel fails the gate", () => {
  const dir = tmp("a5-generator-stale");
  write(path.join(dir, "package.json"), JSON.stringify({ version: "0.13.1" }));
  fs.mkdirSync(path.join(dir, "scripts"), { recursive: true });
  write(path.join(dir, "scripts", "generate-governance.js"), '  return typeof fallback === "string" && fallback.length > 0 ? fallback : "0.12.0";\n');
  const r = spawnSync(process.execPath, [CONSISTENCY, "--gate", "--json"], { cwd: dir, encoding: "utf8" });
  if (r.status !== 1) return false;
  const out = JSON.parse(r.stdout);
  return out.gateIssues.some((g) => g.kind === "version_examples" && g.item.includes("generate-governance.js"));
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


// Governed projects use ONE docs/plans/ tree (no languages). The trilingual scan no-ops
// there, so an implemented plan used to sail through --release-gate with planStatuses
// empty — a declared mechanical enforcement covering zero plans (audit 2026-09-07).
test("consistency --release-gate: governed-project single-tree plan is scanned", () => {
  const dir = tmp("plans-gov-single");
  write(path.join(dir, "package.json"), JSON.stringify({ version: "1.0.0" }));
  fs.mkdirSync(path.join(dir, "docs/plans"), { recursive: true });
  write(path.join(dir, "docs/plans/TASK_leftover.md"), "# X\n\n> **Status: implemented**\n");
  const rel = spawnSync(process.execPath, [CONSISTENCY, "--release-gate", "--json"], { cwd: dir, encoding: "utf8" });
  const out = JSON.parse(rel.stdout || "{}");
  // the plan must have been seen, and pending-archive must fire with the single-tree path
  if (!(out.planStatuses || []).some((p) => p.plan === "docs/plans/TASK_leftover.md") || !(out.pendingArchive >= 1)) {
    console.error("  governed single-tree plan was not scanned or not flagged");
    return false;
  }
  if (rel.status !== 1) {
    console.error("  --release-gate exited " + rel.status + " despite pending archive");
    return false;
  }
  return out.gateIssues.some((g) => g.kind === "plans_pending_archive" && g.item.includes("TASK_leftover.md"));
});


// Governed-project archives live at docs/plans/archive/ (single language), not the
// trilingual docs/archive/. An archived plan still claiming implemented there must fail.
test("consistency --release-gate: governed-project archive status is checked", () => {
  const dir = tmp("plans-gov-archive");
  write(path.join(dir, "package.json"), JSON.stringify({ version: "1.0.0" }));
  fs.mkdirSync(path.join(dir, "docs/plans/archive"), { recursive: true });
  write(path.join(dir, "docs/plans/archive/TASK_old.md"), "# X\n\n> **Status: implemented**\n");
  const rel = spawnSync(process.execPath, [CONSISTENCY, "--release-gate", "--json"], { cwd: dir, encoding: "utf8" });
  const out = JSON.parse(rel.stdout || "{}");
  if (rel.status !== 1) {
    console.error("  governed archive carrying implemented exited " + rel.status);
    return false;
  }
  return out.gateIssues.some((g) => g.kind === "plans_status_unknown" && g.item.includes("archive/TASK_old.md"));
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
  // (version aligns with the changelog section: the version-section sync check must stay
  // out of this fixture's way — it tests coverage semantics, not version drift)
  write(path.join(dir, "package.json"), JSON.stringify({ version: "0.11.1" }));
  // daily state: [Unreleased] present with a category -> passes
  write(path.join(dir, "CHANGELOG.md"), "## [Unreleased]\n\n### Added\n\n- x\n");
  const daily = spawnSync(process.execPath, [CONSISTENCY, "--release-gate"], { cwd: dir, encoding: "utf8" });
  if (daily.status !== 0) return false;
  // the standard release step renames [Unreleased] -> [X.Y.Z] BEFORE the gate runs;
  // the gate must accept the versioned section (semantic: change is recorded)
  write(path.join(dir, "CHANGELOG.md"), "## [0.11.1] - 2026-09-03\n\n### Added\n\n- x\n");
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
  write(path.join(dir, "package.json"), JSON.stringify({ version: "0.11.1" }));
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


test("consistency --release-gate: docs/rules change (governed-project rule) still requires changelog", () => {
  const dir = tmp("changelog-docrules");
  gitInit(dir);
  write(path.join(dir, "docs/rules/lifecycle.md"), "# Lifecycle\n");
  const r = spawnSync(process.execPath, [CONSISTENCY, "--release-gate", "--json"], { cwd: dir, encoding: "utf8" });
  return r.status === 1 && JSON.parse(r.stdout).gateIssues.some((g) => g.kind === "changelog_coverage");
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


// CHANGELOG 格式统一（lifecycle.policy.md § 格式统一）：版本节标题后必须空行、
// 分类标题前后必须空行、列表项之间必须空行。v1.0.1 曾发现 32 个版本节混用两套
// 空行风格（紧凑 `##`→`###`→item vs 空行分隔）；检查器现在对最新版本节强制统一格式。
test("consistency --gate: changelog version heading without trailing blank fails", () => {
  const dir = tmp("clfmt-head");
  gitInit(dir);
  write(path.join(dir, "package.json"), JSON.stringify({ version: "1.0.0" }));
  write(path.join(dir, "CHANGELOG.md"), "# Changelog\n\n## [Unreleased]\n### Fixed\n\n- one\n");
  const r = spawnSync(process.execPath, [CONSISTENCY, "--gate", "--json"], { cwd: dir, encoding: "utf8" });
  if (r.status !== 1) return false;
  const out = JSON.parse(r.stdout);
  return out.gateIssues.some((g) => g.kind === "changelog_coverage" && /format/.test(g.item));
});


test("consistency --gate: changelog adjacent list items without blank separator fails", () => {
  const dir = tmp("clfmt-items");
  gitInit(dir);
  write(path.join(dir, "package.json"), JSON.stringify({ version: "1.0.0" }));
  write(path.join(dir, "CHANGELOG.md"), "# Changelog\n\n## [Unreleased]\n\n### Fixed\n\n- one\n- two\n");
  const r = spawnSync(process.execPath, [CONSISTENCY, "--gate", "--json"], { cwd: dir, encoding: "utf8" });
  if (r.status !== 1) return false;
  const out = JSON.parse(r.stdout);
  return out.gateIssues.some((g) => g.kind === "changelog_coverage" && /format/.test(g.item));
});


test("consistency --gate: properly formatted changelog section passes", () => {
  const dir = tmp("clfmt-ok");
  gitInit(dir);
  write(path.join(dir, "package.json"), JSON.stringify({ version: "1.0.0" }));
  write(path.join(dir, "CHANGELOG.md"), "# Changelog\n\n## [Unreleased]\n\n### Fixed\n\n- one\n\n- two\n");
  const r = spawnSync(process.execPath, [CONSISTENCY, "--gate", "--json"], { cwd: dir, encoding: "utf8" });
  if (r.status !== 0) return false;
  const out = JSON.parse(r.stdout);
  return !out.gateIssues.some((g) => g.kind === "changelog_coverage" && /format/.test(g.item));
});


test("consistency --release-gate: empty [Unreleased] rebuilt too early is diagnosed", () => {
  const dir = tmp("clfmt-emptyrb");
  gitInit(dir);
  write(path.join(dir, "package.json"), JSON.stringify({ version: "1.0.1" }));
  write(path.join(dir, "CHANGELOG.md"), "# Changelog\n\n## [Unreleased]\n\n## [1.0.1] - 2026-09-08\n\n### Fixed\n\n- x\n");
  const r = spawnSync(process.execPath, [CONSISTENCY, "--release-gate", "--json"], { cwd: dir, encoding: "utf8" });
  if (r.status !== 1) return false;
  const out = JSON.parse(r.stdout);
  return out.gateIssues.some((g) => g.kind === "changelog_coverage" && /rebuilt too early/.test(g.item));
});


test("consistency --gate: post-release empty [Unreleased] does not fail daily gate", () => {
  const dir = tmp("clfmt-postrel");
  gitInit(dir);
  write(path.join(dir, "package.json"), JSON.stringify({ version: "1.0.1" }));
  write(path.join(dir, "CHANGELOG.md"), "# Changelog\n\n## [Unreleased]\n\n## [1.0.1] - 2026-09-08\n\n### Fixed\n\n- x\n");
  const r = spawnSync(process.execPath, [CONSISTENCY, "--gate", "--json"], { cwd: dir, encoding: "utf8" });
  if (r.status !== 0) return false;
  const out = JSON.parse(r.stdout);
  return !out.gateIssues.some((g) => g.kind === "changelog_coverage");
});


test("doc consistency: narrative version quotes in prose are not scanned as examples", () => {
  const dir = tmp("clfmt-narr");
  write(path.join(dir, "package.json"), JSON.stringify({ version: "1.0.1" }));
  write(path.join(dir, "references", "workflows", "release.md"), 'history: the release kept "version": "1.0.0" with tag v0.15.0\n');
  const r = spawnSync(process.execPath, [CONSISTENCY, "--json"], { cwd: dir, encoding: "utf8" });
  const out = JSON.parse(r.stdout);
  return r.status === 0 && !out.issues.version_examples.some((i) => i.includes("release.md"));
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

};
