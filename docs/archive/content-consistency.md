# Content Consistency Check（TASK 计划）

> **Status: archived.**（已归档。归档即断言完成。）（原状态：已实现，已归档。 实现见 `scripts/check-doc-consistency.js`（7 类交叉矛盾检查：版本示例 / 受保护清单 / ADR 状态 / roadmap 目标 / 链接 / 数值声明 / 三树委托 check-doc-parity.js，恒 exit 0 建议性）；drift-check 子技能模板已含 consistency 模式（`references/templates/sub-skills.md`）。）

### 任务目的

补全漂移检测三合一：drift-check 现在管**存在性**（工件在不在？），将来管**时效性**（文档过没过时？）；缺的维度是**一致性**——文档之间的交叉矛盾（版本示例滞后、受保护清单分裂、ADR 状态过期、roadmap 目标过期、链接失效、数值声明错误）。这些问题全是机械可查的、且反复出现，但目前没有任何机制能抓到。

### 当前问题

真实事故（本仓库 2026-08-13 自查发现）：

1. manifest/release 示例还写着 `0.3.3`，当前版本已是 `0.5.0` —— 照此 INIT 的项目首次 AUDIT 就会报幽灵版本漂移
2. 受保护文件清单在 4 处与单一事实源（`governance-files.policy.md`）漂移，漏了 `git-policy.json` / `check-lock.js` / `check-git-policy.js`
3. ADR-0004 状态停在 `Accepted (Unreleased)`，而功能早在 v0.4.0 已发布
4. roadmap 目标 `v0.5.0` 已发布却不含该项 —— 本仓库在 v0.4.1 修过同样的错，之后又犯
5. 数值声明（校验器检查项数）必须与校验器源码一致

这些既不是存在性问题也不是时效性问题——是**文档之间的矛盾**，且全部可机械检测。

### 提议方案

drift-check 增加 `consistency` 模式（仅报告；与 `freshness` 成对，都写入 `.governance/drift-report.json`）：

检查类别（v1）：

1. **版本示例同步** —— grep 文档/模板中的 `governance_version` / manifest 示例值；与当前声明版本不符的标记
2. **受保护文件清单同步** —— 各处受保护文件摘要必须与单一事实源（`docs/rules/governance-files.md` 或对应 policy 文件）一致；缺项/多出按路径标记
3. **ADR 状态同步** —— 状态为 `Accepted (Unreleased)` 但功能已出现在已发布 CHANGELOG 章节的 ADR 标记为过期
4. **Roadmap 目标有效性** —— 未完成项的目标版本 ≤ 当前版本的标记为目标过期
5. **链接有效性** —— 文档中的相对 markdown 链接必须能解析到真实文件
6. **数值声明** —— 文档中的计数（子技能数、校验器检查项数、测试数）必须与实际来源一致
7. **多语言结构一致性（三树）** -- 开发者面向文件（三棵目录树 `docs/en/`、`docs/zh-CN/`、`docs/zh-TW/`，入口文件映射：英文=根 `README.md`/`CONTRIBUTING.md`，简/繁=各树内 `README.md`/`CONTRIBUTING.md`；Agent 面向文件与共享区历史记录按政策为单语，直接跳过）：对每棵树的同名文件做结构比对--各层级标题数量与顺序、代码块数量、表格行列数、列表项数量；不一致即标记。结构性同步 ≠ 语义性同步（翻译质量仍由人/Agent 复核）。**先行实现**：本仓库已有独立脚本 `scripts/check-doc-parity.js`（CI + 发布前置 `docs.parity_passed`）验证本仓库自身的三树同构；v0.7.0 实施时将该逻辑并入 drift-check 的 `consistency` 模式，供被治理项目复用，避免重复开发。

报告形态（追加进 drift-report.json）：

```json
{ "consistency": { "version_examples": ["SKILL.md:266"], "protected_lists": ["docs/anti-regression.md"], "adr_statuses": ["adr-0004"], "roadmap_targets": ["skill-lifecycle"], "broken_links": [], "numeric_claims": [] } }
```

### 受影响文件

- `references/templates/sub-skills.md` —— drift-check 增加 `consistency` 模式
- `.governance/drift-report.json` schema —— `consistency` 对象（运行期输出；仅 schema 说明）
- `docs/commands.md` —— 命令文档同步
- 校验器：**不变**（建议性报告，不是门禁；这些检查是启发式的，不 fail-closed）

### 风险

- **误报** —— 启发式（如版本示例 grep）可能命中有意的历史提及（CHANGELOG 条目、ADR-0001 的旧路径说明）。缓解：扫描排除 `CHANGELOG.md` 与 `docs/archive/`；仅建议性报告
- **检查范围膨胀** —— 每类检查必须保持机械（grep/解析/比对），绝不做语义判断；语义审查留给 Agent
- **与校验器内容检查重叠** —— 校验器现有的 CHANGELOG 格式检查保持 fail-closed；一致性检查是建议性的、范围更广

### 验证方法

- 播种漂移 fixture：版本示例滞后 + 受保护清单分裂 + `Accepted (Unreleased)` ADR + roadmap 目标过期 → 四类全部标记（测试）
- 多语言一致性 fixture：三棵树同名文件标题数量不一致 → 标记；一致 → 干净（测试）
- Agent 面向文件（`SKILL.md`、`references/**`）被一致性检查跳过（测试）
- 干净 fixture → 一致性报告为空（测试）
- `CHANGELOG.md` 与 `docs/archive/` 被版本示例扫描排除（测试）
- 校验器退出码不变（回归）
