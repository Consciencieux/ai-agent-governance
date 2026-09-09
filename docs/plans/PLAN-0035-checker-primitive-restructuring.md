---
id: PLAN-0035
status: Active
generation: gen2
target: both
---

# PLAN-0035：Checker / Primitive Restructuring（Phase 4 checkpoint）

> （进行中。2026-09-10：C Disposition 表已裁定；第一刀 vertical = CTRL-0003/0004。**未改 JS。** Architecture checkpoint ≠ Release。）

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
```

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
A Inventory          ← 完成（RESEARCH-0011）
B Characterization   ← 完成（Safety Kernel 基线快照）
C Disposition        ← 完成（本计划 § Disposition 表；主体 = capability/cluster/evaluator）
D Primitive extract  ← 下一步：第一条 vertical = CTRL-0003/0004
E Evaluator rebuild（CTRL × profile；稳定结果接口；无 Dispatcher）
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
| 凭证模式表（语义） | CTRL-0001 | EXTRACT | 迁出 JS；长期 semantics_ref 不得住在 evaluator |
| staged diff / blob 扫描 | CTRL-0001 | EXTRACT | primitive：`scanStagedDiff` / 可读 blob |
| 禁模式匹配 + 不回显 | CTRL-0001 | EXTRACT | primitive：`matchForbiddenPattern` |
| CLI / exit / `--json` 壳 | CTRL-0001 | WRAP → REWRITE | 先 WRAP 保 Safety Kernel；再定 evaluator contract |
| repo 与 skill 同跑一文件 | CTRL-0001 / P3 | WRAP（过渡） | accidental coupling；primitive 共享后 profile 可分 evaluator——**不**把同文件当目标 KEEP |
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
| #4 broken links | EXTRACT | 可独立；非第一刀 |
| #5 numeric claims | WRAP | 脆性高；暂不优先 REWRITE |
| #6 prompt sync | EXTRACT | ADR-0008；双向 |
| #7 trilingual parity | KEEP（委托） | 已委托 `check-doc-parity.js`；consistency 仅 WRAP 入口 |
| #8 consent-cluster | EXTRACT | → CTRL-0002（见上） |
| #9 principles-index | EXTRACT | 指针存在性 |
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
| P0 | PLAN-0032 R24 | payload Discovery Ledger 须有 successor | skill | closed | resolved | PLAN-0036 Active |
| P1 | ADR-0023 | CTRL-centric mechanical inventory 未建 | both | closed | resolved | RESEARCH-0011 v1 |
| P2 | FINDING-0019 | meta-checker monolith 未按 Control 拆 | both | open | in-progress | C 集群 disposition 已定；**实施延后**于 CTRL-0003/0004 vertical |
| P3 | FINDING-0001 | accidental repo→skill script 依赖残留 | both | open | in-progress | CTRL-0001 WRAP 过渡；F 批处理 |
| P4 | ADR-0023 E4 | 独立 machine-readable Control 文件 | both | closed | deferred（revisit: 第二个真实机器 consumer） | ADR-0023 决策 6 |
| P5 | PLAN-0035 | characterization 基线尚未冻结 | both | closed | resolved | RESEARCH-0011：security 35/35 · generator 33/33 · payload 42/42（2026-09-10） |
| P6 | PLAN-0035 C | Disposition 表未裁定 | both | closed | resolved | 本计划 § 2 Disposition |
| P7 | PLAN-0035 D/E | CTRL-0003/0004 第一条 vertical 未做 | both | open | in-progress | § 2.3 授权；**下一步改代码** |

## 闭包对账（进行中）

```text
Total known:  8
Resolved:     4  (P0, P1, P5, P6)
Deferred:     1  (P4)
Open:         3  (P2 延后实施, P3, P7 第一刀)
Unaccounted:  0
```

下一步：**D/E — CTRL-0003 + CTRL-0004 vertical refactor**（不动 consistency monolith）。

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
