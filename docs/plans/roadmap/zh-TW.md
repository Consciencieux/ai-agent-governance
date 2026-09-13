# Roadmap

[English](en.md) · [简体中文](zh-CN.md) · [繁體中文](zh-TW.md)

> **只做索引。** Plan 是事實源；順序由 ADR 裁定。本頁只回答「現在在哪 / 下一步是什麼」——不是 CHANGELOG，也不是 Plan 全文轉載。細節見 `docs/plans/` 與 `docs/plans/archive/`。

## 願景

做成倉庫內生、工具中立、可驗證的治理，盡量少依賴 Agent 注意力：機讀控制 → 上下文 → 適用性 → 調度 → 證據 → 裁決 → 明確強制邊界。

2.x 路徑權威：[ADR-0024](../../design-decisions/ADR-0024-gen2-product-freeze.md) · [ADR-0025](../../design-decisions/ADR-0025-gen2x-product-path.md)。

## 現在

| | |
| --- | --- |
| **產品** | `v2.1.0` — INSTALLED 必裝切片；CI 阻斷 = `npm run check:must-ship` |
| **Horizon** | H2 **已完成**；下一施工帶 = **H3**（遠；預設不擋下一 minor） |
| **Active Plan** | **無** |
| **排隊 Design** | [PLAN-0054](../PLAN-0054-h3-runtime-research-design.md) — H3 邊界 / 執行期與科研（未升 Active） |

殘留主題（不等於 Active Plan）：INSTALLED 機械調度（FINDING-0004/0005，須 Narrow ADR）、按需 Finding 補丁、僅在觸契約時再 EXTRACT 厚 CLI。

## 近線

| 項 | 角色 | 說明 |
| --- | --- | --- |
| [PLAN-0054](../PLAN-0054-h3-runtime-research-design.md) | Design | H3 成員 / 非成員 / 升 Active 前置。只凍結邊界；預設不裝 L3。 |
| Finding 補丁 | 按需 | 選定後做小切片——不是常駐清掃。最近閉合：[PLAN-0053](../archive/PLAN-0053-v2.1.x-finding-patch-slice.md)（Archived）。何時需要 Plan：見 [AGENTS.md](../../../AGENTS.md) 原則索引（Horizon vs 日常小改）。 |

SemVer ≠ Horizon。施工規則在 [AGENTS.md](../../../AGENTS.md) / [ADR-0025](../../design-decisions/ADR-0025-gen2x-product-path.md) / lifecycle § 規模分級——**不**寫在本頁。

## 已完成（一句）

遷移 Phase 0–8 EXITED → `v2.0.0` 發布 → H0–H2 Archived（[PLAN-0045](../archive/PLAN-0045-post-2.0-doc-truth.md) … [PLAN-0050](../archive/PLAN-0050-h2d-payload-portability.md)）→ `v2.1.0`（[PLAN-0051](../archive/PLAN-0051-v2.1.0-release-acceptance.md)）→ Gen1 觀測 sunset / carrier 重裁（[PLAN-0052](../archive/PLAN-0052-gen1-observation-sunset.md)、[PLAN-0055](../archive/PLAN-0055-gen1-carrier-absorb-and-retire.md)）→ FINDING-0003 判斷語言分層（[PLAN-0053](../archive/PLAN-0053-v2.1.x-finding-patch-slice.md)）。**Plan archive ≠ Release。** 全文見 `docs/plans/archive/`。

## 遠景（H3）

L3 執行期攔截、測量、注意力實驗、可選統一 dispatcher —— 科研 / adapter 面，**不是** portable 必裝。索引：[PLAN-0054](../PLAN-0054-h3-runtime-research-design.md)。預設不擋下一 patch/minor。

## 維護規則

1. 每次 Plan 生命週期事件（Design → Active → Archived），在**同一變更**更新三語的 **現在 / 近線**。
2. **已完成** 保持一段話；敘事進 Archived Plan / CHANGELOG / Finding。
3. 不在此複述 Plan 步驟、Affected Files 或 Finding 清單。
4. 方向變更須有 Finding / Research / ADR —— 禁止靜默改路線圖。

```text
Research / Findings → ADR → Roadmap（索引）→ 按 AGENTS + ADR-0025 + lifecycle 計劃/實作
```
