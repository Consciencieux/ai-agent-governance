// PLAN-0053 Stage 1 — FINDING-0003 closing-condition-3 remainder:
// remaining judgment classes must be explicitly labeled in authority bodies
// (judgment vs mechanical). No new mechanical checkers in this slice.
"use strict";

const fs = require("fs");
const path = require("path");

const ROOT = path.join(__dirname, "..", "..");

function read(rel) {
  return fs.readFileSync(path.join(ROOT, rel), "utf8");
}

/** Each class: id + file + substrings that must all appear (case-sensitive). */
const CLASSES = [
  {
    id: "1-machinery-test",
    file: "references/policies/coding.policy.md",
    must: ["judgment", "FINDING-0003", "机制测试"],
  },
  {
    id: "2-dual-domain",
    file: "references/capabilities/root-cause-repair.md",
    must: ["judgment", "双域"],
  },
  {
    id: "3-sibling-closure",
    file: "references/capabilities/root-cause-repair.md",
    must: ["judgment", "mechanical", "sibling"],
  },
  {
    id: "4-control-plane",
    file: "references/capabilities/root-cause-repair.md",
    must: ["judgment", "控制面"],
  },
  {
    id: "5-evidence-tiers",
    file: "references/policies/lifecycle.policy.md",
    must: ["judgment", "FINDING-0003", "证据等级", "mechanical"],
  },
  {
    id: "6-failure-budget",
    file: "references/capabilities/root-cause-repair.md",
    must: ["judgment", "失败预算"],
  },
  {
    id: "7-rule-capture",
    file: "references/capabilities/rule-capture.md",
    must: ["judgment", "5a"],
  },
  {
    id: "8-impact-face",
    file: "references/policies/lifecycle.policy.md",
    must: ["judgment", "FINDING-0003", "影响面"],
  },
];

module.exports = function register(test) {
  test("finding-0003: enforcement-semantics principle still declares judgment/mechanical split", () => {
    const body = read("references/principles/enforcement-semantics.md");
    for (const needle of ["judgment", "mechanical", "四值"]) {
      if (!body.includes(needle)) {
        console.error(`  missing ${needle} in enforcement-semantics.md`);
        return false;
      }
    }
    return true;
  });

  for (const c of CLASSES) {
    test(`finding-0003: class ${c.id} labeled in ${c.file}`, () => {
      if (!fs.existsSync(path.join(ROOT, c.file))) {
        console.error(`  missing file ${c.file}`);
        return false;
      }
      const body = read(c.file);
      const missing = c.must.filter((n) => !body.includes(n));
      if (missing.length) {
        console.error(`  ${c.id}: missing ${missing.join(", ")}`);
        return false;
      }
      return true;
    });
  }
};
