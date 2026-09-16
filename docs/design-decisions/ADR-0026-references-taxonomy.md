---
id: ADR-0026
status: Accepted
generation: gen2
---

# ADR-0026：`references/` 分类标准（语义责任优先）

## 背景

`references/` 同时挤了几条正交轴：制品种类、分发角色、物化机制、兑现方式。Generation-1 用「是否被生成器读取」把 `agents-md.template.md` 与 `sub-skills.md` 放进 `templates/`，与 `.env.example` 同类（FINDING-0026 / RESEARCH-0009）。FINDING-0003 要求区分 mechanical / judgment，但那是**义务强度**，不是文件种类。

若按兑现方式分目录，hybrid 文件会被拆碎或双写。若继续按生成器输入分目录，指令源会被当成 boilerplate。

## 决策

**1. 四个问题，固定顺序；只有第 1 问决定目录。**

```text
1. 语义责任 → 目录
2. 分发角色 → 只写 init-spec（INSTALLED | SKILL-INTERNAL），禁止从路径推断
3. 兑现方式 → INSTALLED JSON 义务行（见下），禁止 references/mechanical/，禁止叶卡 dual-write
4. 物化机制 → init-spec 的 copy | template | generated | static
```

**2. 第 1 问的目录合同（本仓）。**

| 语义责任 | 目录 |
| --- | --- |
| 跨能力硬规则 | `references/policies/` |
| 可路由能力叶（Trigger / Invoke / Verify） | `references/capabilities/`；生成子技能的叶卡在 `capabilities/subskills/` |
| 将被生成进 Agent 执行上下文的指令源 | `references/instruction/` |
| 只物化 bootstrap / machine-state | `references/templates/` |
| 被治理项目工作流正文 | `references/workflows/` |
| 可复用方法论（INIT 不装） | `references/principles/` |
| 可复制合同示例 | `references/contracts/` |

**3. 兑现方式必须可陈述，但不是目录轴。** FINDING-0003 的观察（文档 MUST ≠ 脚本拒绝）仍成立；把「没脚本 / 要人批 / 天生不能判」捆成同一个 `judgment` **不**成立。

权威载体：INSTALLED `docs/rules/capability-enforcement.json`（源：`references/capabilities/enforcement.v0.json`）。按 **义务行** 分类，禁止整文件一个 enum，禁止能力叶 `## Enforcement` 再写一份清单，**禁止**能力叶写入本仓 PLAN/ADR/Finding 施工指针或 Classification 双写行（生产者/产品分离）。JSON 内 `leaf` 是写作路径：任务怎么做 → `references/capabilities/…`；常驻硬规则已归位政策时 → `references/policies/…`（同一 policy 可被多条义务 entry 共用）。门禁对账：capabilities 目录 md ≡ 声明为 capability leaf 的条目；policy leaf 只要求文件存在。INIT 只复制整份 JSON，不改写 `leaf`。

义务四类（与 enforcement-semantics 的 allow/deny/warn/require_review **正交**——后者是检查结果语义）：

| 类 | 含义 |
| --- | --- |
| `mechanical` | 已有 carrier；结果可为 deny/warn/allow |
| `require_review` | 人必须动作；不是「Agent 自觉」 |
| `unmechanized` | 可以不撒谎地做成 mechanical，当前无 carrier（`mechanizable: true`） |
| `inherent_judgment` | 任何 deny 都会测到代理指标（`mechanizable: false`） |

声称 fail-closed 必须能指出 carrier。同一叶允许多行。不按机械/文档拆文件或拆夹。门禁只对账「叶集合 ≡ JSON」与 mechanical 路径存在；**不**证明 Agent 遵守了后两类。

**调度面（与目录轴正交 · FINDING-0038 窄澄清）：** 目录仍按语义责任，**不**开 `references/mechanical/`。但 Task→Capability 路由必须分开：

| 面 | 放什么 | 禁止 |
| --- | --- | --- |
| READ（`authorities.path`） | `policies/` / 薄能力叶 / docs 文本 | `.js` / `.sh` 当「可读权威」 |
| RUN（`binds` → `run_set`） | CTRL id、检查脚本路径 | 把跑脚本假装成「已加载语义准则」 |

跨能力硬规则正文在 `policies/`。`capabilities/` 叶卡是 Trigger/Invoke/Verify **任务怎么做**；常驻准则不得再以能力叶（含空壳指针叶）承载——正文归位后**删除**错位文件（FINDING-0038）。

**4. 模板只是物化机制，不是知识类。** `templates/` 不得再收指令源。INIT 目标路径（`AGENTS.md`、`.governance/generated/skills/`、`docs/rules/capabilities/*.md`）不随 source 目录改名而改。

## 后果

- 作者先问「这是什么责任」，再声明角色与门禁。
- ADR-0022「`templates/` 按生成方式分类不可长期接受」由本决策落地；物理拆分见 PLAN-0056。
- 不授权按 enforcement 重排树，不授权拆 `instruction/sub-skills.md` 聚合正文（FINDING-0015 另开）。
- 2026-09-15 窄修正：Q3 权威从「散文标签 / 叶头」改为 INSTALLED JSON 四类义务行（PLAN-0057）。不授权把 `unmechanized` 在本带做成新 checker，也不授权为 `inherent_judgment` 写 deny 脚本。
- 2026-09-16 窄澄清（FINDING-0038）：路由 READ/RUN 分离；能力叶≠第二政策源；脚本有效区另见 FINDING-0037。

## 参考

- FINDING-0026 · FINDING-0003 · FINDING-0037 · FINDING-0038 · RESEARCH-0009 · RESEARCH-0012 · ADR-0022 · ADR-0023
