# .githooks/pre-commit + commit-msg 模板（提交一致性钩子）

INIT 会将同一份脚本复制为 `<project>/.githooks/pre-commit` 与
`<project>/.githooks/commit-msg`，但**不会**执行 `git config core.hooksPath
.githooks`，因此默认不启用。项目管理员明确启用后，两个钩子分别校验暂存文件清单与提交消息。

## 定位：内容一致性校验，不是授权校验

本钩子校验「实际暂存内容与用户确认过的命令序列一致」，以及实际提交消息属于确认过的消息列表。它**不是**授权机制——凭证由 Agent 写入，Agent 可以自行改写凭证并通过钩子；它防的是「实际提交偏离已确认的命令序列」，**不防**「完全绕过确认私自提交」。

## 脆弱性（已知，接受为权衡）

- 凭证指纹比对是**状态比对**：Agent 确认后、提交前若改动任何内容，指纹将失配，钩子会**误拒**（拒绝是安全方向，但会阻塞合法提交）。此时应重新向用户确认并更新凭证。
- 钩子不能防止完全绕过：`git commit --no-verify`（或其它 `--no-verify` 写操作）会跳过钩子；`git config --unset core.hooksPath` 会停用整个 hooks 路径。管理员必须把这些视为显式绕过动作，而不是授权证明。
- 主流 hook 做独立可判检查（lint/密钥/格式），本钩子是状态比对，误报率高于主流；脚本依赖治理运行时已有的 Node.js。

## 启用方式（默认不启用）

启用：`git config core.hooksPath .githooks`（配置后 Git 执行两个钩子）。停用：`git config --unset core.hooksPath`。启用前必须确认 `scripts/check-secrets.js` 退出码为 0，且已执行「一次确认 per 变更集」规则。

`.githooks/pre-commit`、`.githooks/commit-msg` 与 `.governance/consent.json` 的写入均非 INIT 自动行为——启用权与凭证生成权由项目管理员决策。凭证文件必须保持 git-ignored，不得提交。

## 钩子内容（复制到两个 `.githooks/` 文件）

```sh
#!/bin/sh
# 提交一致性钩子：校验暂存文件清单与确认的命令序列，并校验确认的提交消息。
# 凭证：.governance/consent.json（git-ignored，记录确认时刻的文件清单与提交消息）。
# 启用：git config core.hooksPath .githooks（默认不启用）。
# 边界：凭证由 Agent 写入，防"实际提交偏离确认序列"，不防"完全绕过确认"。
set -eu

CONSENT_FILE=".governance/consent.json"

fail() {
  echo "pre-commit: $*" >&2
  exit 1
}

REPO_ROOT=$(git rev-parse --show-toplevel 2>/dev/null) || fail "cannot locate the repository root"
cd "$REPO_ROOT"
[ -f "$CONSENT_FILE" ] || fail "missing $CONSENT_FILE; refusing to commit without a confirmation record"

command -v node >/dev/null 2>&1 || fail "node is required to validate $CONSENT_FILE"

HOOK_MODE="pre-commit"
MESSAGE_FILE=""
case "${0##*/}" in
  commit-msg)
    [ "$#" -eq 1 ] || fail "commit-msg requires Git's message-file argument"
    HOOK_MODE="commit-msg"
    MESSAGE_FILE="$1"
    ;;
esac

node - "$HOOK_MODE" "$CONSENT_FILE" "$MESSAGE_FILE" <<'NODE'
const fs = require("fs");
const { spawnSync } = require("child_process");

const args = process.argv.slice(2);
const mode = args[0] === "commit-msg" ? "commit-msg" : "pre-commit";
const consentFile = args[1];
const messageFile = args[2];

function fail(message) {
  process.stderr.write(`pre-commit: ${message}\n`);
  process.exit(1);
}

let consent;
try {
  consent = JSON.parse(fs.readFileSync(consentFile, "utf8"));
} catch (error) {
  fail(`cannot read or parse ${consentFile}; refusing to proceed`);
}

if (!consent || !Array.isArray(consent.staged) || !consent.staged.every((p) => typeof p === "string")) {
  fail(`${consentFile} must contain a staged filename array`);
}

const messages = Array.isArray(consent.message) ? consent.message : [consent.message];
if (!messages.length || !messages.every((m) => typeof m === "string" && m.length > 0)) {
  fail(`${consentFile} must contain a non-empty message or message array`);
}

function normalizePaths(paths) {
  return paths.map((p) => p.replace(/\\/g, "/")).sort();
}

const staged = spawnSync("git", ["-c", "core.quotePath=false", "diff", "--cached", "--name-only", "-z"], { encoding: "buffer" });
if (staged.status !== 0) fail("cannot inspect the staged file list");
const currentFiles = staged.stdout.toString("utf8").split("\0").filter(Boolean);
if (JSON.stringify(normalizePaths(consent.staged)) !== JSON.stringify(normalizePaths(currentFiles))) {
  fail("staged files differ from the confirmed command sequence; re-confirm and update consent.json");
}

// Content binding. The file list alone does not prove the approved CONTENT is what gets
// committed: approve app.js, then rewrite app.js before committing, and the list still
// matches (verified — the commit went through with swapped content). When consent.json
// carries a stagedDigest it must equal the hash of the staged diff, so any post-approval
// edit invalidates the record. The field is OPTIONAL: consent records written before this
// check have no digest, and making it mandatory would break every governed project on
// upgrade. Absent digest keeps the old, weaker guarantee; present digest is fail-closed.
if (Object.prototype.hasOwnProperty.call(consent, "stagedDigest")) {
  if (typeof consent.stagedDigest !== "string" || !consent.stagedDigest) {
    fail(`${consentFile} stagedDigest must be a non-empty string`);
  }
  const diff = spawnSync("git", ["-c", "core.quotePath=false", "diff", "--cached"], { encoding: "buffer" });
  if (diff.status !== 0) fail("cannot inspect the staged diff for digest verification");
  const actualDigest = require("crypto").createHash("sha256").update(diff.stdout).digest("hex");
  if (actualDigest !== consent.stagedDigest) {
    fail("staged content changed after confirmation (digest mismatch); re-confirm and update consent.json");
  }
}

if (mode === "commit-msg") {
  if (!messageFile) fail("commit-msg did not receive a message file");
  let actual;
  try {
    actual = fs.readFileSync(messageFile, "utf8");
  } catch (error) {
    fail("cannot read the proposed commit message");
  }
  // Git comments are not part of the commit message a user confirms. Keep the
  // comparison exact for message text while ignoring Git's trailing blank lines.
  actual = actual.replace(/\r\n/g, "\n").split("\n").filter((line) => !line.startsWith("#")).join("\n").replace(/\n+$/, "");
  const matches = messages.some((expected) => {
    const normalized = expected.replace(/\r\n/g, "\n").replace(/\n+$/, "");
    return normalized === actual;
  });
  if (!matches) fail("commit message differs from the confirmed message; re-confirm before committing");
}
NODE

exit 0
```

凭证形状示例（`message` 也可为单个字符串）：

```json
{
  "staged": ["src/file with space.ts", "文档/说明.md"],
  "message": ["fix(scope): update the governed files"]
}
```

## 生成规则

- 默认**不启用**：INIT 仅复制两个钩子文件；启用需显式配置 `core.hooksPath`，且此前必须确认密钥扫描与「一次确认 per 变更集」规则已执行。
- `.githooks/pre-commit`、`.githooks/commit-msg` 与 `.governance/consent.json` 的写入均非 INIT 自动行为——启用权由项目管理员决策。
- 两个生成的钩子都设置 POSIX mode `755`；Windows 不强制文件 mode，但脚本仍以真实 `sh` 语法编写。
- 修改本模板属于治理文件变更（走「治理文件保护」流程），并同步更新 `docs/rules/git-policy.md` 的对应描述。
