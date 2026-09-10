#!/usr/bin/env node
// INSTALLED helper — shared secret-scan factual primitives (CTRL-0001).
// Patterns, placeholder recognition, staged-diff / blob scanning.
// No profile binding, no advisory/deny, no CLI formatting, no Control identity.
// Node builtins only. Pattern table here is interim mechanical specimen;
// long-term semantics_ref must leave evaluator/CLI (ADR-0023).

"use strict";

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
  {
    name: "credential-assignment",
    re: /(?:password|passwd|secret|token|api[_-]?key|client[_-]?secret|access[_-]?key)\s*[:=]\s*["']?(?![A-Za-z0-9_.-]*\.(?:md|js|json|ya?ml|txt|sh|ts|py|rs|go|java|html|css)\b)(?![.a-z]*\/)[A-Za-z0-9_./+=!@$%:~?*#-]{8,}/i,
  },
];

const PLACEHOLDER_VALUE = /(?:your_[a-z0-9_]*here|<[a-z0-9_-]+>|\{\{[^}]+\}\}|xxx+|change[_-]?me|replace[_-]?me|placeholder|example[_-]?(?:key|secret|token|password)|dummy|\bTODO\b|\*{3,})/i;
const PLACEHOLDER_CREDENTIAL_PAIR = /:\/\/(?:user|username|user_?name|admin|root):(?:password|passwd|pass|secret|changeme|your_password)@/i;

function isPlaceholder(content) {
  return PLACEHOLDER_VALUE.test(content) || PLACEHOLDER_CREDENTIAL_PAIR.test(content);
}

function createSecretScanFacts(root) {
  const ROOT = root || process.cwd();

  function stagedDiff() {
    const r = spawnSync(
      "git",
      ["-c", "core.quotePath=false", "diff", "--cached", "--no-color", "--no-ext-diff", "-U0"],
      { cwd: ROOT, encoding: "utf8" }
    );
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

  function showBlob(relPath) {
    const shown = spawnSync("git", ["show", ":" + relPath], {
      cwd: ROOT,
      encoding: "latin1",
      maxBuffer: 1 << 26,
    });
    if (shown.status === 0 && typeof shown.stdout === "string") return shown.stdout;
    return null;
  }

  /**
   * Scan staged content. Does not decide deny/advisory.
   * @returns {{ error?: string, hits: Array<{file,line,pattern}>, unscanned: string[] }}
   */
  function scanStaged() {
    const { out, error } = stagedDiff();
    if (error) return { error, hits: [], unscanned: [] };

    const hits = [];
    const unscanned = [];
    let currentFile = null;
    let nextLine = null;
    let sawMinusHeader = false;

    for (const line of out.split("\n")) {
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
      if (line.startsWith("Binary files ")) {
        const bm = /^Binary files (?:a\/(.+?)|\/dev\/null) and (?:b\/(.+?)|\/dev\/null) differ$/.exec(line);
        const bfile = (bm && (bm[2] || bm[1])) || currentFile || "(unknown)";
        const blob = showBlob(bfile);
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
          hits.push({
            file: currentFile || "(unknown)",
            line: lineNumber === null ? "unknown" : lineNumber,
            pattern: p.name,
          });
          break;
        }
      }
    }

    return { hits, unscanned };
  }

  return {
    root: ROOT,
    patterns: PATTERNS,
    isPlaceholder,
    scanStaged,
  };
}

module.exports = {
  createSecretScanFacts,
  PATTERNS,
  isPlaceholder,
};
