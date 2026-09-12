#!/usr/bin/env node
// INSTALLED evaluator — CTRL-0001 Secret protection.
// Semantic evaluation only: staged secret-like material / unscanned blobs → verdict fail.
// Pattern/scan facts live in secret-scan-facts; deny/exit is NOT decided here.
// Node builtins + relative require of INSTALLED siblings only.

"use strict";

const { createSecretScanFacts } = require("../lib/secret-scan-facts.js");

const CONTROL_ID = "CTRL-0001";

/**
 * @returns {{
 *   control: string,
 *   applicable: boolean,
 *   verdict: "pass"|"fail"|"indeterminate",
 *   evidence: { hits: Array, unscanned: string[], error?: string }
 * }}
 */
function evaluateSecretProtection(options) {
  const root = (options && options.root) || process.cwd();
  const facts = (options && options.facts) || createSecretScanFacts(root);
  const scanned = facts.scanStaged();

  if (scanned.error) {
    return {
      control: CONTROL_ID,
      applicable: true,
      verdict: "fail",
      evidence: { hits: [], unscanned: [], error: scanned.error },
    };
  }

  const violated = scanned.hits.length > 0 || scanned.unscanned.length > 0;
  return {
    control: CONTROL_ID,
    applicable: true,
    verdict: violated ? "fail" : "pass",
    evidence: { hits: scanned.hits, unscanned: scanned.unscanned },
  };
}

module.exports = {
  CONTROL_ID,
  evaluateSecretProtection,
};
