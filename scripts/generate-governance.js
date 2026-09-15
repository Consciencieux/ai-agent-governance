#!/usr/bin/env node
// INIT Scripted Generator — thin CLI ( Stage 3 EXTRACT).
// External CLI unchanged. Implementation: scripts/lib/generate/run.js
// Gen1 monolith discarded : rewrite from current obligations; do not resurrect accretion.

"use strict";

const { main } = require("./lib/generate/run.js");

if (require.main === module) {
  main();
}

module.exports = { main };
