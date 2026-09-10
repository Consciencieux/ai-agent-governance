#!/usr/bin/env node
// INSTALLED evaluator — CTRL-0004 Translation freshness.
// Translation/draft/review policy and release-gate deny live HERE.
// Shared git facts come from lib/git-facts.js (no stale-day policy).
// Node builtins + relative require of INSTALLED siblings only.

"use strict";

const { createGitFacts } = require("../lib/git-facts.js");

const CONTROL_ID = "CTRL-0004";
const SOURCE_LANG = "zh-CN";
const TARGET_LANGS = ["en", "zh-TW"];

function isDraft(facts, abs) {
  const head = facts.readHeadLines(abs, 10);
  if (head === null) return false;
  return /<!--\s*i18n-status:\s*draft\s*-->/i.test(head);
}

function reviewedAgainst(facts, abs) {
  const head = facts.readHeadLines(abs, 10);
  if (head === null) return null;
  const m = head.match(/<!--\s*i18n-reviewed:\s*([0-9a-f]{7,40})\s*-->/i);
  return m ? m[1] : null;
}

function translationTargets(rel) {
  if (rel === "README.md" || rel === "CONTRIBUTING.md") {
    return [rel, `docs/zh-TW/${rel}`];
  }
  return TARGET_LANGS.map((lang) => `docs/${lang}/${rel}`);
}

function translationFreshness(facts) {
  const srcDir = facts.join("docs", SOURCE_LANG);
  if (!facts.exists(`docs/${SOURCE_LANG}`)) return [];
  const results = [];
  for (const rel of facts.walkMd(srcDir)) {
    const srcRel = `docs/${SOURCE_LANG}/${rel}`;
    const srcAt = facts.lastCommitAt(srcRel);
    const srcDirty = facts.hasUncommittedChange(srcRel);
    for (const tRel of translationTargets(rel)) {
      const tAbs = facts.join(tRel);
      if (!facts.exists(tRel)) continue;
      const draft = isDraft(facts, tAbs);
      const tAt = facts.lastCommitAt(tRel);
      const tDirty = facts.hasUncommittedChange(tRel);
      const reviewSha = reviewedAgainst(facts, tAbs);
      let status = "translated";
      let why = "";
      if (draft) {
        status = "draft";
        why = "marked <!-- i18n-status: draft -->";
      } else if (srcDirty && tDirty) {
        status = "translated";
        why = "source and translation updated together (uncommitted changeset)";
      } else if (srcDirty) {
        status = "stale";
        why = "source has uncommitted changes";
      } else if (tAt === null) {
        status = "uncommitted";
        why = "translation exists but was never committed";
      } else if (tDirty) {
        status = "translated";
        why = "translation has uncommitted changes (newer than source)";
      } else if (reviewSha && facts.reviewCoversSource(srcRel, reviewSha)) {
        status = "translated";
        why = `reviewed against ${reviewSha}`;
      } else if (reviewSha && !facts.reviewCoversSource(srcRel, reviewSha)) {
        status = "stale";
        why = `review marker ${reviewSha} no longer covers the current source`;
      } else if (srcAt !== null && srcAt > tAt) {
        status = "stale";
        why = "source committed after translation";
      } else if (srcAt !== null && tAt !== null && srcAt === tAt) {
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

/**
 * @param {{ root?: string, releaseGate?: boolean, facts?: object }} options
 * @returns {{
 *   control: string,
 *   applicable: boolean,
 *   verdict: "pass"|"fail"|"indeterminate",
 *   decision_effect: "advisory"|"deny",
 *   evidence: {
 *     translations: object[],
 *     staleTranslations: object[],
 *     draftTranslations: object[]
 *   }
 * }}
 */
function evaluateTranslationFreshness(options) {
  const root = (options && options.root) || process.cwd();
  const releaseGate = !!(options && options.releaseGate);
  const facts = (options && options.facts) || createGitFacts(root);
  const translations = translationFreshness(facts);
  const applicable = translations.length > 0 || facts.exists(`docs/${SOURCE_LANG}`);
  // When zh-CN tree is absent, historically translationFreshness() returns [] and
  // the CLI still runs; applicable stays true for the combined CLI. For a solo
  // evaluator call with no source tree, mark not-applicable.
  const hasSourceTree = facts.exists(`docs/${SOURCE_LANG}`);
  const staleTranslations = translations.filter((t) => t.status === "stale");
  const draftTranslations = translations.filter((t) => t.status === "draft");
  const blocking = releaseGate && staleTranslations.length + draftTranslations.length > 0;

  return {
    control: CONTROL_ID,
    applicable: hasSourceTree,
    verdict: blocking ? "fail" : "pass",
    decision_effect: releaseGate ? "deny" : "advisory",
    evidence: { translations, staleTranslations, draftTranslations },
  };
}

module.exports = {
  CONTROL_ID,
  SOURCE_LANG,
  TARGET_LANGS,
  translationTargets,
  translationFreshness,
  evaluateTranslationFreshness,
};
