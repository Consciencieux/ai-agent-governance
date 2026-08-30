#!/usr/bin/env node
// Test harness for the governance scripts — verify_governance.js, check-lock.js,
// check-git-policy.js, check-secrets.js, check-doc-parity.js, release-manager.js.
// Plain Node, no dependencies.
// Usage: npm test   (or: node tests/run-tests.js)

const { spawnSync } = require("child_process");
const fs = require("fs");
const os = require("os");
const path = require("path");

const VALIDATOR = path.join(__dirname, "..", "scripts", "verify_governance.js");
const LOCK_CHECK = path.join(__dirname, "..", "scripts", "check-lock.js");
const GIT_POLICY_CHECK = path.join(__dirname, "..", "scripts", "check-git-policy.js");
const SECRET_CHECK = path.join(__dirname, "..", "scripts", "check-secrets.js");
const SYNC_CHECK = path.join(__dirname, "..", "scripts", "check-sync.js");
const GENERATOR = path.join(__dirname, "..", "scripts", "generate-governance.js");
const LAYOUT_CHECK = path.join(__dirname, "..", "scripts", "check-layout-sync.js");
const PLAN_DELIVERY = path.join(__dirname, "..", "scripts", "check-plan-delivery.js");
const TMP_ROOT = fs.mkdtempSync(path.join(os.tmpdir(), "ai-agent-governance-test-"));

function tmp(name) {
  return fs.mkdtempSync(path.join(TMP_ROOT, `${name}-`));
}

function write(p, content) {
  fs.mkdirSync(path.dirname(p), { recursive: true });
  fs.writeFileSync(p, content);
}

function assemble(...parts) {
  return parts.join("");
}

function run(dir, args = []) {
  return spawnSync(process.execPath, [VALIDATOR, ...args], { cwd: dir, encoding: "utf8" });
}

function cleanup() {
  fs.rmSync(TMP_ROOT, { recursive: true, force: true });
}

const tests = [];
function test(name, fn) {
  tests.push({ name, fn });
}

// ---------- 1. Empty project ----------
test("empty project exits 1 (governance missing)", () => {
  const dir = tmp("empty");
  const r = run(dir);
  return r.status === 1;
});

// ---------- 2. Full default structure ----------
function buildFullDefault(dir) {
  const dirs = ["docs/features", "docs/plans", "docs/rules", ".governance", ".github/workflows", "scripts"];
  for (const d of dirs) fs.mkdirSync(path.join(dir, d), { recursive: true });
  const files = [
    ["AGENTS.md", "x"],
    ["CHANGELOG.md", "## [Unreleased]\n"],
    ["docs/ARCHITECTURE.md", "# Arch\n\n## Component Registry\n\n| Component | Responsibility | Dependencies | Entry |\n| --- | --- | --- | --- |\n| auth | login | db | src/auth.ts |\n"],
    ["docs/features/auth.md", "x"],
    ["docs/plans/DEVELOPMENT_PLAN.md", "x"],
    ["docs/rules/lifecycle.md", "x"],
    [".gitignore", "x"],
    [".env.example", "x"],
    [".github/workflows/ci.yml", "x"],
    [".governance/state.json", "{}"],
    [".governance/preflight.json", "{}"],
  ];
  for (const [p, c] of files) write(path.join(dir, p), c);
  write(path.join(dir, ".governance/manifest.json"), JSON.stringify({ governance_version: "1.0.0", artifacts: [] }));
  write(path.join(dir, ".governance/git-policy.json"), JSON.stringify({ protectedBranches: ["main", "master"], directPush: false, requireReview: true, allowForcePush: false }));
  fs.copyFileSync(VALIDATOR, path.join(dir, "scripts/verify-governance.js"));
  fs.copyFileSync(LOCK_CHECK, path.join(dir, "scripts/check-lock.js"));
  fs.copyFileSync(GIT_POLICY_CHECK, path.join(dir, "scripts/check-git-policy.js"));
  fs.copyFileSync(SECRET_CHECK, path.join(dir, "scripts/check-secrets.js"));
  fs.copyFileSync(SYNC_CHECK, path.join(dir, "scripts/check-sync.js"));
}

test("full default structure exits 0 (defaults mode)", () => {
  const dir = tmp("full");
  buildFullDefault(dir);

  const r = run(dir);
  return r.status === 0 && r.stdout.includes("21/21 checks passed.");
});

test("empty CI workflow directory does not satisfy the validator", () => {
  const dir = tmp("empty-ci");
  buildFullDefault(dir);
  fs.rmSync(path.join(dir, ".github/workflows/ci.yml"));
  const r = run(dir, ["--json"]);
  if (r.status !== 1) return false;
  const report = JSON.parse(r.stdout);
  const ci = report.results.find((x) => x.name === "CI workflow");
  return ci && ci.ok === false;
});

test("skeleton ARCHITECTURE.md fails (wrong-but-present)", () => {
  const dir = tmp("arch-skeleton");
  buildFullDefault(dir);
  write(path.join(dir, "docs", "ARCHITECTURE.md"), "# Architecture\n\n## Component Registry\n\n| Component | Responsibility | Dependencies | Entry |\n| --- | --- | --- | --- |\n| <!-- add rows as components are registered --> | | | |\n");
  const r = run(dir);
  return r.status === 1 && r.stdout.includes("Architecture doc");
});

test("ARCHITECTURE.md in list/prose form passes (form is not constrained)", () => {
  const dir = tmp("arch-list");
  buildFullDefault(dir);
  write(path.join(dir, "docs", "ARCHITECTURE.md"), "# Architecture\n\n## Components\n\n- auth: login (src/auth.ts)\n- db: persistence\n");
  const r = run(dir);
  return r.status === 0;
});

test("ARCHITECTURE.md unreplaced placeholder fails", () => {
  const dir = tmp("arch-placeholder");
  buildFullDefault(dir);
  write(path.join(dir, "docs", "ARCHITECTURE.md"), "# Architecture\n\n{{ONE_SENTENCE_DESCRIPTION}}\n");
  const r = run(dir);
  return r.status === 1;
});

test("ARCHITECTURE.md headings-only skeleton fails", () => {
  const dir = tmp("arch-headings");
  buildFullDefault(dir);
  write(path.join(dir, "docs", "ARCHITECTURE.md"), "# Architecture\n\n## Overview\n\n## Data Flow\n\n<!-- describe -->\n");
  const r = run(dir);
  return r.status === 1;
});

// ---------- 3. Custom structure via manifest ----------
test("custom doc root (documentation/) follows manifest (manifest mode)", () => {
  const dir = tmp("custom");
  const dirs = ["documentation/features", "documentation/plans", "documentation/rules", ".governance", ".github/workflows", "scripts"];
  for (const d of dirs) fs.mkdirSync(path.join(dir, d), { recursive: true });
  const files = [
    ["AGENTS.md", "x"],
    ["CHANGELOG.md", "## [Unreleased]\n"],
    ["documentation/ARCHITECTURE.md", "x"],
    ["documentation/features/auth.md", "x"],
    ["documentation/plans/DEVELOPMENT_PLAN.md", "x"],
    ["documentation/rules/lifecycle.md", "x"],
    [".gitignore", "x"],
    [".env.example", "x"],
    [".github/workflows/ci.yml", "x"],
    [".governance/state.json", "{}"],
    [".governance/preflight.json", "{}"],
  ];
  for (const [p, c] of files) write(path.join(dir, p), c);
  const manifest = {
    schema_version: "1.0",
    governance_version: "1.0.0",
    release: { version: "1.0.0", tag: "v1.0.0", validated: false },
    doc_root: "documentation",
    artifacts: [
      { name: "AGENTS.md", path: "AGENTS.md", kind: "file" },
      { name: "CHANGELOG.md", path: "CHANGELOG.md", kind: "file" },
      { name: "Architecture doc", path: "documentation/ARCHITECTURE.md", kind: "file" },
      { name: "Feature registry", path: "documentation/features", kind: "dir" },
      { name: "Plans", path: "documentation/plans", kind: "dir" },
      { name: "Rules", path: "documentation/rules", kind: "dir" },
    ],
  };
  write(path.join(dir, ".governance/manifest.json"), JSON.stringify(manifest));
  write(path.join(dir, ".governance/git-policy.json"), JSON.stringify({ protectedBranches: ["main"], directPush: false, requireReview: true, allowForcePush: false }));
  fs.copyFileSync(VALIDATOR, path.join(dir, "scripts/verify-governance.js"));
  fs.copyFileSync(SYNC_CHECK, path.join(dir, "scripts/check-sync.js"));

  const r = run(dir);
  return r.status === 0 && r.stdout.includes("mode: manifest") && r.stdout.includes("13/13 checks passed.");
});

// ---------- 4. Manifest without governance_version ----------
test("manifest without governance_version exits 1", () => {
  const dir = tmp("noversion");
  fs.mkdirSync(path.join(dir, ".governance"), { recursive: true });
  fs.mkdirSync(path.join(dir, "scripts"), { recursive: true });
  write(path.join(dir, ".governance/manifest.json"), JSON.stringify({ schema_version: "1.0", artifacts: [] }));
  fs.copyFileSync(VALIDATOR, path.join(dir, "scripts/verify-governance.js"));

  const r = run(dir);
  return r.status === 1 && r.stdout.includes("Governance version");
});

// ---------- 5. --json output ----------
test("--json reports passedAll, mode and governance_version", () => {
  const dir = tmp("json");
  buildFullDefault(dir);

  const r = run(dir, ["--json"]);
  if (r.status !== 0) return false;
  const out = JSON.parse(r.stdout);
  return (
    out.mode === "defaults" &&
    out.passedAll === true &&
    out.governance_version === "1.0.0" &&
    Array.isArray(out.results) &&
    out.results.length === 21 &&
    out.score === 1
  );
});

test("--json score reflects partial failures (20/21)", () => {
  const dir = tmp("score");
  buildFullDefault(dir);
  fs.rmSync(path.join(dir, ".env.example"));

  const r = run(dir, ["--json"]);
  if (r.status !== 1) return false;
  const out = JSON.parse(r.stdout);
  return out.total === 21 && out.passed === 20 && Math.abs(out.score - 20 / 21) < 1e-9;
});

// ---------- 6. --help output ----------
test("--help exits 0 and prints usage", () => {
  const dir = tmp("help");
  const r = run(dir, ["--help"]);
  return r.status === 0 && r.stdout.includes("Usage:") && r.stdout.includes("--json");
});

// ---------- 7. legacy .agent must not exist ----------
test("validator uses .governance only and leaves no .agent dir", () => {
  const dir = tmp("noagent");
  buildFullDefault(dir);
  const r = run(dir);
  return (
    r.status === 0 &&
    r.stdout.includes(".governance manifest") &&
    !fs.existsSync(path.join(dir, ".agent"))
  );
});

// ---------- 8. validation.json is optional runtime output ----------
test("validation.json present is optional and still passes", () => {
  const dir = tmp("withval");
  buildFullDefault(dir);
  write(path.join(dir, ".governance/validation.json"), "{}");
  const r = run(dir);
  return (
    r.status === 0 &&
    r.stdout.includes("21/21 checks passed.") &&
    !r.stdout.includes(".governance validation")
  );
});

// ---------- 8b-8c. Lock check & changelog format ----------

test("check-lock: no state exits 0", () => {
  const dir = tmp("lock-none");
  const r = spawnSync(process.execPath, [LOCK_CHECK], { cwd: dir, encoding: "utf8" });
  return r.status === 0;
});

test("check-lock: held lock exits 1", () => {
  const dir = tmp("lock-held");
  write(path.join(dir, ".governance/state.json"), JSON.stringify({ locked: "agent-2", agent_id: "agent-2", task_id: "t-9" }));
  const r = spawnSync(process.execPath, [LOCK_CHECK], { cwd: dir, encoding: "utf8" });
  return r.status === 1 && r.stderr.includes("LOCK HELD");
});

test("check-lock: unlocked state exits 0", () => {
  const dir = tmp("lock-free");
  write(path.join(dir, ".governance/state.json"), JSON.stringify({ locked: null }));
  const r = spawnSync(process.execPath, [LOCK_CHECK], { cwd: dir, encoding: "utf8" });
  return r.status === 0;
});

test("check-lock: false and empty-string locks are unlocked", () => {
  const values = [false, ""];
  return values.every((locked, i) => {
    const dir = tmp(`lock-falsy-${i}`);
    write(path.join(dir, ".governance/state.json"), JSON.stringify({ locked }));
    const r = spawnSync(process.execPath, [LOCK_CHECK, "--json"], { cwd: dir, encoding: "utf8" });
    if (r.status !== 0) return false;
    const out = JSON.parse(r.stdout);
    return out.locked === false && out.lock === null;
  });
});

test("check-lock: malformed state exits 1 (fail-closed)", () => {
  const dir = tmp("lock-corrupt");
  write(path.join(dir, ".governance/state.json"), "{ not valid json");
  const r = spawnSync(process.execPath, [LOCK_CHECK], { cwd: dir, encoding: "utf8" });
  return r.status === 1 && /refusing to proceed/.test(r.stderr);
});

test("validator: CHANGELOG without version section exits 1", () => {
  const dir = tmp("badchangelog");
  buildFullDefault(dir);
  write(path.join(dir, "CHANGELOG.md"), "no version section here");
  const r = run(dir);
  return r.status === 1 && r.stdout.includes("CHANGELOG format");
});

test("validator: invalid git-policy.json exits 1", () => {
  const dir = tmp("badgitpolicy");
  buildFullDefault(dir);
  write(path.join(dir, ".governance/git-policy.json"), JSON.stringify({ directPush: false }));
  const r = run(dir);
  return r.status === 1 && r.stdout.includes("Git policy");
});

test("check-git-policy: malformed policy exits 1 (fail-closed)", () => {
  const dir = tmp("gitpolicy-corrupt");
  gitInit(dir);
  write(path.join(dir, ".governance/git-policy.json"), "{ not valid json");
  const r = spawnSync(process.execPath, [GIT_POLICY_CHECK], { cwd: dir, encoding: "utf8" });
  return r.status === 1 && /refusing to proceed/.test(r.stderr);
});

test("check-git-policy: protected branch with directPush=false exits 1", () => {
  const dir = tmp("gitpolicy-blocked");
  gitInit(dir);
  write(path.join(dir, ".governance/git-policy.json"), JSON.stringify({ protectedBranches: ["main", "master"], directPush: false, requireReview: true, allowForcePush: false }));
  const r = spawnSync(process.execPath, [GIT_POLICY_CHECK], { cwd: dir, encoding: "utf8" });
  return r.status === 1 && r.stderr.includes("BLOCKED");
});

test("check-git-policy: feature branch exits 0", () => {
  const dir = tmp("gitpolicy-ok");
  gitInit(dir);
  spawnSync("git", ["checkout", "-q", "-b", "feature/agent-20260812-fix"], { cwd: dir });
  write(path.join(dir, ".governance/git-policy.json"), JSON.stringify({ protectedBranches: ["main", "master"], directPush: false, requireReview: true, allowForcePush: false }));
  const r = spawnSync(process.execPath, [GIT_POLICY_CHECK], { cwd: dir, encoding: "utf8" });
  return r.status === 0;
});

test("check-secrets: staged fake secret exits 1 without leaking the token", () => {
  const dir = tmp("secrets-hit");
  gitInit(dir);
  const value = assemble("AKIA", "IOSFODNN7EXAMPLE");
  write(path.join(dir, "app.js"), assemble("const apiKey = '", value, "';"));
  spawnSync("git", ["add", "app.js"], { cwd: dir });
  const r = spawnSync(process.execPath, [SECRET_CHECK], { cwd: dir, encoding: "utf8" });
  return r.status === 1 && r.stderr.includes("aws-access-key") && !r.stderr.includes(value);
});

test("check-secrets: github PAT hits github-pat pattern", () => {
  const dir = tmp("secrets-pat");
  gitInit(dir);
  const value = assemble("ghp_", "ABCDEFGHIJKLMNOPQRST0123456789");
  write(path.join(dir, "ci.yml"), assemble("token: ", value));
  spawnSync("git", ["add", "ci.yml"], { cwd: dir });
  const r = spawnSync(process.execPath, [SECRET_CHECK], { cwd: dir, encoding: "utf8" });
  return r.status === 1 && r.stderr.includes("github-pat") && !r.stderr.includes(value);
});

test("check-secrets: openai-style key hits openai-style-key pattern", () => {
  const dir = tmp("secrets-openai");
  gitInit(dir);
  const value = assemble("sk-", "abc1234567890XYZ0123456789");
  write(path.join(dir, "app.js"), assemble("const api = '", value, "';"));
  spawnSync("git", ["add", "app.js"], { cwd: dir });
  const r = spawnSync(process.execPath, [SECRET_CHECK], { cwd: dir, encoding: "utf8" });
  return r.status === 1 && r.stderr.includes("openai-style-key") && !r.stderr.includes(value);
});

test("check-secrets: private key header hits private-key-header pattern", () => {
  const dir = tmp("secrets-pem");
  gitInit(dir);
  const header = assemble("-----BEGIN ", "RSA PRIVATE KEY", "-----");
  const footer = assemble("-----END ", "RSA PRIVATE KEY", "-----");
  write(path.join(dir, "id_rsa"), assemble(header, "\nmock\n", footer));
  spawnSync("git", ["add", "id_rsa"], { cwd: dir });
  const r = spawnSync(process.execPath, [SECRET_CHECK], { cwd: dir, encoding: "utf8" });
  return r.status === 1 && r.stderr.includes("private-key-header") && !r.stderr.includes(header);
});

test("check-secrets: credential assignment hits credential-assignment pattern", () => {
  const dir = tmp("secrets-creds");
  gitInit(dir);
  write(path.join(dir, "config.env"), assemble("api_", "key=abcdefgh12345678"));
  spawnSync("git", ["add", "config.env"], { cwd: dir });
  const r = spawnSync(process.execPath, [SECRET_CHECK], { cwd: dir, encoding: "utf8" });
  return r.status === 1 && r.stderr.includes("credential-assignment") && !r.stderr.includes("abcdefgh12345678");
});

test("check-secrets: expanded provider and token patterns block without leaking values", () => {
  const fixtures = [
    ["slack-token", "slack.txt", assemble("xoxb-", "123456789012-123456789012-abcdefghijklmnop")],
    ["google-api-key", "google.txt", assemble("AIza", "SyA123456789012345678901234567890123")],
    ["stripe-secret-key", "stripe.txt", assemble("sk_", "live_1234567890abcdefghijklmnop")],
    ["azure-storage-key", "azure.txt", assemble("DefaultEndpointsProtocol=https;AccountName=demo;", "Account", "Key=1234567890abcdef1234")],
    ["jwt", "jwt.txt", assemble("eyJhbGciOiJIUzI1NiJ9.", "eyJzdWIiOiIxMjMifQ.", "abcdefghijklmnop")],
    ["base64-secret", "base64.txt", assemble("sec", "ret=QWxhZGRpbjpPcGVu", "U2VzYW1lMTIzNDU2Nzg5MA==")],
    ["pem-body", "pem.txt", assemble("MIIEvQIBADAN", "BgkqhkiG9w0BAQEFAASCBK", "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa")],
  ];
  return fixtures.every(([pattern, file, value]) => {
    const dir = tmp(`secrets-${pattern}`);
    gitInit(dir);
    write(path.join(dir, file), value);
    spawnSync("git", ["add", file], { cwd: dir });
    const r = spawnSync(process.execPath, [SECRET_CHECK], { cwd: dir, encoding: "utf8" });
    return r.status === 1 && r.stderr.includes(pattern) && !r.stderr.includes(value);
  });
});

test("check-secrets: punctuated credential reports the real added line", () => {
  const dir = tmp("secrets-punctuation");
  gitInit(dir);
  write(path.join(dir, "config.txt"), assemble("one\ntwo\npass", "word = 'p@ss/w0rd+=!'\n"));
  spawnSync("git", ["add", "config.txt"], { cwd: dir });
  const r = spawnSync(process.execPath, [SECRET_CHECK, "--json"], { cwd: dir, encoding: "utf8" });
  if (r.status !== 1) return false;
  const out = JSON.parse(r.stdout);
  return out.hits.length === 1 && out.hits[0].pattern === "credential-assignment" && out.hits[0].line === 3 && !r.stdout.includes("p@ss/w0rd+=!");
});

test("check-secrets: force-added .env is scanned", () => {
  const dir = tmp("secrets-force-env");
  gitInit(dir);
  write(path.join(dir, ".gitignore"), ".env\n");
  write(path.join(dir, ".env"), assemble("TOK", "EN=p@ss/w0rd+=!\n"));
  spawnSync("git", ["add", "-f", ".env"], { cwd: dir });
  const r = spawnSync(process.execPath, [SECRET_CHECK], { cwd: dir, encoding: "utf8" });
  return r.status === 1 && r.stderr.includes("credential-assignment");
});

test("check-secrets: clean staged diff exits 0", () => {
  const dir = tmp("secrets-clean");
  gitInit(dir);
  write(path.join(dir, "app.js"), "const greeting = 'hello';");
  spawnSync("git", ["add", "app.js"], { cwd: dir });
  const r = spawnSync(process.execPath, [SECRET_CHECK], { cwd: dir, encoding: "utf8" });
  return r.status === 0;
});

test("validator: missing check-secrets.js exits 1", () => {
  const dir = tmp("nosecrets");
  buildFullDefault(dir);
  fs.rmSync(path.join(dir, "scripts/check-secrets.js"));
  const r = run(dir);
  return r.status === 1 && r.stdout.includes("Secret scan gate");
});

// ---------- 8d-8f. Sync groups mechanical check ----------

test("check-sync: changed src without ARCHITECTURE.md exits 1", () => {
  const dir = tmp("sync-unsynced");
  gitInit(dir);
  fs.mkdirSync(path.join(dir, "src"), { recursive: true });
  write(path.join(dir, "src", "a.ts"), "x");
  spawnSync("git", ["add", "src/a.ts"], { cwd: dir });
  write(
    path.join(dir, ".governance", "sync-rules.json"),
    JSON.stringify({ syncGroups: [{ name: "api-architecture", watch: ["src/**"], require: ["docs/ARCHITECTURE.md"] }] })
  );
  write(path.join(dir, ".governance", "state.json"), JSON.stringify({ task_start_sha: "" }));
  fs.mkdirSync(path.join(dir, "scripts"), { recursive: true });
  fs.copyFileSync(SYNC_CHECK, path.join(dir, "scripts/check-sync.js"));
  const r = spawnSync(process.execPath, [SYNC_CHECK], { cwd: dir, encoding: "utf8" });
  return r.status === 1 && r.stderr.includes("api-architecture");
});

test("check-sync: changed src AND ARCHITECTURE.md exits 0", () => {
  const dir = tmp("sync-ok");
  gitInit(dir);
  fs.mkdirSync(path.join(dir, "src"), { recursive: true });
  fs.mkdirSync(path.join(dir, "docs"), { recursive: true });
  write(path.join(dir, "src", "a.ts"), "x");
  write(path.join(dir, "docs", "ARCHITECTURE.md"), "y");
  spawnSync("git", ["add", "src/a.ts", "docs/ARCHITECTURE.md"], { cwd: dir });
  write(
    path.join(dir, ".governance", "sync-rules.json"),
    JSON.stringify({ syncGroups: [{ name: "api-architecture", watch: ["src/**"], require: ["docs/ARCHITECTURE.md"] }] })
  );
  write(path.join(dir, ".governance", "state.json"), JSON.stringify({ task_start_sha: "" }));
  fs.mkdirSync(path.join(dir, "scripts"), { recursive: true });
  fs.copyFileSync(SYNC_CHECK, path.join(dir, "scripts/check-sync.js"));
  const r = spawnSync(process.execPath, [SYNC_CHECK], { cwd: dir, encoding: "utf8" });
  return r.status === 0;
});

test("check-sync: existing task_start_sha is honoured (resume, not recomputed)", () => {
  const dir = tmp("sync-resume");
  gitInit(dir);
  const firstSha = gitHead(dir);
  // a second commit happens mid-task: the recorded task_start_sha must still be the first
  fs.mkdirSync(path.join(dir, "src"), { recursive: true });
  write(path.join(dir, "src", "a.ts"), "x");
  spawnSync("git", ["add", "src/a.ts"], { cwd: dir });
  spawnSync("git", ["commit", "-q", "-m", "mid-task commit"], { cwd: dir });
  write(path.join(dir, ".governance", "sync-rules.json"),
    JSON.stringify({ syncGroups: [{ name: "api-architecture", watch: ["src/**"], require: ["docs/ARCHITECTURE.md"] }] }));
  write(path.join(dir, ".governance", "state.json"), JSON.stringify({ task_start_sha: firstSha }));
  const r = spawnSync(process.execPath, [SYNC_CHECK, "--json"], { cwd: dir, encoding: "utf8" });
  const out = JSON.parse(r.stdout);
  // base must equal the recorded SHA (resume), and the committed src change must be detected
  return out.base === firstSha && r.status === 1 && out.unsynced.some((u) => u.group === "api-architecture");
});

test("check-sync: writes the sync section into drift-report.json", () => {
  const dir = tmp("sync-drift");
  gitInit(dir);
  fs.mkdirSync(path.join(dir, "src"), { recursive: true });
  write(path.join(dir, "src", "a.ts"), "x");
  spawnSync("git", ["add", "src/a.ts"], { cwd: dir });
  write(path.join(dir, ".governance", "sync-rules.json"),
    JSON.stringify({ syncGroups: [{ name: "api-architecture", watch: ["src/**"], require: ["docs/ARCHITECTURE.md"] }] }));
  write(path.join(dir, ".governance", "state.json"), JSON.stringify({ task_start_sha: "" }));
  spawnSync(process.execPath, [SYNC_CHECK], { cwd: dir, encoding: "utf8" });
  const dr = path.join(dir, ".governance", "drift-report.json");
  if (!fs.existsSync(dr)) return false;
  const j = JSON.parse(fs.readFileSync(dr, "utf8"));
  return j.sync && j.sync.clean === false && j.sync.unsynced.includes("api-architecture");
});

test("check-sync: NUL status parsing preserves untracked unicode/space paths", () => {
  const dir = tmp("sync-untracked-paths");
  gitInit(dir);
  write(path.join(dir, "src", "new file 中文.ts"), "x");
  write(path.join(dir, "docs", "ARCHITECTURE.md"), "architecture");
  write(path.join(dir, ".governance", "sync-rules.json"),
    JSON.stringify({ syncGroups: [{ name: "api-architecture", watch: ["src/**"], require: ["docs/ARCHITECTURE.md"] }] }));
  write(path.join(dir, ".governance", "state.json"), JSON.stringify({ task_start_sha: "" }));
  const r = spawnSync(process.execPath, [SYNC_CHECK, "--json"], { cwd: dir, encoding: "utf8" });
  if (r.status !== 0) return false;
  const out = JSON.parse(r.stdout);
  return out.clean === true && out.unsynced.length === 0;
});

test("check-sync: rename matching uses the destination path", () => {
  const dir = tmp("sync-rename-path");
  gitInit(dir);
  write(path.join(dir, "legacy", "old name 中文.ts"), "x");
  spawnSync("git", ["add", "legacy"], { cwd: dir });
  spawnSync("git", ["commit", "-q", "-m", "add legacy file"], { cwd: dir });
  fs.mkdirSync(path.join(dir, "src"), { recursive: true });
  fs.renameSync(path.join(dir, "legacy", "old name 中文.ts"), path.join(dir, "src", "new name 中文.ts"));
  spawnSync("git", ["add", "-A"], { cwd: dir });
  write(path.join(dir, ".governance", "sync-rules.json"),
    JSON.stringify({ syncGroups: [
      { name: "new-path", watch: ["src/**"], require: ["docs/ARCHITECTURE.md"] },
      { name: "old-path", watch: ["legacy/**"], require: ["docs/ARCHITECTURE.md"] },
    ] }));
  write(path.join(dir, ".governance", "state.json"), JSON.stringify({ task_start_sha: "" }));
  const r = spawnSync(process.execPath, [SYNC_CHECK, "--json"], { cwd: dir, encoding: "utf8" });
  if (r.status !== 1) return false;
  const out = JSON.parse(r.stdout);
  return out.unsynced.some((u) => u.group === "new-path") && !out.unsynced.some((u) => u.group === "old-path");
});

test("check-sync: malformed policy and state exit 1 (fail-closed)", () => {
  const badPolicy = tmp("sync-bad-policy");
  gitInit(badPolicy);
  write(path.join(badPolicy, ".governance/sync-rules.json"), "{ not valid json");
  const p = spawnSync(process.execPath, [SYNC_CHECK], { cwd: badPolicy, encoding: "utf8" });
  const badState = tmp("sync-bad-state");
  gitInit(badState);
  write(path.join(badState, ".governance/sync-rules.json"), JSON.stringify({ syncGroups: [] }));
  write(path.join(badState, ".governance/state.json"), "{ not valid json");
  const s = spawnSync(process.execPath, [SYNC_CHECK], { cwd: badState, encoding: "utf8" });
  return p.status === 1 && s.status === 1 && /refusing to proceed/.test(p.stderr) && /refusing to proceed/.test(s.stderr);
});

test("validator: missing check-sync.js exits 1", () => {
  const dir = tmp("nosync");
  buildFullDefault(dir);
  fs.rmSync(path.join(dir, "scripts/check-sync.js"));
  const r = run(dir);
  return r.status === 1 && r.stdout.includes("Sync groups check");
});

test("validator: manifest sync check keeps an explicit false ok field", () => {
  const dir = tmp("nosync-json");
  buildFullDefault(dir);
  fs.rmSync(path.join(dir, "scripts/check-sync.js"));
  const r = run(dir, ["--json"]);
  if (r.status !== 1) return false;
  const out = JSON.parse(r.stdout);
  const check = out.results.find((x) => x.name === "Sync groups check");
  return check && check.ok === false;
});

// ---------- 9. Doc parity check (scripts/check-doc-parity.js) ----------
const PARITY_CHECK = path.join(__dirname, "..", "scripts", "check-doc-parity.js");

function buildParityTrees(dir) {
  // minimal three-tree fixture with one parallel doc + root entry files
  write(path.join(dir, "README.md"), "# AI Agent Governance\n\n[English](README.md) · [简体中文](docs/zh-CN/README.md) · [繁體中文](docs/zh-TW/README.md)\n\n## Intro\n\n- Hello\n");
  write(path.join(dir, "CONTRIBUTING.md"), "# Contributing\n\n## Development\n");
  for (const lang of ["en", "zh-CN", "zh-TW"]) {
    write(path.join(dir, "docs", lang, "README.md"), `# 标题\n\n## 章节\n\n- 项目\n`);
    write(path.join(dir, "docs", lang, "doc.md"), `# Doc\n\n## Section\n\n- one\n\n## Table\n\n| a | b |\n| --- | --- |\n| 1 | 2 |\n`);
  }
  // zh-CN/zh-TW in-tree CONTRIBUTING.md must also exist for entry checks
  write(path.join(dir, "docs", "zh-CN", "CONTRIBUTING.md"), "# 贡献\n\n## 开发\n");
  write(path.join(dir, "docs", "zh-TW", "CONTRIBUTING.md"), "# 貢獻\n\n## 開發\n");
}

test("doc parity: parallel trees exit 0", () => {
  const dir = tmp("parity-ok");
  buildParityTrees(dir);
  const r = spawnSync(process.execPath, [PARITY_CHECK], { cwd: dir, encoding: "utf8" });
  return r.status === 0;
});

test("doc parity: heading drift in one tree exits 1", () => {
  const dir = tmp("parity-drift");
  buildParityTrees(dir);
  fs.appendFileSync(path.join(dir, "docs", "zh-TW", "doc.md"), "\n## 额外章节\n");
  const r = spawnSync(process.execPath, [PARITY_CHECK], { cwd: dir, encoding: "utf8" });
  return r.status === 1 && r.stdout.includes("structure drift");
});

test("doc parity: missing file in one tree exits 1", () => {
  const dir = tmp("parity-missing");
  buildParityTrees(dir);
  fs.rmSync(path.join(dir, "docs", "en", "doc.md"));
  const r = spawnSync(process.execPath, [PARITY_CHECK], { cwd: dir, encoding: "utf8" });
  return r.status === 1 && r.stdout.includes("missing in docs/en/");
});

// ---------- 10. Doc freshness check (scripts/check-doc-freshness.js) ----------
const FRESHNESS_CHECK = path.join(__dirname, "..", "scripts", "check-doc-freshness.js");

// commit file(s) with a forced author/committer date: `git commit --date=<iso>`
function gitCommitAt(dir, files, dateIso, msg) {
  spawnSync("git", ["add", ...files], { cwd: dir });
  spawnSync("git", ["commit", "-q", "-m", msg, "--date=" + dateIso], {
    cwd: dir,
    env: { ...process.env, GIT_AUTHOR_DATE: dateIso, GIT_COMMITTER_DATE: dateIso },
  });
}

function buildFreshnessFixture(dir) {
  gitInit(dir);
  // docs/ARCHITECTURE.md committed 60 days ago
  write(path.join(dir, "docs", "ARCHITECTURE.md"), "# Arch\n");
  const oldDate = new Date(Date.now() - 60 * 86400000).toISOString().slice(0, 10);
  gitCommitAt(dir, ["docs/ARCHITECTURE.md"], oldDate + "T00:00:00+00:00", "doc old");
  // src/ code committed recently (code active)
  write(path.join(dir, "src", "main.ts"), "export const x = 1;\n");
  gitCommitAt(dir, ["src/main.ts"], new Date().toISOString(), "code recent");
  // CHANGELOG.md committed recently (fresh)
  write(path.join(dir, "CHANGELOG.md"), "# Changelog\n");
  gitCommitAt(dir, ["CHANGELOG.md"], new Date().toISOString(), "changelog fresh");
}

test("doc freshness: stale doc flagged, fresh doc not flagged (exit 0)", () => {
  const dir = tmp("freshness");
  buildFreshnessFixture(dir);
  const r = spawnSync(process.execPath, [FRESHNESS_CHECK, "--json"], { cwd: dir, encoding: "utf8" });
  const out = JSON.parse(r.stdout);
  return (
    r.status === 0 &&
    out.stale.includes("docs/ARCHITECTURE.md") &&
    !out.stale.includes("CHANGELOG.md") &&
    !out.veryStale.includes("docs/ARCHITECTURE.md")
  );
});

test("doc freshness: very stale doc (90+ days) flagged as very stale", () => {
  const dir = tmp("freshness-very");
  gitInit(dir);
  write(path.join(dir, "docs", "ARCHITECTURE.md"), "# Arch\n");
  const oldDate = new Date(Date.now() - 95 * 86400000).toISOString().slice(0, 10);
  gitCommitAt(dir, ["docs/ARCHITECTURE.md"], oldDate + "T00:00:00+00:00", "doc very old");
  write(path.join(dir, "src", "main.ts"), "x\n");
  gitCommitAt(dir, ["src/main.ts"], new Date().toISOString(), "code recent");
  const r = spawnSync(process.execPath, [FRESHNESS_CHECK, "--json"], { cwd: dir, encoding: "utf8" });
  const out = JSON.parse(r.stdout);
  return r.status === 0 && out.veryStale.includes("docs/ARCHITECTURE.md");
});

test("doc freshness: drift-report.json gains freshness section", () => {
  const dir = tmp("freshness-drift");
  buildFreshnessFixture(dir);
  write(path.join(dir, ".governance", "drift-report.json"), JSON.stringify({ missing: [] }));
  spawnSync(process.execPath, [FRESHNESS_CHECK], { cwd: dir, encoding: "utf8" });
  const drift = JSON.parse(fs.readFileSync(path.join(dir, ".governance", "drift-report.json"), "utf8"));
  return drift.freshness && Array.isArray(drift.freshness.stale);
});

// ---------- 11. Doc consistency check (scripts/check-doc-consistency.js) ----------
const CONSISTENCY_CHECK = path.join(__dirname, "..", "scripts", "check-doc-consistency.js");

test("doc consistency: clean repo exits 0 with no issues", () => {
  const dir = tmp("consistency-clean");
  // minimal valid repo: version example matches package.json
  write(path.join(dir, "package.json"), JSON.stringify({ version: "1.2.3" }));
  write(path.join(dir, "docs", "en", "doc.md"), "# Doc\n\n## Section\n");
  write(path.join(dir, "docs", "zh-CN", "doc.md"), "# Doc\n\n## Section\n");
  write(path.join(dir, "docs", "zh-TW", "doc.md"), "# Doc\n\n## Section\n");
  write(path.join(dir, "docs", "zh-CN", "README.md"), "# R\n\n## S\n");
  write(path.join(dir, "docs", "zh-TW", "README.md"), "# R\n\n## S\n");
  write(path.join(dir, "README.md"), "# R\n\n## S\n");
  const r = spawnSync(process.execPath, [CONSISTENCY_CHECK, "--json"], { cwd: dir, encoding: "utf8" });
  const out = JSON.parse(r.stdout);
  return r.status === 0 && Object.values(out.issues).every((v) => (Array.isArray(v) ? v.length === 0 : true));
});

test("doc consistency: stale version example in SKILL.md-style doc is flagged", () => {
  const dir = tmp("consistency-version");
  write(path.join(dir, "package.json"), JSON.stringify({ version: "2.0.0" }));
  write(path.join(dir, "SKILL.md"), 'governance_version": "1.0.0"');
  const r = spawnSync(process.execPath, [CONSISTENCY_CHECK, "--json"], { cwd: dir, encoding: "utf8" });
  const out = JSON.parse(r.stdout);
  return r.status === 0 && out.issues.version_examples.some((i) => i.includes("1.0.0"));
});

test("doc consistency: broken relative link is flagged", () => {
  const dir = tmp("consistency-link");
  write(path.join(dir, "README.md"), "[missing](docs/does-not-exist.md)");
  const r = spawnSync(process.execPath, [CONSISTENCY_CHECK, "--json"], { cwd: dir, encoding: "utf8" });
  const out = JSON.parse(r.stdout);
  return r.status === 0 && out.issues.broken_links.some((i) => i.includes("does-not-exist.md"));
});

test("doc consistency: archive links are scanned on Windows path separators", () => {
  const dir = tmp("consistency-archive-link");
  write(path.join(dir, "package.json"), JSON.stringify({ version: "1.0.0" }));
  write(path.join(dir, "docs/archive/old.md"), "[missing](../does-not-exist.md)\n");
  const r = spawnSync(process.execPath, [CONSISTENCY_CHECK, "--json"], { cwd: dir, encoding: "utf8" });
  const out = JSON.parse(r.stdout);
  return r.status === 0 && out.issues.broken_links.some((i) => i.includes("docs/archive/old.md") && i.includes("does-not-exist.md"));
});


test("doc consistency: numeric claim mismatch with validator source is flagged", () => {
  const dir = tmp("consistency-numeric");
  // 20-item DEFAULTS array + README claiming 99
  write(path.join(dir, "scripts", "verify_governance.js"),
    "const DEFAULTS = [\n  [\"a\", \"a\", isFile],\n  [\"b\", \"b\", isFile],\n  [\"c\", \"c\", isFile],\n  [\"d\", \"d\", isFile],\n  [\"e\", \"e\", isFile],\n];\n");
  write(path.join(dir, "README.md"), "the validator has 99 checks");
  const r = spawnSync(process.execPath, [CONSISTENCY_CHECK, "--json"], { cwd: dir, encoding: "utf8" });
  const out = JSON.parse(r.stdout);
  return r.status === 0 && out.issues.numeric_claims.some((i) => i.includes("99"));
});

test("doc consistency: parity unavailable is reported, not claimed as pass", () => {
  const dir = tmp("consistency-noparity");
  write(path.join(dir, "package.json"), JSON.stringify({ version: "1.0.0" }));
  // no scripts/check-doc-parity.js in this fixture
  const r = spawnSync(process.execPath, [CONSISTENCY_CHECK, "--json"], { cwd: dir, encoding: "utf8" });
  const out = JSON.parse(r.stdout);
  return r.status === 0 && out.parity === "unavailable";
});

test("doc consistency: sub-skill trigger missing from commands.md is flagged", () => {
  const dir = tmp("consistency-prompt");
  // fixture: sub-skills.md with one trigger, commands.md without it
  write(path.join(dir, "references", "templates", "sub-skills.md"),
    'description: ... Triggers on "unique-trigger-xyz".');
  write(path.join(dir, "docs", "en", "commands.md"), "# Commands\n\nno such trigger here\n");
  const r = spawnSync(process.execPath, [CONSISTENCY_CHECK, "--json"], { cwd: dir, encoding: "utf8" });
  const out = JSON.parse(r.stdout);
  return r.status === 0 && out.issues.prompt_sync.some((i) => i.includes("unique-trigger-xyz"));
});

// ---------- 12-16. Release planning & approval gate (scripts/release-manager.js) ----------

const RELEASE_TOOL = path.join(__dirname, "..", "scripts", "release-manager.js");

function runRelease(dir, args = []) {
  return spawnSync(process.execPath, [RELEASE_TOOL, ...args], { cwd: dir, encoding: "utf8" });
}

function planChanges(current, changes) {
  return runRelease(TMP_ROOT, ["plan", "--json", JSON.stringify({ current, changes })]);
}

function gitInit(dir) {
  spawnSync("git", ["init", "-q"], { cwd: dir });
  spawnSync("git", ["config", "user.email", "test@example.com"], { cwd: dir });
  spawnSync("git", ["config", "user.name", "Test"], { cwd: dir });
  write(path.join(dir, ".gitignore"), ".governance/\n");
  write(path.join(dir, "file.txt"), "x");
  spawnSync("git", ["add", "."], { cwd: dir });
  spawnSync("git", ["commit", "-q", "-m", "init"], { cwd: dir });
}

function gitHead(dir) {
  const r = spawnSync("git", ["rev-parse", "HEAD"], { cwd: dir, encoding: "utf8" });
  return String(r.stdout || "").trim();
}

function gitTags(dir) {
  const r = spawnSync("git", ["tag", "-l"], { cwd: dir, encoding: "utf8" });
  return String(r.stdout || "").trim();
}

test("release plan: README-scale doc changes recommend patch", () => {
  const r = planChanges("1.2.3", [{ type: "docs", description: "rewrite README" }]);
  if (r.status !== 0) return false;
  const out = JSON.parse(r.stdout);
  return out.releaseType === "patch" && out.recommended === "1.2.4" && out.needsClarification === false &&
    out.riskLevel === "low" && out.reviewRecommendation === "none" && out.reviewStatus === "not-required";
});

test("release plan: large internal refactor recommends patch", () => {
  const r = planChanges("1.2.3", [{ type: "refactor", description: "restructure modules" }]);
  if (r.status !== 0) return false;
  const out = JSON.parse(r.stdout);
  return out.releaseType === "patch" && out.recommended === "1.2.4" &&
    out.riskLevel === "medium" && out.reviewRecommendation === "suggested";
});

test("release plan: new CLI command recommends minor", () => {
  const r = planChanges("1.2.3", [{ type: "feature", description: "add CLI command" }]);
  if (r.status !== 0) return false;
  const out = JSON.parse(r.stdout);
  return out.releaseType === "minor" && out.recommended === "1.3.0" &&
    out.riskLevel === "medium" && out.reviewRecommendation === "suggested";
});

test("release plan: deleted public API recommends major", () => {
  const r = planChanges("1.2.3", [{ type: "breaking", description: "remove public API" }]);
  if (r.status !== 0) return false;
  const out = JSON.parse(r.stdout);
  return out.releaseType === "major" && out.recommended === "2.0.0" &&
    out.riskLevel === "high" && out.reviewRecommendation === "required" && out.reviewStatus === "required";
});

test("release plan: uncertain breaking change requests clarification (exit 2)", () => {
  const r = planChanges("1.2.3", [
    { type: "breaking", description: "maybe external impact?", uncertain: true },
  ]);
  if (r.status !== 2) return false;
  const out = JSON.parse(r.stdout);
  return out.needsClarification === true && out.releaseType === "unknown" &&
    out.riskLevel === "high" && out.reviewRecommendation === "required";
});

test("release plan: --file reads JSON input from a file", () => {
  const dir = tmp("rel-file");
  const inputPath = path.join(dir, "input.json");
  write(inputPath, JSON.stringify({ current: "1.2.3", changes: [{ type: "feature", description: "new CLI command" }] }));
  const r = runRelease(dir, ["plan", "--file", inputPath]);
  if (r.status !== 0) return false;
  const out = JSON.parse(r.stdout);
  return out.releaseType === "minor" && out.recommended === "1.3.0" &&
    out.riskLevel === "medium" && out.reviewRecommendation === "suggested";
});

test("release plan: null input is rejected cleanly", () => {
  const r = runRelease(TMP_ROOT, ["plan", "--json", "null"]);
  return r.status === 1 && /input must be a JSON object/.test(r.stderr) && !/TypeError/.test(r.stderr);
});

test("release execute: unapproved release creates no tag", () => {
  const dir = tmp("rel-noapprove");
  gitInit(dir);
  const head = gitHead(dir);
  const proposal = {
    current: "1.0.0",
    recommended: "1.0.1",
    releaseType: "patch",
    headSha: head,
    summary: "test patch",
    riskLevel: "low",
    reviewRecommendation: "none",
    reviewStatus: "not-required",
  };
  const proposalPath = path.join(dir, ".governance", "release-proposal.json");
  write(proposalPath, JSON.stringify(proposal));
  const r = runRelease(dir, ["execute", "--proposal", proposalPath]);
  return r.status !== 0 && gitTags(dir) === "";
});

test("release execute: approved release creates annotated tag", () => {
  const dir = tmp("rel-approved");
  gitInit(dir);
  const head = gitHead(dir);
  const proposal = {
    current: "1.0.0",
    recommended: "1.0.1",
    releaseType: "patch",
    headSha: head,
    summary: "test patch",
    riskLevel: "low",
    reviewRecommendation: "none",
    reviewStatus: "not-required",
  };
  const proposalPath = path.join(dir, ".governance", "release-proposal.json");
  write(proposalPath, JSON.stringify(proposal));
  const r = runRelease(dir, ["execute", "--proposal", proposalPath, "--yes"]);
  if (r.status !== 0) return false;
  const type = spawnSync("git", ["cat-file", "-t", "v1.0.1"], { cwd: dir, encoding: "utf8" });
  return gitTags(dir) === "v1.0.1" && String(type.stdout).trim() === "tag";
});

test("release execute: proposal without headSha is rejected (identity binding)", () => {
  // A hand-written proposal that never recorded headSha must not bypass the HEAD check;
  // the release is scoped to a specific commit, so its absence is a hard rejection.
  const dir = tmp("rel-nohead");
  gitInit(dir);
  const proposal = {
    current: "1.0.0",
    recommended: "1.0.1",
    releaseType: "patch",
    summary: "no headSha",
    riskLevel: "low",
    reviewRecommendation: "none",
    reviewStatus: "not-required",
  };
  const proposalPath = path.join(dir, ".governance", "release-proposal.json");
  write(proposalPath, JSON.stringify(proposal));
  const r = runRelease(dir, ["execute", "--proposal", proposalPath, "--yes"]);
  return r.status !== 0 && gitTags(dir) === "" && /headSha/.test(r.stdout + r.stderr);
});

test("release execute: high-risk proposal requires review evidence", () => {
  const dir = tmp("rel-high-risk");
  gitInit(dir);
  const head = gitHead(dir);
  const proposal = {
    current: "1.0.0",
    recommended: "1.0.1",
    releaseType: "patch",
    headSha: head,
    summary: "security fix",
    riskLevel: "high",
    reviewRecommendation: "required",
    reviewStatus: "required",
  };
  const proposalPath = path.join(dir, ".governance", "release-proposal.json");
  write(proposalPath, JSON.stringify(proposal));
  const blocked = runRelease(dir, ["execute", "--proposal", proposalPath, "--yes"]);
  if (blocked.status !== 4 || gitTags(dir) !== "" || !/requires completed review/.test(blocked.stderr)) return false;
  proposal.reviewStatus = "completed";
  write(proposalPath, JSON.stringify(proposal));
  const allowed = runRelease(dir, ["execute", "--proposal", proposalPath, "--yes"]);
  return allowed.status === 0 && gitTags(dir) === "v1.0.1";
});

test("release execute: null proposal is rejected cleanly", () => {
  const dir = tmp("rel-null-proposal");
  gitInit(dir);
  const proposalPath = path.join(dir, ".governance", "release-proposal.json");
  write(proposalPath, "null");
  const r = runRelease(dir, ["execute", "--proposal", proposalPath, "--yes"]);
  return r.status === 3 && /proposal must be a JSON object/.test(r.stderr) && !/TypeError/.test(r.stderr) && gitTags(dir) === "";
});

// ---------- 24. generate-governance.js ----------
function listFiles(dir) {
  const out = [];
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) out.push(...listFiles(p));
    else out.push(p);
  }
  return out.sort();
}

test("generate-governance: Phase A creates expected file tree", () => {
  const dir = tmp("gen-tree");
  const r = spawnSync(process.execPath, [GENERATOR, "--target", dir, "--project-name", "TestApp", "--phase", "A"], { encoding: "utf8" });
  if (r.status !== 0) return false;
  const expected = [
    "docs/rules/lifecycle.md",
    "docs/rules/git-policy.md",
    "docs/rules/security.md",
    "docs/rules/coding.md",
    "docs/rules/testing.md",
    "AGENTS.md",
    "CHANGELOG.md",
    "README.md",
    "docs/features/.gitkeep",
    "docs/plans/DEVELOPMENT_PLAN.md",
    "docs/plans/archive/.gitkeep",
    "docs/ARCHITECTURE.md",
  ];
  const actual = [];
  for (const e of expected) {
    if (fs.existsSync(path.join(dir, e))) actual.push(e);
  }
  return actual.length === expected.length;
});

test("generate-governance: determinism — same inputs produce byte-identical full trees", () => {
  const d1 = tmp("gen-det-a");
  const d2 = tmp("gen-det-b");
  const a = spawnSync(process.execPath, [GENERATOR, "--target", d1, "--project-name", "DetTest", "--phase", "B"], { encoding: "utf8" });
  const b = spawnSync(process.execPath, [GENERATOR, "--target", d2, "--project-name", "DetTest", "--phase", "B"], { encoding: "utf8" });
  if (a.status !== 0 || b.status !== 0) return false;
  const f1 = listFiles(d1);
  const f2 = listFiles(d2);
  if (f1.length !== f2.length || f1.length === 0) return false;
  for (let i = 0; i < f1.length; i++) {
    if (path.relative(d1, f1[i]) !== path.relative(d2, f2[i])) return false;
    if (!fs.readFileSync(f1[i]).equals(fs.readFileSync(f2[i]))) return false;
  }
  return true;
});

test("generate-governance: AGENTS.md has resolved placeholders", () => {
  const dir = tmp("gen-placeholder");
  spawnSync(process.execPath, [GENERATOR, "--target", dir, "--project-name", "MyProject", "--phase", "A"]);
  const content = fs.readFileSync(path.join(dir, "AGENTS.md"), "utf8");
  return content.includes("MyProject") && !content.includes("{{PROJECT_NAME}}");
});

test("generate-governance: manifest lists created artifacts with correct types", () => {
  const dir = tmp("gen-manifest");
  const r = spawnSync(process.execPath, [GENERATOR, "--target", dir, "--project-name", "TypeTest", "--phase", "B"], { encoding: "utf8" });
  if (r.status !== 0) return false;
  const m = JSON.parse(fs.readFileSync(path.join(dir, ".governance/manifest.json"), "utf8"));
  const count = (t) => m.artifacts.filter((a) => a.type === t).length;
  const validKinds = m.artifacts.every((a) => a.kind === "file" || a.kind === "dir");
  const agentsType = m.artifacts.find((a) => a.path === "AGENTS.md").type;
  return count("policy") === 9 && count("script") === 5 && count("state") === 6 && validKinds && agentsType === "policy";
});

test("generate-governance: gitignore covers sensitive filenames", () => {
  const dir = tmp("gen-gitignore-security");
  const r = spawnSync(process.execPath, [GENERATOR, "--target", dir, "--project-name", "Security", "--phase", "B"], { encoding: "utf8" });
  if (r.status !== 0) return false;
  const content = fs.readFileSync(path.join(dir, ".gitignore"), "utf8");
  return ["*.p12", "*.pfx", "id_rsa", "credentials.json", "secrets.*", "*.log", "logs/"].every((entry) => content.includes(entry));
});

test("generate-governance: manifest omits release for fresh INIT", () => {
  const dir = tmp("gen-norelease");
  spawnSync(process.execPath, [GENERATOR, "--target", dir, "--project-name", "Fresh", "--phase", "B"]);
  const m = JSON.parse(fs.readFileSync(path.join(dir, ".governance/manifest.json"), "utf8"));
  return m.release === undefined;
});

test("generate-governance: git-policy.json and sync-rules.json are valid JSON", () => {
  const dir = tmp("gen-jsonval");
  spawnSync(process.execPath, [GENERATOR, "--target", dir, "--project-name", "JsonVal", "--phase", "B"]);
  const gp = JSON.parse(fs.readFileSync(path.join(dir, ".governance/git-policy.json"), "utf8"));
  const sr = JSON.parse(fs.readFileSync(path.join(dir, ".governance/sync-rules.json"), "utf8"));
  return Array.isArray(gp.protectedBranches) && gp.protectedBranches.length > 0 &&
    typeof gp.directPush === "boolean" && Array.isArray(sr.syncGroups) && sr.syncGroups.length > 0;
});

test("generate-governance: end-to-end — Phase B output passes verify-governance.js", () => {
  const dir = tmp("gen-e2e");
  const g = spawnSync(process.execPath, [GENERATOR, "--target", dir, "--project-name", "E2EApp", "--phase", "B"], { encoding: "utf8" });
  if (g.status !== 0) return false;
  const v = spawnSync(process.execPath, [VALIDATOR], { cwd: dir, encoding: "utf8" });
  return v.status === 0;
});

test("generate-governance: existing files are skipped, not overwritten", () => {
  const dir = tmp("gen-skip");
  fs.mkdirSync(path.join(dir, "docs/rules"), { recursive: true });
  fs.writeFileSync(path.join(dir, "docs/rules/lifecycle.md"), "CUSTOM CONTENT", "utf8");
  const r = spawnSync(process.execPath, [GENERATOR, "--target", dir, "--project-name", "SkipTest", "--phase", "A"], { encoding: "utf8" });
  if (r.status !== 0) return false;
  const content = fs.readFileSync(path.join(dir, "docs/rules/lifecycle.md"), "utf8");
  return content === "CUSTOM CONTENT";
});

test("generate-governance: --dry-run creates nothing", () => {
  const dir = tmp("gen-dryrun");
  const r = spawnSync(process.execPath, [GENERATOR, "--target", dir, "--project-name", "Dry", "--phase", "A", "--dry-run"], { encoding: "utf8" });
  return r.status === 0 && !fs.existsSync(dir + "/AGENTS.md");
});

test("generate-governance: --json outputs structured result", () => {
  const dir = tmp("gen-jsonout");
  const r = spawnSync(process.execPath, [GENERATOR, "--target", dir, "--project-name", "JsonTest", "--phase", "A", "--json"], { encoding: "utf8" });
  if (r.status !== 0) return false;
  const out = JSON.parse(r.stdout);
  return out.phase === "A" && Array.isArray(out.results) && out.results.length === 13;
});

test("generate-governance: missing --project-name exits 2", () => {
  const dir = tmp("gen-noname");
  const r = spawnSync(process.execPath, [GENERATOR, "--target", dir], { encoding: "utf8" });
  return r.status === 2;
});

// ---------- 25. check-layout-sync.js ----------
function buildLayoutRepo(dir, treeFiles) {
  fs.mkdirSync(path.join(dir, "docs/en"), { recursive: true });
  fs.mkdirSync(path.join(dir, "docs/zh-CN"), { recursive: true });
  fs.mkdirSync(path.join(dir, "docs/zh-TW"), { recursive: true });
  fs.mkdirSync(path.join(dir, "references/templates"), { recursive: true });
  fs.mkdirSync(path.join(dir, "scripts"), { recursive: true });
  for (const f of treeFiles) {
    if (f.startsWith("references/") || f.startsWith("scripts/")) {
      fs.mkdirSync(path.dirname(path.join(dir, f)), { recursive: true });
      fs.writeFileSync(path.join(dir, f), "x", "utf8");
    }
  }
  const tree = treeFiles.map((f) => "├── " + f + "   # file").join("\n");
  const fence = String.fromCharCode(96, 96, 96);
  const layout = "### Repository Layout\n\n" + fence + "\nai-agent-governance/\n" + tree + "\n" + fence + "\n";
  for (const lang of ["en", "zh-CN", "zh-TW"]) {
    fs.writeFileSync(path.join(dir, `docs/${lang}/architecture.md`), layout, "utf8");
  }
}

test("check-layout-sync: tree covering all files exits 0", () => {
  const dir = tmp("layout-ok");
  buildLayoutRepo(dir, ["references/templates/a.template.md", "scripts/check-a.js", "scripts/check-b.js"]);
  const r = spawnSync(process.execPath, [LAYOUT_CHECK], { cwd: dir, encoding: "utf8" });
  return r.status === 0;
});

test("check-layout-sync: missing file in tree exits 1", () => {
  const dir = tmp("layout-missing");
  buildLayoutRepo(dir, ["references/templates/a.template.md", "scripts/check-a.js"]);
  fs.writeFileSync(path.join(dir, "scripts/check-b.js"), "x", "utf8");
  const r = spawnSync(process.execPath, [LAYOUT_CHECK], { cwd: dir, encoding: "utf8" });
  return r.status === 1 && r.stdout.includes("missing: check-b.js");
});


// ---------- 26. check-plan-delivery.js ----------
function buildPlanRepo(dir, planBody) {
  fs.mkdirSync(path.join(dir, "docs/en/plans"), { recursive: true });
  fs.mkdirSync(path.join(dir, "docs/archive"), { recursive: true });
  fs.mkdirSync(path.join(dir, "references/templates"), { recursive: true });
  fs.mkdirSync(path.join(dir, "scripts"), { recursive: true });
  fs.writeFileSync(path.join(dir, "docs/archive/some-plan.md"), planBody, "utf8");
}

test("check-plan-delivery: archived plan declaring a missing file exits 1 in gate mode", () => {
  const dir = tmp("plandel-missing");
  buildPlanRepo(dir, "# P\n\n### Affected Files\n\n- `references/templates/never-created.md` — new\n");
  const r = spawnSync(process.execPath, [PLAN_DELIVERY, "--gate"], { cwd: dir, encoding: "utf8" });
  return r.status === 1 && r.stdout.includes("never-created.md");
});

test("check-plan-delivery: delivered declaration exits 0", () => {
  const dir = tmp("plandel-ok");
  buildPlanRepo(dir, "# P\n\n### Affected Files\n\n- `references/templates/real.md` — new\n");
  fs.writeFileSync(path.join(dir, "references/templates/real.md"), "x", "utf8");
  const r = spawnSync(process.execPath, [PLAN_DELIVERY, "--gate"], { cwd: dir, encoding: "utf8" });
  return r.status === 0;
});

test("check-plan-delivery: design-only plan is skipped", () => {
  const dir = tmp("plandel-design");
  fs.mkdirSync(path.join(dir, "docs/en/plans"), { recursive: true });
  fs.writeFileSync(path.join(dir, "docs/en/plans/future.md"), "# F\n\n> **Status: design plan, not implemented.**\n\n### Affected Files\n\n- `references/templates/not-yet.md` — new\n", "utf8");
  const r = spawnSync(process.execPath, [PLAN_DELIVERY, "--gate"], { cwd: dir, encoding: "utf8" });
  return r.status === 0;
});

test("check-plan-delivery: behavioural declaration is verified (writes: X in Y)", () => {
  const dir = tmp("plandel-behaviour");
  fs.mkdirSync(path.join(dir, "docs/archive"), { recursive: true });
  fs.mkdirSync(path.join(dir, "scripts"), { recursive: true });
  write(path.join(dir, "docs/archive/p.md"), "# P\n\n### Affected Files\n\n- writes: `report.json` in `scripts/x.js`\n");
  write(path.join(dir, "scripts/x.js"), "// nothing");
  const bad = spawnSync(process.execPath, [PLAN_DELIVERY, "--gate"], { cwd: dir, encoding: "utf8" });
  write(path.join(dir, "scripts/x.js"), "fs.writeFileSync(\"report.json\", d)");
  const good = spawnSync(process.execPath, [PLAN_DELIVERY, "--gate"], { cwd: dir, encoding: "utf8" });
  return bad.status === 1 && /behaviour/.test(bad.stdout) && good.status === 0;
});

test("check-plan-delivery: --plan on a missing file errors, not silent pass", () => {
  const dir = tmp("plandel-planmissing");
  fs.mkdirSync(path.join(dir, "docs/en/plans"), { recursive: true });
  const r = spawnSync(process.execPath, [PLAN_DELIVERY, "--plan", "docs/en/plans/absent.md"], { cwd: dir, encoding: "utf8" });
  return r.status === 1 && r.stdout.includes("plan not found");
});

test("check-plan-delivery: a bare bashname matches its runtime artifact (normalisation)", () => {
  // A plan citing the bare "git-policy.json" resolves to the .governance/git-policy.json
  // runtime artifact — must NOT be a vacuous substring pass of an unrelated fragment.
  const dir = tmp("plandel-basename");
  fs.mkdirSync(path.join(dir, "docs/archive"), { recursive: true });
  fs.mkdirSync(path.join(dir, "references/templates"), { recursive: true });
  fs.mkdirSync(path.join(dir, "scripts"), { recursive: true });
  fs.writeFileSync(path.join(dir, "references/templates/git-policy.template.md"), "x git-policy.json x", "utf8");
  fs.writeFileSync(path.join(dir, "scripts/verify_governance.js"), "// governance git-policy.json", "utf8");
  // A plan declaring "git-policy.json" must resolve (its generating logic exists), and the
  // identifier corpus must be able to find it WITHOUT the checker's own source counting.
  fs.writeFileSync(path.join(dir, "docs/archive/p.md"),
    "# P\n\n### Affected Files\n\n- `git-policy.json` — runtime artifact\n");
  const r = spawnSync(process.execPath, [PLAN_DELIVERY, "--gate"], { cwd: dir, encoding: "utf8" });
  return r.status === 0;
});

test("generate-governance: phase C is fully implemented (no stubs left)", () => {
  const dir = tmp("gen-phase-c");
  const r = spawnSync(process.execPath, [GENERATOR, "--target", dir, "--project-name", "S", "--phase", "C", "--json"], { encoding: "utf8" });
  if (r.status !== 0) return false;
  const out = JSON.parse(r.stdout);
  const stubs = out.results.filter((x) => x.action === "skipped" && /not implemented/.test(x.note || ""));
  return stubs.length === 0;
});

test("generate-governance: sub-skills generator writes all 8 sub-skills", () => {
  const dir = tmp("gen-subskills");
  const r = spawnSync(process.execPath, [GENERATOR, "--target", dir, "--project-name", "S", "--phase", "C"], { encoding: "utf8" });
  if (r.status !== 0) return false;
  const base = path.join(dir, ".governance/generated/skills");
  if (!fs.existsSync(base)) return false;
  const names = fs.readdirSync(base);
  const expected = ["repository-inspection", "ci-generator", "governance-validator", "state-manager", "drift-check", "release-manager", "plan-manager", "review-manager"];
  return expected.every((e) => names.includes(e) && fs.existsSync(path.join(base, e, "SKILL.md")));
});

test("generate-governance: state includes the rule-capture recovery scaffold", () => {
  const dir = tmp("gen-rule-state");
  const r = spawnSync(process.execPath, [GENERATOR, "--target", dir, "--project-name", "RuleState", "--phase", "B"], { encoding: "utf8" });
  if (r.status !== 0) return false;
  const state = JSON.parse(fs.readFileSync(path.join(dir, ".governance/state.json"), "utf8"));
  return state.rule_capture && state.rule_capture.status === "none" &&
    state.rule_capture.task_id === "" && Array.isArray(state.rule_capture.candidates);
});

test("payload: generated agent and sub-skills carry change-hygiene and rule-capture contracts", () => {
  const dir = tmp("gen-change-contract");
  const r = spawnSync(process.execPath, [GENERATOR, "--target", dir, "--project-name", "ChangeContract", "--phase", "C"], { encoding: "utf8" });
  if (r.status !== 0) return false;
  const agents = fs.readFileSync(path.join(dir, "AGENTS.md"), "utf8");
  const stateSkill = fs.readFileSync(path.join(dir, ".governance/generated/skills/state-manager/SKILL.md"), "utf8");
  const driftSkill = fs.readFileSync(path.join(dir, ".governance/generated/skills/drift-check/SKILL.md"), "utf8");
  return /Change hygiene/i.test(agents) && /Rule Capture/i.test(agents) &&
    /rule_capture/.test(stateSkill) && /rules_captured/.test(stateSkill) &&
    /rules_pending/.test(stateSkill) && /rules_resolved/.test(stateSkill) &&
    /current unresolved candidates/.test(driftSkill);
});

test("generate-governance: CI workflow is selected by stack", () => {
  const nodeDir = tmp("gen-ci-node");
  spawnSync(process.execPath, [GENERATOR, "--target", nodeDir, "--project-name", "S", "--phase", "B", "--stack", "node"], { encoding: "utf8" });
  const pyDir = tmp("gen-ci-py");
  spawnSync(process.execPath, [GENERATOR, "--target", pyDir, "--project-name", "S", "--phase", "B", "--stack", "python"], { encoding: "utf8" });
  const nodeCi = path.join(nodeDir, ".github/workflows/ci.yml");
  const pyCi = path.join(pyDir, ".github/workflows/ci.yml");
  if (!fs.existsSync(nodeCi) || !fs.existsSync(pyCi)) return false;
  return fs.readFileSync(nodeCi, "utf8").includes("pnpm") && fs.readFileSync(pyCi, "utf8").includes("ruff");
});

test("generate-governance: gitlab platform writes .gitlab-ci.yml, none skips CI", () => {
  const glDir = tmp("gen-ci-gl");
  spawnSync(process.execPath, [GENERATOR, "--target", glDir, "--project-name", "S", "--phase", "B", "--ci-platform", "gitlab"], { encoding: "utf8" });
  const noneDir = tmp("gen-ci-none");
  spawnSync(process.execPath, [GENERATOR, "--target", noneDir, "--project-name", "S", "--phase", "B", "--ci-platform", "none"], { encoding: "utf8" });
  return fs.existsSync(path.join(glDir, ".gitlab-ci.yml")) && !fs.existsSync(path.join(noneDir, ".github/workflows/ci.yml"));
});

test("generate-governance: L0/L1 write, L3 audits only, --force-l3 overrides", () => {
  const l0 = tmp("gen-l0");
  spawnSync(process.execPath, [GENERATOR, "--target", l0, "--project-name", "S", "--phase", "B", "--maturity", "LEVEL_0_EMPTY"], { encoding: "utf8" });
  const l1 = tmp("gen-l1");
  spawnSync(process.execPath, [GENERATOR, "--target", l1, "--project-name", "S", "--phase", "B", "--maturity", "LEVEL_1_PROTOTYPE"], { encoding: "utf8" });
  const l3 = tmp("gen-l3");
  const r3 = spawnSync(process.execPath, [GENERATOR, "--target", l3, "--project-name", "S", "--phase", "B", "--maturity", "LEVEL_3_PRODUCTION"], { encoding: "utf8" });
  const l3f = tmp("gen-l3-force");
  spawnSync(process.execPath, [GENERATOR, "--target", l3f, "--project-name", "S", "--phase", "B", "--maturity", "LEVEL_3_PRODUCTION", "--force-l3"], { encoding: "utf8" });
  return fs.existsSync(path.join(l0, "AGENTS.md")) &&
    fs.existsSync(path.join(l1, "AGENTS.md")) &&
    r3.status === 0 && !fs.existsSync(path.join(l3, "AGENTS.md")) &&
    fs.existsSync(path.join(l3f, "AGENTS.md"));
});

test("generate-governance: existing doc root is respected (doc_root remap)", () => {
  const dir = tmp("gen-docroot");
  const r = spawnSync(process.execPath, [GENERATOR, "--target", dir, "--project-name", "S", "--phase", "B", "--doc-root", "documentation"], { encoding: "utf8" });
  if (r.status !== 0) return false;
  const m = JSON.parse(fs.readFileSync(path.join(dir, ".governance/manifest.json"), "utf8"));
  return fs.existsSync(path.join(dir, "documentation/ARCHITECTURE.md")) &&
    !fs.existsSync(path.join(dir, "docs")) &&
    m.doc_root === "documentation" &&
    m.artifacts.some((a) => a.path.startsWith("documentation/"));
});

test("generate-governance: --doc-root with .. cannot escape the target (containment)", () => {
  const dir = tmp("gen-docroot-escape");
  // Place a sibling dir two levels up (inside tmp) that a crafted doc-root would target.
  const escapeTarget = path.resolve(dir, "../../escape-sentinel");
  const r = spawnSync(process.execPath, [GENERATOR, "--target", dir, "--project-name", "S", "--phase", "C", "--doc-root", "../../escape-sentinel"], { encoding: "utf8" });
  // The generator must fail (blocked) rather than write outside. Allow either a nonzero
  // exit or an exit-0 run that reports the traversal paths as errors — but NEVER write the
  // sentinel files outside the target.
  return r.status !== 0 && !fs.existsSync(escapeTarget);
});

test("generate-governance: L3 audit writes nothing at all (manifest included)", () => {
  const dir = tmp("gen-l3-nowrite");
  const r = spawnSync(process.execPath, [GENERATOR, "--target", dir, "--project-name", "S", "--phase", "B", "--maturity", "LEVEL_3_PRODUCTION"], { encoding: "utf8" });
  if (r.status !== 0) return false;
  return !fs.existsSync(path.join(dir, "AGENTS.md")) && !fs.existsSync(path.join(dir, ".governance/manifest.json"));
});

test("generate-governance: second identical run creates nothing (true idempotency)", () => {
  const dir = tmp("gen-idem");
  spawnSync(process.execPath, [GENERATOR, "--target", dir, "--project-name", "S", "--phase", "C"], { encoding: "utf8" });
  const r = spawnSync(process.execPath, [GENERATOR, "--target", dir, "--project-name", "S", "--phase", "C", "--json"], { encoding: "utf8" });
  if (r.status !== 0) return false;
  const out = JSON.parse(r.stdout);
  const created = out.results.filter((x) => x.action === "created" || x.action === "created-dir");
  return created.length === 0;
});

test("generate-governance: manifest records the platform-specific CI path", () => {
  const gh = tmp("gen-mani-gh");
  spawnSync(process.execPath, [GENERATOR, "--target", gh, "--project-name", "S", "--phase", "B", "--ci-platform", "github", "--stack", "node"], { encoding: "utf8" });
  const gl = tmp("gen-mani-gl");
  spawnSync(process.execPath, [GENERATOR, "--target", gl, "--project-name", "S", "--phase", "B", "--ci-platform", "gitlab", "--stack", "node"], { encoding: "utf8" });
  const mgh = JSON.parse(fs.readFileSync(path.join(gh, ".governance/manifest.json"), "utf8"));
  const mgl = JSON.parse(fs.readFileSync(path.join(gl, ".governance/manifest.json"), "utf8"));
  const ghOk = mgh.artifacts.some((a) => a.path === ".github/workflows/ci.yml");
  const glOk = mgl.artifacts.some((a) => a.path === ".gitlab-ci.yml");
  // every manifest-listed artifact must actually exist
  const allExist = mgl.artifacts.every((a) => fs.existsSync(path.join(gl, a.path)));
  return ghOk && glOk && allExist;
});

test("generate-governance: default manifest version matches package.json", () => {
  const dir = tmp("gen-version");
  const r = spawnSync(process.execPath, [GENERATOR, "--target", dir, "--project-name", "Version", "--phase", "B"], { encoding: "utf8" });
  if (r.status !== 0) return false;
  const pkg = JSON.parse(fs.readFileSync(path.join(SKILL_ROOT, "package.json"), "utf8"));
  const manifest = JSON.parse(fs.readFileSync(path.join(dir, ".governance/manifest.json"), "utf8"));
  return manifest.governance_version === pkg.version;
});

test("generate-governance: hook artifacts use the first complete fence and are typed as scripts", () => {
  const dir = tmp("gen-hooks");
  const r = spawnSync(process.execPath, [GENERATOR, "--target", dir, "--project-name", "Hooks", "--phase", "C"], { encoding: "utf8" });
  if (r.status !== 0) return false;
  const hook = fs.readFileSync(path.join(dir, ".githooks/pre-commit"), "utf8");
  const msgHook = fs.readFileSync(path.join(dir, ".githooks/commit-msg"), "utf8");
  const manifest = JSON.parse(fs.readFileSync(path.join(dir, ".governance/manifest.json"), "utf8"));
  const hookEntries = manifest.artifacts.filter((a) => a.path.startsWith(".githooks/"));
  const modeOk = process.platform === "win32" || ((fs.statSync(path.join(dir, ".githooks/pre-commit")).mode & 0o111) !== 0 && (fs.statSync(path.join(dir, ".githooks/commit-msg")).mode & 0o111) !== 0);
  return hook.startsWith("#!/bin/sh") && msgHook === hook && !hook.includes('"staged": [') &&
    hookEntries.length === 2 && hookEntries.every((a) => a.type === "script") &&
    fs.readFileSync(path.join(dir, ".gitignore"), "utf8").includes(".governance/consent.json") && modeOk;
});

function findPosixShell() {
  const candidates = ["sh"];
  if (process.platform === "win32") {
    for (const base of [process.env.ProgramFiles, process.env["ProgramFiles(x86)"]]) {
      if (!base) continue;
      candidates.push(path.join(base, "Git", "bin", "sh.exe"));
      candidates.push(path.join(base, "Git", "usr", "bin", "sh.exe"));
    }
    const where = spawnSync("where.exe", ["git"], { encoding: "utf8" });
    for (const line of String(where.stdout || "").split(/\r?\n/).filter(Boolean)) {
      const cmdDir = path.dirname(line.trim());
      const gitRoot = path.basename(cmdDir).toLowerCase() === "cmd" ? path.dirname(cmdDir) : path.dirname(path.dirname(cmdDir));
      candidates.push(path.join(gitRoot, "bin", "sh.exe"), path.join(gitRoot, "usr", "bin", "sh.exe"));
    }
  }
  for (const candidate of [...new Set(candidates)]) {
    const probe = spawnSync(candidate, ["-c", "exit 0"], { encoding: "utf8" });
    if (!probe.error && probe.status === 0) return candidate;
  }
  return null;
}

test("payload: hooks pass sh -n and real git commit matrix", () => {
  const shell = findPosixShell();
  if (!shell) {
    console.error("  sh unavailable; hook execution test skipped in this environment");
    return true;
  }
  const dir = tmp("hook-commit-matrix");
  const generated = spawnSync(process.execPath, [GENERATOR, "--target", dir, "--project-name", "HookMatrix", "--phase", "C"], { encoding: "utf8" });
  if (generated.status !== 0) return false;
  const pre = path.join(dir, ".githooks/pre-commit");
  const msg = path.join(dir, ".githooks/commit-msg");
  if (spawnSync(shell, ["-n", pre], { encoding: "utf8" }).status !== 0 || spawnSync(shell, ["-n", msg], { encoding: "utf8" }).status !== 0) return false;

  gitInit(dir);
  spawnSync("git", ["config", "core.hooksPath", ".githooks"], { cwd: dir });
  const first = "文档/带 空格.md";
  write(path.join(dir, first), "first\n");
  spawnSync("git", ["add", "--", first], { cwd: dir });
  write(path.join(dir, ".governance/consent.json"), JSON.stringify({ staged: [first], message: ["fix: approved"] }));
  const matching = spawnSync("git", ["commit", "-q", "-m", "fix: approved"], { cwd: dir, encoding: "utf8" });
  if (matching.status !== 0) return false;

  const second = "second file.txt";
  write(path.join(dir, second), "second\n");
  spawnSync("git", ["add", "--", second], { cwd: dir });
  write(path.join(dir, ".governance/consent.json"), JSON.stringify({ staged: [second], message: ["fix: approved"] }));
  const mismatchedMessage = spawnSync("git", ["commit", "-q", "-m", "feat: unapproved"], { cwd: dir, encoding: "utf8" });
  if (mismatchedMessage.status !== 1) return false;

  const third = "third.txt";
  write(path.join(dir, third), "third\n");
  spawnSync("git", ["add", "--", third], { cwd: dir });
  fs.rmSync(path.join(dir, ".governance/consent.json"));
  const missingConsent = spawnSync("git", ["commit", "-q", "-m", "fix: missing consent"], { cwd: dir, encoding: "utf8" });
  return missingConsent.status === 1;
});
// ---------- 27. Validator edge cases (absent / malformed governance state) ----------

test("validator: missing .governance dir exits 1", () => {
  const dir = tmp("no-gov-dir");
  buildFullDefault(dir);
  fs.rmSync(path.join(dir, ".governance"), { recursive: true, force: true });
  const r = run(dir);
  return r.status === 1 && r.stdout.includes(".governance state dir");
});

test("validator: malformed manifest.json falls back to defaults, exits 1", () => {
  const dir = tmp("bad-manifest-json");
  buildFullDefault(dir);
  write(path.join(dir, ".governance/manifest.json"), "{ not valid json");
  const r = run(dir);
  // unparseable manifest => loadManifestChecks() returns null => defaults mode,
  // and "Governance version" cannot be read => must fail, never silently pass
  return r.status === 1 && r.stdout.includes("mode: defaults") && r.stdout.includes("Governance version");
});

// ---------- 28. check-layout-sync edge cases ----------

test("check-layout-sync: missing architecture.md exits 1", () => {
  const dir = tmp("layout-no-arch");
  buildLayoutRepo(dir, ["references/templates/a.template.md", "scripts/check-a.js"]);
  fs.rmSync(path.join(dir, "docs/en/architecture.md"));
  const r = spawnSync(process.execPath, [LAYOUT_CHECK], { cwd: dir, encoding: "utf8" });
  return r.status === 1;
});

test("check-layout-sync: architecture.md without a Repository Layout block exits 1", () => {
  const dir = tmp("layout-no-section");
  buildLayoutRepo(dir, ["references/templates/a.template.md", "scripts/check-a.js"]);
  for (const lang of ["en", "zh-CN", "zh-TW"]) {
    write(path.join(dir, `docs/${lang}/architecture.md`), "# Architecture\n\nNo layout block here.\n");
  }
  const r = spawnSync(process.execPath, [LAYOUT_CHECK], { cwd: dir, encoding: "utf8" });
  return r.status === 1;
});

// ---------- 29. Install-payload integrity ----------
// Why: init-spec.json copies gate scripts into governed projects FILE BY FILE, so each
// one must be self-contained. A shared-library refactor once broke this (scripts started
// requiring ./_lib.js, which was never added to the copy list) and the whole suite stayed
// green, because tests only ever ran inside this repo where the helper sits next door.
// Two layers: a static invariant check (precise) and an end-to-end run (trusts nothing).

const SKILL_ROOT = path.join(__dirname, "..");

function copiedScriptSources() {
  const spec = JSON.parse(fs.readFileSync(path.join(SKILL_ROOT, "references", "init-spec.json"), "utf8"));
  return spec.artifacts
    .filter((a) => a.type === "copy" && a.path.startsWith("scripts/"))
    .map((a) => ({ source: a.source, target: a.path }));
}

test("payload: copied gate scripts declare no local require (self-containment)", () => {
  const offenders = [];
  for (const { source } of copiedScriptSources()) {
    const c = fs.readFileSync(path.join(SKILL_ROOT, source), "utf8");
    // relative requires only — node builtins ("fs", "path") are always available
    for (const m of c.matchAll(/require\(\s*['"](\.[^'"]+)['"]\s*\)/g)) {
      offenders.push(`${source} -> ${m[1]}`);
    }
  }
  if (offenders.length > 0) {
    console.error("  copied scripts must be self-contained; found: " + offenders.join("; "));
    return false;
  }
  return offenders.length === 0;
});

test("payload: init-spec copy list matches what INIT actually writes", () => {
  const dir = tmp("payload-list");
  const r = spawnSync(process.execPath, [GENERATOR, "--target", dir, "--project-name", "PayloadList", "--phase", "C"], { encoding: "utf8" });
  if (r.status !== 0) return false;
  for (const { target } of copiedScriptSources()) {
    if (!fs.existsSync(path.join(dir, target))) {
      console.error("  declared in init-spec but not written by INIT: " + target);
      return false;
    }
  }
  return true;
});

test("payload: every copied gate script loads in a governed project (no MODULE_NOT_FOUND)", () => {
  const dir = tmp("payload-e2e");
  const g = spawnSync(process.execPath, [GENERATOR, "--target", dir, "--project-name", "PayloadE2E", "--phase", "C"], { encoding: "utf8" });
  if (g.status !== 0) return false;
  for (const { target } of copiedScriptSources()) {
    const script = path.join(dir, target);
    if (!fs.existsSync(script)) return false;

    // Two probes, because neither alone is sufficient:
    //
    // (a) Module resolution. `--check` only parses; it does NOT resolve require()
    //     targets, so a missing dependency slips through. Loading the module for
    //     real is the only way to prove its requires resolve — but a plain run can
    //     exit early on unrelated grounds (check-sync bails out with "cannot
    //     determine task-start SHA" before reaching any interesting code), which is
    //     exactly how a broken payload could look healthy. So resolution is probed
    //     directly via require.resolve on each declared dependency.
    const src = fs.readFileSync(script, "utf8");
    for (const m of src.matchAll(/require\(\s*['"](\.[^'"]+)['"]\s*\)/g)) {
      const dep = path.resolve(path.dirname(script), m[1]);
      const withExt = fs.existsSync(dep) ? dep : dep + ".js";
      if (!fs.existsSync(withExt)) {
        console.error(`  ${target} requires ${m[1]}, which is absent from the payload`);
        return false;
      }
    }

    // (b) Actually execute it. Exit code is NOT asserted — outside a git repo several
    //     gates legitimately exit 1 — but a module-resolution crash must never appear.
    const r = spawnSync(process.execPath, [script], { cwd: dir, encoding: "utf8" });
    const out = String(r.stdout || "") + String(r.stderr || "");
    if (/MODULE_NOT_FOUND|Cannot find module/.test(out)) {
      console.error(`  ${target} crashed on module resolution in the governed project`);
      return false;
    }
  }
  return true;
});

// ---------- 30. check-doc-consistency --gate (consent cluster + protected-files tightening) ----------

const CONSISTENCY = path.join(__dirname, "..", "scripts", "check-doc-consistency.js");

const CONSENT_THREE_MARKERS_TEXT =
  "One confirmation per change set — echo the full git command sequence before committing.\n" +
  "Plan approval is intent alignment, not a commit authorisation workaround.\n" +
  "A Proposal approved at the Approval Gate covers the release sequence.\n" +
  "If any step fails, stop and report — never retry differently.\n" +
  "If push is rejected (non-fast-forward), stop and report — never pull/rebase.";

function writeConsentSyncPoint(dir, rel, content) {
  write(path.join(dir, rel), content);
}

test("consistency --gate: complete five sync points exit 0", () => {
  const dir = tmp("consent-ok");
  write(path.join(dir, "package.json"), JSON.stringify({ version: "1.0.0" }));
  for (const rel of ["AGENTS.md", "references/policies/git.policy.md", "references/policies/lifecycle.policy.md", "references/templates/agents-md.template.md", "SKILL.md"]) {
    writeConsentSyncPoint(dir, rel, CONSENT_THREE_MARKERS_TEXT);
  }
  const r = spawnSync(process.execPath, [CONSISTENCY, "--gate", "--json"], { cwd: dir, encoding: "utf8" });
  if (r.status !== 0) return false;
  const out = JSON.parse(r.stdout);
  return out.gatePass === true && out.gateIssues.length === 0;
});

test("consistency --gate: Chinese-language markers satisfy the sync clamp (bilingual)", () => {
  // The consent markers carry Chinese branches (回显, 命令序列, 意图对齐, 覆盖, 非快进).
  // Exercise them so a regression that breaks the Chinese patterns is caught, not just
  // the English path exercised by CONSENT_THREE_MARKERS_TEXT.
  const zh =
    "一次确认 per 变更集 — 提交前回显完整 git 命令序列，并一次确认 add → commit → push。\n" +
    "计划批准是意图对齐，不是提交授权。\n" +
    "一次 Proposal 获批准即覆盖整个发布序列。\n" +
    "任一步失败：停止并报告，绝不换方式重试。\n" +
    "若 push 被拒（非快进），停止并报告，绝不自行 pull/rebase。";
  const dir = tmp("consent-zh");
  write(path.join(dir, "package.json"), JSON.stringify({ version: "1.0.0" }));
  for (const rel of ["AGENTS.md", "references/policies/git.policy.md", "references/policies/lifecycle.policy.md", "references/templates/agents-md.template.md", "SKILL.md"]) {
    writeConsentSyncPoint(dir, rel, zh);
  }
  const r = spawnSync(process.execPath, [CONSISTENCY, "--gate", "--json"], { cwd: dir, encoding: "utf8" });
  if (r.status !== 0) return false;
  const out = JSON.parse(r.stdout);
  return out.gatePass === true && out.gateIssues.length === 0;
});

test("consistency --gate: marker removed from one sync point exits 1 and names it", () => {
  const dir = tmp("consent-missing");
  write(path.join(dir, "package.json"), JSON.stringify({ version: "1.0.0" }));
  for (const rel of ["AGENTS.md", "references/policies/git.policy.md", "references/policies/lifecycle.policy.md", "references/templates/agents-md.template.md", "SKILL.md"]) {
    writeConsentSyncPoint(dir, rel, CONSENT_THREE_MARKERS_TEXT);
  }
  // strip the intent-alignment marker from SKILL.md
  const skillPath = path.join(dir, "SKILL.md");
  write(skillPath, CONSENT_THREE_MARKERS_TEXT.split("\n").filter((l) => !/intent alignment/i.test(l)).join("\n"));
  const r = spawnSync(process.execPath, [CONSISTENCY, "--gate", "--json"], { cwd: dir, encoding: "utf8" });
  if (r.status !== 1) return false;
  const out = JSON.parse(r.stdout);
  return out.gatePass === false && out.gateIssues.some((g) => g.item.includes("SKILL.md") && g.item.includes("intent alignment"));
});

test("consistency --gate: governed-project shape skips absent sync points (3 of 5 exist)", () => {
  const dir = tmp("consent-governed");
  write(path.join(dir, "package.json"), JSON.stringify({ version: "1.0.0" }));
  // generated AGENTS.md + docs/rules/git-policy.md + docs/rules/lifecycle.md exist in a governed project
  writeConsentSyncPoint(dir, "AGENTS.md", CONSENT_THREE_MARKERS_TEXT);
  writeConsentSyncPoint(dir, "docs/rules/git-policy.md", CONSENT_THREE_MARKERS_TEXT);
  writeConsentSyncPoint(dir, "docs/rules/lifecycle.md", CONSENT_THREE_MARKERS_TEXT);
  const r = spawnSync(process.execPath, [CONSISTENCY, "--gate"], { cwd: dir, encoding: "utf8" });
  return r.status === 0 && r.stdout.includes("no consistency issues");
});

test("consistency --gate: missing markers in a governed-project sync point exit 1", () => {
  const dir = tmp("consent-governed-missing");
  write(path.join(dir, "package.json"), JSON.stringify({ version: "1.0.0" }));
  writeConsentSyncPoint(dir, "AGENTS.md", CONSENT_THREE_MARKERS_TEXT);
  const gitPolicy = CONSENT_THREE_MARKERS_TEXT.replace(/intent alignment[^\n]*\n/, "");
  writeConsentSyncPoint(dir, "docs/rules/git-policy.md", gitPolicy);
  const r = spawnSync(process.execPath, [CONSISTENCY, "--gate", "--json"], { cwd: dir, encoding: "utf8" });
  if (r.status !== 1) return false;
  const out = JSON.parse(r.stdout);
  return out.gateIssues.some((g) => g.item.includes("docs/rules/git-policy.md") && g.item.includes("intent alignment"));
});

test("consistency --gate: lifecycle doc is exempt from the release marker", () => {
  // lifecycle.policy.md carries no release clause by design; the release marker's files
  // list must not require it from docs/rules/lifecycle.md (m3 files restriction).
  const dir = tmp("consent-lifecycle-exempt");
  write(path.join(dir, "package.json"), JSON.stringify({ version: "1.0.0" }));
  writeConsentSyncPoint(dir, "AGENTS.md", CONSENT_THREE_MARKERS_TEXT);
  writeConsentSyncPoint(dir, "references/policies/git.policy.md", CONSENT_THREE_MARKERS_TEXT);
  // lifecycle WITHOUT the release marker — permitted (m3 files restriction)
  writeConsentSyncPoint(dir, "references/policies/lifecycle.policy.md",
    "One confirmation per change set — echo the full git command sequence before committing.\nPlan approval is intent alignment, not a commit authorisation workaround.\n");
  writeConsentSyncPoint(dir, "docs/rules/lifecycle.md",
    "One confirmation per change set — echo the full git command sequence before committing.\nPlan approval is intent alignment, not a commit authorisation workaround.\n");
  const r = spawnSync(process.execPath, [CONSISTENCY, "--gate", "--json"], { cwd: dir, encoding: "utf8" });
  if (r.status !== 0) return false;
  const out = JSON.parse(r.stdout);
  return !out.gateIssues.some((g) => g.item.includes("lifecycle"));
});

test("consistency --gate: mid-sequence failure marker removed → gate red (regression)", () => {
  const dir = tmp("consent-fail-missing");
  write(path.join(dir, "package.json"), JSON.stringify({ version: "1.0.0" }));
  for (const rel of ["AGENTS.md", "references/policies/git.policy.md", "references/templates/agents-md.template.md", "SKILL.md"]) {
    writeConsentSyncPoint(dir, rel, CONSENT_THREE_MARKERS_TEXT);
  }
  // strip the failure clause from SKILL.md
  const skillPath = path.join(dir, "SKILL.md");
  write(skillPath, CONSENT_THREE_MARKERS_TEXT.split("\n").filter((l) => !/stop and report/i.test(l)).join("\n"));
  const r = spawnSync(process.execPath, [CONSISTENCY, "--gate", "--json"], { cwd: dir, encoding: "utf8" });
  if (r.status !== 1) return false;
  const out = JSON.parse(r.stdout);
  return out.gatePass === false && out.gateIssues.some((g) => g.item.includes("SKILL.md") && g.item.includes("mid-sequence failure"));
});

test("consistency --gate: gutted lifecycle.policy.md turns gate red (5th sync point, regression)", () => {
  // The 5th consent sync point (lifecycle.policy.md) must be a real sync GROUP. Gutting it
  // of all consent substance must turn the gate red — a bare "一次确认" heading or a mention
  // in another table must not satisfy it.
  const dir = tmp("consent-lifecycle-gut");
  write(path.join(dir, "package.json"), JSON.stringify({ version: "1.0.0" }));
  for (const rel of ["AGENTS.md", "references/policies/git.policy.md", "references/templates/agents-md.template.md", "SKILL.md"]) {
    writeConsentSyncPoint(dir, rel, CONSENT_THREE_MARKERS_TEXT);
  }
  writeConsentSyncPoint(dir, "references/policies/lifecycle.policy.md", "# Lifecycle\n\nNo consent rules here.\n");
  const r = spawnSync(process.execPath, [CONSISTENCY, "--gate", "--json"], { cwd: dir, encoding: "utf8" });
  if (r.status !== 1) return false;
  const out = JSON.parse(r.stdout);
  return out.gateIssues.some((g) => g.item.includes("lifecycle.policy.md") && g.item.includes("one confirmation per change set"));
});

test("consistency --gate: a section heading alone is not the one-confirmation principle (M1 regression)", () => {
  // M1 must anchor on the echo + full-sequence substance, NOT the bare "一次确认" wording.
  // A heading like "确认范围（一次确认 per 变更集）" with no echo/sequence must not satisfy it.
  const dir = tmp("consent-m1-heading");
  write(path.join(dir, "package.json"), JSON.stringify({ version: "1.0.0" }));
  for (const rel of ["AGENTS.md", "references/policies/git.policy.md", "references/templates/agents-md.template.md", "SKILL.md"]) {
    writeConsentSyncPoint(dir, rel,
      "## 确认范围（一次确认 per 变更集）\n\nPlan approval is intent alignment, not a commit authorisation.\n" +
      "A Proposal approved at the Approval Gate covers the release sequence.\n" +
      "If any step fails, stop and report — never retry differently.\n" +
      "If push is rejected (non-fast-forward), stop and report — never pull/rebase.\n");
  }
  writeConsentSyncPoint(dir, "references/policies/lifecycle.policy.md",
    "## 确认范围（一次确认 per 变更集）\n\nPlan approval is intent alignment, not a commit authorisation.\n");
  const r = spawnSync(process.execPath, [CONSISTENCY, "--gate", "--json"], { cwd: dir, encoding: "utf8" });
  if (r.status !== 1) return false;
  const out = JSON.parse(r.stdout);
  return out.gateIssues.some((g) => g.item.includes("one confirmation per change set"));
});

test("consistency --gate: bare Approval Gate mention is not the release-clause marker (M3 regression)", () => {
  // M3 must anchor on approval COVERING the sequence/write-ops, not the bare "Approval Gate"
  // token that also appears in a git-tag bullet. Removing the release clause while leaving a
  // bare Approval Gate must turn the gate red.
  const dir = tmp("consent-m3-bare");
  write(path.join(dir, "package.json"), JSON.stringify({ version: "1.0.0" }));
  for (const rel of ["AGENTS.md", "references/policies/git.policy.md", "references/templates/agents-md.template.md", "SKILL.md"]) {
    writeConsentSyncPoint(dir, rel,
      "One confirmation per change set — echo the full git command sequence before committing.\n" +
      "Plan approval is intent alignment, not a commit authorisation.\n" +
      "A release needs to pass through the Approval Gate.\n" +   // bare token, no coverage
      "If any step fails, stop and report — never retry differently.\n" +
      "If push is rejected (non-fast-forward), stop and report — never pull/rebase.\n");
  }
  writeConsentSyncPoint(dir, "references/policies/lifecycle.policy.md", CONSENT_THREE_MARKERS_TEXT);
  const r = spawnSync(process.execPath, [CONSISTENCY, "--gate", "--json"], { cwd: dir, encoding: "utf8" });
  if (r.status !== 1) return false;
  const out = JSON.parse(r.stdout);
  return out.gateIssues.some((g) => g.item.includes("Approval Gate covers the sequence"));
});

test("consistency --gate: governed-project git-policy.md is held to release/mid-sequence markers (files regression)", () => {
  // The files restriction must match the governed rendering docs/rules/git-policy.md on M3/M4/M5
  // (basename normalised: git.policy.md == git-policy.md), not just the skill-repo path.
  const dir = tmp("consent-governed-m345");
  write(path.join(dir, "package.json"), JSON.stringify({ version: "1.0.0" }));
  writeConsentSyncPoint(dir, "AGENTS.md", CONSENT_THREE_MARKERS_TEXT);
  writeConsentSyncPoint(dir, "docs/rules/git-policy.md", /** no M3/M4/M5 */ "One confirmation per change set — echo the full git command sequence before committing.\nPlan approval is intent alignment, not a commit authorisation.\n");
  const r = spawnSync(process.execPath, [CONSISTENCY, "--gate", "--json"], { cwd: dir, encoding: "utf8" });
  if (r.status !== 1) return false;
  const out = JSON.parse(r.stdout);
  return out.gateIssues.some((g) => g.item.includes("docs/rules/git-policy.md") && /Approval Gate covers the sequence|mid-sequence failure|push rejected/.test(g.item));
});

test("consistency --gate: protected list trigger is tightened (mere mention exempt)", () => {
  const dir = tmp("proto-exempt");
  write(path.join(dir, "package.json"), JSON.stringify({ version: "1.0.0" }));
  write(path.join(dir, "references/policies/governance-files.policy.md"),
    "| `AGENTS.md` | policy |\n| `docs/rules/**` | policy |\n");
  // mentions the protection flow in the exact casing the regex matches (Governance File
  // Protection flow) but does NOT claim to enumerate the list
  write(path.join(dir, "docs/en/README.md"), "# R\n\nThis change should follow the Governance File Protection flow.\n");
  fs.mkdirSync(path.join(dir, "docs/zh-CN"), { recursive: true });
  fs.mkdirSync(path.join(dir, "docs/zh-TW"), { recursive: true });
  write(path.join(dir, "docs/zh-CN/README.md"), "# R\n");
  write(path.join(dir, "docs/zh-TW/README.md"), "# R\n");
  const r = spawnSync(process.execPath, [CONSISTENCY, "--gate", "--json"], { cwd: dir, encoding: "utf8" });
  if (r.status !== 0) return false;
  const out = JSON.parse(r.stdout);
  return out.gatePass === true && !out.gateIssues.some((g) => g.kind === "protected_lists");
});

test("consistency --gate: claimed enumeration with a missing entry still fails", () => {
  const dir = tmp("proto-flagged");
  write(path.join(dir, "package.json"), JSON.stringify({ version: "1.0.0" }));
  write(path.join(dir, "references/policies/governance-files.policy.md"),
    "| `AGENTS.md` | policy |\n| `docs/rules/**` | policy |\n| `scripts/check-secrets.js` | script |\n");
  // mentions the protection flow AND claims to enumerate its list — but omits check-secrets.js
  write(path.join(dir, "docs/en/README.md"), "# R\n\nThe Governance File Protection list is:\n- `AGENTS.md`\n");
  fs.mkdirSync(path.join(dir, "docs/zh-CN"), { recursive: true });
  fs.mkdirSync(path.join(dir, "docs/zh-TW"), { recursive: true });
  write(path.join(dir, "docs/zh-CN/README.md"), "# R\n");
  write(path.join(dir, "docs/zh-TW/README.md"), "# R\n");
  const r = spawnSync(process.execPath, [CONSISTENCY, "--gate", "--json"], { cwd: dir, encoding: "utf8" });
  if (r.status !== 1) return false;
  const out = JSON.parse(r.stdout);
  return out.gateIssues.some((g) => g.kind === "protected_lists" && g.item.includes("check-secrets.js"));
});

test("consistency: advisory mode stays exit 0 even with gate-class violations", () => {
  const dir = tmp("consent-advisory");
  write(path.join(dir, "package.json"), JSON.stringify({ version: "1.0.0" }));
  // only AGENTS.md present, missing Exception C marker entirely — advisory never blocks
  writeConsentSyncPoint(dir, "AGENTS.md", "some text without any markers");
  const r = spawnSync(process.execPath, [CONSISTENCY], { cwd: dir, encoding: "utf8" });
  return r.status === 0;
});

test("consistency --gate: principles-index pointer to a missing file exits 1", () => {
  const dir = tmp("index-broken");
  write(path.join(dir, "package.json"), JSON.stringify({ version: "1.0.0" }));
  write(path.join(dir, "AGENTS.md"),
    "# AGENTS.md\n\n## Governance principles index\n\n| Principle | Authoritative source | Scope |\n| --- | --- | --- |\n| Something | `references/does-not-exist.md` | payload |\n");
  const r = spawnSync(process.execPath, [CONSISTENCY, "--gate", "--json"], { cwd: dir, encoding: "utf8" });
  if (r.status !== 1) return false;
  const out = JSON.parse(r.stdout);
  return out.gateIssues.some((g) => g.kind === "principles_index" && g.item.includes("references/does-not-exist.md"));
});

test("consistency --gate: principles index with resolving pointers exits 0", () => {
  const dir = tmp("index-ok");
  write(path.join(dir, "package.json"), JSON.stringify({ version: "1.0.0" }));
  write(path.join(dir, "references/policies/git.policy.md"), CONSENT_THREE_MARKERS_TEXT);
  write(path.join(dir, "AGENTS.md"),
    "# AGENTS.md\n\n## Governance principles index\n\n| Principle | Authoritative source | Scope |\n| --- | --- | --- |\n| Consent | `references/policies/git.policy.md` | both |\n\n" + CONSENT_THREE_MARKERS_TEXT + "\n");
  const r = spawnSync(process.execPath, [CONSISTENCY, "--gate"], { cwd: dir, encoding: "utf8" });
  return r.status === 0;
});

test("consistency --gate: governed project without an index skips check 9", () => {
  const dir = tmp("index-absent");
  write(path.join(dir, "package.json"), JSON.stringify({ version: "1.0.0" }));
  writeConsentSyncPoint(dir, "AGENTS.md", CONSENT_THREE_MARKERS_TEXT); // no index section
  const r = spawnSync(process.execPath, [CONSISTENCY, "--gate", "--json"], { cwd: dir, encoding: "utf8" });
  if (r.status !== 0) return false;
  const out = JSON.parse(r.stdout);
  return !out.gateIssues.some((g) => g.kind === "principles_index");
});

test("consistency --gate: a partial marker phrase is not a full principle (regression)", () => {
  // A phrase like "一次确认" can appear alone without the intent-alignment or release
  // semantics. Deleting the full principles while leaving a partial phrase must NOT pass.
  const dir = tmp("consent-partial");
  write(path.join(dir, "package.json"), JSON.stringify({ version: "1.0.0" }));
  for (const rel of ["AGENTS.md", "references/templates/agents-md.template.md"]) {
    writeConsentSyncPoint(dir, rel, CONSENT_THREE_MARKERS_TEXT);
  }
  // SKILL.md carries only a partial phrase — no intent alignment, no release
  writeConsentSyncPoint(dir, "SKILL.md", "一次确认。\n");
  writeConsentSyncPoint(dir, "references/policies/git.policy.md", CONSENT_THREE_MARKERS_TEXT);
  const r = spawnSync(process.execPath, [CONSISTENCY, "--gate", "--json"], { cwd: dir, encoding: "utf8" });
  if (r.status !== 1) return false;
  const out = JSON.parse(r.stdout);
  return out.gatePass === false && out.gateIssues.some((g) => g.item.includes("SKILL.md") && g.item.includes("intent alignment"));
});

// ---------- runner (must stay after ALL test registrations) ----------
let failed = 0;
for (const t of tests) {
  let ok;
  try {
    ok = t.fn();
  } catch (e) {
    ok = false;
    console.error(`  threw: ${e.message}`);
  }
  if (ok) {
    console.log(`✓ ${t.name}`);
  } else {
    console.log(`✗ ${t.name}`);
    failed += 1;
  }
}

cleanup();

console.log(`\n${tests.length - failed}/${tests.length} tests passed.`);
process.exit(failed === 0 ? 0 : 1);
