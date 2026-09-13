#!/usr/bin/env node
// Discovery Ledger L2 (PLAN-0048 / FINDING-0022).
// Active TASK plans must carry a Discovery Ledger with reconciliable Open count.
// Terminal dispositions that are not resolved must name a successor / revisit.
// REPO-ONLY. Not a parallel issue tracker — home stays inside the Active plan.
"use strict";

const fs = require("fs");
const path = require("path");
const { classifyPlanStatus, isPlanMarkdown } = require("../scripts/lib/plan-status.js");

const ROOT = process.cwd();
const LIVE = path.join(ROOT, "docs", "plans");

const TERMINAL_OPEN = /^(?:open|deferred|promoted|wontfix|accepted-risk)$/i;
const RESOLVED = /^(?:resolved|closed|done)$/i;

function listLivePlans() {
  if (!fs.existsSync(LIVE)) return [];
  return fs
    .readdirSync(LIVE)
    .filter((f) => isPlanMarkdown(f))
    .map((f) => path.join(LIVE, f));
}

function parseLedger(md) {
  const start = md.search(/##\s+Discovery Ledger/i);
  if (start < 0) return null;
  const from = md.slice(start);
  const nextH2 = from.search(/\n##\s/);
  const section = nextH2 < 0 ? from : from.slice(0, nextH2);
  const rows = [];
  for (const line of section.split(/\r?\n/)) {
    if (!/^\|/.test(line)) continue;
    if (/^\|\s*-/.test(line)) continue;
    if (/^\|\s*ID\s*\|/i.test(line)) continue;
    const cells = line.split("|").map((c) => c.trim()).filter((_, i, a) => i > 0 && i < a.length - 1);
    if (cells.length < 4) continue;
    rows.push({ id: cells[0], status: cells[3], disposition: cells[4] || "" });
  }
  const footer = section.match(/```text\s*([\s\S]*?)```/);
  let claimedOpen = null;
  if (footer) {
    const om = footer[1].match(/Open:\s*(\d+)/i);
    if (om) claimedOpen = Number(om[1]);
  }
  return { rows, claimedOpen, block: section };
}

function main() {
  const gate = process.argv.includes("--gate");
  const json = process.argv.includes("--json");
  const issues = [];
  for (const abs of listLivePlans()) {
    const rel = path.relative(ROOT, abs).split(path.sep).join("/");
    const md = fs.readFileSync(abs, "utf8");
    const status = classifyPlanStatus(md);
    if (status !== "active") continue;
    const ledger = parseLedger(md);
    if (!ledger) {
      issues.push(`${rel}: Active plan missing ## Discovery Ledger (FINDING-0022 L2)`);
      continue;
    }
    const openRows = ledger.rows.filter((r) => !RESOLVED.test(r.status));
    if (ledger.claimedOpen != null && ledger.claimedOpen !== openRows.length) {
      issues.push(
        `${rel}: Discovery Ledger Open=${ledger.claimedOpen} but table has ${openRows.length} non-resolved row(s)`
      );
    }
    for (const r of openRows) {
      if (/^open$/i.test(r.status)) continue; // in-progress rows need no successor yet
      if (
        TERMINAL_OPEN.test(r.status) &&
        !/(successor|revisit|PLAN-\d{4}|FINDING-\d{4}|ADR-\d{4})/i.test(r.disposition)
      ) {
        issues.push(
          `${rel}: ledger ${r.id} status=${r.status} needs successor/revisit in disposition (ADR-0021)`
        );
      }
    }
  }
  const gatePass = issues.length === 0;
  if (json) {
    process.stdout.write(JSON.stringify({ issues, gatePass }, null, 2) + "\n");
  } else if (gatePass) {
    console.log("✓ discovery-ledger: Active plan ledgers reconcile");
  } else {
    console.log("✗ discovery-ledger:");
    for (const i of issues) console.log("  - " + i);
  }
  process.exit(gate && !gatePass ? 1 : 0);
}

main();
