#!/usr/bin/env node
// REPO-ONLY — enforces PLAN-0055 daily-check surface doctrine.
// package.json scripts.check may only invoke npm test, allowlisted npm run aliases,
// and allowlisted repo-tools entrypoints (daily-check-surface.v0.json).
// Stage/Plan/Finding checkers belong on check:full / release / on-demand by default.
// Usage: node repo-tools/check-daily-check-surface.js [--gate] [--json]

"use strict";

const fs = require("fs");
const path = require("path");

const ROOT = path.join(__dirname, "..");
const SURFACE = path.join(__dirname, "daily-check-surface.v0.json");
const INV = path.join(__dirname, "script-inventory.v0.json");
const PKG = path.join(ROOT, "package.json");

function parseCheckScript(check) {
  const parts = String(check || "")
    .split(/\s*&&\s*/)
    .map((s) => s.trim())
    .filter(Boolean);
  const npmRuns = [];
  const nodeEntries = [];
  const other = [];
  for (const part of parts) {
    if (part === "npm test" || /^npm\s+test\b/.test(part)) continue;
    const run = part.match(/^npm\s+run\s+([^\s]+)/);
    if (run) {
      npmRuns.push(run[1]);
      continue;
    }
    const node = part.match(/^node\s+(\S+)/);
    if (node) {
      nodeEntries.push(node[1].replace(/^\.\//, ""));
      continue;
    }
    other.push(part);
  }
  return { npmRuns, nodeEntries, other };
}

function main() {
  const gate = process.argv.includes("--gate");
  const json = process.argv.includes("--json");
  const surface = JSON.parse(fs.readFileSync(SURFACE, "utf8"));
  const pkg = JSON.parse(fs.readFileSync(PKG, "utf8"));
  const check = (pkg.scripts && pkg.scripts.check) || "";
  const parsed = parseCheckScript(check);
  const allowNpm = new Set(surface.allowed_npm_scripts || []);
  const allowNode = new Set(surface.allowed_node_entrypoints || []);

  const issues = [];
  for (const name of parsed.npmRuns) {
    if (!allowNpm.has(name)) {
      issues.push(`npm run ${name} not on daily-check allowlist (move to check:full / release / on-demand)`);
    }
  }
  for (const entry of parsed.nodeEntries) {
    if (!allowNode.has(entry)) {
      issues.push(`${entry} not on daily-check allowlist (stage/research gates must not join scripts.check)`);
    }
  }
  for (const o of parsed.other) {
    issues.push(`unrecognized check fragment: ${o}`);
  }

  // Self-coverage: the surface checker itself must be on the daily check chain.
  if (!parsed.nodeEntries.includes("repo-tools/check-daily-check-surface.js")) {
    issues.push("scripts.check must invoke node repo-tools/check-daily-check-surface.js (self-coverage)");
  }

  // Inventory short_lists.daily_check must match allowlisted node entrypoints.
  if (fs.existsSync(INV)) {
    const inv = JSON.parse(fs.readFileSync(INV, "utf8"));
    const daily = (((inv.summary || {}).short_lists || {}).daily_check) || [];
    const dailySet = new Set(daily);
    for (const p of allowNode) {
      if (!dailySet.has(p)) issues.push(`inventory short_lists.daily_check missing ${p}`);
    }
    for (const p of daily) {
      if (!allowNode.has(p)) issues.push(`inventory short_lists.daily_check extra ${p} (not in daily-check-surface.v0.json)`);
    }
  }

  const report = {
    ok: issues.length === 0,
    check_script: check,
    parsed,
    issues,
    surface: SURFACE,
  };

  if (json) {
    process.stdout.write(JSON.stringify(report, null, 2) + "\n");
  } else if (issues.length) {
    console.error("daily-check-surface: FAIL");
    for (const i of issues) console.error("  - " + i);
  } else {
    console.log("daily-check-surface: ok (" + allowNode.size + " entrypoints, " + allowNpm.size + " npm aliases)");
  }

  if (gate && issues.length) process.exit(1);
}

main();
