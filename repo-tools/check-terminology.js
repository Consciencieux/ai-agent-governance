#!/usr/bin/env node
// Repo-OWNED terminology gate (REPO-ONLY — lives under repo-tools/, never ships).
//
// Extracted from scripts/check-doc-consistency.js (INSTALLED) as the first
// Producer/Product execution separation (ADR-0020): the terminology gate's data source
// (docs/glossary.md) is repo-only, and governed projects have no glossary, so the cluster
// no-oped there and never belonged in the shipped checker. Repo execution now runs THIS
// checker instead of the product carrier.
//
// Data source: docs/glossary.md — the Forbidden zh-CN / Forbidden zh-TW columns register
// renderings that must NOT appear in that language tree. Semicolon-separated variants;
// empty cell = no constraint. A line carrying `<!-- i18n: allow <term> -->` (or the line
// above it — an inline comment would split a Markdown table) is exempt.
// FAIL-CLOSED: a missing glossary is the authoritative source vanishing — reported as a
// governance data defect, never a vacuous pass. A glossary that yields no parseable header
// is likewise reported rather than silently disabling the gate.
//
// Scans the first EXISTING authoritative tree per language: docs/product/{zh-CN,zh-TW}
// (post-migration), falling back to docs/{zh-CN,zh-TW} only when the product tree is absent.
// Only ONE tree per language is ever scanned — never both.
//
// Usage: node repo-tools/check-terminology.js [--json]
// Exit 0: glossary present, valid, no forbidden renderings.
// Exit 1: glossary missing or malformed, or a forbidden rendering found.

const fs = require("fs");
const path = require("path");

const ROOT = process.cwd();
const DOCS = path.join(ROOT, "docs");
const LANG_DIRS = {
  "zh-CN": [path.join(DOCS, "product", "zh-CN"), path.join(DOCS, "zh-CN")],
  "zh-TW": [path.join(DOCS, "product", "zh-TW"), path.join(DOCS, "zh-TW")],
};

function readFile(p) {
  try { return fs.readFileSync(p, "utf8"); } catch { return null; }
}

function walk(dir, base = dir) {
  const out = [];
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) out.push(...walk(p, base));
    else if (e.name.endsWith(".md")) out.push(path.relative(base, p));
  }
  return out.sort();
}

function glossaryForbidden() {
  const c = readFile(path.join(DOCS, "glossary.md"));
  if (!c) return null; // no glossary — gate no-ops
  const cols = { "zh-CN": new Map(), "zh-TW": new Map() };
  let header = null;
  let sawHeader = false;
  for (const line of c.split(/\r?\n/)) {
    if (!line.startsWith("|")) continue;
    const cells = line.split("|").slice(1, -1).map((s) => s.trim());
    // Separator rows come in alignment flavours (`---`, `:---`, `:---:`, `---:`) — treat
    // them all as separators, never as data.
    if (cells.every((cell) => /^:?-{3,}:?$/.test(cell.replace(/\s/g, "")))) continue;
    if (/^English$/i.test(cells[0] || "")) {
      header = cells.map((h) => h.toLowerCase()); // each table re-declares its layout
      sawHeader = true;
      continue;
    }
    if (!header) continue; // data before any header — ignore
    const idxCN = header.indexOf("forbidden zh-cn");
    const idxTW = header.indexOf("forbidden zh-tw");
    const concept = cells[0] || "";
    for (const [lang, idx] of [["zh-CN", idxCN], ["zh-TW", idxTW]]) {
      if (idx < 0 || idx >= cells.length) continue; // table without that column: no constraint
      const raw = cells[idx] || "";
      for (const variant of raw.split(";").map((s) => s.trim()).filter(Boolean)) {
        if (!cols[lang].has(variant)) cols[lang].set(variant, concept);
      }
    }
  }
  if (!sawHeader) return { cols, malformed: true }; // exists but unusable — report, never fail open
  return { cols, malformed: false };
}

function main() {
  const json = process.argv.includes("--json");
  const issues = { terminology_usage: [] };
  let termsRegistered = 0;

  const forbidden = glossaryForbidden();
  if (forbidden === null) {
    // Fail-closed: the authoritative term source is absent. A vacuous pass here would
    // mean the repo's terminology gate silently stopped guarding.
    issues.terminology_usage.push("docs/glossary.md is missing — the repo-owned terminology gate's authoritative term source is absent; create or restore it");
  } else if (forbidden.malformed) {
    issues.terminology_usage.push("docs/glossary.md exists but has no parseable header table — terminology gate cannot run; fix the glossary");
  } else {
    termsRegistered = forbidden.cols["zh-CN"].size + forbidden.cols["zh-TW"].size;
    for (const lang of ["zh-CN", "zh-TW"]) {
      const table = forbidden.cols[lang];
      if (!table || table.size === 0) continue;
      // True fallback: scan only the FIRST existing authoritative tree per language.
      // Never both — a transient migration state where old and new trees coexist must
      // not make the gate fail on legacy paths that are no longer authoritative.
      const dir = LANG_DIRS[lang].find((p) => fs.existsSync(p));
      if (!dir) continue;
      for (const rel of walk(dir)) {
        const relPath = path.join(path.relative(ROOT, dir), rel).split(path.sep).join("/");
        const content = readFile(path.join(dir, rel));
        if (!content) continue;
        const lines = content.split(/\r?\n/);
        lines.forEach((line, i) => {
          for (const [variant, concept] of table) {
            if (!line.includes(variant)) continue;
            const esc = variant.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
            const allowRe = new RegExp("<!--\\s*i18n:\\s*allow\\b[^>]*" + esc);
            if (allowRe.test(line) || (i > 0 && allowRe.test(lines[i - 1]))) continue;
            issues.terminology_usage.push(`${relPath}:${i + 1}: forbidden ${lang} rendering "${variant}" (concept: ${concept})`);
          }
        });
      }
    }
  }

  const pass = issues.terminology_usage.length === 0;
  const out = { termsRegistered, issues, pass };
  if (json) {
    process.stdout.write(JSON.stringify(out, null, 2) + "\n");
  } else {
    for (const i of issues.terminology_usage) console.log("✗ " + i);
    if (pass) console.log("✓ terminology gate: glossary present, valid, no forbidden renderings");
  }
  process.exit(pass ? 0 : 1);
}

main();
