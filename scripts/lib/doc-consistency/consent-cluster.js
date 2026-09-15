// Stage 4E+/R10: doc-consistency gate cluster (EXTRACT from run.js).
// INSTALLED with siblings listed in references/init-spec.json — keep require graph closed.
"use strict";
function runConsentCluster(ctx) {
  const {
    fs, path, spawnSync,
    createMdLinkFacts, evaluateBrokenLinks, classifyPlanStatus, isPlanMarkdown, evaluateAdrUnreleasedClaims,
    ROOT, DOCS, CONSENT_SYNC_GROUPS, CONSENT_MARKERS, consentBasename, CLAIMS_PROTECTED_LIST,
    walk, readFile, currentVersion, changedPaths, changelogCoverage, mdFiles,
    issues, gateIssues, anyGate, releaseGate, version, planStatuses,
  } = ctx;

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

}

module.exports = { runConsentCluster };
