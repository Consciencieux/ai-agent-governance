# Suite-level test entry (run-tests.js --suite) (TASK plan)

> **Status: design plan, not implemented.** (Design plan, not implemented. Approved for planning: this plan is the **approved-commitment tail** of the anti-patch-development plan `anti-patch-development.md` §3 — "split uses a baseline-decay strategy... and retain a domain-level runnable entry after each migration" — not a new mechanism; the engineering-restraint "machinery test" is not triggered and the "approved requirements first" boundary protects it.)

**Target: repo-infra** — `run-tests.js` is this repository's test runner (REPO-ONLY, not distributed by INIT); the change affects only this repository's dev loop and test architecture.

### Goal

After the test split (11 domain suites, complete as of v1.0.1), the dev loop can only use the full entry: editing one README punctuation marks demands a full `npm test` (measured 42.9s, 96% of the 44.6s `npm run check`). The "domain-level runnable entry" promised by anti-patch-development §3 was never delivered. This plan delivers a **manual** fast entry so an iteration loop can run only the relevant suites, while the release/audit loop keeps full regression.

### Current problem

- Full suite 42.9s, cost concentrated in 4 suites: security 10.8s + docs 9.9s + consistency 6.3s + payload 5.9s = 33s (76%).
- `tests/run-tests.js` has no CLI parameters: SUITES is hardcoded and `process.argv` is never read; single-suite runs have no entry.
- This is a dev-experience gap, **not** an error of full regression itself — full regression before release/audit/commit is the correct design.

### Proposed solution

Add two CLI parameters to `tests/run-tests.js`: `--suite <name>` and `--list`.

Behaviour spec (strictly narrowed, nothing beyond):

1. **No args** → existing full behaviour, byte-identical (`npm test`, `npm run check` stay full).
2. **`--suite <name>`** → register and run only the single named suite.
3. **Unknown suite name** → `process.exit(1)`, list available suites on stderr (hinting `--list`).
4. **`--list`** → print canonical names in `SUITES` declaration order (one per line), exit 0.
5. **`--suite all`** → identical to no args (full), explicit in documentation.
6. **No-arg output of `npm test`/`npm run check` is unchanged** — no behaviour change for any existing caller.

#### Suite canonical names (the only naming rule)

`<name>` is the name with path and the `.test.js` extension stripped. Aliases such as `docs.test.js` are **not accepted** — a second naming rule must not come into existence:

```text
validator
security
consistency
docs
release
generator
payload
hygiene
narration
sync
plan-delivery
```

`--list` prints strictly in `SUITES` array declaration order (never sorted), so the output doubles as the visible fact of registration order.

### Isolation (already measured baseline — plan evidence, not a default test)

| Evidence | Result |
| --- | --- |
| 11/11 suites run independently (require + execute alone) | all pass |

Measured (2026-09-08 basis): consistency(68) docs(51) generator(33) hygiene(16) narration(12) payload(41) plan-delivery(15) release(18) security(35) sync(11) validator(26) each passes in isolation. helpers' `TMP_ROOT` is created fresh per run; suites share no initialization state.

**Decision**: do NOT wire isolation regression into default `npm test` (it would inflate test cost to ~90s — putting the cart before the horse). Isolation is preserved by (a) this plan recording the baseline evidence; (b) the single-suite entry itself being a one-time proof of isolation. Should a future suite depend on global state, the CI full baseline exposes it as an explicit failure.

### Verification method

1. `node tests/run-tests.js --list` → prints 11 canonical names in `SUITES` order, exit 0.
2. `node tests/run-tests.js --suite unknown` → exit 1, stderr lists available suites.
3. `node tests/run-tests.js --suite hygiene` → runs only the hygiene suite (16 tests), no other suite's output.
4. Full semantics of no-args and `--suite all`: **verified without recursion** (see below).
5. `npm run check` → full gate, exit 0 (existing scripts unaffected).

#### Recursion guard (test design constraint)

A CLI regression test **must not** execute, inside a test body, any form that reloads the current suite — both `--suite all` and no-args start the whole runner, so spawning them from a test recurses (the suite re-registers and re-executes itself). Constraints:

- Spawnable forms: `--list`, `--suite unknown`, `--suite <a single suite that excludes this test>` (e.g. spawn `--suite narration` from a hygiene test).
- The no-args / `--suite all` equivalence is **not verified by spawning**; it is a source assertion instead: parse `run-tests.js` and confirm `all` takes the same branch as "no args" rather than constructing a second full path.
- Current state verified: every existing reference to `run-tests.js` in tests writes a temp fixture file; none spawns the real runner. This plan preserves that property.

### Affected files

- `tests/run-tests.js` — argument parsing + dispatch
- `tests/suites/hygiene.test.js` — CLI behaviour regression assertions (runner machinery belongs to the hygiene suite, co-located with the existing mutation-probe assertions)
- `CHANGELOG.md` — `Added` section record
- `docs/{en,zh-CN,zh-TW}/plans/run-tests-suite-entry.md` — this plan (trilingual)

### Explicitly not done (aligned with engineering-restraint §3)

- **No automatic scope routing**: no test-subset selection from `git diff`; `--suite` is a manual explicit entry, not posing as an "automatic scope gate".
- **No `--changed`**: gate scripts (check-doc-consistency etc.) keep global semantics, untouched by this change.
- **No gate scope selection**: `check:docs`/`check:payload` etc. still start with full tests, unless independent evidence proves the mapping safe (this plan does not provide that evidence and does not request it).
- **No eligibility matrix/scoring/review stages**: no new governance mechanism.

### Risks and decisions

- **Could `--suite` be misused to bypass full regression?** Mitigated: `npm run check` and `--suite` are decoupled — `check` series always full; `--suite` is only a dev iteration entry. Documented in CHANGELOG and this plan; no automated interception.
- **Could single-suite runs falsely pass for lack of other suites' initialization?** Mitigated: 11/11 measured independent pass (see isolation); this plan records that evidence as baseline but does not run 11 suite passes in tests (cost unacceptable). A future implicit cross-suite dependency surfaces as an explicit failure in the CI full baseline.
- **Contract conflict:** anti-patch-development §3 promised "retain a domain-level runnable entry after each migration" — this plan is the tail; if internal review considers it a "new mechanism", cite the engineering-restraint "approved requirements first" boundary, and escalate the conflict instead of adjudicating locally.

### Known limitations

- Manual entry, limited performance gain (dev loop 42.9s → fastest single suite 0.3s hygiene).
- Does not change the absolute cost of full tests.
- CI does not use the flag (CI stays full).

### Completion conditions

- `npm run check` exit 0
- `npm test` exit 0 (326/326 or equivalent baseline)
- All 4 CLI behaviours have regression assertions that go red on decay (mutation-verified)
- Trilingual doc parity passes
