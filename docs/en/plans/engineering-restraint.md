# Engineering Restraint: Anti-Overengineering (an addition to the existing rule layer, TASK Plan)

[English](engineering-restraint.md) · [简体中文](../../zh-CN/plans/engineering-restraint.md) · [繁體中文](../../zh-TW/plans/engineering-restraint.md)

> **Status: implemented, pending archive.** This plan lands the "Engineering Restraint — Anti-Overengineering" principle as a **narrow addition to the existing rule layer**: one compact section in coding.policy.md (the machinery test + two boundaries) and one pointer line in SKILL.md. No new policy file, no new gate, no new review question, no new TASK field, no new distribution surface.

**Target: both** — the justification: the existing semantic owner, coding.policy.md, is already in the INIT copy list (distributed as docs/rules/coding.md), so extending it reuses the existing distribution channel with zero new copy surface; it is not payload "because it looks suitable for every project".

### Task Purpose

Land the Engineering Restraint principle as a narrow addition to the existing coding policy, so agents implement the approved capability completely and directly without adding machinery that current requirements, risks, or semantics do not independently justify. This plan must pass its own machinery test: one section in an existing file plus one pointer line — no new governance subsystem.

### Current Problem

- coding.policy.md already carries adjacent semantics (no unrequested abstractions, no unrelated refactoring, dependencies and heavy machinery need justification, follow the architecture and the semantic owner), but it lacks a single decision checkpoint and the two anti-misuse boundaries (approved requirements win; semantic seams stay legal).
- This repo recently went through repeated "machinery added to fix machinery" rework cycles — a generalizable behavior pattern worth reminding agents of; those cases serve only as motivation and must not turn into permanent gates or incident-specific rituals.

### Proposed Solution

#### 1. One compact section in coding.policy.md (payload, zero new distribution)

Add a short section "工程克制与机制测试（Engineering Restraint / Machinery Test）" to references/policies/coding.policy.md:

- Machinery test: before adding anything non-trivial, ask — "if this did not exist today, would current requirements independently justify adding it?" No → do not add it. Yes → use the narrowest existing owner or mature mechanic. If direct implementation suffices, do not interpose a framework or process. Process is machinery too: plans, gates, matrices, review steps, checklists and evidence artifacts carry the same burden of proof as abstractions, states and recovery systems.
- Operating rules (compressed): implement the approved capability completely and directly, never reducing real requirements in the name of simplicity; prefer the existing semantic owner, existing primitive, Standard/Node/OS capability, or a mature library; prefer bounded truthful failure over speculative resilience; tests protect meaningful contracts, not testability-driven DI/factories/hooks; evidence proves concrete claims, never memorializes single incidents; existing code has no preservation privilege, but is not churned without cause; escalate unresolved judgments; stop when the authorized behavior and proof are complete.
- Boundary one (approved requirements win): this rule constrains UNapproved machinery additions; it never vetoes user-approved functionality, architecture decisions, migration requirements, gate requirements, or TASK plans. If an approved plan conflicts with engineering restraint, escalate the decision — never silently trim requirements.
- Boundary two (semantic seams stay legal): keeping clear interface boundaries, module boundaries, extension points and stable semantics for CURRENT needs is allowed; building complete abstraction layers, config systems, plugin mechanics, recovery chains, generic frameworks or state machines for non-existent consumers is forbidden.

No new policy file, no lifecycle.policy.md change: the coding section already carries "process is machinery too" in one clause; escalate only if implementation proves it cannot — never default to a third policy.

#### 2. One pointer line in SKILL.md

One pointer line (file + section) in the governance-principles layer — never a restatement. The machinery test is the agent's decision check, not a document deliverable: no new TASK field, no per-plan justification requirement, no extra records.

#### 3. Explicit non-goals (the machinery test applied to itself)

- No new mechanical gate, score, qualification matrix, review stage, report field, permanent checklist, or machinery registry.
- No new review-manager question: the policy already instructs the decision-time self-check; only concrete evidence of missed overengineering may add it later as a non-independent item of an existing check (no new stage/field/evidence/gate).
- No new init-spec copy entry, no layout entry, no principles-index row — everything flows through existing owners and existing distribution.
- No overlap with the anti-patch plan: under-fixing (root cause, failure escalation) belongs to anti-patch; over-building belongs to this rule; deletion residue belongs to change hygiene.

### Affected Files

#### Payload

- `references/policies/coding.policy.md` — the "Engineering Restraint / Machinery Test" section (already in the INIT copy list, distributed as docs/rules/coding.md — zero new distribution surface)
- `SKILL.md` — one governance-principles pointer line

#### Repo infrastructure

- `docs/glossary.md` — new terms: engineering restraint / machinery test / overengineering (trilingual rows)
- `CHANGELOG.md` — records the behavioral change at the release boundary

### Risks and Decisions

- Self-parody risk: this plan adds one section to an existing file plus one pointer line and no dedicated tests; the governance value comes from the rule text prompting at decision points, not from new machinery.
- Approved-requirements boundary: agents must never trim approved requirements under the cover of "anti-overengineering"; conflicts escalate — the core anti-misuse boundary.
- Semantic-seams boundary: prevents over-correction that deletes legitimate interface/module boundaries; future machinery needs current evidence, future-facing structure is not a defect.
- Boundary with the anti-patch plan: anti-patch governs "fixing incompletely", this rule governs "building excessively".
- Not mechanizable: judgment principles are enforced by review and approval, not by gates.
- Target justification: `both` holds because the existing owner is already payload and distributed with INIT (reusing the existing channel), not because the content "looks suitable for every project".

### Validation Method

- coding.policy.md distribution is already covered by the existing init-spec copy-invariant tests (no new tests).
- The SKILL.md pointer resolves (manual check).
- npm run check / check:all pass (tests, parity, layout, --gate, plan delivery).
- Manual check: this implementation added no gate, state, field, review stage, or duplicate owner.

---
