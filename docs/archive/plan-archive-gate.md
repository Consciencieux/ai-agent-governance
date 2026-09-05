# 计划归档门禁（TASK 计划）


> **Status: archived.**（已归档。归档即断言完成。）（原状态：已实现（2026-09-03）。 交付验证（`scripts/check-plan-delivery.js`）跳过纯设计计划；本行即标记。）

**Target: both** —— `payload` 把计划状态契约与 release 门禁接线落到被治理项目的工件（`references/`，含 INIT 复制的 `scripts/check-doc-consistency.js`）；`repo-infra` 维护本仓库的门禁簇、交付门禁提取修复、测试与三语文档同步。两类交付点分列在下方"受影响文件"。

**目标版本：v0.12.0（暂定）。** 规范计划状态契约 + release 作用域门禁是新的 payload 能力（minor），不是补丁；发布时由 Release Proposal 按 SemVer 重新判定。实现阶段不改版本、不创建发布。

### 任务目的

终止反复出现的漏归档问题——已完成的 TASK 计划一直留在 `docs/*/plans/` 未归档——并让计划完成度成为机器可查询的进度视图。目前完成度靠手写 prose 推断，推断错误时没有任何门禁报错；让"已实现但未归档"成为机制可检测、在释出时强制执行的状态——prose 里可以被遗忘，门禁里不能被绕过。

### 当前问题

- 计划完成状态只有 prose：状态行至少有八种表述（`implemented`、`Completed (2026-08-29)`、`已实现，已归档`、`已实现（v0.6.0，已归档）`、`设计计划，未实现`、……）。没有规范的机器可读值。
- 归档步骤（`references/workflows/release.md` Phase 4 第 4 步）是执行者必须记住的清单项；没有门禁强制它。
- `scripts/check-plan-delivery.js` 验证声明的文件，但只用排除法——只要不是纯设计计划就纳入范围。它从不报告"某计划标注已实现却仍躺在 `plans/`"；从门禁角度看归档是可选的。
- 真实案例：`v0.11.0` 释出只提交了版本同步文件；三个已实现计划（`post-review-remediation`、`removal-hygiene`、`rule-capture`）留在 `plans/`，直到人工复查才发现。门禁全程通过。
- 用 `####` 子分节书写的"受影响文件"在交付门禁中提取为空——`scripts/check-plan-delivery.js` 的 `extractSection` 在第一个 `####` 处截断，这类计划空洞通过。已归档的 `rule-capture.md` 带此缺陷，本计划的初稿也踩中了它。
- `skill-lifecycle-management.md`（三语树）完全没有 Status 行——一个现有工具连名字都叫不出来的状态。

### 提议方案

#### 1. 规范状态关键词

每个计划的第一行 Status/状态 行必须以一个规范关键词开头；该集合是门禁的属性，三个语言树完全一致：

| 规范值 | English | 简体中文 | 繁體中文 | 门禁处理 |
| --- | --- | --- | --- | --- |
| design | Status: design plan, not implemented | 状态：设计计划，未实现 | 狀態：設計計劃，未實作 | 不在交付范围；永不是待归档候选 |
| active | Status: Active | 状态：Active | 狀態：Active | 进行中（Phase 2 创建态）；不是待归档候选 |
| implemented | Status: implemented | 状态：已实现 | 狀態：已實作 | 位于 docs/*/plans/ 时为待归档候选 |
| completed | Status: Completed | 状态：已完成 | 狀態：已完成 | 位于 docs/*/plans/ 时为待归档候选 |
| archived | Status: archived | 状态：已归档 | 狀態：已歸檔 | 从不标记；归档即断言完成 |

不以规范关键词开头的变体为 `unknown`——照实报告，绝不猜测。`completed` 与既有 Phase 5 约定一致（任务收尾时标 Completed；归档发生在 RELEASE），本契约是成文既有行为而非发明新生命周期。

#### 2. release 作用域的待归档门禁

- `scripts/check-doc-consistency.js` 新增门禁簇：扫描 `docs/{en,zh-CN,zh-TW}/plans/*.md`，按规范关键词分类每个计划，报告 `plans_pending_archive` 与 `plans_status_unknown`。
- 仅在新的 `--release-gate` 模式下 fail-closed（常开门禁簇 + 待归档簇），接线到 `references/workflows/release.md` Phase 4 第 3 步。default 与 `--gate` 模式下待归档仅 advisory：任务收尾到发布之间，计划合法地以 implemented 状态留在 `plans/`——这是成文生命周期，常开检查不得在该窗口变红。本计划自身实现后的状态就是回归证明。
- `plans_status_unknown` 保留在常开 `--gate` 中 fail-closed：它当场改一行状态行即可修复，而待归档只能在 release 解决。
- 三语树缺失时扫描安全降级（INIT 会把本脚本装进被治理项目；该簇在那里 no-op）。

#### 3. 归档措辞与触发同步

- `references/policies/lifecycle.policy.md` 记录计划头契约；`AGENTS.md` 镜像指针。
- `docs/{en,zh-CN,zh-TW}/commands.md` 的 plan-manager 行增加 `archive completed plan` 触发词（prompt-sync 检查覆盖）。
- `references/workflows/release.md` 以脚本无关措辞陈述先决条件，使其在被治理项目同样成立：归档步骤运行时，任何状态为 implemented/completed 的计划不得留在 `docs/plans/` 或 `docs/*/plans/` 下。

#### 4. 修复交付门禁的 `####` 截断

`scripts/check-plan-delivery.js` 的 `extractSection` 在"受影响文件"内第一个 `####` 处截断，那里的声明从未被校验。把节边界改为只在更低级别标题（`##`/`#`）处停止，并补一个 `####` 结构分节的回归测试。本计划的验收依赖门禁读到它的扁平声明；该修复也让未来子分节式计划保持诚实。

#### 5. 进度可见性

`scripts/check-doc-consistency.js --json` 增加逐计划状态分类（design / implemented / completed / archived / unknown）及待归档计数——本仓库此前缺失的机器可查询完成进度视图。

### 受影响文件

**Payload（交付给被治理项目）**

- `references/policies/lifecycle.policy.md` —— 计划头契约：规范关键词表、各值含义、release 门禁下的归档时序
- `references/templates/agents-md.template.md` —— Phase 2 计划结构引用规范状态关键词
- `references/workflows/release.md` —— Phase 4 第 3 步运行 `--release-gate`；第 4 步增加脚本无关的待归档先决条件
- `scripts/check-doc-consistency.js` —— 新门禁簇、`--release-gate` 模式、`--json` 逐计划分类（INIT 复制本脚本；三语扫描在被治理项目 no-op）

**Repo-infra（本仓库维护）**

- `scripts/check-plan-delivery.js` —— `extractSection` 只在更低级别标题处停止；`####` 内容被校验
- `tests/run-tests.js` —— 门禁簇 fixture（advisory 对 release-gate）、unknown 状态门禁、三语关键词、提取回归
- `AGENTS.md` —— 规范计划状态约定与 release-gate 步骤指针
- `docs/en/commands.md` + `docs/zh-CN/commands.md` + `docs/zh-TW/commands.md` —— plan-manager 增加 archive 触发词
- `docs/{en,zh-CN,zh-TW}/plans/skill-lifecycle-management.md` —— 补设计状态行（归一化；防止落地即 unknown）
- `CHANGELOG.md` —— `[Unreleased]` Added 条目

发布边界另按 Release 流程同步 `package.json`、`SKILL.md` frontmatter、CHANGELOG 和 tag；这不是本计划授权的自动版本操作。完成后按仓库规则归档本计划（zh-CN 副本胜出，移入 docs/archive/plan-archive-gate.md），且先通过计划交付门禁。

### 风险与缓解

- 既有 prose 的误报以 `plans_status_unknown` 暴露，随计划通过逐步调和；关键词集合保持显式，不静默放宽正则。
- release 门禁只有被调用才有效：接线进 release.md Phase 4 第 3 步，且本仓库的发布实践执行该清单。
- 三语关键词漂移：关键词表在三树中完全一致；编辑后运行 parity 与 prompt-sync 检查。
- 范围蔓延：不重写所有既有计划的 prose；归一化只覆盖无状态行的那份计划。
- 常开门禁在 pre-release 窗口保持绿色属设计使然——强制点是 release 时，不是每次检查。

### 验收与验证方法

#### 自动测试/契约测试

- `plans/` 下的 implemented 计划：`--gate` 退出 0（仅 advisory 报告）；`--release-gate` 以 `plans_pending_archive` 退出 1 并指名该计划。
- 同一计划移到 `docs/archive/`：两种模式皆绿。
- 设计计划与已归档计划：两种模式都不标记。
- unknown 状态：`--gate` 退出 1。
- zh-CN 与 zh-TW 的关键词变体都被识别。
- `####` 结构的受影响文件节能提取其声明（截断修复的回归测试）。

#### 门禁验证

- 本计划自身状态翻成 implemented 后 `npm test` 与 `npm run check` 立即保持绿——release 作用域决策的回归证明。
- 三语 commands.md 编辑后 `scripts/check-doc-parity.js` 保持绿。
- 记录真实输出；绝不声称"应当通过"。

