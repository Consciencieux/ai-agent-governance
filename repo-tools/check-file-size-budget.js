#!/usr/bin/env node
// File size budget — REPO-ONLY advisory signal (docs/README § 顾问级行数预算).
// Line count is a smell, not a verdict. Never auto-split; Agent must report + propose,
// then wait for human confirmation.
// Usage: node repo-tools/check-file-size-budget.js [--json] [--gate]
// Exit: default 0 (advisory). --gate fails only when any file is at/above review tier.
"use strict";

const fs = require("fs");
const path = require("path");

const ROOT = process.cwd();

/** @typedef {{ soft: number, review: number }} Budget */

/** @type {Array<{ id: string, match: (rel: string) => boolean, budget: Budget }>} */
const TIERS = [
  {
    id: "thin_entry",
    match: (rel) => rel === "AGENTS.md" || rel === "SKILL.md",
    budget: { soft: 250, review: 350 },
  },
  {
    id: "working_authority",
    match: (rel) =>
      /^(references\/(policies|capabilities|instruction)\b|docs\/product\b)/.test(rel) &&
      rel.endsWith(".md"),
    budget: { soft: 400, review: 500 },
  },
  {
    id: "knowledge",
    match: (rel) =>
      /^(docs\/(research|findings|design-decisions)\b)/.test(rel) &&
      rel.endsWith(".md") &&
      !rel.startsWith("docs/plans/archive/"),
    budget: { soft: 600, review: 800 },
  },
  {
    id: "workflows",
    match: (rel) => rel.startsWith("references/workflows/") && rel.endsWith(".md"),
    budget: { soft: 400, review: 500 },
  },
  {
    id: "scripts",
    match: (rel) =>
      (rel.startsWith("scripts/") || rel.startsWith("repo-tools/")) &&
      rel.endsWith(".js") &&
      !rel.includes("/.tmp/") &&
      !rel.includes("/node_modules/"),
    budget: { soft: 600, review: 800 },
  },
  {
    id: "test_suites",
    match: (rel) => rel.startsWith("tests/suites/") && rel.endsWith(".js"),
    budget: { soft: 400, review: 600 },
  },
];

function isExempt(rel) {
  if (rel === "CHANGELOG.md") return true;
  if (rel.startsWith("docs/plans/archive/")) return true;
  if (rel.startsWith("tests/.tmp/")) return true;
  if (rel.includes("/node_modules/")) return true;
  return false;
}

function walk(dir, acc = []) {
  let entries;
  try {
    entries = fs.readdirSync(dir, { withFileTypes: true });
  } catch {
    return acc;
  }
  for (const e of entries) {
    if (e.name === "node_modules" || e.name === ".git" || e.name === ".tmp") continue;
    const abs = path.join(dir, e.name);
    if (e.isDirectory()) walk(abs, acc);
    else acc.push(abs);
  }
  return acc;
}

function lineCount(abs) {
  const body = fs.readFileSync(abs, "utf8");
  if (body.length === 0) return 0;
  // Physical lines (including trailing empty line if file ends with \n)
  return body.split(/\n/).length - (body.endsWith("\n") ? 1 : 0);
}

function classify(rel) {
  for (const t of TIERS) {
    if (t.match(rel)) return t;
  }
  return null;
}

function collectRoots() {
  const files = [];
  for (const name of ["AGENTS.md", "SKILL.md", "CHANGELOG.md"]) {
    const abs = path.join(ROOT, name);
    if (fs.existsSync(abs)) files.push(abs);
  }
  for (const d of ["references", "docs", "scripts", "repo-tools", "tests/suites"]) {
    const abs = path.join(ROOT, d);
    if (fs.existsSync(abs)) walk(abs, files);
  }
  return files;
}

function main() {
  const json = process.argv.includes("--json");
  const gate = process.argv.includes("--gate");
  const hits = [];

  for (const abs of collectRoots()) {
    const rel = path.relative(ROOT, abs).split(path.sep).join("/");
    if (isExempt(rel)) continue;
    const tier = classify(rel);
    if (!tier) continue;
    if (!/\.(md|js|json)$/.test(rel)) continue;
    const lines = lineCount(abs);
    let level = null;
    if (lines >= tier.budget.review) level = "review";
    else if (lines >= tier.budget.soft) level = "soft";
    if (!level) continue;
    hits.push({
      path: rel,
      lines,
      level,
      tier: tier.id,
      soft: tier.budget.soft,
      review: tier.budget.review,
    });
  }

  hits.sort((a, b) => {
    if (a.level !== b.level) return a.level === "review" ? -1 : 1;
    return b.lines - a.lines;
  });

  const reviewHits = hits.filter((h) => h.level === "review");
  const softHits = hits.filter((h) => h.level === "soft");
  const gatePass = !(gate && reviewHits.length > 0);

  const out = {
    timestamp: new Date().toISOString(),
    doctrine:
      "advisory line-count signal; report + propose split; human confirmation before split; no auto-trim",
    gate,
    gatePass,
    counts: { soft: softHits.length, review: reviewHits.length, total: hits.length },
    hits,
  };

  if (json) {
    process.stdout.write(JSON.stringify(out, null, 2) + "\n");
  } else if (hits.length === 0) {
    console.log("✓ file-size budget: no soft/review hits");
  } else {
    console.log(
      `file-size budget: ${softHits.length} soft, ${reviewHits.length} review (signal only; do not auto-split)`
    );
    for (const h of hits) {
      console.log(
        `  [${h.level}] ${h.path}: ${h.lines} lines (tier=${h.tier}, soft=${h.soft}, review=${h.review})`
      );
    }
    console.log(
      "Protocol: report to developer + propose split plan → wait for explicit confirmation before editing."
    );
    if (gate && !gatePass) {
      console.error("✗ file-size budget --gate: one or more files at/above review tier");
    }
  }

  process.exit(gatePass ? 0 : 1);
}

main();
