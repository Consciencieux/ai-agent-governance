#!/usr/bin/env node
// Repository Layout Sync Check — fail-closed gate (repo infrastructure, not part of
// the governed-project payload). Verifies the Repository Layout tree in each of the
// three docs/{en,zh-CN,zh-TW}/architecture.md files lists every file that actually
// exists under references/ and scripts/. Prevents the exact regression where new
// skill files (scripts, templates, spec) were added but the architecture doc stayed
// stale — so an agent cannot "skip reading the architecture" and silently drift it.
//
// Usage: node scripts/check-layout-sync.js [--json]
// Exit 0: layout is in sync. Exit 1: files missing from the tree (fix the docs).

const fs = require("fs");
const path = require("path");

const ROOT = process.cwd();
const DOCS = path.join(ROOT, "docs");
const TREES = ["en", "zh-CN", "zh-TW"];
// Map tree heading to the section we extract (structure differs only by translation)
const HEADING = /###\s+(Repository Layout|仓库布局|倉庫佈局)/;
const DIRS = ["references", "scripts"];

function listFiles(dir) {
  let entries;
  try {
    entries = fs.readdirSync(dir, { withFileTypes: true });
  } catch {
    return []; // missing dir == no files; the gate treats empty as "needs attention"
  }
  const out = [];
  for (const e of entries) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) out.push(...listFiles(p));
    else out.push(e.name); // basename is enough: no collisions across references/ + scripts/
  }
  return out;
}

function extractTreeFileTokens(architectureMd) {
  const lines = architectureMd.split(/\r?\n/);
  const start = lines.findIndex((l) => HEADING.test(l));
  if (start < 0) return null;
  // Find the opening code fence after the heading
  let fence = -1;
  for (let i = start; i < lines.length; i++) {
    if (/^```/.test(lines[i].trim())) { fence = i; break; }
  }
  if (fence < 0) return null;
  const tokens = new Set();
  for (let i = fence + 1; i < lines.length; i++) {
    const line = lines[i];
    if (/^```/.test(line.trim())) break;
    const m = /^.*[├└]──\s+(.*)$/.exec(line);
    if (!m) continue;
    let name = m[1].split("#")[0].trim(); // strip the inline comment
    if (!name || name.endsWith("/")) continue; // skip dirs
    for (const tok of name.split("/")) {
      const t = tok.trim();
      if (t) tokens.add(t);
    }
  }
  return tokens;
}

function main() {
  const json = process.argv.includes("--json");
  const missingByTree = {};
  // Per-directory guard, not just the union: renaming `references/` away used to leave
  // `scripts/` alone carrying the check, so the scan silently enforced HALF the corpus and
  // still printed a confident green line with a plausible file count. Each configured root
  // must contribute files (audit 2026-09-05).
  const perDir = DIRS.map((d) => ({ dir: d, files: listFiles(path.join(ROOT, d)) }));
  const emptyDirs = perDir.filter((e) => e.files.length === 0).map((e) => e.dir);
  if (emptyDirs.length > 0) {
    const msg = `no files found under ${emptyDirs.join(", ")} — layout scan would cover only part of the tree`;
    if (json) process.stdout.write(JSON.stringify({ pass: false, issues: [msg] }, null, 2) + "\n");
    else console.log(`✗ ${msg}`);
    process.exit(1);
  }
  const actual = new Set(perDir.flatMap((e) => e.files));

  for (const lang of TREES) {
    const file = path.join(DOCS, lang, "architecture.md");
    if (!fs.existsSync(file)) {
      missingByTree[lang] = ["architecture.md missing"];
      continue;
    }
    const tokens = extractTreeFileTokens(fs.readFileSync(file, "utf8"));
    if (!tokens) {
      missingByTree[lang] = ["Repository Layout section not found"];
      continue;
    }
    const missing = [...actual].filter((f) => !tokens.has(f));
    if (missing.length > 0) missingByTree[lang] = missing;
  }

  const pass = Object.keys(missingByTree).length === 0;
  if (json) {
    process.stdout.write(JSON.stringify({ pass, actual: [...actual], missing: missingByTree }, null, 2) + "\n");
  } else {
    if (pass) {
      console.log(`✓ repository layout in sync (${actual.size} files under references/ + scripts/ all present in all ${TREES.length} trees)`);
    } else {
      for (const [lang, missing] of Object.entries(missingByTree)) {
        console.log(`✗ docs/${lang}/architecture.md Repository Layout missing: ${missing.join(", ")}`);
      }
    }
  }
  process.exit(pass ? 0 : 1);
}

main();
