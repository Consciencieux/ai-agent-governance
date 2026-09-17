#!/usr/bin/env node
// REPO-ONLY — export INSTALLED gate scripts for paper fixtures / external repro.
// Not a daily gate. Does not change script semantics.
//
// Usage:
//   node repo-tools/export-installed-scripts.js --out <dir> [--profile paper|all-installed] [--ref <git-ref>]
//
// paper profile = minimum set for agent-governance-paper fixtures (structure / secret / sync / sibling).
// --ref reads bytes from that git revision (default: working tree). Prefer --ref v2.2.0 for cited runs.
// Exit 0 ok · 1 usage / missing source · 2 git failure

"use strict";

const fs = require("fs");
const path = require("path");
const { spawnSync } = require("child_process");

const ROOT = path.resolve(__dirname, "..");

/** Paper fixture minimum (installed names under --out). */
const PAPER_COPIES = [
  { source: "scripts/verify_governance.js", dest: "verify-governance.js" },
  { source: "scripts/check-secrets.js", dest: "check-secrets.js" },
  { source: "scripts/check-sync.js", dest: "check-sync.js" },
  { source: "scripts/check-sibling-closure.js", dest: "check-sibling-closure.js" },
  { source: "scripts/check-lock.js", dest: "check-lock.js" },
  { source: "scripts/check-git-policy.js", dest: "check-git-policy.js" },
  { source: "scripts/check-git-consent.js", dest: "check-git-consent.js" },
  {
    source: "scripts/evaluators/ctrl-0001-secret-protection.js",
    dest: "evaluators/ctrl-0001-secret-protection.js",
  },
  {
    source: "scripts/evaluators/ctrl-0002-git-write-consent.js",
    dest: "evaluators/ctrl-0002-git-write-consent.js",
  },
  { source: "scripts/lib/secret-scan-facts.js", dest: "lib/secret-scan-facts.js" },
];

function printHelp() {
  console.log(`Usage:
  node repo-tools/export-installed-scripts.js --out <dir> [--profile paper|all-installed] [--ref <git-ref>]

Profiles:
  paper          minimum scripts for paper red/green fixtures (default)
  all-installed  every init-spec copy artifact under scripts/

--ref <git-ref>  read file bytes from that revision (e.g. v2.2.0); default = working tree`);
}

function argValue(flag) {
  const i = process.argv.indexOf(flag);
  return i >= 0 && process.argv[i + 1] ? process.argv[i + 1] : null;
}

function readSource(rel, ref) {
  if (!ref) {
    const abs = path.join(ROOT, rel);
    if (!fs.existsSync(abs)) return { error: `missing ${rel}` };
    return { body: fs.readFileSync(abs) };
  }
  const r = spawnSync("git", ["show", `${ref}:${rel}`], {
    cwd: ROOT,
    encoding: "buffer",
    maxBuffer: 8 * 1024 * 1024,
  });
  if (r.status !== 0) {
    return {
      error: `git show ${ref}:${rel} failed: ${String(r.stderr || r.stdout || "").trim() || "exit " + r.status}`,
    };
  }
  return { body: r.stdout };
}

function allInstalledCopies() {
  const spec = JSON.parse(fs.readFileSync(path.join(ROOT, "references", "init-spec.json"), "utf8"));
  const out = [];
  for (const a of spec.artifacts || []) {
    if (a.type !== "copy") continue;
    const source = String(a.source || "").replace(/\\/g, "/");
    const dest = String(a.path || "").replace(/\\/g, "/");
    if (!source.startsWith("scripts/") || !dest.startsWith("scripts/")) continue;
    out.push({ source, dest: dest.slice("scripts/".length) });
  }
  return out;
}

function resolveRefSha(ref) {
  if (!ref) return null;
  const r = spawnSync("git", ["rev-parse", `${ref}^{commit}`], { cwd: ROOT, encoding: "utf8" });
  if (r.status !== 0) return { error: String(r.stderr || r.stdout || "").trim() || "rev-parse failed" };
  return { sha: String(r.stdout || "").trim() };
}

function main() {
  if (process.argv.includes("--help") || process.argv.includes("-h")) {
    printHelp();
    process.exit(0);
  }
  const outDir = argValue("--out");
  if (!outDir) {
    printHelp();
    process.exit(1);
  }
  const profile = argValue("--profile") || "paper";
  const ref = argValue("--ref");
  if (profile !== "paper" && profile !== "all-installed") {
    console.error(`unknown --profile ${profile}`);
    process.exit(1);
  }

  let refSha = null;
  if (ref) {
    const resolved = resolveRefSha(ref);
    if (resolved.error) {
      console.error(resolved.error);
      process.exit(2);
    }
    refSha = resolved.sha;
  }

  const copies = profile === "paper" ? PAPER_COPIES : allInstalledCopies();
  if (!copies.length) {
    console.error("no copies to export");
    process.exit(1);
  }

  const absOut = path.resolve(outDir);
  fs.mkdirSync(absOut, { recursive: true });

  const written = [];
  for (const { source, dest } of copies) {
    const got = readSource(source, ref);
    if (got.error) {
      console.error(got.error);
      process.exit(ref ? 2 : 1);
    }
    const target = path.join(absOut, dest);
    fs.mkdirSync(path.dirname(target), { recursive: true });
    fs.writeFileSync(target, got.body);
    written.push({ source, dest });
  }

  const manifest = {
    profile,
    ref: ref || null,
    ref_commit: refSha,
    cited_product_version: "2.2.0",
    source_repo: "ai-agent-governance",
    exported_at: new Date().toISOString(),
    files: written,
  };
  fs.writeFileSync(path.join(absOut, "EXPORT-MANIFEST.json"), JSON.stringify(manifest, null, 2) + "\n");

  console.log(`exported ${written.length} file(s) → ${absOut} (profile=${profile}${ref ? ", ref=" + ref : ""})`);
}

main();
