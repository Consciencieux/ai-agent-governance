---
id: FINDING-0030
status: Confirmed
type: mechanism-gap
observed_in: gen2
---

# FINDING-0030：产物路由缺口（路径乱放 + Plan 吸收知识）

## 分类

- 严重度：中（路径）/ 高（Plan 边界漂移）
- 影响范围：repo
- 研究方向：G. 证据 / 研究方法论

## 观察

同一根因的三种表象：

```text
1. 没编号的草稿当 Plan
2. 给编号对象建文件夹或同号第二份文件（PLAN-xxxx/、RESEARCH-0012-foo.md）
3. 把知识目录塞进 Plan（百科）
4. 把 JSON 台账伪装成 Research 对象
```

例：archive 无编号 HITL；PLAN-0037 拆夹；`working/`；同号 `RESEARCH-0012-*.md`；把施工 md 堆进 `repo-tools/`。

## 规则（短）

**一个编号对象 = 一个文件。** Plan / Research / Finding / ADR 都是。

1. 类型目录封闭：只使用已有类型位置；归属不清就写 Finding 或并入已有文件，不要 mkdir。
2. HITL / 清单并入所属 Plan 或 ADR。
3. 过程稿默认不落盘；禁止为 Stage 产物新建 Research 编号。
4. 机读 JSON 只属于消费它的代码；禁止配套施工 md。
5. 文档只承担一种职责；超出则拆并引用（Document Scope）。不做行数门禁。

## 修改方向（H2b · 不堆 README）

类型树已在 `docs/README.md` § 类型目录封闭；**不再**在 README 里扩写机制或另画架构图当第二权威。后续缺口与实现方向记在本 Finding。

**执行分层**（禁止权拆开，不要一篇 md 假装能拦 mkdir，也不要门禁假装能判文意）：

| 层 | 手段 | 拦什么 |
| --- | --- | --- |
| 类型含义、职责、过程稿不落盘 | 人读（README 指针 + 各类型 README） | 语义：这是不是 Plan / Research / 施工表 |
| 目录、文件名、ID 唯一、禁止未列出的子目录 | 机械 **allowlist**（H2b；**未实现**） | 形状：`working/`、`PLAN-xxxx/`、同号第二份、无编号 md |
| 行数、文风、「像不像施工表」 | **不做门禁** | 硬做会逼出假文件和绕过结构 |

**形状 allowlist**（新增类型目录仍须先 ADR，再改 `docs/README.md` 类型树）：

```text
docs/README.md · docs/glossary.md
docs/product/{en,zh-CN,zh-TW}/
docs/plans/README.md · docs/plans/PLAN-xxxx-<slug>.md
docs/plans/roadmap/{en,zh-CN,zh-TW}.md
docs/plans/archive/PLAN-xxxx-<slug>.md
docs/findings/README.md · docs/findings/FINDING-xxxx-<slug>.md
docs/research/README.md · docs/research/RESEARCH-xxxx-<slug>.md
docs/design-decisions/README.md · docs/design-decisions/ADR-xxxx-<slug>.md
同一 ID 只出现一次
```

合法演进（新 PLAN / RESEARCH / FINDING / ADR、三语产品页）按上表**模式**创建，不是「名单上没有文件名就禁」。未列出的子目录、未编号 md、编号对象的第二份文件或文件夹 = 违规。

**现状：** `check-layout-sync.js` 扫 `references/` / `scripts/` / `repo-tools/` / `repo-workflows/`，**不**扫 `docs/` 类型树。H2b 应新增独立 allowlist checker（或扩展现有脚本），不在本 Finding 内实现。

## 证据

- 无编号：`mode-exit-proposal.md`、`skill-release-2.0-checklist.md` 曾停在 `docs/plans/archive/`（已并入 ADR-0014 / PLAN-0045）。
- 文件夹过度纠偏：PLAN-0037 / 已归档 PLAN-0044 / PLAN-0045 被改成目录（2026-09-13，已撤回）。
- Stage 稿曾进 `research/working/extraction/`（commit `652c330`）。
- PLAN-0037 曾内嵌完整 L1 目录；曾迁到 RESEARCH-0014。**RESEARCH-0014 已删除**（过程稿，不是 Research）。

## 根因

有类型分类，缺 **extraction artifact ownership**：从项目提炼方法论时，过程产物没有默认 typed owner，Plan 或 `working/` 变成垃圾桶。第二次纠偏把「不要第二份文件」误读成「所有文字进 Plan」。

## 关闭条件

1. `docs/plans/` 与 `archive/` 只有 `PLAN-xxxx-*.md`（外加 README / roadmap）。
2. Mode 退出 HITL 在 ADR-0014；2.0 清单在 PLAN-0045。
3. PLAN-0037 为执行合同；不存在 RESEARCH-0014；每个 RESEARCH-xxxx 只有一个文件；无 `working/`；repo-tools 无施工 md。
4. H2b 机械 allowlist 落地（见上 § 修改方向）；不实现内容分类门禁。

## 解决情况

（部分 · 2026-09-13）1–3 路径已收回；修改方向已记本 Finding。H2b 仍 open。Stage A/B 过程稿不保留。

## 关联

- PLAN-0037 · PLAN-0044 · PLAN-0045 · ADR-0014 · ADR-0016 · ADR-0022（Context Economy）
