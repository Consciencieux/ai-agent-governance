---
id: PLAN-0035
status: Implemented
generation: gen2
target: both
---

# PLAN-0035：Checker / Primitive Restructuring（Phase 4 checkpoint）

> （**Phase 4 EXITED** · Implemented。2026-09-10：Exit Criteria 满足；PLAN-0036 L1 已落地；P2 剩余 / #9 = deferred by design。Successor = RESEARCH-0012。Architecture checkpoint ≠ Release；Plan archive 另按 ADR-0016。）

Phase 4 的执行主体。把 Generation-1 的 **file-centric checker architecture** 转成以 **CTRL identity** 为中心的 evaluator / primitive architecture。**不是**「把 JS 整理漂亮」，**不是** Dispatcher（Phase 5），**不是**完整 invariant framework（Phase 6）。

## 背景

Phase 3（ADR-0023 / RESEARCH-0010 / CTRL-0001–0005；baseline `24021c4`）已定义 Control、binding、decision_effect 与 guarantee 投影。机械层仍是 Gen1：路径即身份、脚本即规则、monolith（FINDING-0019）与 repo→skill accidental coupling（FINDING-0001）仍在。

ADR-0018 Phase 4 = Checker / Primitive restructuring。CTRL-0003/0004 已证明：**一个 JS 文件可实现多条 Control**——inventory 必须以 CTRL 为主键。

## Phase 4 入口：R24 取回

PLAN-0032 R24：`payload 内嵌 Discovery Ledger（lifecycle.policy TASK 格式）` → promoted-to-next-plan，revisit = Phase 4 planning checkpoint。

**处置**：本计划不吞并该交付；建立 subordinate **PLAN-0036** 为唯一 successor ID。R24 不再只是 archive 里的 future note。

## 核心目标

```text
Control identity
        ↓
Gen1 evaluator inventory（非 scripts/ 文件清单）
        ↓
behavior characterization
        ↓
KEEP / WRAP / EXTRACT / REWRITE / RETIRE
        ↓
small primitives
        ↓
profile-specific evaluators
        ↓
stable result / evidence interface
        ↓
为 Phase 5 Dispatcher 提供可调度对象（不实现 Dispatcher）
```

## 明确不在范围

```text
Context Detector / Dispatcher / 自动适用路由     → Phase 5
每个 CTRL 的完整 positive+negative oracle 体系 → Phase 6
Review 三类拆分                                 → Phase 7
重建 mandatory blocking gates 权威              → Phase 8
正式 Release / tag / skill tarball              → 禁止（ADR-0014）
为「所有 Markdown」批量发 CTRL 编号             → 禁止；优先有 evaluator 的能力
把 Discovery Ledger payload 全文塞进本计划      → PLAN-0036
大规模 references/ / SKILL / AGENTS 物理拓扑搬家 → 禁止（ADR-0022；待 Phase 5 routing）
按「拆成很多小 Markdown」冒充架构完成           → 禁止（无路由的拆分无效）
```

## Execution context discipline（本计划操作规则）

依据 ADR-0022 Context Economy。**不是** token 框架；只约束本 Phase 4 施工读集。

**Required（默认读）：** Active Plan（本文件）· 当前 vertical 的 ADR / Control contract · target source · direct characterization tests。

**Read on ambiguity：** 被点名的 Research / 历史 Plan 片段；验证失败时再扩。

**Do not reread by default：** `PLAN-0001..0030` · 已闭合 baseline research（如 RESEARCH-0006 压缩层结论）· 与当前 vertical 无关的 ADR / checker。

**Prefer：** 同一有效上下文完成 `vertical → closure → review`；不要为 closure review 默认另开 Agent 重建整套上下文。

## 跨 Phase 施工顺序（冻结）

返工最小顺序——**先冻能力语义，再拆机械，再做路由，最后才搬文档物理拓扑**：

```text
现在
│
├─ 1. 冻结 Gen1 capability inventory（功能/语义，不是目录树）
│     mechanical：RESEARCH-0011 v3（含 check-plan-sync）
│     instruction/workflow + Pre-PLAN 压缩层：RESEARCH-0006 v7
│     旧功能不得 silently drop；新增必须有来源；重复有 disposition
│     INSTALLED scripts 反向对账 → Unaccounted = 0
│     INSTALLED instruction/workflow 反向对账 → Unaccounted = 0
│     默认不重读 PLAN-0001..0030（归档 = cold provenance）
│
├─ 1b. Baseline completeness（scripts + Pre-PLAN）✓ P9
├─ 1c. Instruction/workflow product surface 闭合 ✓ P10
│     8 sub-skills 逐能力记账 + githooks + 非 script carriers
│
├─ 2. Phase 4 mechanical restructuring（本计划主体）
│     **Phase 4 EXITED**（见 Exit Criteria）
│     **下一阶段：Phase 5 RESEARCH-0012**（Task→Capability 显式映射）
│     再据 routing 谈文档 topology — **禁止**无路由先搬家
│
├─ 3. Phase 5 applicability / routing 成型
│     **首要 = Task taxonomy → Applicable map → Authority/Leaf**
│     （不是向量搜索；不是先写 Dispatcher JS；不是先拆 Markdown 目录）
│     然后：薄入口消费 routing → Dispatcher → 由路由导出物理 topology
│     → routing-integrity 结构检查；完整正反 invariant → Phase 6
│
├─ 4. 再按 routing × capability 边界重构 SKILL / AGENTS / references topology
│     （树形由路由图导出；无路由的拆分禁止）
│
└─ 5. 更新少量 path provider / generator wiring（不重写 evaluator 核心逻辑）
```

**Phase 4 隐藏成功标准：** 以后文档拓扑变化时，应主要改 `semantics_ref` / applicability mapping / path discovery / Dispatcher / generator wiring——若必须重写 freshness 比较、translation 判定等算法，则本阶段抽象失败。

**现在不做：** `lifecycle.policy.md` / `references/` 大规模拆文件搬家。ADR-0022 已写明目录重排留待后续；无 Dispatcher 的拆分只是把大 prompt 变多小 prompt。

### Phase 5 交接命题（冻结；本计划不实施）

#### 当前到底有什么 / 没有什么

| 能力 | 当前状态 |
| --- | --- |
| 知识类型导航（Product / Research / Finding / ADR / Roadmap / Plan / Glossary） | **已有且较成熟**（`docs/README.md` canonical index + 各目录 README） |
| 当前/历史隔离 · canonical authority 指针 · Markdown 链接检索 | **已有相当一部分** |
| Agent 人工 search/grep | **可用**（不可靠当 dispatcher） |
| Task → Capability | **没有正式系统** |
| Capability → 应读哪些 instruction | **只有零散指针** |
| Applicability graph · 自动按任务加载 · Dispatcher | **未实现**（Phase 5） |
| 检索完整性机械验证（正反 invariant） | **尚未形成完整体系**（Phase 6） |

**一句话：** 现在有**知识导航系统**，没有真正意义上的**任务检索系统**。后者是 2.0 成败核心之一，但**不是 Phase 4 立刻做**。

Gen1 路径（RESEARCH-0009）仍是：`Task → Agent 读入口 → Agent 自己判断适用规则 → 自己选 sub-skill → 自己调 JS`，即 **Agent memory = dispatcher**。ADR-0022 目标：树状检索 + 图状适用关系 + 机械执行；文件拆分本身不够，必须有显式 `task → capability routing`。

#### 真正的问题与解药

真正的问题不是「平面文档」三个字，而是 Agent **没有可靠的能力地图 + 按任务检索路径**，只能扩大读取范围赌不漏规则 → token↑、attention dilution、跨位置关联失败、context budget 浪费。

**解药是 routing，不是先拆树，也不是向量/RAG。** 无路由的目录树化会变成「扫目录 → 打开 8 个小文件」，甚至更贵。治理检索要回答的是「哪些规则对任务**必须适用**」（deterministic applicability），不是「哪些文档看起来相似」（语义相似度）。

需要的最小确定性层：

```text
Task Context → Task Class → Applicable Capabilities
→ Authority / Execution Leaf → Load
（歧义时再扩大 context）
```

#### Phase 5 建设顺序（首要 ≠ Dispatcher JS）

```text
1. Task / Context taxonomy
2. Task → Applicable Capabilities map
3. Capability → Authority / Execution Leaf
4. fallback / ambiguity expansion
5. 薄入口消费 routing
6. Dispatcher 消费 applicability
7. 再重构 SKILL / AGENTS / references 物理 topology（由路由图导出）
8. routing-integrity 结构检查（route 存在、authority 存在、orphan 等）
```

示意映射（非最终权威表；Phase 5 Plan 再裁定）：

| Task / Context | 默认 applicable capabilities |
| --- | --- |
| 普通代码修改 | change hygiene · testing · evidence |
| 删除/重命名 | change hygiene · reference closure · testing |
| Git commit/push | git consent · secret protection |
| 治理规则修改 | governance protection · rule capture · consistency |
| Release | release · translation freshness · plan sync · changelog |
| Audit | validator · drift · review |
| INIT | inspection · materialization · security baseline |
| Plan task | plan lifecycle · discovery ledger |

目标形态（ADR-0022）：

```text
Task → Context/Routing → CAP-A/B/C → leaf → Control
Agent 见树；适用关系是图；关键保证落机械 Control
```

#### 文档 drift：现在更好，但不会消失

当前已能发现部分结构 drift（broken links、prompt sync、部分 version/release sync、translation freshness、protected-files 等）。下一刀 #4 broken-links 是其中一类 detector。

仍难机械发现、且未来检索系统要帮忙变成可验证结构的 drift 类：

```text
Capability / Applicability / Authority / Projection /
Routing / Coverage / Orphan / Semantic drift
```

检索系统的第二价值：不仅省 token，还把文档关系变成可自动检查的结构（route target 存在、capability 有 authority、无 orphan、无重复 canonical、task 不缺 mandatory capability、leaf 可达）。

#### Phase 5 vs Phase 6 边界

| Phase 5 负责 | Phase 6 负责 |
| --- | --- |
| 检索模型正确；route 存在；基本结构可验证；Dispatcher 能消费 | Task 正/负命中 capability；条件变化后 applicability；漏 route / orphan capability 测试会红 |
| **不要**为防 drift 提前拉整套 invariant framework | 系统性正反 invariant |

#### 与本计划的关系

```text
错误顺序：先拆 Markdown 目录 → 再想怎么找
正确顺序：能力地图（RESEARCH-0006 v7 已冻）→ Task→Applicable（Phase 5）→ 薄入口 → 由路由导出树
```

**价值排序：** Phase 4 结束后，「能力路由 + 由路由导出的文档拓扑」杠杆高于继续堆更多 checker。但 **不得**为做路由而跳过本计划已锁定的 **#4 broken-links vertical**——Phase 4 仍须证明 consistency monolith 可按 capability 拆。**现在不用创建文档搜索引擎。**

## Target: both — 同步点

| 域 | 本阶段可交付 | 同步约束 |
| --- | --- | --- |
| repo-infra | inventory / disposition / repo-only primitives；characterization tests | 按 CTRL 主键；不新建 mega-checker |
| payload | skill-side evaluator / INSTALLED 脚本重构须有 ADR-0020 边界；PLAN-0036 触碰 lifecycle.policy | Frozen Gen1 Safety Kernel 不退化；shared semantics ≠ shared implementation |

## 工作项

### 1. Gen1 mechanical inventory（CTRL-centric）— **A 完成**

权威事实库存：`docs/research/RESEARCH-0011-gen1-mechanical-control-inventory.md`（描述层；不裁决 disposition）。

行形态已落地：

```text
Control → evaluator(s) → gate/boundary → tests → profile → characterization → notes
```

种子 CTRL-0001–0005 全表 + `check-doc-consistency.js` 集群行（未批量发 CTRL）+ Safety Kernel 锚点 + repo→skill 调用面。

**施工顺序（本计划冻结）：**

```text
A Inventory          ✓（RESEARCH-0011）
B Characterization   ✓（Safety Kernel 基线快照）
C Disposition        ✓（本计划 § Disposition 表；主体 = capability/cluster/evaluator）
D Primitive extract  ✓（第一条 vertical = CTRL-0003/0004）
E Evaluator rebuild  ✓（与 D 同刀；verdict ≠ decision_effect consistency pass）
E′ Instruction inventory ✓ RESEARCH-0006 v7（P8–P10；双面 Unaccounted=0）
F Producer/Product decoupling（P3）
G PLAN-0036 Discovery Ledger
H Exit review
```

新增 CTRL 仅在 EXTRACT 独立机械能力时分配；禁止为全部 Markdown 规则编号。

### 2. Disposition（能力 / cluster / evaluator）— **C 完成**

**Disposition 主体不是整份旧 JS 文件**，而是文件内部的 capability / cluster / evaluator 面。禁止：

```text
check-doc-freshness.js → REWRITE
check-doc-consistency.js → REWRITE
```

正式取值：`KEEP | WRAP | EXTRACT | REWRITE | RETIRE`。

#### 2.1 种子 Control

| 能力面 | 归属 | Disposition | 说明 |
| --- | --- | --- | --- |
| 凭证模式表（语义） | CTRL-0001 | EXTRACT（interim in facts） | 模式表在 `secret-scan-facts.js`；长期仍须迁出 JS |
| staged diff / blob 扫描 | CTRL-0001 | EXTRACT ✓ | `scripts/lib/secret-scan-facts.js` |
| 禁模式匹配 + 不回显 | CTRL-0001 | EXTRACT ✓ | facts + CLI 不回显；evaluator 无 decision_effect |
| CLI / exit / `--json` 壳 | CTRL-0001 | WRAP ✓ | skill `scripts/check-secrets.js`；repo `repo-tools/check-secrets.js` |
| repo 与 skill 同跑一文件 | CTRL-0001 / P3 | **CLOSED** | accidental coupling 消除；共享 evaluator ≠ 同 CLI 文件 |
| consent marker 同步（cluster #8） | CTRL-0002 | EXTRACT | 机械部分；与 L0 协议分开 |
| release-manager consent 绑定 | CTRL-0002 | WRAP | 暂不拆 release-manager 本体 |
| Agent 协议路径（无 evaluator） | CTRL-0002 | KEEP | `evaluation_binding: none`；语义家仍是 git.policy |
| 文档相对代码新鲜度判断 | CTRL-0003 | EXTRACT | primitive：`compareDocFreshness`（git 日期） |
| CTRL-0003 默认 advisory 求值 | CTRL-0003 | REWRITE | **第一条 vertical**：独立 evaluator |
| 译文相对源新鲜度判断 | CTRL-0004 | EXTRACT | 可共享底层 git-date / pair 解析；**独立** translation 规则 |
| CTRL-0004 `--release-gate` deny | CTRL-0004 | REWRITE | 与 0003 分 evaluator；同文件仅过渡 WRAP |
| `check-doc-freshness.js` 文件壳 | 0003+0004 共文件 | WRAP | 拆出 primitive/evaluator 前保持 characterization；成功后 RETIRE 厚壳或薄 WRAP |
| Affected Files / 声明解析 | CTRL-0005 | EXTRACT | 稍后；不阻塞第一刀 |
| 路径规范化 / SEARCH_ROOTS | CTRL-0005 | EXTRACT | 同上 |
| plan-delivery CLI / gate 壳 | CTRL-0005 | WRAP | repo-only，边界清晰；第二批再动 |

#### 2.2 `check-doc-consistency.js` 集群（非整文件）

| Cluster | Disposition | 说明 |
| --- | --- | --- |
| #1 version / release sync | EXTRACT | shared-value sync primitive 候选 |
| #2 protected-files | EXTRACT | 枚举 vs 权威表 |
| #3 ADR status | WRAP → EXTRACT | 先保行为 |
| #4 broken links | EXTRACT ✓ **CLOSED** | CTRL-0006；`semantics_ref` = lifecycle § 相对 Markdown 链接有效性；direct evaluator tests |
| #5 numeric claims | WRAP | 脆性高；暂不优先 REWRITE |
| #6 prompt sync | EXTRACT | ADR-0008；双向 |
| #7 trilingual parity | KEEP（委托） | 已委托 `check-doc-parity.js`；consistency 仅 WRAP 入口 |
| #8 consent-cluster | EXTRACT | → CTRL-0002（见上） |
| #9 principles-index | deferred **SKIP** | 方法已由 0003/0004 + #4 证明；架构增量低；除非新理由 |
| #10 plan-status / pending-archive | WRAP | Gen1 release-archive 语义 vs ADR-0016 已知 divergence；parser 迁移另案 |
| #11 changelog coverage | WRAP → EXTRACT | release-gate 相关 |
| #12 terminology | KEEP | **已 EXTRACT** → `repo-tools/check-terminology.js`（先例） |

**第一刀不做 consistency monolith。** 集群表只定方向；实施排在 CTRL-0003/0004 vertical 之后。

#### 2.3 第一条真实 vertical refactor（授权下一步 D/E）

```text
Gen1: scripts/check-doc-freshness.js
        ↓ characterization（已有 docs.test.js）
shared lower primitives（git date / path pairs / …）
      ↙                         ↘
CTRL-0003 evaluator           CTRL-0004 evaluator
（default advisory）           （--release-gate deny）
        ↓
旧文件壳 WRAP → 验证等价 → 再薄化 / RETIRE 厚逻辑
```

成功标准（本 vertical，非整 Phase 4 exit）：

1. 两个 Control 可分别描述/调用（至少文档级 contract + 可测入口；无 Dispatcher）。
2. 共享下层 primitive，禁止复制两份 git-date 逻辑。
3. `docs.test.js` freshness / translation 例旧红旧绿不变；Safety Kernel 不退化。
4. 不顺便拆 `check-doc-consistency.js`。

#### 2.4 明确延后

```text
consistency 集群落地 EXTRACT     → 0003/0004 vertical 之后
CTRL-0001 语义迁出 + P3 解耦     → 第二批（Security Kernel 敏感）
CTRL-0005 深拆                   → 第三批
PLAN-0036 lifecycle Ledger       → G（可并行文档，不挡第一刀）
machine-readable Control 文件    → P4 deferred
```

### 3. Primitive → Evaluator

```text
Primitive = 小而纯的机械事实判断（不知 Phase/Roadmap/Agent）
Evaluator = 针对某 CTRL × profile，组合 primitive 并产出结果
```

### 4. Evaluator contract（无 Dispatcher）

允许直接调用 evaluator 得到稳定概念结果，例如：

```text
evaluated control
applicable / not-applicable
pass / fail / indeterminate
evidence
```

禁止实现 context → auto-select controls → auto-invoke。

### 5. Producer/Product 机械耦合

继续处理 FINDING-0001 残留（terminology 已分离）。每个 `repo → INSTALLED scripts/foo.js` 问：合法共享实现，还是 accidental？对应 KEEP / WRAP / EXTRACT / 双实现。

### 6. R24 → PLAN-0036

本 checkpoint 只负责跟踪 subordinate 完成；不在本文件展开 lifecycle.policy 施工细节。

### 7. 测试 = characterization

重构前后同 fixture 同 fail/pass。不提前建设 Phase 6 invariant framework。

## 完成条件

1. Gen1 mechanical controls 已按 CTRL identity inventory，不以 JS 文件为主分类键。
2. 纳入范围的 evaluator/能力均有 KEEP/WRAP/EXTRACT/REWRITE/RETIRE disposition。
3. `check-doc-consistency.js` 等 monolith 已按 Control/primitive 边界开始拆解，且无新 mega-checker。
4. repo/skill evaluator ownership 不再依赖未解释的 accidental working-tree coupling；未完成项有显式 successor/disposition。
5. 重构后的 evaluator 有稳定、可测试的结果接口；为 Phase 5 提供调用面，**未**实现 Dispatcher。
6. Gen1 behavior characterization 保持；Refactor Safety Kernel（security / generator / payload）不退化。
7. R24 已取回且 successor = PLAN-0036（本入口已满足；PLAN-0036 自身完成条件另计）。
8. Discovery Ledger：Open = 0；Unaccounted = 0。
9. 未进入 Phase 5 Dispatcher、Phase 6 invariant framework、Phase 8 blocking-gate rebuild；无 release tag。

## 受影响文件

- `docs/plans/PLAN-0035-checker-primitive-restructuring.md` —— 本计划
- `docs/research/RESEARCH-0011-gen1-mechanical-control-inventory.md` —— CTRL-centric 事实库存
- `docs/plans/PLAN-0036-payload-discovery-ledger.md` —— R24 subordinate
- `docs/plans/archive/PLAN-0034-governance-core-rule-model.md` —— Phase 3 归档
- `docs/plans/archive/PLAN-0032-…` —— R24 取回注记
- `docs/plans/roadmap/{en,zh-CN,zh-TW}.md` —— Current Phase → 4
- 执行期将触及：`scripts/*.js`、`repo-tools/*.js`、`tests/**`（须 characterization）；**不**为本计划预先授权拆 `lifecycle.policy`（归 PLAN-0036）

## 验证方法

1. Migration Mode：Safety Kernel blocking；Gen1 full check observational。
2. Inventory 表以 CTRL 为行键，可指出共文件多 Control（至少 0003/0004）。
3. 每个 EXTRACT/REWRITE 有 before/after characterization 证据。
4. 权威矩阵：不把 Phase 5/6 工作写进本计划完成条件。

## 发现台账（Discovery Ledger）

| 标识（ID） | 来源 | 问题 | 范围 | 状态 | 处置 | 证据 |
| --- | --- | --- | --- | --- | --- | --- |
| P0 | PLAN-0032 R24 | payload Discovery Ledger 须有 successor | skill | closed | resolved | PLAN-0036 Implemented（L1） |
| P1 | ADR-0023 | CTRL-centric mechanical inventory 未建 | both | closed | resolved | RESEARCH-0011 v1 |
| P2 | FINDING-0019 | meta-checker monolith 未按 Control 拆 | both | open | in-progress | **#4 CLOSED**；**SKIP #9**；其余 cluster 延后 |
| P3 | FINDING-0001 | accidental repo→skill script 依赖残留 | both | closed | resolved | CTRL-0001：repo-tools CLI + shared facts/evaluator；AGENTS → repo-tools |
| P4 | ADR-0023 E4 | 独立 machine-readable Control 文件 | both | closed | deferred（revisit: 第二个真实机器 consumer） | ADR-0023 决策 6 |
| P5 | PLAN-0035 | characterization 基线尚未冻结 | both | closed | resolved | RESEARCH-0011：security 35/35 · generator 33/33 · payload 42/42（2026-09-10） |
| P6 | PLAN-0035 C | Disposition 表未裁定 | both | closed | resolved | 本计划 § 2 Disposition |
| P7 | PLAN-0035 D/E | CTRL-0003/0004 第一条 vertical | both | closed | resolved | 结构拆分 + require closure + **verdict/binding 分离**；docs/Safety Kernel 再绿 |
| P8 | ADR-0022 / PLAN-0035 | Gen1 instruction/workflow capability 压缩层 | both | closed | resolved | RESEARCH-0006 v5→v7 |
| P9 | PLAN-0035 / RESEARCH-0006 | Baseline completeness：scripts + Pre-PLAN | both | closed | resolved | check-plan-sync 等；INSTALLED scripts Unaccounted=0 |
| P10 | PLAN-0035 / RESEARCH-0006 | Instruction/workflow product surface 闭合 | both | closed | resolved | 8 sub-skills + githooks + 非 script carriers；RESEARCH-0006 v7 |

## 闭包对账（进行中）

```text
Total known:  11
Resolved:     9  (P0, P1, P3, P5, P6, P7, P8, P9, P10)
Deferred:     1  (P4)
Open:         1  (P2 其余 consistency clusters 延后 — **不阻塞 Phase 4 exit**；SKIP #9)
Unaccounted:  0
PLAN-0036 L1: Implemented（契约落地；L2 deferred=门禁机械化）
```

## Phase 4 Exit Criteria（权威完成条件）

Phase 4 目标是 **验证 Gen2 extraction pattern 并建立机械边界**，**不是**一次拆光所有旧 checker。`check-doc-consistency.js` 仍有内联集群 ≠ Phase 4 未完成。

```text
Required:
✓ Capability baseline complete（scripts + instruction/workflow Unaccounted=0）
✓ Control vertical extraction proven（CTRL-0003/0004 + CTRL-0006）
✓ Primitive / evaluator / binding separation proven
✓ Repo / skill implementation boundary separated（CTRL-0001）
✓ Legacy entrypoints preserved（CLI / exit / JSON characterization）
✓ Context Economy discipline recorded（ADR-0022）
✓ Discovery Ledger L1 exists（PLAN-0036）
✓ Safety Kernel green（security / generator / payload）
✓ Unaccounted capability on closed surfaces = 0

Deferred by design（不是遗漏）:
- remaining consistency clusters（P2 remainder）
- #9 principles-index（SKIP）
- Task→Capability routing / Dispatcher     → Phase 5
- document topology migration              → after routing
- automation expansion（auto-discovery / dashboard / Unaccounted gate）
- full invariant oracle framework          → Phase 6
```

## Phase 4 exit review（2026-09-10）

| 检查项 | 状态 |
| --- | --- |
| Exit Criteria Required 全项 | ✓ |
| Deferred by design 已显式记录 | ✓ |
| Dispatcher / 文档 topology / Phase 6 / 自动发现 | **未偷跑** |
| Open blocker | **无** |

**Completion marker：** Phase 4 checkpoint = **EXITED**（`status: Implemented`）。

**Successor：** `docs/research/RESEARCH-0012-task-capability-routing.md` — 先建 Task/Context → Applicable Capability → Authority → Execution Leaf 显式映射；**禁止**先搬 Markdown 树、禁止万能图谱、禁止全自动 Dispatcher。

下一步（锁定）：
1. 推进 RESEARCH-0012（显式 applicability map）；稳定后再开 Phase 5 Plan；
2. 再决定 AGENTS/SKILL 薄化与 references 树化；
3. 保持：Control 是最后手段；Ledger 只收高价值发现；不把所有规则 object 化。

## 参考

- 阶段顺序：ADR-0018
- Migration：ADR-0014
- Control Model：ADR-0023 · RESEARCH-0010
- Producer/Product：ADR-0020
- Known-Issue Closure：ADR-0021 · PLAN-0036
- Phase 3 archive：PLAN-0034；baseline `24021c4`
- R24 来源：PLAN-0032
- 机械库存：RESEARCH-0011
- 迁移演化模型：RESEARCH-0004 v3
