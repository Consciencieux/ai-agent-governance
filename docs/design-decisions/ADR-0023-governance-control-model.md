---
id: ADR-0023
status: Accepted
generation: gen2
---

# ADR-0023：Governance Control Model


## 背景

Phase 1（ADR-0020）已经规定：共享语义只能有一个权威 owner；repo 与 skill 是 consumer；`owner: core` 只是概念词汇。Phase 2 收口了知识对象模型，但「一条治理控制到底是什么」仍散落在 Markdown、JS、CI 与测试里（RESEARCH-0001 / RESEARCH-0010）。

若把 Control Model 继续塞进 ADR-0020 或 ADR-0022 的 amendment，会把 ownership 边界、指令架构与规则对象三种决策混在同一文件。本 ADR 是 Phase 3 的规范载体：定义 Control，规定最小 canonical 表示，裁定 identity / profile / evaluator / evidence / decision 关系，并声明 **Control Model（schema）权威**落点——不是每条 Control 的规则语义正文家。系统描述见 RESEARCH-0010。

本 ADR **不**授权拆 Gen1 checker、不实现 Dispatcher、不移动 `references/` 政策单体。

## 决策

**1. Control 是一级架构对象。** 一条 Control 是可引用的治理义务及其绑定关系，不是 policy 文件、不是 checker、不是 `npm` script、也不是测试用例。

**2. 四层必须分开。**

```text
Rule semantics  ≠  evaluator  ≠  gate  ≠  test
```

- **Rule semantics**：必须成立的义务 / invariant。只能有一个 authoritative owner（由该 Control 的 `semantics_ref` 指向；**不是**本 ADR 正文）。
- **Evaluator**：某个 profile 用来检查该义务的机制（JS、hook、人工步骤、暂缺）。
- **Gate**：工作流上对一个或多个 evaluator 的编排（`npm run check:*`、CI job、release step）。Gate 不是 Control 的属性。
- **Test**：验证 evaluator（或 gate 接线）是否仍实现其声称行为。测试 **不得** 成为第二份语义权威；复制正则 / 复制义务原文即视为缺陷。

**3. Identity 稳定。** 每条 Control 分配永久 `CTRL-xxxx`（ADR-0018 § 决策 3：类型内 max+1，不复用）。Identity 不随文件移动、脚本拆分或 profile 增减而改变。归档一条**计划**或弃用一个**脚本**，都不自动废弃 Control（ADR-0019：Plan archived ≠ control obsolete）。

**4. Canonical slots（serialization-agnostic；不是 YAML 键清单）。** 字段必须由真实 consumer 或核心语义需求证明存在。英文 token 是 slot id，**不是**承诺的序列化键名。Phase 3 完成的是 **conceptual slot model**，不是 machine-readable 文件。

Control 本体必填：

| Slot | 含义 |
| --- | --- |
| `identity` | `CTRL-xxxx` |
| `semantics_ref` | 指向该 Control **规则语义**的唯一权威（文件 + 节；若如今只在 JS，标 interim，待迁出） |
| `applicability` | 给定 context 时是否适用的陈述（任务类 / 树 / 阶段 / 工件）。陈述即可，不要路由器。 |
| `evaluation_binding` | 一个或多个绑定记录（见下）——**不是**单一 evaluator 路径字符串 |

每条 `evaluation_binding` 记录（profile × evaluator × enforcement）：

| 子项 | 含义 |
| --- | --- |
| `profile` | `repo` / `skill`（或显式单域） |
| `evaluator` | 机制引用，或 `none`（纯 guidance） |
| `enforcement_boundary` | 调用面：例如 local default、`--gate`、`--release-gate`、CI job、pre-commit hook、release step |
| `decision_effect` | 在该 boundary 上的效果：`advisory` / `warn` / `deny` / `require-review` |

> **Decision 不是 Control 的单值 intrinsic。** `deny` / `warn` / `advisory` 由「同一 Control × profile × enforcement boundary」共同决定。把 `--gate` / `--release-gate` 写成 Control 级必填字段，会把 Gate 塞回 Control（与决策 2 冲突）。垂直切片里曾用的 `decision_expectation` 单值写法由本条 supersede。

Control 可选（有 consumer 才写）：

| Slot | 何时需要 |
| --- | --- |
| `evidence_expectation` | 已有 `--json` / 报告对象，或 CONTROL-X 需要共享 fixture 形状 |
| `profile_consumers` | 便于发现的多 profile 摘要；权威仍以 `evaluation_binding` 为准 |
| `control_version` | 仅当同一 identity 的**规则语义**发生不兼容澄清 |

**禁止**把 `guarantee_level` 建成 Control intrinsic slot。Guarantee（Roadmap L0–L3）是 **derived projection**：

```text
Control × profile × evaluator × enforcement_boundary  →  L0 / L1 / L2 / L3
```

同一 Control 可以同时：local = L1、CI = L2、runtime = 暂无。Phase 8 重建 blocking authority 依赖此分解；单值 `guarantee_level` 无法表达。切片表里的「忘记 Markdown」栏是投影说明，不是 schema 字段。

禁止作为核心 slot 预建：`title`/`name` 双字段、`category`、`tags`、`priority`、`severity`、`owner: core` 作为机器字段、`dependencies` 图、`exceptions` 语言、Control 级单值 `decision_expectation`、Control 级单值 `guarantee_level`。所有权继续用 ADR-0020 的 semantic owner / consumer / implementation，不在此重复编码。

**5. Profile 表达。** 共享语义只定义一次（`semantics_ref`）。repo 与 skill 通过各自的 `evaluation_binding` 消费。禁止：

```text
shared semantics  →  强制同一 JS 文件
同一 JS 文件      →  推断为同一 Control
```

CONTROL-X（ADR-0020）仅适用于「两 profile 都有实现」的 Control：同一 canonical negative fixture 打两侧 evaluator。Phase 3 只要求模型能指向该契约；不实现 runner。

**6. Control Model / schema authority 与物理家。**

两类权威必须分开：

```text
Control Model / schema authority（本 ADR）
  = 「什么是 Control、有哪些 slot、identity 规则、binding 怎么写」
  = 本 ADR + 下方「Phase 3 slot model」节

Rule semantics authority（每条 Control）
  = 该 Control 的 semantics_ref 所指向的文件/节
  = 例如 CTRL-0002 → git.policy.md § 确认范围
  = 例如 CTRL-0001 → interim JS（待迁出）

Machine-readable 独立序列化文件
  = 尚未授权（第二个真实机器 consumer 出现后再定）
```

本 ADR **不是**所有 CTRL 规则语义的正文家。不得因为现有目录叫 `references/` 就把序列化 schema 放进 payload。不得因为目标架构图里有 Governance Core 就新建 `governance-core/` / `controls/` / `rules/`。物理包装等出现**第二个真实机器 consumer**（Dispatcher、CONTROL-X runner、或生成器）再由后续 ADR / Plan 授权。AGENTS / SKILL 若提及本模型，只放指针。

**7. Applicability 可陈述、不自动路由。** Phase 3 证明：给定一个书面 context，能判断某 Control 是否适用。禁止实现 `context detector → dispatcher → evaluator selection`。

**8. Gen1 JS 的地位。** 现有 checker 是 behavior specimen / characterization baseline / 未来 primitive 候选。本 ADR 不改变其代码路径。Phase 4 才做 KEEP / WRAP / EXTRACT / REWRITE / RETIRE。

**9. Vertical slice（表达力证明，非迁移）。** 下列 identity 现在分配，作为本阶段目录种子；不表示已从 Gen1 迁出。binding 表按决策 4 书写；`guarantee` 列为派生投影。

### CTRL-0001 Secret protection

| Slot / 投影 | Phase 3 记录 |
| --- | --- |
| semantics_ref | interim：义务「staged 内容不得含凭证类材料」目前住在 `scripts/check-secrets.js` 模式表；**JS 不是长期语义家** |
| applicability | 将产生 git commit / 检查暂存区时 |
| evaluation_binding | skill × `scripts/check-secrets.js` × local/pre-commit → deny（不回显秘密）；repo × 同一脚本 × 预提交手动调用 → deny——**共享文件是实现耦合，不是模型胜利** |
| guarantee（派生） | hook/清单调用存在 → 偏 L1；仅 AGENTS 提醒 → L0 |
| test | 测 evaluator 行为；禁止把模式表再抄进测试当第二权威 |

### CTRL-0002 Git write consent

| Slot / 投影 | Phase 3 记录 |
| --- | --- |
| semantics_ref | **规则语义权威**：`references/policies/git.policy.md` § 确认范围。`AGENTS.md` § Git Operation Safety Protocol 是 repo 入口指针/投影，不得作第二权威（现状 duplicated；本 ADR 定家，不在本阶段合并正文） |
| applicability | 任何 git 写操作（按该节分类） |
| evaluation_binding | repo/skill × consent cluster / release-manager × 已编码同步点 → deny；repo/skill × `none`（Agent 遵守） × 协议路径 → require-review / 不得执行（L0） |
| guarantee（派生） | 机械覆盖点偏 L1；协议主体 L0 |
| CONTROL-X | 候选；Phase 3 不实现 fixture runner |

### CTRL-0003 Governance-document freshness（相对代码活动）

| Slot / 投影 | Phase 3 记录 |
| --- | --- |
| semantics_ref | interim：`scripts/check-doc-freshness.js` 中「治理文档相对代码活动过旧」 |
| applicability | 文档/代码变更后的日常检查；被治理项目视其是否有对应文档树 |
| evaluation_binding | 按 profile 分写（不合并 `both`）：× `check-doc-freshness.js` × 默认调用 → advisory（不得称为 blocking） |
| guarantee（派生） | 默认路径偏 L0/L1-advisory；无 release 阻断 |
| 身份课 | **不得**与 CTRL-0004 或「有 freshness 脚本」划等号 |

### CTRL-0004 Translation freshness

| Slot / 投影 | Phase 3 记录 |
| --- | --- |
| semantics_ref | interim：同一脚本内「译文不得落后源 / 不得带 draft 进入 release-gate」 |
| applicability | 三语文档树；release 或等价 release-gate 边界 |
| evaluation_binding | repo（及有对等译文树的 skill）× `check-doc-freshness.js` × `--release-gate` / release step → deny |
| guarantee（派生） | 仅在 release-gate / release 边界偏 L2；默认日常检查不适用本 Control 的 deny |
| 与 CTRL-0003 | 共享 evaluator 文件，**两个 Control** |

### CTRL-0005 Plan delivery

| Slot / 投影 | Phase 3 记录 |
| --- | --- |
| semantics_ref | interim：`repo-tools/check-plan-delivery.js` 头注释「声明必须兑现」；计划格式在 lifecycle / plans README |
| applicability | 本仓库 TASK plan 交付对账 |
| evaluation_binding | repo × `check-plan-delivery.js` × 默认 → advisory；× `--gate` / `check:all` / skill-release 步骤 → deny |
| guarantee（派生） | 进入 gate/release 步骤时偏 L1；默认 advisory 偏 L0 |

**10. 入口。** Control 正文不写入 `AGENTS.md` / `SKILL.md`。索引可增加指向本 ADR 的一行。完整入口瘦身仍受 ADR-0022 约束：无叶节点路由不得拆厚入口。叶节点路由**不是**本 ADR 的完成条件（属后续；见 PLAN-0034 E1）。

## 后续修正（2026-09-10）：Control Model consistency pass

本修正是对首版决策 4 / 6 / 切片表写法的 **Narrow amendment**（同一日历日）。首版若仍把 `decision_expectation` / `guarantee_level` 写成 Control 级单值、或把本 ADR 称作「Canonical semantic owner」，以本文件当前决策 4–6 与切片表为准。

四个问题的裁决：

```text
1. ADR-0023 = Control Model / schema authority
   每条 Control 的规则语义权威 = 其 semantics_ref
2. decision_effect = profile × enforcement_boundary binding 的结果
   不是 Control intrinsic 单值
3. guarantee_level = derived projection
   不是 Control intrinsic metadata
4. Phase 3 = serialization-agnostic canonical slot model
   ≠ machine-readable serialization（后者未授权，见决策 6）
```

## 被否决的方案

- 在 ADR-0020 上继续 amendment 充当 Rule Registry。
- Phase 3 写出完整 YAML（id/name/title/category/tags/…）。
- 新建 `docs/plans/completed/` 式的 Control 中间目录或 `governance-core/`。
- 用 `scope: both` 作为机器字段。
- 把 `check-doc-freshness.js` 登记成单条 Control。
- 本阶段实现 Dispatcher 或拆 checker。
- 把本 ADR 当作所有 CTRL 规则语义的正文家。
- 把 gate flag（`--gate` / `--release-gate`）建成 Control 级必填单值字段。
- 把 L0–L3 建成 Control 级单值 `guarantee_level`。

## 后果

- Phase 3 的权威答案：「什么是 Control / 哪些 slot 必填 / identity 是否稳定 / binding 怎么写 / Model 家在哪」→ 本 ADR。
- 「某条 Control 的义务正文在哪」→ 该 Control 的 `semantics_ref`，不是本 ADR。
- ADR-0020 的字段名预告（`applies_when` / `evaluator` / `effect` 等）不再生效；由本 ADR 的 slot 集合取代。概念「单一 shared semantic authority + consumer profiles」保留。
- 下一批 identity 从 `CTRL-0006` 起分配；禁止为了「目录好看」重排 0001–0005；consistency pass **不**新增 CTRL。
- FINDING-0001 仍未 Resolved：本 ADR 定了 consent 的语义家，但未消除 AGENTS 双写，也未拆除 repo→skill 脚本依赖。
- Phase 4 的输入是：按 Control 而不是按文件做 inventory。
- Phase 8 可按 boundary 提升同一 Control 的 guarantee 投影，无需改 identity。

## Phase 3 slot model（权威落点）

本文件 § 决策 4（slot + binding）+ § 决策 9（CTRL-0001–0005）即为 Phase 3 唯一 **serialization-agnostic** slot model。没有第二个并列文件。独立机器序列化未授权。

## 参考

- 系统模型：RESEARCH-0010
- Producer/Product：ADR-0020
- 指令架构：ADR-0022
- 阶段顺序：ADR-0018
- 能力基线 / ownership：RESEARCH-0006
- 施工计划：PLAN-0034
