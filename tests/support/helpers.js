// tests/support/helpers.js — shared fixtures, git helpers, script-path constants and the
// temp-root lifecycle. Single home for everything more than one suite needs (anti-patch
// plan §3, batch 2: the batch-1 duplicates in run-tests.js and the suites are gone).
const { spawnSync } = require("child_process");
const fs = require("fs");
const os = require("os");
const path = require("path");

const VALIDATOR = path.join(__dirname, "..", "..", "scripts", "verify_governance.js");
const LOCK_CHECK = path.join(__dirname, "..", "..", "scripts", "check-lock.js");
const GIT_POLICY_CHECK = path.join(__dirname, "..", "..", "scripts", "check-git-policy.js");
const SECRET_CHECK = path.join(__dirname, "..", "..", "scripts", "check-secrets.js");
const SYNC_CHECK = path.join(__dirname, "..", "..", "scripts", "check-sync.js");
const GENERATOR = path.join(__dirname, "..", "..", "scripts", "generate-governance.js");
const LAYOUT_CHECK = path.join(__dirname, "..", "..", "scripts", "check-layout-sync.js");
const PLAN_DELIVERY = path.join(__dirname, "..", "..", "scripts", "check-plan-delivery.js");
const PARITY_CHECK = path.join(__dirname, "..", "..", "scripts", "check-doc-parity.js");
const FRESHNESS_CHECK = path.join(__dirname, "..", "..", "scripts", "check-doc-freshness.js");
const CONSISTENCY_CHECK = path.join(__dirname, "..", "..", "scripts", "check-doc-consistency.js");
const RELEASE_TOOL = path.join(__dirname, "..", "..", "scripts", "release-manager.js");
const SKILL_ROOT = path.join(__dirname, "..", "..");
const CONSISTENCY = path.join(__dirname, "..", "..", "scripts", "check-doc-consistency.js");
const CONSENT_THREE_MARKERS_TEXT =
  "One confirmation per change set — echo the full git command sequence before committing.\n" +
  "Plan approval is intent alignment, not a commit authorisation workaround.\n" +
  "A Proposal approved at the Approval Gate covers the release sequence.\n" +
  "If any step fails, stop and report — never retry differently.\n" +
  "If push is rejected (non-fast-forward), stop and report — never pull/rebase.";
const TMP_ROOT = fs.mkdtempSync(path.join(os.tmpdir(), "ai-agent-governance-test-"));

function tmp(name) {
  return fs.mkdtempSync(path.join(TMP_ROOT, `${name}-`));
}

function write(p, content) {
  fs.mkdirSync(path.dirname(p), { recursive: true });
  fs.writeFileSync(p, content);
}

function assemble(...parts) {
  return parts.join("");
}

function run(dir, args = []) {
  return spawnSync(process.execPath, [VALIDATOR, ...args], { cwd: dir, encoding: "utf8" });
}

function cleanup() {
  fs.rmSync(TMP_ROOT, { recursive: true, force: true });
}

function buildFullDefault(dir) {
  const dirs = ["docs/features", "docs/plans", "docs/rules", ".governance", ".github/workflows", "scripts"];
  for (const d of dirs) fs.mkdirSync(path.join(dir, d), { recursive: true });
  const files = [
    ["AGENTS.md", "x"],
    ["CHANGELOG.md", "## [Unreleased]\n"],
    ["docs/ARCHITECTURE.md", "# Arch\n\n## Component Registry\n\n| Component | Responsibility | Dependencies | Entry |\n| --- | --- | --- | --- |\n| auth | login | db | src/auth.ts |\n"],
    ["docs/features/auth.md", "x"],
    ["docs/plans/DEVELOPMENT_PLAN.md", "x"],
    ["docs/rules/lifecycle.md", "x"],
    [".gitignore", "x"],
    [".env.example", "x"],
    [".github/workflows/ci.yml", "x"],
    [".governance/state.json", "{}"],
    [".governance/preflight.json", "{}"],
  ];
  for (const [p, c] of files) write(path.join(dir, p), c);
  write(path.join(dir, ".governance/manifest.json"), JSON.stringify({ governance_version: "1.0.0", artifacts: [] }));
  write(path.join(dir, ".governance/git-policy.json"), JSON.stringify({ protectedBranches: ["main", "master"], directPush: false, requireReview: true, allowForcePush: false }));
  fs.copyFileSync(VALIDATOR, path.join(dir, "scripts/verify-governance.js"));
  fs.copyFileSync(LOCK_CHECK, path.join(dir, "scripts/check-lock.js"));
  fs.copyFileSync(GIT_POLICY_CHECK, path.join(dir, "scripts/check-git-policy.js"));
  fs.copyFileSync(SECRET_CHECK, path.join(dir, "scripts/check-secrets.js"));
  fs.copyFileSync(SYNC_CHECK, path.join(dir, "scripts/check-sync.js"));
}

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

function runRelease(dir, args = []) {
  return spawnSync(process.execPath, [RELEASE_TOOL, ...args], { cwd: dir, encoding: "utf8" });
}

function planChanges(current, changes) {
  return runRelease(TMP_ROOT, ["plan", "--json", JSON.stringify({ current, changes })]);
}

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

function gitInit(dir) {
  spawnSync("git", ["init", "-q"], { cwd: dir });
  spawnSync("git", ["config", "user.email", "test@example.com"], { cwd: dir });
  spawnSync("git", ["config", "user.name", "Test"], { cwd: dir });
  write(path.join(dir, ".gitignore"), ".governance/\n");
  write(path.join(dir, "file.txt"), "x");
  spawnSync("git", ["add", "."], { cwd: dir });
  spawnSync("git", ["commit", "-q", "-m", "init"], { cwd: dir });
}

function gitHead(dir) {
  const r = spawnSync("git", ["rev-parse", "HEAD"], { cwd: dir, encoding: "utf8" });
  return String(r.stdout || "").trim();
}

function gitTags(dir) {
  const r = spawnSync("git", ["tag", "-l"], { cwd: dir, encoding: "utf8" });
  return String(r.stdout || "").trim();
}

function listFiles(dir) {
  const out = [];
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) out.push(...listFiles(p));
    else out.push(p);
  }
  return out.sort();
}

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

function buildPlanRepo(dir, planBody) {
  fs.mkdirSync(path.join(dir, "docs/en/plans"), { recursive: true });
  fs.mkdirSync(path.join(dir, "docs/archive"), { recursive: true });
  fs.mkdirSync(path.join(dir, "references/templates"), { recursive: true });
  fs.mkdirSync(path.join(dir, "scripts"), { recursive: true });
  fs.writeFileSync(path.join(dir, "docs/archive/some-plan.md"), planBody, "utf8");
}

function findPosixShell() {
  const candidates = ["sh"];
  if (process.platform === "win32") {
    for (const base of [process.env.ProgramFiles, process.env["ProgramFiles(x86)"]]) {
      if (!base) continue;
      candidates.push(path.join(base, "Git", "bin", "sh.exe"));
      candidates.push(path.join(base, "Git", "usr", "bin", "sh.exe"));
    }
    const where = spawnSync("where.exe", ["git"], { encoding: "utf8" });
    for (const line of String(where.stdout || "").split(/\r?\n/).filter(Boolean)) {
      const cmdDir = path.dirname(line.trim());
      const gitRoot = path.basename(cmdDir).toLowerCase() === "cmd" ? path.dirname(cmdDir) : path.dirname(path.dirname(cmdDir));
      candidates.push(path.join(gitRoot, "bin", "sh.exe"), path.join(gitRoot, "usr", "bin", "sh.exe"));
    }
  }
  for (const candidate of [...new Set(candidates)]) {
    const probe = spawnSync(candidate, ["-c", "exit 0"], { encoding: "utf8" });
    if (!probe.error && probe.status === 0) return candidate;
  }
  return null;
}

function copiedScriptSources() {
  const spec = JSON.parse(fs.readFileSync(path.join(SKILL_ROOT, "references", "init-spec.json"), "utf8"));
  return spec.artifacts
    .filter((a) => a.type === "copy" && a.path.startsWith("scripts/"))
    .map((a) => ({ source: a.source, target: a.path }));
}

function writeConsentSyncPoint(dir, rel, content) {
  write(path.join(dir, rel), content);
}

function linkDir(target, linkPath) {
  try {
    fs.symlinkSync(path.resolve(target), path.resolve(linkPath), "junction");
    return true;
  } catch {
    const r = spawnSync("cmd", ["/c", "mklink", "/J", path.resolve(linkPath), path.resolve(target)], { encoding: "utf8" });
    return r.status === 0;
  }
}



module.exports = { VALIDATOR, LOCK_CHECK, GIT_POLICY_CHECK, SECRET_CHECK, SYNC_CHECK, GENERATOR, LAYOUT_CHECK, PLAN_DELIVERY, PARITY_CHECK, FRESHNESS_CHECK, CONSISTENCY_CHECK, RELEASE_TOOL, SKILL_ROOT, CONSISTENCY, CONSENT_THREE_MARKERS_TEXT, TMP_ROOT, tmp, write, assemble, run, cleanup, buildFullDefault, buildParityTrees, gitCommitAt, buildFreshnessFixture, runRelease, planChanges, buildI18nFixture, gitInit, gitHead, gitTags, listFiles, buildLayoutRepo, buildPlanRepo, findPosixShell, copiedScriptSources, writeConsentSyncPoint, linkDir };
