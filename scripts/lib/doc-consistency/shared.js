// Stage 4E+/R10: doc-consistency gate cluster (EXTRACT from run.js).
// INSTALLED with siblings listed in references/init-spec.json — keep require graph closed.
"use strict";
const fs = require("fs");
const path = require("path");
const { spawnSync } = require("child_process");
const { createMdLinkFacts } = require("../md-link-facts.js");
const { evaluateBrokenLinks } = require("../../evaluators/ctrl-0006-broken-links.js");
const { classifyPlanStatus, isPlanMarkdown } = require("../plan-status.js");
const { evaluateAdrUnreleasedClaims } = require("../adr-status.js");
// NOTE ( / ): plan-status + adr-status heuristics live in scripts/lib/
// (EXTRACT). New mechanical clusters must not land as inline closures in this file — prefer
// scripts/lib/* or a standalone repo-tools checker and call it from here.

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
  ["references/instruction/agents-md.template.md"],
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
  // Universal: every sync point must state one-confirmation + echo of the full sequence
  // (echo is the execution record; explicit write instruction or IDE confirm IS consent)
  // and the intent-alignment demotion of plan approval.
  // M1 anchors on the echo + full-sequence substance, NOT the bare "一次确认" wording: a
  // section heading like "确认范围（一次确认 per 变更集）" would otherwise satisfy the
  // marker while the substantive rule it heads was deleted (false negative found by review).
  { name: "one confirmation per change set (echo sequence; explicit write or IDE confirm is consent)", re: /^(?=[\s\S]*(?:回显|echo))(?=[\s\S]*(?:命令序列|command sequence|add.{0,25}commit.{0,25}push))/i, files: null },
  { name: "plan approval is intent alignment, not commit authorisation", re: /intent alignment|意图对齐|不是提交授权|不是提交确认/i, files: null },
  // Release alignment point — lifecycle.policy.md is a lifecycle doc and carries no
  // release-approval clause by design; only files that own release flow must state it.
  // M3 anchors on approval COVERING the sequence/write-ops, not the bare "Approval Gate"
  // token: git.policy.md's git-tag bullet ("须先经 Approval Gate") and SKILL.md's
  // artifacts mention ("由 RELEASE 的 Approval Gate 产生") both carry the token but state
  // nothing about coverage — deleting the real release clause left the gate green (review).
  { name: "release: Proposal at Approval Gate covers the sequence", re: /^(?=[\s\S]*(?:Approval Gate|获批准|获批))(?=[\s\S]*(?:covers?\s+[^.\n]{0,40}(?:sequence|write\s*ops?)|覆盖[^。\n]{0,30}(?:序列|写操作|发布序列)))/i,
    files: ["AGENTS.md", "references/policies/git.policy.md", "references/instruction/agents-md.template.md", "SKILL.md"] },
  // Universal hard constraints — the echo IS the sequence and execution never deviates;
  // any step fails → stop and report (never retry differently); push rejected →
  // stop and report (never pull/rebase). lifecycle doc carries no git sequence by design —
  // it governs validation-gate failure (exit ≠ 0 = task undone), not git-command sequences.
  // Markers anchor on each clause's OWN distinctive terms — "stop and report" is shared by
  // both clauses, and "fails mid-sequence" appears in the release clause too ("If any
  // check fails mid-sequence"), so broad terms would let a removed failure clause pass via
  // the other clause's wording (both found as false negatives by regression).
  { name: "mid-sequence failure: stop and report, never retry differently", re: /Any step fails|a step fails|任一步失败/i, 
    files: ["AGENTS.md", "references/policies/git.policy.md", "references/instruction/agents-md.template.md", "SKILL.md"] },
  { name: "push rejected (non-fast-forward): stop and report, never pull/rebase", re: /non-fast-forward|push rejected|push 被拒|非快进|pull\/rebase|不自行 pull|不得擅自 pull/i,
    files: ["AGENTS.md", "references/policies/git.policy.md", "references/instruction/agents-md.template.md", "SKILL.md"] },
];

// #2 trigger tightening: a document is only held to the full protected-files list when it
// CLAIMS to enumerate one. Mere mentions of the protection flow (e.g. "this change follows
// the governance-file-protection flow") are references, not lists. Detection of the claim:
// an explicit enumerating phrase (below/following/如下/如表 …) present alongside the
// protection-floor mention. The single-source-of-truth pointer already exempts deferrals.
const CLAIMS_PROTECTED_LIST = /(?:以下|下表|下面是|以下为|如下).{0,20}(?:清单|列表|文件)|(?:受保护|protected).{0,20}(?:清单|列表|list).{0,12}(?:如下|以下是|如下表|is|are|为)|(?:following|list(?:ed)? below|protected files? (?:include|are|listed)|清单如下|清单为|list is:)/i;

// #10 plan-status contract: frontmatter `status:` is authoritative ( / ).
// Legacy `> **Status:` lines remain a compatibility fallback inside scripts/lib/plan-status.js.
// Implementation EXTRACTED — do not re-inline the classifier here.

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
  const r = spawnSync("git", ["status", "--porcelain=v1", "-uall"], { cwd: ROOT, encoding: "utf8", timeout: 30000 });
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
  // A category existing is coverage; a category repeated is a broken record. The
  // v0.14.1 CHANGELOG carried three ### Fixed headings in one section after several
  // sessions each inserted their own block - the single-regex check above stayed green
  // because it only proves some category is present. A section that repeats the same
  // category heading more than once is reported, so the structure is verifiable too.
  const CATEGORY_RE = /^###\s+(Added|Changed|Fixed|Removed|Security|Deprecated)\s*$/gim;
  const seen = new Map();
  for (const m of sec.matchAll(CATEGORY_RE)) {
    seen.set(m[1], (seen.get(m[1]) || 0) + 1);
  }
  const duplicateCategories = [...seen].filter(([, n]) => n > 1).map(([name]) => name);
  // Unified section format (lifecycle.policy.md § CHANGELOG 结构契约 格式统一): the
  // version heading must be followed by a blank line, every category heading must have a
  // blank line before AND after it, and list items under a category must be separated by
  // blank lines. The v1.0.x audit found 32 version sections mixing two styles (compact
  // `##`→`###`→item vs spaced) — the section scanner sees only the newest section, so
  // the format is enforced on the section being edited, not on history.
  const secLines = sec.split(/\r?\n/);
  const formatIssues = [];
  for (let i = 0; i < secLines.length; i++) {
    const line = secLines[i];
    const isVersionHead = /^##\s+\[[^\]]+\]/.test(line);
    const isCatHead = /^###\s+/.test(line);
    const isItem = /^-\s+/.test(line);
    const prev = secLines[i - 1];
    const next = secLines[i + 1];
    if (isVersionHead && next !== undefined && next !== "") {
      formatIssues.push(`version heading not followed by a blank line (line ${i + 1})`);
    }
    if (isCatHead && (prev === undefined || prev !== "")) {
      formatIssues.push(`category heading "${line}" not preceded by a blank line (line ${i + 1})`);
    }
    if (isCatHead && (next === undefined || next !== "")) {
      formatIssues.push(`category heading "${line}" not followed by a blank line (line ${i + 1})`);
    }
    if (isItem && prev !== undefined && prev !== "" && /^-\s+/.test(prev)) {
      formatIssues.push(`list items not separated by a blank line (lines ${i} and ${i + 1})`);
    }
  }
  // Empty-section diagnosis: at release time an [Unreleased] section with no category is
  // almost always the "rebuilt the empty section too early" mistake (v0.15.0 and v1.0.1
  // both hit it). Surface a hint so the operator rebuilds after the gate, not before.
  const emptyUnreleased = /^##\s+\[Unreleased\]/m.test(head) && !/###\s+/.test(sec);
  const ok = /###\s+(?:Added|Changed|Fixed|Removed|Security|Deprecated)/i.test(sec) && duplicateCategories.length === 0 && formatIssues.length === 0;
  return { applicable: true, duplicateCategories, formatIssues, emptyUnreleased, ok };
}

function mdFiles() {
  const out = [];
  const top = ["README.md", "CONTRIBUTING.md", "SKILL.md", "AGENTS.md"];
  for (const f of top) if (fs.existsSync(path.join(ROOT, f))) out.push(f);
  if (fs.existsSync(DOCS)) {
    for (const lang of ["en", "zh-CN", "zh-TW"]) {
      // Prefer product trees (this skill repo); also scan legacy docs/{lang}/ for governed /
      // fixture shapes. Stage 4: product migration left mdFiles blind.
      const productDir = path.join(DOCS, "product", lang);
      if (fs.existsSync(productDir)) {
        for (const rel of walk(productDir)) out.push((path.join("docs", "product", lang, rel)).replace(/\\/g, "/"));
      }
      const dir = path.join(DOCS, lang);
      if (fs.existsSync(dir)) for (const rel of walk(dir)) out.push((path.join("docs", lang, rel)).replace(/\\/g, "/"));
    }
    for (const rel of walk(DOCS)) {
      const normalized = rel.replace(/\\/g, "/");
      if (normalized.startsWith("design-decisions/") || normalized.startsWith("archive/") || normalized.startsWith("plans/")) {
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

module.exports = {
  fs,
  path,
  spawnSync,
  createMdLinkFacts,
  evaluateBrokenLinks,
  classifyPlanStatus,
  isPlanMarkdown,
  evaluateAdrUnreleasedClaims,
  ROOT,
  DOCS,
  CONSENT_SYNC_GROUPS,
  CONSENT_MARKERS,
  consentBasename,
  CLAIMS_PROTECTED_LIST,
  walk,
  readFile,
  currentVersion,
  changedPaths,
  changelogCoverage,
  mdFiles,
};
