#!/usr/bin/env node
// INIT Scripted Generator — deterministic, snapshot-testable governance scaffolding.
// Usage:
//   node scripts/generate-governance.js --target <dir> --project-name <name> [--phase A|B|C] [--dry-run] [--json]
//   node scripts/generate-governance.js --target <dir> --file <input.json>
// Exit 0: success · Exit 1: error · Exit 2: usage error
//
// Determinism contract (per plan init-scripted-generator.md):
//   - Same inputs -> byte-identical outputs (no timestamps, no randomness)
//   - Existing files are SKIPPED, never overwritten (merge-not-overwrite is Phase C)
//   - The single source of truth for the artifact list is references/init-spec.json

const fs = require("fs");
const path = require("path");

const SKILL_DIR = path.resolve(__dirname, "..");
const SPEC_PATH = path.join(SKILL_DIR, "references", "init-spec.json");
const PHASE_ORDER = ["A", "B", "C"];

function usage() {
  console.log(`Usage:
  generate-governance.js --target <dir> --project-name <name> [--phase A|B|C] [--dry-run] [--json]
  generate-governance.js --target <dir> --file <input.json>

Options:
  --target <dir>        Target project root (must exist or be created)
  --project-name <name> Project name for AGENTS.md heading
  --phase <A|B|C>       Phases to generate (default: A)
  --dry-run             List files that would be created, write nothing
  --allow-stub          Tolerate not-yet-implemented generators (skip instead of fail)
  --stack <s>           node|python|rust|go|java|cpp|docs-only (selects the CI template)
  --ci-platform <p>     github|gitlab|none
  --maturity <m>        LEVEL_0_EMPTY|LEVEL_1_PROTOTYPE|LEVEL_2_ACTIVE|LEVEL_3_PRODUCTION
  --doc-root <dir>      Existing documentation root (default docs; e.g. documentation)
  --force-l3            Write even at LEVEL_3_PRODUCTION (default there is audit-only)
  --json                Output file list as JSON
  --file <path>         Read inputs from JSON file
  --help                Show this help`);
}

function readJSON(p) {
  try {
    return JSON.parse(fs.readFileSync(p, "utf8"));
  } catch (e) {
    throw new Error(`generate-governance: cannot read JSON from ${p} (${e.message})`);
  }
}

function argValue(args, name) {
  const i = args.indexOf(name);
  return i >= 0 && i + 1 < args.length ? args[i + 1] : null;
}

function writeIfAbsent(filepath, content, mode) {
  fs.mkdirSync(path.dirname(filepath), { recursive: true });
  if (fs.existsSync(filepath)) {
    return { path: filepath, action: "skipped" };
  }
  fs.writeFileSync(filepath, content, "utf8");
  if (mode && process.platform !== "win32") fs.chmodSync(filepath, mode);
  return { path: filepath, action: "created" };
}

function ensureDir(dirpath) {
  const existedBefore = fs.existsSync(dirpath);
  fs.mkdirSync(dirpath, { recursive: true });
  const keep = path.join(dirpath, ".gitkeep");
  const others = fs.readdirSync(dirpath).filter((f) => f !== ".gitkeep");
  let wroteKeep = false;
  if (!fs.existsSync(keep) && others.length === 0) {
    fs.writeFileSync(keep, "", "utf8");
    wroteKeep = true;
  }
  // Report honestly: an already-present directory is a skip, not a creation. Otherwise a
  // second identical run reports "created N files" and the idempotency claim is unverifiable.
  return { path: dirpath, action: existedBefore && !wroteKeep ? "skipped" : "created-dir" };
}

function resolvePlaceholders(content, placeholders, inputs) {
  let result = content;
  for (const [key, inputKey] of Object.entries(placeholders || {})) {
    const val = inputs[inputKey] || "";
    result = result.split("{{" + key + "}}").join(val);
  }
  return result;
}

// Extract the first complete fenced code block from a markdown template. Matching
// the opening fence with its own closing fence matters when the surrounding
// documentation contains a second example block.
function extractCodeBlock(raw) {
  const lines = String(raw).replace(/\r\n/g, "\n").split("\n");
  let opening = null;
  let openingIndex = -1;
  for (let i = 0; i < lines.length; i++) {
    const m = lines[i].trim().match(/^(`{3,})([A-Za-z0-9_-]*)\s*$/);
    if (m) {
      opening = m;
      openingIndex = i;
      break;
    }
  }
  if (!opening) return raw;

  const closeRe = new RegExp("^`{" + opening[1].length + ",}\\s*$");
  let closingIndex = -1;
  for (let i = openingIndex + 1; i < lines.length; i++) {
    if (closeRe.test(lines[i].trim())) {
      closingIndex = i;
      break;
    }
  }
  if (closingIndex < 0) return raw;

  const body = lines.slice(openingIndex + 1, closingIndex);
  return body.join("\n");
}

function artifactType(artPath) {
  if (artPath === "AGENTS.md") return "policy";
  if (artPath.startsWith("docs/rules/")) return "policy";
  if (artPath === ".gitignore" || artPath === ".env.example" || artPath === ".gitmessage.txt") return "policy";
  if (artPath === ".governance" || artPath.startsWith(".governance/")) return "state";
  if (artPath.startsWith(".githooks/")) return "script";
  if (artPath.startsWith("scripts/")) return "script";
  if (artPath.startsWith(".github/")) return "ci";
  return "documentation";
}

// --- Built-in generators ---

const GITIGNORE_CONTENT = [
  "# Dependencies",
  "node_modules/",
  ".pnpm-store/",
  "",
  "# Environment & secrets (never commit real values)",
  ".env",
  ".env.*",
  "!.env.example",
  "*.key",
  "*.pem",
  "*.p12",
  "*.pfx",
  "id_rsa",
  "credentials.json",
  "secrets.*",
  "",
  "# Build output",
  "dist/",
  "build/",
  "coverage/",
  "*.log",
  "logs/",
  "",
  "# Governance runtime outputs (git-tracked: manifest/state/preflight/git-policy/sync-rules/generated)",
  ".governance/validation.json",
  ".governance/drift-report.json",
  ".governance/release-proposal.json",
  ".governance/activity.jsonl",
  ".governance/consent.json",
  "",
  "# OS / editor",
  ".DS_Store",
  "Thumbs.db",
  ".idea/",
  ".vscode/",
  "",
].join("\n");

const PREFLIGHT_CONTENT = JSON.stringify({
  created_at: "",
  git_status_summary: "",
  existing_files: [],
  note: "Fill after Phase 0 inspection (rollback basis). Empty fields = not yet recorded.",
}, null, 2) + "\n";

function generateState(inputs) {
  return JSON.stringify({
    maturity: inputs.maturity || "LEVEL_0_EMPTY",
    phase: "completed",
    agent_id: "",
    task_id: "",
    task_start_sha: "",
    locked: null,
    completed: ["docs", "agents", "rules"],
    blocked: [],
    rule_capture: {
      status: "none",
      task_id: "",
      candidates: [],
    },
  }, null, 2) + "\n";
}

// CI workflow generator — selects the matching template from references/workflows/ci.md.
// The JUDGEMENT (which stack / which platform) comes from inputs (agent detection);
// the WRITING is mechanical, which is what makes it deterministic.
const CI_SECTIONS = {
  node: /## GitHub Actions[^\n]*Node\.js/i,
  python: /## GitHub Actions[^\n]*Python/i,
  rust: /## GitHub Actions[^\n]*Rust/i,
  go: /## GitHub Actions[^\n]*Go（/i,
  java: /## GitHub Actions[^\n]*Java/i,
  cpp: /## GitHub Actions[^\n]*C\+\+/i,
  "docs-only": /## 纯文档项目/,
  gitlab: /## GitLab CI/,
};

function extractCiTemplate(ciMd, key) {
  const re = CI_SECTIONS[key];
  if (!re) return null;
  const m = ciMd.match(re);
  if (!m) return null;
  const start = m.index;
  // section body = up to the next "## " heading
  const rest = ciMd.slice(start + m[0].length);
  const nextIdx = rest.search(/\r?\n## /);
  const body = nextIdx >= 0 ? rest.slice(0, nextIdx) : rest;
  // take the first fenced code block inside the section (the workflow YAML).
  // CRLF-safe: templates are authored with Windows line endings in this repo.
  const fence = body.match(/```(?:ya?ml)?\r?\n([\s\S]*?)```/);
  if (!fence) return null;
  // normalise to LF so generated CI files are byte-identical across platforms
  return fence[1].replace(/\r\n/g, "\n");
}

function generateCi(inputs, skillDir) {
  const platform = inputs.ci_platform || "github";
  if (platform === "none") return null; // nothing to write
  const ciMd = fs.readFileSync(path.join(skillDir, "references", "workflows", "ci.md"), "utf8");
  const key = platform === "gitlab" ? "gitlab" : (inputs.stack || "docs-only");
  const tpl = extractCiTemplate(ciMd, key);
  if (!tpl) return null;
  return tpl.endsWith("\n") ? tpl : tpl + "\n";
}

// Sub-skills generator — splits references/templates/sub-skills.md into one file per
// sub-skill: .governance/generated/skills/<name>/SKILL.md. Each template section is
// "## N. <name>" followed by a fenced block whose body is the sub-skill file itself.
function parseSubSkills(md) {
  const out = [];
  const lines = md.replace(/\r\n/g, "\n").split("\n");
  for (let i = 0; i < lines.length; i++) {
    const h = lines[i].match(/^##\s+\d+\.\s+(\S+)\s*$/);
    if (!h) continue;
    const name = h[1];
    // find the opening fence after the heading
    let j = i + 1;
    while (j < lines.length && !/^`{3,}/.test(lines[j])) {
      if (/^##\s/.test(lines[j])) break; // next section without a fence
      j++;
    }
    if (j >= lines.length || !/^`{3,}/.test(lines[j])) continue;
    const fence = lines[j].match(/^(`{3,})/)[1];
    // body until the matching closing fence of the same length
    const body = [];
    let k = j + 1;
    for (; k < lines.length; k++) {
      if (lines[k].startsWith(fence) && lines[k].trim().length === fence.length) break;
      body.push(lines[k]);
    }
    out.push({ name, body: body.join("\n").replace(/\s+$/, "") + "\n" });
    i = k;
  }
  return out;
}

function generateSubSkills(inputs, skillDir, targetAbs, dirRel) {
  const md = fs.readFileSync(path.join(skillDir, "references", "templates", "sub-skills.md"), "utf8");
  const skills = parseSubSkills(md);
  const written = [];
  for (const sk of skills) {
    const filePath = path.join(targetAbs, dirRel.replace(/\/+$/, ""), sk.name, "SKILL.md");
    const r = writeIfAbsent(filePath, sk.body);
    written.push({ name: sk.name, action: r.action });
  }
  return written;
}

function generateManifest(inputs, spec, entries) {
  const version = inputs.governance_version || defaultGovernanceVersion(spec);
  const manifest = {
    schema_version: "1.0",
    governance_version: version,
    doc_root: (inputs.doc_root || "docs").replace(/\/+$/, ""),
    artifacts: entries,
  };
  if (inputs.release_version) {
    manifest.release = {
      version: inputs.release_version,
      tag: "v" + inputs.release_version,
      validated: inputs.release_validated === true,
    };
  }
  return JSON.stringify(manifest, null, 2) + "\n";
}

function defaultGovernanceVersion(spec) {
  try {
    const pkg = JSON.parse(fs.readFileSync(path.join(SKILL_DIR, "package.json"), "utf8"));
    if (typeof pkg.version === "string" && pkg.version.length > 0) return pkg.version;
  } catch {
    // Fall back to the version declared in the machine-readable spec below.
  }
  const fallback = spec && spec.inputs && spec.inputs.governance_version && spec.inputs.governance_version.default;
  return typeof fallback === "string" && fallback.length > 0 ? fallback : "0.10.1";
}

// --- Main ---

function main() {
  const args = process.argv.slice(2);
  if (args.includes("--help") || args.includes("-h") || args.length === 0) {
    usage();
    process.exit(0);
  }

  const target = argValue(args, "--target");
  const projectName = argValue(args, "--project-name");
  const phase = (argValue(args, "--phase") || "A").toUpperCase();
  const dryRun = args.includes("--dry-run");
  const allowStub = args.includes("--allow-stub");
  const forceL3 = args.includes("--force-l3");
  const json = args.includes("--json");
  const file = argValue(args, "--file");
  const stackArg = argValue(args, "--stack");
  const ciPlatformArg = argValue(args, "--ci-platform");
  const maturityArg = argValue(args, "--maturity");
  const docRootArg = argValue(args, "--doc-root");

  if (!target) { console.error("error: --target is required"); process.exit(2); }
  if (!projectName && !file) { console.error("error: --project-name is required (or use --file)"); process.exit(2); }

  const spec = readJSON(SPEC_PATH);
  const inputs = file ? readJSON(file) : { project_name: projectName };
  inputs.phase = phase;
  inputs.governance_version = inputs.governance_version || defaultGovernanceVersion(spec);
  inputs.description = inputs.description || "";
  inputs.project_name = inputs.project_name || projectName || "";
  inputs.test_cmd = inputs.test_cmd || "npm test";
  inputs.lint_cmd = inputs.lint_cmd || "npm run lint";
  inputs.build_cmd = inputs.build_cmd || "npm run build";
  inputs.governance_cmd = inputs.governance_cmd || "npm run governance-check";
  inputs.convention = inputs.convention || "Conventional Commits";
  inputs.doc_root = inputs.doc_root || "docs";
  if (stackArg) inputs.stack = stackArg;
  if (maturityArg) inputs.maturity = maturityArg;
  if (docRootArg) inputs.doc_root = docRootArg;
  if (ciPlatformArg) inputs.ci_platform = ciPlatformArg;
  inputs.stack = inputs.stack || "docs-only";
  inputs.ci_platform = inputs.ci_platform || "github";

  const maxPhaseIdx = PHASE_ORDER.indexOf(phase);
  if (maxPhaseIdx < 0) { console.error("error: --phase must be A, B, or C"); process.exit(2); }

  const artifacts = spec.artifacts.filter((a) => {
    const idx = PHASE_ORDER.indexOf(a.phase);
    return idx >= 0 && idx <= maxPhaseIdx;
  });

  const targetAbs = path.resolve(target);

  // ---- Structure-adaptive behaviour (maturity + doc_root) ----
  // L0/L1 -> full skeleton; L2 -> incremental (only missing items, existing files never
  // touched); L3 -> audit mode: report what WOULD be created, write nothing unless the
  // developer explicitly forces it (mirrors SKILL.md's maturity strategy table).
  const maturity = inputs.maturity || "LEVEL_0_EMPTY";
  const auditOnly = maturity === "LEVEL_3_PRODUCTION" && !forceL3;
  const effectiveDryRun = dryRun || auditOnly;

  // Existing doc root adaptation: a project whose documentation lives in e.g.
  // "documentation/" gets governance docs written there instead of "docs/".
  const docRoot = (inputs.doc_root || "docs").replace(/\/+$/, "");
  const remap = (rel) => (docRoot === "docs" ? rel : rel.replace(/^docs(?=\/|$)/, docRoot));

  const results = [];
  const commonPlaceholders = {
    "GOVERNANCE_VERSION": "governance_version",
    "ONE_SENTENCE_DESCRIPTION": "description",
    "PROJECT_NAME": "project_name",
  };

  for (const art of artifacts) {
    if (art.generator === "manifest") continue; // generated last, from actually-created artifacts
    const artPath = remap(art.path);
    const targetPath = path.join(targetAbs, artPath);
    // Containment guard: a crafted --doc-root (e.g. "../../escaped") must not let any
    // artifact resolve OUTSIDE the target project. path.join resolves "..", so compare the
    // resolved target against the resolved target root with a trailing separator.
    if (!targetPath.startsWith(targetAbs + path.sep) && targetPath !== targetAbs) {
      results.push({ path: artPath, action: "error", error: "path resolves outside target: " + artPath });
      continue;
    }
    if (effectiveDryRun) {
      results.push({ path: artPath, action: auditOnly && !dryRun ? "audit-would-create" : "would-create", type: art.type });
      continue;
    }
    let result;
    switch (art.type) {
      case "copy": {
        const sourcePath = path.join(SKILL_DIR, art.source);
        if (!fs.existsSync(sourcePath)) {
          result = { path: artPath, action: "error", error: "source not found: " + art.source };
        } else {
          result = writeIfAbsent(targetPath, fs.readFileSync(sourcePath, "utf8"));
        }
        break;
      }
      case "template": {
        const sourcePath = path.join(SKILL_DIR, art.source);
        if (!fs.existsSync(sourcePath)) {
          result = { path: artPath, action: "error", error: "source not found: " + art.source };
        } else {
          const raw = fs.readFileSync(sourcePath, "utf8");
          const body = extractCodeBlock(raw);
          const executable = artPath === ".githooks/pre-commit" || artPath === ".githooks/commit-msg";
          result = writeIfAbsent(targetPath, resolvePlaceholders(body, art.placeholders, inputs), executable ? 0o755 : null);
        }
        break;
      }
      case "static": {
        const content = resolvePlaceholders(art.content || "", commonPlaceholders, inputs);
        result = writeIfAbsent(targetPath, content);
        break;
      }
      case "dir": {
        result = ensureDir(targetPath);
        break;
      }
      case "generated": {
        let content;
        if (art.generator === "state") content = generateState(inputs);
        else if (art.generator === "gitignore") content = GITIGNORE_CONTENT;
        else if (art.generator === "preflight") content = PREFLIGHT_CONTENT;
        else if (art.generator === "sub-skills") {
          const written = generateSubSkills(inputs, SKILL_DIR, targetAbs, art.path);
          if (written.length === 0) {
            result = { path: artPath, action: "error", error: "no sub-skills parsed from sub-skills.md" };
          } else {
            const created = written.filter((w) => w.action === "created").length;
            result = { path: artPath, action: created > 0 ? "created" : "skipped", note: written.length + " sub-skills (" + created + " created)" };
          }
          results.push(result);
          continue;
        }
        else if (art.generator === "ci") {
          const ci = generateCi(inputs, SKILL_DIR);
          if (ci === null) {
            result = { path: artPath, action: "skipped", note: "ci_platform=none or no template for stack '" + (inputs.stack || "") + "'" };
            results.push(result);
            continue;
          }
          content = ci;
          // GitLab uses a root-level file instead of .github/workflows/
          if ((inputs.ci_platform || "github") === "gitlab") {
            result = writeIfAbsent(path.join(targetAbs, ".gitlab-ci.yml"), content);
            results.push(result);
            continue;
          }
        }
        else if (allowStub) {
          result = { path: artPath, action: "skipped", note: "generator '" + art.generator + "' not yet implemented (--allow-stub)" };
          results.push(result);
          continue;
        } else {
          // An unimplemented generator is an UNDELIVERED artifact: it must fail loudly,
          // otherwise "generated, 1 skipped, exit 0" reads as success (this is exactly how
          // Phase C looked complete while sub-skills generation was never implemented).
          result = { path: artPath, action: "error", error: "generator '" + art.generator + "' not implemented — pass --allow-stub to proceed without it" };
          results.push(result);
          continue;
        }
        result = writeIfAbsent(targetPath, content);
        break;
      }
      default:
        result = { path: artPath, action: "error", error: "unknown type: " + art.type };
    }
    results.push(result);
  }

  // Manifest is generated LAST, listing only artifacts that actually exist on disk
  // (skipped-because-exists counts as exists; error/stub do not).
  const manifestSpec = spec.artifacts.find((a) => a.generator === "manifest");
  if (manifestSpec) {
    const manifestIdx = PHASE_ORDER.indexOf(manifestSpec.phase);
    if (manifestIdx >= 0 && manifestIdx <= maxPhaseIdx) {
      const targetPath = path.join(targetAbs, remap(manifestSpec.path));
      const entries = spec.artifacts
        .filter((a) => {
          const idx = PHASE_ORDER.indexOf(a.phase);
          return idx >= 0 && idx <= maxPhaseIdx && a !== manifestSpec;
        })
        .map((a) => {
          // the CI artifact's real path depends on the platform (gitlab writes a root file)
          const platformPath =
            a.generator === "ci" && (inputs.ci_platform || "github") === "gitlab"
              ? ".gitlab-ci.yml"
              : a.path;
          const rp = remap(platformPath);
          const isDir = rp.endsWith("/");
          const p = isDir ? rp.slice(0, -1) : rp;
          return {
            name: a.name || path.basename(p),
            path: p,
            kind: isDir ? "dir" : "file",
            type: artifactType(p),
          };
        })
        .filter((e) => {
          if (dryRun) return true;
          const p = path.join(targetAbs, e.path);
          return fs.existsSync(p);
        });
      if (effectiveDryRun) {
        results.push({ path: remap(manifestSpec.path), action: auditOnly && !dryRun ? "audit-would-create" : "would-create", type: "generated" });
      } else {
        results.push(writeIfAbsent(targetPath, generateManifest(inputs, spec, entries)));
      }
    }
  }

  if (json) {
    process.stdout.write(JSON.stringify({ target: targetAbs, phase, results }, null, 2) + "\n");
  } else {
    const created = results.filter((r) => r.action === "created" || r.action === "created-dir").length;
    const skipped = results.filter((r) => r.action === "skipped").length;
    const errors = results.filter((r) => r.action === "error").length;
    if (effectiveDryRun) {
      const label = auditOnly && !dryRun ? "audit (LEVEL_3_PRODUCTION, nothing written; use --force-l3 to write)" : "dry-run";
      console.log(label + ": " + results.length + " files would be created in " + targetAbs);
    } else {
      console.log("generated " + created + " files, " + skipped + " skipped, " + errors + " errors in " + targetAbs);
    }
    if (errors > 0) {
      results.filter((r) => r.action === "error").forEach((r) => console.error("  error: " + r.path + " — " + r.error));
    }
  }

  process.exit(results.some((r) => r.action === "error") ? 1 : 0);
}

main();
