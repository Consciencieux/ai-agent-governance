---
id: RESEARCH-0001
title: 当前治理系统控制模型（Generation-1 System Model）
status: Active
version: 1
created: 2026-09-08
updated: 2026-09-08
supersedes: []
superseded_by: []
---

# 当前治理系统控制模型（System Model）

> **Generation-1 现状表征**：document-driven、agent-triggered 的治理架构。本文档是 2.0 重构的 baseline，不是规范。

## Overview

当前 `ai-agent-governance` 是一个 **document-driven, agent-triggered governance architecture**：规则以 Markdown 文档承载，由 Agent 阅读、理解、选择触发，最终落到 JS checker / test runner 执行。

系统的核心不是「治理运行时自动执行规则」，而是「AI 按文档指示触发机械检查」。

## Execution Flow

```text
Rule documents (AGENTS.md / SKILL.md / policies)
                ↓
             Agent interpretation
                ↓
          Manual gate selection (AI 判断 scope)
                ↓
             npm scripts (check:*)
                ↓
          Checker execution (JS / tests)
                ↓
             exit 0 / 1
```

**只有最后一段是机械化的。** 前面的——规则是否被注意到、什么时候触发、是否属于当前任务、应该运行什么验证、是否需要人工判断——大量依赖 AI。

## 责任分配

| 环节 | 承担者 | 性质 |
| --- | --- | --- |
| 规则记忆 | AI | prompt-based |
| 适用性判断（scope） | AI | prompt-based |
| 门禁触发 | AI（本地）/ CI（自动但粗） | 混合 |
| 检查执行 | JS checker / test runner | 机械 |
| 结果判定 | exit code | 机械 |

## Enforcement Layers

当前门禁由 5 类机制组合而成（详见 `mechanism-taxonomy.md`）：

```text
文件存在性检查（existence）
文本匹配检查（regex / string）
结构解析检查（structured parsing）
一致性检查（cross-file consistency / drift）
测试执行检查（behavioral tests / invariant tests）
```

## 缺少的中间层

当前模型是：

```text
文件 → checker → exit code
```

缺少 control plane 中间层：

```text
Rule → Trigger → Mechanism → Evidence → Decision
```

具体例：规则「修改 validator-command 时必须检查所有 sibling instance」——当前系统没有结构化 sibling 列表、没有 instance model、没有触发条件、没有 closure checker，只能靠 AI 自己记得检查。这就是 enforcement gap（见 FINDING-0003）。

## 触发可靠性

治理可靠性拆成两个维度：

```text
Trigger Coverage    门禁该运行时有没有运行
Detection Coverage  运行以后能不能发现违规
```

- 本地：有 scope 概念（check:docs / check:payload / check:tests），但触发靠 AI 记得运行。
- CI：触发可靠（push/PR 自动），但 scope 粗（无条件 `npm run check`）。
- 两端各缺一半，需要统一 dispatcher（FINDING-0002 / FINDING-0005）。

## Known Limitations（已知限制）

1. **Declaration–Enforcement gap**：判断型规则与可判定规则使用相同 MUST 措辞，实际 enforcement 强度 100% vs 0%（FINDING-0003）。
2. **Trigger 依赖 AI 注意力**：checker 机械 ≠ 触发机械（FINDING-0004）。
3. **验证两头失衡**：简单规则过度验证，复杂规则无 carrier（FINDING-0005）。
4. **Fix ≠ protected**：部分修复无 negative oracle（FINDING-0006）。
5. **Producer/Product 耦合**：repo 治理与 skill 产品治理语义混杂（FINDING-0001）。
6. **Document-centric**：规则存在于语言层，不能被系统直接编排（FINDING-0002）。

## 为什么需要 2.0

1.0.0 冻结了 public interface surface（trigger words / script CLI / INIT contract / rule paths / .governance contract），但真正不稳定的核心模型（rule model / trigger model / enforcement model / evidence model）未被冻结（FINDING-0018）。2.0 的目标是在保留既有执行资产（checker / tests / generator / release-manager）的前提下，重构控制平面：Rule Registry → Context Detector → Policy Evaluator → Dispatcher → Evidence / Decision。
