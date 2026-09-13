#!/usr/bin/env node
// PAYLOAD SCRIPT — copied into governed projects (references/init-spec.json).
// Thin CLI WRAP for doc-consistency (PLAN-0055 Stage 3 EXTRACT).
// External CLI unchanged: node scripts/check-doc-consistency.js [--json] [--gate] [--release-gate]
// Implementation: scripts/lib/doc-consistency/run.js
// Gen1 monolith discarded (PLAN-0055): rewrite from current obligations; do not resurrect accretion.

"use strict";

const { main } = require("./lib/doc-consistency/run.js");

if (require.main === module) {
  main();
}

module.exports = { main };
