#!/usr/bin/env node
// REPO-ONLY — lives under repo-tools/; never ships in the skill tarball.
//
// Repo-profile CLI for doc-consistency gates (PLAN-0055 Stage 2 dogfood absorb).
// Shared gate implementation remains under scripts/check-doc-consistency.js
// (INSTALLED skill CLI for governed projects). This file is the repo enforcement
// entry so contributors do not invoke the skill working-tree CLI as the repo gate.
//
// Also runs REPO-ONLY CHANGELOG narration fail-closed under --gate/--release-gate
// (FINDING-0016); not part of the INSTALLED consistency clusters.
//
// Usage: node repo-tools/check-doc-consistency.js [--json] [--gate] [--release-gate]

"use strict";

const { main } = require("../scripts/check-doc-consistency.js");
const { checkChangelogNarration } = require("./check-changelog-narration.js");

function runRepoExtras() {
  const gate = process.argv.includes("--gate") || process.argv.includes("--release-gate");
  const json = process.argv.includes("--json");
  if (!gate) return 0;
  const result = checkChangelogNarration({ root: process.cwd() });
  if (result.ok) return 0;
  if (json) {
    // Consistency JSON already printed by main; emit a stderr cue for narration.
    console.error(
      JSON.stringify({ check: "changelog_narration", ok: false, findings: result.findings }, null, 2)
    );
  } else {
    console.error("✗ changelog_narration (Unreleased verification markers):");
    for (const f of result.findings) {
      console.error("  - " + f.entry + " [" + f.flags.join(", ") + "]");
    }
  }
  return 1;
}

// Run shared clusters first (they process.exit). Monkey-patch exit to chain narration.
const origExit = process.exit;
let exitCode = 0;
process.exit = (code) => {
  exitCode = typeof code === "number" ? code : 0;
  throw new Error("__DOC_CONSISTENCY_EXIT__");
};
try {
  main();
  exitCode = 0;
} catch (e) {
  if (!e || e.message !== "__DOC_CONSISTENCY_EXIT__") throw e;
} finally {
  process.exit = origExit;
}
const narrCode = runRepoExtras();
origExit(exitCode || narrCode);
