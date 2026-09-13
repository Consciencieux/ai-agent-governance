#!/usr/bin/env node
// REPO-ONLY — CONTROL-X runner (PLAN-0049 / H2c / ADR-0020 cross-profile contract).
// Same canonical negative fixture → skill CLI and repo CLI must both fail (exit ≠ 0)
// and must not echo the secret value.
"use strict";

const fs = require("fs");
const os = require("os");
const path = require("path");
const { spawnSync } = require("child_process");

const ROOT = process.cwd();
const DEFAULT_CONTROL = "CTRL-0001";

function assembleAwsExampleKey() {
  // AWS documentation example access-key id — assembled so tracked fixtures stay clean.
  return ["AKIA", "IOSFODNN7EXAMPLE"].join("");
}

function run(cmd, args, opts) {
  return spawnSync(cmd, args, {
    cwd: opts.cwd,
    encoding: "utf8",
    env: opts.env || process.env,
  });
}

function prepareFixtureTree(secretValue) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "control-x-"));
  run("git", ["init", "-q"], { cwd: dir });
  run("git", ["config", "user.email", "control-x@example.com"], { cwd: dir });
  run("git", ["config", "user.name", "control-x"], { cwd: dir });
  const target = path.join(dir, "leak.env");
  fs.writeFileSync(target, `AWS_ACCESS_KEY_ID=${secretValue}\n`, "utf8");
  run("git", ["add", "leak.env"], { cwd: dir });
  return dir;
}

function assertFails(label, cliRel, cwd, secretValue, issues) {
  const cli = path.join(ROOT, cliRel);
  if (!fs.existsSync(cli)) {
    issues.push(`${label}: CLI missing ${cliRel}`);
    return;
  }
  const r = spawnSync(process.execPath, [cli], { cwd, encoding: "utf8" });
  const out = `${r.stdout || ""}${r.stderr || ""}`;
  if (r.status === 0) {
    issues.push(`${label}: expected non-zero exit, got 0 (${cliRel})`);
  }
  if (secretValue && out.includes(secretValue)) {
    issues.push(`${label}: CLI echoed secret value (${cliRel})`);
  }
}

function loadControl(id) {
  const abs = path.join(ROOT, "repo-tools", "controls", `${id}.json`);
  if (!fs.existsSync(abs)) throw new Error(`control file missing: ${id}`);
  return JSON.parse(fs.readFileSync(abs, "utf8"));
}

function main() {
  const gate = process.argv.includes("--gate");
  const json = process.argv.includes("--json");
  const idArg = process.argv.find((a) => a.startsWith("--control="));
  const id = idArg ? idArg.slice("--control=".length) : DEFAULT_CONTROL;
  const issues = [];
  let doc;
  try {
    doc = loadControl(id);
  } catch (e) {
    issues.push(e.message);
    finish(issues, gate, json, id);
    return;
  }
  if (!doc.control_x || !doc.control_x.eligible) {
    issues.push(`${id}: control_x not eligible — refuse to invent a dual-profile run`);
    finish(issues, gate, json, id);
    return;
  }
  const skill = (doc.evaluation_bindings || []).find((b) => b.profile === "skill" && b.cli);
  const repo = (doc.evaluation_bindings || []).find((b) => b.profile === "repo" && b.cli);
  if (!skill || !repo) {
    issues.push(`${id}: need skill + repo CLI bindings for CONTROL-X`);
    finish(issues, gate, json, id);
    return;
  }
  const secretValue = assembleAwsExampleKey();
  const cwd = prepareFixtureTree(secretValue);
  try {
    assertFails("skill", skill.cli, cwd, secretValue, issues);
    assertFails("repo", repo.cli, cwd, secretValue, issues);
  } finally {
    try {
      fs.rmSync(cwd, { recursive: true, force: true });
    } catch {
      /* ignore */
    }
  }
  finish(issues, gate, json, id);
}

function finish(issues, gate, json, id) {
  const gatePass = issues.length === 0;
  if (json) {
    process.stdout.write(JSON.stringify({ control: id, issues, gatePass }, null, 2) + "\n");
  } else if (gatePass) {
    console.log(`✓ control-x: ${id} dual-profile negative fixture fails both CLIs`);
  } else {
    console.log(`✗ control-x (${id}):`);
    for (const i of issues) console.log("  - " + i);
  }
  process.exit(gate && !gatePass ? 1 : 0);
}

main();
