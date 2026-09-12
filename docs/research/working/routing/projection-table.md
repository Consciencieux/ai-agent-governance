# Capability → Authority 投影表（Phase 5c · PLAN-0040）

施工权威：本表 + `graph.v0.json` `authorities`。人表摘要仍见 `task-capability-map.md` § P1。  
纪律：`call-topology.md` § 物理拓扑 — 只改 AuthorityRef；边不变。

| capability | slice | target_path（本仓权威文件） | installed（若有） |
| --- | --- | --- | --- |
| `thin-entry` | A | `docs/design-decisions/ADR-0022-agent-instruction-architecture.md` | — |
| `context-economy` | A | `docs/design-decisions/ADR-0022-agent-instruction-architecture.md` | — |
| `doc-knowledge` | A | `docs/README.md` | — |
| `change-hygiene` | B | `references/capabilities/change-hygiene.md` | `docs/rules/capabilities/change-hygiene.md` |
| `reference-closure` | A | `AGENTS.md` | — |
| `git-write` | C | `references/policies/git.policy.md` | — |
| `secret-protection` | C | `scripts/check-secrets.js` | — |
| `testing-evidence` | C | `references/policies/testing.policy.md` | — |
| `root-cause-repair` | B | `references/capabilities/root-cause-repair.md` | `docs/rules/capabilities/root-cause-repair.md` |
| `discovery-ledger` | B | `references/capabilities/discovery-ledger.md` | `docs/rules/capabilities/discovery-ledger.md` |
| `plan-delivery` | A | `repo-tools/check-plan-delivery.js` | — |
| `release-governance` | C | `references/workflows/release.md` | — |
| `review-implementation` | A | `references/templates/sub-skills.md` | — |
| `review-system` | A | `docs/research/working/review/system-review.md` | —（repo-keep；非默认 INSTALLED） |
| `review-research` | A | `docs/research/working/review/research-review.md` | —（repo-keep；非默认 INSTALLED） |
| `security-baseline` | C | `references/policies/security.policy.md` | — |
| `rule-capture` | B | `references/capabilities/rule-capture.md` | `docs/rules/capabilities/rule-capture.md` |

**Slice：** A = authority 机读化；B = lifecycle 横切抽出（本计划主交付）；C = 1:1 域文件指针澄清（path 已写死，未强制 rename）。

**边冻结：** `always_on` / `triggers` / `facet_adds` / `binds` 不因本表变更。
