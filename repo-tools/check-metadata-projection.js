#!/usr/bin/env node
// Metadata projection drift gate (PLAN-0048 / FINDING-0024).
// design-decisions README must remain a navigation index — no Status/generation copy.
"use strict";

const fs = require("fs");
const path = require("path");

const ROOT = process.cwd();
const README = path.join(ROOT, "docs", "design-decisions", "README.md");

function main() {
  const gate = process.argv.includes("--gate");
  const json = process.argv.includes("--json");
  const issues = [];
  if (!fs.existsSync(README)) {
    const out = { applicable: false, issues, gatePass: true };
    if (json) process.stdout.write(JSON.stringify(out, null, 2) + "\n");
    else console.log("✓ metadata-projection: not applicable");
    process.exit(0);
  }
  const md = fs.readFileSync(README, "utf8");
  // Require explicit authority pointer (read-only projection contract).
  if (!/frontmatter|唯一事实源|single source|不复制状态|does not copy status|不复制.*状态/i.test(md)) {
    issues.push("docs/design-decisions/README.md: missing read-only / frontmatter-authority pointer");
  }
  // No Status / generation column in the main index table (first markdown table).
  const table = md.match(/\|[^\n]+\|\r?\n\|[-:| ]+\|\r?\n([\s\S]*?)(?=\n## |\n[^|])/);
  if (table) {
    const header = md.match(/\|[^\n]+\|\r?\n\|[-:| ]+\|/);
    if (header && /状态|Status|代际|generation/i.test(header[0])) {
      issues.push("docs/design-decisions/README.md: index table must not project status/generation columns");
    }
  }
  // Ban cell-shaped status copies in tables.
  if (/\|\s*(?:Accepted|Proposed|Superseded|Deprecated|Accepted)\s*\|/i.test(md)) {
    issues.push("docs/design-decisions/README.md: table cell looks like a copied ADR status");
  }
  const gatePass = issues.length === 0;
  if (json) process.stdout.write(JSON.stringify({ applicable: true, issues, gatePass }, null, 2) + "\n");
  else if (gatePass) console.log("✓ metadata-projection: design-decisions README is navigation-only");
  else {
    console.log("✗ metadata-projection:");
    for (const i of issues) console.log("  - " + i);
  }
  process.exit(gate && !gatePass ? 1 : 0);
}

main();
