// tests/suites/docs.test.js — batch-1 migration from tests/run-tests.js (anti-patch plan §3).
// Verbatim region move (marker-to-marker); helper consolidation into tests/support/ is batch 2.


const { spawnSync } = require("child_process");
const fs = require("fs");
const path = require("path");

module.exports = (test) => {
const PARITY_CHECK = path.join(__dirname, "..", "..", "scripts", "check-doc-parity.js");

function buildParityTrees(dir) {
  // minimal three-tree fixture with one parallel doc + root entry files
  write(path.join(dir, "README.md"), "# AI Agent Governance\n\n[English](README.md) · [简体中文](docs/zh-CN/README.md) · [繁體中文](docs/zh-TW/README.md)\n\n## Intro\n\n- Hello\n");
  write(path.join(dir, "CONTRIBUTING.md"), "# Contributing\n\n## Development\n");
  for (const lang of ["en", "zh-CN", "zh-TW"]) {
    write(path.join(dir, "docs", lang, "README.md"), `# 标题\n\n## 章节\n\n- 项目\n`);
    write(path.join(dir, "docs", lang, "doc.md"), `# Doc\n\n## Section\n\n- one\n\n## Table\n\n| a | b |\n| --- | --- |\n| 1 | 2 |\n`);
  }
  // zh-CN/zh-TW in-tree CONTRIBUTING.md must also exist for entry checks
  write(path.join(dir, "docs", "zh-CN", "CONTRIBUTING.md"), "# 贡献\n\n## 开发\n");
  write(path.join(dir, "docs", "zh-TW", "CONTRIBUTING.md"), "# 貢獻\n\n## 開發\n");
}

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

const FRESHNESS_CHECK = path.join(__dirname, "..", "..", "scripts", "check-doc-freshness.js");

// commit file(s) with a forced author/committer date: `git commit --date=<iso>`
function gitCommitAt(dir, files, dateIso, msg) {
  spawnSync("git", ["add", ...files], { cwd: dir });
  spawnSync("git", ["commit", "-q", "-m", msg, "--date=" + dateIso], {
    cwd: dir,
    env: { ...process.env, GIT_AUTHOR_DATE: dateIso, GIT_COMMITTER_DATE: dateIso },
  });
}

function buildFreshnessFixture(dir) {
  gitInit(dir);
  // docs/ARCHITECTURE.md committed 60 days ago
  write(path.join(dir, "docs", "ARCHITECTURE.md"), "# Arch\n");
  const oldDate = new Date(Date.now() - 60 * 86400000).toISOString().slice(0, 10);
  gitCommitAt(dir, ["docs/ARCHITECTURE.md"], oldDate + "T00:00:00+00:00", "doc old");
  // src/ code committed recently (code active)
  write(path.join(dir, "src", "main.ts"), "export const x = 1;\n");
  gitCommitAt(dir, ["src/main.ts"], new Date().toISOString(), "code recent");
  // CHANGELOG.md committed recently (fresh)
  write(path.join(dir, "CHANGELOG.md"), "# Changelog\n");
  gitCommitAt(dir, ["CHANGELOG.md"], new Date().toISOString(), "changelog fresh");
}

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
function buildI18nFixture(dir, opts = {}) {
  gitInit(dir);
  write(path.join(dir, "docs", "glossary.md"),
    "# Glossary\n\n| English | 简体中文 | 繁體中文 | Forbidden zh-CN | Forbidden zh-TW |\n" +
    "| --- | --- | --- | --- | --- |\n" +
    "| protocol | 协议 | 協定 | 協定 | 協議 |\n" +
    "| template | 模板 | 範本 | 範本 | 模板 |\n");
  write(path.join(dir, "docs", "zh-CN", "guide.md"), opts.zhCN || "# 指南\n\n使用协议与模板。\n");
  write(path.join(dir, "docs", "en", "guide.md"), opts.en || "# Guide\n\nUse the protocol and template.\n");
  write(path.join(dir, "docs", "zh-TW", "guide.md"), opts.zhTW || "# 指南\n\n使用協定與範本。\n");
}

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

function buildLayoutRepo(dir, treeFiles) {
  fs.mkdirSync(path.join(dir, "docs/en"), { recursive: true });
  fs.mkdirSync(path.join(dir, "docs/zh-CN"), { recursive: true });
  fs.mkdirSync(path.join(dir, "docs/zh-TW"), { recursive: true });
  fs.mkdirSync(path.join(dir, "references/templates"), { recursive: true });
  fs.mkdirSync(path.join(dir, "scripts"), { recursive: true });
  for (const f of treeFiles) {
    if (f.startsWith("references/") || f.startsWith("scripts/")) {
      fs.mkdirSync(path.dirname(path.join(dir, f)), { recursive: true });
      fs.writeFileSync(path.join(dir, f), "x", "utf8");
    }
  }
  const tree = treeFiles.map((f) => "├── " + f + "   # file").join("\n");
  const fence = String.fromCharCode(96, 96, 96);
  const layout = "### Repository Layout\n\n" + fence + "\nai-agent-governance/\n" + tree + "\n" + fence + "\n";
  for (const lang of ["en", "zh-CN", "zh-TW"]) {
    fs.writeFileSync(path.join(dir, `docs/${lang}/architecture.md`), layout, "utf8");
  }
}

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

};
