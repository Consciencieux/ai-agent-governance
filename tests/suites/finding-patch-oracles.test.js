// Narrow Finding patches: CTRL-0006 negative oracles (not full coverage).
// FINDING-0016/0017 mechanical slices retired with FINDING-0035 (narration / numeric_claims).
"use strict";

const fs = require("fs");
const os = require("os");
const path = require("path");

const ROOT = path.join(__dirname, "..", "..");
const { runBrokenLinks } = require("../../scripts/lib/doc-consistency/broken-links.js");
const { evaluateBrokenLinks } = require("../../scripts/evaluators/ctrl-0006-broken-links.js");
const { createMdLinkFacts } = require("../../scripts/lib/md-link-facts.js");

module.exports = (test) => {
  test("CTRL-0006: broken relative link → evaluator fail (0006 negative oracle)", () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), "ctrl0006-"));
    fs.writeFileSync(path.join(dir, "README.md"), "See [gap](./no-such-file.md).\n");
    const r = evaluateBrokenLinks({ root: dir, facts: createMdLinkFacts(dir) });
    const broken = (r.evidence && (r.evidence.broken_links || r.evidence.brokenLinks)) || [];
    if (r.verdict !== "fail" || !broken.length) {
      console.error("  expected fail with broken_links, got", r);
      return false;
    }
    return true;
  });

  test("CTRL-0006: broken link enters gateIssues under anyGate (CLI binding)", () => {
    const issues = { broken_links: [] };
    const gateIssues = [];
    runBrokenLinks({
      createMdLinkFacts: () => ({}),
      evaluateBrokenLinks: () => ({ evidence: { broken_links: ["README.md -> ./missing.md"] } }),
      ROOT: ROOT,
      issues,
      gateIssues,
      anyGate: true,
    });
    if (!gateIssues.some((g) => g.kind === "broken_links")) {
      console.error("  expected gateIssues broken_links, got", gateIssues);
      return false;
    }
    return true;
  });
};
