#!/usr/bin/env node
// REPO-ONLY — lives under repo-tools/; never ships in the skill tarball.
//
// Repo-profile CLI for doc/translation freshness (PLAN-0055 Stage 2 dogfood absorb).
// Shared evaluators remain under scripts/ (CTRL-0003 / CTRL-0004). The INSTALLED
// skill CLI is scripts/check-doc-freshness.js; this file is the repo entry.
//
// Usage: node repo-tools/check-doc-freshness.js [--json] [--release-gate]

"use strict";

const { main } = require("../scripts/check-doc-freshness.js");

main();
