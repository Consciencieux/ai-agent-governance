#!/usr/bin/env node
// PAYLOAD SCRIPT — copied standalone into governed projects (references/init-spec.json).
// Keep it self-contained: Node builtins only, never require() a sibling module.
//
// Modes:
//   (default)     read-only: report whether a lock is held (state.json and/or agent.lock)
//   --acquire     atomic create .governance/agent.lock (flag wx) + mirror into state.json
//   --release     remove agent.lock if owner matches; clear state.locked when matching
//
// Usage:
//   node scripts/check-lock.js [--json]
//   node scripts/check-lock.js --acquire --agent <id> [--task <id>] [--json]
//   node scripts/check-lock.js --release --agent <id> [--json]
// Exit 0: unlocked / acquire ok / release ok · Exit 1: locked / acquire race / error

const fs = require("fs");
const path = require("path");

const ROOT = process.cwd();
const GOV = path.join(ROOT, ".governance");
const STATE = path.join(GOV, "state.json");
const LOCK_FILE = path.join(GOV, "agent.lock");

function printHelp() {
  console.log(`Usage:
  check-lock.js [--json]                              Read whether a lock is held
  check-lock.js --acquire --agent <id> [--task <id>]  Atomically acquire lock (wx)
  check-lock.js --release --agent <id>                Release if owner matches
Exit: 0 unlocked/ok · 1 held/race/error`);
}

function ensureGovDir() {
  fs.mkdirSync(GOV, { recursive: true });
}

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
  if (v === null || v === undefined || v === false || (typeof v === "string" && v.trim() === "")) return null;
  return v;
}

function readLockFile() {
  try {
    return { lock: JSON.parse(fs.readFileSync(LOCK_FILE, "utf8")), error: null };
  } catch (e) {
    if (e.code === "ENOENT") return { lock: null, error: null };
    return { lock: null, error: e };
  }
}

function safe(v) {
  return String(typeof v === "string" ? v : JSON.stringify(v))
    .replace(/[\u0000-\u001f\u007f-\u009f\u2028\u2029]/g, "?")
    .slice(0, 60);
}

function argValue(flag) {
  const i = process.argv.indexOf(flag);
  if (i < 0 || i + 1 >= process.argv.length) return null;
  return process.argv[i + 1];
}

function emitJson(obj, code) {
  process.stdout.write(JSON.stringify(obj, null, 2) + "\n");
  process.exit(code);
}

if (process.argv.includes("--help") || process.argv.includes("-h")) {
  printHelp();
  process.exit(0);
}

const wantJson = process.argv.includes("--json");
const doAcquire = process.argv.includes("--acquire");
const doRelease = process.argv.includes("--release");

if (doAcquire && doRelease) {
  console.error("check-lock: --acquire and --release are mutually exclusive");
  process.exit(1);
}

if (doAcquire) {
  const agent = argValue("--agent");
  if (!agent) {
    console.error("check-lock: --acquire requires --agent <id>");
    process.exit(1);
  }
  const task = argValue("--task") || null;
  ensureGovDir();
  const payload = {
    agent_id: agent,
    task_id: task,
    acquired_at: new Date().toISOString(),
    pid: process.pid,
  };
  try {
    fs.writeFileSync(LOCK_FILE, JSON.stringify(payload, null, 2) + "\n", { flag: "wx" });
  } catch (e) {
    if (e.code === "EEXIST") {
      const held = readLockFile().lock;
      if (wantJson) {
        emitJson({ ok: false, locked: true, lock: held, error: "lock already held" }, 1);
      }
      console.error(
        `check-lock: acquire failed — LOCK HELD by ${safe(held && held.agent_id)} (atomic wx)`
      );
      process.exit(1);
    }
    console.error(`check-lock: acquire failed (${e.message})`);
    process.exit(1);
  }
  // Mirror into state.json (best-effort; agent.lock is the atomic authority).
  let state = {};
  const rs = readState();
  if (rs.state && typeof rs.state === "object" && !Array.isArray(rs.state)) state = { ...rs.state };
  state.locked = agent;
  state.agent_id = agent;
  if (task) state.task_id = task;
  try {
    fs.writeFileSync(STATE, JSON.stringify(state, null, 2) + "\n");
  } catch (e) {
    // Lock file already exclusive; warn but keep acquire success.
    if (!wantJson) console.error(`check-lock: warning — could not mirror state.json (${e.message})`);
  }
  if (wantJson) emitJson({ ok: true, locked: true, lock: payload }, 0);
  console.log(`check-lock: acquired by ${safe(agent)}`);
  process.exit(0);
}

if (doRelease) {
  const agent = argValue("--agent");
  if (!agent) {
    console.error("check-lock: --release requires --agent <id>");
    process.exit(1);
  }
  const lf = readLockFile();
  if (lf.error) {
    console.error(`check-lock: cannot read agent.lock (${lf.error.message})`);
    process.exit(1);
  }
  if (!lf.lock) {
    if (wantJson) emitJson({ ok: true, locked: false, lock: null }, 0);
    console.log("check-lock: no agent.lock — nothing to release");
    process.exit(0);
  }
  if (lf.lock.agent_id !== agent) {
    if (wantJson) emitJson({ ok: false, locked: true, lock: lf.lock, error: "owner mismatch" }, 1);
    console.error(
      `check-lock: release refused — held by ${safe(lf.lock.agent_id)}, not ${safe(agent)}`
    );
    process.exit(1);
  }
  try {
    fs.unlinkSync(LOCK_FILE);
  } catch (e) {
    console.error(`check-lock: release failed (${e.message})`);
    process.exit(1);
  }
  const rs = readState();
  if (rs.state && typeof rs.state === "object" && !Array.isArray(rs.state)) {
    if (rs.state.locked === agent || rs.state.agent_id === agent) {
      const next = { ...rs.state, locked: null };
      try {
        fs.writeFileSync(STATE, JSON.stringify(next, null, 2) + "\n");
      } catch {
        /* ignore */
      }
    }
  }
  if (wantJson) emitJson({ ok: true, locked: false, lock: null }, 0);
  console.log(`check-lock: released by ${safe(agent)}`);
  process.exit(0);
}

// ---- read-only check (default) ----
const fileLock = readLockFile();
if (fileLock.error) {
  const message = `cannot read .governance/agent.lock safely (${fileLock.error.message})`;
  if (wantJson) emitJson({ locked: true, lock: null, agentId: null, taskId: null, error: message }, 1);
  console.error(`check-lock: ${message} — refusing to proceed`);
  process.exit(1);
}

const stateResult = readState();
if (stateResult.error) {
  const message = `cannot read .governance/state.json safely (${stateResult.error.message})`;
  if (wantJson) emitJson({ locked: true, lock: null, agentId: null, taskId: null, error: message }, 1);
  console.error(`check-lock: ${message} — refusing to proceed`);
  process.exit(1);
}

const state = stateResult.state;
if (!stateResult.missing && (!state || typeof state !== "object" || Array.isArray(state))) {
  const message = "invalid .governance/state.json shape — refusing to proceed";
  if (wantJson) emitJson({ locked: true, lock: null, agentId: null, taskId: null, error: message }, 1);
  console.error(`check-lock: ${message}`);
  process.exit(1);
}

const stateLock = lockedValue(state);
const lock = fileLock.lock
  ? fileLock.lock.agent_id || fileLock.lock
  : stateLock;

if (wantJson) {
  emitJson(
    {
      locked: lock !== null,
      lock,
      agentId: fileLock.lock ? fileLock.lock.agent_id : state ? state.agent_id : null,
      taskId: fileLock.lock ? fileLock.lock.task_id : state ? state.task_id : null,
      atomic_lock_file: Boolean(fileLock.lock),
    },
    lock !== null ? 1 : 0
  );
}

if (!state && !fileLock.lock) {
  console.log("no .governance lock artifacts — no lock held");
  process.exit(0);
}
if (lock === null) {
  console.log("no lock held");
  process.exit(0);
}

console.error(
  `LOCK HELD by ${safe(lock)}` +
    ` (agent_id: ${safe(
      (fileLock.lock && fileLock.lock.agent_id) || (state && state.agent_id) || "?"
    )}, task_id: ${safe(
      (fileLock.lock && fileLock.lock.task_id) || (state && state.task_id) || "?"
    )})` +
    ` — wait or coordinate; do NOT modify the same files in parallel`
);
process.exit(1);
