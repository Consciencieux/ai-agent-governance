---
id: FINDING-0024
status: Confirmed
type: mechanism-gap
observed_in: gen2
---

# FINDING-0024：权威元数据被多份索引/投影重复，持续漂移

## 分类

- 严重度：中
- 影响范围：repo
- 研究方向：E. 检查器正确性 / 回归

## 观察

每个知识对象已经把权威元数据（canonical metadata；`status` / `generation`）写入 frontmatter，但多个 README / index 又各自维护一份相同事实的投影：

- `docs/design-decisions/README.md` 维护完整 ADR 状态/代际表 + 一张 generation review 表（重复三份 status/generation）；
- `docs/findings/README.md`、`docs/research/README.md` 曾各自定义 frontmatter schema 示例，与权威事实源不一致；
- `docs/README.md` 复述路由/CHANGELOG authority，与 ADR-0016 / repo policy 漂移。

**实际已发生 drift**：ADR-0021 文件 frontmatter 为 `gen2`，但 design-decisions README 索引写 `cross-generation`（本次修复前）。

## 证据

- ADR-0021 index drift（index `cross-generation` vs frontmatter `gen2`）。
- docs README「repo CHANGELOG 政策由 AGENTS.md 拥有」vs 实际 `repo-workflows/changelog-policy.md`。
- README schema 示例出现旧字段（opened/updated/title）vs canonical sparse envelope。
- 2026-09-10：ADR-0016 § 表示法归一写「各目录 README 定义…此处不复制 schema」，同段却内联 Finding `type`+`severity`+`affected`+…，与 `docs/findings/README.md` 已收缩的 frontmatter（`id`/`status`/`type`/`observed_in`[+`resolved_in`]）冲突——R25b 当前反例；ADR 侧已改为只保留指针。

## 根因

R1（Policy Structure）：权威事实源（canonical source）已存在于对象 frontmatter，但重复 projection 缺少明确的 derivation / reconciliation contract，人工维护导致 projection drift。问题不是 projection 的存在，而是 projection 没有明确声明为 read-only、没有稳定的生成/对账纪律。它属于「Roadmap 是 projection/index，不重述事实源」（ADR-0009）与用途优先结构规范（ADR-0016）所约束的同类边界问题。

## 影响

- 投影与权威事实源不一致时，Agent 按 index 判断会得到错误结论（如 ADR-0021 代际）。
- 每次表示法变更需要同步 N 处投影，漏一处即 drift。

## 关闭条件

1. 权威元数据只在对象 frontmatter 单一持有；
2. README / index 投影要么声明为 read-only projection（从 frontmatter 生成/人工即时同步），要么删除重复列；
3. 所有投影与 canonical 一致（机械或人工验证）。

## 解决情况

（未解决。）表示法归一过程中持续出现投影漂移实例：ADR-0021 index、docs README CHANGELOG 权威指针、ADR-0016 内联 Finding schema（2026-09-10 已删）。实例可修；「投影只读 / 不对账就不得复制 schema」的正式机制仍缺，故本 Finding 保持 Confirmed。

## 关联

- ADR-0009
- ADR-0016
- RESEARCH-0007
- PLAN-0032 R25b / R26

## 回归保护

- 描述层：`docs/research/RESEARCH-0007`（索引 vs 事实源）。
- 规范层：ADR-0009、ADR-0016（投影不重述事实源；对象 frontmatter 是权威事实源）。
