---
id: RESEARCH-0004
status: Active
version: 1
subject_generation: gen1
---

# RESEARCH-0004：架构演进

> 记录 ai-agent-governance 的世代演进。每个 Generation 是独立模型，不删除旧记录——演进过程本身就是研究轨迹。

## Generation 0 — Prompt-only governance

```text
规则写在 prompt / README
↓
Agent 阅读并记住
↓
Agent 自律执行
```

- 无机械 carrier，无 gate，无测试
- 治理强度完全依赖 Agent 注意力

## Generation 1 — Document + scripts（当前，1.0.x）

```text
Markdown / AGENTS / SKILL / policies
↓
Agent 阅读、判断 scope
↓
npm scripts → JS checker / test runner
↓
exit 0/1
```

- **prompt-triggered, mechanically-executed governance**
- 机械检查可靠，但触发依赖 AI（FINDING-0004）
- 判断型规则无 carrier（FINDING-0003）
- 验证简单过重 / 复杂不足（FINDING-0005）
- 1.0.0 冻结了 interface surface 但没冻结核心模型（FINDING-0018），定位为 Generation-1 baseline

## Generation 2 — Rule Registry + Dispatcher（规划中，2.0）

```text
                Rule Registry
                     │
                     ▼
              Context Detector
                     │
                     ▼
              Policy Evaluator
                     │
                     ▼
                 Dispatcher
              ┌──────┼──────┐
              ▼      ▼      ▼
           checker  review  adapter
              │      │      │
              └──────┼──────┘
                     ▼
              Evidence / Decision
                     │
                     ▼
          allow / deny / warn / review
```

- **system-triggered, policy-driven enforcement**
- 保留 Generation-1 执行资产（checker / tests / generator / release-manager），重构控制平面
- 最小 Policy Model：`id / mode / trigger / mechanism`
- 统一 Evidence Model：`rule / tool / query / exitCode / timestamp / resultHash`
- 进入路径由 ADR-0014（Architecture Migration Mode）管控

## Generation 3 — Runtime adapters（远期）

```text
Portable Governance Core
├ rule model
├ context detection
├ dispatcher
├ checker primitives
├ evidence
└ CI/git integration

Optional Runtime Adapters
├ Codex / Claude Code / Cursor / opencode
└ before_write / before_delete / before_shell interception
```

- Core 负责 policy semantics，Adapter 负责运行时拦截
- 解决 tool-agnostic 与 runtime hard enforcement 的天然冲突（FINDING-0007）

## 演进原则

- 保留成熟执行资产，不「删掉重写」（FINDING-0005 / Issue #7 §31）
- 一代一代 supersede，不删除旧模型记录
- 每代用 evaluation-framework 指标测量，做对比实验
