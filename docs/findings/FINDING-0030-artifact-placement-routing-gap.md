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
4. 存在 fail-closed 的 docs/ 形状 allowlist（目录 / 文件名 / ID 唯一 / 禁止未列出的子目录），违规时门禁失败；不实现内容分类门禁。

## 解决情况

（部分 · 2026-09-13）1–3 路径已收回。H2b 仍 open；实现细节归将来 H2b Plan，本 Finding 只保留 outcome。Stage A/B 过程稿不保留。

## 关联

- PLAN-0037 · PLAN-0044 · PLAN-0045 · ADR-0014 · ADR-0016 · ADR-0022（Context Economy）
- 放置规则权威：[docs/README.md](../README.md) § 东西放哪里 · § 类型目录封闭 · § 文档职责与信息密度（本 Finding 为事件证据，不承担规则正文）
