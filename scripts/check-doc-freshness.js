#!/usr/bin/env node
// PAYLOAD SCRIPT — copied into governed projects (references/init-spec.json).
// Thin compatibility wrapper for CTRL-0003 + CTRL-0004 (Phase 4 strangler).
// External CLI unchanged: node scripts/check-doc-freshness.js [--json] [--release-gate]
// Relative requires must close under INSTALLED copy list (see payload self-containment).
//
// Exit code: 0 in default advisory mode. With --release-gate, stale/draft TRANSLATIONS
// exit 1 (CTRL-0004 deny). CTRL-0003 never blocks by itself.

"use strict";

const fs = require("fs");
const path = require("path");
const { createGitFacts } = require("./lib/git-facts.js");
const { evaluateDocFreshness } = require("./evaluators/ctrl-0003-doc-freshness.js");
const { evaluateTranslationFreshness } = require("./evaluators/ctrl-0004-translation-freshness.js");

const ROOT = process.cwd();

function main() {
  const json = process.argv.includes("--json");
  const releaseGate = process.argv.includes("--release-gate");
  const facts = createGitFacts(ROOT);

  const doc = evaluateDocFreshness({ root: ROOT, facts });
  const tr = evaluateTranslationFreshness({ root: ROOT, facts, releaseGate });

  const { stale, veryStale, fresh } = doc.evidence;
  const { translations, staleTranslations, draftTranslations } = tr.evidence;

  const report = {
    timestamp: new Date().toISOString(),
    stale,
    veryStale,
    fresh,
    translations,
    staleTranslations: staleTranslations.length,
    draftTranslations: draftTranslations.length,
    controls: {
      "CTRL-0003": { verdict: doc.verdict, decision_effect: doc.decision_effect },
      "CTRL-0004": { verdict: tr.verdict, decision_effect: tr.decision_effect, applicable: tr.applicable },
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

  const blocking = releaseGate && staleTranslations.length + draftTranslations.length > 0;
  process.exit(blocking ? 1 : 0);
}

main();
