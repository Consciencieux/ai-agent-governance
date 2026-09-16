---
name: ai-agent-governance
version: 2.1.1
description: >-
 Use when initializing, retrofitting, auditing, OR releasing a project's AI-agent governance framework. Init mode: one-shot bootstrap of AGENTS.md, feature registry, lifecycle, CI validation, security baseline. Audit mode: health-check an already-governed project, detect drift vs .governance/manifest.json, apply minimal fixes. Release mode: version-synced, validated releases via the generated release-manager sub-skill. Triggers on "initialize project governance", "initialize governance", "setup project for AI agents", "create AGENTS.md framework", "audit governance", "governance health check", "fix governance drift", "release", "publish version", "check skill update", "update this skill". Also loads the generated sub-skills in .governance/generated/skills for ongoing agent work. Do NOT use for normal development tasks.
---

# Governance Bootstrap

> **安装载荷（Install Payload）**：本 skill 只包含 `SKILL.md` + `references/` + `scripts/` + `LICENSE` 四个部分。安装到技能目录时**只复制这四者**；`docs/`、`tests/`、`package.json`、`.github/`、README、CONTRIBUTING、CHANGELOG、AGENTS.md 是仓库基础设施，**不属于技能载荷，不得复制**进技能目录。

在**项目创建初期**一次性建立「AI Agent 软件治理体系」，并在项目运行期**持续治理与巡检**（长期维稳）。单次运行内完成，但允许**阶段化暂停**（见执行层）。禁止省略任何一项、禁止以"应该没问题"代替验证。生成的治理体系与具体 AI 工具无关（AGENTS.md / CLAUDE.md / rules / 子技能），Claude Code、Cursor、Codex、opencode 等均可使用。

本 Skill 只负责治理体系搭建与巡检维护，不写业务代码、技术规范、测试内容。

> **薄入口：** 本文件是 always-on 路由层——身份、进入模式、优先级、权限摘要与指向 `references/` 的指针。详细政策 / 工作流 / 生命周期正文**不**作为 always-on 全文；按任务加载对应 `references/policies/*`、`references/workflows/*`、`references/capabilities/*` 与生成子技能。禁止把 lifecycle 全文或全部子技能 checklist 塞进本入口。

> **可复用原则包：** 跨项目方法论在 `references/principles/`（SKILL-INTERNAL：随包分发，INIT 不写入被治理项目）。向其他项目应用或审查治理设计时从 `references/principles/entry.md` 进入；禁止把本仓 `docs/` 树或 Phase/PLAN 剧本当 portable L1。INSTALLED 权威正文不得嵌入 skill 仓施工 ID（`PLAN-*` / `ADR-*` / `FINDING-*` / `RESEARCH-*`）；已交付的 `CTRL-*` 控制名除外。

> **能力叶路由：** **任务怎么做**薄卡在 `references/capabilities/*.md`（INIT → `docs/rules/capabilities/`）。常驻硬规则正文只在 `references/policies/`（INIT → `docs/rules/*.md`），**不**再为同一主题保留空壳能力叶。叶卡 schema：Trigger / Authority / Invoke / Verify / Non-goals。Skill 执行器以本节路由表为准；**读** = 打开正文，**跑** = 执行脚本（输出即证据）。仓库侧覆盖索引不随 tarball。Git 写处置以 [`references/policies/git.policy.md`](references/policies/git.policy.md) 为唯一权威（不链 skill 仓 `docs/` 路径）。

### 能力叶快速路由（Capability leaves）

| 任务信号 | 读 | 跑 |
| --- | --- | --- |
| 密钥 / secret scan | `references/policies/security.policy.md`（含勿回显） | `scripts/check-secrets.js` |
| 分支保护 / force / 直推 | `references/policies/git.policy.md` | `scripts/check-git-policy.js` |
| commit/push/tag 人授 | `references/policies/git.policy.md` | — |
| INIT / 生成治理 | `deterministic-init.md` | `scripts/generate-governance.js` |
| AUDIT / drift | `audit-drift.md` | （卡内命令） |
| RELEASE / 发版 | `release-orchestration.md` · `release-risk-tiering.md` · `workflows/release.md` | `scripts/release-manager.js` |
| 治理校验 | （无独立叶；看校验器输出） | `scripts/verify_governance.js` |
| manifest/state 工件 | `governance-state.md` + `init-spec.json` | — |
| 证据分层 | `references/policies/testing.policy.md` | — |
| INSTALLED 可移植性 | `references/policies/testing.policy.md` § INSTALLED 内容可移植性 | — |
| 根因修复 / 失败预算 / 同类闭包 | `references/policies/lifecycle.policy.md` § 根因修复协议与失败预算 | — |
| 变更归位 / 残留清理 | `references/policies/coding.policy.md` § 变更归位与残留清理 | — |
| 工程克制 | `references/policies/coding.policy.md` § 工程克制与机制测试 | — |
| 文档一致性 / 新鲜度 | `references/policies/lifecycle.policy.md` § Phase 4 报告层 | `check-doc-consistency.js` · `check-doc-freshness.js` |
| 计划同步 | `plan-sync.md` | `scripts/check-plan-sync.js` |
| 同步组 | `sync-groups.md` | `scripts/check-sync.js` |
| 确认凭证卫生 | `references/policies/git.policy.md` § 确认范围（凭证卫生） | — |
| SSOT / 门禁修复 | `references/policies/lifecycle.policy.md` § 根因修复 | （按失败门禁） |
| Implementation Review | `review-mechanism.md` · `subskills/subskill-review-manager.md` | — |
| 生成子技能（机制 + 子叶） | `generated-subskill-lifecycle.md` · `subskills/subskill-*.md` | （各子技能命令） |
| Discovery Ledger | `references/policies/lifecycle.policy.md` § 发现台账 | — |

完整清单以本节路由表与 `references/capabilities/` 目录为准。兑现分类唯一事实源：`references/capabilities/enforcement.v0.json`（INIT → `docs/rules/capability-enforcement.json`）。仓库侧覆盖索引不进安装载荷。

### 概念总览（Concept Map）

```
Governance Spec → Governance Engine → Runtime Contract → Coding Agents
 .governance/ SKILL.md AGENTS.md/CLAUDE.md Claude / Cursor /
 manifest.json (INIT/AUDIT/ (每个 Agent 会话 Codex / opencode
 (期望态) RELEASE 编排) 开始时读的行为契约)
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

- 本 skill 的版本记录在 SKILL.md frontmatter 的 `version` 字段；发布时与 `package.json` / CHANGELOG / `references/init-spec.json` 的 `governance_version.default` / `scripts/lib/generate/run.js` 的兜底哨兵 / Git tag 同步（本 skill 仓库自身的发布流程见其 skill-release.md；被治理项目的版本一致性规则见 `references/workflows/release.md`）。
- 用户说 "check skill update" / "update this skill" 时，Agent 执行：

 1. 读取本地 `version`
 2. 查询上游最新 release（`gh release view` 或 fetch `https://api.github.com/repos/Consciencieux/ai-agent-governance/releases/latest`）
 3. 比较并报告：本地版本 vs 最新版本、CHANGELOG 差异摘要、更新方式（当前为手动 clone；完整自动化 INSTALL → UPDATE → ROLLBACK 属独立的 ai-skill-manager 项目（本仓库不交付；策划记录见原计划归档））

- **绝不自动更新**（需用户明确同意）；更新后重新加载 skill。

## 策略层（Policy —— always-on 不变量 + 指针）

> 详细规则正文在 `references/policies/*` 与能力叶中。本节只保留每次执行必须带着的不变量；禁止把政策百科贴回本入口。

### 单一事实源

- 本 SKILL = 初始化规范源头；生成后的 **AGENTS.md** = 项目运行期规则源头；`docs/rules/` 承接细节。
- 同一规则不得多处独立维护。变更归位 / 残留清理 → `references/policies/coding.policy.md`；根因修复 / 发现台账 → `references/policies/lifecycle.policy.md`；工程克制 → `references/policies/coding.policy.md`。能力叶只作任务提示。

### Rule Priority

```
1. System / Platform Safety
2. Explicit User Request
3. Governance Integrity
4. AGENTS.md
5. docs/rules/
6. Existing Code Convention
```

普通业务任务不得隐式绕过治理；"改 AGENTS.md / 删安全检查"走治理文件保护（`references/policies/governance-files.policy.md`），不是普通覆盖。

### Agent Permission Model

| Action | Permission |
| --- | --- |
| Read | automatic |
| Create Documentation | automatic |
| Modify Code | allowed（必须验证：测试 / 静态检查 / 构建） |
| Modify 3+ Files at Once | confirmation required（见 lifecycle § 规模分级） |
| Delete Code | confirmation required |
| Dependency Change | confirmation required |
| Git Commit / Git Push | one confirmation per change set（权威：`references/policies/git.policy.md`） |

**Git 写授权（指针，非第二份正文）：** 语义唯一权威为 [`references/policies/git.policy.md`](references/policies/git.policy.md)。摘要：一次确认覆盖 add → commit → push；明确写指令或 IDE 暂存+提交+推送确认条即是该变更集人授；人授后直接执行，事后报告即可，禁止仪式化回显或第二次闸门；计划批准是意图对齐（intent alignment），不是提交授权；范围外操作各自独立确认；任务级表述不是写指令；任一步失败 → 停止并报告，不擅自重试或即兴修补；push 被拒（非快进）→ 停止并报告，不自行 pull/rebase。分支/PR 为有条件义务：无 `.governance/git-policy.json` 或门禁 exit 0 时留在当前分支，禁止为合规自行开分支；未听到「开 PR / create PR」禁止 `gh pr create`。冲突时以 `git.policy.md` 为准。

**发布序列（RELEASE）：** Release Proposal 在 Approval Gate 获批准后，该批准覆盖本次发布序列的全部写操作（见 `references/workflows/release.md`）。中途任一校验失败 → 停止并重新走 plan。

### Always-on 行为不变量

- **三态报告**：Completed（真实证据）/ Blocked（外部依赖缺失，写明原因）/ Failed。未 100% Completed 不得宣称完成。阻塞 ≠ 跳过：标 Blocked 后继续不依赖项，最终为 INCOMPLETE/BLOCKED。
- **反虚构**：Feature Registry 只登记真实代码；无业务代码时仅建模板占位（见 `references/templates/`）；证据必须是真实命令输出。
- **输入缺失**：禁止乱猜——采用项目可观测默认（锁文件 → 包管理器；未提供测试命令 → 占位并高亮）。语言政策按受众：Agent 面向文件单语；开发者文档按项目约定（细节不在本入口展开）。
- **熔断**：平台/身份不可用 → Blocked 并继续其余轨道；禁止跳过后假装成功。上下文不足时可在 Phase 1 前两步后暂停，获「继续」后再从 `.governance/state.json` 续跑。
- **工程克制**：新机制先过机制测试 → `references/policies/coding.policy.md`。
- **治理文件保护**：完整清单 → `references/policies/governance-files.policy.md`（单一事实源）。修改须说明原因 → CHANGELOG → 更新 `governance_version` → `scripts/verify_governance.js`；权限/安全/删保护/校验步骤须用户明确确认。
- **多 Agent**：`.governance/state.json` 记 identity；`scripts/check-lock.js` 持锁；不得并行改同一文件。
- **错误分类**：Recoverable（重试 1 次）/ Blocked / Fatal（停整次 INIT 并给回滚依据）——禁止一律跳过。

## 执行层（Execution —— 编排骨架，细节进叶/工作流）

> 细节权威：`references/init-spec.json` · `references/workflows/release.md` · `references/capabilities/*`。本节只保留编排顺序与不可省略的门。

### 成熟度（Phase 0 判定）

| 等级 | 策略 |
| --- | --- |
| L0 / L1 | 完整骨架（合并不覆盖） |
| L2 | 只补缺失项 |
| L3 | 默认审计：不重构不迁移；写入需强制标志 + 用户确认 |

写入 `.governance/state.json` 的 `maturity`。执行有序；每步更新 `state.json` / `validation.json`。

### AUDIT

进入 AUDIT 时替代 Phase 1 构建（Phase 0 仍跑）。骨架：读 manifest → `scripts/verify_governance.js` `--json` → **引用闭包**（规则所引路径须在本项目可解析）→ 健康报告 → 最小补丁（不扩大范围；同类闭包 / 控制面追查见 `lifecycle.policy.md` § 根因修复 + 叶 `audit-drift.md`）。版本漂移只报告，不擅自升降；升级走 MIGRATE。日常巡检由生成的 `drift-check` 子技能承担。

### MIGRATE

仅当用户明确要求升级时：先跑可发现入口 `node scripts/migrate-governance.js`（对比 `.governance/manifest.json` 的 `governance_version` 与期望版本；exit 0 已对齐 / 2 建议升级 / 1 错误；**不**自动改树）→ 列清单（校验器缺失项 + CHANGELOG）→ 用户确认 → 补齐工件并更新 `governance_version` → `verify_governance.js` 退出 0。失败保持原版本，禁止半迁移。

### RELEASE

权威：`references/workflows/release.md` + 叶 `release-orchestration.md`。骨架：前置检查全过 → Proposal（HITL）→ 版本同步/归档 → release commit → tag → push / GitHub Release → 收尾。写操作须经 Approval Gate；细节不在本入口复述。

### Phase 0：环境检测

写任何文件前：目录 / 文档 / 语言 / 包管理器 / 构建 / 测试 / lint / Git / CI / 既有 AI 指南 → 判定成熟度 → Inspection Report（JSON）→ 如有 `state.json` 则断点续跑 → 写入前记 `preflight.json`。不覆盖重要文件；不用假设模板。

### Phase 1：构建（生成器 + Agent 门）

**写文件交给生成器**；产物清单唯一权威 = `references/init-spec.json`（不复述工件表）。叶：`deterministic-init.md`。

```bash
node scripts/generate-governance.js --target <项目根> --phase C \
 --project-name <名称> --maturity <等级> --doc-root <文档根> \
 --stack <栈> --ci-platform <平台>
```

- 幂等跳过已存在文件；L3 默认只报告；`--dry-run` / `--json`；未实现生成器 exit 1（除非显式允许 stub）
- Agent 兜底：工具入口适配、README 合并、Feature/ARCHITECTURE 真实内容、CI 降级占位、L2/L3 合并（合并不覆盖）——反虚构与确认门仍适用
- 确认门：依赖变更 · Git 身份 · CI 首次推送 · L3 写入 · 跨 3+ 文件额外改动

### 状态工件（指针）

期望态 / 当前态 / 观测态 / 预检：`.governance/{manifest,state,validation,preflight}.json`（+ 运行时 `drift-report` / `release-proposal`，非 required）。字段与跟踪策略见叶 `governance-state.md` 与 `references/init-spec.json`。`facet` ∈ lifecycle 六阶段 + `completed|blocked|failed`（兼容窗口可读遗留字段 `phase`）；断点续跑不得跳步或重跑已完成项。

### Phase 2：校验

`scripts/verify_governance.js` → 真实输出写入 `validation.json` 与报告。校验项以校验器输出为准（无独立能力叶）。

### Phase 3：交付报告

完成度核对表（✅/⚠️/❌ + 证据）；报告前校验器退出码须为 0。

## Definition of Done

- 全部治理项 ✅，或 ⚠️ Blocked 且原因明确
- `scripts/verify_governance.js` 退出码 0
- `validation.json` 已更新
- 报告包含真实证据，无虚构
