#!/usr/bin/env node
// PAYLOAD SCRIPT — CTRL-0002 thin CLI. Classifies proposed git argv; never runs git.
// Usage:
//   node scripts/check-git-consent.js -- git status
//   node scripts/check-git-consent.js --json -- git commit -m "x"
// Exit: 0 allow · 2 require_consent · 1 deny/error

"use strict";

const { evaluateGitWriteConsent } = require("./evaluators/ctrl-0002-git-write-consent.js");

function printHelp() {
  console.log(`Usage:
  check-git-consent.js [--json] -- <git argv...>
Exit: 0 allow · 2 require_consent · 1 deny/error
Does not execute git; classifies against git.policy consent classes.`);
}

const dash = process.argv.indexOf("--");
if (process.argv.includes("--help") || process.argv.includes("-h")) {
  printHelp();
  process.exit(0);
}
if (dash < 0) {
  printHelp();
  process.exit(1);
}

const argv = process.argv.slice(dash + 1);
const result = evaluateGitWriteConsent({ argv });
const json = process.argv.includes("--json");

if (json) {
  process.stdout.write(JSON.stringify(result, null, 2) + "\n");
} else {
  const seq = (result.evidence && result.evidence.sequences) || [];
  console.log(`check-git-consent: ${result.decision_effect} (${result.verdict})`);
  for (const s of seq) {
    console.log(`  ${s.args.join(" ")} → ${s.class} — ${s.reason}`);
  }
}

if (result.decision_effect === "allow") process.exit(0);
if (result.decision_effect === "require_consent") process.exit(2);
process.exit(1);
