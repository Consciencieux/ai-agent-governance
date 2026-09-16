// Stage 4E+/R10: doc-consistency gate cluster (EXTRACT from run.js).
// INSTALLED with siblings listed in references/init-spec.json — keep require graph closed.
"use strict";
function runPlanStatus(ctx) {
  const {
    fs, path, spawnSync,
    createMdLinkFacts, evaluateBrokenLinks, classifyPlanStatus, isPlanMarkdown,
    ROOT, DOCS, CLAIMS_PROTECTED_LIST,
    walk, readFile, currentVersion, changedPaths, changelogCoverage, mdFiles,
    issues, gateIssues, anyGate, releaseGate, version, planStatuses,
  } = ctx;

  // ---- 10. plan-status classification & pending archive ----
  // Scan the trilingual plans/ trees; no-op where they are absent (governed projects).
  // Unknown status is an always-on gate failure (one-line fix); pending-archive is
  // advisory outside --release-gate because the documented lifecycle lets a completed
  // plan legitimately wait in plans/ for the release commit that archives it.
  for (const lang of ["en", "zh-CN", "zh-TW"]) {
    const dir = path.join(DOCS, lang, "plans");
    if (!fs.existsSync(dir)) continue;
    for (const rel of walk(dir)) {
      if (!isPlanMarkdown(rel)) continue;
      if (/(?:^|\/)(?:archive|roadmap)\//i.test(rel)) continue;
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
  // Governed projects use a single docs/plans/ tree (no languages). The trilingual loop
  // above no-ops there, so pending-archive and unknown-status were silently unchecked —
  // an implemented plan left unsynced in a governed project sailed through --release-gate
  // (audit 2026-09-07). Scan the single tree too; a project that has both layouts gets
  // both scans, so no plan slips through.
  {
    const dir = path.join(ROOT, "docs", "plans");
    if (fs.existsSync(dir) && !fs.existsSync(path.join(DOCS, "en", "plans"))) {
      for (const rel of walk(dir)) {
        // A governed project's single docs/plans/ tree mixes the milestone index
        // (DEVELOPMENT_PLAN.md) with TASK_*.md plans. The index is not a plan: it has no
        // Status line by design, and treating it as one made --gate fail on a fresh INIT
        // (audit 2026-09-07).
        if (/(?:^|\/)DEVELOPMENT_PLAN\.md$/i.test(rel)) continue;
        if (!isPlanMarkdown(rel)) continue;
        if (/(?:^|\/)(?:archive|roadmap)\//i.test(rel)) continue;
        const planRel = (path.join("docs", "plans", rel)).replace(/\\/g, "/");
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
      if (!isPlanMarkdown(rel)) continue;
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
  }  // Governed projects archive to docs/plans/archive/ (single language), not the
  // trilingual docs/archive/. The scan above no-ops there, so an archived plan in a
  // governed project carrying "implemented" was never checked (audit 2026-09-07).
  {
    const govArchive = path.join(ROOT, "docs", "plans", "archive");
    if (fs.existsSync(govArchive) && !fs.existsSync(archiveDir)) {
      for (const rel of walk(govArchive)) {
        if (!isPlanMarkdown(rel)) continue;
        const planRel = path.join("docs", "plans", "archive", rel).replace(/\\/g, "/");
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
  }

}

module.exports = { runPlanStatus };
