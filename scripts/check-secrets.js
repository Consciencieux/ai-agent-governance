#!/usr/bin/env node
// PAYLOAD SCRIPT — copied into governed projects (references/init-spec.json).
// Thin skill-profile CLI wrapper for CTRL-0001 (Phase 4 P3 strangler).
// External CLI unchanged: node scripts/check-secrets.js [--json]
// Relative requires must close under INSTALLED copy list (init-spec invariants).
//
// Evaluator returns semantic verdict only. This wrapper applies skill binding:
// local / pre-commit → deny (exit 1); never print secret values.

"use strict";

const { evaluateSecretProtection } = require("./evaluators/ctrl-0001-secret-protection.js");

function printHelp() {
  console.log(`Usage:
  check-secrets.js [--json]   Scan the staged diff for secret-like material (read-only)
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
