// PLAN-0055 Stage 4E+/R10: doc-consistency gate cluster (EXTRACT from run.js).
// INSTALLED with siblings listed in references/init-spec.json — keep require graph closed.
"use strict";
function runNumericClaims(ctx) {
  const {
    fs, path, spawnSync,
    createMdLinkFacts, evaluateBrokenLinks, classifyPlanStatus, isPlanMarkdown, evaluateAdrUnreleasedClaims,
    ROOT, DOCS, CONSENT_SYNC_GROUPS, CONSENT_MARKERS, consentBasename, CLAIMS_PROTECTED_LIST,
    walk, readFile, currentVersion, changedPaths, changelogCoverage, mdFiles,
    issues, gateIssues, anyGate, releaseGate, version, planStatuses,
  } = ctx;

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

}

module.exports = { runNumericClaims };
