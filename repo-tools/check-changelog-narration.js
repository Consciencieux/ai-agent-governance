#!/usr/bin/env node
// REPO-ONLY — CHANGELOG [Unreleased] verification-narration gate (FINDING-0016).
//
// Scans ONLY the [Unreleased] section for markers that belong in tests / plan
// acceptance / audit records, not in the change record. Published history is
// never scanned.
//
// Default: report + exit 0 (nudge).
// --gate / --release-gate: fail-closed (exit 1) when any marker matches.
//
// Does NOT judge entry length, category canonicity, or "what vs impact" semantics.
//
// Usage: node repo-tools/check-changelog-narration.js [--json] [--gate] [--release-gate] [--file <path>]

"use strict";

const fs = require("fs");
const path = require("path");

const FLAG_PATTERNS = [
  { re: /\bmutation[- ]verified\b/i, label: "mutation-verified" },
  { re: /\bverified by INIT\b/i, label: "verified by INIT" },
  { re: /turns (?:the|those) tests? red\b/i, label: "turns the test(s) red" },
  // "exit 1 = ..." is a behavioural description, not verification narration.
  { re: /\bexit 1\b(?!\s*=)/i, label: "exit 1" },
  { re: /\b(?:three|six|four) scenarios?\b/i, label: "N scenarios" },
];

const HINT =
  "Verification details belong in test acceptance / plan review / audit records; " +
  "CHANGELOG keeps what changed, impact, and migration guidance only.";

function collectUnreleasedSection(text) {
  if (!text) return "";
  const lines = text.split(/\r?\n/);
  let start = -1;
  for (let i = 0; i < lines.length; i++) {
    if (/^## \[Unreleased\]/.test(lines[i])) {
      start = i;
      break;
    }
  }
  if (start < 0) return "";
  let end = lines.length;
  for (let i = start + 1; i < lines.length; i++) {
    if (/^## \[/.test(lines[i])) {
      end = i;
      break;
    }
  }
  return lines.slice(start, end).join("\n");
}

function scan(section) {
  const findings = [];
  if (!section) return findings;
  const lines = section.split(/\r?\n/);
  let current = null;
  for (const line of lines) {
    const entryMatch = line.match(/^-\s+\*\*(.+?)\*\*/);
    if (entryMatch) {
      current = { entry: entryMatch[1].slice(0, 80), flags: [] };
      findings.push(current);
    }
    if (current && !/^###|^##/.test(line)) {
      for (const { re, label } of FLAG_PATTERNS) {
        if (re.test(line) && !current.flags.includes(label)) current.flags.push(label);
      }
    }
  }
  return findings.filter((f) => f.flags.length > 0);
}

function checkChangelogNarration(options) {
  const opts = options || {};
  const changelogPath = opts.file || path.join(opts.root || process.cwd(), "CHANGELOG.md");
  let text = "";
  try {
    text = fs.existsSync(changelogPath) ? fs.readFileSync(changelogPath, "utf8") : "";
  } catch (e) {
    return { ok: true, findings: [], error: e.message, file: changelogPath };
  }
  const section = collectUnreleasedSection(text);
  const findings = scan(section);
  return { ok: findings.length === 0, findings, file: changelogPath, section: "[Unreleased]" };
}

function main(argv) {
  const args = argv || process.argv.slice(2);
  const json = args.includes("--json");
  const gate = args.includes("--gate") || args.includes("--release-gate");
  const fileArg = args.indexOf("--file");
  const file =
    fileArg >= 0 && args[fileArg + 1] && !args[fileArg + 1].startsWith("--")
      ? args[fileArg + 1]
      : null;
  const result = checkChangelogNarration({ file: file || undefined, root: process.cwd() });
  if (json) {
    process.stdout.write(JSON.stringify({ ...result, gate }, null, 2) + "\n");
  } else if (result.findings.length === 0) {
    console.log("check-changelog-narration: clean — no verification narration in [Unreleased]");
  } else {
    for (const f of result.findings) {
      console.log("  " + f.entry);
      for (const flag of f.flags) console.log("    ^ " + flag);
    }
    console.log("\n" + HINT);
  }
  const code = gate && !result.ok ? 1 : 0;
  if (require.main === module) process.exit(code);
  return code;
}

if (require.main === module) main();

module.exports = {
  FLAG_PATTERNS,
  collectUnreleasedSection,
  scan,
  checkChangelogNarration,
  main,
};
