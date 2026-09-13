#!/usr/bin/env node
// PLAN-0050 / H2d characterization — consent evaluator + atomic lock acquire.
"use strict";

const fs = require("fs");
const os = require("os");
const path = require("path");
const { spawnSync } = require("child_process");

const ROOT = path.join(__dirname, "..", "..");
const CONSENT = path.join(ROOT, "scripts", "check-git-consent.js");
const LOCK = path.join(ROOT, "scripts", "check-lock.js");
const {
  evaluateGitWriteConsent,
} = require(path.join(ROOT, "scripts", "evaluators", "ctrl-0002-git-write-consent.js"));

function tmp(name) {
  return fs.mkdtempSync(path.join(os.tmpdir(), `h2d-${name}-`));
}

module.exports = function register(test) {
  test("CTRL-0002: git status is allow", () => {
    const r = evaluateGitWriteConsent({ argv: ["git", "status"] });
    return r.decision_effect === "allow" && r.verdict === "pass";
  });

  test("CTRL-0002: git push requires consent", () => {
    const r = evaluateGitWriteConsent({ argv: ["push", "origin", "HEAD"] });
    return r.decision_effect === "require_consent" && r.verdict === "indeterminate";
  });

  test("CTRL-0002: force push is independent consent class", () => {
    const r = evaluateGitWriteConsent({ argv: ["git", "push", "--force"] });
    const seq = r.evidence.sequences[0];
    return r.decision_effect === "require_consent" && seq.class === "independent";
  });

  test("check-git-consent CLI: status exits 0; push exits 2", () => {
    const a = spawnSync(process.execPath, [CONSENT, "--", "git", "status"], {
      encoding: "utf8",
    });
    const b = spawnSync(process.execPath, [CONSENT, "--json", "--", "git", "push"], {
      encoding: "utf8",
    });
    if (a.status !== 0) {
      console.error(a.stdout || a.stderr);
      return false;
    }
    if (b.status !== 2) {
      console.error(b.stdout || b.stderr);
      return false;
    }
    const body = JSON.parse(b.stdout);
    return body.decision_effect === "require_consent";
  });

  test("check-lock --acquire is atomic (second acquire fails)", () => {
    const dir = tmp("lock-acq");
    const r1 = spawnSync(
      process.execPath,
      [LOCK, "--acquire", "--agent", "a1", "--task", "t1"],
      { cwd: dir, encoding: "utf8" }
    );
    const r2 = spawnSync(
      process.execPath,
      [LOCK, "--acquire", "--agent", "a2", "--task", "t2"],
      { cwd: dir, encoding: "utf8" }
    );
    const check = spawnSync(process.execPath, [LOCK, "--json"], { cwd: dir, encoding: "utf8" });
    if (r1.status !== 0) {
      console.error(r1.stderr || r1.stdout);
      return false;
    }
    if (r2.status === 0) {
      console.error("second acquire should fail");
      return false;
    }
    const body = JSON.parse(check.stdout);
    return body.locked === true && body.atomic_lock_file === true && check.status === 1;
  });

  test("check-lock --release only by owner", () => {
    const dir = tmp("lock-rel");
    spawnSync(process.execPath, [LOCK, "--acquire", "--agent", "owner"], {
      cwd: dir,
      encoding: "utf8",
    });
    const bad = spawnSync(process.execPath, [LOCK, "--release", "--agent", "other"], {
      cwd: dir,
      encoding: "utf8",
    });
    const ok = spawnSync(process.execPath, [LOCK, "--release", "--agent", "owner"], {
      cwd: dir,
      encoding: "utf8",
    });
    const check = spawnSync(process.execPath, [LOCK], { cwd: dir, encoding: "utf8" });
    return bad.status === 1 && ok.status === 0 && check.status === 0;
  });
};
