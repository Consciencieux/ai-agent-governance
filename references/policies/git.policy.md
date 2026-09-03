# Git Write Policy（分层权限）

本文件定义 AI Agent 的 Git 操作边界。写入 AGENTS.md 摘要 + 本文件详解。

## 允许自动执行（无需确认）

- `git status`
- `git diff`
- `git log`
- `git fetch`
- `git add <specific file>`（仅暂存**明确指定**的文件）

**暂存前检查（每次 add 前必须）**：
- `git status` —— 确认只暂存预期文件
- `git check-ignore <file>` —— 确认 `.env`、`*.pem`、密钥等已被忽略
- `git diff --cached --name-only` —— add 后复核暂存清单无敏感文件
- 发现敏感文件入暂存 → 立即 `git restore --staged` 并报告

## 需要确认（必须先向用户说明意图并等待明确同意）

- `git add .` / `git add -A`（全量暂存，必须先检查 `git status` 与 `.gitignore`，确认无 `.env`/密钥/构建产物）
- `git rm` / `git restore`（删除文件 / 丢弃工作区改动，有破坏性）
- `git tag`（创建/删除 tag；发布流程中须先经 Approval Gate，见 `references/workflows/release.md`）
- `git reset` / `git rebase` / `git revert`
- `git merge`
- `git stash`
- `git clean` / 任何破坏性命令
- `git commit --amend`（已推送的提交视同 force push）
- `checkout` 携带未提交改动切换分支（改动可能被覆盖）

## 自动执行（无需确认）

- `git checkout -b <branch>` / 干净工作区切换分支（与分支工作流一致，不打断任务开始）

## 禁止自动执行

- `git push` 严禁在无人确认下执行
- `git add .` 严禁在未检查 `.gitignore` 时执行（防止暂存 `.env`、`secret.pem`）

## 确认范围（一次确认 per 变更集）

**提交前回显完整 git 命令序列，用户确认一次，覆盖 add → commit → push。** 这是唯一的确认点，与任务规模无关——小改动也不例外。

- 任何任务完成、提交之前，必须回显：暂存哪些文件、每个 commit 的消息（类型含在消息前缀）、目标 remote/branch。
- 用户说 "push"、"commit 这些改动"、"提交并推送" 等写指令时，触发回显；**指令不是确认本身**——回显后仍需等待用户一次明确确认。
- **计划批准 = 意图对齐**：中/大型任务的 Phase 2 计划批准只对齐"改什么、怎么改"，不是提交确认。用户批了计划不代表提交自动通过。
- 规模分级决定"要不要写 TASK 计划文档"，不决定"要不要给用户确认"。
- 用户说"完成任务"、"wrap it up"、"发布吧"这类**任务级**表述时，**不得**据此提交或推送——它们不是写操作指令。
- 有疑问时，**永远先问**。

**通用硬约束（每次变更集都适用）：**

- 回显必须是完整命令序列（暂存文件、每个提交消息、目标 remote/branch）；执行不得偏离已确认序列。
- 任一步失败 → 停止并报告，不得改用其他方式重试、不得即兴修补，重新取得确认后继续。
- push 被拒（non-fast-forward）→ 停止并报告，不得擅自 pull/rebase 后再推。
- 歧义指令（"提交一下"这类中文表述）→ 不适用自动回显，先问。

**独立确认（不覆盖于提交前确认，需各自单独确认）：**

- `tag`、`reset`、`rebase`、`revert`、`merge`、force push、`clean`、`rm`、`restore`、`stash`、`pull`（`pull` 可触发 merge/rebase）
- `checkout` 携带未提交改动切换分支
- `commit --amend` 已推送的提交（视同 force push）

**发布序列（RELEASE）**：在 Approval Gate 批准一次 Release Proposal，即覆盖**该次发布序列的全部写操作**（版本同步 → 归档 → release commit → tag → push 分支 → push tag → GitHub Release → 资产上传），不再逐步追问（见 `references/workflows/release.md`）。前提：完整 Proposal 已展示且获明确批准、工作区与 HEAD 仍与批准时的 `headSha` 一致、不触碰发布序列之外的内容。中途任一校验失败 → 停止并重新走 plan，不得擅自跳过。

## Mandatory Pre-commit Checklist

push/PR 前必须确认：
- [ ] `node scripts/check-secrets.js` 退出码 0（`git commit` 确认前必须；命中 → 清理暂存区后重跑）
- [ ] CHANGELOG.md 已更新（未更新禁止 push）
- [ ] 测试/静态检查/构建已通过并记录输出
- [ ] 无敏感信息（密钥、token）进入提交
- [ ] 无无关文件被 `git add`（检查 `git status` / `git diff --cached`）

## 首次提交前

检查 git 身份已配置：`user.name` / `user.email`。
未配置 → ⚠️ Blocked，提示用户配置，不擅自设置。

## 提交信息约定

按项目约定（默认 Conventional Commits）：
`<type>(<scope>): <subject>`，如 `feat(auth): add login endpoint`。
语言遵循项目 Commit Message Language 约定。

## 分支工作流（Branch Workflow）

策略由 `.governance/git-policy.json` 定义（默认：`protectedBranches: ["main","master"]`、`directPush: false`、`requireReview: true`、`allowForcePush: false`）。Agent 处理开发任务时：

- **开始前**：运行 `scripts/check-git-policy.js`；当前分支在受保护列表且 `directPush=false` → 退出码 1，**必须先创建特性分支**再修改/提交。
- **分支命名**：`feature/agent-<YYYYMMDD>-<summary>`。
- **流程**：建分支 → 实现 → 测试 → commit → push 分支 → 创建 PR → 人工批准 → 合入受保护分支。
- **禁止**：`directPush=false` 时在受保护分支上直接提交/推送；force push 一律禁止（`allowForcePush=false`）。
- **小型改动豁免**：单文件、纯文档/typo 级修改且不涉及受保护分支的可跳过分支直接提交，但必须在报告中说明；涉及受保护分支的修改一律走分支流程。
- **与发布流程的关系**：RELEASE 模式按 `references/workflows/release.md` 走 tag/push 流程，不受本分支工作流约束（发布是受控的、需批准的写操作）。

## 治理文件保护

修改 `AGENTS.md`、`CLAUDE.md`、`docs/rules/**`、`.governance/manifest.json`、`.governance/preflight.json`、`.governance/git-policy.json`、`.governance/sync-rules.json`、`scripts/verify-governance.js`、`scripts/check-lock.js`、`scripts/check-git-policy.js`、`scripts/check-secrets.js`、`scripts/check-sync.js`、`scripts/check-doc-consistency.js`、`.githooks/pre-commit`、`.githooks/commit-msg`、`opencode.json`、CI 配置（`.github/workflows/**`、`.gitlab-ci.yml`）需要特殊权限（清单以 `references/policies/governance-files.policy.md` 为准）：
说明原因 → 更新 CHANGELOG → **更新 `.governance/manifest.json` 的 `governance_version`** → 运行 `scripts/verify-governance.js`。
涉及权限/安全/删除保护/校验步骤的修改必须用户明确确认。
未经用户明确同意不得放宽权限限制或移除校验步骤。普通业务任务不得隐式触发本流程。
