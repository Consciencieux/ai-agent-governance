#!/usr/bin/env node
// INSTALLED evaluator — CTRL-0002 Git write consent.
// Classifies a proposed git argv list against git.policy.md consent classes.
// Semantic verdict only: allow | require_consent | deny. Does NOT execute git.
// Node builtins only (self-contained classification table mirrors policy classes).

"use strict";

const CONTROL_ID = "CTRL-0002";

/** Subcommands that never require consent (read / local inspect). */
const AUTO_OK = new Set([
  "status",
  "diff",
  "log",
  "show",
  "branch",
  "rev-parse",
  "check-ignore",
  "ls-files",
  "describe",
  "shortlog",
  "blame",
  "grep",
  "stash", // list/show only when no drop/pop/apply — refined below
]);

/** Always require independent consent (never covered by pre-commit echo). */
const INDEPENDENT = new Set([
  "tag",
  "reset",
  "rebase",
  "revert",
  "merge",
  "clean",
  "rm",
  "restore",
  "pull",
  "cherry-pick",
]);

/** Writes that are covered by one change-set consent echo (add→commit→push). */
const CHANGESET = new Set(["add", "commit", "push"]);

function normalizeArgv(argv) {
  const list = Array.isArray(argv) ? argv.map(String) : [];
  let i = 0;
  if (list[0] === "git") i = 1;
  while (i < list.length && list[i].startsWith("-")) {
    // skip global flags like -C, -c (take value when needed)
    if (list[i] === "-C" || list[i] === "-c") {
      i += 2;
      continue;
    }
    i += 1;
  }
  return list.slice(i);
}

function classifySubcommand(args) {
  if (!args.length) {
    return { class: "deny", reason: "empty git argv" };
  }
  const cmd = args[0];
  if (cmd === "push" && args.some((a) => a === "--force" || a === "-f" || a.startsWith("--force"))) {
    return { class: "independent", reason: "force push requires independent consent" };
  }
  if (cmd === "commit" && args.includes("--amend")) {
    return { class: "independent", reason: "amend of pushed commit class requires independent consent" };
  }
  if (cmd === "checkout" || cmd === "switch") {
    // carrying uncommitted changes is independent; without worktree facts we require consent
    return { class: "require_consent", reason: "branch checkout/switch requires consent when worktree dirty; treat as consent-gated" };
  }
  if (cmd === "stash") {
    const sub = args[1] || "push";
    if (sub === "list" || sub === "show") return { class: "auto", reason: "stash inspect" };
    return { class: "independent", reason: "stash mutate requires independent consent" };
  }
  if (AUTO_OK.has(cmd)) return { class: "auto", reason: `read/inspect: ${cmd}` };
  if (INDEPENDENT.has(cmd)) return { class: "independent", reason: `independent consent: ${cmd}` };
  if (CHANGESET.has(cmd)) return { class: "changeset", reason: `change-set consent: ${cmd}` };
  return { class: "require_consent", reason: `unlisted git subcommand defaults to consent: ${cmd}` };
}

/**
 * @param {{ argv?: string[], commands?: string[][] }} options
 * @returns {{
 *   control: string,
 *   applicable: boolean,
 *   verdict: "pass"|"fail"|"indeterminate",
 *   decision_effect: "allow"|"require_consent"|"deny",
 *   evidence: object
 * }}
 */
function evaluateGitWriteConsent(options) {
  const opts = options || {};
  let sequences = [];
  if (Array.isArray(opts.commands) && opts.commands.length) {
    sequences = opts.commands.map(normalizeArgv);
  } else if (Array.isArray(opts.argv)) {
    sequences = [normalizeArgv(opts.argv)];
  } else {
    return {
      control: CONTROL_ID,
      applicable: false,
      verdict: "indeterminate",
      decision_effect: "require_consent",
      evidence: { error: "no argv/commands provided" },
    };
  }

  const classes = sequences.map((args) => ({ args, ...classifySubcommand(args) }));
  const hasDeny = classes.some((c) => c.class === "deny");
  const hasIndependent = classes.some((c) => c.class === "independent");
  const hasConsent = classes.some((c) => c.class === "changeset" || c.class === "require_consent");

  let decision_effect = "allow";
  if (hasDeny) decision_effect = "deny";
  else if (hasIndependent || hasConsent) decision_effect = "require_consent";

  // Evaluator does not observe human consent; mechanical class ≠ executed consent.
  // pass = auto-only; fail = deny; indeterminate = consent required (agent/protocol must obtain it).
  let verdict = "pass";
  if (decision_effect === "deny") verdict = "fail";
  else if (decision_effect === "require_consent") verdict = "indeterminate";

  return {
    control: CONTROL_ID,
    applicable: true,
    verdict,
    decision_effect,
    evidence: { sequences: classes, policy_ref: "references/policies/git.policy.md#确认范围" },
  };
}

module.exports = {
  CONTROL_ID,
  evaluateGitWriteConsent,
  classifySubcommand,
  normalizeArgv,
};
