#!/usr/bin/env node
// INSTALLED helper — shared Markdown-link factual primitives.
// Pure: extract targets, resolve relative paths, existence.
// No scan-set policy, no advisory/deny, no Control identity.
// Node builtins only.

"use strict";

const fs = require("fs");
const path = require("path");

const LINK_RE = /\[[^\]]*\]\(([^)#]+)(?:#[^)]*)?\)/g;
const EXTERNAL_LINK_RE = /^(https?:\/\/|mailto:)/i;

function createMdLinkFacts(root) {
  const ROOT = root;

  function walkMd(dir, base) {
    const out = [];
    let entries;
    try {
      entries = fs.readdirSync(dir, { withFileTypes: true });
    } catch {
      return out;
    }
    const rootBase = base === undefined ? dir : base;
    for (const e of entries) {
      const p = path.join(dir, e.name);
      if (e.isDirectory()) out.push(...walkMd(p, rootBase));
      else if (e.name.endsWith(".md")) out.push(path.relative(rootBase, p).replace(/\\/g, "/"));
    }
    return out.sort();
  }

  function readFile(relOrAbs) {
    const abs = path.isAbsolute(relOrAbs) ? relOrAbs : path.join(ROOT, relOrAbs);
    try {
      return fs.readFileSync(abs, "utf8");
    } catch {
      return null;
    }
  }

  /** Relative markdown link targets only (skips http(s):// and mailto:). */
  function extractRelativeTargets(content) {
    const out = [];
    if (!content) return out;
    LINK_RE.lastIndex = 0;
    let m;
    while ((m = LINK_RE.exec(content))) {
      const t = m[1];
      if (EXTERNAL_LINK_RE.test(t)) continue;
      out.push(t);
    }
    return out;
  }

  function resolveFrom(sourceRel, target) {
    return path.resolve(path.dirname(path.join(ROOT, sourceRel)), target);
  }

  function existsAbs(abs) {
    return fs.existsSync(abs);
  }

  function existsRel(rel) {
    return fs.existsSync(path.join(ROOT, rel));
  }

  return {
    root: ROOT,
    walkMd,
    readFile,
    extractRelativeTargets,
    resolveFrom,
    existsAbs,
    existsRel,
    join: (...parts) => path.join(ROOT, ...parts),
  };
}

module.exports = { createMdLinkFacts, LINK_RE, EXTERNAL_LINK_RE };
