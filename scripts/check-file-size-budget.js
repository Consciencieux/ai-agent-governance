#!/usr/bin/env node
// PAYLOAD SCRIPT — file-size budget reporter for governed projects.
// Self-contained: Node builtins only. No skill-repo construction IDs.
//
// Line count is a smell, not a verdict. soft/review = alert ceilings, not target size;
// under budget ≠ thin enough. This script ONLY reports (and optionally
// fails --gate on review tier). Agents must propose a split and wait for human
// confirmation — never auto-trim or hard-split because of line count alone.
//
// Usage:
//   node scripts/check-file-size-budget.js [--json] [--gate]
// Optional project overrides: .governance/file-size-budget.json
// Exit: 0 advisory (or clean) · 1 --gate with one or more review-tier hits
"use strict";

const fs = require("fs");
const path = require("path");

const ROOT = process.cwd();
const OVERRIDE = path.join(ROOT, ".governance", "file-size-budget.json");

/** Default budgets for a governed project after INIT (portable paths). */
const DEFAULT = {
  doctrine:
    "advisory line-count signal; report + propose split; human confirmation before split; no auto-trim",
  exempt: [
    "CHANGELOG.md",
    "docs/plans/archive",
    ".governance/generated",
    "node_modules",
    "tests/.tmp",
  ],
  tiers: [
    { id: "thin_entry", soft: 250, review: 350, roots: ["AGENTS.md"] },
    {
      id: "rules",
      soft: 400,
      review: 500,
      roots: ["docs/rules"],
      ext: [".md"],
    },
    {
      id: "features",
      soft: 400,
      review: 500,
      roots: ["docs/features"],
      ext: [".md"],
    },
    {
      id: "architecture",
      soft: 400,
      review: 500,
      roots: ["docs/ARCHITECTURE.md"],
    },
    {
      id: "scripts",
      soft: 600,
      review: 800,
      roots: ["scripts"],
      ext: [".js"],
    },
  ],
};

function loadConfig() {
  const cfg = JSON.parse(JSON.stringify(DEFAULT));
  if (!fs.existsSync(OVERRIDE)) return cfg;
  try {
    const o = JSON.parse(fs.readFileSync(OVERRIDE, "utf8"));
    if (Array.isArray(o.exempt)) cfg.exempt = o.exempt;
    if (Array.isArray(o.tiers) && o.tiers.length) cfg.tiers = o.tiers;
    if (typeof o.doctrine === "string") cfg.doctrine = o.doctrine;
  } catch (e) {
    console.error("check-file-size-budget: invalid override:", e.message || e);
    process.exit(1);
  }
  return cfg;
}

function isExempt(rel, exempt) {
  const n = rel.split(path.sep).join("/");
  for (const ex of exempt) {
    const e = String(ex).replace(/\\/g, "/").replace(/\/$/, "");
    if (!e) continue;
    if (n === e || n.startsWith(e + "/")) return true;
  }
  if (n.includes("/node_modules/")) return true;
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
  return body.split(/\n/).length - (body.endsWith("\n") ? 1 : 0);
}

function collectForTier(tier) {
  const out = [];
  const exts = tier.ext || null;
  for (const root of tier.roots || []) {
    const abs = path.join(ROOT, root);
    if (!fs.existsSync(abs)) continue;
    const st = fs.statSync(abs);
    if (st.isFile()) {
      out.push(abs);
      continue;
    }
    for (const f of walk(abs)) {
      if (exts && !exts.some((x) => f.endsWith(x))) continue;
      out.push(f);
    }
  }
  return out;
}

function main() {
  const json = process.argv.includes("--json");
  const gate = process.argv.includes("--gate");
  const cfg = loadConfig();
  const hits = [];

  for (const tier of cfg.tiers) {
    for (const abs of collectForTier(tier)) {
      const rel = path.relative(ROOT, abs).split(path.sep).join("/");
      if (isExempt(rel, cfg.exempt)) continue;
      const lines = lineCount(abs);
      let level = null;
      if (lines >= tier.review) level = "review";
      else if (lines >= tier.soft) level = "soft";
      if (!level) continue;
      hits.push({
        path: rel,
        lines,
        level,
        tier: tier.id,
        soft: tier.soft,
        review: tier.review,
      });
    }
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
    doctrine: cfg.doctrine,
    override: fs.existsSync(OVERRIDE),
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
