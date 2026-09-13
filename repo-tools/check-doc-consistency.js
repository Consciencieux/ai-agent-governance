#!/usr/bin/env node
// REPO-ONLY — lives under repo-tools/; never ships in the skill tarball.
//
// Repo-profile CLI for doc-consistency gates (PLAN-0055 Stage 2 dogfood absorb).
// Shared gate implementation remains under scripts/check-doc-consistency.js
// (INSTALLED skill CLI for governed projects). This file is the repo enforcement
// entry so contributors do not invoke the skill working-tree CLI as the repo gate.
//
// Usage: node repo-tools/check-doc-consistency.js [--json] [--gate] [--release-gate]

"use strict";

const { main } = require("../scripts/check-doc-consistency.js");

main();
