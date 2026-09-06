#!/usr/bin/env node
// Roadmap Sync Check — the roadmap is an INDEX; the design plans are the fact source.
// This check verifies the index did not drift from the plans it indexes.
//
// Why this exists: `plan-delivery-anchors` was implemented and the roadmap never learned
// about it. The rule ("re-baseline the roadmap at each release") existed and was followed
// as written — it just never covered plan-lifecycle events between releases, and nothing
// mechanical noticed. Same failure shape as the release sync points that were documented
// in five places and verified in two.
//
// REPO-ONLY: lives under repo-tools/, which the packaging step cannot reach. A governed
// project has no roadmap (its index is the milestone list in docs/plans/DEVELOPMENT_PLAN.md,
// governed by lifecycle policy text, deliberately NOT by an installed gate — see the
// index/fact-source ADR).
//
// Three mechanically decidable relations, nothing more:
//   1. implemented plan  -> must appear in the roadmap Done section
//   2. archived plan     -> must NOT appear in an active horizon (Near-term / Mid-term)
//   3. active design plan-> if it appears at all, the entry must link the plan file
//                           (an entry may legitimately be absent: not everything is planned
//                            on the roadmap, and inventing entries is not this gate's job)
//
// Usage:
//   node repo-tools/check-roadmap-sync.js [--json] [--gate]
// Exit 0: in sync (or advisory mode). Exit 1: drift found, only with --gate.

const fs = require("fs");
const path = require("path");

const ROOT = process.cwd();
const ROADMAP = path.join(ROOT, "docs", "en", "roadmap.md");
const PLAN_DIRS = ["docs/en/plans"];
const ARCHIVE_DIR = "docs/archive";

function readFileSafe(rel) {
  try { return fs.readFileSync(path.join(ROOT, rel), "utf8"); } catch { return null; }
}

// Canonical status keywords (same vocabulary the plan-status cluster uses).
function planStatus(content) {
  const line = content.split(/\r?\n/).find((l) => /Status:/i.test(l) || /状态[:：]/.test(l) || /狀態[:：]/.test(l));
  if (!line) return "unknown";
  // Order matters: "design plan, not implemented" CONTAINS "implemented". Checking the
  // negative/design form first is what keeps a design plan from being read as delivered
  // (this classifier reported exactly that bug on its first run).
  if (/archived|已归档|已歸檔/i.test(line)) return "archived";
  if (/not implemented|未实现|未實現|未實作|design plan|设计计划|設計計劃/i.test(line)) return "design";
  if (/implemented|已实现|已實現|已實作|completed|已完成/i.test(line)) return "implemented";
  if (/active|进行中|進行中/i.test(line)) return "active";
  return "unknown";
}

// Roadmap sections: Done is the completed index; the rest are active horizons.
function splitSections(md) {
  const out = {};
  let current = null;
  for (const line of md.split(/\r?\n/)) {
    const h = /^###\s+(.+?)\s*$/.exec(line);
    if (h) { current = h[1]; out[current] = []; continue; }
    if (current) out[current].push(line);
  }
  return out;
}

function main() {
  const json = process.argv.includes("--json");
  const gate = process.argv.includes("--gate");
  const issues = { implemented_missing_from_done: [], archived_still_active: [], entry_without_link: [] };

  const roadmap = readFileSafe("docs/en/roadmap.md");
  if (roadmap === null) {
    // Not this repo's shape (a governed project has no roadmap): not applicable.
    const out = { applicable: false, issues, gatePass: true };
    if (json) process.stdout.write(JSON.stringify(out, null, 2) + "\n");
    else console.log("✓ roadmap sync: not applicable (no docs/en/roadmap.md)");
    process.exit(0);
  }

  const sections = splitSections(roadmap);
  const doneText = (sections["Done"] || []).join("\n");
  const activeNames = Object.keys(sections).filter((n) => /Near-term|Mid-term|Long-term/i.test(n));
  const activeText = activeNames.map((n) => sections[n].join("\n")).join("\n");

  // 1 + 3: plans still in the language trees
  for (const dir of PLAN_DIRS) {
    const abs = path.join(ROOT, dir);
    if (!fs.existsSync(abs)) continue;
    for (const f of fs.readdirSync(abs)) {
      if (!f.endsWith(".md")) continue;
      const rel = dir + "/" + f;
      const content = readFileSafe(rel);
      if (!content) continue;
      const status = planStatus(content);
      const slug = f.replace(/\.md$/, "");

      if (status === "implemented") {
        // must be indexed in Done (by file link or by slug mention)
        const indexed = doneText.includes(f) || doneText.includes(slug);
        if (!indexed) issues.implemented_missing_from_done.push(rel + " — implemented but absent from the roadmap Done section");
      }

      if (status === "design" || status === "active") {
        // if an active horizon mentions it, the entry must link the plan file
        const mentioned = activeText.includes(slug);
        const linked = new RegExp("\\]\\([^)]*" + slug.replace(/[.*+?^${}()|[\]\\]/g, "\\$&") + "\\.md\\)").test(activeText);
        if (mentioned && !linked) issues.entry_without_link.push(rel + " — mentioned in an active horizon without a link to the plan file");
      }
    }
  }

  // 2: archived plans must not sit in an active horizon
  const archAbs = path.join(ROOT, ARCHIVE_DIR);
  if (fs.existsSync(archAbs)) {
    for (const f of fs.readdirSync(archAbs)) {
      if (!f.endsWith(".md") || /^v\d/.test(f)) continue;
      const slug = f.replace(/\.md$/, "");
      // Only a LINK to the plan file counts as "listed": a slug mentioned inside prose
      // (e.g. "review-manager's parallel subagents are its first use case") is a
      // description, not an index entry. Matching bare slugs produced exactly that false
      // positive on the first run.
      const linkedInActive = new RegExp("\\]\\([^)]*" + slug.replace(/[.*+?^${}()|[\]\\]/g, "\\$&") + "\\.md\\)").test(activeText);
      if (linkedInActive) {
        issues.archived_still_active.push(ARCHIVE_DIR + "/" + f + " — archived but still linked from an active horizon");
      }
    }
  }

  const all = [...issues.implemented_missing_from_done, ...issues.archived_still_active, ...issues.entry_without_link];
  const gatePass = all.length === 0;

  if (json) {
    process.stdout.write(JSON.stringify({ applicable: true, issues, gatePass, total: all.length }, null, 2) + "\n");
  } else if (gatePass) {
    console.log("✓ roadmap sync: index matches plan lifecycle state");
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
