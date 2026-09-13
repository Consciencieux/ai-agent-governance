# Gen1 suite quarantine (PLAN-0055 Stage 4Q)

**Status:** archived — not loaded by `tests/run-tests.js`.

**Why:** ~500 `test()` cases accreted with Gen1 checkers (many from the 2026-09-04 suite split of a monolith, plus later incident pins). They were not fact-source adjudicated; Stage 4 prune (−37) was insufficient.

**Rebuild rule:** live suites under `tests/suites/` are rewritten from:
1. `necessity` short lists (`must_ship` ∪ `product_cli` ∪ `repo_gate`) in `repo-tools/script-inventory.v0.json`
2. git birth of the **script** (not the test) — Gen1 ceremony / vacuous clusters stay archived
3. `references/policies/testing.policy.md` — one fail-closed negative per declared gate obligation

**Do not** re-import suites wholesale. Lift a case only when a live script still owns that obligation and the archived test is the shortest active negative.

Script birth map (authoritative `git log --diff-filter=A`):

| Script | First seen | Role for rebuild |
| --- | --- | --- |
| `scripts/verify_governance.js` | 2026-08-10 | must_ship validator |
| `scripts/check-lock.js` | 2026-08-13 | product_cli lock |
| `scripts/check-git-policy.js` | 2026-08-13 | must_ship |
| `scripts/check-secrets.js` | 2026-08-13 | must_ship |
| `repo-tools/package-skill.sh` | 2026-08-14 | must_ship packaging |
| `repo-tools/check-doc-parity.js` | 2026-08-14 | repo_gate |
| `scripts/check-doc-consistency.js` / freshness | 2026-08-16 | product_cli (monolith → EXTRACT) |
| `scripts/generate-governance.js` | 2026-08-21 | must_ship INIT |
| `repo-tools/check-layout-sync.js` | 2026-08-21 | repo_gate |
| inventory / must-ship / routing | 2026-09-12+ | gen2 keep characterization |

Suite births (for context only — do not grant survival):

- 2026-08-10: consistency monolith ancestor
- 2026-09-04: validator/security/docs/generator/payload/release/hygiene split
- 2026-09-08+: plan-delivery/sync split
- 2026-09-12+: inventory/oracle/routing
- 2026-09-13: H2b/H2c/H2d/instruction-surface

