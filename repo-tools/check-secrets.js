#!/usr/bin/env node
// REPO-ONLY — lives under repo-tools/; never ships in the skill tarball.
//
// Repo-profile CLI binding for CTRL-0001 Secret protection (PLAN-0035 P3 /
// ADR-0020 Producer/Product execution separation). Shared semantics and scan
// facts live under scripts/ (skill INSTALLED + shared mechanical specimen);
// THIS file is the repo enforcement entry so contributors do not invoke the
// skill working-tree CLI as the repo gate by accident.
//
// Usage: node repo-tools/check-secrets.js [--json]
// Exit 0 clean · Exit 1 on hits / unscanned / git error (never prints secrets).

"use strict";

const path = require("path");
const { evaluateSecretProtection } = require(path.join(
  __dirname,
  "..",
  "scripts",
  "evaluators",
  "ctrl-0001-secret-protection.js"
));

function printHelp() {
  console.log(`Usage:
  repo-tools/check-secrets.js [--json]   Repo-profile CTRL-0001 secret scan (read-only)
Exit codes: 0 clean · 1 hits (reports file:line + pattern class, never the secret)`);
}

function runCli(evaluation) {
  const json = process.argv.includes("--json");
  const { hits, unscanned, error } = evaluation.evidence;

  if (error) {
    console.error(`check-secrets: ${error}`);
    process.exit(1);
  }

  if (json) {
    const clean = hits.length === 0 && unscanned.length === 0;
    process.stdout.write(JSON.stringify({ clean, hits, unscanned }, null, 2) + "\n");
    process.exit(clean ? 0 : 1);
  }

  if (hits.length > 0) {
    console.error("check-secrets: BLOCKED — staged diff contains secret-like material:");
    for (const h of hits) {
      console.error(`  ${h.file}:${h.line}  [${h.pattern}]`);
    }
    console.error("Remove the material from the staged diff before committing.");
    process.exit(1);
  }
  if (unscanned.length > 0) {
    console.error("check-secrets: BLOCKED — content could not be inspected:");
    for (const f of unscanned) console.error(`    ${f}`);
    console.error("Unreadable staged content is not proof of cleanliness. Remove it from the");
    console.error("staged set, or inspect it manually and stage it in a form the gate can read.");
    process.exit(1);
  }
  console.log("check-secrets: clean");
  process.exit(0);
}

if (process.argv.includes("--help") || process.argv.includes("-h")) {
  printHelp();
  process.exit(0);
}

runCli(evaluateSecretProtection({ root: process.cwd() }));
