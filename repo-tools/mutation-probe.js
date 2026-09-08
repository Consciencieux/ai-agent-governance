#!/usr/bin/env node
// Mutation probe — repo-only, on-demand assurance that the test suite's ASSERTIONS are
// still alive, not merely that the tests load and run.
//
// Why this exists: the gate group proves mechanical conditions (a file is registered, a
// path resolves, a marker is present). None of it proves a test would go red if the code
// it covers were broken. A large test migration (v1.0.1's monolith split) can preserve
// every test NAME, load cleanly and stay green while an assertion quietly went vacuous —
// the migration that motivated this tool lost a `spawnSync` import and was caught only
// because the missing symbol threw. A weakened assertion would not have thrown.
//
// What it does: clones the repo to a temp dir, breaks ONE behaviour of a target script at
// a time (never a test file), runs the suite, and records whether the suite noticed. A
// mutation the suite fails to notice is a SURVIVOR — a coverage hole in the assertions.
//
// What it is NOT: exhaustive. The matrix is a hand-picked sample covering the highest-
// value behaviours; a green run means "no survivor among the sampled mutations", never
// "the suite is complete". Treat a survivor as a real finding; do not treat a clean run
// as proof of full coverage.
//
// Safety: all work happens in a temp clone. The working tree is never written to. Each
// mutation is reverted and the revert is byte-verified before the next one starts.
//
// Exit: 0 when every mutation was killed (or was skipped as unanchored); 1 when at least
// one mutation SURVIVED, or when the baseline is not green. Advisory in spirit but
// fail-closed on survivors, so it can gate a refactor when the author chooses to run it.
//
// Usage: node repo-tools/mutation-probe.js [--json] [--only <label-prefix>] [--keep]

const fs = require("fs");
const os = require("os");
const path = require("path");
const crypto = require("crypto");
const { spawnSync } = require("child_process");

const ROOT = (() => {
  // Resolve the repository from the CWD, not from __filename: deriving it from the script's
  // own location silently breaks the moment the file is copied or moved (the self-test that
  // runs a modified copy from a temp dir hit exactly this — the clone source became the temp
  // dir and every mutation reported a clone failure instead of a result).
  const top = spawnSync("git", ["rev-parse", "--show-toplevel"], { encoding: "utf8" });
  if (top.status === 0) {
    const p = String(top.stdout).trim();
    if (p && fs.existsSync(path.join(p, "tests", "run-tests.js"))) return p;
  }
  const fallback = path.dirname(path.dirname(__filename));
  if (fs.existsSync(path.join(fallback, "tests", "run-tests.js"))) return fallback;
  console.error("mutation-probe: cannot locate the repository (no tests/run-tests.js found) — run it from inside the repo");
  process.exit(1);
})();
const argv = process.argv.slice(2);
const asJson = argv.includes("--json");
const keep = argv.includes("--keep");
const onlyIdx = argv.indexOf("--only");
const only = onlyIdx >= 0 ? argv[onlyIdx + 1] : null;
if (onlyIdx >= 0 && (!only || only.startsWith("--"))) {
  console.error("--only requires a label prefix (e.g. --only V1)");
  process.exit(1);
}

// Each mutation names the BEHAVIOUR it removes, so a survivor reads as a coverage
// statement ("nothing asserts X") rather than as a diff. `find` must be anchored tightly
// enough that a refactor makes it MISS (reported as unanchored) instead of silently
// corrupting an unrelated line.
const MUTATIONS = [
  {
    label: "V1",
    behaviour: "validator enforces manifest release tag === v + version",
    file: "scripts/verify_governance.js",
    find: /tag === "v" \+ /,
    repl: 'tag !== "v" + ',
  },
  {
    label: "V2",
    behaviour: "validator checks that a declared artifact actually exists",
    file: "scripts/verify_governance.js",
    find: /function isFile\(/,
    repl: "function isFile(_x){return true;}\nfunction isFileUnused(",
  },
  {
    label: "S1",
    behaviour: "check-sync fails closed (exit 1) on malformed policy/state",
    file: "scripts/check-sync.js",
    find: /process\.exit\(1\)/g,
    repl: "process.exit(0)",
  },
  {
    label: "P1",
    behaviour: "check-plan-delivery verifies behavioural declarations",
    file: "repo-tools/check-plan-delivery.js",
    find: /function verifyBehaviours\(/,
    repl: "function verifyBehaviours(){return [];}\nfunction verifyBehavioursUnused(",
  },
  {
    label: "G1",
    behaviour: "generate-governance filters artifacts by phase",
    file: "scripts/generate-governance.js",
    find: /return idx >= 0 && idx <= maxPhaseIdx;/,
    repl: "return idx >= 0;",
  },
  {
    label: "SEC1",
    behaviour: "check-secrets fails closed (exit 1) when a secret is staged",
    file: "scripts/check-secrets.js",
    find: /process\.exit\(1\)/g,
    repl: "process.exit(0)",
  },
];

function sha(s) { return crypto.createHash("sha256").update(s).digest("hex"); }

function runSuite(cwd) {
  const r = spawnSync(process.execPath, ["tests/run-tests.js"], {
    cwd, encoding: "utf8", timeout: 1800000,
  });
  const out = r.stdout || "";
  const failed = [];
  for (const line of out.split(/\r?\n/)) {
    const m = /^\u2717 (.+)$/.exec(line);
    if (m) failed.push(m[1]);
  }
  const sum = /(\d+)\/(\d+) tests passed, (\d+) skipped/.exec(out);
  return { exit: r.status, failed, summary: sum ? sum[0] : "(no summary line)" };
}

function say(s) { if (!asJson) console.log(s); }

// ---- clone ----
const tmpRoot = fs.mkdtempSync(path.join(os.tmpdir(), "mutation-probe-"));
const clone = path.join(tmpRoot, "repo");
const cl = spawnSync("git", ["clone", "-q", "--no-hardlinks", ROOT, clone], { encoding: "utf8" });
if (cl.status !== 0) {
  const msg = "clone failed: " + String(cl.stderr || "").trim();
  if (asJson) console.log(JSON.stringify({ pass: false, error: msg }, null, 2));
  else console.error(msg);
  process.exit(1);
}
say("mutation probe — working in " + clone);
say("(the working tree is never modified)\n");

let exitCode = 0;
const results = [];

try {
  // ---- baseline: a mutation result is meaningless if the suite is not green first ----
  const base = runSuite(clone);
  say("baseline: " + base.summary + "  exit=" + base.exit);
  if (base.exit !== 0) {
    const msg = "baseline is not green (" + base.failed.length + " failing) — fix the suite before probing";
    say("\n" + msg);
    if (asJson) console.log(JSON.stringify({ pass: false, error: msg, failed: base.failed }, null, 2));
    process.exit(1);
  }
  say("");

  const selected = only ? MUTATIONS.filter((m) => m.label.startsWith(only)) : MUTATIONS;
  if (only && selected.length === 0) {
    const msg = "--only " + only + " matched no mutation label";
    if (asJson) console.log(JSON.stringify({ pass: false, error: msg }, null, 2));
    else console.error(msg);
    process.exit(1);
  }

  for (const m of selected) {
    const target = path.join(clone, m.file);
    if (!fs.existsSync(target)) {
      results.push({ label: m.label, behaviour: m.behaviour, status: "target-missing", killed: null });
      say("- " + m.label + "  target missing: " + m.file);
      continue;
    }
    const orig = fs.readFileSync(target, "utf8");
    const before = sha(orig);
    const mutated = orig.replace(m.find, m.repl);

    // An unanchored mutation is a defect in THIS tool (the code moved), not a pass.
    if (mutated === orig) {
      results.push({ label: m.label, behaviour: m.behaviour, status: "unanchored", killed: null });
      say("- " + m.label + "  UNANCHORED — pattern no longer matches " + m.file + " (update the matrix)");
      exitCode = 1;
      continue;
    }

    fs.writeFileSync(target, mutated);
    let run;
    try {
      run = runSuite(clone);
    } finally {
      fs.writeFileSync(target, orig);
      const after = sha(fs.readFileSync(target, "utf8"));
      if (after !== before) {
        // Never leave a half-reverted clone behind a result claim.
        throw new Error("restore verification failed for " + m.file);
      }
    }

    const killed = run.exit !== 0;
    if (!killed) exitCode = 1;
    results.push({
      label: m.label,
      behaviour: m.behaviour,
      status: killed ? "killed" : "SURVIVED",
      killed,
      failingTests: run.failed.length,
      sample: run.failed.slice(0, 3),
    });
    say((killed ? "killed   " : "SURVIVED ") + m.label + "  " + m.behaviour);
    if (killed) say("          " + run.failed.length + " test(s) went red — e.g. " + (run.failed[0] || "").slice(0, 78));
    else say("          nothing in the suite noticed — assertions do not cover this behaviour");
  }

  const real = results.filter((r) => r.killed !== null);
  const survivors = real.filter((r) => !r.killed);
  const unanchored = results.filter((r) => r.status === "unanchored");

  if (asJson) {
    console.log(JSON.stringify({
      pass: exitCode === 0,
      baseline: base.summary,
      mutations: results.length,
      killed: real.filter((r) => r.killed).length,
      survived: survivors.length,
      unanchored: unanchored.length,
      results,
      note: "a clean run means no survivor among the sampled mutations — not full coverage",
    }, null, 2));
  } else {
    say("\n" + real.filter((r) => r.killed).length + "/" + real.length + " sampled mutations killed"
      + (survivors.length ? " · " + survivors.length + " SURVIVED" : "")
      + (unanchored.length ? " · " + unanchored.length + " unanchored" : ""));
    if (survivors.length) {
      say("\nsurvivors (no assertion covers these):");
      survivors.forEach((s) => say("  - " + s.label + "  " + s.behaviour));
    }
    say("\nsampled probe: a clean run says no survivor among these mutations, not that the suite is complete.");
  }
} finally {
  if (keep) {
    say("\nclone kept at " + clone);
  } else {
    try { fs.rmSync(tmpRoot, { recursive: true, force: true }); } catch (e) { /* temp dir */ }
  }
}

process.exit(exitCode);
