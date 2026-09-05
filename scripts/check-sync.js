#!/usr/bin/env node
// PAYLOAD SCRIPT — copied standalone into governed projects (references/init-spec.json).
// Keep it self-contained: Node builtins only, never require() a sibling module.
// Sync Groups Mechanical Check — read-only, zero-dependency.
// Verifies a task's change set against .governance/sync-rules.json.
// Usage: node scripts/check-sync.js [--json] [--advisory] [--base <sha>]
// Exit 0: clean (or --advisory) · Exit 1: unsynced groups in gate mode.

const fs = require("fs");
const path = require("path");
const { spawnSync } = require("child_process");

const POLICY = path.join(process.cwd(), ".governance", "sync-rules.json");
const STATE = path.join(process.cwd(), ".governance", "state.json");

function readJSON(p) {
  try {
    return { value: JSON.parse(fs.readFileSync(p, "utf8")), missing: false, error: null };
  } catch (e) {
    if (e.code === "ENOENT") return { value: null, missing: true, error: null };
    return { value: null, missing: false, error: e };
  }
}

function globMatch(pattern, file) {
  pattern = String(pattern).replace(/\\/g, "/");
  file = String(file).replace(/\\/g, "/");
  if (pattern === file) return true;
  if (pattern.endsWith("/**")) {
    const prefix = pattern.slice(0, -3);
    if (prefix.endsWith("/")) {
      return file === prefix.slice(0, -1) || file.startsWith(prefix);
    }
    return file.startsWith(prefix + "/") || file === prefix;
  }
  // A trailing slash means "this directory and everything under it". The template
  // documents this form and the DEFAULT shipped sync-rules uses it (feature-registry's
  // `require: ["docs/features/"]`), but it was unimplemented — so that group could never
  // be satisfied and every INITed project carried a permanently false BLOCK
  // (audit 2026-09-05).
  if (pattern.endsWith("/")) return file.startsWith(pattern);
  return false;
}

// Supported pattern forms are deliberately narrow (exact path, `prefix/**`, `prefix/`).
// A wildcard SEGMENT (`packages/*/src/**`, `**/*.ts`, `src/*.ts`) is not supported, and
// silently matching nothing is the wrong failure mode: the project believes it declared a
// rule that never fires. Report such patterns so they fail loudly instead.
function unsupportedPattern(pattern) {
  const p = String(pattern).replace(/\\/g, "/");
  // Strip the ONE supported wildcard (a trailing `/**`) and judge what remains. Testing
  // `endsWith("/**")` first let `packages/*/src/**` through: it ends correctly but carries
  // an unsupported wildcard SEGMENT in the middle, which globMatch cannot honour.
  const stem = p.endsWith("/**") ? p.slice(0, -3) : p;
  return stem.includes("*");
}

function nulPaths(buffer) {
  return String(buffer || "")
    .split("\0")
    .filter(Boolean)
    .map((p) => p.replace(/^\.\//, "").replace(/\\/g, "/"));
}

function porcelainPaths(buffer) {
  const fields = String(buffer || "").split("\0");
  const out = [];
  for (let i = 0; i < fields.length; i++) {
    const entry = fields[i];
    if (!entry || entry.length < 4 || entry[2] !== " ") continue;
    const status = entry.slice(0, 2);
    const file = entry.slice(3);
    if (!file) continue;
    // With porcelain v1 -z, rename/copy entries are destination first, followed
    // by the original path as the next NUL-delimited field.
    out.push(file.replace(/^\.\//, "").replace(/\\/g, "/"));
    if (/[RC]/.test(status)) i++;
  }
  return out;
}

function changedPaths(base) {
  const out = new Set();
  if (base) {
    const r = spawnSync("git", ["diff", "--name-only", "--find-renames", "-z", base + "..HEAD"], { encoding: "buffer" });
    if (r.status === 0) {
      nulPaths(r.stdout).forEach((p) => out.add(p));
    } else {
      return { paths: [], error: `cannot inspect git diff from task-start SHA (${String(r.stderr || "").trim() || "git diff failed"})` };
    }
  }
  // -uall keeps untracked files at file granularity instead of collapsing
  // `?? docs/new.md` into `?? docs/`. -z gives raw UTF-8 names, preserving
  // spaces and non-ASCII characters without relying on git's quote format.
  const r2 = spawnSync("git", ["status", "--porcelain=v1", "-uall", "-z"], { encoding: "buffer" });
  if (r2.status === 0) {
    porcelainPaths(r2.stdout).forEach((p) => out.add(p));
  } else {
    return { paths: [], error: `cannot inspect git status (${String(r2.stderr || "").trim() || "git status failed"})` };
  }
  return { paths: Array.from(out), error: null };
}

if (process.argv.includes("--help") || process.argv.includes("-h")) {
  console.log("Usage:\n  check-sync.js [--json] [--advisory] [--base <sha>]\nCompare the task change set against .governance/sync-rules.json.\nExit 0: synced (or --advisory). Exit 1: unsynced groups (gate mode).");
  process.exit(0);
}

function argValue(name) {
  const i = process.argv.indexOf(name);
  return i >= 0 && i + 1 < process.argv.length ? process.argv[i + 1] : null;
}

const advisory = process.argv.includes("--advisory");
const json = process.argv.includes("--json");

function failClosed(message) {
  if (json) {
    process.stdout.write(JSON.stringify({ clean: false, base: null, unsynced: [], error: message }, null, 2) + "\n");
  } else {
    console.error(`check-sync: ${message}`);
  }
  process.exit(1);
}

const policyResult = readJSON(POLICY);
if (policyResult.error) {
  failClosed(`cannot read .governance/sync-rules.json safely (${policyResult.error.message}) — refusing to proceed`);
}
const policy = policyResult.value;
if (policyResult.missing) {
  if (json) process.stdout.write(JSON.stringify({ clean: true, base: null, unsynced: [] }, null, 2) + "\n");
  else console.error("check-sync: no .governance/sync-rules.json - nothing to check");
  process.exit(0);
}
if (!policy || !Array.isArray(policy.syncGroups)) {
  failClosed("invalid .governance/sync-rules.json shape — refusing to proceed");
}

let base = argValue("--base");
if (!base) {
  const stateResult = readJSON(STATE);
  if (stateResult.error) {
    failClosed(`cannot read .governance/state.json safely (${stateResult.error.message}) — refusing to proceed`);
  }
  const st = stateResult.value;
  if (!stateResult.missing && (!st || typeof st !== "object" || Array.isArray(st))) {
    failClosed("invalid .governance/state.json shape — refusing to proceed");
  }
  base = st && st.task_start_sha ? st.task_start_sha : null;
}
if (!base) {
  const r = spawnSync("git", ["rev-parse", "HEAD"], { encoding: "utf8" });
  if (r.status === 0) base = String(r.stdout || "").trim() || null;
}
if (!base) {
  console.error("check-sync: cannot determine task-start SHA (no state.json task_start_sha, no --base, no git HEAD)");
  process.exit(1);
}

const changedResult = changedPaths(base);
if (changedResult.error) failClosed(changedResult.error);
const changed = changedResult.paths;
const unsynced = [];
const badPatterns = [];
for (const g of policy.syncGroups) {
  const watch = g.watch || [];
  const require = g.require || [];
  for (const p of [...watch, ...require]) {
    if (unsupportedPattern(p)) badPatterns.push({ group: g.name, pattern: p });
  }
  const hit = watch.some((p) => changed.some((f) => globMatch(p, f)));
  if (!hit) continue;
  const synced = require.some((p) => changed.some((f) => globMatch(p, f)));
  if (!synced) unsynced.push({ group: g.name, watch, require });
}

// Append to .governance/drift-report.json under `sync` (runtime output, git-ignored,
// optional: never let a report-write failure change the check result).
try {
  const driftPath = path.join(process.cwd(), ".governance", "drift-report.json");
  const drift = fs.existsSync(driftPath) ? JSON.parse(fs.readFileSync(driftPath, "utf8")) : {};
  drift.sync = {
    base,
    clean: unsynced.length === 0,
    unsynced: unsynced.map((u) => u.group),
    checked_at: new Date().toISOString(),
  };
  fs.mkdirSync(path.dirname(driftPath), { recursive: true });
  fs.writeFileSync(driftPath, JSON.stringify(drift, null, 2) + "\n");
} catch (e) {
  if (process.env.DEBUG) console.error(`[DEBUG] drift-report.json not updated: ${e.message}`);
}

if (json) {
  process.stdout.write(JSON.stringify({ clean: unsynced.length === 0 && badPatterns.length === 0, base, unsynced, unsupportedPatterns: badPatterns }, null, 2) + "\n");
  process.exit((unsynced.length === 0 && badPatterns.length === 0) || advisory ? 0 : 1);
}

// An unsupported pattern is a rule that can never fire — reporting "synced" for it would
// be a false assurance, so it blocks like an unsynced group.
if (badPatterns.length > 0) {
  console.error("check-sync: BLOCKED - unsupported pattern form (wildcard segments are not supported):");
  for (const b of badPatterns) {
    console.error(`  ${b.group}: ${b.pattern}  — use an exact path, "prefix/**" or "prefix/"`);
  }
  if (!advisory) process.exit(1);
}

if (unsynced.length === 0) {
  console.log("check-sync: synced");
  process.exit(0);
}

console.error("check-sync: BLOCKED - unsynced groups:");
for (const u of unsynced) {
  console.error(`  ${u.group}  watch=${u.watch.join(",")}  require=${u.require.join(",")}`);
}
console.error("Update the required files for each unsynced group before declaring done.");
process.exit(advisory ? 0 : 1);
