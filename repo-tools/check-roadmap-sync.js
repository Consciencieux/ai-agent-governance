#!/usr/bin/env node
// Roadmap Sync Check — roadmap is an INDEX; construction plans are the fact source.
// PLAN-0048 / FINDING-0021: scan the live Gen2 tree (docs/plans/roadmap/{en,zh-CN,zh-TW}.md).
//
// REPO-ONLY. Governed projects without a roadmap → not applicable.
//
// Mechanically decidable relations (Gen2 shape):
//   1. Every live docs/plans/PLAN-*.md (Design|Active|Implemented|Completed) must be
//      linked from each present roadmap language file.
//   2. An archived PLAN-*.md under docs/plans/archive/ must not be labeled **Design** or
//      **Active** in a roadmap cell that links it (must say Archived, or not claim live).
//
// Usage: node repo-tools/check-roadmap-sync.js [--json] [--gate]

"use strict";

const fs = require("fs");
const path = require("path");
const { classifyPlanStatus, isConstructionPlanMarkdown } = require("../scripts/lib/plan-status.js");

const ROOT = process.cwd();
const ROADMAPS = [
  "docs/plans/roadmap/en.md",
  "docs/plans/roadmap/zh-CN.md",
  "docs/plans/roadmap/zh-TW.md",
];
const LIVE_PLANS_DIR = "docs/plans";
const ARCHIVE_DIR = "docs/plans/archive";

function readFileSafe(rel) {
  try {
    return fs.readFileSync(path.join(ROOT, rel), "utf8");
  } catch {
    return null;
  }
}

function listPlanFiles(dirRel) {
  const abs = path.join(ROOT, dirRel);
  if (!fs.existsSync(abs)) return [];
  return fs
    .readdirSync(abs)
    .filter((f) => isConstructionPlanMarkdown(f))
    .map((f) => dirRel + "/" + f);
}

function linkedIn(md, planRel) {
  const base = planRel.split("/").pop();
  const id = (base.match(/^(PLAN-\d{4})/i) || [])[1];
  if (!id) return false;
  // markdown link containing the plan file or id
  if (md.includes(base)) return true;
  if (new RegExp("\\]\\([^)]*" + id.replace(/[.*+?^${}()|[\]\\]/g, "\\$&") + "[^)]*\\)").test(md)) return true;
  return false;
}

function liveClaimNearLink(md, planRel) {
  const base = planRel.split("/").pop();
  const id = (base.match(/^(PLAN-\d{4})/i) || [])[1];
  if (!id) return false;
  // Per-occurrence window: from this PLAN-id until the next PLAN-\d{4} on the same line.
  // Whole-line matching false-positives when a live **Design** plan shares a row with archived ids.
  const idRe = new RegExp(id.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "gi");
  for (const line of md.split(/\r?\n/)) {
    if (!line.includes(id)) continue;
    idRe.lastIndex = 0;
    let m;
    while ((m = idRe.exec(line))) {
      const rest = line.slice(m.index);
      const after = rest.slice(id.length);
      const nextRel = after.search(/PLAN-\d{4}/i);
      const window = nextRel < 0 ? rest : rest.slice(0, id.length + nextRel);
      const claimsArchived =
        /\*\*Archived\*\*|status:\s*Archived|已归档|已歸檔|\bArchived\b/i.test(window);
      const claimsLive =
        /\*\*Design\*\*|\*\*Active\*\*|status:\s*Design|status:\s*Active/i.test(window);
      if (claimsLive && !claimsArchived) return true;
    }
  }
  return false;
}

function main() {
  const json = process.argv.includes("--json");
  const gate = process.argv.includes("--gate");
  const issues = {
    live_plan_missing_from_roadmap: [],
    archived_still_claimed_live: [],
  };

  const roadmaps = ROADMAPS.map((rel) => ({ rel, text: readFileSafe(rel) })).filter((r) => r.text !== null);
  if (roadmaps.length === 0) {
    const out = { applicable: false, issues, gatePass: true };
    if (json) process.stdout.write(JSON.stringify(out, null, 2) + "\n");
    else console.log("✓ roadmap sync: not applicable (no docs/plans/roadmap/*.md)");
    process.exit(0);
  }

  for (const planRel of listPlanFiles(LIVE_PLANS_DIR)) {
    const content = readFileSafe(planRel);
    if (!content) continue;
    const status = classifyPlanStatus(content);
    if (status === "unknown" || status === "archived") continue;
    for (const rm of roadmaps) {
      if (!linkedIn(rm.text, planRel)) {
        issues.live_plan_missing_from_roadmap.push(`${planRel} (${status}) not linked from ${rm.rel}`);
      }
    }
  }

  for (const planRel of listPlanFiles(ARCHIVE_DIR)) {
    for (const rm of roadmaps) {
      if (!linkedIn(rm.text, planRel)) continue;
      if (liveClaimNearLink(rm.text, planRel)) {
        issues.archived_still_claimed_live.push(`${planRel} still claimed Design/Active in ${rm.rel}`);
      }
    }
  }

  const all = [...issues.live_plan_missing_from_roadmap, ...issues.archived_still_claimed_live];
  const gatePass = all.length === 0;

  if (json) {
    process.stdout.write(JSON.stringify({ applicable: true, issues, gatePass, total: all.length }, null, 2) + "\n");
  } else if (gatePass) {
    console.log("✓ roadmap sync: live plans indexed; archived plans not claimed live");
  } else {
    for (const [kind, list] of Object.entries(issues)) {
      if (!list.length) continue;
      console.log("✗ " + kind + ":");
      for (const i of list) console.log("  - " + i);
    }
  }
  process.exit(gate && !gatePass ? 1 : 0);
}

main();
