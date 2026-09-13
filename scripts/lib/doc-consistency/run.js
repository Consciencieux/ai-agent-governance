// PLAN-0055 Stage 4E+/R10: thin orchestrator — gate bodies live in sibling modules.
// INSTALLED via init-spec; thin CLI: scripts/check-doc-consistency.js
// Gen1 monolith discarded; cluster files are the extension points (not this shell).
"use strict";

const shared = require("./shared.js");
const { runChangelogCoverage } = require("./changelog-coverage.js");
const { runVersionExamples } = require("./version-examples.js");
const { runProtectedFiles } = require("./protected-files.js");
const { runConsentCluster } = require("./consent-cluster.js");
const { runPrinciplesIndex } = require("./principles-index.js");
const { runPlanStatus } = require("./plan-status.js");
const { runAdrStatus } = require("./adr-status.js");
const { runBrokenLinks } = require("./broken-links.js");
const { runNumericClaims } = require("./numeric-claims.js");
const { runPromptSync } = require("./prompt-sync.js");

function main() {
  const json = process.argv.includes("--json");
  const gate = process.argv.includes("--gate");
  const releaseGate = process.argv.includes("--release-gate");
  const anyGate = gate || releaseGate;
  const issues = {
    version_examples: [], protected_lists: [], adr_statuses: [], broken_links: [],
    numeric_claims: [], prompt_sync: [], plans_status_unknown: [], plans_pending_archive: [],
    changelog_coverage: [],
  };
  const gateIssues = [];
  const version = shared.currentVersion();
  const planStatuses = [];

  const ctx = {
    ...shared,
    issues,
    gateIssues,
    anyGate,
    releaseGate,
    version,
    planStatuses,
  };

  runChangelogCoverage(ctx);
  runVersionExamples(ctx);
  runProtectedFiles(ctx);
  runConsentCluster(ctx);
  runPrinciplesIndex(ctx);
  runPlanStatus(ctx);
  runAdrStatus(ctx);
  runBrokenLinks(ctx);
  runNumericClaims(ctx);
  runPromptSync(ctx);

  // ---- 7. trilingual tree parity (delegated) ----
  const parityPass = "delegated";

  const pendingArchive = planStatuses.filter((p) => p.status === "implemented" || p.status === "completed").length;
  const EVIDENCE = {
    version_examples: "mechanical", protected_lists: "mechanical", adr_statuses: "mechanical",
    broken_links: "mechanical", numeric_claims: "mechanical", prompt_sync: "mechanical",
    changelog_coverage: "mechanical",
    plans_status_unknown: "mechanical", plans_pending_archive: "mechanical",
  };
  const report = {
    timestamp: new Date().toISOString(), version, issues, evidence: EVIDENCE, parity: parityPass,
    gate: anyGate, releaseGate, gatePass: gateIssues.length === 0, gateIssues, planStatuses, pendingArchive,
  };

  try {
    const driftPath = require("path").join(shared.ROOT, ".governance", "drift-report.json");
    const rawDrift = shared.readFile(driftPath);
    if (rawDrift) {
      const drift = JSON.parse(rawDrift);
      drift.consistency = issues;
      drift.consistencyGate = { gate: anyGate, releaseGate, pass: gateIssues.length === 0, issues: gateIssues };
      drift.planStatuses = planStatuses;
      shared.fs.writeFileSync(driftPath, JSON.stringify(drift, null, 2) + "\n");
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
  process.exit(anyGate && gateIssues.length > 0 ? 1 : 0);
}

if (require.main === module) {
  main();
}

module.exports = { main };
