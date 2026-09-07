#!/usr/bin/env node
// Repository Layout Sync Check — fail-closed gate (repo infrastructure, not part of
// the governed-project payload). Verifies the Repository Layout tree in each of the
// three docs/{en,zh-CN,zh-TW}/architecture.md files lists every file that actually
// exists under references/ and scripts/. Prevents the exact regression where new
// skill files (scripts, templates, spec) were added but the architecture doc stayed
// stale — so an agent cannot "skip reading the architecture" and silently drift it.
//
// Usage: node repo-tools/check-layout-sync.js [--json]
// Exit 0: layout is in sync. Exit 1: files missing from the tree (fix the docs).

const fs = require("fs");
const path = require("path");

const ROOT = process.cwd();
const DOCS = path.join(ROOT, "docs");
const TREES = ["en", "zh-CN", "zh-TW"];
// Map tree heading to the section we extract (structure differs only by translation)
const HEADING = /###\s+(Repository Layout|仓库布局|倉庫佈局)/;
// The four directories whose contents must be documented in every architecture.md tree.
// repo-tools/ and repo-workflows/ joined the list when the payload/repo boundary became
// physical: a file dropped into them still needs a documented home, and leaving them
// unscanned would let repo tooling accumulate undocumented (boundary-split plan §4).
const DIRS = ["references", "scripts", "repo-tools", "repo-workflows"];

function pairFrom(dir, name) { return dir + "/" + name; }

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
  // Scanned-dir file pairs for the reverse stale check: path (references/policies/x.md)
  // where the file is documented under one of the four scanned roots. A flattened
  // basename set cannot tell "scripts/check-sync.js" from a root-level entry of the same
  // name, so the stale check in main() needs these pairs alongside the forward tokens.
  const scannedPairs = new Set();
  // Box-drawing tree. Depth is inferred from the number of `│`/`├`/`└` segments in the
  // line's box prefix. The tree's first line is the root slot (name only, e.g.
  // `ai-agent-governance/`) — it is depth 0 and must NOT become an ancestor dir for the
  // references/ subtree, or every pair accumulates a spurious prefix and nothing matches
  // DIRS (audit 2026-09-07). A file whose parent chain's FIRST dir is a scanned root
  // contributes "<firstdir>/<name>"; deeper ancestors are ignored for the pair key, since
  // listFiles() flattens to basenames anyway.
  const stack = [];
  for (let i = fence + 1; i < lines.length; i++) {
    const line = lines[i];
    if (/^```/.test(line.trim())) break;
    const branch = /^.*[├└]──\s+(.*)$/.exec(line);
    if (!branch) continue;
    const raw = line.match(/^(\s*(?:[│├└]\s*)+)/);
    const depth = raw ? raw[1].match(/(?:[│├└]\s*)/g).length : 0;
    let name = branch[1].split("#")[0].trim();
    if (!name) continue;
    // A tree line may list several files separated by " / " (the policies/ line renders
    // five .policy.md files on one branch). Each is its own entry.
    const names = name.includes(" / ") ? name.split(/\s*\/\s*/).filter(Boolean) : [name];
    for (const n of names) {
      name = n;
      // A box entry at prefix-depth D belongs under the dir listed at depth D-1. Entries
      // below that (a sibling or a return to a shallower level) escape the previous
      // subtree: truncate the ancestor stack to D-1 first, then either push (dir) or
      // classify (file). This is what makes `LICENSE` (depth 1, after `scripts/`) root
      // again instead of being attributed to scripts/.
      if (stack.length > depth - 1) stack.length = depth - 1;
      if (name.endsWith("/")) {
        stack.push(name.slice(0, -1));
        continue;
      }
      const dir = stack[0] || "";
      if (dir && DIRS.includes(dir)) {
        const pair = dir + "/" + name;
        tokens.add(name);
        scannedPairs.add(pair);
      } else if (name.includes("/")) {
        // Flat fixture spelling (a tree that renders "references/foo.js" on one line with
        // no intermediate dir entry): the first segment is the parent dir, the rest is the
        // basename. A name whose first segment is a scanned root contributes a pair.
        const segs = name.split("/");
        const head = segs[0];
        const tail = segs[segs.length - 1];
        const primary = segs[1] && DIRS.includes(head) ? pairFrom(head, tail) : null;
        for (const s of segs) tokens.add(s);
        if (primary) scannedPairs.add(primary);
      } else {
        tokens.add(name);
      }
    }
  }
  return { tokens, scannedPairs };
}

function main() {
  const json = process.argv.includes("--json");
  const missingByTree = {};
  // Shape guard: this check describes THIS repo's layout (references/ + scripts/ mirrored
  // in three architecture.md trees). "Is this that shape?" is answered by the docs side,
  // NOT by `references/`: the three architecture.md trees are what this gate reads, and a
  // governed project has none of them. Keying the guard on `references/` was wrong twice
  // over — a governed project fell through to the half-scan branch and exited 1, and
  // deleting `references/` HERE turned the gate green instead of failing, silently
  // disabling the per-directory protection immediately below (audit 2026-09-05).
  // With the docs trees as the marker, a missing `references/` in this repo still reaches
  // that protection and still fails, which is the whole point of it.
  const treesPresent = TREES.filter((lang) => fs.existsSync(path.join(DOCS, lang, "architecture.md")));
  if (treesPresent.length === 0) {
    if (json) process.stdout.write(JSON.stringify({ pass: true, applicable: false, issues: [] }, null, 2) + "\n");
    else console.log("✓ layout sync: not applicable (no docs/<lang>/architecture.md trees — not this repo's shape)");
    process.exit(0);
  }

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
    const extracted = extractTreeFileTokens(fs.readFileSync(file, "utf8"));
    if (!extracted) {
      missingByTree[lang] = ["Repository Layout section not found"];
      continue;
    }
    const { tokens, scannedPairs } = extracted;
    const missing = [...actual].filter((f) => !tokens.has(f));
    if (missing.length > 0) missingByTree[lang] = missing;
    // Reverse check: a file documented under a scanned root whose name no longer exists
    // in that root is a stale entry — "moving a file does not move its readers'
    // assumptions". Without this half, deleting/renaming a file left its old path
    // documented in all three trees forever while the gate stayed green (audit 2026-09-07).
    // listFiles flattens to basenames (no collisions across the four roots per the comment
    // at line 37), so the comparison is basename vs basename.
    const stale = [...scannedPairs].filter((pair) => {
      const name = pair.split("/").pop();
      return !actual.has(name);
    });
    if (stale.length > 0) {
      const item = `stale layout entries (documented under a scanned root but gone): ${stale.join(", ")}`;
      missingByTree[lang] = [...(missingByTree[lang] || []), item];
    }
  }

  const pass = Object.keys(missingByTree).length === 0;
  if (json) {
    process.stdout.write(JSON.stringify({ pass, actual: [...actual], missing: missingByTree }, null, 2) + "\n");
  } else {
    if (pass) {
      console.log(`✓ repository layout in sync (${actual.size} files under ${DIRS.join(", ")} all present in all ${TREES.length} trees)`);
    } else {
      for (const [lang, missing] of Object.entries(missingByTree)) {
        console.log(`✗ docs/${lang}/architecture.md Repository Layout missing: ${missing.join(", ")}`);
      }
    }
  }
  process.exit(pass ? 0 : 1);
}

main();
