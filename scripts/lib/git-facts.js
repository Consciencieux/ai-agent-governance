#!/usr/bin/env node
// INSTALLED helper — copied into governed projects with check-doc-freshness.js.
// Pure factual git/path/date operations. No Control policy (no stale thresholds,
// no translation rules, no advisory/deny decisions).
// Node builtins only.

"use strict";

const fs = require("fs");
const path = require("path");
const { spawnSync } = require("child_process");

function createGitFacts(root) {
  const ROOT = root;

  function git(args) {
    return spawnSync("git", args, { cwd: ROOT, encoding: "utf8" });
  }

  function daysSince(dateStr, nowMs) {
    if (!dateStr) return null;
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return null;
    const now = nowMs === undefined ? Date.now() : nowMs;
    return Math.floor((now - d.getTime()) / 86400000);
  }

  function lastCommitDaysAgo(target, nowMs) {
    const r = git(["log", "-1", "--format=%cs", "--", target]);
    if (r.status !== 0 || !r.stdout.trim()) return null;
    return daysSince(r.stdout.trim(), nowMs);
  }

  function lastCommitAt(target) {
    const r = git(["log", "-1", "--format=%ct", "--", target]);
    if (r.status !== 0 || !r.stdout.trim()) return null;
    const n = parseInt(r.stdout.trim(), 10);
    return Number.isFinite(n) ? n : null;
  }

  function lastCommitHash(target) {
    const r = git(["log", "-1", "--format=%H", "--", target]);
    if (r.status !== 0 || !r.stdout.trim()) return null;
    return r.stdout.trim();
  }

  function hasUncommittedChange(rel) {
    const r = git(["status", "--porcelain=v1", "--", rel]);
    return r.status === 0 && String(r.stdout || "").trim() !== "";
  }

  function codeActiveSince(daysAgo, codeDirs, nowMs) {
    if (daysAgo === null || daysAgo === undefined) return false;
    const now = nowMs === undefined ? Date.now() : nowMs;
    const since = new Date(now - daysAgo * 86400000).toISOString().slice(0, 10);
    for (const dir of codeDirs) {
      const r = git(["log", "-1", `--since=${since}`, "--", dir]);
      if (r.status === 0 && r.stdout.trim()) return true;
    }
    return false;
  }

  function reviewCoversSource(srcRel, reviewSha) {
    const latest = lastCommitHash(srcRel);
    if (!latest) return false;
    const anc = git(["merge-base", "--is-ancestor", reviewSha, latest]);
    if (anc.status !== 0) return false;
    const since = git(["log", `${reviewSha}..${latest}`, "--format=%H", "--", srcRel]);
    return since.status === 0 && String(since.stdout || "").trim() === "";
  }

  function walkMd(dir, base) {
    const out = [];
    let entries;
    try {
      entries = fs.readdirSync(dir, { withFileTypes: true });
    } catch {
      return out;
    }
    const root = base === undefined ? dir : base;
    for (const e of entries) {
      const p = path.join(dir, e.name);
      if (e.isDirectory()) out.push(...walkMd(p, root));
      else if (e.name.endsWith(".md")) out.push(path.relative(root, p).replace(/\\/g, "/"));
    }
    return out;
  }

  function exists(rel) {
    return fs.existsSync(path.join(ROOT, rel));
  }

  function readHeadLines(abs, n) {
    try {
      return fs.readFileSync(abs, "utf8").split(/\r?\n/).slice(0, n).join("\n");
    } catch {
      return null;
    }
  }

  return {
    root: ROOT,
    git,
    daysSince,
    lastCommitDaysAgo,
    lastCommitAt,
    lastCommitHash,
    hasUncommittedChange,
    codeActiveSince,
    reviewCoversSource,
    walkMd,
    exists,
    readHeadLines,
    join: (...parts) => path.join(ROOT, ...parts),
  };
}

module.exports = { createGitFacts };
