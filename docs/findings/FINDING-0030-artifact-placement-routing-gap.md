---
id: FINDING-0030
status: Resolved
type: mechanism-gap
observed_in: gen2
resolved_in: gen2
---

# FINDING-0030：产物路由缺口（路径乱放 + Plan 吸收知识）

## 分类

- 严重度：中（路径）/ 高（Plan 边界漂移）
- 影响范围：repo
- 研究方向：G. 证据 / 研究方法论

## 影响

Agent 在 repair 时按主题词 mkdir / 改名 / 新建第二份编号文件，导致 identity corruption 与 authority drift；规则文本与磁盘现实互相对不上。

## 观察

同一根因的三种表象：

```text
1. 没编号的草稿当 Plan
2. 给编号对象建文件夹或同号第二份文件（PLAN-xxxx/、RESEARCH-0012-foo.md）
3. 把知识目录塞进 Plan（百科）
4. 把 JSON 台账伪装成 Research 对象
5. 把施工 md / 过程稿堆进 repo-tools/ 或新建 working/
```

例：archive 无编号 HITL；PLAN-0037 拆夹；`working/`；同号 `RESEARCH-0012-*.md`；RESEARCH-0014（过程稿误标 Research，已删）。

## 根因

有类型分类，缺 **extraction artifact ownership** 与 **形状机械拦截**：过程产物没有默认 typed owner；修复时误把 filesystem 冲突解法当成知识模型（`working/`、第二份 PLAN、Finding 里写规范）。

## 关闭条件（outcome · 非实现方案）

1. `docs/plans/` 与 `archive/` 只有 `PLAN-xxxx-*.md`（外加 README / roadmap）。
2. 无 `working/`、无 `PLAN-xxxx/`、无同号第二份 Research/Plan 文件。
3. `repo-tools/` 无施工说明 md；机读 JSON 仅跟消费它的脚本。
4. 日常放置规则只在 `docs/README.md`（短规则 + 指针）；**本 Finding 不是规范权威**。
5. H2b：`docs/` 形状 allowlist 有 fail-closed 门禁（目录 ∈ 封闭树、文件名模式、ID 唯一）；**不**做内容分类门禁；**不**把 Mermaid/架构图当第二权威。

## 解决情况

**Resolved（2026-09-13 · PLAN-0048 H2b Stage 3）。** 关闭条件 1–4 此前已满足（路径收回、无 `working/` / 同号第二份、`repo-tools/` 无施工 md、日常规则在 `docs/README.md`）。§5 现已关闭：`repo-tools/check-docs-shape.js` + `repo-tools/docs-shape-allowlist.v0.json` fail-closed（目录 ∈ 封闭树、文件名模式、ID 唯一）；不做内容分类门禁。

## 回归保护

关闭时：`repo-tools/check-docs-shape.js --gate`（曾挂入 `npm run check` / `check:docs`）。**PLAN-0055：** 该脚本已删除；**当前**不以它作为日常回归保护。Resolved 保留；重建须另开 Plan。

## 证据

- 无编号：`mode-exit-proposal.md`、`skill-release-2.0-checklist.md` 曾停在 `docs/plans/archive/`（已并入 ADR-0014 / PLAN-0045）。
- 文件夹过度纠偏：PLAN-0037 / 已归档 PLAN-0044 / PLAN-0045 被改成目录（2026-09-13，已撤回）。
- Stage 稿曾进 `research/working/extraction/`（`652c330`）；后级联 unwind（`be0d079`）。
- PLAN-0037 曾内嵌 L1 目录 / RESEARCH-0014；已收回为执行合同 + ADR-0020 权威。

## 关联

- PLAN-0037 · PLAN-0044 · PLAN-0045 · ADR-0014 · ADR-0016 · ADR-0022（Context Economy）· `docs/README.md` § 类型目录封闭
