---
name: ai-agent-governance
version: 0.10.1
description: >-
  Use when initializing, retrofitting, auditing, OR releasing a project's AI-agent governance framework. Init mode: one-shot bootstrap of AGENTS.md, feature registry, lifecycle, CI validation, security baseline. Audit mode: health-check an already-governed project, detect drift vs .governance/manifest.json, apply minimal fixes. Release mode: version-synced, validated releases via the generated release-manager sub-skill. Triggers on "initialize governance", "setup project for AI agents", "create AGENTS.md framework", "audit governance", "governance health check", "fix governance drift", "release", "publish version", "check skill update", "update this skill". Also loads the generated sub-skills in .governance/generated/skills for ongoing agent work. Do NOT use for normal development tasks.
---

# Governance Bootstrap

> **安装载荷（Install Payload）**：本 skill 只包含 `SKILL.md` + `references/` + `scripts/` + `LICENSE` 四个部分。安装到技能目录时**只复制这四者**；`docs/`、`tests/`、`package.json`、`.github/`、README、CONTRIBUTING、CHANGELOG、AGENTS.md 是仓库基础设施，**不属于技能载荷，不得复制**进技能目录。

在**项目创建初期**一次性建立「AI Agent 软件治理体系」，并在项目运行期**持续治理与巡检**（长期维稳）。单次运行内完成，但允许**阶段化暂停**（见执行层）。禁止省略任何一项、禁止以"应该没问题"代替验证。生成的治理体系与具体 AI 工具无关（AGENTS.md / CLAUDE.md / rules / 子技能），Claude Code、Cursor、Codex、opencode 等均可使用。

本 Skill 只负责治理体系搭建与巡检维护，不写业务代码、技术规范、测试内容。

### 概念总览（Concept Map）

```
Governance Spec  →  Governance Engine  →  Runtime Contract  →  Coding Agents
  .governance/       SKILL.md             AGENTS.md/CLAUDE.md      Claude / Cursor /
  manifest.json      (INIT/AUDIT/         (每个 Agent 会话        Codex / opencode
  (期望态)            RELEASE 编排)         开始时读的行为契约)
```

- **期望态（Spec）** —— `.governance/manifest.json` 声明全部治理工件与版本，是"治理即代码"的单一索引。
- **引擎（Engine）** —— 本 SKILL 按 INIT / AUDIT / RELEASE 模式生成并维护这套体系。
- **运行时契约（Runtime Contract）** —— 生成的 AGENTS.md 与各工具适配器是每个 Agent 会话开始时读取的行为规则。


## 进入模式（Entry Mode）

| 模式 | 触发条件 | 行为 |
| --- | --- | --- |
| INIT（初始化） | 新项目 / 无 `.governance/manifest.json` / 成熟度 L0-L1 | 完整引导（见下方执行层） |
| AUDIT（巡检） | 已有 `.governance/manifest.json` / 成熟度 L2-L3 / 用户说"巡检/健康检查/治理偏差" | 只读巡检 + 最小补丁修复（见下方 Audit 流程） |
| RELEASE（发布） | 用户说"发布 / release / publish"、或版本推进需求 | 前置检查 → 版本同步 → 校验 → tag → push → GitHub Release（见下方 Release 流程） |

判定优先级：**用户明确指令 > `.governance/manifest.json` 存在性 > 成熟度**。INIT / AUDIT / RELEASE 都先走 Phase 0 环境检测。AUDIT 不重建、不重构、不迁移，只输出差距报告与最小补丁；RELEASE 由生成的 `release-manager` 子技能执行（见 `references/workflows/release.md`）；涉及治理文件改动走「治理文件保护」流程。

> 定位：INIT 完成的项目进入**长期运行期**，日常任务由生成的 `.governance/generated/skills/` 子技能接管（含 `drift-check` 巡检）；本 skill 可随时以 AUDIT 模式回来做健康检查。

### 版本与更新（Version & Update）

- 本 skill 的版本记录在 SKILL.md frontmatter 的 `version` 字段（发布时与 package.json / CHANGELOG / tag 同步，见 `references/workflows/release.md` 版本一致性规则）。
- 用户说 "check skill update" / "update this skill" 时，Agent 执行：

  1. 读取本地 `version`
  2. 查询上游最新 release（`gh release view` 或 fetch `https://api.github.com/repos/Consciencieux/ai-agent-governance/releases/latest`）
  3. 比较并报告：本地版本 vs 最新版本、CHANGELOG 差异摘要、更新方式（当前为手动 clone；完整自动化 INSTALL → UPDATE → ROLLBACK 由 ai-skill-manager 提供，见 `docs/zh-CN/plans/skill-lifecycle-management.md`）

- **绝不自动更新**（需用户明确同意）；更新后重新加载 skill。

## 策略层（Policy —— 每次执行都必须遵守）

### 单一事实源（Single Source of Truth）

- 本 SKILL 是**初始化规范唯一源头**（生成规则）
- 生成后的 **AGENTS.md 是项目运行期规则唯一源头**
- `docs/rules/` 承接细节，AGENTS.md 按章节 `@` 引用
- 执行与校验由 `scripts/verify-governance.js` 与 `.governance/generated/skills/` 负责
- **同一规则不得在多处独立维护**；需修改时从源头改，再同步生成物
- **变更归位与残留清理**的完整规则位于 `references/policies/lifecycle.policy.md`，代码修改/删除的补充约束位于 `references/policies/coding.policy.md`；本文件只保留入口指针，不复制规则正文

### Rule Priority（规则冲突裁决顺序）

```
1. System / Platform Safety（系统/平台安全）
2. Explicit User Request（用户明确要求）
3. Governance Integrity（治理完整性）
4. AGENTS.md
5. docs/rules/
6. Existing Code Convention（既有代码约定）
```

约束：用户可通过**明确指令**要求修改治理规则（走「治理文件保护」流程），但不能通过**普通业务任务**隐式绕过治理规则；"帮我改 AGENTS.md / 删掉安全检查"视为修改治理体系，触发保护流程，而非普通指令直接覆盖。

### Agent Permission Model（权限矩阵）

| 操作 | 权限 |
| --- | --- |
| Read | automatic |
| Create Documentation | automatic |
| Modify Code | allowed，但必须验证（测试/静态检查/构建） |
| Delete Code | confirmation required |
| Dependency Change | confirmation required |
| Git Commit / Git Push | 一次确认 per 变更集（见下方确认范围） |

**确认范围（一次确认 per 变更集）**：提交前回显完整 git 命令序列——暂存哪些文件、每个 commit 的消息（类型含在消息前缀）、目标 remote/branch——用户确认**一次**，覆盖 add → commit → push。与任务规模无关：小改动也不例外，计划批准不是提交授权（意图对齐），用户说 "push" 等写指令只触发回显，**指令本身不是确认**。范围外操作（tag、reset、rebase、revert、merge、force push、clean、rm、restore、stash、pull、携带未提交改动切换分支、已推送提交的 amend）需各自独立确认。任务级表述（"完成任务"/"发布吧"）不是写指令；歧义表述（"提交一下"）先问。

**发布序列（RELEASE）**：Release Proposal 在 Approval Gate 获批准后，该批准覆盖本次发布序列的全部写操作（版本同步 → 归档 → release commit → tag → push 分支 → push tag → GitHub Release → 资产上传），不再逐步追问。前提：完整 Proposal 已展示且获明确批准、工作区与 HEAD 仍一致。中途任一校验失败 → 停止并重新走 plan。

**通用硬约束**：回显即完整命令序列（执行不得偏离）；任一步失败 → 停止并报告，不得改用其他方式重试、不得即兴修补；push 被拒（non-fast-forward）→ 停止并报告，不得擅自 pull/rebase。

### 状态协议（最终报告必须支持三态）

- ✅ Completed（有真实证据）
- ⚠️ Blocked（外部依赖缺失，如仓库未建、CI 无法触发 —— 写明原因）
- ❌ Failed（存在失败项）

未 100% ✅ 不得宣布"完成"。

**外部阻塞 ≠ 跳过**。遇到阻塞：① 标记 ⚠️ Blocked + 原因 → ② 继续执行所有**不依赖该阻塞项**的任务 → ③ 不得伪造完成 → ④ 最终状态为 **INCOMPLETE/BLOCKED（而非 COMPLETED）**，在报告顶部显式声明。这样"单次执行"仍成立。

### 反虚构规则

- **Feature Registry 必须根据实际代码状态生成**：已存在功能 → 创建真实 Feature 文档；新项目无业务代码 → 按「Feature 占位策略」建占位，**绝不虚构功能**（不写 authentication.md 除非真有认证）。
- **禁止删除已有代码/文档**：删除前必须说明原因、当前作用、搜索全部引用、确认 Feature Registry 影响、提供迁移方案。动态调用 / 插件机制 / 配置驱动代码必须特别谨慎。
- 所有验证证据必须是真实命令输出，不是推断。

### Feature 占位策略（无业务代码时）

- 若 `src/` / `app/` 等目录下无任何业务代码：`docs/features/` 下仅创建 `_TEMPLATE.md`（复制 `references/templates/feature-doc.template.md`）与 `README.md`（说明"待业务模块确定后按模板逐个登记"）。
- 若已有代码（如存在 `auth`、`pdf` 目录）：才逆推创建 `authentication.md` 等具体文档，且 `Implementation` 路径必须与 `find` / `rg` 查到的真实路径一致，**严禁虚构路径**。
- 任何真实文档中暂缺的字段一律标 `[PLACEHOLDER]` + `# TODO: 业务确定后填充`。

### 项目默认值约定（输入缺失时采用，禁止乱猜）

| 项 | 默认 | 备注 |
| --- | --- | --- |
| 文档语言 | 中文 | 项目约定另指时跟随；AGENTS.md 保持英文（工具自动加载）；README 默认拆分（根 `README.md` 英文主页 + `docs/README.zh-CN.md` 简体翻译，见 Phase 1 第 8 步），语言变体下沉 docs/，不做单文件合并、不堆根目录 |
| 提交信息语言 | 英文（Conventional Commits） | `feat(auth): add login endpoint` |
| 包管理器 | `pnpm-lock.yaml` → pnpm，否则 npm；Python 看 `uv.lock` → uv，否则 pip | 以检测到的锁文件为准 |
| 测试命令 | 未提供 → 占位 `echo "TEST_PLACEHOLDER"` | 在 Inspection Report 中高亮提醒用户 |
| 测试/静态检查脚本缺失 | CI 中该步骤仅输出警告占位 | 见 CI 降级策略 |

### 语言政策（按受众）

- **Agent 面向文件单语** —— AGENTS.md（英文，工具自动加载）、docs/rules/**、`.governance/**`、子技能正文：绝不携带第二语言段落。
- **开发者面向文件按项目约定多语言** —— README 与 docs/ 的语言布局跟随项目约定；默认拆分式：**根目录只保留英文主页（`README.md`），翻译版下沉 docs/**（`docs/README.zh-CN.md` 等），不做单文件多语言合并、不把语言变体堆在根目录。多语言文档树（`docs/<lang>/`）仅当项目明确约定时生成，默认不做。改任何语言版本必须同步其余语言版本（**稳定文档同一提交内同步；活跃草稿可延迟翻译至内容稳定，但 push/发布前必须补齐**）。
- **历史记录不翻译** —— 归档的计划（`docs/plans/archive/`）与 ADR 决策史保持项目约定语言，绝不翻译；它们记录的是已发生的决策与已完成的工作，翻译零收益。
- **多语言项目可选术语表** —— 仅当项目采用多语言文档时生成 `docs/glossary.md`（术语对照，新术语先入表再入文）；单语项目不生成。

### 熔断机制（错误恢复）

- **平台不可用**：CI 无法创建/触发（Token 未配置、Actions 未开启、仓库未推送）→ 该项标 ⚠️ Blocked 并写明原因，**停止后续 CI 步骤，但其余文档类任务必须全部完成**。
- **Git 身份未配置**：首次提交前检查 `user.name`/`user.email`，未配置 → ⚠️ Blocked，提示用户配置，不擅自设置。
- **禁止"跳过后假装成功"**：任何被熔断的项必须出现在报告的 Blocked 栏，不得从核对表消失。

### 上下文熔断（Two-Pass）

若上下文可能不足：**Phase 1 第 1–2 步（docs/rules/ + AGENTS.md）完成后可暂停**，输出"阶段一完成，请回复『继续』以生成剩余文件"。未获"继续"指令不得省略任何项；获得指令后从 `.governance/state.json` 断点续跑。

### 治理文件保护（Governance Protection）

以下文件是**治理体系本身**，修改需要特殊权限（防止 Agent 自我解除限制）。**完整清单见 `references/policies/governance-files.policy.md`（单一事实源）**，此处为摘要：

```
AGENTS.md / CLAUDE.md
docs/rules/**              （规则文件）
.governance/manifest.json       （治理工件清单）
.governance/preflight.json      （回滚快照）
.governance/git-policy.json     （Git 工作流策略）
scripts/verify-governance.js
scripts/check-lock.js
scripts/check-git-policy.js
scripts/check-secrets.js
scripts/check-sync.js
.githooks/pre-commit
.githooks/commit-msg
opencode.json / .github/workflows/**
```

修改这些文件必须：说明原因 → 更新 CHANGELOG → **更新 `.governance/manifest.json` 的 `governance_version`** → 运行 `scripts/verify-governance.js`。涉及**权限/安全/删除保护/校验步骤**的修改必须用户**明确确认**。未经用户明确同意不得删除权限限制、不得放宽 Git Policy、不得移除校验步骤。普通业务任务不得隐式触发本流程（见 Rule Priority）。此规则本身写入生成的 AGENTS.md 与 `docs/rules/git-policy.md`（内嵌同一份清单）。

### 多 Agent 协作（Agent Identity）

多 Agent 同时工作时（Claude / Codex / Cursor / opencode）：
- 每次任务在 `.governance/state.json` 记录 `agent_id` + `task_id` + 起始时间戳。
- 开始任务前运行 `scripts/check-lock.js`：退出码 1 = 其他 Agent 持锁（`locked` 非 null），等待或协商，**不得并行修改同一文件**。
- 完成时释放锁（`locked: null`）并写入完成清单。

### 错误分类（Error Classification）

外部命令失败时按此分类处理，禁止一律跳过：

| 分类 | 示例 | 处理 |
| --- | --- | --- |
| Recoverable | 网络失败、依赖下载失败 | 重试 1 次，仍失败则标 ⚠️ Blocked 并继续其余项 |
| Blocked | 权限不足、缺 token、Git 身份未配置 | 标 ⚠️ Blocked + 原因，停相关轨道，其余任务继续 |
| Fatal | 文件损坏、环境不可识别 | 停止整个初始化，输出 .governance/preflight.json 与回滚建议 |

## 执行层（Execution）

### 初始化模式判断（Project Maturity Detection）

Phase 0 检测时同时判定项目成熟度，按等级调整初始化策略：

| 等级 | 判定 | 策略 |
| --- | --- | --- |
| Level 0 空仓库 | 只有 README/无源码 | 创建完整治理骨架（默认结构） |
| Level 1 原型 | 有少量源码，无测试/CI/文档体系 | 完整骨架 + 接管现有文件（合并不覆盖） |
| Level 2 活跃开发 | 有源码 + 测试 + 部分 CI/文档 | 增量补齐缺口，**只创建缺失项**，不迁移既有结构 |
| Level 3 生产项目 | 大量文件 + 已有规范 | **审计模式**：不重构、不覆盖、不迁移，只输出差距报告与最小补丁建议，重大改动需用户逐项确认 |

模式写入 `.governance/state.json`（字段 `maturity`），并决定后文每步的"创建 vs 合并 vs 跳过"。

执行顺序有依赖关系，必须按序。每次 Agent 完成任务时更新 `.governance/state.json` 与 `.governance/validation.json`。

### Audit 流程（长期巡检模式）

仅当进入模式判定为 AUDIT 时执行，替代下方的 Phase 1 构建流程（Phase 0 环境检测仍执行）：

1. 读取 `.governance/manifest.json`，确认 `governance_version` 与声明工件
2. 运行 `scripts/verify-governance.js --json`，比对声明与实际 → 得到偏差清单（缺失工件、版本漂移）
3. 输出**治理健康报告**：通过项 / 缺失项 / 版本漂移，写入 `.governance/validation.json` 与 `.governance/drift-report.json`
4. **最小补丁**：仅修复缺失项，不重建、不重构、不迁移结构；修复治理文件走「治理文件保护」流程（需用户确认）
5. 若 `governance_version` 与基线不一致 → 报告版本漂移，说明差异，**不擅自降级/升级**；用户要求升级时走「版本迁移（MIGRATE）」流程。

**长期运行期**：INIT 完成后，日常任务的巡检由生成的 `.governance/generated/skills/drift-check` 子技能承担；AUDIT 模式用于定期人工健康检查。

### 版本迁移（MIGRATE）

被治理项目的 `governance_version` 落后于当前 skill 版本时，用户明确要求升级才执行（**绝不自动升级/降级**）：

1. **生成迁移清单**：
   - 运行 `scripts/verify-governance.js --json` → 缺失工件清单（新版本新增的 required artifact 会在此列出）
   - 对照目标版本 CHANGELOG 的 Added / Changed 条目 → 规则与模板变更清单（每个版本的 Changed 条目就是迁移依据）
2. **展示给用户确认**：新增文件 / 变更文件 / 规则变化 / 行为变化（如新门禁：check-git-policy、内容校验），逐项列出
3. **执行迁移（用户确认后）**：
   - 补齐缺失工件：复制新脚本（如 `scripts/check-git-policy.js`）、生成新模板（如 `.governance/git-policy.json`）、更新规则文件（`docs/rules/*`）
   - 更新 `.governance/manifest.json` 的 `governance_version` → 目标版本
   - CHANGELOG 记录迁移（`Changed`）
4. **验证**：`scripts/verify-governance.js` 退出码必须为 0
5. **安全规则**：迁移是写操作（需用户确认）；跨多个版本迁移时必须覆盖中间版本的工件变化；迁移失败 → 保持原版本，报告 ⚠️/❌，不得留下半迁移状态

### Release 流程（版本发布模式）

仅当进入模式判定为 RELEASE 时执行（Phase 0 环境检测仍执行）。发布由生成的 `release-manager` 子技能承担，详细规范见 `references/workflows/release.md`（单一事实源）：

1. **前置检查**（release_requirements，全部通过才允许发布）：工作区干净 / 测试通过 / CHANGELOG 已更新 / 版本一致（package.json · CHANGELOG · `manifest.governance_version` · tag）/ 目标 tag 不存在 / Proposal 已批准 / 校验器通过。任一失败 → 输出 ⚠️/❌ 清单并停止。
2. **分析 + Release Proposal（Human-in-the-Loop）**：分析变更（`git log`/`git diff`、API/用户可见变化），运行 `scripts/release-manager.js plan --json ...`（只读）生成 Proposal（当前版本 / 推荐版本 / 类型 / 理由 / Release Notes），展示给开发者并**等待明确确认**；写操作（tag/push/gh release）在批准前一律禁止。不确定性（Potential Breaking/Feature）→ 暂停请求确认；0.x 版本不自动升 1.0.0（详见 `references/workflows/release.md`）。
3. **版本同步 + 归档计划**：`package.json` → CHANGELOG（`[Unreleased]` 移入 `[X.Y.Z]`）→ `.governance/manifest.json` 的 `governance_version` 与 `release` 字段；完成里程碑聚合写入 `docs/plans/archive/vX.Y.Z.md`、已完成 `TASK_<name>.md` 原样移入 `docs/plans/archive/`（保留原文不删除）。
4. **提交 release commit**：`git add`（版本同步与归档文件）→ `git commit -m "release: vX.Y.Z - <summary>"`（版本与归档同一提交）→ 校验（`verify-governance.js` 退出码 0）。
5. **打 tag**：更新 Proposal 的 `headSha` 为新 HEAD → `scripts/release-manager.js execute --proposal .governance/release-proposal.json --yes`（annotated tag 指向 release commit；重新验证工作区干净 + HEAD 一致）。
6. **推送与 GitHub Release**：`git push origin main` → `git push origin vX.Y.Z` → `gh release create vX.Y.Z --title "vX.Y.Z" --notes "<Release Notes>"`（写操作均需用户确认；gh 未装/未登录 → ⚠️ Blocked 并提示）。
7. **收尾**：`manifest.release.validated` 置 `true`，重跑校验并写入 `validation.json`。

### Phase 0：环境检测（Repository Inspection）

不创建任何文件之前，先分析现状。检查：目录结构、已有文档、语言、包管理器、构建工具、测试框架、静态检查工具、Git 状态、已有 CI、已有 AI 指南文件。同时判定**项目成熟度**（见初始化模式判断）。

约束：不覆盖重要文件；目标文件已存在则先分析再合并/更新；不删除已有配置；识别缺失自动化能力；不用假设模板。

输出 Repository Inspection Report（JSON）：

```json
{
  "projectType": "",
  "language": "",
  "packageManager": "",
  "buildTool": "",
  "testFramework": "",
  "linter": "",
  "gitRepo": true,
  "maturity": "LEVEL_0_EMPTY",
  "existingDocRoot": "docs",
  "ci": "",
  "existingDocs": [],
  "missingAutomation": [],
  "plannedChanges": []
}
```

若 `.governance/state.json` 已存在（上次运行留下），先读取并**从断点续跑**，保持幂等，不重复已完成的项。

开始写入前先记录 `.governance/preflight.json`（Git 状态摘要 + 已存在文件清单 + 时间戳），作为回滚依据（见 .governance/ 机器可读状态）。

### Phase 1：治理体系构建（生成器执行 + Agent 判断与确认门）

**写文件的活全部交给生成器**，Agent 只负责判断、确认与人工兜底。产物清单与生成规则的单一事实源是 `references/init-spec.json`（**本节不复述工件列表**，避免双源漂移）；人类可读的产物一览见 `docs/<lang>/bootstrap-output.md`。

**1. Agent 判断（Phase 0 的检测结论 → 生成器输入）**

| 输入 | 判断依据 |
| --- | --- |
| `--project-name` | 仓库名/package 名 |
| `--maturity` | Project Maturity Detection 结论（L0/L1/L2/L3） |
| `--doc-root` | 既有文档根（`docs`、`documentation`、monorepo 布局等）——**适配现有体系，禁止创建第二个平行文档中心** |
| `--stack` | 检测到的主栈（node/python/rust/go/java/cpp/docs-only），决定 CI 模板 |
| `--ci-platform` | 检测到的 CI 平台（github/gitlab/none） |

**2. 运行生成器**

```bash
node scripts/generate-governance.js --target <项目根> --phase C \
  --project-name <名称> --maturity <等级> --doc-root <文档根> \
  --stack <栈> --ci-platform <平台>
```

- 幂等：已存在文件**跳过不覆盖**，可反复运行
- 成熟度策略由生成器执行：L0/L1 全量生成；L2 只补缺失项；**L3 默认审计模式（只报告不写）**，需 `--force-l3` 才写入
- `--dry-run` 先看清单；`--json` 输出机器可读结果
- 任何未实现的生成器都会 **exit 1**（不静默跳过），除非显式 `--allow-stub`

**3. Agent 兜底（生成器不做判断的部分）**

- **CLAUDE.md 与各工具入口**：按检测到的工具生成（`.cursor/rules/*.mdc`、`.github/copilot-instructions.md`、`opencode.json` 的 `skills.paths`）；`.cursorrules` 已弃用，不再生成
- **README 语言布局**：按语言政策决定是否生成 `docs/README.zh-CN.md` 等变体；**已有 README 只补文档索引与徽章，合并不覆盖**
- **Feature Registry 内容**：生成器只建目录与占位，**真实功能条目由 Agent 按登记判定补写**（反虚构：不得登记不存在的功能）
- **ARCHITECTURE.md 实质内容**：生成器给骨架，Agent 必须填真实架构与组件登记（校验器会拒绝未填的模板骨架）
- **CI 管线降级**：项目缺失的脚本对应步骤保留 `echo "No <tool> configured yet"`，**不得强行编写无法执行的命令**
- **L2/L3 既有内容合并**：生成器跳过已存在文件后，Agent 负责把治理要求合并进既有文件（合并不覆盖）

**4. 确认门（必须用户明确同意）**

- 依赖变更 · Git 身份未配置 · CI 首次推送 · L3 项目写入（`--force-l3`）· 跨 3 个以上文件的额外改动

### .governance/ 机器可读状态

- `manifest.json` —— **唯一索引 / 期望态**：声明全部治理工件（AGENTS.md、CHANGELOG.md、ARCHITECTURE、features、plans、rules、.gitignore、.env.example、CI、scripts/verify-governance.js、.governance/* 等），含**实际路径**、文件系统类型 `kind`（file/dir）与语义类型 `type`（policy/documentation/script/ci/state）+ 版本。`schema_version` 是**数据格式版本**，`governance_version` 是**治理框架版本**，二者分离。**校验脚本以它声明的路径为准**，结构适配场景下改动此处即可；`artifacts` 必须覆盖全部治理工件（不限于文档），否则校验会漏项：

```json
{
  "schema_version": "1.0",
  "governance_version": "0.10.1",
  "release": { "version": "0.10.1", "tag": "v0.10.1", "validated": false },
  "doc_root": "docs",
  "artifacts": [
    { "name": "AGENTS.md", "path": "AGENTS.md", "kind": "file", "type": "policy" },
    { "name": "Feature registry", "path": "docs/features", "kind": "dir", "type": "documentation" },
    { "name": "CI workflow", "path": ".github/workflows", "kind": "dir", "type": "ci" }
  ]
}
```

> `release`（可选）把发布本身纳入治理对象：`version` 与 `governance_version` 一致，`tag` 为 `v<version>`，`validated` 发布通过校验后置 `true`（见 `references/workflows/release.md`）。

> 分层语义：`manifest.json` = 期望态（desired state），`state.json` = 当前态（current state），`validation.json` = 观测态（observed state）。
> `type` 是治理语义元数据，用于分类与报告，**不参与文件系统校验**（文件系统判断只看 `kind`）。

**Git 跟踪策略**：`manifest.json`、`state.json`、`generated/` 必须提交（治理即代码）；`validation.json`、`drift-report.json`、`release-proposal.json` 为临时运行输出，忽略（见 `.gitignore` 与 `references/policies/governance-files.policy.md`）。

- `state.json` —— 当前任务/成熟度/Agent 身份/阶段（示例）：

```json
{
  "maturity": "LEVEL_0_EMPTY",
  "phase": "implement",
  "agent_id": "",
  "task_id": "",
  "locked": null,
  "completed": ["docs", "agents", "rules"],
  "blocked": ["github_permission"]
}
```

- `validation.json` —— 最近一次治理校验结果（逐项 ✅/❌ + 时间戳）。**运行时输出**：由 AUDIT/校验产生，被 git 忽略、**不作为 required artifact**（fresh-checkout CI 不依赖它）
- `release-proposal.json` —— 最近一次 Release Proposal（审批证据）。**运行时输出**：由 RELEASE 的 Approval Gate 产生，被 git 忽略、**不作为 required artifact**
- `preflight.json` —— **初始化前快照**（回滚依据）：`git status` 摘要、已存在文件清单、时间戳。失败/Fatal 时输出 "Rollback recommended" 并给出如何恢复（如 `git checkout` 已改动文件、删除本次新建清单）。

**状态机**：`state.json` 的 `phase` 取值 = 生命周期六阶段 `understand / plan / implement / validate / synchronize / report` + 终止态 `completed / blocked / failed`。任意阶段异常 → `blocked`/`failed`；崩溃/中断后恢复时先读 `phase` 确定断点，**不得重跑已完成项**，也不得跳步。

### Phase 2：校验（Governance Validator）

运行项目内的 `scripts/verify-governance.js`，把真实输出记录进 `validation.json` 与最终报告。

> 校验项集合由 `verify-governance.js` 定义，可能随 schema 版本演进，**以校验器实际输出为准**。`validation.json` / `drift-report.json` 是**运行时输出，不作为 required artifact**（fresh-checkout CI 必须无它们也通过）。当前默认项：

```
AGENTS.md / CHANGELOG.md / CHANGELOG format / docs/ARCHITECTURE.md / docs/features/ / docs/plans/ /
docs/rules/ / .gitignore / .env.example / CI workflow / scripts/verify-governance.js / scripts/check-lock.js /
scripts/check-git-policy.js / scripts/check-secrets.js / scripts/check-sync.js / .governance/ 目录 / manifest.json / state.json /
preflight.json / git-policy.json / governance_version
```

### Phase 3：交付报告

输出**完成度核对表**：每项 `✅/⚠️/❌` + 证据命令 + 输出摘录；列出新建文件清单；无法完成的项明确原因。报告前先跑 `verify-governance.js` 确认退出码为 0。

## Definition of Done

- 全部治理项 ✅，或 ⚠️ Blocked 且原因明确
- `scripts/verify-governance.js` 退出码 0
- `validation.json` 已更新
- 报告包含真实证据，无虚构
