---
id: RESEARCH-0004
status: Active
version: 3
---

# RESEARCH-0004：架构演进

> 记录 ai-agent-governance 的世代演进。每个 Generation 是独立模型，不删除旧记录——演进过程本身就是研究轨迹。v3 修正 Generation 2 描述（不再用已过时的 Rule Registry / Policy Model 字段候选），并补上 Gen1→Gen2 **渐进式旁路迁移（strangler）** 观察模型。规范约束见 ADR-0014 / ADR-0018 / ADR-0020 / ADR-0023；施工见 Active Plan。

## 第 0 代（Generation 0）— 仅提示词治理

```text
规则写在 prompt / README
↓
Agent 阅读并记住
↓
Agent 自律执行
```

- 无机械 carrier，无 gate，无测试
- 治理强度完全依赖 Agent 注意力

## 第一代（Generation 1）— 文档 + 脚本（1.0.x baseline）

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
- **治理身份 ≈ 文件 / checker / npm script 路径**——这是 Gen2 要拆掉的耦合（见 CTRL-0003/0004 共文件反例，RESEARCH-0011）

## 第一代（Generation-1）的三重历史投影

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

## 第二代（Generation 2）— Control Model + 渐进吸收（进行中，2.0 migration）

> **v2 原文曾把 Gen2 画成 Rule Registry → Context Detector → Policy Evaluator → Dispatcher，并列出候选 Policy Model 字段（`id/mode/trigger/mechanism`）与 Evidence Model 字段。该草图保留为历史意图；自 v3 起，已接受的语义骨架以 ADR-0023 / ADR-0020 为准，下列为当前观察模型。**

### 语义骨架（Phase 1–3 已形成）

不是「先搭完整目录 / class 运行时」，而是 **架构契约**：

```text
CTRL identity
        ↓
authoritative semantics（semantics_ref；单一权威）
        ↓
applicability（可陈述；自动路由属后续）
        ↓
profile-specific evaluation binding（repo / skill 可不同 evaluator）
        ↓
enforcement boundary + decision effect（非 Control 单值 intrinsic）
        ↓
（未来）Dispatcher 调度 / evidence / blocking gates
```

配套边界：

```text
shared semantics ≠ shared implementation   （ADR-0020）
Rule semantics ≠ evaluator ≠ gate ≠ test   （ADR-0023）
```

到 Phase 3 结束时，仓库有的是 **Generation-2 semantic skeleton**，不是完整运行时框架。machine-readable 序列化仍未定（ADR-0023）；Research 不得用旧候选字段偷偷充当 schema。

### 目标执行形态（分阶段长出，非一次写完）

```text
Phase 4   Control → primitive / evaluator（机械吸收）
Phase 5   Context → applicability → Dispatcher → evaluator
Phase 6   Control → invariant oracles
Phase 7   Review evaluators（Implementation / System / Research）
Phase 8   新 control plane → mandatory gates → blocking authority
```

阶段顺序的规范权威在 ADR-0018；此处只描述演化关系。

## Generation 1 → Generation 2 迁移模型（渐进式旁路 / strangler）

当前 migration 分支表现出的不是 big-bang rewrite，而是：

```text
Gen1 remains protected baseline
+
Gen2 progressively absorbs capabilities
```

### 三层

**1. 先搭 Gen2 语义 / 控制骨架（Phase 1–3）**

```text
Phase 1  Producer/Product ownership
Phase 2  Research / Findings / Traceability（理解旧系统）
Phase 3  Control Model（CTRL 作为一级对象）
```

若跳过骨架直接「搬功能」，结果往往是把 1.0 的文件结构复制成新目录名——无架构价值。

**2. 按 Control 吸收 Gen1 能力（Phase 4 起）**

迁移单位是 **Control / capability**，不是 JS 文件：

```text
错误：
scripts/check-doc-freshness.js
        ↓ move
2.0/checkers/check-doc-freshness.js

观察中的正确单位：
旧 check-doc-freshness.js
        ↓ characterization
CTRL-0003 → freshness primitive(s) → profile evaluator
CTRL-0004 → translation-freshness primitive(s) → profile evaluator
        ↓
旧文件 KEEP / WRAP / EXTRACT / REWRITE / RETIRE
```

事实库存见 RESEARCH-0011；施工见 PLAN-0035。

**3. 新框架逐步接管执行权（Phase 5–8）**

```text
新 evaluator 存在          ≠ 旧 checker 可删
Dispatcher 能调用          ≠ 旧 blocking gate 可删
直到 Phase 8 control plane + oracles + review + gates 成熟
        → enforcement authority 交接
        → Gen1 实现逐步退休
```

### Authority 分阶段转移（观察模型）

```text
Phase 3   architecture / semantic authority     → Gen2
Phase 4   mechanical implementation             → 逐步 Gen2
Phase 5   dispatch authority                    → Gen2
Phase 6   testing / oracle model                → Gen2
Phase 7   review model                          → Gen2
Phase 8   blocking authority                    → Gen2
```

这解释了：为何 Phase 4 已有新 evaluator 时，旧 checker 仍须保留并受 ADR-0014 Frozen Gen1 / Refactor Safety Kernel 保护（security / generator / payload characterization 不可为建 Gen2 而拆没）。

### 共存窗口

```text
Gen1
┌─────────────┐
│ old checker │─────┐
└─────────────┘     │ still protects system
                    │
Gen2                │
┌─────────────┐     │
│ evaluator   │     │
│ primitive   │     │
└─────────────┘     │
                    │
逐条替换 ◄──────────┘
```

新架构逐步「吞掉」旧架构，而不是先关掉旧架构。

### 典型 Control 迁移生命周期（描述）

```text
CTRL-00xx
  → 发现 Gen1 当前实现
  → 固定 characterization
  → 确定 semantics authority
  → 识别 reusable primitive
  → 建立 Gen2 evaluator
  → 验证旧/新行为等价
  → 新调用面稳定
  → Dispatcher 开始消费（Phase 5+）
  → 新 gate 接管（Phase 8）
  → 旧 checker RETIRE
```

### 吸收能力，不复制结构

观察到的 disposition 光谱（执行裁决在 Plan / 后续 ADR，此处只描述选项空间）：

```text
Gen1 capability
├─ KEEP     成熟、边界正确
├─ WRAP     实现可用、接口旧
├─ EXTRACT  内部 primitive 有价值
├─ REWRITE  设计本身有问题
└─ RETIRE   历史 patch / 重复机制
```

因此目标形态更接近：

```text
许多 Gen1 checker / regex / gates
        ↓
较少稳定 primitives
+ 明确 Control identities
+ profile-specific evaluators
+ 统一 Dispatcher（较晚）
```

而不是 `Gen1 N 个文件 → Gen2 N 个同构文件`。

### 一句项目描述（研究结论）

> **1.0 → 2.0 采用渐进式架构迁移：先建立 Generation-2 的语义与控制骨架，再以 Control 为单位对 Generation-1 能力进行 characterization、拆解和 disposition，逐步迁入 primitive / evaluator / dispatcher 架构；在新 control plane 获得足够验证与阻断能力前，Generation-1 的安全关键机制继续作为迁移兜底。**

## 第三代（Generation 3）— 运行时适配器（远期）

```text
Portable Governance Core
├ control / semantics model
├ context detection
├ dispatcher
├ checker primitives
├ evidence
└ CI/git integration

Optional Runtime Adapters
├ Codex / Claude Code / Cursor / opencode
└ before_write / before_delete / before_shell interception
```

- Core 负责 policy / control semantics，Adapter 负责运行时拦截
- 解决 tool-agnostic 与 runtime hard enforcement 的天然冲突（FINDING-0007）
- Gen3 建立在 Gen2 control plane 之上，不是绕过 Phase 4–8

## 演进原则

- 保留成熟执行资产作 characterization / 兜底，不「先删后写」（FINDING-0005；ADR-0014）
- 一代一代 supersede，不删除旧模型记录
- 每代用 evaluation-framework 指标测量，做对比实验
- **迁移单位是 Control / capability，不是文件路径**
- Research 描述演化；阶段 MUST 与 slot 规范归 ADR；当前施工归 Plan

## 参考

- Migration Mode / Safety Kernel：ADR-0014
- Phase 顺序：ADR-0018
- Producer/Product：ADR-0020
- Control Model：ADR-0023 · RESEARCH-0010
- 机械库存：RESEARCH-0011
- Phase 4 施工：PLAN-0035
