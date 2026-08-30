# Agent Operating Lifecycle

[English](../en/lifecycle.md) · [简体中文](lifecycle.md) · [繁體中文](../zh-TW/lifecycle.md)

被治理项目中任何 Agent 执行的每个开发任务都遵循六阶段生命周期：**Understand → Plan → Implement → Validate → Synchronize → Report**。按范围分级决定适用程度：小型改动（单文件、<50 行、无公共接口变化）只走 Understand → Implement → Validate → Report；中大型改动走完整六阶段并建 TASK 计划。

**完整规范在 skill 本体里** —— `references/policies/lifecycle.policy.md`，INIT 时复制进被治理项目为 `docs/rules/lifecycle.md`。本页只是开发者摘要。

完整生命周期还包括变更归位与残留清理（高影响变更的当前层/兼容层/历史层检查）和规则捕获（持久性开发者要求写入规则文件前必须明确裁定）；两者均由同一政策文件定义。

### 变更分类（何时写 CHANGELOG）

| 变更类型 | CHANGELOG 动作 |
| --- | --- |
| 仅文档/注释/typo | 不更新 |
| Bug 修复 | `Fixed` |
| 新能力 | `Added` |
| 架构/行为/破坏性变更 | `Changed` |

### Definition of Done

代码 + 测试 + 全部质量门禁 + CHANGELOG + 文档同步，缺一不算完成。

### 成熟度等级（INIT 策略）

| 等级 | 判定 | 策略 |
| --- | --- | --- |
| L0 空仓库 | 只有 README/无源码 | 创建完整治理骨架 |
| L1 原型 | 有少量源码，无测试/CI/文档体系 | 完整骨架 + 接管现有文件（合并不覆盖） |
| L2 活跃开发 | 有源码 + 测试 + 部分 CI/文档 | 增量补齐缺口，只创建缺失项 |
| L3 生产项目 | 大量文件 + 已有规范 | 审计模式：差距报告 + 最小补丁 |

---
