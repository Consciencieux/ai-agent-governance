#!/usr/bin/env node
// PAYLOAD SCRIPT — copied standalone into governed projects (references/init-spec.json).
// Keep it self-contained: Node builtins only, never require() a sibling module.
// Doc Freshness Check — read-only. Flags governance docs gone stale relative to code
// activity, and translations gone stale relative to their source doc. Uses git commit
// dates (git log -1 --format=%cs / %ct), NOT filesystem mtime — fresh clones have all
// mtimes equal to checkout time.
// Usage: node scripts/check-doc-freshness.js [--json] [--release-gate]
// Exit code: 0 in the default advisory mode (stale docs are a signal, not a defect).
// With --release-gate, a stale or draft TRANSLATION exits 1 — shipping a release whose
// translations lag the canonical source is a release-blocking defect.

const fs = require("fs");
const path = require("path");
const { spawnSync } = require("child_process");

const ROOT = process.cwd();
const CODE_DIRS = ["src", "app", "packages", "lib", "core"]; // code activity signal
const STALE_DAYS = 30;
const VERY_STALE_DAYS = 90;

// Governance docs to check (relative to repo root). Structure-adaptive: prefer the
// manifest's doc_root when available.
function docCandidates() {
  const docs = [
    "docs/ARCHITECTURE.md",
    "CHANGELOG.md",
    "docs/features",
    "docs/plans",
    "docs/rules",
    "README.md",
  ];
  try {
    const m = JSON.parse(fs.readFileSync(path.join(ROOT, ".governance", "manifest.json"), "utf8"));
    const dr = typeof m.doc_root === "string" ? m.doc_root.trim().replace(/[\\/]+$/, "") : "";
    // Containment: a crafted doc_root (absolute, drive-relative "C:docs", ".."-escaping)
    // must not redirect the scan outside the project tree.
    const driveRelative = /^[A-Za-z]:/.test(dr);
    if (dr && dr !== "docs" && !path.isAbsolute(dr) && !driveRelative && !dr.split(/[\\/]/).includes("..")) {
      return docs.map((d) => d.replace(/^docs\//, dr + "/"));
    }
  } catch (e) {
    if (process.env.DEBUG) console.error(`[DEBUG] manifest unreadable: ${e.message}`);
  }
  return docs;
}

function git(args) {
  return spawnSync("git", args, { cwd: ROOT, encoding: "utf8" });
}

function daysSince(dateStr) {
  if (!dateStr) return null;
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return null;
  return Math.floor((Date.now() - d.getTime()) / 86400000);
}

// Days since the last commit touching the given path (null if path never committed).
function lastCommitDaysAgo(target) {
  const r = git(["log", "-1", "--format=%cs", "--", target]);
  if (r.status !== 0 || !r.stdout.trim()) return null;
  return daysSince(r.stdout.trim());
}

// Is there any code commit more recent than `sinceDaysAgo`?
function codeActiveSince(daysAgo) {
  if (daysAgo === null || daysAgo === undefined) return false;
  const since = new Date(Date.now() - daysAgo * 86400000).toISOString().slice(0, 10);
  for (const dir of CODE_DIRS) {
    const r = git(["log", "-1", `--since=${since}`, "--", dir]);
    if (r.status === 0 && r.stdout.trim()) return true;
  }
  return false;
}

// ---------------------------------------------------------------------------
// Translation freshness — derived, never declared. 简体中文 is the canonical source
// (docs/zh-CN/**); docs/en/** and docs/zh-TW/** are translations of the same relative
// path. Status comes from git, so there is no manifest to keep in sync: a handwritten
// translation registry would just be one more file that drifts.
// ---------------------------------------------------------------------------
const SOURCE_LANG = "zh-CN";
const TARGET_LANGS = ["en", "zh-TW"];

// Commit timestamp (unix seconds) of the last commit touching a path; null if never committed.
function lastCommitAt(target) {
  const r = git(["log", "-1", "--format=%ct", "--", target]);
  if (r.status !== 0 || !r.stdout.trim()) return null;
  const n = parseInt(r.stdout.trim(), 10);
  return Number.isFinite(n) ? n : null;
}

// A source doc edited but not yet committed makes every translation stale by definition:
// git log alone cannot see the pending edit.
function hasUncommittedChange(rel) {
  const r = git(["status", "--porcelain=v1", "--", rel]);
  return r.status === 0 && String(r.stdout || "").trim() !== "";
}

// Translations may declare themselves draft in a leading HTML comment. Draft is the
// documented exception for in-flight work: tolerated day to day, blocked at release.
function isDraft(abs) {
  try {
    const head = fs.readFileSync(abs, "utf8").split(/\r?\n/).slice(0, 10).join("\n");
    return /<!--\s*i18n-status:\s*draft\s*-->/i.test(head);
  } catch {
    return false;
  }
}

// A translation may legitimately be older than its source: the source commit may have
// changed only what was ALREADY correct in the translation (this repo hit exactly that —
// zh-CN/zh-TW were realigned to a trigger the en doc already carried). Timestamps alone
// cannot tell "not yet translated" from "nothing to translate", and a checker must not
// invent that judgement. Reviewed pairs are therefore recorded explicitly, keyed to the
// source commit they were verified against; anything else stays stale until a human says
// otherwise. The key lives in the TRANSLATION file, so the record travels with the text.
function reviewedAgainst(abs) {
  try {
    const head = fs.readFileSync(abs, "utf8").split(/\r?\n/).slice(0, 10).join("\n");
    const m = head.match(/<!--\s*i18n-reviewed:\s*([0-9a-f]{7,40})\s*-->/i);
    return m ? m[1] : null;
  } catch {
    return null;
  }
}

// The recorded review commit must be an ancestor-or-equal of the source's latest commit
// (merge-base, so a descendant or unrelated SHA can never claim coverage) AND nothing may
// have touched the source since it. Any git failure (bogus/ambiguous SHA) fails closed.
function reviewCoversSource(srcRel, reviewSha) {
  const latestR = git(["log", "-1", "--format=%H", "--", srcRel]);
  if (latestR.status !== 0 || !latestR.stdout.trim()) return false;
  const latest = latestR.stdout.trim();
  const anc = git(["merge-base", "--is-ancestor", reviewSha, latest]);
  if (anc.status !== 0) return false; // bogus SHA, not an ancestor, or ambiguous
  const since = git(["log", `${reviewSha}..${latest}`, "--format=%H", "--", srcRel]);
  return since.status === 0 && String(since.stdout || "").trim() === "";
}

function walkMd(dir, base = dir) {
  const out = [];
  let entries;
  try {
    entries = fs.readdirSync(dir, { withFileTypes: true });
  } catch {
    return out;
  }
  for (const e of entries) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) out.push(...walkMd(p, base));
    else if (e.name.endsWith(".md")) out.push(path.relative(base, p).replace(/\\/g, "/"));
  }
  return out;
}

// Where do the translations of a source doc live? Normal docs pair with the same
// relative path in each target tree. The root landing files are the exception documented
// by the language policy: the root README.md / CONTRIBUTING.md ARE the English entry
// points (docs/en/ does not duplicate them), so they pair with the zh-CN originals.
function translationTargets(rel) {
  if (rel === "README.md" || rel === "CONTRIBUTING.md") {
    return [rel, `docs/zh-TW/${rel}`];
  }
  return TARGET_LANGS.map((lang) => `docs/${lang}/${rel}`);
}

// Compare each source doc with its translations. Returns [] when the trilingual layout
// is absent (governed projects), so the payload stays a no-op there.
function translationFreshness() {
  const srcDir = path.join(ROOT, "docs", SOURCE_LANG);
  if (!fs.existsSync(srcDir)) return [];
  const results = [];
  for (const rel of walkMd(srcDir)) {
    const srcRel = `docs/${SOURCE_LANG}/${rel}`;
    const srcAt = lastCommitAt(srcRel);
    const srcDirty = hasUncommittedChange(srcRel);
    for (const tRel of translationTargets(rel)) {
      const tAbs = path.join(ROOT, tRel);
      if (!fs.existsSync(tAbs)) continue; // missing files are the parity check's job
      const draft = isDraft(tAbs);
      const tAt = lastCommitAt(tRel);
      const tDirty = hasUncommittedChange(tRel);
      const reviewSha = reviewedAgainst(tAbs);
      let status = "translated";
      let why = "";
      if (draft) {
        status = "draft";
        why = "marked <!-- i18n-status: draft -->";
      } else if (srcDirty && tDirty) {
        // The documented workflow edits source and translations in ONE changeset; the
        // pair is in flight together, not lagging. Blocking here would false-fail every
        // pre-commit release-gate run of a normal doc task.
        status = "translated";
        why = "source and translation updated together (uncommitted changeset)";
      } else if (srcDirty) {
        status = "stale";
        why = "source has uncommitted changes";
      } else if (tAt === null) {
        // An untracked translation is part of SOMEONE'S in-flight changeset by definition
        // (it cannot have been shipped) — visible as its own status, but not a gate
        // block: if it never gets committed, the parity gate flags the missing file.
        status = "uncommitted";
        why = "translation exists but was never committed";
      } else if (tDirty) {
        status = "translated";
        why = "translation has uncommitted changes (newer than source)";
      } else if (reviewSha && reviewCoversSource(srcRel, reviewSha)) {
        status = "translated";
        why = `reviewed against ${reviewSha}`;
      } else if (reviewSha && !reviewCoversSource(srcRel, reviewSha)) {
        // A recorded marker that no longer covers the source must fail closed — a stale
        // "reviewed" stamp is exactly the drift this check exists to surface.
        status = "stale";
        why = `review marker ${reviewSha} no longer covers the current source`;
      } else if (srcAt !== null && srcAt > tAt) {
        status = "stale";
        why = "source committed after translation";
      } else if (srcAt !== null && tAt !== null && srcAt === tAt) {
        // Same commit proves synchronized delivery, NOT translation correctness — the
        // terminology gate and human review own that claim.
        status = "translated";
        why = "synchronized commit";
      } else if (srcAt === null) {
        status = "stale";
        why = "source was never committed";
      }
      results.push({ source: srcRel, translation: tRel, status, why });
    }
  }
  return results;
}

function main() {
  const json = process.argv.includes("--json");
  const releaseGate = process.argv.includes("--release-gate");
  const stale = [];
  const veryStale = [];
  const fresh = [];

  for (const doc of docCandidates()) {
    // Skip paths that exist only in git history but not on disk (ghost paths)
    if (!fs.existsSync(path.join(ROOT, doc))) continue;
    const days = lastCommitDaysAgo(doc);
    if (days === null) continue; // never committed or path absent — skip
    if (codeActiveSince(days)) {
      if (days >= VERY_STALE_DAYS) veryStale.push(doc);
      else if (days >= STALE_DAYS) stale.push(doc);
      else fresh.push(doc);
    } else {
      fresh.push(doc); // code not active either — not stale
    }
  }

  const translations = translationFreshness();
  const staleTranslations = translations.filter((t) => t.status === "stale");
  const draftTranslations = translations.filter((t) => t.status === "draft");
  const report = { timestamp: new Date().toISOString(), stale, veryStale, fresh, translations, staleTranslations: staleTranslations.length, draftTranslations: draftTranslations.length };

  // Append to drift-report.json if it exists (runtime output, optional)
  const driftPath = path.join(ROOT, ".governance", "drift-report.json");
  try {
    const drift = JSON.parse(fs.readFileSync(driftPath, "utf8"));
    drift.freshness = { stale, veryStale, checkedAt: report.timestamp };
    drift.translationFreshness = { stale: staleTranslations, draft: draftTranslations, checkedAt: report.timestamp };
    fs.writeFileSync(driftPath, JSON.stringify(drift, null, 2) + "\n");
  } catch (e) {
    if (process.env.DEBUG) console.error(`[DEBUG] drift-report.json not updated: ${e.message}`);
  }

  if (json) {
    process.stdout.write(JSON.stringify(report, null, 2) + "\n");
  } else {
    for (const d of veryStale) console.log(`⚠️  very stale (${d})`);
    for (const d of stale) console.log(`⚠️  stale (${d})`);
    if (stale.length + veryStale.length === 0) console.log("✓ no stale governance docs");
    for (const t of staleTranslations) console.log(`⚠️  stale translation: ${t.translation} (${t.why})`);
    for (const t of draftTranslations) console.log(`⚠️  draft translation: ${t.translation} (${t.why})`);
    if (translations.length > 0 && staleTranslations.length + draftTranslations.length === 0) {
      console.log(`✓ translations current (${translations.length} pairs)`);
    }
  }
  // Advisory by default; --release-gate blocks on translations lagging the source.
  const blocking = releaseGate && staleTranslations.length + draftTranslations.length > 0;
  process.exit(blocking ? 1 : 0);
}

main();
