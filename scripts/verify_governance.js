#!/usr/bin/env node
// PAYLOAD SCRIPT — copied standalone into governed projects (references/init-spec.json).
// Keep it self-contained: Node builtins only, never require() a sibling module.
// Governance Validator — plain Node, no dependencies.
// Usage: node scripts/verify-governance.js [--json]   (installed name; this file is
//        verify_governance.js in the skill repo and is copied to the hyphen form)
// Paths come from .governance/manifest.json when present (structure-adaptive);
// otherwise built-in defaults are used.
// Exit code 0 when every governance artifact exists, 1 otherwise.

const fs = require("fs");
const path = require("path");

if (process.argv.includes("--help") || process.argv.includes("-h")) {
  console.log(`Usage:
  verify-governance.js [options]

Options:
  --json       Output JSON report
  --help       Show help`);
  process.exit(0);
}

const ROOT = process.cwd();
// Containment comparisons must use a canonical baseline: process.cwd() keeps the logical
// path, so a project reached through a symlink/junction (macOS /tmp, Windows junctions, CI
// workspace links) would otherwise make every realpath'd artifact look out-of-tree.
const ROOT_REAL = (() => {
  try {
    return fs.realpathSync(ROOT);
  } catch {
    return ROOT;
  }
})();
const MANIFEST = path.join(ROOT, ".governance", "manifest.json");

// Path is inside the project when it neither escapes by segment nor resolves outside ROOT.
function insideRoot(abs) {
  try {
    const rel = path.relative(ROOT_REAL, fs.realpathSync(abs));
    return rel === "" || (!path.isAbsolute(rel) && !rel.split(/[\\/]/).includes(".."));
  } catch {
    return false;
  }
}

// [name, relativePath, checker]
// validation.json / drift-report.json are runtime outputs (optional), NOT required artifacts:
// they are produced by AUDIT/release runs and ignored by git, so fresh-checkout CI must pass without them.
const DEFAULTS = [
  ["AGENTS.md", "AGENTS.md", isFile],
  ["CHANGELOG.md", "CHANGELOG.md", isFile],
  ["CHANGELOG format", "CHANGELOG.md", hasChangelogFormat],
  ["Architecture doc", "docs/ARCHITECTURE.md", hasRealArchitecture],
  ["Feature registry", "docs/features", isDir],
  ["Plans", "docs/plans", isDir],
  ["Rules", "docs/rules", isDir],
  [".gitignore", ".gitignore", isFile],
  [".env.example", ".env.example", isFile],
  ["CI workflow", null, hasCI],
  ["Validator self", "scripts/verify-governance.js", isFile],
  ["Lock check", "scripts/check-lock.js", isFile],
  ["Git policy", ".governance/git-policy.json", hasValidGitPolicy],
  ["Git policy check", "scripts/check-git-policy.js", isFile],
  ["Secret scan gate", "scripts/check-secrets.js", isFile],
  ["Sync groups check", "scripts/check-sync.js", isFile],
  [".governance state dir", ".governance", isDir],
  [".governance manifest", ".governance/manifest.json", isFile],
  [".governance state", ".governance/state.json", isFile],
  [".governance preflight", ".governance/preflight.json", isFile],
  ["Governance version", null, hasGovernanceVersion],
];

function isFile(p) {
  try {
    return fs.statSync(p).isFile();
  } catch {
    return false;
  }
}

// Manifest-supplied strings reach stdout/stderr: strip control chars (ANSI escapes can
// repaint a failing report as passing) and bound the length.
function sanitizeOut(s) {
  return String(s).replace(/[\u0000-\u001f\u007f-\u009f\u2028\u2029]/g, "?").slice(0, 120);
}

function isDir(p) {
  try {
    return fs.statSync(p).isDirectory();
  } catch {
    return false;
  }
}

// Architecture doc must exist AND not be the untouched INIT template skeleton.
// A fresh skeleton is a wrong-but-present artifact: it passes isFile but documents nothing.
// Only deterministic bad signals are rejected (unreplaced placeholders / the placeholder
// comment row); the doc's FORM is not constrained — tables, lists and prose are all valid
// ways to document architecture, so no structural shape is required.
function hasRealArchitecture(p) {
  if (!isFile(p)) return false;
  try {
    const c = fs.readFileSync(p, "utf8");
    if (c.includes("{{ONE_SENTENCE_DESCRIPTION}}")) return false;
    if (c.includes("<!-- add rows as components are registered -->")) return false;
    // Must carry substance: strip headings, HTML comments, table separators and blanks —
    // something must remain (an untouched skeleton is only headings + comments).
    const body = c
      .split("\n")
      .filter((l) => !/^\s*#/.test(l))
      .filter((l) => !/^\s*<!--/.test(l))
      .filter((l) => !/^\s*\|\s*---/.test(l))
      .filter((l) => l.trim() !== "")
      .join("");
    return body.trim().length > 0;
  } catch {
    return false;
  }
}

function hasCI() {
  return (
    isFile(path.join(ROOT, ".github/workflows/ci.yml")) ||
    isFile(path.join(ROOT, ".github/workflows/ci.yaml")) ||
    isFile(path.join(ROOT, ".gitlab-ci.yml")) ||
    isFile(path.join(ROOT, ".circleci/config.yml"))
  );
}

function getGovernanceVersion() {
  try {
    const m = JSON.parse(fs.readFileSync(MANIFEST, "utf8"));
    return typeof m.governance_version === "string" ? m.governance_version : null;
  } catch {
    return null;
  }
}

function hasGovernanceVersion() {
  return getGovernanceVersion() !== null;
}

function hasChangelogFormat() {
  try {
    const c = fs.readFileSync(path.join(ROOT, "CHANGELOG.md"), "utf8");
    return /## \[(Unreleased|\d+\.\d+\.\d+)\]/.test(c);
  } catch {
    return false;
  }
}

function hasValidArtifactKinds() {
  try {
    const m = JSON.parse(fs.readFileSync(MANIFEST, "utf8"));
    if (!Array.isArray(m.artifacts) || m.artifacts.length === 0) return false;
    return m.artifacts.every((a) => a.kind === "file" || a.kind === "dir");
  } catch {
    return false;
  }
}

function hasValidGitPolicy() {
  try {
    const p = JSON.parse(fs.readFileSync(path.join(ROOT, ".governance", "git-policy.json"), "utf8"));
    return (
      Array.isArray(p.protectedBranches) &&
      p.protectedBranches.length > 0 &&
      typeof p.directPush === "boolean" &&
      typeof p.requireReview === "boolean" &&
      typeof p.allowForcePush === "boolean"
    );
  } catch {
    return false;
  }
}

function hasSchemaVersion() {
  try {
    const m = JSON.parse(fs.readFileSync(MANIFEST, "utf8"));
    return typeof m.schema_version === "string" && m.schema_version.length > 0;
  } catch {
    return false;
  }
}

function checkReleaseMeta() {
  try {
    const m = JSON.parse(fs.readFileSync(MANIFEST, "utf8"));
    const rel = m.release;
    if (rel === undefined || rel === null) return null; // not declared -> no check
    if (typeof rel !== "object") return false;
    return (
      typeof rel.version === "string" &&
      typeof rel.tag === "string" &&
      typeof rel.validated === "boolean"
    );
  } catch {
    return false;
  }
}

function loadManifestChecks() {
  try {
    const m = JSON.parse(fs.readFileSync(MANIFEST, "utf8"));
    if (!Array.isArray(m.artifacts) || m.artifacts.length === 0) return null;
    return m.artifacts.map((a) => {
      const rel = path.normalize(String(a.path || ""));
      // Containment: a crafted manifest ("../../etc/passwd") or an in-tree symlink pointing
      // outside must not turn the validator into an out-of-tree stat. Segment-based test so
      // a legitimate name like "..config.yml" is not mistaken for an escape.
      const escapes = rel === "" || rel === "." || path.isAbsolute(rel) || rel.split(/[\\/]/).includes("..");
      let ok = false;
      if (!escapes) {
        const abs = path.join(ROOT, rel);
        if (insideRoot(abs)) {
          try {
            const st = fs.statSync(abs);
            ok = a.kind === "dir" ? st.isDirectory() : st.isFile();
          } catch {
            ok = false;
          }
        }
      }
      return { name: sanitizeOut(a.name || rel), path: rel, ok };
    });
  } catch {
    return null;
  }
}

function generatedSkillsChecks() {
  const base = path.join(ROOT, ".governance", "generated", "skills");
  if (!isDir(base)) return [];
  let names;
  try {
    // Junctions/symlinks report isDirectory() === false as Dirent, so filtering on that
    // would silently DROP an out-of-tree linked skill dir instead of rejecting it. Take
    // every non-hidden entry and let the per-skill containment check decide.
    names = fs.readdirSync(base, { withFileTypes: true })
      .filter((e) => !e.name.startsWith("."))
      .filter((e) => e.isDirectory() || e.isSymbolicLink())
      .map((e) => e.name)
      .sort();
  } catch {
    // Unreadable skills tree is a governance verdict, not a crash.
    return [{ name: "Generated skills tree", path: ".governance/generated/skills", ok: false }];
  }
  return names.map((n) => {
    const sk = path.join(base, n, "SKILL.md");
    // A real skill file is a regular file inside the skills tree: lstat rejects a symlinked
    // SKILL.md, insideRoot rejects a skill DIRECTORY symlinked out of the project.
    let ok = false;
    try {
      ok = fs.lstatSync(sk).isFile() && insideRoot(sk);
    } catch {
      ok = false;
    }
    return {
      name: "Generated skill: " + sanitizeOut(n) + "/SKILL.md",
      path: ".governance/generated/skills/" + n + "/SKILL.md",
      ok,
    };
  });
}

const manifestChecks = loadManifestChecks();
const results = manifestChecks
  ? (() => {
      const checks = [
        ...manifestChecks,
        ...generatedSkillsChecks(),
        { name: "CHANGELOG format", path: "CHANGELOG.md", ok: hasChangelogFormat() },
        { name: "Git policy", path: ".governance/git-policy.json", ok: hasValidGitPolicy() },
        { name: "Sync groups check", path: "scripts/check-sync.js", ok: isFile(path.join(ROOT, "scripts/check-sync.js")) },
        { name: "Manifest schema", path: "manifest.schema_version", ok: hasSchemaVersion() },
        { name: "Manifest artifacts valid", path: "manifest.artifacts[].kind", ok: hasValidArtifactKinds() },
        { name: "Governance version", path: "manifest.governance_version", ok: hasGovernanceVersion() },
      ];
      const relOk = checkReleaseMeta();
      if (relOk !== null) {
        checks.push({ name: "Release metadata", path: "manifest.release", ok: relOk });
      }
      return checks;
    })()
  : [
      ...DEFAULTS.map(([name, rel, check]) => {
        const target = rel === null ? null : path.join(ROOT, rel);
        const ok = rel === null ? check() : check(target);
        return { name, path: rel || "(auto)", ok };
      }),
      ...generatedSkillsChecks(),
    ];

const missing = results.filter((r) => !r.ok);
const pass = results.length - missing.length;
const allOk = missing.length === 0;
const score = results.length === 0 ? 0 : pass / results.length;

if (process.argv.includes("--json")) {
  process.stdout.write(
    JSON.stringify(
      {
        root: ROOT,
        timestamp: new Date().toISOString(),
        mode: manifestChecks ? "manifest" : "defaults",
        governance_version: getGovernanceVersion(),
        total: results.length,
        passed: pass,
        failed: missing.length,
        score,
        passedAll: allOk,
        results,
      },
      null,
      2
    ) + "\n"
  );
} else {
  console.log(`mode: ${manifestChecks ? "manifest" : "defaults"}`);
  for (const r of results) {
    console.log(`${r.ok ? "✓" : "✗"} ${r.name}  (${r.path})`);
  }
  console.log(`\n${pass}/${results.length} checks passed.`);
  if (missing.length > 0) {
    console.log("Missing:");
    for (const m of missing) console.log(`  - ${m.name} (${m.path})`);
  }
}

process.exit(allOk ? 0 : 1);
