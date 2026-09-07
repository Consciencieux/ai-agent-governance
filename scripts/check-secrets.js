#!/usr/bin/env node
// PAYLOAD SCRIPT — copied standalone into governed projects (references/init-spec.json).
// Keep it self-contained: Node builtins only, never require() a sibling module.
// Secret Scanning Gate — read-only, zero-dependency. Scans the STAGED diff
// (git diff --cached) for secret-like material. Mirrors check-git-policy.js.
// Usage: node scripts/check-secrets.js [--json]
// Exit 0 clean · Exit 1 on hits (file:line + pattern class reported, NEVER the secret itself).

const { spawnSync } = require("child_process");

const PATTERNS = [
  { name: "aws-access-key", re: /(?:AKIA|ASIA)[0-9A-Z]{16}/ },
  { name: "github-token", re: /(?:ghp_|gho_|ghu_|ghs_|ghr_|github_pat_)[A-Za-z0-9_]{20,}/ },
  { name: "gitlab-pat", re: /\bglpat-[A-Za-z0-9_-]{20,}/ },
  { name: "openai-style-key", re: /sk-(?:proj-|ant-[A-Za-z0-9-]*)?[A-Za-z0-9_-]{20,}/ },
  { name: "sendgrid-key", re: /\bSG\.[A-Za-z0-9_-]{16,}\.[A-Za-z0-9_-]{16,}|\bSG\.[A-Za-z0-9_-]{32,}/ },
  { name: "google-oauth-secret", re: /\bGOCSPX-[A-Za-z0-9_-]{20,}/ },
  { name: "npm-token", re: /\bnpm_[A-Za-z0-9]{30,}/ },
  { name: "slack-token", re: /\bxox[baprs]-[A-Za-z0-9-]{20,}\b/ },
  { name: "slack-webhook", re: /https:\/\/hooks\.slack\.com\/services\/T[A-Za-z0-9_]+\/B[A-Za-z0-9_]+\/[A-Za-z0-9_]+/ },
  { name: "google-api-key", re: /\bAIza[0-9A-Za-z_-]{30,}\b/ },
  { name: "stripe-secret-key", re: /\b(?:sk|rk)_(?:live|test)_[A-Za-z0-9]{16,}\b/ },
  {
    name: "azure-storage-key",
    re: /(?:DefaultEndpointsProtocol=https;[^\n]*;AccountKey=[^;\s]{16,}|(?:azure|az)[_-]?(?:storage[_-]?)?(?:account[_-]?)?(?:key|secret)\s*[:=]\s*["']?[A-Za-z0-9+/=]{16,})/i,
  },
  { name: "jwt", re: /\beyJ[A-Za-z0-9_-]{5,}\.[A-Za-z0-9_-]{5,}\.[A-Za-z0-9_-]{5,}\b/ },
  { name: "private-key-header", re: /-----BEGIN (?:[A-Z0-9 ]*PRIVATE KEY|PGP PRIVATE KEY BLOCK)-----/ },
  {
    name: "base64-secret",
    re: /(?:base64|b64|encoded(?:[_-]?(?:secret|token|key))?|(?:password|passwd|secret|token|api[_-]?key))\s*[:=]\s*["']?[A-Za-z0-9+/]{24,}={0,2}(?=["'\s;,)]|$)/i,
  },
  { name: "pem-body", re: /\bMII[A-Za-z0-9+/]{30,}={0,2}\b/ },
  { name: "generic-connection-string", re: /(?:mongodb|postgres(?:ql)?|mysql|redis|amqp):\/\/[^:\s]+:[^@\s]+@/i },
  // Keep punctuation used by real credentials in the value class. The match stops
  // at whitespace/quotes so a trailing statement delimiter is not part of the value.
  // The value must not look like a filename/path/URL: prose such as `// token: git.policy.md`
  // in a source comment is not a credential, and treating it as one made the gate block
  // its own repository (audit 2026-09-07). A real credential has no dotted file extension
  // and no path separator followed by more path.
  {
    name: "credential-assignment",
    re: /(?:password|passwd|secret|token|api[_-]?key|client[_-]?secret|access[_-]?key)\s*[:=]\s*["']?(?![A-Za-z0-9_.-]*\.(?:md|js|json|ya?ml|txt|sh|ts|py|rs|go|java|html|css)\b)(?![.a-z]*\/)[A-Za-z0-9_./+=!@$%:~?*#-]{8,}/i,
  },
];

// Obvious placeholder values. A committed `.env.example` is REQUIRED by the security
// policy to carry placeholders, and INIT generates one — so the gate used to block the
// very first commit of a freshly initialised project (audit 2026-09-07). This does not
// exempt any FILE: a real credential in `.env.example` is still caught. It only
// recognises values that cannot be a credential because they name themselves as
// placeholders. Keep this list narrow and literal — a loose rule here silently
// un-protects every file.
const PLACEHOLDER_VALUE = /(?:your_[a-z0-9_]*here|<[a-z0-9_-]+>|\{\{[^}]+\}\}|xxx+|change[_-]?me|replace[_-]?me|placeholder|example[_-]?(?:key|secret|token|password)|dummy|\bTODO\b|\*{3,})/i;
// A password-shaped default in a template connection string (user:password@host) is the
// documented placeholder form for DATABASE_URL; a real one would not be the literal word.
const PLACEHOLDER_CREDENTIAL_PAIR = /:\/\/(?:user|username|user_?name|admin|root):(?:password|passwd|pass|secret|changeme|your_password)@/i;

function isPlaceholder(content) {
  return PLACEHOLDER_VALUE.test(content) || PLACEHOLDER_CREDENTIAL_PAIR.test(content);
}

function stagedDiff() {
  const r = spawnSync("git", ["-c", "core.quotePath=false", "diff", "--cached", "--no-color", "--no-ext-diff", "-U0"], { encoding: "utf8" });
  if (r.status !== 0) return { error: String(r.stderr || "git diff failed") };
  return { out: String(r.stdout || "") };
}

function diffPath(raw) {
  const p = String(raw || "").trim();
  if (!p || p === "/dev/null") return null;
  return p.replace(/^b\//, "").replace(/\\/g, "/");
}

function hunkNewLine(line) {
  const m = line.match(/^@@ [^+]*\+(\d+)(?:,(\d+))? @@/);
  return m ? parseInt(m[1], 10) : null;
}

if (process.argv.includes("--help") || process.argv.includes("-h")) {
  console.log(`Usage:
  check-secrets.js [--json]   Scan the staged diff for secret-like material (read-only)
Exit codes: 0 clean · 1 hits (reports file:line + pattern class, never the secret)`);
  process.exit(0);
}

const { out, error } = stagedDiff();
if (error) {
  console.error(`check-secrets: ${error}`);
  process.exit(1);
}

const hits = [];
// Files git refused to diff as text and that could not be read back as a blob. They are
// NOT evidence of cleanliness — reporting them separately keeps the gate honest about
// what it actually inspected.
const unscanned = [];
let currentFile = null;
let nextLine = null;
const lines = out.split("\n");

// Diff-header state machine. A `+++ ` prefix is a file header ONLY when it directly
// follows a `--- ` line; in the hunk body every added line carries one `+`, so a source
// line whose own content starts with `++ ` produces the diff line `+++ <content>`. Keying
// on the prefix alone let that content be consumed as a header and skipped entirely —
// a two-character bypass of a SECURITY gate, and it also corrupted `currentFile` for
// every following hunk (audit 2026-09-07).
let sawMinusHeader = false;

for (const line of lines) {
  if (line.startsWith("diff --git") || line.startsWith("index ")) {
    sawMinusHeader = false;
    continue;
  }
  if (line.startsWith("--- ")) {
    sawMinusHeader = true;
    continue;
  }
  if (line.startsWith("+++ ") && sawMinusHeader) {
    currentFile = diffPath(line.slice(4));
    sawMinusHeader = false;
    continue;
  }
  sawMinusHeader = false;
  if (line.startsWith("@@")) {
    nextLine = hunkNewLine(line);
    continue;
  }
  // Git prints "Binary files a/x and b/x differ" instead of content for blobs it treats as
  // binary — either auto-detected (NUL bytes) or declared via .gitattributes (`binary` /
  // `-diff`). The line loop below therefore never sees that content, and the gate used to
  // report "clean" for a file it had not read: staging a key inside a `-diff` file was a
  // one-line, legitimate-looking bypass of a SECURITY gate (audit 2026-09-05). Read the
  // staged blob directly and scan it; if that is not possible, report the file as
  // UNSCANNED rather than counting it toward a clean result.
  if (line.startsWith("Binary files ")) {
    const bm = /^Binary files (?:a\/(.+?)|\/dev\/null) and (?:b\/(.+?)|\/dev\/null) differ$/.exec(line);
    const bfile = (bm && (bm[2] || bm[1])) || currentFile || "(unknown)";
    let blob = null;
    const shown = spawnSync("git", ["show", ":" + bfile], { encoding: "latin1", maxBuffer: 1 << 26 });
    if (shown.status === 0 && typeof shown.stdout === "string") blob = shown.stdout;
    if (blob === null) {
      unscanned.push(bfile);
    } else {
      let n = 0;
      for (const bline of blob.split(/\r?\n/)) {
        n++;
        for (const p of PATTERNS) {
          if (p.re.test(bline)) {
            hits.push({ file: bfile, line: n, pattern: p.name });
            break;
          }
        }
      }
    }
    continue;
  }
  if (line.startsWith(" ")) {
    if (nextLine !== null) nextLine++;
    continue;
  }
  if (!line.startsWith("+")) continue;
  const lineNumber = nextLine;
  if (nextLine !== null) nextLine++;
  if (line === "+" || line.length === 1) continue;
  const content = line.slice(1);
  if (isPlaceholder(content)) continue;
  for (const p of PATTERNS) {
    const m = content.match(p.re);
    if (m) {
      hits.push({ file: currentFile || "(unknown)", line: lineNumber === null ? "unknown" : lineNumber, pattern: p.name });
      break;
    }
  }
}

if (process.argv.includes("--json")) {
  const clean = hits.length === 0 && unscanned.length === 0;
  process.stdout.write(JSON.stringify({ clean, hits, unscanned }, null, 2) + "\n");
  process.exit(clean ? 0 : 1);
}

if (hits.length > 0) {
  console.error("check-secrets: BLOCKED — staged diff contains secret-like material:");
  for (const h of hits) {
    console.error(`  ${h.file}:${h.line}  [${h.pattern}]`);
  }
  console.error("Remove the material from the staged diff before committing.");
  process.exit(1);
}
if (unscanned.length > 0) {
  // FAIL CLOSED. An unreadable blob is not evidence of cleanliness: a 70 MiB binary with a
  // key past the maxBuffer limit used to exit 0 with the file merely listed, so the secret
  // committed (audit 2026-09-07). The gate cannot vouch for content it never read.
  console.error("check-secrets: BLOCKED — content could not be inspected:");
  for (const f of unscanned) console.error(`    ${f}`);
  console.error("Unreadable staged content is not proof of cleanliness. Remove it from the");
  console.error("staged set, or inspect it manually and stage it in a form the gate can read.");
  process.exit(1);
}
console.log("check-secrets: clean");
process.exit(0);
