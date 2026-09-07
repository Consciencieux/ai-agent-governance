#!/usr/bin/env node
// Advisory, repo-only review aid for the CHANGELOG narrative budget.
//
// Scope (narrow by design): scans ONLY the [Unreleased] section of CHANGELOG.md for
// verification-narration markers — words that belong in test acceptance, plan review
// reports or audit records, not in the change record. History is never scanned: 0.13.1
// etc. are published records and are not gate objects.
//
// Known limitation: `\bexit 1\b` may flag legitimate behavioural descriptions
// (e.g. "exit 1 = another agent holds a lock"). The pattern excludes `exit 1 =` to
// reduce false positives, but edge cases remain. Advisory only, never blocks.
//
// Exit: always 0. Reports only — a style nudge for the author, never a release gate.
// It does NOT check entry length, category-canonicity or "what changed vs what impact"
// semantics; those remain rule-and-human judgement (see AGENTS.md CHANGELOG content
// boundary).
//
// Usage: node repo-tools/check-changelog-narration.js [--json] [--file <path>]

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
  "验证细节应移到测试、计划验收或审计记录；CHANGELOG 只记录变更、影响和迁移方式。" +
  " Verification details belong in test acceptance / plan review / audit records; " +
  "the change record keeps what changed, the impact and migration guidance only.";

const root = path.dirname(path.dirname(__filename));
const json = process.argv.includes("--json");
const fileArg = process.argv.indexOf("--file");
const changelogPath = fileArg >= 0
  ? (process.argv[fileArg + 1] && !process.argv[fileArg + 1].startsWith("--")
      ? process.argv[fileArg + 1]
      : (() => { console.error("--file requires a path argument"); process.exit(0); })())
  : path.join(root, "CHANGELOG.md");

function collectUnreleasedSection(text) {
  if (!text) return "";
  const lines = text.split(/\r?\n/);
  let start = -1;
  for (let i = 0; i < lines.length; i++) {
    if (/^## \[Unreleased\]/.test(lines[i])) { start = i; break; }
  }
  if (start < 0) return "";
  let end = lines.length;
  for (let i = start + 1; i < lines.length; i++) {
    if (/^## \[/.test(lines[i])) { end = i; break; }
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

function main() {
  let text;
  try {
    text = fs.existsSync(changelogPath) ? fs.readFileSync(changelogPath, "utf8") : "";
  } catch (e) {
    console.error("  cannot read " + changelogPath + ": " + e.message);
    return 0;
  }
  const section = collectUnreleasedSection(text);
  const findings = scan(section);

  if (json) {
    console.log(JSON.stringify({ changelog: "CHANGELOG.md", section: "[Unreleased]", findings }, null, 2));
    return 0;
  }

  if (findings.length === 0) {
    console.log("check-changelog-narration: clean — no verification narration in [Unreleased]");
    return 0;
  }
  for (const f of findings) {
    console.log("  " + f.entry);
    for (const flag of f.flags) console.log("    ^ " + flag);
  }
  console.log("\n" + HINT);
  return 0; // advisory: never blocks
}

process.exit(main());