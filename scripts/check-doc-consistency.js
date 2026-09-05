#!/usr/bin/env node
// PAYLOAD SCRIPT — copied standalone into governed projects (references/init-spec.json).
// Keep it self-contained: Node builtins only, never require() a sibling module.
// Doc Consistency Check — read-only. Detects cross-document contradictions:
//   1. version-example sync   — examples of governance_version/manifest values vs current
//   2. protected-files sync   — summary lists vs the single source of truth
//   3. ADR status sync        — "Accepted (Unreleased)" ADRs whose feature already shipped
//   4. link validity          — relative markdown links must resolve
//   5. numeric claims         — documented counts (sub-skills, validator checks, tests)
//   6. prompt sync            - sub-skill / main-skill triggers and the commands.md
//      inventory must agree in BOTH directions (missing = a skill users cannot discover;
//      stale = a trigger the manual advertises that no source declares). ADR-0008 makes
//      this copy deliberate and gate-enforced; authority stays in the skill sources.
//   7. trilingual tree parity — delegated to repo-tools/check-doc-parity.js
//   8. consent-cluster sync   — every EXISTING consent sync point must declare the same
//      markers (Exception A, Exception B, echo-never-waived); missing points are skipped,
//      so both this repo (4 points) and governed projects (2 points) are covered.
//   9. principles-index pointers — every file referenced by the AGENTS.md governance
//      principles index must exist (the index is pointers-only, so a moved file silently
//      turns it into a lie unless this is checked).
//   10. plan-status classification — TASK plans under docs/{lang}/plans/ carry a canonical
//      status keyword (design/implemented/completed/archived). Unknown status is a
//      always-on gate failure (fixable on the spot); an implemented/completed plan still
//      sitting in plans/ is pending-archive — advisory in default/--gate (the documented
//      lifecycle lets a completed plan wait for the release commit), fail-closed only in
//      --release-gate. The scan no-ops when the trilingual trees are absent (governed
//      projects). --json also reports the per-plan classification (progress view).
//   11. changelog coverage — release-gate reports changed governance/payload surfaces
//      without an Unreleased entry in CHANGELOG.md.
//   12. terminology gate — docs/glossary.md's Forbidden zh-CN / Forbidden zh-TW columns
//      register renderings that must not appear in that language tree (concept terms
//      only; trigger words quoted in source form are deliberate and stay unregistered).
//      A glossary that exists but cannot be parsed is reported, never silently skipped.
//
// FROZEN RESPONSIBILITY: this script performs only the cross-document fact consistency
// checks listed above. A new check may create a standalone script only when the existing
// scripts' responsibility, input and failure semantics cannot host it; otherwise the
// addition is refused. Decision: every cluster here is a "mechanical evidence" check
// (marker, structure, path, regex) — see the `evidence` field in --json output.
//
// Evidence tiers: mechanical = structure/marker/path/regex; human-attested = review
// approval; unverified = declaration with no independent verification.
// Pass means "mechanical condition satisfied", not "behavior is correct".
//
// Modes: default = advisory, ALWAYS exit 0 (heuristics, not a gate).
//        --gate  = fail-closed on the mechanically checkable clusters ONLY (#1's
//                  frontmatter version sync point, #2, #6, #8, #10's unknown status and
//                  #12); the other heuristics still report but never affect the exit code.
//        --release-gate = --gate plus #10's pending-archive + archived-plan status and
//                  #11's changelog clusters.
// Usage: node scripts/check-doc-consistency.js [--json] [--gate] [--release-gate]

const fs = require("fs");
const path = require("path");
const { spawnSync } = require("child_process");

const ROOT = process.cwd();
const DOCS = path.join(ROOT, "docs");

// Consent sync points — the same rule is expressed in several files across both domains
// (this repo vs governed projects). Each GROUP holds the equivalent paths in each domain;
// a group is checked when AT LEAST ONE of its paths exists, and every present path in the
// group must declare all markers. In the skill repo the repo-side paths exist; in a
// governed project the generated ones (AGENTS.md, docs/rules/git-policy.md) exist.
const CONSENT_SYNC_GROUPS = [
  ["AGENTS.md"],
  ["references/policies/git.policy.md", "docs/rules/git-policy.md"],
  ["references/templates/agents-md.template.md"],
  ["references/policies/lifecycle.policy.md", "docs/rules/lifecycle.md"],
  ["SKILL.md"],
];
// A marker's `files` restriction is compared by its basename, with dots and dashes
// normalised away: references/policies/git.policy.md and its governed rendering
// docs/rules/git-policy.md both reduce to "gitpolicymd", so the restriction covers both
// domains (they express the same rule, one in the skill repo, one in the governed project).
// Without this, a governed-project docs/rules file would be skipped from M3/M4/M5 because
// "git-policy.md" never matched the literal "git.policy.md".
const consentBasename = (s) => path.basename(s).replace(/[ .-]/g, "").toLowerCase();
const CONSENT_MARKERS = [
  // Universal: every sync point must state the one-confirmation principle (the pre-commit
  // echo is the single authorisation point; a user's write instruction triggers the echo
  // but is NOT the consent itself) and the intent-alignment demotion of plan approval.
  // M1 anchors on the echo + full-sequence substance, NOT the bare "一次确认" wording: a
  // section heading like "确认范围（一次确认 per 变更集）" would otherwise satisfy the
  // marker while the substantive rule it heads was deleted (false negative found by review).
  { name: "one confirmation per change set (pre-commit echo; instruction is not consent)", re: /^(?=[\s\S]*(?:回显|echo))(?=[\s\S]*(?:命令序列|command sequence|add.{0,25}commit.{0,25}push))/i, files: null },
  { name: "plan approval is intent alignment, not commit authorisation", re: /intent alignment|意图对齐|不是提交授权|不是提交确认/i, files: null },
  // Release alignment point — lifecycle.policy.md is a lifecycle doc and carries no
  // release-approval clause by design; only files that own release flow must state it.
  // M3 anchors on approval COVERING the sequence/write-ops, not the bare "Approval Gate"
  // token: git.policy.md's git-tag bullet ("须先经 Approval Gate") and SKILL.md's
  // artifacts mention ("由 RELEASE 的 Approval Gate 产生") both carry the token but state
  // nothing about coverage — deleting the real release clause left the gate green (review).
  { name: "release: Proposal at Approval Gate covers the sequence", re: /^(?=[\s\S]*(?:Approval Gate|获批准|获批))(?=[\s\S]*(?:covers?\s+[^.\n]{0,40}(?:sequence|write\s*ops?)|覆盖[^。\n]{0,30}(?:序列|写操作|发布序列)))/i,
    files: ["AGENTS.md", "references/policies/git.policy.md", "references/templates/agents-md.template.md", "SKILL.md"] },
  // Universal hard constraints — the echo IS the sequence and execution never deviates;
  // any step fails → stop and report (never retry differently); push rejected →
  // stop and report (never pull/rebase). lifecycle doc carries no git sequence by design —
  // it governs validation-gate failure (exit ≠ 0 = task undone), not git-command sequences.
  // Markers anchor on each clause's OWN distinctive terms — "stop and report" is shared by
  // both clauses, and "fails mid-sequence" appears in the release clause too ("If any
  // check fails mid-sequence"), so broad terms would let a removed failure clause pass via
  // the other clause's wording (both found as false negatives by regression).
  { name: "mid-sequence failure: stop and report, never retry differently", re: /Any step fails|a step fails|任一步失败/i, 
    files: ["AGENTS.md", "references/policies/git.policy.md", "references/templates/agents-md.template.md", "SKILL.md"] },
  { name: "push rejected (non-fast-forward): stop and report, never pull/rebase", re: /non-fast-forward|push rejected|push 被拒|非快进|pull\/rebase|不自行 pull|不得擅自 pull/i,
    files: ["AGENTS.md", "references/policies/git.policy.md", "references/templates/agents-md.template.md", "SKILL.md"] },
];

// #2 trigger tightening: a document is only held to the full protected-files list when it
// CLAIMS to enumerate one. Mere mentions of the protection flow (e.g. "this change follows
// the governance-file-protection flow") are references, not lists. Detection of the claim:
// an explicit enumerating phrase (below/following/如下/如表 …) present alongside the
// protection-floor mention. The single-source-of-truth pointer already exempts deferrals.
const CLAIMS_PROTECTED_LIST = /(?:以下|下表|下面是|以下为|如下).{0,20}(?:清单|列表|文件)|(?:受保护|protected).{0,20}(?:清单|列表|list).{0,12}(?:如下|以下是|如下表|is|are|为)|(?:following|list(?:ed)? below|protected files? (?:include|are|listed)|清单如下|清单为|list is:)/i;

// #10 plan-status contract: the first Status/状态 line of a TASK plan must LEAD with one
// canonical keyword. The set is identical across the three language trees and matches the
// contract in references/policies/lifecycle.policy.md. Anything else is "unknown" —
// reported, never guessed (the pre-existing prose variants stay visible instead of being
// silently widened into a match).
const PLAN_STATUS_LINE = /^>\s*\*\*\s*(?:Status|状态|狀態)\s*[:：]\s*([^*\n]+)/im;
const PLAN_STATUS_KEYWORDS = [
  { status: "design", re: /^(?:design plan, not implemented|设计计划，未实现|設計計劃，未實作)/ },
  { status: "active", re: /^active/i },
  { status: "implemented", re: /^(?:implemented|已实现|已實作)/ },
  { status: "completed", re: /^(?:completed|已完成)/i },
  { status: "archived", re: /^(?:archived|已归档|已歸檔)/ },
];
function classifyPlanStatus(content) {
  const head = content.split(/\r?\n/).slice(0, 12).join("\n");
  const m = head.match(PLAN_STATUS_LINE);
  if (!m) return "unknown";
  const value = m[1].trim();
  for (const k of PLAN_STATUS_KEYWORDS) if (k.re.test(value)) return k.status;
  return "unknown";
}

function walk(dir, base = dir) {
  const out = [];
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) out.push(...walk(p, base));
    else if (e.name.endsWith(".md")) out.push(path.relative(base, p).replace(/\\/g, "/"));
  }
  return out.sort();
}

function readFile(p) {
  try {
    return fs.readFileSync(p, "utf8");
  } catch {
    return null;
  }
}

function currentVersion() {
  try {
    return JSON.parse(readFile(path.join(ROOT, "package.json"))).version;
  } catch {
    return null;
  }
}

function changedPaths() {
  const r = spawnSync("git", ["status", "--porcelain=v1", "-uall"], { cwd: ROOT, encoding: "utf8" });
  if (r.status !== 0) return null;
  return String(r.stdout || "").split(/\r?\n/).filter(Boolean).map((line) => {
    const raw = line.slice(3).trim();
    return (raw.includes(" -> ") ? raw.split(" -> ").pop() : raw).replace(/\\/g, "/");
  }).filter(Boolean);
}

function changelogCoverage(releaseGate) {
  const paths = changedPaths();
  if (!paths || paths.length === 0) return { applicable: false, ok: true };
  // Allowlist, not denylist: only a change to the governance/mechanism surface demands a
  // CHANGELOG record. Ordinary source/test/scratch files are out of this check's scope —
  // their recording duty belongs to the project's own lifecycle, and a denylist here made
  // an untracked note file fail the release gate.
  // docs/rules/** IS in scope: in governed projects those are the rule files (policy
  // payload). Plain docs/**, README, CONTRIBUTING, CHANGELOG, LICENSE and this repo's
  // AGENTS.md stay out — doc-only edits carry no CHANGELOG entry by repo rule.
  const MECHANISM = [
    (p) => p === "SKILL.md",
    (p) => p === "package.json",
    (p) => p.startsWith("references/"),
    (p) => p.startsWith("scripts/"),
    (p) => p.startsWith(".github/"),
    (p) => p.startsWith("docs/rules/"),
    (p) => p.startsWith(".governance/"),
    (p) => p.startsWith(".githooks/"),
  ];
  const governedChange = paths.some((p) => MECHANISM.some((m) => m(p)));
  if (!governedChange) return { applicable: false, ok: true };
  const c = readFile(path.join(ROOT, "CHANGELOG.md")) || "";
  if (!c) return { applicable: true, ok: false };
  // Section-scoped check: the category must sit INSIDE the section that carries the
  // change record. Daily mode requires the [Unreleased] section; at release time the
  // standard flow renames [Unreleased] -> [X.Y.Z] BEFORE --release-gate runs, so the
  // release mode accepts the topmost versioned section instead ("the change is
  // recorded" — not the literal [Unreleased] marker). A category in an older section
  // must NOT satisfy the newest section — that is an unrecorded change, not coverage.
  const heads = c.match(/^##\s+\[[^\]]+\][^\n]*/gm) || [];
  const head = heads.find((h) => releaseGate || /\[Unreleased\]/i.test(h));
  if (!head) return { applicable: true, ok: false };
  const start = c.indexOf(head);
  const rest = c.slice(start);
  const next = rest.match(/\n##\s+\[[^\]]+\]/);
  const sec = next ? rest.slice(0, next.index) : rest;
  return { applicable: true, ok: /###\s+(?:Added|Changed|Fixed|Removed|Security|Deprecated)/i.test(sec) };
}

// #12 terminology gate: docs/glossary.md is the term authority. Its optional
// `Forbidden zh-CN` / `Forbidden zh-TW` columns register renderings that must NOT appear
// in that language tree (e.g. protocol: zh-TW must use 協定, never 協議). Structural
// parity cannot catch this class — term drift and simplified/traditional leaks look
// structurally identical. Semicolon-separated variants; empty cell = no constraint.
// Scope note: register CONCEPT terms only. Trigger words quoted in their source form
// (e.g. the simplified `审核一下` inside a zh-TW doc) are deliberate and must not be
// registered; a line carrying `<!-- i18n: allow <term> -->` (or the line above it —
// an inline comment would split a Markdown table) is exempt either way.
// Fail-closed parsing: a glossary that exists but yields no parseable header is reported
// as malformed rather than silently disabling the gate.
function glossaryForbidden() {
  const c = readFile(path.join(DOCS, "glossary.md"));
  if (!c) return null; // no glossary (governed projects) — check no-ops
  const cols = { "zh-CN": new Map(), "zh-TW": new Map() };
  let sawTable = false;
  let sawHeader = false;
  let header = null; // column layout of the table currently being read
  for (const line of c.split(/\r?\n/)) {
    if (!line.startsWith("|")) continue;
    sawTable = true;
    const cells = line.split("|").slice(1, -1).map((s) => s.trim());
    // Separator rows come in alignment flavours (`---`, `:---`, `:---:`, `---:`) — treat
    // them all as separators, never as data (a mis-parsed ":---:" would become a
    // forbidden variant and fail every following table).
    if (cells.every((cell) => /^:?-{3,}:?$/.test(cell.replace(/\s/g, "")))) continue;
    if (/^English$/i.test(cells[0] || "")) {
      header = cells.map((h) => h.toLowerCase()); // each table re-declares its layout
      sawHeader = true;
      continue;
    }
    if (!header) continue; // data before any header — ignore
    const idxCN = header.indexOf("forbidden zh-cn");
    const idxTW = header.indexOf("forbidden zh-tw");
    const concept = cells[0] || "";
    for (const [lang, idx] of [["zh-CN", idxCN], ["zh-TW", idxTW]]) {
      if (idx < 0 || idx >= cells.length) continue; // table without that column: no constraint
      const raw = cells[idx] || "";
      for (const variant of raw.split(";").map((s) => s.trim()).filter(Boolean)) {
        if (!cols[lang].has(variant)) cols[lang].set(variant, concept);
      }
    }
  }
  if (!sawHeader) return { cols, malformed: true }; // exists but unusable — report, never fail open
  return { cols, malformed: false };
}

function mdFiles() {
  const out = [];
  const top = ["README.md", "CONTRIBUTING.md", "SKILL.md", "AGENTS.md"];
  for (const f of top) if (fs.existsSync(path.join(ROOT, f))) out.push(f);
  if (fs.existsSync(DOCS)) {
    for (const lang of ["en", "zh-CN", "zh-TW"]) {
      const dir = path.join(DOCS, lang);
      if (fs.existsSync(dir)) for (const rel of walk(dir)) out.push((path.join("docs", lang, rel)).replace(/\\/g, "/"));
    }
    for (const rel of walk(DOCS)) {
      const normalized = rel.replace(/\\/g, "/");
      if (normalized.startsWith("design-decisions/") || normalized.startsWith("archive/")) {
        out.push((path.join("docs", normalized)).replace(/\\/g, "/"));
      }
    }
  }
  // references/ carries the INSTALLED policy and template bodies — the agents-md template
  // is the source of every governed project's AGENTS.md. Omitting this tree meant those
  // files were never in the scan set at all, so their protected-files summaries could drift
  // regardless of wording or shape (the reason the template looked "exempt" long after its
  // section parsed correctly). Governed projects have no references/, so this is a no-op
  // there.
  const refs = path.join(ROOT, "references");
  if (fs.existsSync(refs)) {
    for (const rel of walk(refs)) {
      if (rel.endsWith(".md")) out.push((path.join("references", rel)).replace(/\\/g, "/"));
    }
  }
  return out;
}

function main() {
  const json = process.argv.includes("--json");
  const gate = process.argv.includes("--gate");
  const releaseGate = process.argv.includes("--release-gate"); // implies gate behavior + pending-archive
  const anyGate = gate || releaseGate;
  const issues = { version_examples: [], protected_lists: [], adr_statuses: [], broken_links: [], numeric_claims: [], prompt_sync: [], plans_status_unknown: [], plans_pending_archive: [], changelog_coverage: [], terminology_usage: [] };
  const gateIssues = [];
  const version = currentVersion();

  // ---- 11. CHANGELOG coverage ----
  const changelog = changelogCoverage(releaseGate);
  if (changelog.applicable && !changelog.ok) {
    const item = "governance/payload changes require CHANGELOG.md change entries with a category (an [Unreleased] section daily; the topmost versioned section at release)";
    issues.changelog_coverage.push(item);
    if (releaseGate) gateIssues.push({ kind: "changelog_coverage", item });
  }

  // ---- 1. version-example sync ----
  if (version) {
    const files = mdFiles().filter((f) => !f.startsWith("CHANGELOG") && !f.startsWith("docs/archive/"));
    for (const f of files) {
      const c = readFile(path.join(ROOT, f));
      if (!c) continue;
      const re = /(?:governance_version|"version")["']?\s*[:=]\s*["']?(\d+\.\d+\.\d+)/g;
      let m;
      while ((m = re.exec(c))) {
        if (m[1] !== version) issues.version_examples.push(`${f}:${m[1]} != ${version}`);
      }
      // YAML frontmatter carries an UNQUOTED `version: X.Y.Z`, which the regex above cannot
      // match (its "version" alternative requires literal double quotes). SKILL.md's
      // frontmatter is one of this repo's three release sync points, so it was the only one
      // with no mechanical backstop — a release could ship a stale skill version and pass
      // every gate (audit 2026-09-05). Gate class: a version sync point must not drift.
      const fm = /^---\r?\n([\s\S]*?)\r?\n---/.exec(c);
      if (fm) {
        const fv = /^version:\s*["']?(\d+\.\d+\.\d+)["']?\s*$/m.exec(fm[1]);
        if (fv && fv[1] !== version) {
          const item = `${f}: frontmatter version ${fv[1]} != ${version} (release sync point)`;
          issues.version_examples.push(item);
          if (anyGate) gateIssues.push({ kind: "version_examples", item });
        }
      }
    }
  }

  // ---- 2. protected-files sync ----
  // Single source of truth for the protected-files table. This script is INSTALLED into
  // governed projects, where the skill's references/ tree does not exist — there the list
  // lives at docs/rules/governance-files.md (INIT installs it). Try the governed-project
  // path first, then the skill-repo path. If NEITHER exists the check reports a missing
  // source instead of silently finding 0 protected paths and looking green.
  const policyCandidates = [
    path.join(ROOT, "docs", "rules", "governance-files.md"),
    path.join(ROOT, "references", "policies", "governance-files.policy.md"),
  ];
  const policyPath = policyCandidates.find((p) => fs.existsSync(p));
  const policy = policyPath ? readFile(policyPath) || "" : "";
  if (!policyPath) {
    const item = "protected-files source missing: neither docs/rules/governance-files.md nor references/policies/governance-files.policy.md exists — the protected-list cluster cannot run";
    issues.protected_lists.push(item);
    // release-gate blocks: a governed project with a docs/rules/ tree that lacks the
    // protected-files source is a distribution contract defect. Fixtures without docs/rules/
    // (the skill repo itself, minimal test fixtures) are not subject to this check.
    if (releaseGate && fs.existsSync(path.join(ROOT, "docs/rules"))) gateIssues.push({ kind: "protected_lists", item });
  }
  const protectedPaths = [];
  const tableRe = /^\|\s*`([^`]+)`\s*\|/gm;
  let tm;
  // Parse ONLY the protected-files table. The document has two tables: the protected-files
  // list under "## 受保护文件" and a git-tracking table under "## .governance/ Git 跟踪策略";
  // entries like "docs/plans/archive/" from the second would otherwise be demanded from
  // every AGENTS.md summary (found by review).
  //
  // Section-scoped, NOT prefix-scoped: the previous `policy.slice(0, search(/\n## /))`
  // truncated at the FIRST heading, but that heading ("## 受保护文件") PRECEDES its own
  // table — so the window ended before any row and protectedPaths was permanently empty,
  // silently disabling the whole cluster in this repo and in every governed project
  // (audit 2026-09-05). Split into sections and pick the one that owns the list.
  const policySections = policy.split(/\n(?=## )/);
  const protectedSection =
    policySections.find((s) => /^##\s*受保护文件|^##\s*Protected [Ff]iles/m.test(s)) ||
    // Fallback for a reworded heading: the first section that actually contains
    // backticked table rows. Never fall back to the whole document — that would
    // re-admit the git-tracking table this scoping exists to exclude.
    policySections.find((s) => tableRe.test(s) && ((tableRe.lastIndex = 0), true));
  const tableScope = protectedSection || "";
  // Harvest EVERY backticked token in the first cell, not just the first one: the policy
  // writes combined entries ("`AGENTS.md` / `CLAUDE.md`") in a single cell, and taking
  // only the leading match dropped CLAUDE.md from the authoritative set — which then made
  // every summary that lists it look stale.
  for (const row of tableScope.match(/^\|[^\n]*\|/gm) || []) {
    const firstCell = row.split("|")[1] || "";
    for (const bt of firstCell.match(/`([^`]+)`/g) || []) {
      const raw = bt.slice(1, -1).replace(/\*\*/g, "").trim();
      const head = raw.split("/")[0];
      if (
        head === "AGENTS.md" || head === "CLAUDE.md" || head === "opencode.json" ||
        head.startsWith("docs") || head.startsWith(".governance") || head.startsWith("scripts") ||
        head.startsWith(".github") || head === ".githooks" || head === ".gitlab-ci.yml"
      ) {
        protectedPaths.push(raw);
      }
    }
  }
  // A policy source that exists but yields no rows is a parse defect, not a clean state —
  // report it instead of passing vacuously (this is exactly how the bug above survived).
  if (policy && protectedPaths.length === 0) {
    const item = "protected-files table parsed 0 rows from the policy source — the enumeration cluster cannot run (parser/document shape mismatch)";
    issues.protected_lists.push(item);
    if (anyGate) gateIssues.push({ kind: "protected_lists", item });
  }
  if (protectedPaths.length > 0) {
    const protectedSet = new Set(protectedPaths);
    // A declared path is "governance-shaped" if it looks like an entry of this list.
    // Only such tokens are judged; ordinary prose paths (docs/en/architecture.md, README)
    // are not claims about the protected list and must never be flagged.
    // `scripts/` is matched wholesale rather than by a `check-`/`verify-` prefix allowlist:
    // the prefix list silently ignored `verify_governance.js` (this repo's real filename)
    // and any future governance script named otherwise, which is exactly the stale-entry
    // case Rule 4 exists to catch. `.github/workflows` carries a `/` anchor so that a
    // lookalike directory (`.github/workflows-backup/`) is not swept in.
    const GOVERNANCE_SHAPED = /^(?:AGENTS\.md|CLAUDE\.md|opencode\.json|docs\/rules\/|\.governance\/|scripts\/[\w.-]+\.(?:js|sh)|\.githooks\/|\.github\/workflows\/|\.gitlab-ci\.yml)/;
    const summaries = mdFiles().filter((f) => f !== "CHANGELOG.md" && !f.startsWith("docs/archive/"));
    for (const f of summaries) {
      const c = readFile(path.join(ROOT, f));
      if (!c) continue;
      if (f.includes("governance-files.policy.md") || f.includes("governance-files.md") || f.includes("adr-000")) continue;
      const mentionsFlow = /治理文件保护|Governance File Protection|Governance file protection/i.test(c);
      if (!mentionsFlow) continue;
      // Only documents that CLAIM to enumerate the list are judged; the flow mention and
      // the enumeration claim are tested independently (they may sit in different places).
      const claimsEnum = CLAIMS_PROTECTED_LIST.test(c);
      if (!claimsEnum) continue;

      // Scope the claim to its own section so an unrelated single-source-of-truth mention
      // elsewhere (e.g. the AGENTS.md principles index) cannot disable the check.
      // Split on ANY heading level: SKILL.md carries its protection block under "### ",
      // so a "## "-only split found no claim section and fell back to the whole file —
      // which dragged unrelated prose (".governance/state.json" in the state-file docs)
      // into the declaration scan and produced a false stale-entry report.
      //
      // Judge EVERY section that claims an enumeration, not just the first. Taking only the
      // first anchored the installed agents-md template on its permission matrix (which
      // says "protected governance files listed below"), leaving the real protection
      // section — and therefore every generated project's AGENTS.md — unexamined.
      const sections = c.split(/\n(?=#{2,4}\s)/);
      const claimSections = sections.filter((s) => CLAIMS_PROTECTED_LIST.test(s));
      if (claimSections.length === 0) claimSections.push(c);
      for (const claimSection of claimSections) {
      const defersToSource = /单一事实源|single source of truth|完整清单见|完整清单以/i.test(claimSection);

      // Harvest every path the document actually declares, in ALL declaration forms:
      // fenced code blocks (SKILL.md, agents-md.template.md), Markdown table rows, and
      // plain/backticked list items. Parsing only tables is what let code-block summaries
      // drift unchecked (audit 2026-09-05).
      //
      // Scope: the ENUMERATION BLOCK, not the whole section. A protection section also
      // discusses state files and workflow prose ("写入 .governance/state.json"), and
      // those mentions are not claims about the protected list — judging them produced
      // false "stale entry" reports on first run.
      const declared = new Set();
      const addToken = (raw) => {
        const t = String(raw || "").trim().replace(/[`*]/g, "").replace(/[，,。.;；]$/, "");
        if (!t) return;
        // Take the path-looking head of the line: entries carry trailing prose
        // ("scripts/check-lock.js  （锁检查）") that must not become part of the token.
        const head = t.split(/[\s（(]/)[0];
        if (head && GOVERNANCE_SHAPED.test(head)) declared.add(head);
      };
      // The enumeration block: every fenced block / table / list run that follows the
      // enumeration claim inside the claim section — plus the claim's own prose line, which
      // is how the INSTALLED agents-md template writes its list ("Modifying A, B, C ...
      // requires:"). Parsing only fenced/table/unordered-list forms left three shapes
      // invisible, and an unparsed shape does not merely skip Rule 4: it also collapses
      // Rule 3, because `declared.size === 0` reads as "declares nothing" (review finding).
      const claimIdx = claimSection.search(CLAIMS_PROTECTED_LIST);
      const afterClaim = claimIdx >= 0 ? claimSection.slice(claimIdx) : claimSection;
      const blocks = [];
      for (const m of afterClaim.match(/```[\s\S]*?```/g) || []) blocks.push({ kind: "fence", text: m });
      for (const m of afterClaim.match(/(?:^\|[^\n]*\|\n?)+/gm) || []) blocks.push({ kind: "table", text: m });
      // Ordered (`1.`) as well as unordered (`-`/`*`/`+`) list runs.
      for (const m of afterClaim.match(/(?:^[ \t]*(?:[-*+]|\d+[.)])[ \t]+[^\n]*\n?)+/gm) || []) blocks.push({ kind: "list", text: m });
      // Indented (4-space / tab) code blocks.
      for (const m of afterClaim.match(/(?:^(?: {4}|\t)[^\n]*\n?)+/gm) || []) blocks.push({ kind: "indented", text: m });
      // Inline prose enumeration: the claim sentence itself, split on separators.
      const proseLine = afterClaim.split("\n")[0] || "";
      if (proseLine) blocks.push({ kind: "prose", text: proseLine });
      for (const b of blocks) {
        const lines = b.kind === "fence" ? b.text.split("\n").slice(1, -1) : b.text.split("\n");
        for (const line of lines) {
          if (/^\s*\|?\s*-{2,}/.test(line)) continue; // table separator
          const stripped = line.replace(/^[ \t]*(?:[-*+]|\d+[.)])[ \t]+/, "").replace(/^[ \t]*\|?\s*/, "");
          // Separators that enumerate: " / ", ", ", "、", " or ".
          for (const part of stripped.split(/\s\/\s|,\s|、|\sor\s/)) addToken(part);
          for (const bt of line.match(/`([^`]+)`/g) || []) addToken(bt);
        }
      }

      // Rule 4 (always on): a declared governance path that is NOT in the authoritative
      // list is stale — a renamed or deleted file left behind in a summary. A pointer to
      // the single source of truth excuses INCOMPLETENESS, never INCORRECTNESS.
      for (const d of declared) {
        if (protectedSet.has(d)) continue;
        // Directory-style entries cover their descendants. Both `docs/rules/**` and a
        // slash-less `docs/rules**` must work: stripping the stars can leave the stem
        // without a trailing slash, which used to fail the containment test outright.
        const covered = [...protectedSet].some((p) => {
          let stem = p.replace(/\*+$/, "");
          if (!stem.endsWith("/")) {
            if (!p.endsWith("*")) return false; // a concrete file, not a directory entry
            stem += "/";
          }
          return d.startsWith(stem);
        });
        if (covered) continue;
        const item = `${f}: declares \`${d}\` which is not in the protected-files list (renamed, removed, or never existed)`;
        issues.protected_lists.push(item);
        if (anyGate) gateIssues.push({ kind: "protected_lists", item });
      }

      // Rule 1: a pure pointer (no governance paths declared) is complete by construction.
      // `continue` now skips this SECTION, not the file — a document may hold several
      // claim sections and each is judged on its own.
      if (declared.size === 0) continue;
      // Rule 2: partial list + pointer — omissions are legitimate, correctness was already
      // enforced above. Rule 3: an enumeration WITHOUT a pointer claims to be the list, so
      // it must be complete.
      if (defersToSource) continue;
      for (const p of protectedPaths) {
        if (!c.includes(p)) {
          const item = `${f}: missing ${p}`;
          issues.protected_lists.push(item);
          if (anyGate) gateIssues.push({ kind: "protected_lists", item });
        }
      }
      } // end claim-section loop
    }
  }

  // ---- 8. consent-cluster sync (gate class) ----
  // Assert markers over every sync GROUP that has at least one present path; groups with
  // no existing path in this shape (e.g. the skill-entry group in a governed project) are
  // skipped — absence of the whole domain, not a drift. A marker's `files` list (when set)
  // limits which files must carry it — lifecycle.policy.md owns no release clause by design.
  for (const group of CONSENT_SYNC_GROUPS) {
    const present = group.filter((rel) => fs.existsSync(path.join(ROOT, rel)));
    if (present.length === 0) continue;
    for (const rel of present) {
      const c = readFile(path.join(ROOT, rel));
      if (!c) continue;
      for (const m of CONSENT_MARKERS) {
        if (m.files && !m.files.some((f) => rel === f || consentBasename(rel) === consentBasename(f))) continue;
        if (!m.re.test(c)) {
          gateIssues.push({ kind: "consent_cluster", item: `${rel}: missing marker ${m.name}` });
        }
      }
    }
  }

  // ---- 9. principles-index pointers (gate class) ----
  // The AGENTS.md index is pointers-only by design, so a moved or renamed source silently
  // turns each row into a false claim. Assert every referenced file exists. Runs only where
  // the index exists (this repo); governed projects have no such index and are skipped.
  // Scope: only the 4-column principles index table (columns: Principle | Source | Scope).
  // Other tables in AGENTS.md (scope tiering, evidence tiers) also have backtick-delimited
  // paths in their cells but are NOT the principles index — scanning them produces false
  // positives (e.g. the scope table's "architecture.md" in the "when to use" column).
  const agentsDoc = readFile(path.join(ROOT, "AGENTS.md"));
  if (agentsDoc && /Governance principles index/i.test(agentsDoc)) {
    const bt = String.fromCharCode(96);
    const fileRe = new RegExp(bt + "([^" + bt + "]+)" + bt, "g");
    const VALID_SCOPES = ["payload", "both", "repo"];
    for (const line of agentsDoc.split("\n")) {
      if (!line.startsWith("| ") || line.startsWith("| ---") || line.startsWith("| Principle")) continue;
      const cells = line.split("|").map((s) => s.trim());
      // Only process rows where the Scope column (cells[3]) matches a known scope value —
      // this distinguishes the principles index table from other tables in AGENTS.md.
      const scope = (cells[3] || "").toLowerCase();
      if (!VALID_SCOPES.includes(scope)) continue;
      const source = cells[2] || "";
      let fm;
      fileRe.lastIndex = 0;
      while ((fm = fileRe.exec(source))) {
        const target = fm[1].trim();
        if (!/[/.]/.test(target)) continue; // not a path
        if (!fs.existsSync(path.join(ROOT, target))) {
          gateIssues.push({ kind: "principles_index", item: `AGENTS.md index points at missing ${target}` });
        }
      }
    }
  }

  // ---- 10. plan-status classification & pending archive ----
  // Scan the trilingual plans/ trees; no-op where they are absent (governed projects).
  // Unknown status is an always-on gate failure (one-line fix); pending-archive is
  // advisory outside --release-gate because the documented lifecycle lets a completed
  // plan legitimately wait in plans/ for the release commit that archives it.
  const planStatuses = [];
  for (const lang of ["en", "zh-CN", "zh-TW"]) {
    const dir = path.join(DOCS, lang, "plans");
    if (!fs.existsSync(dir)) continue;
    for (const rel of walk(dir)) {
      const planRel = (path.join("docs", lang, "plans", rel)).replace(/\\/g, "/");
      const c = readFile(path.join(ROOT, planRel));
      if (!c) continue;
      const status = classifyPlanStatus(c);
      planStatuses.push({ plan: planRel, status });
      if (status === "unknown") {
        const item = `${planRel}: no canonical status keyword (design/implemented/completed/archived)`;
        issues.plans_status_unknown.push(item);
        gateIssues.push({ kind: "plans_status_unknown", item });
      } else if (status === "implemented" || status === "completed") {
        const item = `${planRel}: ${status} but not yet archived (archive at release)`;
        if (releaseGate) gateIssues.push({ kind: "plans_pending_archive", item });
        else issues.plans_pending_archive.push(item);
      }
    }
  }

  // Archived plans are held to a different rule than plans/: the archive IS the completed
  // state, so "archiving asserts completion" — a file sitting in docs/archive/ must SAY
  // archived. Before this scan the cluster only walked docs/*/plans/, so 19 of 21 archived
  // plans carried a non-canonical or missing Status line (several still said "已实现（待
  // Release 归档）" — a pending-archive claim inside the archive) and nothing noticed
  // (audit 2026-09-05). Fail-closed at release; advisory day to day, matching how the
  // pending-archive rule is tiered for plans/.
  const archiveDir = path.join(DOCS, "archive");
  if (fs.existsSync(archiveDir)) {
    for (const rel of walk(archiveDir)) {
      if (!rel.endsWith(".md") || /^README\.md$/i.test(rel)) continue;
      const planRel = path.join("docs", "archive", rel).replace(/\\/g, "/");
      const c = readFile(path.join(ROOT, planRel));
      if (!c) continue;
      const status = classifyPlanStatus(c);
      planStatuses.push({ plan: planRel, status });
      if (status === "archived") continue;
      const item =
        status === "unknown"
          ? `${planRel}: archived plan has no canonical Status line (archiving asserts completion — say archived)`
          : `${planRel}: archived plan still claims "${status}" (the archive is the completed state)`;
      issues.plans_status_unknown.push(item);
      if (releaseGate) gateIssues.push({ kind: "plans_status_unknown", item });
    }
  }

  // ---- 3. ADR status sync ----
  const changelogText = readFile(path.join(ROOT, "CHANGELOG.md")) || "";
  const releasedVersions = [...changelogText.matchAll(/^## \[(\d+\.\d+\.\d+)\]/gm)].map((m) => m[1]);
  const adrDir = path.join(DOCS, "design-decisions");
  if (fs.existsSync(adrDir)) {
    for (const f of walk(adrDir)) {
      const c = readFile(path.join(adrDir, f));
      if (!c) continue;
      if (/Unreleased|未发布/i.test(c) && !/Status: (Proposed|Superseded|Deprecated)/.test(c)) {
        if (releasedVersions.length > 0) issues.adr_statuses.push(`${f}: marked Unreleased but releases exist`);
      }
    }
  }

  // ---- 4. link validity ----
  const linkFiles = mdFiles();
  for (const f of linkFiles) {
    const c = readFile(path.join(ROOT, f));
    if (!c) continue;
    const re = /\[[^\]]*\]\(([^)#]+)(?:#[^)]*)?\)/g;
    let m;
    while ((m = re.exec(c))) {
      const t = m[1];
      if (t.startsWith("http") || t.startsWith("mailto")) continue;
      if (!fs.existsSync(path.resolve(path.dirname(path.join(ROOT, f)), t))) {
        issues.broken_links.push(`${f} -> ${t}`);
      }
    }
  }

  // ---- 5. numeric claims ----
  // validator check count: docs must claim the same count as the DEFAULTS array
  const validator = readFile(path.join(ROOT, "scripts", "verify_governance.js")) || readFile(path.join(ROOT, "scripts", "verify-governance.js")) || "";
  const defaultArr = validator.match(/const DEFAULTS = \[([\s\S]*?)\n\];/);
  const defaultCount = defaultArr ? (defaultArr[1].match(/^\s*\["/gm) || []).length : 0;
  const claimRe = /(\d+)\s*(?:checks|项检查|项)/g;
  if (defaultCount > 0) {
    for (const f of ["README.md", "CONTRIBUTING.md"]) {
      const c = readFile(path.join(ROOT, f));
      if (!c) continue;
      let m;
      while ((m = claimRe.exec(c))) {
        if (parseInt(m[1]) !== defaultCount) issues.numeric_claims.push(`${f}: claims ${m[1]} checks, source has ${defaultCount}`);
      }
    }
  }

  // ---- 6. prompt sync (gate class; sub-skill triggers <-> commands.md) ----
  // ADR-0008: the trigger inventory in commands.md is a DELIBERATE, controlled copy (users
  // discover sub-skills from the manual), with sub-skills.md staying the authority. Because
  // the copy is mandated, BOTH directions are defects: a trigger missing from a language
  // tree hides a skill from users, and a trigger left behind after removal advertises one
  // that no longer exists. Previously this cluster was advisory and one-directional, so
  // AGENTS.md's "enforces" claim was not backed by anything.
  const subSkills = readFile(path.join(ROOT, "references", "templates", "sub-skills.md")) || "";
  const triggers = new Set();
  for (const line of subSkills.split("\n")) {
    if (!line.includes("Triggers on")) continue;
    const rest = line.split("Triggers on ")[1] || "";
    const quoted = rest.match(/"([^"]+)"/g) || [];
    for (const q of quoted) triggers.add(q.slice(1, -1));
  }
  if (triggers.size > 0) {
    for (const lang of ["en", "zh-CN", "zh-TW"]) {
      const cmdPath = path.join(DOCS, lang, "commands.md");
      const cmd = readFile(cmdPath) || "";
      if (!cmd) continue;
      for (const t of triggers) {
        if (!cmd.includes("`" + t + "`")) {
          const item = `${lang}/commands.md missing trigger \`${t}\``;
          issues.prompt_sync.push(item);
          if (anyGate) gateIssues.push({ kind: "prompt_sync", item });
        }
      }
      // Reverse direction: a trigger the manual advertises that NO source declares is a
      // stale advertisement (renamed or removed). Two authorities exist and both are
      // legitimate: sub-skills.md owns generated sub-skill triggers, SKILL.md owns the
      // main skill's mode triggers (INIT / AUDIT / drift). Judging against sub-skills.md
      // alone reported every main-skill trigger as stale on first run. Scope to the
      // inventory table rows so prose and code samples are never judged.
      const skillEntry = readFile(path.join(ROOT, "SKILL.md")) || "";
      for (const row of cmd.match(/^\|[^\n]*\|/gm) || []) {
        for (const bt of row.match(/`([^`]+)`/g) || []) {
          const t = bt.slice(1, -1).trim();
          // Only trigger-shaped tokens: natural-language phrases or /slash commands.
          if (!/^[a-z0-9][a-z0-9 /*-]*$/i.test(t)) continue;
          if (/[./\\]/.test(t) && !t.startsWith("/")) continue;
          if (triggers.has(t)) continue;
          // Declared anywhere in either authority (quoted or plain) → not stale.
          if (subSkills.includes(t) || skillEntry.includes(t)) continue;
          const item = `${lang}/commands.md advertises \`${t}\` which no skill source declares (removed or renamed trigger)`;
          issues.prompt_sync.push(item);
          if (anyGate) gateIssues.push({ kind: "prompt_sync", item });
        }
      }
    }
  }

  // ---- 12. terminology gate (gate class) ----
  // Per-language forbidden renderings from the glossary. Runs only where a glossary and
  // the language trees exist; governed projects have neither, so it no-ops there. A
  // glossary that exists but cannot be parsed is a governance data defect and is
  // reported (fail-closed) instead of silently disabling the gate.
  let termsRegistered = 0;
  const forbidden = glossaryForbidden();
  if (forbidden && forbidden.malformed) {
    const item = "docs/glossary.md exists but has no parseable header table — terminology gate cannot run; fix the glossary";
    issues.terminology_usage.push(item);
    if (anyGate) gateIssues.push({ kind: "terminology_usage", item });
  } else if (forbidden) {
    termsRegistered = forbidden.cols["zh-CN"].size + forbidden.cols["zh-TW"].size;
    for (const lang of ["zh-CN", "zh-TW"]) {
      const dir = path.join(DOCS, lang);
      if (!fs.existsSync(dir)) continue;
      const table = forbidden.cols[lang];
      if (!table || table.size === 0) continue;
      for (const rel of walk(dir)) {
        const relPath = (path.join("docs", lang, rel)).replace(/\\/g, "/");
        const content = readFile(path.join(ROOT, relPath));
        if (!content) continue;
        const lines = content.split(/\r?\n/);
        lines.forEach((line, i) => {
          for (const [variant, concept] of table) {
            if (!line.includes(variant)) continue;
            // Line-level exemption for deliberate source-form quotes. The marker may sit
            // on the line itself OR on the line above — inside a Markdown table an inline
            // HTML comment would split the table, so the preceding-line form is required
            // (and only works before the table's first row; later rows must be reworded).
            const esc = variant.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
            const allowRe = new RegExp("<!--\\s*i18n:\\s*allow\\b[^>]*" + esc);
            if (allowRe.test(line) || (i > 0 && allowRe.test(lines[i - 1]))) continue;
            const item = `${relPath}:${i + 1}: forbidden ${lang} rendering "${variant}" (concept: ${concept})`;
            issues.terminology_usage.push(item);
            if (anyGate) gateIssues.push({ kind: "terminology_usage", item });
          }
        });
      }
    }
  }

  // ---- 7. trilingual tree parity (delegate) ----
  const parityScript = path.join(ROOT, "scripts", "check-doc-parity.js");
  let parityPass = "unavailable"; // never claim a pass we could not verify
  if (fs.existsSync(parityScript)) {
    const parity = spawnSync(process.execPath, [parityScript, "--json"], { cwd: ROOT, encoding: "utf8" });
    try {
      const p = JSON.parse(parity.stdout);
      parityPass = p.pass;
      if (!p.pass) issues.trilingual_trees = p.issues;
    } catch {
      parityPass = "error";
    }
  }

  const pendingArchive = planStatuses.filter((p) => p.status === "implemented" || p.status === "completed").length;
  const EVIDENCE = {
    version_examples: "mechanical", protected_lists: "mechanical", adr_statuses: "mechanical",
    broken_links: "mechanical", numeric_claims: "mechanical", prompt_sync: "mechanical",
    terminology_usage: "mechanical", changelog_coverage: "mechanical",
    plans_status_unknown: "mechanical", plans_pending_archive: "mechanical",
  };
  // Note: consent_cluster, principles_index and trilingual_trees are also gate/mechanical
  // but live only in gateIssues, not in the issues object — they are excluded from the
  // evidence map so the --json output keys stay aligned with issues keys.
  const report = { timestamp: new Date().toISOString(), version, issues, evidence: EVIDENCE, parity: parityPass, gate: anyGate, releaseGate, gatePass: gateIssues.length === 0, gateIssues, planStatuses, pendingArchive, termsRegistered };

  // Append to drift-report.json if present (runtime output, optional)
  try {
    const driftPath = path.join(ROOT, ".governance", "drift-report.json");
    const rawDrift = readFile(driftPath);
    if (rawDrift) {
      const drift = JSON.parse(rawDrift);
      drift.consistency = issues;
      drift.consistencyGate = { gate: anyGate, releaseGate, pass: gateIssues.length === 0, issues: gateIssues };
      drift.planStatuses = planStatuses;
      fs.writeFileSync(driftPath, JSON.stringify(drift, null, 2) + "\n");
    }
  } catch (e) {
    if (process.env.DEBUG) console.error(`[DEBUG] drift-report.json not updated: ${e.message}`);
  }

  if (json) {
    process.stdout.write(JSON.stringify(report, null, 2) + "\n");
  } else {
    if (gateIssues.length > 0) {
      console.log("✗ gate checks failed:");
      for (const g of gateIssues) console.log(`  - ${g.kind}: ${g.item}`);
    }
    const total = Object.values(issues).reduce((n, a) => n + (Array.isArray(a) ? a.length : 0), 0);
    for (const [k, v] of Object.entries(issues)) {
      if (Array.isArray(v) && v.length) {
        console.log(`✗ ${k}:`);
        for (const i of v.slice(0, 5)) console.log(`  - ${i}`);
      }
    }
    if (planStatuses.length > 0) {
      const counts = {};
      for (const p of planStatuses) counts[p.status] = (counts[p.status] || 0) + 1;
      const summary = Object.entries(counts).map(([s, n]) => `${n} ${s}`).join(", ");
      const pending = pendingArchive > 0 ? ` (${pendingArchive} pending archive — advisory outside --release-gate)` : "";
      console.log(`ℹ plan statuses: ${summary}${pending}`);
    }
    if (total === 0 && gateIssues.length === 0) console.log("✓ no consistency issues");
  }
  // advisory mode ALWAYS exits 0; --gate/--release-gate exit 1 only when a gate-class
  // cluster failed (--release-gate additionally fails on pending-archive)
  process.exit(anyGate && gateIssues.length > 0 ? 1 : 0);
}

main();
