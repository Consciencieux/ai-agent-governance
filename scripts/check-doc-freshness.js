#!/usr/bin/env node
// PAYLOAD SCRIPT — copied standalone into governed projects (references/init-spec.json).
// Keep it self-contained: Node builtins only, never require() a sibling module.
// Doc Freshness Check — read-only. Flags governance docs gone stale relative to code
// activity. Uses git commit dates (git log -1 --format=%cs), NOT filesystem mtime —
// fresh clones have all mtimes equal to checkout time.
// Usage: node scripts/check-doc-freshness.js [--json]
// Exit code is ALWAYS 0 — freshness is advisory, never a gate (stable low-commit
// projects legitimately show stale docs).

const fs = require("fs");
const path = require("path");
const { spawnSync } = require("child_process");

const ROOT = process.cwd();
const CODE_DIRS = ["src", "app", "packages", "lib", "core"]; // code activity signal
const STALE_DAYS = 30;
const VERY_STALE_DAYS = 90;

// Governance docs to check (relative to repo root). Structure-adaptive: prefer the
// manifest's doc_root when available.
function docCandidates() {
  const docs = [
    "docs/ARCHITECTURE.md",
    "CHANGELOG.md",
    "docs/features",
    "docs/plans",
    "docs/rules",
    "README.md",
  ];
  try {
    const m = JSON.parse(fs.readFileSync(path.join(ROOT, ".governance", "manifest.json"), "utf8"));
    const dr = typeof m.doc_root === "string" ? m.doc_root.trim().replace(/[\\/]+$/, "") : "";
    // Containment: a crafted doc_root (absolute, drive-relative "C:docs", ".."-escaping)
    // must not redirect the scan outside the project tree.
    const driveRelative = /^[A-Za-z]:/.test(dr);
    if (dr && dr !== "docs" && !path.isAbsolute(dr) && !driveRelative && !dr.split(/[\\/]/).includes("..")) {
      return docs.map((d) => d.replace(/^docs\//, dr + "/"));
    }
  } catch (e) {
    if (process.env.DEBUG) console.error(`[DEBUG] manifest unreadable: ${e.message}`);
  }
  return docs;
}

function git(args) {
  return spawnSync("git", args, { cwd: ROOT, encoding: "utf8" });
}

function daysSince(dateStr) {
  if (!dateStr) return null;
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return null;
  return Math.floor((Date.now() - d.getTime()) / 86400000);
}

// Days since the last commit touching the given path (null if path never committed).
function lastCommitDaysAgo(target) {
  const r = git(["log", "-1", "--format=%cs", "--", target]);
  if (r.status !== 0 || !r.stdout.trim()) return null;
  return daysSince(r.stdout.trim());
}

// Is there any code commit more recent than `sinceDaysAgo`?
function codeActiveSince(daysAgo) {
  if (daysAgo === null || daysAgo === undefined) return false;
  const since = new Date(Date.now() - daysAgo * 86400000).toISOString().slice(0, 10);
  for (const dir of CODE_DIRS) {
    const r = git(["log", "-1", `--since=${since}`, "--", dir]);
    if (r.status === 0 && r.stdout.trim()) return true;
  }
  return false;
}

function main() {
  const json = process.argv.includes("--json");
  const stale = [];
  const veryStale = [];
  const fresh = [];

  for (const doc of docCandidates()) {
    // Skip paths that exist only in git history but not on disk (ghost paths)
    if (!fs.existsSync(path.join(ROOT, doc))) continue;
    const days = lastCommitDaysAgo(doc);
    if (days === null) continue; // never committed or path absent — skip
    if (codeActiveSince(days)) {
      if (days >= VERY_STALE_DAYS) veryStale.push(doc);
      else if (days >= STALE_DAYS) stale.push(doc);
      else fresh.push(doc);
    } else {
      fresh.push(doc); // code not active either — not stale
    }
  }

  const report = { timestamp: new Date().toISOString(), stale, veryStale, fresh };

  // Append to drift-report.json if it exists (runtime output, optional)
  const driftPath = path.join(ROOT, ".governance", "drift-report.json");
  try {
    const drift = JSON.parse(fs.readFileSync(driftPath, "utf8"));
    drift.freshness = { stale, veryStale, checkedAt: report.timestamp };
    fs.writeFileSync(driftPath, JSON.stringify(drift, null, 2) + "\n");
  } catch (e) {
    if (process.env.DEBUG) console.error(`[DEBUG] drift-report.json not updated: ${e.message}`);
  }

  if (json) {
    process.stdout.write(JSON.stringify(report, null, 2) + "\n");
  } else {
    for (const d of veryStale) console.log(`⚠️  very stale (${d})`);
    for (const d of stale) console.log(`⚠️  stale (${d})`);
    if (stale.length + veryStale.length === 0) console.log("✓ no stale governance docs");
  }
  // ALWAYS exit 0 — advisory only
  process.exit(0);
}

main();
