#!/usr/bin/env node
// INSTALLED evaluator — CTRL-0003 Governance-document freshness (relative to code activity).
// Policy thresholds live HERE, not in git-facts primitives.
// Node builtins + relative require of INSTALLED siblings only.

"use strict";

const fs = require("fs");
const path = require("path");
const { createGitFacts } = require("../lib/git-facts.js");

const CONTROL_ID = "CTRL-0003";
const CODE_DIRS = ["src", "app", "packages", "lib", "core"];
const STALE_DAYS = 30;
const VERY_STALE_DAYS = 90;

function docCandidates(root) {
  const docs = [
    "docs/ARCHITECTURE.md",
    "CHANGELOG.md",
    "docs/features",
    "docs/plans",
    "docs/rules",
    "README.md",
  ];
  try {
    const m = JSON.parse(fs.readFileSync(path.join(root, ".governance", "manifest.json"), "utf8"));
    const dr = typeof m.doc_root === "string" ? m.doc_root.trim().replace(/[\\/]+$/, "") : "";
    const driveRelative = /^[A-Za-z]:/.test(dr);
    if (dr && dr !== "docs" && !path.isAbsolute(dr) && !driveRelative && !dr.split(/[\\/]/).includes("..")) {
      return docs.map((d) => d.replace(/^docs\//, dr + "/"));
    }
  } catch (e) {
    if (process.env.DEBUG) console.error(`[DEBUG] manifest unreadable: ${e.message}`);
  }
  return docs;
}

/**
 * @returns {{
 *   control: string,
 *   applicable: boolean,
 *   verdict: "pass"|"fail"|"indeterminate",
 *   decision_effect: "advisory",
 *   evidence: { stale: string[], veryStale: string[], fresh: string[] }
 * }}
 */
function evaluateDocFreshness(options) {
  const root = (options && options.root) || process.cwd();
  const facts = (options && options.facts) || createGitFacts(root);
  const stale = [];
  const veryStale = [];
  const fresh = [];

  for (const doc of docCandidates(root)) {
    if (!facts.exists(doc)) continue;
    const days = facts.lastCommitDaysAgo(doc);
    if (days === null) continue;
    if (facts.codeActiveSince(days, CODE_DIRS)) {
      if (days >= VERY_STALE_DAYS) veryStale.push(doc);
      else if (days >= STALE_DAYS) stale.push(doc);
      else fresh.push(doc);
    } else {
      fresh.push(doc);
    }
  }

  // CTRL-0003 default binding is advisory: findings never flip verdict to fail.
  return {
    control: CONTROL_ID,
    applicable: true,
    verdict: "pass",
    decision_effect: "advisory",
    evidence: { stale, veryStale, fresh },
  };
}

module.exports = {
  CONTROL_ID,
  STALE_DAYS,
  VERY_STALE_DAYS,
  CODE_DIRS,
  docCandidates,
  evaluateDocFreshness,
};
