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

test("check-secrets: github PAT hits github-token pattern", () => {
  const dir = tmp("secrets-pat");
  gitInit(dir);
  const value = assemble("ghp_", "ABCDEFGHIJKLMNOPQRST0123456789");
  write(path.join(dir, "ci.yml"), assemble("token: ", value));
  spawnSync("git", ["add", "ci.yml"], { cwd: dir });
  const r = spawnSync(process.execPath, [SECRET_CHECK], { cwd: dir, encoding: "utf8" });
  return r.status === 1 && r.stderr.includes("github-token") && !r.stderr.includes(value);
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

// A source line whose own content starts with "++ " produces the diff line "+++ <content>".
// Keying the file-header branch on the "+++ " prefix alone consumed that content as a
// header and skipped it — a two-character bypass of the security gate, which also
// corrupted the filename attributed to every following hunk (audit 2026-09-07).
test("check-secrets: a secret on a line starting with '++ ' is still caught", () => {
  const dir = tmp("secrets-plusplus");
  gitInit(dir);
  write(path.join(dir, "bypass.txt"), "++ " + assemble("AKIA", "IOSFODNN7EXAMPLE") + "\n");
  spawnSync("git", ["add", "bypass.txt"], { cwd: dir });
  const r = spawnSync(process.execPath, [SECRET_CHECK, "--json"], { cwd: dir, encoding: "utf8" });
  if (r.status !== 1) {
    console.error("  '++ ' prefixed secret passed the gate (exit " + r.status + ")");
    return false;
  }
  // and the header state machine must still attribute a normal hunk correctly
  const dir2 = tmp("secrets-attrib");
  gitInit(dir2);
  write(path.join(dir2, "ok.txt"), assemble("AKIA", "IOSFODNN7EXAMPLE") + "\n");
  spawnSync("git", ["add", "ok.txt"], { cwd: dir2 });
  const r2 = spawnSync(process.execPath, [SECRET_CHECK, "--json"], { cwd: dir2, encoding: "utf8" });
  const hits = JSON.parse(r2.stdout).hits || [];
  return hits.length === 1 && hits[0].file === "ok.txt";
});

// Unreadable staged content is not evidence of cleanliness. A blob past the read limit
// used to be listed as "unscanned" while the gate exited 0, so the secret committed.
test("check-secrets: content that cannot be read fails closed", () => {
  const dir = tmp("secrets-unscannable");
  gitInit(dir);
  write(path.join(dir, "seed.txt"), "seed\n");
  spawnSync("git", ["add", "seed.txt"], { cwd: dir });
  spawnSync("git", ["commit", "-q", "-m", "seed"], { cwd: dir });
  // .gitattributes -diff makes git print "Binary files ... differ"; a path git cannot show
  // back is what the unscanned branch is for. Use an oversized blob to trigger it.
  const big = Buffer.alloc(68 * 1024 * 1024, 0);
  big.write(assemble("AKIA", "IOSFODNN7EXAMPLE"), 60 * 1024 * 1024);
  fs.writeFileSync(path.join(dir, "big.bin"), big);
  spawnSync("git", ["add", "big.bin"], { cwd: dir });
  const r = spawnSync(process.execPath, [SECRET_CHECK, "--json"], { cwd: dir, encoding: "utf8", timeout: 600000 });
  const out = JSON.parse(r.stdout || "{}");
  return r.status === 1 && (out.unscanned || []).length > 0 && out.clean === false;
});

// Credential shapes the pattern set missed entirely (audit 2026-09-07).
test("check-secrets: catches gitlab/sendgrid/google-oauth/npm/ghs tokens and glued AWS keys", () => {
  const dir = tmp("secrets-shapes");
  const shapes = [
    ["ghs.txt", "ghs_" + "a".repeat(36)],
    ["glpat.txt", "glpat-" + "a".repeat(20)],
    ["skproj.txt", "sk-proj-" + "a".repeat(40)],
    ["sg.txt", "SG." + "a".repeat(20) + "." + "b".repeat(20)],
    ["gocspx.txt", "GOCSPX-" + "a".repeat(28)],
    ["npmtok.txt", "npm_" + "a".repeat(36)],
    ["glued.txt", "prefix" + assemble("AKIA", "IOSFODNN7EXAMPLE") + "suffix"],
  ];
  let caught = 0;
  for (const [name, value] of shapes) {
    const d = tmp("shape");
    gitInit(d);
    write(path.join(d, name), value + "\n");
    spawnSync("git", ["add", name], { cwd: d });
    const r = spawnSync(process.execPath, [SECRET_CHECK], { cwd: d, encoding: "utf8" });
    if (r.status === 1) caught++;
    else console.error("  missed shape: " + name);
  }
  return caught === shapes.length;
});

// The security policy REQUIRES a committed .env.example with placeholders, and INIT
// generates one — so the gate blocked the first commit of every fresh project. The fix
// recognises placeholder VALUES; it must not exempt the file, or a real key hides there.
test("check-secrets: placeholder values pass but a real key in .env.example is still caught", () => {
  const ph = tmp("secrets-ph");
  gitInit(ph);
  write(path.join(ph, ".env.example"), "API_KEY=your_api_key_here\nTOKEN=<your-token>\nS={{SECRET}}\nPW=changeme\nDATABASE_URL=postgres://user:password@localhost:5432/app\n");
  spawnSync("git", ["add", ".env.example"], { cwd: ph });
  const rph = spawnSync(process.execPath, [SECRET_CHECK], { cwd: ph, encoding: "utf8" });
  if (rph.status !== 0) {
    console.error("  placeholders were flagged (exit " + rph.status + ")");
    return false;
  }
  const real = tmp("secrets-real-env");
  gitInit(real);
  write(path.join(real, ".env.example"), "OPENAI_API_KEY=sk-" + "abcdef0123456789abcdef0123456789" + "\n");
  spawnSync("git", ["add", ".env.example"], { cwd: real });
  const rreal = spawnSync(process.execPath, [SECRET_CHECK], { cwd: real, encoding: "utf8" });
  return rreal.status === 1;
});

// A freshly INITed project must be able to make its first commit: the mandatory
// pre-commit gate cannot be failed by INIT's own output (audit 2026-09-07).
test("check-secrets: a freshly generated project passes its own secret gate", () => {
  const dir = tmp("secrets-init-clean");
  const g = spawnSync(process.execPath, [GENERATOR, "--target", dir, "--project-name", "SecInit", "--phase", "C"], { encoding: "utf8" });
  if (g.status !== 0) return false;
  gitInit(dir);
  spawnSync("git", ["add", "-A"], { cwd: dir });
  const r = spawnSync(process.execPath, [path.join(dir, "scripts", "check-secrets.js"), "--json"], { cwd: dir, encoding: "utf8" });
  const out = JSON.parse(r.stdout || "{}");
  if (r.status !== 0) {
    for (const h of out.hits || []) console.error("  INIT output flagged: " + h.file + ":" + h.line + " [" + h.pattern + "]");
  }
  return r.status === 0;
});

// A hand-written proposal declaring low risk + not-required review created an arbitrary
// tag with no assessment at all. `plan` now stamps a provenance value over the fields
// `execute` trusts, and `execute` recomputes it (audit 2026-09-07).
test("release execute: rejects a proposal that plan did not produce, and detects tampering", () => {
  const dir = tmp("rel-provenance");
  gitInit(dir);
  write(path.join(dir, "package.json"), JSON.stringify({ name: "t", version: "1.0.0" }));
  write(path.join(dir, "CHANGELOG.md"), "## [1.0.0]\n");
  spawnSync("git", ["add", "-A"], { cwd: dir });
  spawnSync("git", ["commit", "-q", "-m", "init"], { cwd: dir });
  const head = String(spawnSync("git", ["rev-parse", "HEAD"], { cwd: dir, encoding: "utf8" }).stdout).trim();

  // proposals live OUTSIDE the worktree so the clean-tree check is not what rejects them
  const forgedPath = path.join(tmp("rel-forged"), "forged.json");
  write(forgedPath, JSON.stringify({ current: "1.0.0", recommended: "9.9.9", riskLevel: "low", reviewRecommendation: "none", reviewStatus: "not-required", headSha: head, summary: "forged" }));
  const forged = spawnSync(process.execPath, [RELEASE_TOOL, "execute", "--proposal", forgedPath, "--yes"], { cwd: dir, encoding: "utf8" });
  if (forged.status === 0) {
    console.error("  a hand-written proposal was accepted");
    return false;
  }

  // a real plan output must still work end to end
  const planned = spawnSync(process.execPath, [RELEASE_TOOL, "plan", "--json", JSON.stringify({ current: "1.0.0", changes: [{ type: "fix", description: "a small fix" }] })], { cwd: dir, encoding: "utf8" });
  if (planned.status !== 0) return false;
  const proposal = JSON.parse(planned.stdout);
  if (typeof proposal.provenance !== "string" || proposal.provenance.length !== 64) return false;
  const realPath = path.join(tmp("rel-real"), "real.json");
  write(realPath, JSON.stringify(proposal));
  const ok = spawnSync(process.execPath, [RELEASE_TOOL, "execute", "--proposal", realPath, "--yes"], { cwd: dir, encoding: "utf8" });
  if (ok.status !== 0) {
    console.error("  a genuine proposal was rejected: " + String(ok.stderr || "").split("\n")[0]);
    return false;
  }

  // editing a genuine proposal must be detected
  const tampered = JSON.parse(JSON.stringify(proposal));
  tampered.riskLevel = "low";
  tampered.reviewRecommendation = "none";
  tampered.reviewStatus = "not-required";
  const tamperedPath = path.join(tmp("rel-tampered"), "tampered.json");
  write(tamperedPath, JSON.stringify(tampered));
  const dir2 = tmp("rel-provenance-2");
  gitInit(dir2);
  write(path.join(dir2, "package.json"), JSON.stringify({ name: "t", version: "1.0.0" }));
  spawnSync("git", ["add", "-A"], { cwd: dir2 });
  spawnSync("git", ["commit", "-q", "-m", "init"], { cwd: dir2 });
  const t = spawnSync(process.execPath, [RELEASE_TOOL, "execute", "--proposal", tamperedPath, "--yes"], { cwd: dir2, encoding: "utf8" });
  return t.status !== 0;
});

// A requested platform+stack with no template silently produced NO CI, and the manifest
// dropped the artifact so the validator reported a full pass (audit 2026-09-07).
test("generate-governance: a missing CI template is a hard error, not a silent skip", () => {
  const gap = tmp("ci-gap");
  const r = spawnSync(process.execPath, [GENERATOR, "--target", gap, "--project-name", "Gap", "--phase", "C", "--stack", "haskell", "--ci-platform", "gitlab"], { encoding: "utf8" });
  const out = String(r.stdout || "") + String(r.stderr || "");
  if (r.status === 0) {
    console.error("  missing template exited 0");
    return false;
  }
  if (!/no CI template/i.test(out)) {
    console.error("  failure did not name the missing template");
    return false;
  }
  // ci_platform=none must still be a legitimate skip
  const none = tmp("ci-none");
  const rn = spawnSync(process.execPath, [GENERATOR, "--target", none, "--project-name", "NoCi", "--phase", "C", "--ci-platform", "none"], { encoding: "utf8" });
  return rn.status === 0;
});

// Every shipped CI template must run the governance validator: AGENTS.md declares the
// gate set and CI running a strict subset is the declaration/mechanism gap (audit 2026-09-07).
test("ci templates: every platform+stack template runs the governance validator", () => {
  const combos = [
    ["node", "github"], ["python", "github"], ["rust", "github"], ["go", "github"], ["java", "github"], ["cpp", "github"],
    ["node", "gitlab"], ["python", "gitlab"], ["rust", "gitlab"], ["go", "gitlab"], ["java", "gitlab"], ["cpp", "gitlab"],
  ];
  let checked = 0;
  for (const [stack, platform] of combos) {
    const d = tmp("ci-gov-" + stack + "-" + platform);
    const r = spawnSync(process.execPath, [GENERATOR, "--target", d, "--project-name", "CiGov", "--phase", "C", "--stack", stack, "--ci-platform", platform], { encoding: "utf8" });
    if (r.status !== 0) {
      console.error("  generation failed for " + stack + "+" + platform);
      return false;
    }
    const wf = platform === "gitlab" ? path.join(d, ".gitlab-ci.yml") : path.join(d, ".github/workflows/ci.yml");
    if (!fs.existsSync(wf)) {
      console.error("  no CI file for " + stack + "+" + platform);
      return false;
    }
    if (!fs.readFileSync(wf, "utf8").includes("verify-governance")) {
      console.error("  " + stack + "+" + platform + " CI does not run the governance validator");
      return false;
    }
    checked++;
  }
  return checked === combos.length;
});

test("check-secrets: github_pat_ form hits github-token pattern", () => {
  const dir = tmp("secrets-pat2");
  gitInit(dir);
  const value = assemble("github_pat_", "Q0ABCDEFGHIJKLMNOPQRSTUV1234567890");
  write(path.join(dir, "ci.yml"), assemble("token: ", value));
  spawnSync("git", ["add", "ci.yml"], { cwd: dir });
  const r = spawnSync(process.execPath, [SECRET_CHECK], { cwd: dir, encoding: "utf8" });
  return r.status === 1 && r.stderr.includes("github-token") && !r.stderr.includes(value);
});


test("check-secrets: generic connection string hits generic-connection-string pattern", () => {
  const dir = tmp("secrets-connstr");
  gitInit(dir);
  const value = assemble("mongodb://", "appuser:supersecretpass", "@db.internal:27017/app");
  write(path.join(dir, "config.js"), assemble("const db = '", value, "';"));
  spawnSync("git", ["add", "config.js"], { cwd: dir });
  const r = spawnSync(process.execPath, [SECRET_CHECK], { cwd: dir, encoding: "utf8" });
  return r.status === 1 && r.stderr.includes("generic-connection-string") && !r.stderr.includes("supersecretpass");
});


test("check-secrets: modified-file hunk reports the correct line number", () => {
  const dir = tmp("secrets-modified");
  gitInit(dir);
  // COMMIT the baseline first: only then is the staged diff a real modification hunk
  // (@@ -1,3 +1,4 @@ with context lines), which is what exercises the line counter.
  write(path.join(dir, "app.js"), "const a = 1;\nconst b = 2;\nconst c = 3;\n");
  spawnSync("git", ["add", "app.js"], { cwd: dir });
  spawnSync("git", ["-c", "user.email=t@t", "-c", "user.name=t", "commit", "-q", "-m", "baseline"], { cwd: dir });
  const secretLine = assemble("const to", "ken = 'abcdefgh", "12345678';");
  write(path.join(dir, "app.js"), "const a = 1;\nconst b = 2;\nconst c = 3;\n" + secretLine + "\n");
  spawnSync("git", ["add", "app.js"], { cwd: dir });
  const raw = spawnSync("git", ["diff", "--cached", "-U0"], { cwd: dir, encoding: "utf8" });
  if (!/^@@ -\d+(,\d+)? \+\d+/m.test(String(raw.stdout)) || /@@ -0,0/.test(String(raw.stdout))) return false;
  const r = spawnSync(process.execPath, [SECRET_CHECK, "--json"], { cwd: dir, encoding: "utf8" });
  if (r.status !== 1) return false;
  const out = JSON.parse(r.stdout);
  return out.hits.length === 1 && out.hits[0].pattern === "credential-assignment" && out.hits[0].line === 4;
});


test("CTRL-0001: evaluateSecretProtection fail/pass without decision_effect", () => {
  const { evaluateSecretProtection } = require(path.join(SKILL_ROOT, "scripts/evaluators/ctrl-0001-secret-protection.js"));
  const dirty = tmp("ctrl-0001-eval-dirty");
  gitInit(dirty);
  const value = assemble("AKIA", "IOSFODNN7EXAMPLE");
  write(path.join(dirty, "app.js"), assemble("const k = '", value, "';"));
  spawnSync("git", ["add", "app.js"], { cwd: dirty });
  const fail = evaluateSecretProtection({ root: dirty });
  if (
    fail.control !== "CTRL-0001" ||
    fail.verdict !== "fail" ||
    Object.prototype.hasOwnProperty.call(fail, "decision_effect") ||
    !fail.evidence.hits.some((h) => h.pattern === "aws-access-key")
  ) return false;

  const clean = tmp("ctrl-0001-eval-clean");
  gitInit(clean);
  write(path.join(clean, "app.js"), "const ok = 1;\n");
  spawnSync("git", ["add", "app.js"], { cwd: clean });
  const pass = evaluateSecretProtection({ root: clean });
  return pass.control === "CTRL-0001" && pass.verdict === "pass" && pass.evidence.hits.length === 0;
});


test("CTRL-0001: repo-tools CLI matches skill CLI and AGENTS uses repo entry", () => {
  const repoCheck = path.join(SKILL_ROOT, "repo-tools", "check-secrets.js");
  const agents = fs.readFileSync(path.join(SKILL_ROOT, "AGENTS.md"), "utf8");
  if (!agents.includes("`repo-tools/check-secrets.js`")) return false;
  if (/pre-commit checklist: `scripts\/check-secrets\.js`/.test(agents)) return false;

  const dir = tmp("ctrl-0001-repo-cli");
  gitInit(dir);
  const value = assemble("AKIA", "IOSFODNN7EXAMPLE");
  write(path.join(dir, "app.js"), assemble("const apiKey = '", value, "';"));
  spawnSync("git", ["add", "app.js"], { cwd: dir });
  const skill = spawnSync(process.execPath, [SECRET_CHECK, "--json"], { cwd: dir, encoding: "utf8" });
  const repo = spawnSync(process.execPath, [repoCheck, "--json"], { cwd: dir, encoding: "utf8" });
  if (skill.status !== 1 || repo.status !== 1) return false;
  const a = JSON.parse(skill.stdout);
  const b = JSON.parse(repo.stdout);
  return (
    a.clean === false &&
    b.clean === false &&
    a.hits[0].pattern === b.hits[0].pattern &&
    !skill.stderr.includes(value) &&
    !repo.stderr.includes(value)
  );
});

};
