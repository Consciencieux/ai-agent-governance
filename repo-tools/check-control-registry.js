#!/usr/bin/env node
// REPO-ONLY — machine-readable Control registry gate (PLAN-0049 / H2c).
// Fail-closed: required slots, unique identity, referenced paths exist when non-null.
// Schema authority remains ADR-0023; JSON files are projections, not a second semantics home.
"use strict";

const fs = require("fs");
const path = require("path");

const ROOT = process.cwd();
const CONTROLS_DIR = path.join(ROOT, "repo-tools", "controls");
const REQUIRED = ["identity", "semantics_ref", "applicability", "evaluation_bindings", "control_x"];

function listControlFiles() {
  if (!fs.existsSync(CONTROLS_DIR)) return [];
  return fs
    .readdirSync(CONTROLS_DIR)
    .filter((f) => /^CTRL-\d{4}\.json$/.test(f))
    .map((f) => path.join(CONTROLS_DIR, f));
}

function existsRepoPath(rel) {
  if (!rel || typeof rel !== "string") return false;
  if (rel.includes("..") || path.isAbsolute(rel)) return false;
  return fs.existsSync(path.join(ROOT, rel));
}

function validateControl(abs, issues) {
  const rel = path.relative(ROOT, abs).split(path.sep).join("/");
  let doc;
  try {
    doc = JSON.parse(fs.readFileSync(abs, "utf8"));
  } catch (e) {
    issues.push(`${rel}: invalid JSON (${e.message})`);
    return null;
  }
  for (const k of REQUIRED) {
    if (doc[k] == null) issues.push(`${rel}: missing required slot ${k}`);
  }
  const base = path.basename(abs, ".json");
  if (doc.identity && doc.identity !== base) {
    issues.push(`${rel}: identity ${doc.identity} != filename ${base}`);
  }
  if (doc.semantics_ref && doc.semantics_ref.path && !existsRepoPath(doc.semantics_ref.path)) {
    issues.push(`${rel}: semantics_ref.path missing: ${doc.semantics_ref.path}`);
  }
  const bindings = Array.isArray(doc.evaluation_bindings) ? doc.evaluation_bindings : [];
  if (bindings.length === 0) issues.push(`${rel}: evaluation_bindings empty`);
  for (const b of bindings) {
    if (!b.profile) issues.push(`${rel}: binding missing profile`);
    if (b.cli != null && b.cli !== "" && !existsRepoPath(b.cli)) {
      issues.push(`${rel}: binding.cli missing: ${b.cli}`);
    }
    if (b.evaluator != null && b.evaluator !== "" && !existsRepoPath(b.evaluator)) {
      issues.push(`${rel}: binding.evaluator missing: ${b.evaluator}`);
    }
  }
  if (doc.control_x) {
    if (typeof doc.control_x.eligible !== "boolean") {
      issues.push(`${rel}: control_x.eligible must be boolean`);
    }
    if (doc.control_x.eligible) {
      if (!doc.control_x.fixture || !existsRepoPath(doc.control_x.fixture)) {
        issues.push(`${rel}: control_x eligible but fixture missing`);
      }
      if (!doc.control_x.runner || !existsRepoPath(doc.control_x.runner)) {
        issues.push(`${rel}: control_x eligible but runner missing`);
      }
      const profiles = new Set(bindings.map((b) => b.profile));
      if (!profiles.has("repo") || !profiles.has("skill")) {
        issues.push(`${rel}: control_x eligible requires repo + skill bindings`);
      }
    }
  }
  return doc;
}

function main() {
  const gate = process.argv.includes("--gate");
  const json = process.argv.includes("--json");
  const files = listControlFiles();
  const issues = [];
  if (files.length === 0) {
    issues.push("repo-tools/controls/: no CTRL-NNNN.json projections found");
  }
  const seen = new Set();
  for (const abs of files) {
    const doc = validateControl(abs, issues);
    if (doc && doc.identity) {
      if (seen.has(doc.identity)) issues.push(`duplicate identity ${doc.identity}`);
      seen.add(doc.identity);
    }
  }
  const gatePass = issues.length === 0;
  if (json) {
    process.stdout.write(JSON.stringify({ controls: [...seen], issues, gatePass }, null, 2) + "\n");
  } else if (gatePass) {
    console.log(`✓ control-registry: ${seen.size} control(s) ok`);
  } else {
    console.log("✗ control-registry:");
    for (const i of issues) console.log("  - " + i);
  }
  process.exit(gate && !gatePass ? 1 : 0);
}

main();
