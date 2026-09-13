#!/usr/bin/env node
// INIT Scripted Generator — thin CLI (PLAN-0055 Stage 3 EXTRACT).
// External CLI unchanged. Implementation: scripts/lib/generate/run.js
// Gen1 monolith quarantine: tests/archive/gen1-script-impl/generate-governance.monolith.js

"use strict";

const { main } = require("./lib/generate/run.js");

if (require.main === module) {
  main();
}

module.exports = { main };
