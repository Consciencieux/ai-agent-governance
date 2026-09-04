# 文档翻译治理升级：术语门禁与翻译新鲜度（TASK 计划）

[English](../../en/plans/doc-translation-governance.md) · [简体中文](doc-translation-governance.md) · [繁體中文](../../zh-TW/plans/doc-translation-governance.md)

> **状态：已实现，待归档。** 本计划把三语文档从"结构同步"升级为"术语约束 + Git 派生新鲜度"，全部采用机械对账：事实源仍是源文档与术语表，状态一律派生，不引入手写 manifest、TMS 或运行时 i18n。

**Target：both** —— `payload` 扩展两个已交付脚本（check-doc-consistency.js、check-doc-freshness.js）并同步其生命周期与子技能中的行为描述；`repo-infra` 扩展术语表、测试与本仓库文档。两个域分别列在"受影响文件"中。

### 任务目的

结构 parity 只证明三语文档"长得一样"，不证明翻译正确。本会话已真实发生 `協議/協定` 混用、`審核一下/审核一下` 漂移、zh-TW 文档混入简体词——全部是结构门禁检不出的缺陷。本计划在不重构目录、不接 TMS、不引入 CLDR/ICU 的前提下，补上语义治理的第一层机械防线：术语约束 + 翻译新鲜度。 <!-- i18n: allow 協定 -->

### 当前问题

- 检查的是结构一致，不是翻译一致：错译、漏译、术语漂移、zh-TW 简体泄漏没有任何机械检出手段。
- 没有翻译状态模型：源文档更新后译文可能已经过时，但门禁仍然通过；现有 freshness 检查只对比"文档 vs 代码活跃度"，不对比"源文档 vs 译文"的相对新鲜度。
- "三语一次同步"与"草稿阶段延迟翻译"两条规则之间缺少机械化状态表达，目前完全依赖 Agent 自觉。

### 提议方案

#### 1. 术语门禁（第 1 优先）

- `docs/glossary.md` 增加两个可选列 `Forbidden zh-CN` 与 `Forbidden zh-TW`（分号分隔变体，缺省为空）：为概念登记禁止译法，如 protocol 行的 Forbidden zh-TW 记 `協議`。
- 扩展 `scripts/check-doc-consistency.js`：扫描三语文档树，zh-CN 文档命中 Forbidden zh-CN 变体、zh-TW 文档命中 Forbidden zh-TW 变体即报告（kind `terminology_usage`）。跳过 glossary.md 自身。支持行级豁免注释 `<!-- i18n: allow <术语> -->`。
- 执行强度：`--gate`/`--release-gate` fail-closed（随 npm run check 常开）。术语门禁只保证术语一致，不判定整段翻译语义正确——它是语义治理的第一层，不是机器翻译质量判定器。

#### 2. Git 派生翻译新鲜度（第 2 优先）

- 扩展 `scripts/check-doc-freshness.js`：按路径对匹配（docs/zh-CN/X.md → docs/en/X.md、docs/zh-TW/X.md），比较每对文件的最后提交时间（`git log -1 --format=%ct`，延续该脚本不用 mtime 的既有设计）。
- 判定：`sourceCommit > translationCommit → stale`；`sourceCommit ≤ translationCommit → translated`。
- 两个边界：① 源文件有未提交修改（叠加 `git status`/diff 判断）→ 译文视同 stale；② 源与译文同一次提交只报告"同步提交"，不声明翻译正确。
- `draft` 由 front matter 表达（文件头部 `<!-- i18n-status: draft -->`），仅非发布阶段允许绕过；`--release-gate` 下 stale 与 draft 均阻断。
- 执行强度：日常 advisory（延续该脚本 exit 0 惯例）；`--release-gate` fail-closed。被治理项目没有三语树 → 检查自然 no-op，payload 兼容性由测试保证。

#### 3. Section ID 对齐（后续迭代，本计划不实现）

记录方向：用 `<!-- i18n-section: X -->` 标注稳定章节标识，三语文档只要求 ID 集合一致，不再强求列表数量与表格尺寸完全一致，从而减少结构 parity 的误报。此项目在术语门禁与新鲜度落地并稳定后再启动。

### 受影响文件

#### Payload

- `scripts/check-doc-consistency.js` —— 术语门禁（kind `terminology_usage`，advisory/`--release-gate` 双强度）
- `scripts/check-doc-freshness.js` —— 翻译新鲜度（路径对 + 未提交源变更 + draft front matter）
- `references/policies/lifecycle.policy.md` —— 建议层描述更新（freshness 新增 release-gate 阻断强度）
- `references/templates/sub-skills.md` —— standard validation sequence 描述同步
- `references/workflows/release.md` —— Phase 4 第 3 步接入 `check-doc-freshness.js --release-gate`

#### 仓库基础设施

- `docs/glossary.md` —— 新增 Forbidden zh-CN / Forbidden zh-TW 列（术语权威扩展）
- `tests/run-tests.js` —— 术语命中/豁免/无术语表 no-op；新鲜度 stale/translated/未提交源变更/draft/release-gate 阻断；payload 无三语树 no-op
- `AGENTS.md` —— gate 簇描述同步术语门禁
- `docs/{en,zh-CN,zh-TW}/architecture.md` —— check-doc-consistency.js 与 check-doc-freshness.js 的树内注释同步
- `docs/{en,zh-CN,zh-TW}/roadmap.md` —— 一致性/新鲜度两行描述同步
- `CHANGELOG.md` —— 发布边界记录行为变化
- `SKILL.md` —— 嵌入的 manifest 版本示例随发布同步（0.11.2 → 0.11.3）
- `docs/en/commands.md` —— 触发词回源补同步，记录 i18n-reviewed 标记
- `docs/zh-TW/commands.md`、`docs/zh-TW/bootstrap-output.md`、`docs/zh-TW/skill-discovery.md`、`docs/zh-TW/plans/skill-lifecycle-management.md` —— 术语门禁发现的简体泄漏修正

### 风险与决定

- 历史译文未必严格同步：首次开启 release-gate 可能一次性暴露存量 stale。缓解：日常 advisory 观察一轮，发布前修齐或补 draft 标注。
- 触发词类简体词（如 `审核一下`）在 zh-TW 文档中是源形态引用，禁止译法只登记概念术语、不登记触发词；确需登记的场景用行级豁免注释兜底。
- 术语门禁可能误伤正当语境：禁止译法按概念登记而非全局词频规则，误报由行级豁免显式解决。
- 同提交同步 ≠ 语义正确：报告措辞只说"同步提交"，不升级为翻译质量声明。
- payload 兼容：被治理项目形态无三语树、无术语表，两项检查必须 no-op 且不改变现有 exit 码语义。

### 验证方法

- 术语门禁：zh-TW 文档含 `協議` 且 glossary 已登记该禁止译法 → advisory 报告、release-gate exit 1；豁免注释命中不报；无 glossary 的被治理形态 no-op。
- 新鲜度：源晚于译文 → stale；同步提交 → translated；源有未提交修改 → stale；front matter draft → 日常绕过、release-gate 阻断。
- 变异测试：回退术语检查与新鲜度判定后，对应测试失败。
- 更新三语树与 payload 复制不变量后，`npm test`、`npm run check`、`npm run check:all`、`--release-gate` 全部通过。

---
