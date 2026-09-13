#!/usr/bin/env node
// INIT Scripted Generator — thin CLI (PLAN-0055 Stage 3 EXTRACT).
// External CLI unchanged. Implementation: scripts/lib/generate/run.js
// Gen1 monolith discarded (PLAN-0055): rewrite from current obligations; do not resurrect accretion.

"use strict";

const { main } = require("./lib/generate/run.js");

if (require.main === module) {
  main();
}

module.exports = { main };
