// Stage 4E+/R10: doc-consistency gate cluster (EXTRACT from run.js).
// INSTALLED with siblings listed in references/init-spec.json — keep require graph closed.
"use strict";
function runBrokenLinks(ctx) {
  const {
    fs, path, spawnSync,
    createMdLinkFacts, evaluateBrokenLinks, classifyPlanStatus, isPlanMarkdown,
    ROOT, DOCS, CLAIMS_PROTECTED_LIST,
    walk, readFile, currentVersion, changedPaths, changelogCoverage, mdFiles,
    issues, gateIssues, anyGate, releaseGate, version, planStatuses,
  } = ctx;

  // ---- 4. link validity (CTRL-0006; semantic verdict; --gate/--release-gate fail-closed) ----
  {
    const linkEval = evaluateBrokenLinks({ root: ROOT, facts: createMdLinkFacts(ROOT) });
    for (const item of linkEval.evidence.broken_links) {
      issues.broken_links.push(item);
      if (anyGate) gateIssues.push({ kind: "broken_links", item });
    }
  }
}

module.exports = { runBrokenLinks };
