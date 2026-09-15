// Stage 4E+/R10: doc-consistency gate cluster (EXTRACT from run.js).
// INSTALLED with siblings listed in references/init-spec.json — keep require graph closed.
"use strict";
function runAdrStatus(ctx) {
  const {
    fs, path, spawnSync,
    createMdLinkFacts, evaluateBrokenLinks, classifyPlanStatus, isPlanMarkdown, evaluateAdrUnreleasedClaims,
    ROOT, DOCS, CONSENT_SYNC_GROUPS, CONSENT_MARKERS, consentBasename, CLAIMS_PROTECTED_LIST,
    walk, readFile, currentVersion, changedPaths, changelogCoverage, mdFiles,
    issues, gateIssues, anyGate, releaseGate, version, planStatuses,
  } = ctx;

  // ---- 3. ADR status sync ( / : Status *fields* only) ----
  const changelogText = readFile(path.join(ROOT, "CHANGELOG.md")) || "";
  const releasedVersions = [...changelogText.matchAll(/^## \[(\d+\.\d+\.\d+)\]/gm)].map((m) => m[1]);
  const adrDir = path.join(DOCS, "design-decisions");
  if (fs.existsSync(adrDir)) {
    const adrBodies = [];
    for (const f of walk(adrDir)) {
      if (!/^ADR-\d+/i.test(f.split("/").pop() || "")) continue;
      const c = readFile(path.join(adrDir, f));
      if (!c) continue;
      adrBodies.push({ path: f, content: c });
    }
    for (const item of evaluateAdrUnreleasedClaims({ adrBodies, releasedVersions })) {
      issues.adr_statuses.push(item);
    }
  }

}

module.exports = { runAdrStatus };
