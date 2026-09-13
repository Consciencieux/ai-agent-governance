// Narrow Finding patches: 0006 / 0016 / 0017 — one negative oracle each (not full coverage).
"use strict";

const fs = require("fs");
const os = require("os");
const path = require("path");
const { spawnSync } = require("child_process");

const ROOT = path.join(__dirname, "..", "..");
const { runBrokenLinks } = require("../../scripts/lib/doc-consistency/broken-links.js");
const { runNumericClaims } = require("../../scripts/lib/doc-consistency/numeric-claims.js");
const { checkChangelogNarration } = require("../../repo-tools/check-changelog-narration.js");
const { evaluateBrokenLinks } = require("../../scripts/evaluators/ctrl-0006-broken-links.js");
const { createMdLinkFacts } = require("../../scripts/lib/md-link-facts.js");

function tmpFile(name, body) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "finding-patch-"));
  const file = path.join(dir, name);
  fs.writeFileSync(file, body);
  return file;
}

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

  test("changelog narration: mutation-verified in Unreleased fails --gate (0016)", () => {
    const file = tmpFile(
      "CHANGELOG.md",
      [
        "# Changelog",
        "",
        "## [Unreleased]",
        "",
        "### Changed",
        "",
        "- **Bad entry** — mutation-verified before merge.",
        "",
        "## [1.0.0] - 2026-01-01",
        "",
        "### Added",
        "",
        "- old",
        "",
      ].join("\n")
    );
    const r = checkChangelogNarration({ file });
    if (r.ok) {
      console.error("  expected narration hit, got clean", r);
      return false;
    }
    const cli = spawnSync(
      process.execPath,
      [path.join(ROOT, "repo-tools", "check-changelog-narration.js"), "--gate", "--file", file],
      { encoding: "utf8" }
    );
    if (cli.status !== 1) {
      console.error("  expected exit 1, got", cli.status, cli.stdout, cli.stderr);
      return false;
    }
    return true;
  });

  test("changelog narration: clean Unreleased exits 0 under --gate", () => {
    const file = tmpFile(
      "CHANGELOG.md",
      [
        "# Changelog",
        "",
        "## [Unreleased]",
        "",
        "### Changed",
        "",
        "- **Good entry** — document the fail-closed narration marker for Unreleased.",
        "",
      ].join("\n")
    );
    const cli = spawnSync(
      process.execPath,
      [path.join(ROOT, "repo-tools", "check-changelog-narration.js"), "--gate", "--file", file],
      { encoding: "utf8" }
    );
    if (cli.status !== 0) {
      console.error("  expected exit 0, got", cli.status, cli.stdout, cli.stderr);
      return false;
    }
    return true;
  });

  test("ADR-0010 numeric_claims: wrong N checks enters gateIssues (0017)", () => {
    const issues = { numeric_claims: [] };
    const gateIssues = [];
    runNumericClaims({
      path,
      readFile: (p) => {
        if (String(p).endsWith("verify_governance.js") || String(p).endsWith("verify-governance.js")) {
          return 'const DEFAULTS = [\n  ["a"],\n  ["b"],\n];\n';
        }
        if (String(p).endsWith("README.md")) return "This repo runs 99 checks on every push.\n";
        return "";
      },
      ROOT: "/tmp",
      issues,
      gateIssues,
      anyGate: true,
    });
    if (!issues.numeric_claims.length || !gateIssues.some((g) => g.kind === "numeric_claims")) {
      console.error("  expected numeric_claims gate hit", issues, gateIssues);
      return false;
    }
    return true;
  });
};
