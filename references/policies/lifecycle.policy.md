# Agent Operating Lifecycle（规则详解）

AGENTS.md 只保留生命周期摘要，本文件是完整执行规范。所有 AI Agent 执行任何开发任务时必须遵循。

## 规模分级（按规则判定，不由 AI 自判）

| 规模 | 判定 | 流程 |
| --- | --- | --- |
| **小** | 单文件改动、<50 行、无公共接口/API/数据结构变更、纯文档/typo/格式 | 简化路径：Understand → Implement → Validate → Report（跳过 Plan 与 Synchronize；机械检查兜底） |
| **中** | 多文件、涉及功能/模块/规则变更，但不破坏公共接口 | 完整六阶段 + TASK 计划 |
| **大** | 公共接口/API/数据结构变更、跨模块重构、架构变化 | 完整六阶段 + TASK 计划 + 审查（review-manager，见 plans/review-manager.md） |

**规模分级只决定"要不要写 TASK 计划文档"，不决定"要不要给用户确认提交"**——提交前必须回显完整 git 命令序列（暂存哪些文件、每个 commit 的消息、目标 remote/branch），用户确认一次，覆盖 add → commit → push，对所有规模一视同仁（见 Git Write Policy 一次确认 per 变更集）。判定顺序：先看"是否破坏公共接口/API/数据结构"→ 再看"是否跨模块/涉及功能"→ 最后看改动量。边界模糊时**取更高级别**（宁完整不省略）。

## Phase 1 — Understand（理解）

开始前必须读取（**未读完不得进入 Phase 2/Implement，不得声称已理解架构**）：
- AGENTS.md
- docs/ARCHITECTURE.md
- docs/features/（列目录发现全部功能）
- 最近 CHANGELOG.md

确认：当前系统结构、已存在功能、相关约束、相关 Feature 文档的 Modification Rules。

**硬性要求**：以上文件未实际读完（读其内容，而非仅列路径），禁止开始任何修改。理解不是"感觉懂了"，是能说清"现在系统长什么样、我要动的部分在哪、碰了会影响谁"。

## Phase 2 — Plan（计划）

**中/大型**修改必须先创建 `docs/plans/TASK_<name>.md`，必须包含：
- **Status**：Active / Completed（创建时为 Active）
- **Task Purpose**：任务目的
- **Current Problem**：当前问题
- **Proposed Solution**：提议方案
- **Affected Files**：受影响文件（**基于引用搜索**——改公开接口/模块前先 `rg` 搜引用，搜到的引用文件必须入列；禁止凭印象列影响面）
- **Risks**：风险
- **Validation Method**：验证方式

**小型**改动（见"规模分级"）跳过本阶段，直接进入 Implement；报告中一句话说明规模判定即可，无需逐条理由。

**用户确认门**：中/大型的 TASK 计划创建后，**必须展示给用户确认**（展示 Proposed Solution、Affected Files、Risks、Validation Method）。这是**意图对齐**，不是提交授权——改什么、怎么改对齐了，提交前仍须走一次确认（见 Git Write Policy 一次确认 per 变更集）。跨 3 个以上文件的改动，即使规模判定为"中"，同样必须先经用户确认。未获确认不得开始实现（除非用户明确豁免）。

## Phase 3 — Implement（实现）

- 遵循架构约束（docs/ARCHITECTURE.md）
- 不破坏已有功能
- 不随意改变目录结构
- 保持向后兼容
- 新增代码必须同步登记（见 New Code Registration）
- **引用搜索（改前必做）** —— 修改任何公开接口/函数/模块/文件**之前**（不仅是删除），先搜索谁引用它（`rg "<名称>"` 全仓 + 配置/动态调用/插件机制），引用到的文件**自动加入** Affected Files 清单；搜索不到的引用（如配置文件里按名字加载的模块）在报告中说明。影响面是**搜出来的，不是想出来的**。

### 变更归位与残留清理（Change Hygiene）

本规则适用于删除、重命名、移动、替换、弃用、拆分、合并、关闭 feature flag、修改 API/CLI/协议/数据格式，以及模板、生成物、翻译和治理规则变更。判断目标不是“旧词全仓命中为零”，而是当前执行表面没有未解释、未批准、会误导 Agent 的旧事实。

| 表面 | 内容 | 旧内容处理 |
| --- | --- | --- |
| 当前规范/实现层 | 当前 `AGENTS.md`、`docs/rules/**`、当前文档、代码、配置、schema、CI、测试和 Agent 读取的生成物 | 默认清除旧事实；只保留仍工作的兼容行为或必要迁移指针 |
| 兼容/过渡层 | deprecation/migration 文档、兼容别名、adapter、feature flag 过渡逻辑和兼容测试 | 允许保留，但必须有用途、范围、责任人、退出版本/日期和测试 |
| 历史层 | `CHANGELOG.md`、ADR、`docs/archive/` 和已完成计划 | 允许记录旧事实、原因和决策；不作为当前执行规则 |
| 计划/审查层 | 未完成计划、审查报告和任务报告 | 允许描述问题和验收，不得被误读为运行期规则 |

中/大型变更必须维护 Change Hygiene Ledger；小型单文件改动在最终报告中使用精简版。每个旧概念、路径、配置键、命令、schema 字段、feature 名或接口必须记录：`ID`、变更类型（`remove / rename / replace / deprecate / retain / migrate`）、旧项/新项、影响表面、处理决定、允许旧引用及退出条件、证据。没有决定、责任人、退出条件或证据的条目为 `unresolved`，不能宣称完成。

变更前使用 `rg` 搜索代码、配置、文档、测试、CI、模板、生成物和三语文档；另外检查动态字符串、插件注册、manifest、环境变量、脚本参数、链接和锚点。修改顺序为：**单一事实源 → 引用 → 投影**。当前层只陈述现行行为；迁移说明、兼容别名和弃用信息进入过渡层；变更原因进入历史层。不得用“已删除”“不再支持”“这里曾经……”等当前层注脚替代清理。

验证必须分别完成：①当前层没有未解释旧标识符/路径/链接/锚点/配置/语义；②兼容层每个旧引用都有清单条目、责任人、退出条件和测试；③历史层不会被当前 Agent 执行路径当作规则；④代码、配置、测试、CI、模板、生成物和三语文档无断链、重复权威源或矛盾。未知公共消费者、未分类命中、兼容边界未决定、生成物未更新或迁移/回滚未验证时，标记 `⚠️ Blocked`/`❌ Failed`。

涉及公共 API/CLI/协议/数据格式、权限、安全、删除保护或校验门禁的变更，必须补充调用方盘点、迁移/回滚方案和相应审查/确认；不得以“清理残留”为由静默制造破坏性变更或降低安全门槛。

## Phase 4 — Validate（验证）

完成后必须按标准验证序列执行并记录**真实输出**（不是"应该没问题"）。命令按 AGENTS.md 的 Development Commands 裸命令运行，输出摘录进任务报告。

**证据要求**：每项验证结果必须附**证据** —— 实际运行的裸命令 + 真实输出摘录（关键行），不得只写"✓ 通过/测试通过"。无法提供输出摘录的"通过"视为未验证。

**标准验证序列（按序执行）：**

1. **锁检查**（多 Agent 场景）—— `node scripts/check-lock.js`，exit 1 = 其他 Agent 持锁，等待或协调
2. **Git 策略门禁** —— `node scripts/check-git-policy.js`（受保护分支 + `directPush=false` → exit 1，先建分支）
3. **密钥扫描门禁** —— `node scripts/check-secrets.js`（暂存区密钥类内容 → exit 1，绝不打印密钥）
4. **治理校验器** —— `node scripts/verify-governance.js`（治理工件缺失 → exit 1）
5. **项目自身验证** —— 测试、静态检查、构建（按 AGENTS.md Development Commands）
6. **建议层（exit 0，仅报告，不阻断）** —— `node scripts/check-doc-freshness.js`（过时文档）与 `node scripts/check-doc-consistency.js`（文档间矛盾）；结果可写入 `.governance/drift-report.json`

**规则**：第 1-5 项为**门禁层**，任何一项 exit ≠ 0 即任务未完成，不得宣称完成；第 6 项仅产出报告，稳定项目允许显示过时/矛盾而不阻塞。门禁层全部通过 + 记录真实输出，才进入 Phase 5。

## Phase 5 — Synchronize Knowledge（同步知识）

**中/大型**改动完成后必须同步（**小型改动跳过本阶段**，见规模分级与 Change Classification）：

- **同步组对照（必做）** —— 读取 `.governance/sync-rules.json`（项目同步组声明），逐组对照本次实际改动：
  - watch 命中且 require 未更新 → ❌ 漏同步，补齐后才算完成
  - watch 未命中 → ⚠️ not-applicable（无同步义务），报告中标注即可
  - 逐组报告 ✅ 已同步 / ⚠️ 不适用（见 `references/templates/sync-rules.template.md` 生成规则）
- **机械验证（gate）** —— 在中/大型改动声明完成前运行 `node scripts/check-sync.js`（默认 gate 模式；exit 0 = 通过、exit 1 = 漏同步组）；`--advisory` 模式仅报告不阻断；详见 `scripts/check-sync.js` 与 `references/templates/sync-rules.template.md`
- **规则捕获（Rule Capture）** —— 任务中只收集开发者明确提出的持久性行为要求，不收集系统指令、问题、任务专属验收标准、临时 workaround、秘密或凭据。候选必须有唯一 ID（`rc-<task_id>-<序号>`）、规范化文本、作用域、初始分类、理由和目标章节；重复出现只能提高优先级，不能单独升级为持久规则。
  - **Phase 5a 裁定门**：在写入前给出 `persistent / one-off / unclear` 清单。明确的一次性要求只报告、不写入、不计入待决；持久和模糊项必须由开发者按 ID 确认或改判，省略项不默认同意。规则内容裁定不等于 Git 提交/推送确认。
  - **Phase 5b 写入与同步**：只有明确确认的持久项才能写入 `AGENTS.md`/`docs/rules/**`。先搜索既有规则并更新单一事实源；遵守治理文件保护、CHANGELOG、AGENTS 指针和同步组流程。
  - **Phase 5c 重新验证**：规则文件写入后重新运行受影响的治理校验、密钥扫描和同步组门禁；被治理项目运行其 `verify-governance.js`，本仓库使用 `npm run check`。写入完成后才进入 Phase 6。
  - **未裁定/中断**：把候选保存在受跟踪 `state.json.rule_capture`，任务状态为 `blocked`，下一次运行读取候选并从 Phase 5b 恢复；`activity.jsonl` 只作追加式审计记录，不单独承诺跨电脑持久化。
- **文档引用规则、不复述规则** —— 同步知识时，`docs/` 里的内容（README、feature 文档、架构文档）只能**引用** `docs/rules/**` 与 AGENTS.md 中的规则（文件 + 章节指针），不得把规则原文复制进项目知识文档。规则变更 → 只改 `docs/rules/**`（单一事实源）；文档随之更新为引用，不复制。判断标准：这条内容"Agent 必须遵守" → 规则，进 `docs/rules/`；"只是帮助理解" → 知识，进 `docs/` 引用规则。
- 更新 CHANGELOG.md（已完成变更，[Unreleased]；时机按 Change Classification 的更新时机规则）
- 更新 Feature Registry（docs/features/，如涉及功能）
- 更新 Architecture Documentation（如架构变化）
- 更新 `docs/plans/DEVELOPMENT_PLAN.md`：勾选对应里程碑、更新状态标记与验收结果（如存在对应里程碑）；归档在发布（RELEASE）时统一执行（见发布流程）
- 已完成任务的 `TASK_<name>.md`：把文档顶部 `## Status` 更新为 `Completed` 并附完成日期；归档仍在发布（RELEASE）时统一执行
- **归档不翻译** —— 归档的计划（`docs/plans/archive/`）与 ADR 决策史保持项目约定语言原样，绝不翻译（见 SKILL.md 语言政策·历史记录不翻译）

**Change Classification（CHANGELOG 何时写）**：

| 变更类型 | CHANGELOG 动作 |
| --- | --- |
| 仅文档/注释/typo | 不更新 |
| Bug 修复 | `Fixed` |
| 新能力 | `Added` |
| 架构/行为/破坏性变更 | `Changed` |

**更新时机（主流做法：发布/合并前汇总，而非每个任务实时写）**：

- 小型改动：不写 CHANGELOG（发布时由 release 流程汇总）
- 中/大型改动：**任务完成时先在 [Unreleased] 记录**（这是合并前的一次性写入，不是每个任务强制）；或推迟到合并/发布前统一汇总
- 同一次发布的多项小改动：在发布前置检查（`changelog.required`）时由 Agent 汇总写入
- 判断标准：**CHANGELOG 反映的是"合并/发布边界"的变更，不是"每个 commit"的变更**

## Phase 6 — Report（报告）

最终输出：修改文件列表、新增功能列表、删除/重命名/替换/弃用内容列表、已捕获规则、一次性要求、未决候选、兼容项及退出条件、迁移/回滚结果、验证结果和文档更新情况。报告中的规则候选使用 ID 和规范化摘要，不复制秘密或整段对话；Phase 6 不再触发新的规则写入。

对于 Change Hygiene，报告必须说明：当前层未解释命中数、兼容层保留项及其退出条件、历史层命中是否仅为历史记录、未解决影响面以及 `git diff --name-only` 与 Affected Files/Target 的对照结果。

**影响面对照（必做）** —— 把实际改动文件（`git diff --name-only`）与任务开始时的 Affected Files 清单逐条对照：

- 清单里有但实际没改 → ❌ **漏文件**，补改或逐条说明不动的理由
- 实际改了但清单里没有 → ⚠️ **未预判改动**，说明原因（新发现的必要改动 / 偷懒的顺手改）
- 对照结果写入任务报告，逐条 ✅/❌/⚠️

## 禁止

- 只修改代码，不更新项目知识
- 未走完 6 阶段就宣称完成
- 伪造/跳过验证输出
