#!/usr/bin/env node
/**
 * Must-ship carrier presence (Phase 8 / PLAN-0044 / ADR-0024).
 * Fail-closed: required INSTALLED / skill-entry carriers must exist on disk.
 * Does not prove clean-target execution (that is 2.0 skill-release).
 */
"use strict";

const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "..");

const REQUIRED_FILES = [
  "scripts/check-secrets.js",
  "scripts/check-git-policy.js",
  "scripts/generate-governance.js",
  "scripts/verify_governance.js",
  "references/policies/git.policy.md",
  "references/workflows/release.md",
  "references/instruction/sub-skills.md",
  "references/init-spec.json",
  "references/capabilities/enforcement.v0.json",
  "SKILL.md",
  "repo-tools/package-skill.sh",
  "repo-workflows/skill-release.md",
];

const REQUIRED_SUBSKILLS = [
  "repository-inspection",
  "ci-generator",
  "governance-validator",
  "state-manager",
  "drift-check",
  "release-manager",
  "plan-manager",
  "review-manager",
];

// Mode names only — no slogan / section-title shape theater (薄入口, AUDIT（巡检）, ADR IDs).
const REQUIRED_SKILL_MARKERS = [/INIT/, /AUDIT/, /RELEASE/];

function fail(msg) {
  console.error(`must-ship-carriers: ${msg}`);
  process.exit(1);
}

for (const rel of REQUIRED_FILES) {
  const abs = path.join(ROOT, rel);
  if (!fs.existsSync(abs)) fail(`missing required carrier: ${rel}`);
}

const skill = fs.readFileSync(path.join(ROOT, "SKILL.md"), "utf8");
for (const re of REQUIRED_SKILL_MARKERS) {
  if (!re.test(skill)) fail(`SKILL.md missing required marker: ${re}`);
}

const subSkills = fs.readFileSync(
  path.join(ROOT, "references/instruction/sub-skills.md"),
  "utf8"
);
for (const name of REQUIRED_SUBSKILLS) {
  if (!new RegExp(`^name:\\s*${name}\\s*$`, "m").test(subSkills)) {
    fail(`sub-skills.md missing leaf: ${name}`);
  }
}

const instructionDir = path.join(ROOT, "references", "instruction");
const instructionFiles = fs.readdirSync(instructionDir).filter((n) => !n.startsWith("."));
const allowedInstruction = new Set(["agents-md.template.md", "sub-skills.md"]);
for (const n of instructionFiles) {
  if (!allowedInstruction.has(n)) fail(`references/instruction/ extra file (boilerplate belongs in templates/): ${n}`);
}
for (const n of allowedInstruction) {
  if (!instructionFiles.includes(n)) fail(`references/instruction/ missing ${n}`);
}

console.log(
  `must-ship-carriers: ok (${REQUIRED_FILES.length} files, ${REQUIRED_SUBSKILLS.length} sub-skills)`
);
