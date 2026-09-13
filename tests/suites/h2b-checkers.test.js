#!/usr/bin/env node
// PLAN-0048 / H2b characterization: plan-status, adr-status, docs-shape, FINDING-0019 EXTRACT discipline.
"use strict";

const fs = require("fs");
const path = require("path");
const { spawnSync } = require("child_process");
const { classifyPlanStatus } = require("../../scripts/lib/plan-status.js");
const { adrStatusFieldClaimsUnreleased, evaluateAdrUnreleasedClaims } = require("../../scripts/lib/adr-status.js");

const ROOT = path.join(__dirname, "..", "..");

module.exports = function register(test) {
  test("plan-status: frontmatter status wins over body Status line", () => {
    const md = "---\nid: PLAN-9999\nstatus: Archived\n---\n\n# X\n\n> **Status:** Design\n";
    return classifyPlanStatus(md) === "archived";
  });

  test("plan-status: Active frontmatter is recognized", () => {
    const md = "---\nstatus: Active\n---\n\n# X\n";
    return classifyPlanStatus(md) === "active";
  });

  test("FINDING-0011: body [Unreleased] does not claim ADR Unreleased", () => {
    const body =
      "---\nstatus: Accepted\n---\n\n# ADR\n\nDiscuss CHANGELOG `[Unreleased]` section boundaries.\n";
    if (adrStatusFieldClaimsUnreleased(body)) return false;
    const hits = evaluateAdrUnreleasedClaims({
      adrBodies: [{ path: "ADR-0012.md", content: body }],
      releasedVersions: ["2.0.0"],
    });
    return hits.length === 0;
  });

  test("FINDING-0011: Status field Unreleased still flags", () => {
    const body = "---\nstatus: Unreleased\n---\n\n# ADR\n";
    return adrStatusFieldClaimsUnreleased(body) === true;
  });

  test("FINDING-0019: consistency requires extracted plan-status and adr-status libs", () => {
    const src = fs.readFileSync(path.join(ROOT, "scripts", "check-doc-consistency.js"), "utf8");
    if (!/require\(["']\.\/lib\/plan-status\.js["']\)/.test(src)) {
      console.error("  missing plan-status require");
      return false;
    }
    if (!/require\(["']\.\/lib\/adr-status\.js["']\)/.test(src)) {
      console.error("  missing adr-status require");
      return false;
    }
    // Must not re-inline the full-text Unreleased ADR scan (the old defect).
    if (/if\s*\(\s*\/Unreleased\|未发布/i.test(src)) {
      console.error("  re-inlined Unreleased full-text ADR scan");
      return false;
    }
    return true;
  });

  test("docs-shape --gate: current docs/ tree passes", () => {
    const r = spawnSync(process.execPath, [path.join(ROOT, "repo-tools", "check-docs-shape.js"), "--gate"], {
      cwd: ROOT,
      encoding: "utf8",
    });
    if (r.status !== 0) {
      console.error(r.stdout || r.stderr);
      return false;
    }
    return true;
  });

  test("roadmap-sync --gate: current tree passes (FINDING-0021)", () => {
    const r = spawnSync(process.execPath, [path.join(ROOT, "repo-tools", "check-roadmap-sync.js"), "--gate"], {
      cwd: ROOT,
      encoding: "utf8",
    });
    if (r.status !== 0) {
      console.error(r.stdout || r.stderr);
      return false;
    }
    return true;
  });
};
