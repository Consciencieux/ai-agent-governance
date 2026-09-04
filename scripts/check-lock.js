#!/usr/bin/env node
// PAYLOAD SCRIPT — copied standalone into governed projects (references/init-spec.json).
// Keep it self-contained: Node builtins only, never require() a sibling module.
// Lock Check — read-only. Verifies no other agent holds a lock in .governance/state.json.
// Usage: node scripts/check-lock.js [--json]
// Exit 0: no lock held (or no state yet). Exit 1: a lock is held — wait or coordinate,
// do NOT modify the same files in parallel (SKILL.md: Multi-agent coordination).

const fs = require("fs");
const path = require("path");

const STATE = path.join(process.cwd(), ".governance", "state.json");

function readState() {
  try {
    return { state: JSON.parse(fs.readFileSync(STATE, "utf8")), missing: false, error: null };
  } catch (e) {
    if (e.code === "ENOENT") return { state: null, missing: true, error: null };
    return { state: null, missing: false, error: e };
  }
}

function lockedValue(state) {
  if (!state) return null;
  const v = state.locked;
  // `false`, an empty string, and the undefined/null family mean "no lock held";
  // any other value is treated as held so malformed-but-parseable state fails closed.
  if (v === null || v === undefined || v === false || (typeof v === "string" && v.trim() === "")) return null;
  return v;
}

if (process.argv.includes("--help") || process.argv.includes("-h")) {
  console.log(`Usage:
  check-lock.js [--json]   Check .governance/state.json for a held lock (read-only)
Exit codes: 0 no lock held · 1 lock held by another agent`);
  process.exit(0);
}

const stateResult = readState();
if (stateResult.error) {
  const message = `cannot read .governance/state.json safely (${stateResult.error.message})`;
  if (process.argv.includes("--json")) {
    process.stdout.write(JSON.stringify({ locked: true, lock: null, agentId: null, taskId: null, error: message }, null, 2) + "\n");
  } else {
    console.error(`check-lock: ${message} — refusing to proceed`);
  }
  process.exit(1);
}

const state = stateResult.state;
if (!stateResult.missing && (!state || typeof state !== "object" || Array.isArray(state))) {
  const message = "invalid .governance/state.json shape — refusing to proceed";
  if (process.argv.includes("--json")) {
    process.stdout.write(JSON.stringify({ locked: true, lock: null, agentId: null, taskId: null, error: message }, null, 2) + "\n");
  } else {
    console.error(`check-lock: ${message}`);
  }
  process.exit(1);
}
const lock = lockedValue(state);

if (process.argv.includes("--json")) {
  process.stdout.write(
    JSON.stringify({ locked: lock !== null, lock, agentId: state ? state.agent_id : null, taskId: state ? state.task_id : null }, null, 2) + "\n"
  );
  process.exit(lock !== null ? 1 : 0);
}

if (!state) {
  console.log("no .governance/state.json — no lock held");
  process.exit(0);
}
if (lock === null) {
  console.log("no lock held");
  process.exit(0);
}

// State-supplied strings reach the terminal: ANSI escapes could repaint "LOCK HELD" as
// released, so every interpolated field is stripped and bounded, not just the lock value.
const safe = (v) => String(typeof v === "string" ? v : JSON.stringify(v))
  .replace(/[\u0000-\u001f\u007f-\u009f\u2028\u2029]/g, "?")
  .slice(0, 60);

console.error(
  `LOCK HELD by ${safe(lock)}` +
    ` (agent_id: ${safe(state.agent_id || "?")}, task_id: ${safe(state.task_id || "?")})` +
    ` — wait or coordinate; do NOT modify the same files in parallel`
);
process.exit(1);
