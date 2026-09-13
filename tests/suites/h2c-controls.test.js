#!/usr/bin/env node
// PLAN-0049 / H2c characterization: control registry, CONTROL-X, template responsibility.
"use strict";

const path = require("path");
const { spawnSync } = require("child_process");

const ROOT = path.join(__dirname, "..", "..");

function runGate(script, args = ["--gate"]) {
  const r = spawnSync(process.execPath, [path.join(ROOT, "repo-tools", script), ...args], {
    cwd: ROOT,
    encoding: "utf8",
  });
  if (r.status !== 0) {
    console.error(r.stdout || r.stderr);
    return false;
  }
  return true;
}

module.exports = function register(test) {
  test("control-registry --gate: current CTRL projections pass", () => {
    return runGate("check-control-registry.js");
  });

  test("control-x --gate: CTRL-0001 dual-profile negative fixture", () => {
    return runGate("run-control-x.js", ["--gate", "--control=CTRL-0001"]);
  });

  test("template-responsibility --gate: references/templates fully classified", () => {
    return runGate("check-template-responsibility.js");
  });

  test("portable control-shape leaf exists without CTRL numbers as invariants", () => {
    const fs = require("fs");
    const p = path.join(ROOT, "references", "principles", "control-shape.md");
    if (!fs.existsSync(p)) {
      console.error("missing references/principles/control-shape.md");
      return false;
    }
    const body = fs.readFileSync(p, "utf8");
    if (/CTRL-\d{4}/.test(body) && !/不规定|不抽编号|无本仓编号|not.*CTRL/i.test(body)) {
      console.error("control-shape.md appears to hard-require CTRL numbers");
      return false;
    }
    return /identity|semantic|binding|evidence/i.test(body);
  });
};
