# Git Write Policy（分层权限）

本文件是 AI Agent Git 操作边界的**唯一语义权威**。`AGENTS.md` / `SKILL.md` 只保留指针与 always-on 摘要，禁止第二份权威正文。

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
- `git tag`（创建/删除 tag；发布流程中须先经 Approval Gate，见项目的发布流程）
- `git reset` / `git rebase` / `git revert`
- `git merge`
- `git stash`
- `git clean` / 任何破坏性命令
- `git commit --amend`（已推送的提交视同 force push）
- `checkout` 携带未提交改动切换分支（改动可能被覆盖）

## 自动执行（无需确认）

- 干净工作区切换到**已存在**的分支
- `git checkout -b <branch>` **仅当** `scripts/check-git-policy.js` 实际 exit 1（受保护分支且 `directPush=false`），或用户明确要求建分支。禁止为「看起来更合规」自行开分支。

## 禁止自动执行

- `git push` 严禁在无人确认下执行
- `git add .` 严禁在未检查 `.gitignore` 时执行（防止暂存 `.env`、`secret.pem`）

## 确认范围（一次确认 per 变更集）

**一次确认覆盖该变更集的 add → commit → push。** 与任务规模无关——小改动也不例外。

**什么算确认（人授）：**

- 用户对 Git 写操作的**明确写指令**（例如：「commit 这些改动」「提交并推送」「push」指向当前变更集），或
- IDE / 宿主对「暂存 + 提交 + 推送」确认条（或等价 Diff 确认 UI）的一次明确同意

以上任一即是该变更集的确认。人授后**直接执行**，不得再要求「再确认一次」。执行后在回复中留下简短记录（文件清单、各 commit 消息、目标 remote/branch、hash）即可——**禁止**把执行前完整命令回显当成硬义务或第二次闸门。

**什么不算确认：**

- 计划批准 = 意图对齐（「改什么、怎么改」），不是提交授权
- 规模分级只决定要不要写 TASK 计划文档，不决定要不要人授
- 任务级表述（「完成任务」「wrap it up」「发布吧」）不是写操作指令——不得据此提交或推送
- 歧义指令（「提交一下」等）→ 先问，不适用自动执行

**通用硬约束（每次变更集都适用）：**

- 执行不得偏离已获人授的变更集（暂存哪些文件、各 commit 消息、目标 remote/branch）
- 任一步失败 → 停止并报告，不得改用其他方式重试、不得即兴修补，重新取得确认后继续
- push 被拒（non-fast-forward）→ 停止并报告，不得擅自 pull/rebase 后再推
- 有疑问时，**永远先问**

**独立确认（不覆盖于变更集确认，需各自单独确认）：**

- `tag`、`reset`、`rebase`、`revert`、`merge`、force push、`clean`、`rm`、`restore`、`stash`、`pull`（`pull` 可触发 merge/rebase）
- `checkout` 携带未提交改动切换分支
- `commit --amend` 已推送的提交（视同 force push）

**发布序列（RELEASE）**：在 Approval Gate 批准一次 Release Proposal，即覆盖**该次发布序列的全部写操作**（版本同步 → 归档 → release commit → tag → push 分支 → push tag → GitHub Release → 资产上传），不再逐步追问（见项目的发布流程）。前提：完整 Proposal 已展示且获明确批准、工作区与 HEAD 仍与批准时的 `headSha` 一致、不触碰发布序列之外的内容。中途任一校验失败 → 停止并重新走 plan，不得擅自跳过。

## Mandatory Pre-commit Checklist

push/PR 前必须确认：

- [ ] `node scripts/check-secrets.js` 退出码 0（`git commit` 前必须；命中 → 清理暂存区后重跑）
- [ ] 无敏感信息（密钥、token）进入提交
- [ ] 无无关文件被 `git add`（检查 `git status` / `git diff --cached`）
- [ ] 测试/静态检查/构建按项目约定已通过并记录输出（不得声称「应该过」）

**CHANGELOG：** 写入遵循项目 CHANGELOG 政策（被治理项目：`docs/rules/lifecycle.md` 结构契约与内容边界；本 skill 分发仓另有 repo accession 文档，不在此复述路径）。**禁止**把「每次 push 必须改 CHANGELOG」当作硬门槛——写成可推迟到 checkpoint；对账不可推迟。行为变更是否需要条目，按该政策准入判定，不在本文件复述。

## 首次提交前

检查 git 身份已配置：`user.name` / `user.email`。
未配置 → ⚠️ Blocked，提示用户配置，不擅自设置。

## 提交信息约定

按项目约定（默认 Conventional Commits）：
`<type>(<scope>): <subject>`，如 `feat(auth): add login endpoint`。
语言遵循项目 Commit Message Language 约定。

## 分支工作流（Branch Workflow）

策略由 `.governance/git-policy.json` 定义（INIT 产品默认：`protectedBranches: ["main","master"]`、`directPush: false`、`requireReview: true`、`allowForcePush: false`）。**缺该文件 ≠ 启用该默认剧本。** 本 skill 分发仓无此文件。开始写之前跑 `scripts/check-git-policy.js`，按**实际退出码**办事，禁止把模板默认当成无条件流程。

- **文件缺席或 exit 0**：留在用户当前分支（含 `main`）。禁止为合规自行 `checkout -b`。禁止自行 `gh pr create`。
- **仅当 exit 1**（当前分支在 `protectedBranches` 且 `directPush=false`）：必须先建特性分支再修改/提交。命名服从**当前仓库约定**（禁止把某一固定模式写成跨项目硬规则）。
- **创建 PR 永远不是 Agent 默认**：未听到「开 PR / create PR / 提 PR」→ 禁止 `gh pr create`。push 后 GitHub 打印的 “Create a pull request by visiting” **不是**人授、也不是义务。
- **写操作触发面**（与 § 确认范围一致）：「CI 红了」「修一下」≠ commit/push；修完先报告，等人授再写。
- **禁止**：`directPush=false` 且门禁阻断时在受保护分支上直接提交/推送；force push 一律禁止（`allowForcePush=false`）。
- **小型改动豁免**：单文件、纯文档/typo 级修改且不涉及受保护分支的可跳过分支直接提交，但必须在报告中说明；门禁 exit 1 时无豁免。
- **与发布流程的关系**：RELEASE 模式按项目的发布流程走 tag/push，不受本分支工作流约束（发布是受控的、需批准的写操作）。生成的 `release-manager` 子技能承载该流程。

## 治理文件保护

修改 `AGENTS.md`、`CLAUDE.md`、`docs/rules/**`、`.governance/manifest.json`、`.governance/preflight.json`、`.governance/git-policy.json`、`.governance/sync-rules.json`、`scripts/verify-governance.js`、`scripts/check-lock.js`、`scripts/check-git-policy.js`、`scripts/check-secrets.js`、`scripts/lib/secret-scan-facts.js`、`scripts/evaluators/ctrl-0001-secret-protection.js`、`scripts/check-sync.js`、`scripts/check-doc-consistency.js`、`scripts/lib/md-link-facts.js`、`scripts/evaluators/ctrl-0006-broken-links.js`、`scripts/check-doc-freshness.js`、`scripts/lib/git-facts.js`、`scripts/evaluators/ctrl-0003-doc-freshness.js`、`scripts/evaluators/ctrl-0004-translation-freshness.js`、`scripts/check-plan-sync.js`、`scripts/release-manager.js`、`.githooks/pre-commit`、`.githooks/commit-msg`、`opencode.json`、CI 配置（`.github/workflows/**`、`.gitlab-ci.yml`）需要特殊权限（清单以 `docs/rules/governance-files.md` 为准）：
说明原因 → 更新 CHANGELOG → **更新 `.governance/manifest.json` 的 `governance_version`** → 运行 `scripts/verify-governance.js`。
涉及权限/安全/删除保护/校验步骤的修改必须用户明确确认。
未经用户明确同意不得放宽权限限制或移除校验步骤。普通业务任务不得隐式触发本流程。
