#!/usr/bin/env node
/**
 * Must-ship mechanical gate set (Phase 8 / PLAN-0044 / ADR-0024).
 * Fail-closed. Does NOT run full Gen1 `npm run check`.
 * Node carrier — portable across Windows / macOS / Linux (no bash).
 */
"use strict";

const fs = require("fs");
const path = require("path");
const { spawnSync } = require("child_process");

const ROOT = path.resolve(__dirname, "..");

const SYNTAX_ROOTS = [
  "scripts",
  "repo-tools",
  "tests/suites",
  "tests/support",
  "tests/run-tests.js",
];

const SUITES = [
  "security",
  "generator",
  "payload",
  "repo-gates",
  "oracle-inventory",
  "script-inventory",
  "routing",
  "capability-enforcement",
];

function fail(msg, code = 1) {
  console.error(`must-ship: ${msg}`);
  process.exit(code);
}

function walkJs(abs, out) {
  let st;
  try {
    st = fs.statSync(abs);
  } catch {
    fail(`syntax root missing: ${path.relative(ROOT, abs)}`);
  }
  if (st.isFile()) {
    if (abs.endsWith(".js")) out.push(abs);
    return;
  }
  if (!st.isDirectory()) return;
  for (const ent of fs.readdirSync(abs, { withFileTypes: true })) {
    walkJs(path.join(abs, ent.name), out);
  }
}

function run(label, args) {
  console.log(`== must-ship: ${label} ==`);
  const r = spawnSync(process.execPath, args, {
    cwd: ROOT,
    encoding: "utf8",
    stdio: "inherit",
  });
  if (r.error) fail(`${label}: ${r.error.message}`);
  if (r.status !== 0) process.exit(r.status == null ? 1 : r.status);
}

console.log("== must-ship: JS syntax ==");
const files = [];
for (const rel of SYNTAX_ROOTS) {
  walkJs(path.join(ROOT, rel), files);
}
files.sort();
for (const f of files) {
  const r = spawnSync(process.execPath, ["--check", f], {
    cwd: ROOT,
    encoding: "utf8",
  });
  if (r.error) fail(`node --check: ${r.error.message}`);
  if (r.status !== 0) {
    if (r.stderr) process.stderr.write(r.stderr);
    if (r.stdout) process.stdout.write(r.stdout);
    process.exit(r.status == null ? 1 : r.status);
  }
}

for (const suite of SUITES) {
  run(suite, ["tests/run-tests.js", "--suite", suite]);
}

run("carrier presence", ["repo-tools/check-must-ship-carriers.js"]);

console.log("== must-ship: OK ==");
