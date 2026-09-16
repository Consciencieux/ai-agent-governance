// Stage 4E+/R10: doc-consistency gate cluster (EXTRACT from run.js).
// INSTALLED with siblings listed in references/init-spec.json — keep require graph closed.
"use strict";
function runChangelogCoverage(ctx) {
  const {
    fs, path, spawnSync,
    createMdLinkFacts, evaluateBrokenLinks, classifyPlanStatus, isPlanMarkdown,
    ROOT, DOCS, CLAIMS_PROTECTED_LIST,
    walk, readFile, currentVersion, changedPaths, changelogCoverage, mdFiles,
    issues, gateIssues, anyGate, releaseGate, version, planStatuses,
  } = ctx;

  // ---- 11. CHANGELOG coverage ----
  const changelog = changelogCoverage(releaseGate);
  if (changelog.applicable && !changelog.ok) {
    const dup = (changelog.duplicateCategories || []).length > 0
      ? " (duplicate category heading(s): " + (changelog.duplicateCategories || []).join(", ") + ")"
      : "";
    const fmt = (changelog.formatIssues || []).length > 0
      ? " (format: " + changelog.formatIssues.join("; ") + ")"
      : "";
    const emptyHint = changelog.emptyUnreleased
      ? " — the [Unreleased] section is empty: if this is a release, the empty section was likely rebuilt too early (rebuild it AFTER the release gates pass, per skill-release.md step 2)"
      : "";
    const item = "governance/payload changes require CHANGELOG.md change entries with a category (an [Unreleased] section daily; the topmost versioned section at release)" + dup + fmt + emptyHint;
    issues.changelog_coverage.push(item);
    // Structure defects fail CLOSED in both modes; "no record yet" only blocks at release.
    // emptyUnreleased is the exception: a freshly rebuilt empty [Unreleased] is the NORMAL
    // post-release state, so it only blocks at release (when the empty section means the
    // rebuild happened too early), never in daily --gate mode.
    if (releaseGate || (changelog.duplicateCategories || []).length > 0 || (changelog.formatIssues || []).length > 0 || (releaseGate && changelog.emptyUnreleased)) gateIssues.push({ kind: "changelog_coverage", item });
  }

}

module.exports = { runChangelogCoverage };
