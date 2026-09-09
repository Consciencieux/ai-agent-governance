---
id: FINDING-0024
status: Confirmed
type: mechanism-gap
direction: E
root_cause: R1
severity: Medium
affected:
  - repo
observed_in: gen2
related:
  research:
    - RESEARCH-0007
  adrs:
    - ADR-0021
---

# canonical metadata 被多份 index / projection 重复 → 持续 drift

## 观察

每个知识对象已经把 canonical 元数据（`status` / `generation`）写入 frontmatter，但多个 README / index 又各自维护一份相同事实的投影：

- `docs/design-decisions/README.md` 维护完整 ADR 状态/代际表 + 一张 generation review 表（重复三份 status/generation）；
- `docs/findings/README.md`、`docs/research/README.md` 曾各自定义 frontmatter schema 示例，与 canonical 不一致；
- `docs/README.md` 复述路由/CHANGELOG authority，与 ADR-0016 / repo policy 漂移。

**实际已发生 drift**：ADR-0021 文件 frontmatter 为 `gen2`，但 design-decisions README 索引写 `cross-generation`（本次修复前）。

## 证据

- ADR-0021 index drift（index `cross-generation` vs frontmatter `gen2`）。
- docs README「repo CHANGELOG 政策由 AGENTS.md 拥有」vs 实际 `repo-workflows/changelog-policy.md`。
- README schema 示例出现旧字段（opened/updated/title）vs canonical sparse envelope。

## 根因

R1（Policy Structure）：canonical 元数据没有单一事实源——对象 frontmatter 与 README/index 投影并存，投影未声明「read-only / 从 frontmatter 生成」，人工同步必然 drift。与「Roadmap 是 projection/index，不重述事实源」（ADR-0009 / ADR-0021）同族。

## 影响

- 投影与 canonical 不一致时，Agent 按 index 判断会得到错误结论（如 ADR-0021 代际）。
- 每次表示法变更需要同步 N 处投影，漏一处即 drift。

## 关闭条件

1. canonical 元数据只在对象 frontmatter 单一持有；
2. README / index 投影要么声明为 read-only projection（从 frontmatter 生成/人工即时同步），要么删除重复列；
3. 所有投影与 canonical 一致（机械或人工验证）。

## 解决情况

（未解决。）本次 reconciliation 修复了已发现的 drift 实例并让 schema 示例对齐 canonical；「投影 read-only 纪律」的正式机制留待后续（可作为 Gen2 control plane 的 SSOT 约束）。

## 回归保护

- 描述层：`docs/research/RESEARCH-0007`（索引 vs 事实源）。
- 规范层：ADR-0009、ADR-0021（投影不重述事实源）。
