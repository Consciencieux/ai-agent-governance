#!/usr/bin/env node
// Role Completeness Check — SKILL-INTERNAL (in scripts/, deliberately NOT in init-spec).
// Enforces the distribution-role contract declared in references/init-spec.json:
//   1. every file under references/ + scripts/ is classified — either an artifact `source`
//      (INSTALLED) or listed in distribution.skillInternal (SKILL-INTERNAL);
//   2. the two sets never overlap (a file cannot be both installed and internal);
//   3. every declared path exists on disk (no stale declaration);
//   4. the tarball's actual file set matches the union of both roles — packaging is the
//      real distribution boundary, so a doc claim that a file ships is verified against
//      scripts/package-skill.sh, not assumed.
// Roles are HUMAN decisions: this check reports gaps, it never infers a role. Files listed
// under distribution.undecided are reported as such (they are known contract defects with
// a recorded question) and keep the gate red until adjudicated.
// Usage: node scripts/check-role-completeness.js [--json] [--gate]
// Exit: --gate fails on unclassified files, overlaps, stale paths, or packaging mismatch.
const fs = require("fs");
const path = require("path");

const ROOT = process.cwd();
const SPEC = path.join(ROOT, "references", "init-spec.json");
const ROLE_DIRS = ["references", "scripts"];

// Declared paths must resolve inside the repo: a crafted source like "../../etc/passwd"
// would pass the existence check (line 73) but point outside the project tree.
function insideRoot(abs) {
  const rel = path.relative(ROOT, abs);
  return rel === "" || (!path.isAbsolute(rel) && !rel.split(/[\\/]/).includes(".."));
}

function walk(dir, out = []) {
  let entries;
  try { entries = fs.readdirSync(dir, { withFileTypes: true }); } catch { return out; }
  for (const e of entries) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) walk(p, out);
    else out.push(path.relative(ROOT, p).replace(/\\/g, "/"));
  }
  return out;
}

// The packaged file set, taken from package-skill.sh's copy list rather than guessed.
function packagedPrefixes() {
  const sh = path.join(ROOT, "scripts", "package-skill.sh");
  let text = "";
  try { text = fs.readFileSync(sh, "utf8"); } catch { return null; }
  const prefixes = [];
  for (const m of text.matchAll(/^cp (?:-R )?(\S+) "\$STAGING\/"/gm)) prefixes.push(m[1]);
  return prefixes.length ? prefixes : null;
}

function main() {
  const json = process.argv.includes("--json");
  const gate = process.argv.includes("--gate");
  const issues = { unclassified: [], overlap: [], stale_declaration: [], packaging_mismatch: [], undecided: [] };

  let spec;
  try { spec = JSON.parse(fs.readFileSync(SPEC, "utf8")); } catch (e) {
    const item = `references/init-spec.json unreadable: ${e.message}`;
    const out = { timestamp: new Date().toISOString(), applicable: false, issues: { ...issues, unclassified: [item] }, gatePass: false };
    if (json) process.stdout.write(JSON.stringify(out, null, 2) + "\n"); else console.log("✗ " + item);
    process.exit(gate ? 1 : 0);
  }

  // Malformed-but-parseable spec: missing or non-array artifacts is a data defect, not a crash.
  if (!Array.isArray(spec.artifacts)) {
    const item = "references/init-spec.json has no artifacts array — cannot determine INSTALLED set";
    issues.unclassified.push(item);
    const out = { timestamp: new Date().toISOString(), applicable: false, issues, gate, gatePass: false, gateIssues: [{ kind: "unclassified", item }], unresolvedMarkerCount: 0 };
    if (json) process.stdout.write(JSON.stringify(out, null, 2) + "\n"); else console.log("✗ " + item);
    process.exit(gate ? 1 : 0);
  }

  const installed = new Set(spec.artifacts.filter((a) => a.source).map((a) => a.source));
  const internal = new Set(((spec.distribution || {}).skillInternal) || []);
  const undecided = Object.keys((spec.distribution || {}).undecided || {});
  const files = ROLE_DIRS.flatMap((d) => walk(path.join(ROOT, d)));

  // 1. unclassified
  for (const f of files) {
    if (installed.has(f) || internal.has(f) || undecided.includes(f)) continue;
    issues.unclassified.push(`${f} — declare it as an artifact source (INSTALLED) or in distribution.skillInternal (SKILL-INTERNAL)`);
  }
  // 2. overlap
  for (const f of internal) if (installed.has(f)) issues.overlap.push(`${f} is both an artifact source and skillInternal`);
  for (const f of undecided) if (installed.has(f)) issues.overlap.push(`${f} is an artifact source yet listed as undecided`);
  // 3. stale declarations — also check containment so a source path like "../../etc/passwd"
  //    does not silently pass as "exists" (review finding).
  for (const f of [...installed, ...internal, ...undecided]) {
    const abs = path.join(ROOT, f);
    if (!insideRoot(abs)) { issues.stale_declaration.push(`${f} escapes outside the repository root`); continue; }
    if (!fs.existsSync(abs)) issues.stale_declaration.push(`${f} is declared but does not exist`);
  }
  // 4. packaging boundary. NOTE: package-skill.sh copies references/ and scripts/ wholesale,
  //    so the shipped() check is necessarily coarse — it can only detect a missing directory
  //    copy command, not a missing file within a directory. File-level granularity would
  //    require listing every file in the packaging script, which is the init-spec's job.
  const prefixes = packagedPrefixes();
  if (prefixes) {
    const shipped = (f) => prefixes.some((p) => f === p || f.startsWith(p + "/"));
    for (const f of [...installed, ...internal].filter((f) => ROLE_DIRS.some((d) => f.startsWith(d + "/")))) {
      if (!shipped(f)) issues.packaging_mismatch.push(`${f} carries a distribution role but package-skill.sh does not ship it`);
    }
    for (const f of files) {
      if (!shipped(f)) issues.packaging_mismatch.push(`${f} lives under a role directory but package-skill.sh does not ship it`);
    }
  } else {
    issues.packaging_mismatch.push("scripts/package-skill.sh copy list unreadable — packaging boundary unverified");
  }
  // report the recorded open questions
  for (const f of undecided) issues.undecided.push(`${f}: ${spec.distribution.undecided[f]}`);

  const gateKinds = ["unclassified", "overlap", "stale_declaration", "packaging_mismatch", "undecided"];
  const gateIssues = gateKinds.flatMap((k) => issues[k].map((item) => ({ kind: k, item })));
  const report = {
    timestamp: new Date().toISOString(),
    counts: { installed: installed.size, skillInternal: internal.size, undecided: undecided.length, filesScanned: files.length },
    issues,
    gate,
    gatePass: gateIssues.length === 0,
    gateIssues,
  };

  if (json) {
    process.stdout.write(JSON.stringify(report, null, 2) + "\n");
  } else {
    console.log(`roles — INSTALLED ${installed.size} · SKILL-INTERNAL ${internal.size} · undecided ${undecided.length} · files ${files.length}`);
    for (const g of gateIssues) console.log(`✗ ${g.kind}: ${g.item.slice(0, 160)}`);
    if (gateIssues.length === 0) console.log("✓ role completeness: every file classified, no overlap, packaging boundary matches");
  }
  process.exit(gate && gateIssues.length > 0 ? 1 : 0);
}

main();
