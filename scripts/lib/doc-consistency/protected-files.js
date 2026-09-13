// PLAN-0055 Stage 4E+/R10: doc-consistency gate cluster (EXTRACT from run.js).
// INSTALLED with siblings listed in references/init-spec.json — keep require graph closed.
"use strict";
function runProtectedFiles(ctx) {
  const {
    fs, path, spawnSync,
    createMdLinkFacts, evaluateBrokenLinks, classifyPlanStatus, isPlanMarkdown, evaluateAdrUnreleasedClaims,
    ROOT, DOCS, CONSENT_SYNC_GROUPS, CONSENT_MARKERS, consentBasename, CLAIMS_PROTECTED_LIST,
    walk, readFile, currentVersion, changedPaths, changelogCoverage, mdFiles,
    issues, gateIssues, anyGate, releaseGate, version, planStatuses,
  } = ctx;

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
        // Scope to the ENUMERATION BLOCK, not the whole file. A path mentioned elsewhere
        // in the document — an operational sentence, a gate clause on a later line — must
        // not satisfy the completeness claim; deleting the enumeration entry while the
        // path remains in prose used to pass green (audit 2026-09-07).
        if (!claimSection.includes(p)) {
          const item = `${f}: missing ${p}`;
          issues.protected_lists.push(item);
          if (anyGate) gateIssues.push({ kind: "protected_lists", item });
        }
      }
      } // end claim-section loop
    }
  }

}

module.exports = { runProtectedFiles };
