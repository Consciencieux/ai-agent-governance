# Tiered Review Gate（TASK 计划）

> **Status: archived.**（已归档。归档即断言完成。）（原状态：已实现（2026-08-29）。 本页保留路线图条目 `Tiered review gate` 的设计记录；风险字段与审核规则已写入 `references/workflows/release.md`（见 [roadmap.md](../zh-CN/roadmap.md)）。）

### 任务目的

在 release/push 之前建立**分级审核门禁**：轻量级机械检查总是自动跑（零 token、秒级），深度审查（review-manager）按变更风险等级选择性触发——把"审核"从"要么全做要么不做"变成按风险分级，既防遗漏又不骚扰。

### 当前问题

- 轻量级检查（机械脚本组）**已实现且已接入**：release 前置（tests.required / docs.parity_passed / validator.passed）、push 前（check-secrets / check-git-policy）、任务完成前（npm run check）——但**分级决策逻辑缺失**
- 深度审查（review-manager，计划中）成本高（多子代理、高 token），不能每次 push/release 都跑
- 目前没有规则定义"什么变更需要深度审查、什么变更轻量级通过即可"——要么靠主 Agent 临场判断（不可靠），要么一刀切（要么骚扰要么漏审）
- 与项目已有权限模型的哲学不一致：权限矩阵是分级的（Read 自动 / 改代码验证 / 删代码确认 / push 禁止），审核却没有分级

### 提议方案

在 release 流程的 Release Proposal 中加入**变更风险分级 + 审核建议**：

**分级规则（写入 release.md 与 review-manager 计划）：**

| 风险等级 | 变更类型 | 审核要求 |
| --- | --- | --- |
| 低 | docs/typo/版本号/链接修正/格式 | 轻量级门禁自动跑，通过即提交，不询问 |
| 中 | 新功能/脚本逻辑/政策变更/模板变更 | 轻量级门禁 + Proposal 报告"建议深度审查"；用户批准时决定是否先跑 review-manager |
| 高 | 安全/权限/删除保护/治理文件（SKILL.md、references/policies/**、scripts/*.js 的行为变更） | 必须先跑 review-manager，或用户逐项明确确认，否则不发布 |

**Proposal 增加一行**：

```
Risk level: low / medium / high
Review recommendation: none / suggested (review-manager) / required (review-manager or explicit approval)
```

**执行语义**：

- 轻量级（`npm run check` 门禁组 + release 前置检查）**总是自动跑**——这是底线，零成本
- 低风险：轻量级通过 → 正常走批准 → 发布
- 中风险：轻量级通过 → Proposal 注明建议 → **决定权在用户批准时行使**（不每次 push 打断，只在 release 决策时问一次）
- 高风险：轻量级通过后**必须先**跑 review-manager（聚焦 git diff 范围，非全项目）或用户逐项确认

**review-manager 范围约束**（配套，解决 token 成本）：

- 审查范围 = 本次 `git diff` 改动集 + 直接受影响文件（被改脚本影响的测试、被改政策影响的生成物）
- **不是**全项目审查；全项目审查仅在用户显式要求时

### 受影响文件

- `references/workflows/release.md` —— Proposal 增加风险等级 + 审核建议；分级规则表
- `docs/zh-CN/plans/review-manager.md`（三语）—— 补充"范围 = git diff，非全项目"约束 + 分级触发语义
- `references/templates/sub-skills.md` —— release-manager 子技能描述同步分级逻辑
- `docs/{en,zh-CN,zh-TW}/commands.md` —— release 提示词详情同步
- `CHANGELOG.md`

### 风险

- **分级判定依赖 AI 判断** —— "中/高"的边界可能被 Agent 低估；用类型清单（高风险的明确列举）而非自由裁量缓解
- **中风险的建议被用户惯性跳过** —— 与方案 2（每次询问）的失败模式相同；在 Proposal 里用醒目标注 + 默认勾选缓解
- **高风险定义过宽** —— scripts/*.js 行为变更全部列为高风险可能过度；v1 保守（宁高勿低），v1.1 再细化

### 验证方法

- release.md 含分级规则表与 Proposal 新字段（文档断言）
- review-manager 计划含"范围 = git diff"约束（文档断言）
- 模拟：低风险变更 Proposal 输出 "risk: low, review: none"；高风险变更输出 "risk: high, review: required"（人工验证/狗粮）
- 轻量级门禁在 release 前置中不重复、不缺失（对照 release_requirements 表核对）
