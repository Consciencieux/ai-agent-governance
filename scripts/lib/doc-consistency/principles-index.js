// Stage 4E+/R10: doc-consistency gate cluster (EXTRACT from run.js).
// INSTALLED with siblings listed in references/init-spec.json — keep require graph closed.
"use strict";
function runPrinciplesIndex(ctx) {
  const {
    fs, path, spawnSync,
    createMdLinkFacts, evaluateBrokenLinks, classifyPlanStatus, isPlanMarkdown,
    ROOT, DOCS, CLAIMS_PROTECTED_LIST,
    walk, readFile, currentVersion, changedPaths, changelogCoverage, mdFiles,
    issues, gateIssues, anyGate, releaseGate, version, planStatuses,
  } = ctx;

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

}

module.exports = { runPrinciplesIndex };
