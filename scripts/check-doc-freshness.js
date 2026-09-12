#!/usr/bin/env node
// PAYLOAD SCRIPT — copied into governed projects (references/init-spec.json).
// Thin compatibility wrapper for CTRL-0003 + CTRL-0004 (Phase 4 strangler).
// External CLI unchanged: node scripts/check-doc-freshness.js [--json] [--release-gate]
// Relative requires must close under INSTALLED copy list (see init-spec invariants).
//
// Evaluators return semantic verdict only. This wrapper applies profile × boundary
// bindings (ADR-0023): default → advisory; --release-gate + CTRL-0004 fail → deny.
// Exit code: 0 in default advisory mode. With --release-gate, stale/draft TRANSLATIONS
// exit 1. CTRL-0003 findings never flip the process exit code on this CLI.

"use strict";

const fs = require("fs");
const path = require("path");
const { createGitFacts } = require("./lib/git-facts.js");
const { evaluateDocFreshness } = require("./evaluators/ctrl-0003-doc-freshness.js");
const { evaluateTranslationFreshness } = require("./evaluators/ctrl-0004-translation-freshness.js");

const ROOT = process.cwd();

/** Legacy CLI bindings for this enforcement boundary (not Control intrinsics). */
function bindDecisionEffect(controlId, enforcementBoundary) {
  if (controlId === "CTRL-0004" && enforcementBoundary === "release-gate") return "deny";
  return "advisory";
}

function main() {
  const json = process.argv.includes("--json");
  const releaseGate = process.argv.includes("--release-gate");
  const boundary = releaseGate ? "release-gate" : "local-default";
  const facts = createGitFacts(ROOT);

  const doc = evaluateDocFreshness({ root: ROOT, facts });
  const tr = evaluateTranslationFreshness({ root: ROOT, facts });

  const { stale, veryStale, fresh } = doc.evidence;
  const { translations, staleTranslations, draftTranslations } = tr.evidence;

  const docEffect = bindDecisionEffect("CTRL-0003", boundary);
  const trEffect = bindDecisionEffect("CTRL-0004", boundary);

  const report = {
    timestamp: new Date().toISOString(),
    stale,
    veryStale,
    fresh,
    translations,
    staleTranslations: staleTranslations.length,
    draftTranslations: draftTranslations.length,
    controls: {
      "CTRL-0003": {
        verdict: doc.verdict,
        applicable: doc.applicable,
        decision_effect: docEffect,
      },
      "CTRL-0004": {
        verdict: tr.verdict,
        applicable: tr.applicable,
        decision_effect: trEffect,
      },
    },
  };

  const driftPath = path.join(ROOT, ".governance", "drift-report.json");
  try {
    const drift = JSON.parse(fs.readFileSync(driftPath, "utf8"));
    drift.freshness = { stale, veryStale, checkedAt: report.timestamp };
    drift.translationFreshness = {
      stale: staleTranslations,
      draft: draftTranslations,
      checkedAt: report.timestamp,
    };
    fs.writeFileSync(driftPath, JSON.stringify(drift, null, 2) + "\n");
  } catch (e) {
    if (process.env.DEBUG) console.error(`[DEBUG] drift-report.json not updated: ${e.message}`);
  }

  if (json) {
    process.stdout.write(JSON.stringify(report, null, 2) + "\n");
  } else {
    for (const d of veryStale) console.log(`⚠️  very stale (${d})`);
    for (const d of stale) console.log(`⚠️  stale (${d})`);
    if (stale.length + veryStale.length === 0) console.log("✓ no stale governance docs");
    for (const t of staleTranslations) console.log(`⚠️  stale translation: ${t.translation} (${t.why})`);
    for (const t of draftTranslations) console.log(`⚠️  draft translation: ${t.translation} (${t.why})`);
    if (translations.length > 0 && staleTranslations.length + draftTranslations.length === 0) {
      console.log(`✓ translations current (${translations.length} pairs)`);
    }
  }

  // Binding: only CTRL-0004 × release-gate × fail → process deny.
  const blocking = trEffect === "deny" && tr.verdict === "fail";
  process.exit(blocking ? 1 : 0);
}

main();
