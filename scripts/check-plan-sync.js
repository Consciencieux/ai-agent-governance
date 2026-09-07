#!/usr/bin/env node
// Plan Sync Check — reconciles the milestone index with the TASK plans it indexes.
//
// Why this exists: the lifecycle policy says "tick the milestone when the task completes",
// but a documented rule with no failure feedback is the shape that keeps failing — an agent
// updates TASK_<name>.md and forgets DEVELOPMENT_PLAN.md, and nothing notices until someone
// reads both. The skill repository hit this exact class three times (release sync points
// verified in two of five places; a roadmap that never learned about an implemented plan;
// gate scan lists left behind by a file move). See ADR-0009 for the index/fact-source
// boundary and why the two domains get different enforcement levels.
//
// Deliberately NARROW. Three mechanically decidable relations, nothing semantic:
//   1. implemented/completed TASK plan  -> some milestone line mentions it
//   2. archived TASK plan               -> no ACTIVE (unchecked) milestone still points at it
//   3. milestone naming a TASK plan     -> that plan file must exist
// NOT checked (documentation-level judgement, left to humans): whether a milestone's
// description is accurate, whether the task is genuinely done, whether the link is
// semantically the right plan.
//
// Structure-compatible by design: a project without docs/plans/ or without
// DEVELOPMENT_PLAN.md is not this shape — the check reports not-applicable and exits 0.
// It never forces a project into the skill's directory layout.
//
// Usage:
//   node scripts/check-plan-sync.js [--json] [--release-gate]
// Exit 0: in sync, advisory mode, or not applicable.
// Exit 1: drift found AND --release-gate was passed. Default mode never blocks a commit —
// this is a release/audit reconciliation, not a per-commit gate.

const fs = require("fs");
const path = require("path");

const ROOT = process.cwd();
const PLANS_DIR = "docs/plans";
const ARCHIVE_DIR = "docs/plans/archive";
const INDEX_FILE = "docs/plans/DEVELOPMENT_PLAN.md";

function readSafe(rel) {
  try { return fs.readFileSync(path.join(ROOT, rel), "utf8"); } catch { return null; }
}

// Canonical status vocabulary from the lifecycle policy, on the canonical status LINE
// (`> **Status: ...**` blockquote-bold within the first 12 lines). A loose substring
// search ("Status:" anywhere) classified a colon-outside-bold or plain-line form as
// implemented here while check-doc-consistency read the same file as unknown — four
// classifiers disagreeing on one plan is the divergence class this vocabulary exists
// to prevent. Order matters: the design form CONTAINS the substring "implemented".
function planStatus(content) {
  const head = content.split(/\r?\n/).slice(0, 12).join("\n");
  const line = head.match(/^>\s*\*\*\s*(?:Status|状态|狀態)\s*[:：]\s*([^*\n]+)/im);
  if (!line) return "unknown";
  const value = line[1].trim();
  if (/^(?:archived|已归档|已歸檔)/i.test(value)) return "archived";
  if (/^(?:design plan, not implemented|设计计划，未实现|設計計劃，未實作)/i.test(value)) return "design";
  if (/^(?:implemented|已实现|已實作)/i.test(value)) return "implemented";
  if (/^(?:completed|已完成)/i.test(value)) return "implemented";
  if (/^active/i.test(value)) return "active";
  return "unknown";
}

// A milestone line: "- [ ] M1: ..." (pending) or "- [x] M1: ..." (done)
function parseMilestones(indexContent) {
  const out = [];
  for (const line of indexContent.split(/\r?\n/)) {
    const m = /^\s*-\s*\[( |x|X)\]\s*(.+)$/.exec(line);
    if (m) out.push({ done: m[1].toLowerCase() === "x", text: m[2], raw: line });
  }
  return out;
}

function listPlanFiles(dir) {
  const abs = path.join(ROOT, dir);
  if (!fs.existsSync(abs)) return [];
  try {
    return fs.readdirSync(abs).filter((f) => f.endsWith(".md") && !/^v\d/.test(f));
  } catch { return []; }
}

function main() {
  const json = process.argv.includes("--json");
  const releaseGate = process.argv.includes("--release-gate");
  const issues = { implemented_without_milestone: [], archived_still_pending: [], milestone_plan_missing: [] };

  const index = readSafe(INDEX_FILE);
  const plansExist = fs.existsSync(path.join(ROOT, PLANS_DIR));

  // Shape guard: not this structure -> not applicable, never force a layout on a project.
  if (!plansExist || index === null) {
    const out = { applicable: false, reason: !plansExist ? "no docs/plans/" : "no " + INDEX_FILE, issues, gatePass: true };
    if (json) process.stdout.write(JSON.stringify(out, null, 2) + "\n");
    else console.log("✓ plan sync: not applicable (" + out.reason + ")");
    process.exit(0);
  }

  const milestones = parseMilestones(index);
  const indexText = milestones.map((m) => m.text).join("\n");

  // 1. implemented/completed plan must be mentioned by some milestone
  for (const f of listPlanFiles(PLANS_DIR)) {
    if (f === "DEVELOPMENT_PLAN.md") continue;
    const content = readSafe(PLANS_DIR + "/" + f);
    if (!content) continue;
    const status = planStatus(content);
    if (status !== "implemented") continue;
    const slug = f.replace(/\.md$/, "");
    if (!indexText.includes(f) && !indexText.includes(slug)) {
      issues.implemented_without_milestone.push(PLANS_DIR + "/" + f + " — implemented but no milestone mentions it");
    }
  }

  // 2. archived plan must not be pointed at by an UNCHECKED milestone
  for (const f of listPlanFiles(ARCHIVE_DIR)) {
    const slug = f.replace(/\.md$/, "");
    const pending = milestones.filter((m) => !m.done && (m.text.includes(f) || m.text.includes(slug)));
    for (const m of pending) {
      issues.archived_still_pending.push(ARCHIVE_DIR + "/" + f + " — archived, but an unchecked milestone still points at it: " + m.text.slice(0, 60));
    }
  }

  // 3. a milestone naming a TASK plan must name one that exists (in plans/ or archive/)
  for (const m of milestones) {
    const named = [...m.text.matchAll(/(TASK_[\w.-]+\.md)/g)].map((x) => x[1]);
    for (const n of named) {
      const inPlans = fs.existsSync(path.join(ROOT, PLANS_DIR, n));
      const inArchive = fs.existsSync(path.join(ROOT, ARCHIVE_DIR, n));
      if (!inPlans && !inArchive) {
        issues.milestone_plan_missing.push(INDEX_FILE + " — milestone names " + n + ", which exists in neither " + PLANS_DIR + "/ nor " + ARCHIVE_DIR + "/");
      }
    }
  }

  const all = [...issues.implemented_without_milestone, ...issues.archived_still_pending, ...issues.milestone_plan_missing];
  const gatePass = all.length === 0;

  if (json) {
    process.stdout.write(JSON.stringify({ applicable: true, issues, gatePass, total: all.length, milestones: milestones.length }, null, 2) + "\n");
  } else if (gatePass) {
    console.log("✓ plan sync: milestones and TASK plans agree (" + milestones.length + " milestones)");
  } else {
    for (const [kind, list] of Object.entries(issues)) {
      if (!list.length) continue;
      console.log((releaseGate ? "✗ " : "⚠ ") + kind + ":");
      for (const i of list) console.log("  - " + i);
    }
    if (!releaseGate) console.log("(advisory: reconcile before release; --release-gate makes this fail-closed)");
  }

  // Default mode is advisory on purpose: this reconciliation belongs to release/audit,
  // not to every commit. Only --release-gate blocks.
  process.exit(releaseGate && !gatePass ? 1 : 0);
}

main();
