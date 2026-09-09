---
id: RESEARCH-0004
status: Active
version: 2
subject_generation: gen1
---

# RESEARCH-0004：架构演进

> 记录 ai-agent-governance 的世代演进。每个 Generation 是独立模型，不删除旧记录——演进过程本身就是研究轨迹。

## 第 0 代（Generation 0）— 仅提示词治理（Prompt-only governance）

```text
规则写在 prompt / README
↓
Agent 阅读并记住
↓
Agent 自律执行
```

- 无机械 carrier，无 gate，无测试
- 治理强度完全依赖 Agent 注意力

## 第一代（Generation 1）— 文档 + 脚本（当前，1.0.x）

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
- 指令拓扑、`references/` 六类作用、lifecycle / sub-skills 单体与文件级演进证据见 RESEARCH-0009；注意力负担见 FINDING-0015
- CHANGELOG 在 1.0.2 及以前与 verbose commit、Archived Plan 高度语义重叠，是旧知识体系缺少 responsibility boundary 的历史证据（见下节）；1.0.0 宣称冻结接口后 1.0.1/1.0.2 连续暴露缺陷，是 FINDING-0018 的 release-level 证据

## Generation-1 的三重历史投影

Generation-1 后期（尤其 0.13.x → 1.0.2）同一事实常同时出现在：

```text
Git commit message   = 某次代码变更实际做了什么
Archived Plan        = 这个任务为什么做、准备怎么做、怎么验收
CHANGELOG            = 当时发布边界对外宣称交付了什么
```

典型重合：`83c2467` 的 commit message 已是小型审计报告（protected-files 解析 0 行仍绿、CI 子集、secret scanner、tests 193→223 等），同期 CHANGELOG 再逐项写成多条 `Fixed`。`feat(payload): require sibling-instance closure…` 与 1.0.2 CHANGELOG 几乎复述同一能力。重合不等于可删 CHANGELOG：三者时间语义不同。CHANGELOG 还记录「维护者当时认为系统已经成熟到什么程度」（例如 1.0.0 冻结公开接口的声明），这是 commit 序列单独看不清楚的。

这些旧条目按现行准入会有大量「放错位置」的根因/验证/rationale，但它们是 contemporaneous 证据：例如 protected-files 解析 0 行仍绿、CI 只跑声明 gate 子集、secret scanner 对未读 binary 报 clean——不是后来为 Gen2 重构事后构造的。正确处置是保留原文作 provenance，把失效模式提炼进 Finding / Research，而不是按新政策回写 released 节（FINDING-0009）。写作语义分界：`≤ 1.0.2` legacy mixed；`> 1.0.2` 只写 delivered change。

旧 CHANGELOG 混入的内容，按今天职责可这样读（有科研价值 ≠ 今天仍应只活在 CHANGELOG 里）：

| 旧 CHANGELOG 内容 | 今天看 | 作为历史证据 |
| --- | --- | --- |
| 新增了什么能力、用户/贡献者行为怎么变 | 正常 CHANGELOG | 高 |
| release boundary 当时声称交付了什么 | 正常历史投影 | 很高 |
| 具体 bug 现象、false green、vacuous gate | Finding | 高 |
| 根因分析、checker 为何失效 | Finding / Research | 高 |
| 为什么选择某种架构 | ADR | 中高 |
| test 计数、具体跑了什么 gate / exit code | 通常不该写 | 低到中 |
| 实现过程逐步叙事 | Plan / Git | 通常低 |

## 第二代（Generation 2）— Rule Registry + Dispatcher（规划中，2.0）

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

## 第三代（Generation 3）— 运行时适配器（Runtime adapters；远期）

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
