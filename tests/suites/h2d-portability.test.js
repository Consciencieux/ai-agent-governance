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
const SIBLING = path.join(ROOT, "scripts", "check-sibling-closure.js");
const MIGRATE = path.join(ROOT, "scripts", "migrate-governance.js");
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

  test("sibling-closure: SC-CTRL-0002 allow when instances present", () => {
    const r = spawnSync(
      process.execPath,
      [SIBLING, "--json", "--dir", path.join(ROOT, "repo-tools", "contracts")],
      { cwd: ROOT, encoding: "utf8" }
    );
    if (r.status !== 0) {
      console.error(r.stdout || r.stderr);
      return false;
    }
    const body = JSON.parse(r.stdout);
    return body.decision === "allow" && body.results.some((x) => x.id === "SC-CTRL-0002");
  });

  test("sibling-closure: missing instance is deny (negative fixture)", () => {
    const dir = tmp("sib-neg");
    const cdir = path.join(dir, "contracts");
    fs.mkdirSync(cdir, { recursive: true });
    fs.writeFileSync(
      path.join(cdir, "SC-NEG.json"),
      JSON.stringify({
        id: "SC-NEG",
        marking: "mechanical",
        enforcement: "deny",
        instances: [
          { path: "present.js" },
          { path: "missing-sibling.js" },
        ],
      })
    );
    fs.writeFileSync(path.join(dir, "present.js"), "ok\n");
    const r = spawnSync(
      process.execPath,
      [SIBLING, "--json", "--dir", cdir],
      { cwd: dir, encoding: "utf8" }
    );
    if (r.status === 0) {
      console.error("expected deny");
      return false;
    }
    const body = JSON.parse(r.stdout);
    return (
      body.decision === "deny" &&
      body.results[0].missing.some((m) => m.path === "missing-sibling.js")
    );
  });

  test("migrate-governance: upgrade advised when behind", () => {
    const dir = tmp("mig");
    fs.mkdirSync(path.join(dir, ".governance"), { recursive: true });
    fs.writeFileSync(
      path.join(dir, ".governance", "manifest.json"),
      JSON.stringify({ governance_version: "1.0.0" })
    );
    fs.writeFileSync(path.join(dir, "package.json"), JSON.stringify({ version: "2.0.0" }));
    const r = spawnSync(process.execPath, [MIGRATE, "--json"], {
      cwd: dir,
      encoding: "utf8",
    });
    if (r.status !== 2) {
      console.error(r.stdout || r.stderr);
      return false;
    }
    const body = JSON.parse(r.stdout);
    return body.status === "upgrade_advised" && body.current === "1.0.0" && body.expect === "2.0.0";
  });

  test("migrate-governance: current when versions match", () => {
    const dir = tmp("mig-ok");
    fs.mkdirSync(path.join(dir, ".governance"), { recursive: true });
    fs.writeFileSync(
      path.join(dir, ".governance", "manifest.json"),
      JSON.stringify({ governance_version: "2.0.0" })
    );
    const r = spawnSync(process.execPath, [MIGRATE, "--json", "--expect", "2.0.0"], {
      cwd: dir,
      encoding: "utf8",
    });
    if (r.status !== 0) {
      console.error(r.stdout || r.stderr);
      return false;
    }
    const body = JSON.parse(r.stdout);
    return body.status === "current";
  });

  test("portability-boundary.v0: layers+actions reconcile FINDING-0007 slice", () => {
    const p = path.join(ROOT, "repo-tools", "portability-boundary.v0.json");
    const doc = JSON.parse(fs.readFileSync(p, "utf8"));
    const layerIds = new Set((doc.layers || []).map((l) => l.id));
    const requiredLayers = ["portable_core", "repo_deterministic", "host_adapter"];
    if (!requiredLayers.every((id) => layerIds.has(id))) return false;
    const host = (doc.layers || []).find((l) => l.id === "host_adapter");
    if (!host || host.distribution !== "opt_in") return false;
    const actions = doc.actions || [];
    const shipped = actions.filter((a) => a.status === "shipped");
    const later = actions.filter((a) => a.status === "later");
    if (shipped.length < 3 || later.length < 1) return false;
    if (!later.every((a) => a.hard_across_tools === false)) return false;
    const toolCall = actions.find((a) => a.action === "tool_call_before_write");
    return (
      toolCall &&
      toolCall.status === "later" &&
      Array.isArray(doc.invariants) &&
      doc.invariants.length >= 3 &&
      doc.finding === "FINDING-0007"
    );
  });

  test("REPO-ONLY router proof: route-task not INIT-installed (FINDING-0004/0005)", () => {
    const init = JSON.parse(fs.readFileSync(path.join(ROOT, "references", "init-spec.json"), "utf8"));
    const blob = JSON.stringify(init);
    if (/route-task|routing-graph\.v0\.json|repo-tools\/lib\/routing/.test(blob)) {
      console.error("INIT spec must not install Task→Capability router");
      return false;
    }
    const router = path.join(ROOT, "repo-tools", "route-task.js");
    const graph = path.join(ROOT, "repo-tools", "routing-graph.v0.json");
    return fs.existsSync(router) && fs.existsSync(graph);
  });

  test("tool-surface-layers.v0: L0–L4 stated; L3 not 2.1 must-install (FINDING-0014)", () => {
    const p = path.join(ROOT, "repo-tools", "tool-surface-layers.v0.json");
    const doc = JSON.parse(fs.readFileSync(p, "utf8"));
    const ids = new Set((doc.layers || []).map((l) => l.id));
    if (!["L0", "L1", "L2", "L3", "L4"].every((id) => ids.has(id))) return false;
    const l3 = (doc.layers || []).find((l) => l.id === "L3");
    return l3 && l3.must_install_for_2_1 === false && doc.finding === "FINDING-0014";
  });

  test("FINDING-0016/0017 slice: narration + metadata-projection carriers exist", () => {
    return (
      fs.existsSync(path.join(ROOT, "repo-tools", "check-changelog-narration.js")) &&
      fs.existsSync(path.join(ROOT, "repo-tools", "check-metadata-projection.js"))
    );
  });
};
