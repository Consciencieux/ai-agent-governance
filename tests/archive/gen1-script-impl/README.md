# Gen1 script monolith quarantine (PLAN-0055 Stage 3 / 4S)

**Status:** archived evidence — not loaded by gates, INIT, or `tests/run-tests.js`.

**Why:** Same doctrine as `tests/archive/gen1-suites/`: keep product / must-ship **CLI names**, quarantine Gen1 accretion **bodies**, rebuild thin shells + extracted libs.

**Live contract (this round):**

| Live path | Role | Body |
| --- | --- | --- |
| `scripts/check-doc-consistency.js` | INSTALLED thin CLI | `scripts/lib/doc-consistency/run.js` |
| `scripts/generate-governance.js` | SKILL-INTERNAL thin CLI | `scripts/lib/generate/run.js` |
| `verify_governance.js` / `release-manager.js` / `check-lock.js` / `check-sync.js` | live unchanged | snapshot only (verify stays zero-dep INSTALLED) |

**Do not** re-import monoliths into live CLIs. Further cluster splits stay orthogonal (FINDING-0019): never merge parity / terminology / layout / roadmap / role back into consistency.
