---
id: PLAN-0035
status: Active
generation: gen2
target: both
---

# PLAN-0035：Checker / Primitive Restructuring（Phase 4 checkpoint）

> （进行中。2026-09-10：A inventory + B Safety Kernel 基线已冻结（RESEARCH-0011）；下一步 C disposition。Architecture checkpoint ≠ Release。）

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
C Disposition        ← 下一步：KEEP/WRAP/EXTRACT/REWRITE/RETIRE（按能力/cluster，非整文件）
D Primitive extract
E Evaluator rebuild（CTRL × profile；稳定结果接口；无 Dispatcher）
F Producer/Product decoupling（P3）
G PLAN-0036 Discovery Ledger
H Exit review
```

新增 CTRL 仅在 EXTRACT 独立机械能力时分配；禁止为全部 Markdown 规则编号。

### 2. Disposition（能力 / primitive / evaluator，不是整文件一句）

对每个纳入范围的机械能力正式使用：

```text
KEEP | WRAP | EXTRACT | REWRITE | RETIRE
```

`check-doc-consistency.js` 等 monolith 预期拆成多 disposition（cluster → EXTRACT / RETIRE / repo-only / skill / wrapper），禁止 `REWRITE whole file` 变成下一个 mega-checker。

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
| P2 | FINDING-0019 | meta-checker monolith 未按 Control 拆 | both | open | in-progress | RESEARCH-0011 集群表；待 C disposition → D/E |
| P3 | FINDING-0001 | accidental repo→skill script 依赖残留 | both | open | in-progress | RESEARCH-0011 § repo→skill；CTRL-0001 已标 |
| P4 | ADR-0023 E4 | 独立 machine-readable Control 文件 | both | closed | deferred（revisit: 第二个真实机器 consumer） | ADR-0023 决策 6 |
| P5 | PLAN-0035 | characterization 基线尚未冻结 | both | closed | resolved | RESEARCH-0011：security 35/35 · generator 33/33 · payload 42/42（2026-09-10） |

## 闭包对账（进行中）

```text
Total known:  6
Resolved:     3  (P0, P1, P5)
Deferred:     1  (P4)
Open:         2  (P2, P3)
Unaccounted:  0
```

下一步：**C Disposition**（按 CTRL / cluster，非整文件），再进入 D/E；P3 与 F 并行跟踪。

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
