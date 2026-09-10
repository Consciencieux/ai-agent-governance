#!/usr/bin/env node
// INSTALLED evaluator — CTRL-0006 Relative markdown link validity (consistency cluster #4).
// Semantic evaluation only: broken relative links → verdict fail.
// Scan-set policy (which files) lives HERE; link extract/resolve/exists live in md-link-facts.
// Advisory/deny is NOT decided here (consistency shell keeps cluster #4 advisory-only).
// Node builtins + relative require of INSTALLED siblings only.

"use strict";

const { createMdLinkFacts } = require("../lib/md-link-facts.js");

const CONTROL_ID = "CTRL-0006";

/**
 * Gen1 consistency scan set for link validity (preserved characterization).
 * Skill-repo extras (references/, design-decisions/, archive/) no-op when absent.
 */
function discoverScanFiles(root, facts) {
  const out = [];
  const top = ["README.md", "CONTRIBUTING.md", "SKILL.md", "AGENTS.md"];
  for (const f of top) if (facts.existsRel(f)) out.push(f);
  const docs = facts.join("docs");
  if (facts.existsAbs(docs)) {
    for (const lang of ["en", "zh-CN", "zh-TW"]) {
      const dir = facts.join("docs", lang);
      if (facts.existsAbs(dir)) {
        for (const rel of facts.walkMd(dir)) {
          out.push(("docs/" + lang + "/" + rel).replace(/\\/g, "/"));
        }
      }
    }
    for (const rel of facts.walkMd(docs)) {
      const normalized = rel.replace(/\\/g, "/");
      if (normalized.startsWith("design-decisions/") || normalized.startsWith("archive/")) {
        out.push(("docs/" + normalized).replace(/\\/g, "/"));
      }
    }
  }
  const refs = facts.join("references");
  if (facts.existsAbs(refs)) {
    for (const rel of facts.walkMd(refs)) {
      if (rel.endsWith(".md")) out.push(("references/" + rel).replace(/\\/g, "/"));
    }
  }
  return out;
}

/**
 * @returns {{
 *   control: string,
 *   applicable: boolean,
 *   verdict: "pass"|"fail"|"indeterminate",
 *   evidence: { broken_links: string[], scanned: number }
 * }}
 */
function evaluateBrokenLinks(options) {
  const root = (options && options.root) || process.cwd();
  const facts = (options && options.facts) || createMdLinkFacts(root);
  const files = discoverScanFiles(root, facts);
  const broken = [];

  for (const f of files) {
    const c = facts.readFile(f);
    if (!c) continue;
    for (const t of facts.extractRelativeTargets(c)) {
      if (!facts.existsAbs(facts.resolveFrom(f, t))) {
        broken.push(`${f} -> ${t}`);
      }
    }
  }

  return {
    control: CONTROL_ID,
    applicable: true,
    verdict: broken.length > 0 ? "fail" : "pass",
    evidence: { broken_links: broken, scanned: files.length },
  };
}

module.exports = {
  CONTROL_ID,
  discoverScanFiles,
  evaluateBrokenLinks,
};
