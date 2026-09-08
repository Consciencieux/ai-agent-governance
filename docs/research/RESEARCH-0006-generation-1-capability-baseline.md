---
id: RESEARCH-0006
title: Generation-1 能力基线（Capability Baseline）
status: Active
version: 1
created: 2026-09-09
updated: 2026-09-09
supersedes: []
superseded_by: []
subject_generation: gen1
---

# Generation-1 能力基线（Capability Baseline）

本 RESEARCH 从 `docs/plans/archive/PLAN-0001..0030`（30 份归档计划）、当前代码与测试中提炼 Generation-1 的**能力保存矩阵**，为 Generation-2 重构提供 baseline evidence。它回答「1.0 曾经保护什么、现在由什么承载、2.0 怎么处置」，不复制任何归档计划的全文。

## 为什么需要

最危险的 2.0 迁移风险不是「删掉 archived Plan」，而是：

```text
重构代码
↓
旧机制消失
↓
没人意识到这个机制原来保护什么
↓
2.0 少了一个能力
```

测试数量（如 `332/332`）不能替代设计意图证据——测试只证明已覆盖的断言，不一定覆盖所有设计意图；而归档 Plan 很可能记录了「为什么加入这个机制、当时解决什么问题、涉及什么文件、哪些边界条件、哪些同步点、哪些功能最终交付」。

## 溯源链

```text
Archived Plan (PLAN-0001..0030)
      ↓
Generation-1 Capability Baseline (本 RESEARCH)
      ↓
2.0 disposition
      ↓
new implementation / intentional removal
      ↓
regression evidence
```

**Plan archived ≠ Feature deprecated ≠ Control obsolete。** 归档只表示任务完成，不表示能力仍然存在。每条 Generation-1 能力在 2.0 必须得到明确处置。

## 处置语义（Disposition Vocabulary）

| 处置 | 含义 |
| --- | --- |
| `Preserve` | 机制与载体均保留，原样进入 2.0 |
| `Preserve behavior, replace mechanism` | 行为保留，但载体/实现机制在 2.0 替换 |
| `Redesign` | 行为目标保留，但在 2.0 重新设计 |
| `Intentionally remove` | 明确移除，不留替代 |
| `Superseded` | 已被更新的机制取代 |
| `Unknown / requires investigation` | 处置未定，需要调查 |

## 能力保存矩阵

### A. INIT 与生成器

| 1.0 能力 | 历史来源 | 当前实现载体 | 2.0 处置 |
| --- | --- | --- | --- |
| INIT 确定性生成器 | PLAN-0012 | `scripts/generate-governance.js` | Preserve |
| 治理文件与状态管理 | PLAN-0012 | `references/init-spec.json` + 生成器 | Preserve |
| 载荷治理教训（声明-机制差距、证据等级、测试活性、枚举复查、CI 完整性） | PLAN-0028 | INSTALLED `docs/rules/lifecycle.md` 等 | Preserve（喂入 2.0 evidence model） |

### B. 运行时检查器（Mechanisms）

| 1.0 能力 | 历史来源 | 当前实现载体 | 2.0 处置 |
| --- | --- | --- | --- |
| Secret scanning | PLAN-0001 | `scripts/check-secrets.js` | Preserve |
| Git workflow governance | PLAN-0002 | `.governance/git-policy.json` + `scripts/check-git-policy.js` | Preserve |
| Agent activity audit | PLAN-0003 | `.governance/activity.jsonl` + drift-check（validator） | Re-evaluate |
| Governance score / badge | PLAN-0004 | validator `--json` score + shields badge | Re-evaluate |
| Doc freshness | PLAN-0005 | `scripts/check-doc-freshness.js` | Preserve behavior, replace mechanism |
| Content consistency | PLAN-0006 | `scripts/check-doc-consistency.js`（monolith，见 FINDING-0019） | Preserve behavior, replace mechanism |
| 多 Agent 锁 | — | `scripts/check-lock.js`（非独立计划引入） | Replace mechanism |
| 计划归档门禁 | PLAN-0017 | plan-status / pending-archive 集群 | Re-evaluate（plan model 随 2.0 演进） |
| 交付锚点 | PLAN-0026 | `repo-tools/check-plan-delivery.js` | Re-evaluate |
| 领域级测试入口 | PLAN-0030 | `tests/run-tests.js --suite` | Preserve（配合 invariant-centric testing） |

### C. 同步与一致性

| 1.0 能力 | 历史来源 | 当前实现载体 | 2.0 处置 |
| --- | --- | --- | --- |
| 被治理项目同步组（声明层） | PLAN-0008 | `.governance/sync-rules.json` | Re-evaluate |
| 同步组机械校验 | PLAN-0010 | `scripts/check-sync.js` | Re-evaluate |
| 治理规则同步与元治理 | PLAN-0011 | `references/` ↔ 规则文件同步 | Preserve behavior, replace mechanism（→ 2.0 Profile 同步） |

### D. 审查与人类在环

| 1.0 能力 | 历史来源 | 当前实现载体 | 2.0 处置 |
| --- | --- | --- | --- |
| Review manager | PLAN-0007 | `references/templates/sub-skills.md` 第 8 节 | Redesign（→ Implementation / System / Research 三类） |
| 分级审查门禁 | PLAN-0009 | `references/workflows/release.md` 风险分级 | Redesign |
| 审查后积压修复 | PLAN-0015 | broken-links 集群 + consistency | Preserve |
| Consent 政策（提交前一次确认） | PLAN-0013 | release-manager consent + git.policy | Preserve |
| 确认凭证与变更卫生 | PLAN-0027 | `stagedDigest` + `.governance/change-hygiene.json` | Preserve |

### E. 生命周期与过程模型

| 1.0 能力 | 历史来源 | 当前实现载体 | 2.0 处置 |
| --- | --- | --- | --- |
| Rule Capture | PLAN-0016 | `references/policies/lifecycle.policy.md` § Rule Capture | Redesign（→ Rule Registry） |
| 反补丁式开发 / 根因修复协议 | PLAN-0018 | lifecycle.policy § 根因修复 + 失败预算 | Preserve |
| 工程克制（机制测试） | PLAN-0019 | coding.policy § 工程克制 | Preserve |
| 治理缺陷闭包 | PLAN-0029 | lifecycle.policy § 缺陷闭包 + sibling 搜索 | Preserve |
| 变更归位与残留清理 | PLAN-0014 | change-hygiene + 残留标记检查 | Preserve |

### F. 文档与知识治理

| 1.0 能力 | 历史来源 | 当前实现载体 | 2.0 处置 |
| --- | --- | --- | --- |
| 术语门禁 + 翻译新鲜度 | PLAN-0020 | terminology 集群 + freshness | Preserve? |
| 验证门禁分层与证据边界 | PLAN-0021 | evidence tiers（mechanical / human-attested / unverified） | Preserve（喂入 2.0 evidence model） |
| 内容受众与可移植性 | PLAN-0022 | 四受众 portability 规则 | Preserve（喂入 2.0 core/profile 边界） |
| 门禁修复与单一事实源对齐 | PLAN-0023 | SSOT 纪律 + 门禁修复协议 | Preserve |

### G. 分发与边界

| 1.0 能力 | 历史来源 | 当前实现载体 | 2.0 处置 |
| --- | --- | --- | --- |
| 仓库边界拆分（载荷 vs 仓库工具） | PLAN-0024 | 三种分发角色（INSTALLED / SKILL-INTERNAL / REPO-ONLY） | Preserve（喂入 Phase 1 producer/product separation） |

### H. Skill 生命周期

| 1.0 能力 | 历史来源 | 当前实现载体 | 2.0 处置 |
| --- | --- | --- | --- |
| Skill lifecycle management | PLAN-0025 | 子技能生命周期 | Redesign |

## 与现有测试的关系

测试数量（`332/332`）不是治理成熟度的代理指标，也不代表对上述 30 条能力的设计意图覆盖。本基线与测试互补：

- **测试**证明「当前代码当前行为正确」（mechanical, 现状）；
- **本基线**保存「这个能力为什么存在、保护什么」（provenance, 意图）。

2.0 迁移时以本基线为清单逐条核对：每移除/替换一个 Generation-1 载体前，先确认对应能力已被新的 carrier 承载或明确移除。

## 维护规则

- 本 RESEARCH 是活文档：2.0 每完成一个 Phase，将相应行的处置从 `Redesign / Replace` 更新为实际结果，并保留处置历史（supersede 版本演进，不删除）。
- 新增 Generation-1 能力来源（如果发现遗漏的 Plan/实现）时补充对应行。
- 处置值只使用上表 6 个枚举；不确定的显式标 `Unknown / requires investigation`，不允许空白。
