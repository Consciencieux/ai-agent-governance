#!/usr/bin/env node
// Docs shape allowlist (PLAN-0048 / FINDING-0030 §5).
// Fail-closed on directory / filename shape under docs/. Not a content classifier.
"use strict";

const fs = require("fs");
const path = require("path");

const ROOT = process.cwd();
const ALLOW_PATH = path.join(ROOT, "repo-tools", "docs-shape-allowlist.v0.json");

function list(dir) {
  try {
    return fs.readdirSync(dir, { withFileTypes: true });
  } catch {
    return [];
  }
}

function main() {
  const gate = process.argv.includes("--gate");
  const json = process.argv.includes("--json");
  const allow = JSON.parse(fs.readFileSync(ALLOW_PATH, "utf8"));
  const docsRoot = path.join(ROOT, "docs");
  const issues = [];

  if (!fs.existsSync(docsRoot)) {
    const out = { applicable: false, issues, gatePass: true };
    if (json) process.stdout.write(JSON.stringify(out, null, 2) + "\n");
    else console.log("✓ docs-shape: not applicable (no docs/)");
    process.exit(0);
  }

  const topAllowedFiles = new Set(allow.allowed_top_level_files || []);
  const topAllowedDirs = new Set(allow.allowed_top_level_dirs || []);
  for (const ent of list(docsRoot)) {
    if (ent.name.startsWith(".")) continue;
    if (ent.isDirectory()) {
      if (!topAllowedDirs.has(ent.name)) issues.push(`docs/: unexpected directory ${ent.name}`);
    } else if (ent.isFile()) {
      if (!topAllowedFiles.has(ent.name)) issues.push(`docs/: unexpected file ${ent.name}`);
    }
  }

  function checkNode(relDir, ruleKey) {
    const rule = allow.rules[ruleKey];
    if (!rule) return;
    const abs = path.join(ROOT, relDir);
    if (!fs.existsSync(abs)) return;
    const allowedFiles = new Set(rule.allowed_files || []);
    const allowedDirs = new Set(rule.allowed_dirs || []);
    const patterns = (rule.file_patterns || []).map((p) => new RegExp(p));
    for (const ent of list(abs)) {
      if (ent.name.startsWith(".")) continue;
      const childRel = relDir + "/" + ent.name;
      if (ent.isDirectory()) {
        if (!allowedDirs.has(ent.name)) {
          issues.push(`${relDir}/: unexpected directory ${ent.name}`);
          continue;
        }
        const nestedKey = ruleKey + "/" + ent.name;
        if (allow.rules[nestedKey]) checkNode(childRel, nestedKey);
        else if (rule.allow_nested_md) {
          // product trees: allow nested md freely inside language dirs
          continue;
        } else {
          // directory allowed but no nested rule — must be empty of surprise children
          for (const nested of list(path.join(ROOT, childRel))) {
            if (nested.name.startsWith(".")) continue;
            if (nested.isDirectory()) issues.push(`${childRel}/: unexpected directory ${nested.name}`);
            else if (!/\.md$/i.test(nested.name)) issues.push(`${childRel}/: unexpected file ${nested.name}`);
          }
        }
      } else if (ent.isFile()) {
        if (allowedFiles.has(ent.name)) continue;
        if (patterns.some((re) => re.test(ent.name))) continue;
        issues.push(`${relDir}/: unexpected file ${ent.name}`);
      }
    }
  }

  for (const key of Object.keys(allow.rules)) {
    if (!key.includes("/")) checkNode("docs/" + key, key);
  }

  // ID uniqueness across PLAN / FINDING / RESEARCH / ADR stems
  const idMap = new Map();
  function claimId(id, file) {
    if (idMap.has(id)) issues.push(`duplicate id ${id}: ${idMap.get(id)} and ${file}`);
    else idMap.set(id, file);
  }
  function scanIds(dir, re) {
    const abs = path.join(ROOT, dir);
    if (!fs.existsSync(abs)) return;
    for (const ent of list(abs)) {
      if (!ent.isFile() || !ent.name.endsWith(".md")) continue;
      const m = ent.name.match(re);
      if (m) claimId(m[1], dir + "/" + ent.name);
    }
  }
  scanIds("docs/plans", /^(PLAN-\d{4})/);
  scanIds("docs/plans/archive", /^(PLAN-\d{4})/);
  scanIds("docs/findings", /^(FINDING-\d{4})/);
  scanIds("docs/research", /^(RESEARCH-\d{4})/);
  scanIds("docs/design-decisions", /^(ADR-\d{4})/);

  const gatePass = issues.length === 0;
  if (json) {
    process.stdout.write(JSON.stringify({ applicable: true, issues, gatePass, total: issues.length }, null, 2) + "\n");
  } else if (gatePass) {
    console.log("✓ docs-shape: docs/ matches allowlist " + allow.id);
  } else {
    console.log("✗ docs-shape:");
    for (const i of issues) console.log("  - " + i);
  }
  process.exit(gate && !gatePass ? 1 : 0);
}

main();
