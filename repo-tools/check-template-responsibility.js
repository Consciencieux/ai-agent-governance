#!/usr/bin/env node
// REPO-ONLY — template responsibility map gate (PLAN-0049 / FINDING-0026).
// Fail-closed: every references/templates/* file must appear exactly once with a role
// in {instruction_source, machine_state_template, bootstrap_boilerplate}.
// Classification is by responsibility — not by "used by a generator".
"use strict";

const fs = require("fs");
const path = require("path");

const ROOT = process.cwd();
const MAP = path.join(ROOT, "repo-tools", "template-responsibility.v0.json");
const TEMPLATES = path.join(ROOT, "references", "templates");
const ROLES = new Set(["instruction_source", "machine_state_template", "bootstrap_boilerplate"]);

function main() {
  const gate = process.argv.includes("--gate");
  const json = process.argv.includes("--json");
  const issues = [];
  if (!fs.existsSync(MAP)) {
    issues.push("missing repo-tools/template-responsibility.v0.json");
  }
  if (!fs.existsSync(TEMPLATES)) {
    issues.push("missing references/templates/");
  }
  let doc = { entries: [] };
  if (issues.length === 0) {
    doc = JSON.parse(fs.readFileSync(MAP, "utf8"));
    const disk = new Set(
      fs.readdirSync(TEMPLATES).filter((f) => fs.statSync(path.join(TEMPLATES, f)).isFile())
    );
    const seen = new Set();
    for (const e of doc.entries || []) {
      if (!e.path || !e.role) {
        issues.push("map entry missing path/role");
        continue;
      }
      if (!e.path.startsWith("references/templates/")) {
        issues.push(`${e.path}: path must stay under references/templates/`);
      }
      if (!ROLES.has(e.role)) issues.push(`${e.path}: unknown role ${e.role}`);
      const base = e.path.slice("references/templates/".length);
      if (!disk.has(base)) issues.push(`${e.path}: file missing on disk`);
      if (seen.has(e.path)) issues.push(`${e.path}: duplicate map entry`);
      seen.add(e.path);
    }
    for (const f of disk) {
      const rel = `references/templates/${f}`;
      if (![...seen].includes(rel)) issues.push(`${rel}: on disk but not in responsibility map`);
    }
  }
  const gatePass = issues.length === 0;
  if (json) {
    process.stdout.write(JSON.stringify({ issues, gatePass }, null, 2) + "\n");
  } else if (gatePass) {
    console.log(`✓ template-responsibility: ${(doc.entries || []).length} file(s) classified`);
  } else {
    console.log("✗ template-responsibility:");
    for (const i of issues) console.log("  - " + i);
  }
  process.exit(gate && !gatePass ? 1 : 0);
}

main();
