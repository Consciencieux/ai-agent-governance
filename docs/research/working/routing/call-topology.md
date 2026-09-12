---
id: CALL-TOPOLOGY-0012
status: Working
plan: PLAN-0038
research: RESEARCH-0012
version: 0
authority: construction
---

# 调用拓扑架构（Phase 5a）

本文件规划 **调用拓扑**（谁在何种任务下被加载 / 被评价），不是目录树，不是 Dispatcher 实现。

实例表见 `task-capability-map.md`。系统假设见 RESEARCH-0012。升格 Narrow ADR 前为施工权威。

## 一句话

```text
调用拓扑 = 分层有向图

节点：TaskClass · ContextFacet · Capability · AuthorityRef · Control
边：  always_on · triggers · facet_adds · has_authority · binds
解析：并集 → 排序 → 预算裁剪 → RoutingResult
```

物理文件不是节点。路径只出现在 `AuthorityRef` 的**当前投影**里，可随搬家改指针而不改图。

## 为何先有图、后拆文件

```text
无图先拆目录  → Agent 仍自搜 → 「找规则」成本
有图再投影文件 → 搬家只改 AuthorityRef，边不变
```

Capability 边界（语义拆分）只细到 **图上需要独立触发的粒度**。不为对称或「一个文件一个能力」而拆。

## 分层（固定顺序，禁止跳层发明）

```text
L0  Always-on
      thin-entry · context-economy
      （及将来真正 always 的 invariant）
        ↓ 并入
L1  TaskClass → Capability+
      一对多；unknown → unmatched，不静默全表
        ↓ 叠加（不替换 L1）
L2  ContextFacet → Capability+
      trees / phase / artifacts / write_boundary
        ↓
L3  Capability → AuthorityRef+ 且可选 Control+
      读指令走 authority；跑保证走 control
        ↓
L4  RoutingResult
      always_on · capabilities · read_set · run_set · defer_set · unmatched
```

薄入口只消费 L4（或与 L4 同构的表）。不要在入口展开 L1–L3。

```text
                    ┌─ AuthorityRef (read)
 TaskClass ─┐       │
            ├─► Capability ─┼─ Control (run, 0..n)
 Facet ─────┘       │
 Always-on ─────────┘
```

横切（security、change-hygiene）挂在 **多个 TaskClass / Facet** 上，不挂进某一个 lifecycle 文件当唯一家。

## 节点类型

| 类型 | 身份 | 不是 |
| --- | --- | --- |
| **TaskClass** | 稳定枚举 id | 用户原话、一次会话全文 |
| **ContextFacet** | 四轴：`trees` · `phase` · `artifacts` · `write_boundary` | 自由标签云 |
| **Capability** | 可独立加载的执行关注面 | 目录、CTRL、整份 lifecycle |
| **AuthorityRef** | 语义指针（文件+节 / ADR / policy） | 文件身份本身 |
| **Control** | 可评价保证（ADR-0023） | Capability 的别名 |

禁止：Capability 1:1 等于一个 Markdown 文件；禁止 Capability 1:1 改名为 CTRL。

## 边类型（仅这五种）

| 边 | 从 → 到 | 语义 |
| --- | --- | --- |
| `always_on` | ⊤ → Capability | 每任务并入；失败不得卸掉 |
| `triggers` | TaskClass → Capability | L1 命中 |
| `facet_adds` | Facet → Capability | L2 叠加 |
| `has_authority` | Capability → AuthorityRef | 应读 |
| `binds` | Capability → Control | 应跑（可空） |

不建：段落依赖、句级 ontology、embedding 相似边、LLM 动态边。高价值关系才进图；其余保持普通文档。

## 解析算法（确定性）

输入：`task_class` + `context`（可空）。

```text
1. 归类：自然语言 → TaskClass；失败则 task_class=unknown
2. caps ← { C | always_on(C) }
3. 若 unknown：
     read_set ← Authority(caps)
     unmatched ← true
     defer_set ← ask-user / expand-entry
     停止（不跑全表）
4. caps ∪ { C | triggers(task_class, C) }
5. caps ∪ { C | facet_adds(f, C) for f in context }
6. 去重
7. 排序：always_on → task-triggered → facet → 其余
8. read_set ← flatten has_authority(caps) 按上序
9. run_set  ← flatten binds(caps)
10. 若 |read_set 的 capability 计数| > 预算（暂定 8）：
      尾部 capability 的 authority 进 defer_set
      run_set 中已命中 Control 不得因预算删除
11. unmatched ← false
```

Agent / 将来 Dispatcher **同一套解析**。5b 只是把本算法从查表变成程序，不另发明适用关系。

## 与 Control.applicability 的关系

两张表，允许对齐、禁止合并成一张。

| | Capability 图（本拓扑） | Control.applicability（ADR-0023） |
| --- | --- | --- |
| 问 | 现在该 **读** 哪类执行关注面？ | 现在该 **评价** 哪条保证？ |
| 消费者 | Agent read_set | gate / CI / 将来 Dispatcher run_set |
| 可空 | Capability 可不 bind Control | Control 可不对应长指令 |

共享 **facet 词汇**（trees / phase / write_boundary）为佳；不要求 id 一一对应。对齐方式仍开放（PLAN-0038 开放项 4）。

## 物理拓扑（明确后置 · Phase 5c）

Phase 5 内部切片（索引；非独立 ADR Phase）：

| 切片 | 车辆 | 做什么 |
| --- | --- | --- |
| **5a** | PLAN-0038 | 显式图 + 表征 + 薄入口指针 |
| **5b** | PLAN-0039 | Detector + 共享 `resolve` + CLI（同一张图） |
| **5c** | [PLAN-0040](../../../plans/PLAN-0040-capability-physical-projection.md)（Implemented） | `references/` / 入口文件 **按 Capability 投影**；只改 `AuthorityRef` |

```text
调用拓扑（本文件 + map）     现在（5a）
        ↓
薄入口指针消费 L4            PLAN-0038 P3
        ↓
Dispatcher 跑同一解析        PLAN-0039（5b）
        ↓
references/ 按 Capability 投影  PLAN-0040（Phase **5c** Implemented）；只改 AuthorityRef
```

未稳定前移动 `lifecycle.policy.md` 等 = **无路由拆分**（禁止）。

### Gen1 查找 vs 本图（对比裁决）

| | Generation 1（1.x / `main` 稳定产品） | 本调用拓扑（Gen2 施工权威） |
| --- | --- | --- |
| 查找模型 | 厚入口 + 目录/章节位置 + Agent 记忆与自搜 | `TaskClass` + Facet → Capability 集合 → Authority / Control |
| 「路由」实体 | **没有**独立 Task→Capability 适用图；trigger 词与目录充数 | 显式边 + 确定性解析（L4） |
| 文件角色 | 文件/章节 ≈ 能力边界（易把 lifecycle 当政策仓库） | 文件只是 `AuthorityRef` 的**当前投影**，**不是**图节点 |
| 横切能力 | 常内嵌进 lifecycle 某 Phase 小节 | 独立 Capability，由图挂到多个 Task/Facet |

结论：**不要另造第三套能力查找架构。** 5b/5c 只是把本图程序化并投影到磁盘；1.0 目录分类（按生成方式、按 lifecycle Phase 堆横切）**不得**再当查找权威。

### 5c 迁移纪律（投影时必须遵守）

1. **架构以本图为准；1.0 只提供可迁移的功能语义**（规则条文、保证、检查意图）。
2. **按 Capability 重排位置**，不按 1.0 目录树「细切开」装回旧骨架。
3. **搬家只改 `AuthorityRef`（及 INIT/生成契约中的路径）**；`always_on` / `triggers` / `facet_adds` / `binds` **不变**。边要变 → 先改 map + 表征，再搬家。
4. **横切不单挂一个 lifecycle 节点**（与 ADR-0022 目标形态一致）。
5. **禁止**在 5b 完成前启动 5c；**禁止**无 map 命中面的「对称拆文件」。

5c **不是** Phase 6（正负 oracle），也不是 PLAN-0037 extraction。

## 演进规则

- 新增 TaskClass / Capability / 边 → 先改本架构是否仍够用，再改 map 与夹具
- 新边类型 = 新研究；默认拒绝
- **禁止**平行维护第二套 Task→Capability 查找模型（与 D1「一套解析」同族）
- 本图不承担科研回溯（那是 RESEARCH-0013 的对象链，on-demand）
