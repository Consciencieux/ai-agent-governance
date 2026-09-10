---
id: RESEARCH-0012
status: Active
version: 1
subject_generation: gen2
---

# RESEARCH-0012：Task → Capability 适用路由（Phase 5 入口）

本 RESEARCH 是 **Phase 5 入口观察与问题框定**：在 Phase 4 已证明 Control vertical extraction 与机械边界之后，描述「任务如何命中应读能力」的缺口与目标形状。

**不**实现 Dispatcher。  
**不**搬 `references/` / SKILL / AGENTS 物理拓扑。  
**不**建设知识图谱 / 句级 ontology / 全自动 LLM 路由。

系统背景：ADR-0022（thin entry / progressive disclosure / Context Economy）、ADR-0023（Control slots）、RESEARCH-0009（指令架构）、RESEARCH-0006（能力基线）。

## 观察：现在有什么 / 没有什么

| 能力 | 状态 |
| --- | --- |
| 知识类型导航（Product / Research / Finding / ADR / Plan…） | 已有（`docs/README.md`） |
| Control identity + evaluator/binding | Phase 3–4 已有 |
| **Task / Context → Applicable Capabilities** 确定性映射 | **尚无** |
| 由 routing 导出的文档物理拓扑 | 尚无（禁止无路由先拆树） |

现状失败模式：Agent 打开厚 `lifecycle.policy` / 多文件自搜 → token↑、漏读、跨位置关联失败。

## 目标形状（陈述，非实现）

```text
Task taxonomy
    ↓
Task / Context → Applicable Capabilities   ← 本阶段首要
    ↓
Capability → Authority / Execution leaf
    ↓
fallback / ambiguity expansion
    ↓
thin entry 消费 routing
    ↓
（随后）Dispatcher；再据 routing 重构物理 topology
```

示例（说明性，非正式 schema）：

```text
delete_file
  requires:
    - change-hygiene
    - reference-closure
    - testing
    - evidence
```

第一阶段只要 **显式映射表 / 人工可维护的 applicability 陈述**；半自动与 runtime Dispatcher 延后。

## 明确禁止（防过度工程）

```text
万能知识图谱 / 每句规则唯一 ID / 段落 dependency ontology
LLM 自动判断一切任务并生成 execution plan
把所有 Markdown 规则默认 Control 化
无 routing 的大规模文档搬家
```

判断标准沿用项目共识：只让**高价值关系**进入系统；其余保持普通文档。

## 与 Phase 4 的交接

Phase 4（PLAN-0035）已 EXITED：extraction pattern、CTRL-0001 解耦、baseline、Discovery Ledger L1、Context Economy 齐备。剩余 consistency clusters / #9 = deferred by design，**不**作为 Phase 5 前置 blocker。

## 后续产物（本 RESEARCH 不创建）

- Phase 5 Plan（Task taxonomy + applicability map 施工）
- 必要时 Narrow ADR（routing 权威表示）
- Dispatcher 实现仍属更后切片

## 参考

- ADR-0018 Phase 5 · ADR-0022 · ADR-0023
- RESEARCH-0004 / 0006 / 0009 / 0010 / 0011
- PLAN-0035 Phase 4 Exit Criteria
