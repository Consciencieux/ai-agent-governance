# Roadmap

[English](en.md) · [简体中文](zh-CN.md) · [繁體中文](zh-TW.md)

> **Index only.** Plans are the fact source; ADRs set order. This page tracks *where we are* and *what is next* — not a changelog or plan dump. Details live under `docs/plans/` and `docs/plans/archive/`.

## Vision

Build repository-native, tool-neutral, verifiable governance that depends less on agent attention: machine-readable controls → context → applicability → dispatch → evidence → decision → explicit enforcement boundary.

Authority for the 2.x path: [ADR-0024](../../design-decisions/ADR-0024-gen2-product-freeze.md) · [ADR-0025](../../design-decisions/ADR-0025-gen2x-product-path.md).

## Now

| | |
| --- | --- |
| **Product** | `v2.1.1` — INSTALLED must-ship slice; CI block = `npm run check:must-ship` |
| **Horizon** | H2 **complete**; next construction horizon = **H3** (far; does not block the next minor) |
| **Active Plan** | **None** |
| **Queued Design** | [PLAN-0054](../PLAN-0054-h3-runtime-research-design.md) — H3 boundary / runtime & research (not Active) |

Open residual themes (not an Active Plan): INSTALLED mechanical dispatcher (FINDING-0004/0005; needs Narrow ADR), selective Finding patches, further EXTRACT of thick CLIs only when contracts are touched.

## Near term

| Item | Role | Note |
| --- | --- | --- |
| [PLAN-0054](../PLAN-0054-h3-runtime-research-design.md) | Design | H3 membership / non-membership / promote-to-Active gates. Freeze only; no L3 install by default. |
| Finding patches | On demand | Selective small slices when chosen — not a standing sweep. Latest closed: [PLAN-0053](../archive/PLAN-0053-v2.1.x-finding-patch-slice.md) (Archived). When a Plan is required: see [AGENTS.md](../../../AGENTS.md) principles index (Horizon vs everyday edits). |

SemVer ≠ Horizon. Construction rules live in [AGENTS.md](../../../AGENTS.md) / [ADR-0025](../../design-decisions/ADR-0025-gen2x-product-path.md) / lifecycle § scale tier — **not** on this page.

## Done (one pass)

Migration Phase 0–8 EXITED → `v2.0.0` shipped → H0–H2 Archived ([PLAN-0045](../archive/PLAN-0045-post-2.0-doc-truth.md) … [PLAN-0050](../archive/PLAN-0050-h2d-payload-portability.md)) → `v2.1.0` ([PLAN-0051](../archive/PLAN-0051-v2.1.0-release-acceptance.md)) → Gen1 observation sunset / carrier re-cut ([PLAN-0052](../archive/PLAN-0052-gen1-observation-sunset.md), [PLAN-0055](../archive/PLAN-0055-gen1-carrier-absorb-and-retire.md)) → FINDING-0003 judgment-language layering ([PLAN-0053](../archive/PLAN-0053-v2.1.x-finding-patch-slice.md)) → `references/` taxonomy ([PLAN-0056](../archive/PLAN-0056-references-taxonomy.md) / ADR-0026) → obligation classification inventory ([PLAN-0057](../archive/PLAN-0057-capability-enforcement-inventory.md)). **Plan archive ≠ Release.** Full bodies: `docs/plans/archive/`.

## Far (H3)

L3 runtime interception, measurement, attention experiments, optional unified dispatcher — research / adapter surface, **not** portable must-ship. Index: [PLAN-0054](../PLAN-0054-h3-runtime-research-design.md). Does not gate the next patch/minor by default.

## How to maintain this page

1. On every plan lifecycle event (Design → Active → Archived), update **Now** / **Near term** in the **same** change (all three languages).
2. Keep **Done** to one short paragraph; push narrative into the archived Plan / CHANGELOG / Finding.
3. Do not restate plan steps, Affected Files, or Finding inventories here.
4. Direction changes need Finding / Research / ADR — not a silent roadmap rewrite.

```text
Research / Findings → ADR → Roadmap (index) → Plan/implement per AGENTS + ADR-0025 + lifecycle
```
