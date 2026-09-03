#!/usr/bin/env node
// PAYLOAD SCRIPT — copied standalone into governed projects (references/init-spec.json).
// Keep it self-contained: Node builtins only, never require() a sibling module.
// Doc Consistency Check — read-only. Detects cross-document contradictions:
//   1. version-example sync   — examples of governance_version/manifest values vs current
//   2. protected-files sync   — summary lists vs the single source of truth
//   3. ADR status sync        — "Accepted (Unreleased)" ADRs whose feature already shipped
//   4. link validity          — relative markdown links must resolve
//   5. numeric claims         — documented counts (sub-skills, validator checks, tests)
//   6. prompt sync            - sub-skill triggers must appear in all three commands.md
//   7. trilingual tree parity — delegated to scripts/check-doc-parity.js
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
//
// Modes: default = advisory, ALWAYS exit 0 (heuristics, not a gate).
//        --gate  = fail-closed on the mechanically checkable clusters ONLY (#2, #8 and
//                  #10's unknown status); the other heuristics still report
//                  but never affect the exit code.
//        --release-gate = --gate plus #10's pending-archive and #11's changelog clusters.
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

function changelogCoverage() {
  const paths = changedPaths();
  if (!paths || paths.length === 0) return { applicable: false, ok: true };
  const governedChange = paths.some((p) => p === "SKILL.md" || p === "AGENTS.md" || p === "CHANGELOG.md" || p === "package.json" || p.startsWith("references/") || p.startsWith("scripts/") || p.startsWith(".github/"));
  if (!governedChange) return { applicable: false, ok: true };
  const c = readFile(path.join(ROOT, "CHANGELOG.md")) || "";
  return { applicable: true, ok: /##\s+\[Unreleased\]/i.test(c) && /###\s+(?:Added|Changed|Fixed|Removed|Security|Deprecated)/i.test(c) };
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
  return out;
}

function main() {
  const json = process.argv.includes("--json");
  const gate = process.argv.includes("--gate");
  const releaseGate = process.argv.includes("--release-gate"); // implies gate behavior + pending-archive
  const anyGate = gate || releaseGate;
  const issues = { version_examples: [], protected_lists: [], adr_statuses: [], broken_links: [], numeric_claims: [], prompt_sync: [], plans_status_unknown: [], plans_pending_archive: [], changelog_coverage: [] };
  const gateIssues = [];
  const version = currentVersion();

  // ---- 11. CHANGELOG coverage ----
  const changelog = changelogCoverage();
  if (changelog.applicable && !changelog.ok) {
    const item = "governance/payload changes require CHANGELOG.md with an [Unreleased] entry and a change category";
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
    }
  }

  // ---- 2. protected-files sync ----
  // Single source of truth: references/policies/governance-files.policy.md table.
  const policy = readFile(path.join(ROOT, "references", "policies", "governance-files.policy.md")) || "";
  const protectedPaths = [];
  const tableRe = /^\|\s*`([^`]+)`\s*\|/gm;
  let tm;
  while ((tm = tableRe.exec(policy))) {
    const p = tm[1].replace(/\*\*/g, "").split("/")[0];
    if (p === "AGENTS.md" || p === "CLAUDE.md" || p.startsWith("docs") || p.startsWith(".governance") || p.startsWith("scripts") || p === "opencode.json" || p.startsWith(".github")) {
      protectedPaths.push(tm[1]);
    }
  }
  if (protectedPaths.length > 0) {
    const summaries = mdFiles().filter((f) => f !== "CHANGELOG.md" && !f.startsWith("docs/archive/"));
    for (const f of summaries) {
      const c = readFile(path.join(ROOT, f));
      if (!c) continue;
      if (f.includes("governance-files.policy.md") || f.includes("adr-000")) continue;
      const mentionsFlow = /治理文件保护|Governance File Protection|Governance file protection/i.test(c);
      if (mentionsFlow) {
        // Trigger tightening (P1 precondition): only documents that CLAIM to enumerate
        // the list are held to its completeness — the flow mention and the enumeration
        // claim may appear in different places, so each is tested independently.
        const claimsEnum = CLAIMS_PROTECTED_LIST.test(c);
        if (!claimsEnum) continue;
        // Single-source-of-truth deferral is exempt BY DESIGN — but only when the
        // deferral phrase sits in the SAME section as the enumeration claim. A repo can
        // mention "single source of truth" elsewhere (e.g. the AGENTS.md principles index
        // table) without deferring this particular listing; an unrelated mention must not
        // disable the check (review: AGENTS.md was exempted by an index row while its
        // protection clause sat 10 lines away). Scope the exemption to the section that
        // actually carries the enumeration claim.
        const sections = c.split(/\n(?=## )/);
        const claimSection = sections.find((s) => CLAIMS_PROTECTED_LIST.test(s));
        if (claimSection && /单一事实源|single source of truth|完整清单见|完整清单以/i.test(claimSection)) continue;
        for (const p of protectedPaths) {
          if (!c.includes(p)) gateIssues.push({ kind: "protected_lists", item: `${f}: missing ${p}` });
        }
      }
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
  const agentsDoc = readFile(path.join(ROOT, "AGENTS.md"));
  if (agentsDoc && /Governance principles index/i.test(agentsDoc)) {
    const bt = String.fromCharCode(96);
    const fileRe = new RegExp(bt + "([^" + bt + "]+)" + bt, "g");
    for (const line of agentsDoc.split("\n")) {
      if (!line.startsWith("| ") || line.startsWith("| ---") || line.startsWith("| Principle")) continue;
      const cells = line.split("|").map((s) => s.trim());
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

  // ---- 6. prompt sync (sub-skill triggers must appear in commands.md) ----
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
      const cmd = readFile(path.join(DOCS, lang, "commands.md")) || "";
      if (!cmd) continue;
      for (const t of triggers) {
        if (!cmd.includes("`" + t + "`")) issues.prompt_sync.push(`${lang}/commands.md missing trigger \`${t}\``);
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
  const report = { timestamp: new Date().toISOString(), version, issues, parity: parityPass, gate: anyGate, releaseGate, gatePass: gateIssues.length === 0, gateIssues, planStatuses, pendingArchive };

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
