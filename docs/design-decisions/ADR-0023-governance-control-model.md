---
id: ADR-0023
status: Accepted
generation: gen2
---

# ADR-0023：Governance Control Model


## 背景

Phase 1（ADR-0020）已经规定：共享语义只能有一个权威 owner；repo 与 skill 是 consumer；`owner: core` 只是概念词汇。Phase 2 收口了知识对象模型，但「一条治理控制到底是什么」仍散落在 Markdown、JS、CI 与测试里（RESEARCH-0001 / RESEARCH-0010）。

若把 Control Model 继续塞进 ADR-0020 或 ADR-0022 的 amendment，会把 ownership 边界、指令架构与规则对象三种决策混在同一文件。本 ADR 是 Phase 3 的规范载体：定义 Control，规定最小 canonical 表示，裁定 identity / profile / evaluator / evidence / decision 关系，并声明语义权威落点。系统描述见 RESEARCH-0010。

本 ADR **不**授权拆 Gen1 checker、不实现 Dispatcher、不移动 `references/` 政策单体。

## 决策

**1. Control 是一级架构对象。** 一条 Control 是可引用的治理义务及其绑定关系，不是 policy 文件、不是 checker、不是 `npm` script、也不是测试用例。

**2. 四层必须分开。**

```text
Rule semantics  ≠  evaluator  ≠  gate  ≠  test
```

- **Rule semantics**：必须成立的义务 / invariant。只能有一个 authoritative owner。
- **Evaluator**：某个 profile 用来检查该义务的机制（JS、hook、人工步骤、暂缺）。
- **Gate**：工作流上对一个或多个 evaluator 的编排（`npm run check:*`、CI job、release step）。
- **Test**：验证 evaluator（或 gate 接线）是否仍实现其声称行为。测试 **不得** 成为第二份语义权威；复制正则 / 复制义务原文即视为缺陷。

**3. Identity 稳定。** 每条 Control 分配永久 `CTRL-xxxx`（ADR-0018 § 决策 3：类型内 max+1，不复用）。Identity 不随文件移动、脚本拆分或 profile 增减而改变。归档一条**计划**或弃用一个**脚本**，都不自动废弃 Control（ADR-0019：Plan archived ≠ control obsolete）。

**4. Canonical slots（最小集；不是 YAML 键清单）。** 字段必须由真实 consumer 或核心语义需求证明存在。Phase 3 只承认下列 **slot**（英文 token 是 slot id，不是承诺的序列化键名）：

必填：

| Slot | 含义 |
| --- | --- |
| `identity` | `CTRL-xxxx` |
| `semantics_ref` | 指向唯一权威语义（文件 + 节；若语义如今只存在于 JS，必须标为 interim，并视为待迁出） |
| `applicability` | 给定 context 时是否适用的陈述（任务类 / 树 / 阶段 / 工件）。陈述即可，不要路由器。 |
| `evaluation_binding` | 每个适用 profile 的 evaluator 引用，或显式 `none`（纯 guidance） |
| `decision_expectation` | 默认与加重模式（advisory / warn / deny / require-review；以及 `--gate` / `--release-gate` 若已存在） |

可选（有 consumer 才写）：

| Slot | 何时需要 |
| --- | --- |
| `evidence_expectation` | 已有 `--json` / 报告对象，或 CONTROL-X 需要共享 fixture 形状 |
| `guarantee_level` | 需要回答「忘记 Markdown 之后还剩什么」（对齐 Roadmap L0–L3 **投影**，不是宣称已有 L3 runtime） |
| `profile_consumers` | 非单 profile 时列出 `repo` / `skill` |
| `control_version` | 仅当同一 identity 的语义发生不兼容澄清 |

禁止作为核心 slot 预建：`title`/`name` 双字段、`category`、`tags`、`priority`、`severity`、`owner: core` 作为机器字段、`dependencies` 图、`exceptions` 语言。所有权继续用 ADR-0020 的 semantic owner / consumer / implementation，不在此重复编码。

**5. Profile 表达。** 共享语义只定义一次（`semantics_ref`）。repo 与 skill 通过 `profile_consumers` + 各自的 `evaluation_binding` 消费。禁止：

```text
shared semantics  →  强制同一 JS 文件
同一 JS 文件      →  推断为同一 Control
```

CONTROL-X（ADR-0020）仅适用于「两 profile 都有实现」的 Control：同一 canonical negative fixture 打两侧 evaluator。Phase 3 只要求模型能指向该契约；不实现 runner。

**6. 语义权威落点与物理家。**

```text
Canonical semantic owner（Phase 3）
  = 本 ADR
  + 下方「Phase 3 schema 草案」节（slot 记录）

Machine-readable 独立文件
  = 尚未授权
```

不得因为现有目录叫 `references/` 就把 schema 放进 payload。不得因为目标架构图里有 Governance Core 就新建 `governance-core/` / `controls/` / `rules/`。物理包装（将来是 repo-only 目录、生成投影、或 INSTALLED 只读清单）等出现**第二个真实机器 consumer**（Dispatcher、CONTROL-X runner、或生成器）再由后续 ADR / Plan 授权。AGENTS / SKILL 若提及本模型，只放指针。

**7. Applicability 可陈述、不自动路由。** Phase 3 证明：给定一个书面 context，能判断某 Control 是否适用。禁止实现 `context detector → dispatcher → evaluator selection`。

**8. Gen1 JS 的地位。** 现有 checker 是 behavior specimen / characterization baseline / 未来 primitive 候选。本 ADR 不改变其代码路径。Phase 4 才做 KEEP / WRAP / EXTRACT / REWRITE / RETIRE。

**9. Vertical slice（表达力证明，非迁移）。** 下列 identity 现在分配，作为本阶段目录种子；不表示已从 Gen1 迁出。

### CTRL-0001 Secret protection

| Slot | Phase 3 记录 |
| --- | --- |
| semantics_ref | interim：义务「staged 内容不得含凭证类材料」目前住在 `scripts/check-secrets.js` 模式表；**JS 不是长期语义家** |
| applicability | 将产生 git commit / 检查暂存区时 |
| profile_consumers | skill（INSTALLED 脚本）；repo（预提交调用同一脚本，accidental shared implementation） |
| evaluation_binding | 两侧目前均指向 `scripts/check-secrets.js`——这是实现耦合，不是模型胜利 |
| decision_expectation | 命中 → deny（exit 1）；不得回显秘密 |
| guarantee_level | 调用链存在时偏 L1；仅文档提醒时 L0 |
| 忘记 Markdown | hook / 发布清单仍调用则仍拦；只靠 AGENTS 一句则无 |
| test | 必须测 evaluator 行为；禁止把模式表再抄进测试当第二权威 |

### CTRL-0002 Git write consent

| Slot | Phase 3 记录 |
| --- | --- |
| semantics_ref | 指定唯一家：`references/policies/git.policy.md` § 确认范围。`AGENTS.md` § Git Operation Safety Protocol 是 repo 入口**指针或投影**，不得作为第二权威（现状 duplicated，FINDING-0001 残留；本 ADR 定家，不在本阶段合并正文） |
| applicability | 任何 git 写操作（commit/push/tag/reset/… 按该节分类） |
| profile_consumers | repo, skill |
| evaluation_binding | 部分机械（consent cluster / release-manager）；其余 `none`（Agent 遵守） |
| decision_expectation | 无确认则不得执行所覆盖的写序列 |
| guarantee_level | 机械覆盖点偏 L1；协议主体 L0 |
| CONTROL-X | 候选；Phase 3 不实现 fixture runner |

### CTRL-0003 Governance-document freshness（相对代码活动）

| Slot | Phase 3 记录 |
| --- | --- |
| semantics_ref | interim：`scripts/check-doc-freshness.js` 中「治理文档相对代码活动过旧」 |
| applicability | 文档/代码变更后的日常检查；被治理项目视其是否有对应文档树 |
| profile_consumers | repo 与 skill **可能**共用机制，但 RESEARCH-0006 分两行 ownership——binding 按 profile 分开写，不合并成 `both` |
| evaluation_binding | `scripts/check-doc-freshness.js`（默认 advisory） |
| decision_expectation | 默认 warn/advisory（exit 0）；不得把默认模式说成 blocking |
| 身份课 | **不得**与译文滞后、也不得与「有 freshness 脚本」划等号 |

### CTRL-0004 Translation freshness

| Slot | Phase 3 记录 |
| --- | --- |
| semantics_ref | interim：同一脚本内「译文不得落后源 / 不得带 draft 标记进入 release-gate」 |
| applicability | 三语文档树；release 或 `--release-gate` |
| profile_consumers | 本仓库为 repo；skill 侧仅当目标项目有对等译文树 |
| evaluation_binding | `scripts/check-doc-freshness.js --release-gate` |
| decision_expectation | `--release-gate` → deny |
| 与 CTRL-0003 | 共享 evaluator 文件，**两个 Control** |

### CTRL-0005 Plan delivery

| Slot | Phase 3 记录 |
| --- | --- |
| semantics_ref | interim：`repo-tools/check-plan-delivery.js` 头注释中的「声明必须兑现」；计划格式在 lifecycle / plans README |
| applicability | 本仓库 TASK plan 交付对账 / `--gate` / 发布前 |
| profile_consumers | repo |
| evaluation_binding | `repo-tools/check-plan-delivery.js` |
| decision_expectation | 默认 advisory；`--gate` → deny |
| guarantee_level | 进入 `check:all` / skill-release 步骤时偏 L1 |

**10. 入口。** Control 正文不写入 `AGENTS.md` / `SKILL.md`。索引可增加指向本 ADR 的一行。完整入口瘦身仍受 ADR-0022 约束：无叶节点路由不得拆厚入口。

## 被否决的方案

- 在 ADR-0020 上继续 amendment 充当 Rule Registry。
- Phase 3 写出完整 YAML（id/name/title/category/tags/…）。
- 新建 `docs/plans/completed/` 式的 Control 中间目录或 `governance-core/`。
- 用 `scope: both` 作为机器字段。
- 把 `check-doc-freshness.js` 登记成单条 Control。
- 本阶段实现 Dispatcher 或拆 checker。

## 后果

- Phase 3 的权威答案：「什么是 Control / 哪些 slot 必填 / identity 是否稳定 / profile 怎么绑 / 家在哪」→ 本 ADR。
- ADR-0020 的字段名预告（`applies_when` / `evaluator` / `effect` 等）不再生效；由本 ADR 的 slot 集合取代。概念「单一 shared semantic authority + consumer profiles」保留。
- 下一批 identity 从 `CTRL-0006` 起分配；禁止为了「目录好看」重排 0001–0005。
- FINDING-0001 仍未 Resolved：本 ADR 定了 consent 的语义家，但未消除 AGENTS 双写，也未拆除 repo→skill 脚本依赖。
- Phase 4 的输入是：按 Control 而不是按文件做 inventory。

## Phase 3 schema 草案（权威落点）

本文件 § 决策 4（slot）+ § 决策 9（CTRL-0001–0005）即为 Phase 3 唯一 schema 草案。没有第二个并列文件。序列化形态未定。

## 参考

- 系统模型：RESEARCH-0010
- Producer/Product：ADR-0020
- 指令架构：ADR-0022
- 阶段顺序：ADR-0018
- 能力基线 / ownership：RESEARCH-0006
- 施工计划：PLAN-0034
