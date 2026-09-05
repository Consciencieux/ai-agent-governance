// tests/suites/docs.test.js — batch-1 migration from tests/run-tests.js (anti-patch plan §3).
// Verbatim region move (marker-to-marker); helper consolidation into tests/support/ is batch 2.


const { spawnSync } = require("child_process");
const fs = require("fs");
const path = require("path");

module.exports = (test) => {

test("doc parity: parallel trees exit 0", () => {
  const dir = tmp("parity-ok");
  buildParityTrees(dir);
  const r = spawnSync(process.execPath, [PARITY_CHECK], { cwd: dir, encoding: "utf8" });
  return r.status === 0;
});

test("doc parity: heading drift in one tree exits 1", () => {
  const dir = tmp("parity-drift");
  buildParityTrees(dir);
  fs.appendFileSync(path.join(dir, "docs", "zh-TW", "doc.md"), "\n## 额外章节\n");
  const r = spawnSync(process.execPath, [PARITY_CHECK], { cwd: dir, encoding: "utf8" });
  return r.status === 1 && r.stdout.includes("structure drift");
});

test("doc parity: missing file in one tree exits 1", () => {
  const dir = tmp("parity-missing");
  buildParityTrees(dir);
  fs.rmSync(path.join(dir, "docs", "en", "doc.md"));
  const r = spawnSync(process.execPath, [PARITY_CHECK], { cwd: dir, encoding: "utf8" });
  return r.status === 1 && r.stdout.includes("missing in docs/en/");
});


// commit file(s) with a forced author/committer date: `git commit --date=<iso>`
test("doc freshness: stale doc flagged, fresh doc not flagged (exit 0)", () => {
  const dir = tmp("freshness");
  buildFreshnessFixture(dir);
  const r = spawnSync(process.execPath, [FRESHNESS_CHECK, "--json"], { cwd: dir, encoding: "utf8" });
  const out = JSON.parse(r.stdout);
  return (
    r.status === 0 &&
    out.stale.includes("docs/ARCHITECTURE.md") &&
    !out.stale.includes("CHANGELOG.md") &&
    !out.veryStale.includes("docs/ARCHITECTURE.md")
  );
});

test("doc freshness: very stale doc (90+ days) flagged as very stale", () => {
  const dir = tmp("freshness-very");
  gitInit(dir);
  write(path.join(dir, "docs", "ARCHITECTURE.md"), "# Arch\n");
  const oldDate = new Date(Date.now() - 95 * 86400000).toISOString().slice(0, 10);
  gitCommitAt(dir, ["docs/ARCHITECTURE.md"], oldDate + "T00:00:00+00:00", "doc very old");
  write(path.join(dir, "src", "main.ts"), "x\n");
  gitCommitAt(dir, ["src/main.ts"], new Date().toISOString(), "code recent");
  const r = spawnSync(process.execPath, [FRESHNESS_CHECK, "--json"], { cwd: dir, encoding: "utf8" });
  const out = JSON.parse(r.stdout);
  return r.status === 0 && out.veryStale.includes("docs/ARCHITECTURE.md");
});

test("doc freshness: drift-report.json gains freshness section", () => {
  const dir = tmp("freshness-drift");
  buildFreshnessFixture(dir);
  write(path.join(dir, ".governance", "drift-report.json"), JSON.stringify({ missing: [] }));
  spawnSync(process.execPath, [FRESHNESS_CHECK], { cwd: dir, encoding: "utf8" });
  const drift = JSON.parse(fs.readFileSync(path.join(dir, ".governance", "drift-report.json"), "utf8"));
  return drift.freshness && Array.isArray(drift.freshness.stale);
});


// Trilingual fixture: glossary with forbidden renderings + one doc per language tree.
test("terminology gate: forbidden rendering in a language tree is reported and gated", () => {
  const dir = tmp("term-hit");
  buildI18nFixture(dir, { zhTW: "# 指南\n\n使用協議與範本。\n" }); // 協議 is forbidden in zh-TW
  const advisory = spawnSync(process.execPath, [CONSISTENCY, "--json"], { cwd: dir, encoding: "utf8" });
  const out = JSON.parse(advisory.stdout);
  const hit = out.issues.terminology_usage.some((i) => i.includes("zh-TW") && i.includes("協議"));
  if (!hit || advisory.status !== 0) return false; // advisory reports but never blocks
  const gated = spawnSync(process.execPath, [CONSISTENCY, "--gate", "--json"], { cwd: dir, encoding: "utf8" });
  return gated.status === 1 && JSON.parse(gated.stdout).gateIssues.some((g) => g.kind === "terminology_usage");
});

test("terminology gate: zh-CN leg reports its own forbidden column", () => {
  const dir = tmp("term-zhcn");
  buildI18nFixture(dir, { zhCN: "# 指南\n\n使用協定與範本。\n" }); // 協定 is forbidden in zh-CN
  const r = spawnSync(process.execPath, [CONSISTENCY, "--gate", "--json"], { cwd: dir, encoding: "utf8" });
  return r.status === 1 && JSON.parse(r.stdout).gateIssues.some((g) => g.kind === "terminology_usage" && g.item.includes("zh-CN") && g.item.includes("協定"));
});

test("terminology gate: line-level exemption suppresses a deliberate source-form quote", () => {
  const dir = tmp("term-exempt");
  buildI18nFixture(dir, { zhTW: "# 指南\n\n討論 `協議` 這個譯法本身。 <!-- i18n: allow 協議 -->\n" });
  const r = spawnSync(process.execPath, [CONSISTENCY, "--gate", "--json"], { cwd: dir, encoding: "utf8" });
  return r.status === 0 && JSON.parse(r.stdout).issues.terminology_usage.length === 0;
});

test("terminology gate: preceding-line exemption (the table-safe form) suppresses", () => {
  const dir = tmp("term-exempt-prev");
  buildI18nFixture(dir, { zhTW: "# 指南\n\n<!-- i18n: allow 協議 -->\n討論 `協議` 這個譯法本身。\n" });
  const r = spawnSync(process.execPath, [CONSISTENCY, "--gate", "--json"], { cwd: dir, encoding: "utf8" });
  return r.status === 0 && JSON.parse(r.stdout).issues.terminology_usage.length === 0;
});

test("terminology gate: clean trees register terms and report nothing (positive marker)", () => {
  const dir = tmp("term-clean");
  buildI18nFixture(dir);
  const r = spawnSync(process.execPath, [CONSISTENCY, "--gate", "--json"], { cwd: dir, encoding: "utf8" });
  const out = JSON.parse(r.stdout);
  // termsRegistered > 0 proves the parser RAN; a plain empty-issues assertion
  // would pass even with the whole gate disabled (vacuous control).
  return r.status === 0 && out.termsRegistered > 0 && out.issues.terminology_usage.length === 0;
});

test("terminology gate: no glossary (governed project shape) no-ops with zero registered terms", () => {
  const dir = tmp("term-noglossary");
  gitInit(dir);
  write(path.join(dir, "docs", "zh-TW", "guide.md"), "# 指南\n\n使用協議。\n");
  const r = spawnSync(process.execPath, [CONSISTENCY, "--gate", "--json"], { cwd: dir, encoding: "utf8" });
  const out = JSON.parse(r.stdout);
  // registered === 0 proves the no-op branch (not a silently dead feature — the hit test
  // above already proves "glossary present ⇒ enforces", bracketing this side).
  return r.status === 0 && out.issues.terminology_usage.length === 0 && out.termsRegistered === 0;
});

test("terminology gate: malformed glossary (no parseable header) fails closed", () => {
  const dir = tmp("term-malformed");
  gitInit(dir);
  write(path.join(dir, "docs", "glossary.md"), "一些散文，没有表格。\n");
  write(path.join(dir, "docs", "zh-TW", "guide.md"), "# 指南\n\n使用協定。\n");
  const advisory = spawnSync(process.execPath, [CONSISTENCY, "--json"], { cwd: dir, encoding: "utf8" });
  if (advisory.status !== 0 || !JSON.parse(advisory.stdout).issues.terminology_usage.some((i) => i.includes("no parseable header"))) return false;
  const gated = spawnSync(process.execPath, [CONSISTENCY, "--gate"], { cwd: dir, encoding: "utf8" });
  return gated.status === 1;
});

test("terminology gate: glossary without forbidden columns is a legitimate no-constraint config", () => {
  const dir = tmp("term-nocol");
  gitInit(dir);
  write(path.join(dir, "docs", "glossary.md"), "# Glossary\n\n| English | 简体中文 | 繁體中文 |\n| --- | --- | --- |\n| protocol | 协议 | 協定 |\n");
  write(path.join(dir, "docs", "zh-TW", "guide.md"), "# 指南\n\n使用協議。\n");
  const r = spawnSync(process.execPath, [CONSISTENCY, "--gate", "--json"], { cwd: dir, encoding: "utf8" });
  const out = JSON.parse(r.stdout);
  return r.status === 0 && out.issues.terminology_usage.length === 0 && out.termsRegistered === 0;
});

test("terminology gate: aligned separator row (:---:) is not mistaken for a variant", () => {
  const dir = tmp("term-aligned");
  gitInit(dir);
  write(path.join(dir, "docs", "glossary.md"),
    "# Glossary\n\n| English | 简体中文 | 繁體中文 | Forbidden zh-CN | Forbidden zh-TW |\n" +
    "| :--- | :--- | :--- | :---: | ---: |\n" +
    "| protocol | 协议 | 協定 | 協定 | 協議 |\n");
  write(path.join(dir, "docs", "zh-CN", "guide.md"), "# 指南\n\n使用協定。\n"); // genuinely forbidden
  const r = spawnSync(process.execPath, [CONSISTENCY, "--gate", "--json"], { cwd: dir, encoding: "utf8" });
  const out = JSON.parse(r.stdout);
  // the separator text must NOT be registered as variants; the real forbidden term must be
  return r.status === 1 && out.termsRegistered === 2 &&
    out.gateIssues.every((g) => g.item.includes("協定") && !g.item.includes(":---"));
});

test("translation freshness: source committed after translation is stale", () => {
  const dir = tmp("i18n-stale");
  buildI18nFixture(dir);
  const old = new Date(Date.now() - 5 * 86400000).toISOString();
  gitCommitAt(dir, ["docs/en/guide.md", "docs/zh-TW/guide.md", "docs/glossary.md"], old, "translations");
  gitCommitAt(dir, ["docs/zh-CN/guide.md"], new Date().toISOString(), "source updated");
  const r = spawnSync(process.execPath, [FRESHNESS_CHECK, "--json"], { cwd: dir, encoding: "utf8" });
  const out = JSON.parse(r.stdout);
  const en = out.translations.find((t) => t.translation === "docs/en/guide.md");
  return r.status === 0 && en && en.status === "stale" && /source committed after/.test(en.why);
});

test("translation freshness: same-commit pair is translated (synchronized commit)", () => {
  const dir = tmp("i18n-sync");
  buildI18nFixture(dir);
  gitCommitAt(dir, ["docs"], new Date().toISOString(), "all three languages together");
  const r = spawnSync(process.execPath, [FRESHNESS_CHECK, "--json"], { cwd: dir, encoding: "utf8" });
  const out = JSON.parse(r.stdout);
  // Asserting the `why` is what makes this non-vacuous: with the same-commit branch
  // deleted the pair still reports status "translated" (default), but with an empty why.
  return out.translations.length === 2 && out.translations.every((t) => t.status === "translated" && t.why === "synchronized commit");
});

test("translation freshness: uncommitted source change makes translations stale", () => {
  const dir = tmp("i18n-dirty");
  buildI18nFixture(dir);
  gitCommitAt(dir, ["docs"], new Date().toISOString(), "all languages");
  write(path.join(dir, "docs", "zh-CN", "guide.md"), "# 指南\n\n使用协议与模板。新增一段。\n");
  const r = spawnSync(process.execPath, [FRESHNESS_CHECK, "--json"], { cwd: dir, encoding: "utf8" });
  const out = JSON.parse(r.stdout);
  // length guard: .every() on [] is vacuously true and would mask a broken pairing scan
  return out.translations.length > 0 && out.translations.every((t) => t.status === "stale" && /uncommitted/.test(t.why));
});

test("translation freshness: source and translation dirty in ONE changeset is not stale", () => {
  const dir = tmp("i18n-together");
  buildI18nFixture(dir);
  gitCommitAt(dir, ["docs"], new Date().toISOString(), "all languages");
  // the documented workflow: source + translations edited together, not yet committed
  write(path.join(dir, "docs", "zh-CN", "guide.md"), "# 指南\n\n使用协议与模板。新增一段。\n");
  write(path.join(dir, "docs", "en", "guide.md"), "# Guide\n\nProtocol and template. New paragraph.\n");
  write(path.join(dir, "docs", "zh-TW", "guide.md"), "# 指南\n\n使用協定與範本。新增一段。\n");
  const advisory = spawnSync(process.execPath, [FRESHNESS_CHECK, "--json"], { cwd: dir, encoding: "utf8" });
  const out = JSON.parse(advisory.stdout);
  if (advisory.status !== 0 || !out.translations.every((t) => t.status === "translated")) return false;
  const gated = spawnSync(process.execPath, [FRESHNESS_CHECK, "--release-gate"], { cwd: dir, encoding: "utf8" });
  return gated.status === 0; // an in-flight changeset must NOT false-block the release gate
});

test("translation freshness: a never-committed translation is its own visible status", () => {
  const dir = tmp("i18n-untracked-t");
  buildI18nFixture(dir);
  gitCommitAt(dir, ["docs/zh-CN/guide.md", "docs/glossary.md"], new Date().toISOString(), "source only");
  // docs/en/guide.md stays untracked on disk — a "TODO untranslated" stub. It must NOT
  // silently report "translated" (fail-open), and it must not block the gate either
  // (an untracked file is by definition part of an in-flight changeset; if it is never
  // committed, the parity gate flags the missing file).
  const r = spawnSync(process.execPath, [FRESHNESS_CHECK, "--json"], { cwd: dir, encoding: "utf8" });
  const out = JSON.parse(r.stdout);
  const en = out.translations.find((t) => t.translation === "docs/en/guide.md");
  if (r.status !== 0 || !en || en.status !== "uncommitted" || !/never committed/.test(en.why)) return false;
  const gated = spawnSync(process.execPath, [FRESHNESS_CHECK, "--release-gate"], { cwd: dir, encoding: "utf8" });
  return gated.status === 0;
});

test("translation freshness: a bogus review SHA fails closed (stale, not translated)", () => {
  const dir = tmp("i18n-bogus-sha");
  buildI18nFixture(dir);
  const old = new Date(Date.now() - 5 * 86400000).toISOString();
  gitCommitAt(dir, ["docs/en/guide.md", "docs/zh-TW/guide.md", "docs/glossary.md"], old, "translations");
  gitCommitAt(dir, ["docs/zh-CN/guide.md"], new Date().toISOString(), "source updated");
  write(path.join(dir, "docs", "en", "guide.md"), "# Guide\n\n<!-- i18n-reviewed: deadbeefdeadbeefdeadbeefdeadbeefdeadbeef -->\n\nUse the protocol and template.\n");
  gitCommitAt(dir, ["docs/en/guide.md"], new Date().toISOString(), "bogus marker");
  const gated = spawnSync(process.execPath, [FRESHNESS_CHECK, "--release-gate", "--json"], { cwd: dir, encoding: "utf8" });
  const out = JSON.parse(gated.stdout);
  const en = out.translations.find((t) => t.translation === "docs/en/guide.md");
  return gated.status === 1 && en && en.status === "stale" && /no longer covers/.test(en.why);
});

test("translation freshness: a marker from a LATER unrelated commit does not claim coverage", () => {
  const dir = tmp("i18n-descendant-sha");
  buildI18nFixture(dir);
  const old = new Date(Date.now() - 5 * 86400000).toISOString();
  gitCommitAt(dir, ["docs/en/guide.md", "docs/zh-TW/guide.md", "docs/glossary.md"], old, "translations");
  gitCommitAt(dir, ["docs/zh-CN/guide.md"], new Date().toISOString(), "source updated");
  // a commit AFTER the source that never touched it — pasting repo-wide HEAD as a marker
  write(path.join(dir, "file.txt"), "modified"); // the unrelated commit must have content
  gitCommitAt(dir, ["file.txt"], new Date().toISOString(), "unrelated later commit");
  const headSha = spawnSync("git", ["rev-parse", "--short=7", "HEAD"], { cwd: dir, encoding: "utf8" }).stdout.trim();
  write(path.join(dir, "docs", "en", "guide.md"), `# Guide\n\n<!-- i18n-reviewed: ${headSha} -->\n\nUse the protocol and template.\n`);
  gitCommitAt(dir, ["docs/en/guide.md"], new Date().toISOString(), "descendant marker");
  const gated = spawnSync(process.execPath, [FRESHNESS_CHECK, "--release-gate", "--json"], { cwd: dir, encoding: "utf8" });
  const out = JSON.parse(gated.stdout);
  const en = out.translations.find((t) => t.translation === "docs/en/guide.md");
  return gated.status === 1 && en && en.status === "stale" && /no longer covers/.test(en.why);
});

test("translation freshness: a stale (non-draft) translation blocks --release-gate", () => {
  const dir = tmp("i18n-stale-gate");
  buildI18nFixture(dir);
  const old = new Date(Date.now() - 5 * 86400000).toISOString();
  gitCommitAt(dir, ["docs/en/guide.md", "docs/zh-TW/guide.md", "docs/glossary.md"], old, "translations");
  gitCommitAt(dir, ["docs/zh-CN/guide.md"], new Date().toISOString(), "source updated");
  const gated = spawnSync(process.execPath, [FRESHNESS_CHECK, "--release-gate"], { cwd: dir, encoding: "utf8" });
  return gated.status === 1;
});

test("translation freshness: draft marker is advisory-tolerated but release-gate blocked", () => {
  const dir = tmp("i18n-draft");
  buildI18nFixture(dir, { en: "# Guide\n\n<!-- i18n-status: draft -->\n\nWIP.\n" });
  gitCommitAt(dir, ["docs"], new Date().toISOString(), "all languages");
  const advisory = spawnSync(process.execPath, [FRESHNESS_CHECK, "--json"], { cwd: dir, encoding: "utf8" });
  const out = JSON.parse(advisory.stdout);
  const en = out.translations.find((t) => t.translation === "docs/en/guide.md");
  if (advisory.status !== 0 || !en || en.status !== "draft") return false;
  const gated = spawnSync(process.execPath, [FRESHNESS_CHECK, "--release-gate"], { cwd: dir, encoding: "utf8" });
  return gated.status === 1;
});

test("translation freshness: i18n-reviewed marker clears a stale timestamp", () => {
  const dir = tmp("i18n-reviewed");
  buildI18nFixture(dir);
  const old = new Date(Date.now() - 5 * 86400000).toISOString();
  gitCommitAt(dir, ["docs/en/guide.md", "docs/zh-TW/guide.md", "docs/glossary.md"], old, "translations");
  gitCommitAt(dir, ["docs/zh-CN/guide.md"], new Date().toISOString(), "source touched");
  const srcSha = spawnSync("git", ["log", "-1", "--format=%h", "--", "docs/zh-CN/guide.md"], { cwd: dir, encoding: "utf8" }).stdout.trim();
  const before = JSON.parse(spawnSync(process.execPath, [FRESHNESS_CHECK, "--json"], { cwd: dir, encoding: "utf8" }).stdout);
  if (!before.translations.find((t) => t.translation === "docs/en/guide.md" && t.status === "stale")) return false;
  write(path.join(dir, "docs", "en", "guide.md"), `# Guide\n\n<!-- i18n-reviewed: ${srcSha} -->\n\nUse the protocol and template.\n`);
  gitCommitAt(dir, ["docs/en/guide.md"], new Date().toISOString(), "mark reviewed");
  const after = JSON.parse(spawnSync(process.execPath, [FRESHNESS_CHECK, "--json"], { cwd: dir, encoding: "utf8" }).stdout);
  const en = after.translations.find((t) => t.translation === "docs/en/guide.md");
  return en && en.status === "translated" && /reviewed against/.test(en.why);
});

test("translation freshness: governed project without trilingual trees no-ops", () => {
  const dir = tmp("i18n-noop");
  buildFreshnessFixture(dir);
  const r = spawnSync(process.execPath, [FRESHNESS_CHECK, "--json"], { cwd: dir, encoding: "utf8" });
  const out = JSON.parse(r.stdout);
  const gated = spawnSync(process.execPath, [FRESHNESS_CHECK, "--release-gate"], { cwd: dir, encoding: "utf8" });
  return r.status === 0 && out.translations.length === 0 && gated.status === 0;
});

test("check-layout-sync: tree covering all files exits 0", () => {
  const dir = tmp("layout-ok");
  buildLayoutRepo(dir, ["references/templates/a.template.md", "scripts/check-a.js", "scripts/check-b.js"]);
  const r = spawnSync(process.execPath, [LAYOUT_CHECK], { cwd: dir, encoding: "utf8" });
  return r.status === 0;
});

test("check-layout-sync: missing file in tree exits 1", () => {
  const dir = tmp("layout-missing");
  buildLayoutRepo(dir, ["references/templates/a.template.md", "scripts/check-a.js"]);
  fs.writeFileSync(path.join(dir, "scripts/check-b.js"), "x", "utf8");
  const r = spawnSync(process.execPath, [LAYOUT_CHECK], { cwd: dir, encoding: "utf8" });
  return r.status === 1 && r.stdout.includes("missing: check-b.js");
});



test("check-layout-sync: missing architecture.md exits 1", () => {
  const dir = tmp("layout-no-arch");
  buildLayoutRepo(dir, ["references/templates/a.template.md", "scripts/check-a.js"]);
  fs.rmSync(path.join(dir, "docs/en/architecture.md"));
  const r = spawnSync(process.execPath, [LAYOUT_CHECK], { cwd: dir, encoding: "utf8" });
  return r.status === 1;
});

test("check-layout-sync: architecture.md without a Repository Layout block exits 1", () => {
  const dir = tmp("layout-no-section");
  buildLayoutRepo(dir, ["references/templates/a.template.md", "scripts/check-a.js"]);
  for (const lang of ["en", "zh-CN", "zh-TW"]) {
    write(path.join(dir, `docs/${lang}/architecture.md`), "# Architecture\n\nNo layout block here.\n");
  }
  const r = spawnSync(process.execPath, [LAYOUT_CHECK], { cwd: dir, encoding: "utf8" });
  return r.status === 1;
});

// A2/A4 regression: the scope-tier entries in package.json must match what AGENTS.md's
// scope table promises. `check:payload` shipped WITHOUT check-doc-consistency --gate — the
// tier documented for references/ + SKILL.md edits skipped the gate that owns the consent
// markers and protected-files list living in exactly those files (audit 2026-09-05).
// `plans:delivery` shipped without --gate, so check:all could never fail on delivery.
test("package.json scope tiers match the AGENTS.md scope table", () => {
  const pkg = JSON.parse(fs.readFileSync(path.join(SKILL_ROOT, "package.json"), "utf8"));
  const s = pkg.scripts || {};
  const required = {
    "check:docs": ["npm test", "docs:parity", "check-doc-consistency.js --gate", "docs:layout"],
    "check:payload": ["npm test", "docs:layout", "check-doc-consistency.js --gate", "check-coding-hygiene.js --gate", "check-role-completeness.js --gate"],
    "check:tests": ["npm test", "check-coding-hygiene.js --gate"],

};
  for (const [entry, parts] of Object.entries(required)) {
    const cmd = s[entry] || "";
    for (const p of parts) if (!cmd.includes(p)) return false;
  }
  // Delivery must be gated, otherwise check:all reports success on a broken plan.
  if (!/check-plan-delivery\.js\s+--gate/.test(s["plans:delivery"] || "")) return false;
  return /plans:delivery/.test(s["check:all"] || "");
});

// A3 regression: CI ran only `npm test` + parity, so layout / consistency / hygiene /
// role-completeness never blocked the build while AGENTS.md claimed "fails CI" — the
// always-on gate clusters were enforced by agent discipline alone (audit 2026-09-05).
test("CI runs the full fail-closed gate group", () => {
  const ci = fs.readFileSync(path.join(SKILL_ROOT, ".github/workflows/ci.yml"), "utf8");
  // The badge step may swallow its own failure (ADR-0006); the gate group may not.
  const gateLine = ci.split("\n").find((l) => /run:\s*npm run check\b/.test(l));
  if (!gateLine || /\|\|\s*true/.test(gateLine)) return false;
  return /verify_governance\.js[^\n]*\|\|\s*true/.test(ci);
});

// B1 regression: release.md is SKILL-INTERNAL, so a governed project never has it — the
// operative copy is the release-manager section of sub-skills.md that INIT generates.
// That copy carried only 3 of release.md's 6 requirement markers (parity / sync / delivery
// were missing), so the deficient version was the one actually executed (audit 2026-09-05).
test("sub-skills release-manager covers every release.md requirement marker", () => {
  const rel = fs.readFileSync(path.join(SKILL_ROOT, "references/workflows/release.md"), "utf8");
  const sub = fs.readFileSync(path.join(SKILL_ROOT, "references/templates/sub-skills.md"), "utf8");
  const MARKER = /(?:git\.require_clean_status|tests\.required|changelog\.required|version\.manifest_match_tag|release\.tag_required|release\.proposal_approved|release\.review_satisfied|validator\.passed|docs\.parity_passed|sync\.passed|plan\.delivery_verified)/g;
  const inRelease = new Set(rel.match(MARKER) || []);
  const inSub = new Set(sub.match(MARKER) || []);
  if (inRelease.size === 0) return false;
  for (const m of inRelease) if (!inSub.has(m)) return false;
  return true;
});

// The generated sub-skill must carry the release-only gates and the packaging step — but
// only in forms a GOVERNED PROJECT can actually execute: check-doc-consistency.js and
// check-doc-freshness.js are INSTALLED, whereas check-plan-delivery.js and package-skill.sh
// are SKILL-INTERNAL and must appear as an obligation, not as a command to run.
test("sub-skills release-manager Phase 4 keeps the release-only gates and packaging step", () => {
  const sub = fs.readFileSync(path.join(SKILL_ROOT, "references/templates/sub-skills.md"), "utf8");
  const start = sub.indexOf("Only after explicit approval");
  if (start < 0) return false;
  const phase4 = sub.slice(start, start + 4000);
  return /check-doc-consistency\.js --release-gate/.test(phase4)
    && /check-doc-freshness\.js --release-gate/.test(phase4)
    && /Affected Files/.test(phase4)
    && /gh release upload/.test(phase4);
});

// B4 regression: the governance-validator sub-skill is what a governed project installs,
// and its Checks line omitted five of the validator's DEFAULTS entries (lock, git policy
// + its json, secret scan, sync groups) — the shipped description understated what the
// validator actually enforces (audit 2026-09-05).
test("sub-skills validator Checks line covers the validator DEFAULTS tools", () => {
  const sub = fs.readFileSync(path.join(SKILL_ROOT, "references/templates/sub-skills.md"), "utf8");
  const start = sub.indexOf("Path resolution:");
  if (start < 0) return false;
  const line = sub.slice(start, sub.indexOf("\n", start));
  for (const needed of ["check-lock.js", "git-policy.json", "check-git-policy.js", "check-secrets.js", "check-sync.js"]) {
    if (!line.includes(needed)) return false;
  }
  return /DEFAULTS/.test(sub.slice(start, start + 900));
});

// B5 regression: the "Modify 3+ Files at Once" rule is real (lifecycle.policy.md § 规模分级)
// and the generated AGENTS.md template carried it, but SKILL.md's matrix — the indexed
// authority — did not (audit 2026-09-05).
test("permission matrix rows match between SKILL.md and the AGENTS.md template", () => {
  const skill = fs.readFileSync(path.join(SKILL_ROOT, "SKILL.md"), "utf8");
  const tmpl = fs.readFileSync(path.join(SKILL_ROOT, "references/templates/agents-md.template.md"), "utf8");
  const ACTIONS = ["Read", "Create Documentation", "Modify Code", "Modify 3+ Files at Once", "Delete Code", "Dependency Change", "Git Commit / Git Push"];
  for (const a of ACTIONS) {
    if (!skill.includes("| " + a + " |")) return false;
    if (!tmpl.includes("| " + a + " |")) return false;
  }
  return true;
});

// C3: the emptiness guard fired only when BOTH roots vanished, so renaming `references/`
// left `scripts/` alone carrying the check — the scan silently enforced half the corpus
// and still printed a green line with a plausible count (audit 2026-09-05).
test("check-layout-sync: one empty root dir fails instead of half-scanning", () => {
  const dir = tmp("layout-half-scan");
  buildLayoutRepo(dir, ["references/policies/a.md", "scripts/b.js"]);
  fs.rmSync(path.join(dir, "references"), { recursive: true, force: true });
  const r = spawnSync(process.execPath, [LAYOUT_CHECK, "--json"], { cwd: dir, encoding: "utf8" });
  if (r.status !== 1) return false;
  const out = JSON.parse(r.stdout);
  return out.pass === false && out.issues.some((i) => i.includes("references"));
});

// C7: the release-only clusters (pending-archive, archived-plan status, changelog
// coverage, translation staleness) fired only when a human typed --release-gate. The npm
// entry makes the documented release.md step runnable; CI deliberately does NOT run it,
// because pending-archive is legal between task completion and the release commit.
test("package.json exposes a check:release entry with the release-only gates", () => {
  const pkg = JSON.parse(fs.readFileSync(path.join(SKILL_ROOT, "package.json"), "utf8"));
  const cmd = (pkg.scripts || {})["check:release"] || "";
  if (!/check-doc-consistency\.js --release-gate/.test(cmd)) return false;
  if (!/check-doc-freshness\.js --release-gate/.test(cmd)) return false;
  if (!/check-plan-delivery\.js --gate/.test(cmd)) return false;
  const ci = fs.readFileSync(path.join(SKILL_ROOT, ".github/workflows/ci.yml"), "utf8");
  return !/release-gate/.test(ci);
});



// sub-skills.md is INSTALLED — INIT writes it into the governed project as generated
// sub-skills, where a SKILL-INTERNAL script does NOT exist. Telling an agent to run one
// is an instruction that cannot execute. This diff introduced exactly that defect
// (check-plan-delivery.js, check-doc-parity.js and package-skill.sh), so pin those three.
//
// release-manager.js is deliberately NOT pinned: the generated release-manager sub-skill is
// built around invoking it, so that contradiction predates this change and removing the
// calls would gut the flow. Recorded as an open conflict in the gate-repair plan instead.
test("sub-skills.md does not tell a governed project to run absent check scripts", () => {
  const spec = JSON.parse(fs.readFileSync(path.join(SKILL_ROOT, "references/init-spec.json"), "utf8"));
  const internal = new Set((spec.distribution && spec.distribution.skillInternal) || []);
  const pinned = ["scripts/check-plan-delivery.js", "scripts/check-doc-parity.js", "scripts/package-skill.sh"];
  // Guard the guard: if one of these ever becomes INSTALLED, revisit this test.
  for (const p of pinned) if (!internal.has(p)) return false;
  const sub = fs.readFileSync(path.join(SKILL_ROOT, "references/templates/sub-skills.md"), "utf8");
  for (const p of pinned) {
    const base = p.replace(/^scripts\//, "");
    const runnable = new RegExp("(?:node|bash|sh)\\s+scripts/" + base.replace(/[.*+?^${}()|[\]\\]/g, function (m) { return "\\" + m; }));
    if (runnable.test(sub)) return false;
  }
  return true;
});
};
