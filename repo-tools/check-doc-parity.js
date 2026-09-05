#!/usr/bin/env node
// Doc Parity Check — read-only. Verifies the three developer-facing language trees
// (docs/en/, docs/zh-CN/, docs/zh-TW/) are structurally parallel: the same-named file
// must exist in each tree with the same heading hierarchy, code-block count, table
// dimensions and list-item count. Also verifies the root English landing files
// (README.md, CONTRIBUTING.md) exist. Structural parity is NOT semantic parity.
// Usage: node scripts/check-doc-parity.js [--json]
// Exit 0: trees are parallel. Exit 1: drift found.

const fs = require("fs");
const path = require("path");

const ROOT = process.cwd();
const DOCS = path.join(ROOT, "docs");
const TREES = ["en", "zh-CN", "zh-TW"];
const ENTRY_MAP = {
  en: ["README.md", "CONTRIBUTING.md"], // root English landing
  "zh-CN": ["README.md", "CONTRIBUTING.md"], // in-tree translations
  "zh-TW": ["README.md", "CONTRIBUTING.md"],
};

function walk(dir, base = dir) {
  const out = [];
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) out.push(...walk(p, base));
    else if (e.name.endsWith(".md")) out.push(path.relative(base, p));
  }
  return out.sort();
}

// Structural signature of a markdown file: heading levels in order, code-block count,
// table row/col counts, list-item count. Ignore inline content.
function signature(file) {
  const lines = fs.readFileSync(file, "utf8").split("\n");
  const sig = { headings: [], codeBlocks: 0, tables: [], lists: 0 };
  let inCode = false;
  let inTable = false;
  let tableCols = 0;
  let tableRows = 0;
  const flushTable = () => {
    if (inTable) {
      inTable = false;
      sig.tables.push(`${tableCols}x${tableRows}`);
    }
  };
  for (const line of lines) {
    if (/^```/.test(line.trim())) {
      flushTable(); // a code fence always terminates a table
      inCode = !inCode;
      if (inCode) sig.codeBlocks++;
      continue;
    }
    if (inCode) continue;
    const h = /^(#{1,6})\s/.exec(line);
    if (h) {
      flushTable(); // a heading always terminates a table
      sig.headings.push(h[1].length);
      continue;
    }
    if (/^\s*\|.*\|\s*$/.test(line)) {
      if (!inTable) {
        inTable = true;
        tableCols = line.split("|").length - 2;
        tableRows = 1;
      } else {
        tableRows++;
      }
      continue;
    }
    flushTable(); // any other non-blank content terminates a table
    if (/^\s*[-*+]\s+/.test(line)) sig.lists++;
  }
  flushTable();
  return sig;
}

function readTree(lang) {
  const dir = path.join(DOCS, lang);
  if (!fs.existsSync(dir)) return null;
  const sigs = {};
  for (const rel of walk(dir)) {
    sigs[rel] = signature(path.join(dir, rel));
  }
  return sigs;
}

function entryFile(lang) {
  // English entry files live at the repo root (GitHub landing); zh-CN/zh-TW at tree root.
  const base = lang === "en" ? ROOT : path.join(DOCS, lang);
  return ENTRY_MAP[lang].map((f) => ({ rel: f, file: path.join(base, f) }));
}

// Structural signature for entry files living outside the tree (root README/CONTRIBUTING
// for en). Compare the zh-CN/zh-TW in-tree copies against the corresponding tree files.
// Missing tree dirs/files report issues instead of crashing.
function readEntrySigs(issues) {
  const sigs = {};
  for (const lang of ["zh-CN", "zh-TW"]) {
    sigs[lang] = {};
    for (const { rel, file } of entryFile(lang)) {
      if (!fs.existsSync(file)) {
        issues.push(`missing entry in docs/${lang}/: ${rel}`);
        continue;
      }
      sigs[lang][rel] = signature(file);
    }
  }
  return sigs;
}

function main() {
  const json = process.argv.includes("--json");
  const issues = [];
  const treeFiles = {};

  for (const lang of TREES) {
    const sigs = readTree(lang);
    if (!sigs) {
      issues.push(`tree missing: docs/${lang}/`);
      continue;
    }
    treeFiles[lang] = sigs;
  }

  // Entry files: root README.md / CONTRIBUTING.md must exist (en landing);
  // zh-CN/zh-TW in-tree README.md / CONTRIBUTING.md must be structurally parallel.
  for (const { rel, file } of entryFile("en")) {
    if (!fs.existsSync(file)) issues.push(`English entry missing: ${file}`);
  }
  const entrySigs = readEntrySigs(issues);
  const baseEntry = entrySigs["zh-CN"];
  for (const rel of Object.keys(baseEntry)) {
    for (const lang of ["en", "zh-TW"]) {
      const enFile = path.join(ROOT, rel);
      if (lang === "en") {
        if (!fs.existsSync(enFile)) {
          issues.push(`English entry missing: ${enFile}`);
          continue;
        }
      } else if (!entrySigs[lang][rel]) {
        issues.push(`missing entry in docs/zh-TW/: ${rel}`);
        continue;
      }
      const theirs = lang === "en" ? signature(enFile) : entrySigs[lang][rel];
      if (JSON.stringify(theirs) !== JSON.stringify(baseEntry[rel])) {
        issues.push(`structure drift in entry ${rel} (${lang}): ` +
          `${JSON.stringify(theirs)} != ${JSON.stringify(baseEntry[rel])}`);
      }
    }
  }

  if (Object.keys(treeFiles).length === TREES.length) {
    const base = treeFiles["zh-CN"];
    const entryRels = new Set(ENTRY_MAP["zh-CN"]); // README.md, CONTRIBUTING.md
    for (const rel of Object.keys(base)) {
      if (entryRels.has(rel)) continue; // checked by the entry-file pass
      for (const lang of ["en", "zh-TW"]) {
        if (!treeFiles[lang][rel]) {
          issues.push(`missing in docs/${lang}/: ${rel}`);
        } else if (JSON.stringify(treeFiles[lang][rel]) !== JSON.stringify(base[rel])) {
          issues.push(`structure drift in docs/${lang}/${rel}: ` +
            `${JSON.stringify(treeFiles[lang][rel])} != ${JSON.stringify(base[rel])}`);
        }
      }
    }
    for (const lang of ["en", "zh-TW"]) {
      for (const rel of Object.keys(treeFiles[lang])) {
        if (!base[rel] && !entryRels.has(rel)) issues.push(`extra in docs/${lang}/: ${rel}`);
      }
    }
  }

  const pass = issues.length === 0;
  if (json) {
    process.stdout.write(JSON.stringify({ root: ROOT, timestamp: new Date().toISOString(), trees: TREES, pass, issues }, null, 2) + "\n");
  } else {
    for (const i of issues) console.log("✗ " + i);
    if (pass) console.log("✓ three language trees are structurally parallel");
  }
  process.exit(pass ? 0 : 1);
}

main();
