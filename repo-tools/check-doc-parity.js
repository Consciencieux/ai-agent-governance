#!/usr/bin/env node
// Doc Parity Check — read-only. Verifies the three developer-facing product trees
// (docs/product/en/, docs/product/zh-CN/, docs/product/zh-TW/) are structurally
// parallel: the same-named file must exist in each tree with the same heading
// hierarchy, code-block count, table dimensions and list-item count. The six
// language entry files live at the repository root and are checked separately.
// Structural parity is NOT semantic parity.
// Usage: node repo-tools/check-doc-parity.js [--json]
// Exit 0: trees are parallel. Exit 1: drift found.

const fs = require("fs");
const path = require("path");

const ROOT = process.cwd();
const DOCS = path.join(ROOT, "docs");
const TREES = ["product/en", "product/zh-CN", "product/zh-TW"];
const ROOT_ENTRIES = [
  "README.md",
  "README.zh-CN.md",
  "README.zh-TW.md",
  "CONTRIBUTING.md",
  "CONTRIBUTING.zh-CN.md",
  "CONTRIBUTING.zh-TW.md",
];

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

// Structural signature for the six root entry files. The English, Simplified Chinese
// and Traditional Chinese variants of each entry must remain structurally parallel.
function readEntrySigs(issues) {
  const sigs = {};
  for (const rel of ROOT_ENTRIES) {
    const file = path.join(ROOT, rel);
    if (!fs.existsSync(file)) {
      issues.push(`missing root entry: ${rel}`);
      continue;
    }
    sigs[rel] = signature(file);
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

  const entrySigs = readEntrySigs(issues);
  for (const [base, variants] of [
    ["README.md", ["README.zh-CN.md", "README.zh-TW.md"]],
    ["CONTRIBUTING.md", ["CONTRIBUTING.zh-CN.md", "CONTRIBUTING.zh-TW.md"]],
  ]) {
    if (!entrySigs[base]) continue;
    for (const variant of variants) {
      if (!entrySigs[variant]) continue;
      if (JSON.stringify(entrySigs[variant]) !== JSON.stringify(entrySigs[base])) {
        issues.push(`structure drift in root entry ${variant}: ` +
          `${JSON.stringify(entrySigs[variant])} != ${JSON.stringify(entrySigs[base])}`);
      }
    }
  }

  if (Object.keys(treeFiles).length === TREES.length) {
    const base = treeFiles["product/zh-CN"];
    for (const rel of Object.keys(base)) {
      for (const lang of ["product/en", "product/zh-TW"]) {
        if (!treeFiles[lang][rel]) {
          issues.push(`missing in docs/${lang}/: ${rel}`);
        } else if (JSON.stringify(treeFiles[lang][rel]) !== JSON.stringify(base[rel])) {
          issues.push(`structure drift in docs/${lang}/${rel}: ` +
            `${JSON.stringify(treeFiles[lang][rel])} != ${JSON.stringify(base[rel])}`);
        }
      }
    }
    for (const lang of ["product/en", "product/zh-TW"]) {
      for (const rel of Object.keys(treeFiles[lang])) {
        if (!base[rel]) issues.push(`extra in docs/${lang}/: ${rel}`);
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
