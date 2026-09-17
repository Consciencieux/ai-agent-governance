---
id: FINDING-0041
status: Confirmed
type: research-observation
observed_in: gen2
---

# FINDING-0041：本仓 skill-release runbook 曾把事故旁注焊进执行步骤

## 分类

- 严重度：中（执行面变百科；Agent 发布时上下文被历史叙事淹没）
- 影响范围：repo（`repo-workflows/skill-release.md`）
- 研究方向：C. 执行缺口 · G. 证据 / 研究方法

## 观察

`skill-release.md` 作为本仓发布 runbook，曾在 Phase 步骤中嵌入大量「曾踩过」长注（空 `[Unreleased]` 重建时机、手改 `headSha`、archive 语言副本、roadmap/CHANGELOG 死链、本仓 `verify_governance` 预期失败等）。执行者需要的是**有序列表 + 红线**；旁注与 shared SemVer 全文使文件接近百科，违反 ADR-0022（历史后置、按需加载）。

同轴：`changelog-policy.md` 曾把 Legacy 语义讲义、信息流图、FINDING 反例叙事与 C1–C5 焊在同一执行政策里。

## 证据

- 瘦身前 `skill-release.md` ~159 行、`changelog-policy.md` ~198 行；大量段落可替换为指向 ADR-0006 / ADR-0014 / ADR-0016 / FINDING-0009 的指针。
- 已知复发点（执行时仍须遵守，细节不必每次展开）：
  1. **空 `[Unreleased]` 过早重建** → `changelog_coverage` 读到空顶节失败（v0.15.0 / v1.0.1）。
  2. **手改 `proposal.json` 的 `headSha`** → `execute` 拒绝 provenance（须重新 `plan`）。
  3. **本仓跑 `verify_governance.js` 当门禁** → 无 `.governance/` 预期非零（ADR-0006）；伪造工件是错误恢复。
  4. **归档后 CHANGELOG 仍写 `plans/<slug>` 路径** → 已发布节死链；应只写计划名。
  5. **Migration Mode 下做 release composition** → 违 ADR-0014（checkpoint ≠ Release）。

## 根因

把「防止再踩坑的证据」写进唯一 runbook，而不是 **runbook（短）+ Finding/ADR（证据）**。与 FINDING-0040（宁打补丁堆厚）同向：加注比拆权威便宜。

## 影响

- 发布会话上下文被旁注占满，真正步骤被淹没。
- 与 `references/workflows/release.md` 双写 SemVer，drift 成本高。

## 关闭条件

1. `skill-release.md` / `changelog-policy.md` 为短执行面；事故叙事只在本 Finding / 既有 ADR·Finding。
2. runbook 内 SemVer 不复述 shared 全文，只指针 + 本仓差异（无 manifest、五同步点）。
3. 上列复发点在 runbook 中最多保留**一行红线**，细节指向本条或既有 ID。

## 解决情况

（进行中。）2026-09-16 已将两份 repo-workflows 正文按上表削薄，并建立本条承载旁注。观察期后若无回潮可标 Resolved。

## 关联

- ADR-0022（薄入口 / 历史后置）
- ADR-0006 · ADR-0014 · ADR-0016 · ADR-0012
- FINDING-0009 · FINDING-0033 · FINDING-0040
- `repo-workflows/skill-release.md` · `repo-workflows/changelog-policy.md`
