#!/usr/bin/env node
// PAYLOAD SCRIPT — copied standalone into governed projects (references/init-spec.json).
// Keep it self-contained: Node builtins only, never require() a sibling module.
// Git Policy Check — read-only. Verifies the current branch/state against .governance/git-policy.json.
// Usage: node scripts/check-git-policy.js [--json]
// Exit 0: safe to proceed. Exit 1: currently on a protected branch with directPush=false —
// create a feature branch (feature/agent-<date>-<summary>) before modifying/committing.

const fs = require("fs");
const path = require("path");
const { spawnSync } = require("child_process");

const POLICY = path.join(process.cwd(), ".governance", "git-policy.json");

const REQUIRED_GITIGNORE_PATTERNS = [".env", ".env.*", "!.env.example", "*.key", "*.pem", "*.p12", "*.pfx", "credentials.json", "secrets.*"];

function gitignoreBaseline() {
  try {
    const content = fs.readFileSync(path.join(process.cwd(), ".gitignore"), "utf8");
    const lines = new Set(content.split(/\r?\n/).map((line) => line.trim()).filter(Boolean));
    const missing = REQUIRED_GITIGNORE_PATTERNS.filter((pattern) => !lines.has(pattern));
    return { present: true, missing, ok: missing.length === 0 };
  } catch (e) {
    return { present: false, missing: REQUIRED_GITIGNORE_PATTERNS.slice(), ok: false };
  }
}

function readPolicy() {
  try {
    return { policy: JSON.parse(fs.readFileSync(POLICY, "utf8")), missing: false, error: null };
  } catch (e) {
    if (e.code === "ENOENT") return { policy: null, missing: true, error: null };
    return { policy: null, missing: false, error: e };
  }
}

function currentBranch() {
  const r = spawnSync("git", ["branch", "--show-current"], { encoding: "utf8" });
  if (r.status !== 0) return null;
  return String(r.stdout || "").trim() || null;
}

if (process.argv.includes("--help") || process.argv.includes("-h")) {
  console.log(`Usage:
  check-git-policy.js [--json]   Check current branch against .governance/git-policy.json (read-only)
Exit codes: 0 safe to proceed · 1 on a protected branch with directPush=false (create a feature branch first)`);
  process.exit(0);
}

const policyResult = readPolicy();
if (policyResult.error) {
  const message = `cannot read .governance/git-policy.json safely (${policyResult.error.message})`;
  if (process.argv.includes("--json")) {
    process.stdout.write(JSON.stringify({ policyPresent: true, currentBranch: currentBranch(), protectedBranches: [], directPush: false, blocked: true, error: message }, null, 2) + "\n");
  } else {
    console.error(`check-git-policy: ${message} — refusing to proceed`);
  }
  process.exit(1);
}

const policy = policyResult.policy;
const branch = currentBranch();
const policyShapeValid =
  policyResult.missing ||
  (policy &&
    Array.isArray(policy.protectedBranches) &&
    typeof policy.directPush === "boolean" &&
    typeof policy.requireReview === "boolean" &&
    typeof policy.allowForcePush === "boolean");
if (!policyShapeValid) {
  const message = "invalid .governance/git-policy.json shape — refusing to proceed";
  if (process.argv.includes("--json")) {
    process.stdout.write(JSON.stringify({ policyPresent: true, currentBranch: branch, protectedBranches: [], directPush: false, blocked: true, error: message }, null, 2) + "\n");
  } else {
    console.error(`check-git-policy: ${message}`);
  }
  process.exit(1);
}

const protectedBranches = policy ? policy.protectedBranches : [];
const directPush = policy ? policy.directPush : true;
const baseline = gitignoreBaseline();
const branchBlocked = branch !== null && protectedBranches.includes(branch) && !directPush;
const blocked = branchBlocked || (!policyResult.missing && !baseline.ok);

if (process.argv.includes("--json")) {
  process.stdout.write(
    JSON.stringify(
      {
        policyPresent: policy !== null,
        currentBranch: branch,
        protectedBranches,
        directPush,
        blocked,
        branchBlocked,
        gitignoreBaseline: baseline,
      },
      null,
      2
    ) + "\n"
  );
  process.exit(blocked ? 1 : 0);
}

if (!policy) {
  console.log("no .governance/git-policy.json — policy absent, proceed");
  process.exit(0);
}
if (!baseline.ok) {
  console.error(`BLOCKED: .gitignore is missing required sensitive-file patterns: ${baseline.missing.join(", ")}`);
  process.exit(1);
}
if (branchBlocked) {
  console.error(
    `BLOCKED: current branch "${branch}" is protected and directPush=false — ` +
      `create a feature branch (feature/agent-<date>-<summary>) before modifying/committing`
  );
  process.exit(1);
}
console.log(`policy ok — branch "${branch || "(detached)"}" not blocked`);
process.exit(0);
