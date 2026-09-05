// tests/suites/security.test.js — batch-1 migration from tests/run-tests.js (anti-patch plan §3).
// Verbatim region move (marker-to-marker); helper consolidation into tests/support/ is batch 2.


const { spawnSync } = require("child_process");
const fs = require("fs");
const path = require("path");

module.exports = (test) => {

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
  write(path.join(dir, ".gitignore"), [".env", ".env.*", "!.env.example", "*.key", "*.pem", "*.p12", "*.pfx", "credentials.json", "secrets.*"].join("\n"));
  const r = spawnSync(process.execPath, [GIT_POLICY_CHECK], { cwd: dir, encoding: "utf8" });
  return r.status === 0;
});

test("check-git-policy: missing sensitive-file gitignore patterns exits 1", () => {
  const dir = tmp("gitpolicy-gitignore");
  gitInit(dir);
  spawnSync("git", ["checkout", "-q", "-b", "feature/agent-20260812-fix"], { cwd: dir });
  write(path.join(dir, ".governance/git-policy.json"), JSON.stringify({ protectedBranches: ["main", "master"], directPush: false, requireReview: true, allowForcePush: false }));
  write(path.join(dir, ".gitignore"), ".env\n");
  const r = spawnSync(process.execPath, [GIT_POLICY_CHECK, "--json"], { cwd: dir, encoding: "utf8" });
  if (r.status !== 1) return false;
  const out = JSON.parse(r.stdout);
  return out.gitignoreBaseline.ok === false && out.gitignoreBaseline.missing.includes("*.pem");
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

// C4: git prints "Binary files … differ" instead of content for blobs it treats as binary
// (auto-detected NUL bytes, or declared `binary` / `-diff` in .gitattributes), so the line
// loop never saw them and the gate reported "clean" for content it had not read — a
// one-line, legitimate-looking bypass of a security gate (audit 2026-09-05).
test("check-secrets: a secret in a -diff marked file is still caught", () => {
  const dir = tmp("secrets-nodiff");
  gitInit(dir);
  const value = assemble("AKIA", "IOSFODNN7EXAMPLE");
  write(path.join(dir, ".gitattributes"), "secrets.env -diff\n");
  write(path.join(dir, "secrets.env"), assemble("AWS_KEY=", value));
  spawnSync("git", ["add", "-A"], { cwd: dir });
  const r = spawnSync(process.execPath, [SECRET_CHECK], { cwd: dir, encoding: "utf8" });
  return r.status === 1 && r.stderr.includes("aws-access-key") && !r.stderr.includes(value);
});

test("check-secrets: a secret inside a real binary blob is still caught", () => {
  const dir = tmp("secrets-binary");
  gitInit(dir);
  const value = assemble("AKIA", "IOSFODNN7EXAMPLE");
  fs.writeFileSync(
    path.join(dir, "blob.bin"),
    Buffer.concat([Buffer.from([0, 1, 2, 0]), Buffer.from(assemble("SECRET=", value))])
  );
  spawnSync("git", ["add", "-A"], { cwd: dir });
  const r = spawnSync(process.execPath, [SECRET_CHECK], { cwd: dir, encoding: "utf8" });
  return r.status === 1 && r.stderr.includes("aws-access-key");
});

test("check-secrets: a clean binary file does not produce a false hit", () => {
  const dir = tmp("secrets-binary-clean");
  gitInit(dir);
  fs.writeFileSync(path.join(dir, "img.bin"), Buffer.from([0, 1, 2, 3, 4, 0]));
  spawnSync("git", ["add", "-A"], { cwd: dir });
  const r = spawnSync(process.execPath, [SECRET_CHECK], { cwd: dir, encoding: "utf8" });
  return r.status === 0;
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

};
