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
3. 提炼知识进 **一篇** Research（或 ADR）；Plan 只引用。
4. 机读 JSON 属于消费它的代码（`repo-tools/*.json`），不是第二份 RESEARCH，也不是塞进 `repo-tools/` 的说明文档。人读施工表写进所属那一个编号文件。
5. 文档只承担一种职责；超出则拆并引用（Document Scope）。不做行数门禁。

## 证据

- 无编号：`mode-exit-proposal.md`、`skill-release-2.0-checklist.md` 曾停在 `docs/plans/archive/`（已并入 ADR-0014 / PLAN-0045）。
- 文件夹过度纠偏：PLAN-0037 / 已归档 PLAN-0044 / PLAN-0045 被改成目录（2026-09-13，已撤回）。
- Stage 稿曾进 `research/working/extraction/`（commit `652c330`）。
- PLAN-0037 曾内嵌完整 L1-01…12 / L2-01…11 目录（2026-09-13）；已迁到 [RESEARCH-0014](../research/RESEARCH-0014-portable-governance-patterns.md)。

## 根因

有类型分类，缺 **extraction artifact ownership**：从项目提炼方法论时，过程产物没有默认 typed owner，Plan 或 `working/` 变成垃圾桶。第二次纠偏把「不要第二份文件」误读成「所有文字进 Plan」。

## 关闭条件

1. `docs/plans/` 与 `archive/` 只有 `PLAN-xxxx-*.md`（外加 README / roadmap）。
2. Mode 退出 HITL 在 ADR-0014；2.0 清单在 PLAN-0045。
3. PLAN-0037 为执行合同；A/B 知识在 RESEARCH-0014；每个 RESEARCH-xxxx 只有一个文件；机读 JSON 在 repo-tools；施工 md 不进 repo-tools。
4. 机械拦截仍 open（H2b；不在本 Finding 内实现）。

## 解决情况

（部分 · 2026-09-13）1–3 已做。机械拦截仍 open。

## 关联

- PLAN-0037 · RESEARCH-0014 · PLAN-0044 · PLAN-0045 · ADR-0014 · ADR-0016 · ADR-0022（Context Economy）
