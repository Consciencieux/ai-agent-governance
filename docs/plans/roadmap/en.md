# Roadmap

[English](en.md) · [简体中文](zh-CN.md) · [繁體中文](zh-TW.md)

## Vision

The goal of AI Agent Governance is not to pile more prompts, rule documents and check scripts onto AI coding agents, but to build a governance framework that is:

- repository-native
- tool-neutral
- verifiable
- traceable
- incrementally adoptable
- extensible to different agent runtimes

The long-term goal is to move governance from:

```text
Documented declarations
    ↓
Agent reads and remembers
    ↓
Agent decides which rules apply
    ↓
Agent chooses the check commands
    ↓
Scripts return exit code
```

to:

```text
Machine-readable Controls
        ↓
Context Detection
        ↓
Applicability Resolution
        ↓
Dispatcher
        ↓
Evaluator / Mechanism
        ↓
Evidence
        ↓
Decision
        ↓
Explicit Enforcement Boundary
```

The governance system should minimize its dependence on agent attention, memory and conscientiousness.

## Current State: v2.0.0 (Generation 2 must-ship slice)

The current product is **`v2.0.0`**: an installable INSTALLED must-ship slice that runs on a clean target. CI blocking authority is `npm run check:must-ship`. Migration Mode has EXITED; `main` is the 2.0 product line. Authority: [ADR-0024](../../design-decisions/ADR-0024-gen2-product-freeze.md) · [ADR-0025](../../design-decisions/ADR-0025-gen2x-product-path.md).

This is **not** “Generation-1 limitations have vanished.” 2.0 attaches the verified control plane to a releasable skill; much of the machinery is still documents + scripts + WRAP’d checkers. The six Generation-1 limitations still describe remaining architectural debt; they no longer block the shipped must-ship face.

Generation 1 (1.x) remains the historical baseline. It already provides:

- INIT / AUDIT / RELEASE lifecycle
- deterministic governance generator
- governance file and state management
- Git / release policy
- secret scanning
- sync checking
- documentation consistency
- release management
- plan delivery verification
- review-manager
- multilingual product documentation
- regression test suites
- physical repo / payload distribution boundary

Generation 1 has demonstrated that:

> AI coding governance can achieve stronger constraint through in-repository documents, scripts, tests, CI and release workflows than through pure prompts alone.

But the current architecture still uses:

```text
Markdown / SKILL / AGENTS
        +
npm scripts
        +
independent checkers
```

as its primary control mechanism.

Its mechanical capability has already grown beyond what the original design model can clearly express and dispatch.

## Generation 1 Key Limitations

Known limitations are referenced from `docs/findings/` (FINDING-0001..0019), not restated here; the Roadmap keeps only the long-term conclusions.

Specific evidence, defects and research records live in `docs/findings/` and `docs/research/`; the Roadmap keeps only the conclusions that affect the long-term direction.

### 1. The Producer/Product Governance Boundary Is Unclear

This repository's own governance and the Skill Governance distributed to users are already separated at the physical distribution layer, but they remain implicitly coupled in governance semantics, checker ownership and shared rules.

Some rules still take the form:

```text
repo
skill
both
```

This model cannot clearly answer:

- who owns the rule semantics
- who is responsible for enforcement
- which implementations must stay in sync
- which controls belong only to the repo
- which controls belong to governed projects

This is the primary architectural problem of Generation 2.

### 2. Policy Declaration and Enforcement Are Separated

Many rules still live mostly in Markdown, SKILL, AGENTS or policy documents.

The system usually relies on the agent to:

1. read the rule
2. decide whether the rule applies
3. remember what must be done
4. choose the correct gate
5. interpret the result correctly

As a result:

```text
MUST
```

does not natively imply:

```text
deny
```

Declaration strength and actual enforcement strength have not yet formed a unified model.

### 3. Triggers Depend on Agent Attention

Local governance usually still works as:

```text
Agent
  ↓
decides whether to run the check
```

rather than:

```text
Context
  ↓
system automatically resolves applicable controls
```

This means part of the governance guarantee depends on agent attention and context completeness.

### 4. Validation Routing Is Not Precise Enough

Different gate scopes already exist, but the overall system is still centered on npm scripts / suites.

The system cannot yet reliably derive:

```text
minimal required controls
```

from:

```text
change impact
```

So it is possible to see:

- simple changes run too much validation
- complex changes miss the controls that actually matter
- CI runs too coarse a scope
- local validation scope depends on agent judgment

### 5. Checkers and Tests Still Grow Incident-Driven

Much of Generation 1's reliability comes from:

```text
incident
→ patch
→ checker
→ regression test
```

This approach is excellent at protecting known defects, but over time it tends to produce:

- checker proliferation
- accumulation of regex / structural heuristics
- increasing complexity of the governance machinery itself
- decoupling between green test counts and real control maturity

Generation 2 needs to move from checker-centric to control / invariant-centric.

### 6. The Enforcement Boundary Is Not Yet Unified

Governance strength is currently distributed across:

```text
Prompt
Git hooks
local scripts
CI
release workflow
human approval
```

These mechanisms block with different strength, but have not yet been described uniformly.

In particular:

- Git hooks can be bypassed
- CI can only block after a commit
- prompts are only guidance
- runtime interception depends on the specific agent tooling

So the future must make explicit:

```text
At which boundary does a rule take effect?
```

## Generation 2 Target Architecture

The goal of Generation 2 is not to rewrite every existing mechanism, but to build a unified control plane around the capabilities that already work.

Target model:

```text
Governance Core
│
├── Control / Rule Model
├── Applicability Model
├── Evidence Model
├── Decision Semantics
├── Shared Primitives
└── Contracts
        │
        ├───────────────┐
        ▼               ▼
Repo Governance      Skill Governance
Profile              Profile
        │               │
        └───────┬───────┘
                ▼
          Context Detector
                ↓
            Dispatcher
                ↓
      ┌─────────┼──────────┐
      ▼         ▼          ▼
 Mechanical  Heuristic   Review
 Evaluator   Evaluator   Evaluator
      └─────────┬──────────┘
                ↓
             Evidence
                ↓
             Decision
                ↓
  allow / deny / warn / require-review
```

> Note: the Governance Core composition above (Control / Rule Model, Applicability Model, Evidence Model, Decision Semantics, Shared Primitives, Contracts) is an **illustrative target architecture**, not a Phase-3 schema decision. Exact ownership (Core vs profile) and machine-readable schema are decided in Phase 3 (ADR-0018 Phase-boundary discipline; ADR-0020).

## Generation 2 Development Phases (migration path, closed)

The Roadmap does not independently define or adjudicate phase order. The table below mirrors ADR-0018’s **closed** migration projection. 2.x horizons mirror [ADR-0025](../../design-decisions/ADR-0025-gen2x-product-path.md), later in this page.

| Phase | Name (ADR-0018) | One-line outcome |
| --- | --- | --- |
| 0 | Architecture Migration Mode | safe-but-unblocked Gen1→Gen2 refactor environment (gates observational, Safety Kernel blocking) |
| 1 | Producer / Product Separation | repo vs skill ownership boundary known; `scope = both` architecturally retired (residue remains, FINDING-0001) |
| 2 | Research / Findings / Traceability | system model → observed gaps → traceability loop |
| 3 | Governance Core / Rule Model | shared semantics, separate profiles |
| 4 | Checker / Primitive restructuring | mature checkers → reusable primitives + evidence |
| 5 | Dispatcher | context detection → applicability → mechanical / heuristic / review |
| 6 | Invariant-based Testing | positive + negative oracle per control |
| 7 | Review System redesign | Implementation / System / Research review |
| 8 | Rebuild mandatory gates | blocking authority rebuilt on the new control plane |

Authority: ADR-0018 (`docs/design-decisions/ADR-0018-generation-2-dev-path.md`).

**Migration closed:** Phase 0–8 EXITED; **`v2.0.0` shipped** (2026-09-12). Plan archive ≠ Release (ADR-0016). **Current horizon = ADR-0025 H1** ([PLAN-0037](../PLAN-0037-governance-skill-extraction.md) **Active**). H0 ([PLAN-0045](../archive/PLAN-0045-post-2.0-doc-truth.md)) is Archived.

## 2.0 shipped (index)

The Roadmap lists sequence and construction plans only; it does not copy Plan steps, Affected Files, or verification commands. Migration order: ADR-0018. 2.x order: ADR-0025. Product slice: ADR-0024. Extraction boundary: ADR-0020 / PLAN-0037.

### Done (checkpoints)

| Phase | Construction plan | Status |
| --- | --- | --- |
| 0 | ADR-0014 Migration Mode | **EXITED** (2026-09-12); CI blocking = `check:must-ship` |
| 1 | [PLAN-0031](../archive/PLAN-0031-producer-product-governance-separation.md) | Archived |
| 2 | [PLAN-0032](../archive/PLAN-0032-documentation-knowledge-architecture-closure.md) · [PLAN-0033](../archive/PLAN-0033-known-issue-closure.md) | Archived |
| 3 | [PLAN-0034](../archive/PLAN-0034-governance-core-rule-model.md) · ADR-0023 | Archived; baseline `24021c4` |
| 4 | [PLAN-0035](../archive/PLAN-0035-checker-primitive-restructuring.md) · [PLAN-0036](../archive/PLAN-0036-payload-discovery-ledger.md) | Implemented / EXITED |
| 5 | [PLAN-0038](../archive/PLAN-0038-task-capability-routing.md) · [PLAN-0039](../archive/PLAN-0039-context-detector-dispatcher.md) · [PLAN-0040](../archive/PLAN-0040-capability-physical-projection.md) | Implemented / EXITED (5a map · 5b resolve/CLI · 5c P0–P2 projection; leftover deferred) |
| 6 | [PLAN-0042](../archive/PLAN-0042-invariant-based-testing.md) | Implemented / EXITED (oracle inventory + routing negatives + seed CTRLs; full mechanical coverage still deferred) |
| 7 | [PLAN-0043](../archive/PLAN-0043-review-system-redesign.md) | Implemented / EXITED (Impl must-ship; System/Research repo-keep; routing N4) |

### Release record

| Item | Status |
| --- | --- |
| 8 Rebuild mandatory gates | [PLAN-0044](../archive/PLAN-0044-rebuild-mandatory-gates.md) Implemented / EXITED |
| 2.0 skill-release | **Shipped** `v2.0.0` (checklist: [skill-release-2.0-checklist.md](../archive/skill-release-2.0-checklist.md) historical) |

[PLAN-0037](../PLAN-0037-governance-skill-extraction.md) is **Active** (thawed 2026-09-12). The extraction boundary still constrains outputs: do not promote this repo’s directories / CTRL ids / Phase scripts to L1.

Phase 5 has EXITED (indexed from PLAN-0035 / `call-topology.md`, not a new ruling): **5a** explicit map → **5b** Dispatcher → **5c** project by Capability (`AuthorityRef` only). Leftover leaves / optional rename do **not** reopen Phase 5. Discipline: `docs/research/working/routing/call-topology.md` § 物理拓扑.

## 2.x horizons (index of ADR-0025)

The Roadmap does not adjudicate order. Members come from ADR-0024 `later`; order comes from ADR-0025. Construction runs only through an Active Plan.

| Horizon | One line | Construction | Status |
| --- | --- | --- | --- |
| **H0** Documentation and lifecycle truth | Align entry docs / roadmap / plan location with `v2.0.0` | [PLAN-0045](../archive/PLAN-0045-post-2.0-doc-truth.md) | **Archived** (nine Phase 4–8 plans archived) |
| **H1** Reusable governance skill extraction | L1/L2/L3 extraction protocol → clean-target validation | [PLAN-0037](../PLAN-0037-governance-skill-extraction.md) | **Active** |
| **H2** Control-plane completion | Residue extract → checkers/ledgers → machine Controls / CONTROL-X → payload routing and portability | Separate plan; inputs below | Not started |
| **H3** Runtime and research | L3, measurement, attention experiments; does not block 2.1 | No Active Plan | Far |

### H0 done

Archived PLAN-0035 / 0036 / 0038–0044 and PLAN-0045; moved `mode-exit-proposal` / `skill-release-2.0-checklist` into `docs/plans/archive/`. The only active construction plan under `docs/plans/` is [PLAN-0037](../PLAN-0037-governance-skill-extraction.md).

### H2 inputs (by sub-band; does not block shipped 2.0)

| Sub-band | Index (Finding / residue, not construction steps) |
| --- | --- |
| H2a Residue extract | 5c leftover Capability leaves · [FINDING-0029](../../findings/FINDING-0029-lifecycle-name-concept-drift.md) · [FINDING-0028](../../findings/FINDING-0028-script-generation-disposition-gap.md) (L0 inventory = [PLAN-0041](../archive/PLAN-0041-script-inventory.md)) |
| H2b Checkers and ledgers | Remaining consistency clusters · principles-index #9 · [FINDING-0011](../../findings/FINDING-0011-adr-status-false-positive.md) · [FINDING-0019](../../findings/FINDING-0019-check-doc-consistency-meta-checker-monolith.md) · [FINDING-0021](../../findings/FINDING-0021-roadmap-checker-vacuous.md) · Discovery Ledger L2 · [FINDING-0022](../../findings/FINDING-0022-recursive-discovery-workset-gap.md) · [FINDING-0024](../../findings/FINDING-0024-metadata-projection-drift.md) · ADR-0016 parser migration |
| H2c Cross-profile / machine Controls | [FINDING-0001](../../findings/FINDING-0001-producer-product-governance-coupling.md) CONTROL-X · [FINDING-0002](../../findings/FINDING-0002-missing-governance-control-plane.md) · [FINDING-0025](../../findings/FINDING-0025-governance-sync-mapping-gap.md) · [FINDING-0026](../../findings/FINDING-0026-templates-instruction-source-mix.md) |
| H2d Payload routing and portability | [FINDING-0003](../../findings/FINDING-0003-declaration-enforcement-gap.md) judgmental MUST · [FINDING-0004](../../findings/FINDING-0004-trigger-coverage-gap.md) · [FINDING-0005](../../findings/FINDING-0005-validation-routing-overhead.md) · [FINDING-0006](../../findings/FINDING-0006-regression-oracle-gap.md) full oracles · [FINDING-0007](../../findings/FINDING-0007-portability-enforcement-boundary.md) adapter · [FINDING-0010](../../findings/FINDING-0010-gitlab-ci-stack-template-mismatch.md) · [FINDING-0012](../../findings/FINDING-0012-lock-not-atomic.md) · mechanical Git-consent evaluator · MIGRATE entry · [FINDING-0014](../../findings/FINDING-0014-review-manager-layer-mismatch.md) L0–L4 tooling · [FINDING-0016](../../findings/FINDING-0016-canonical-example-not-constraint.md) · [FINDING-0017](../../findings/FINDING-0017-adr-no-continuous-enforcement.md) |

### H3 inputs (far; does not block 2.1)

[FINDING-0008](../../findings/FINDING-0008-governance-measurement-gap.md) measurement · [FINDING-0015](../../findings/FINDING-0015-static-prompt-attention-burden.md) static vs injection · L3 runtime interception · full `activity.jsonl`.

### This repo vs 2.x product

- **This repo:** experiment + reference implementation + research provenance ([RESEARCH-0013](../../research/RESEARCH-0013-research-provenance-and-context-economy.md)).
- **Shipped skill (2.0):** installable must-ship slice, not a separate PLAN-0037 universal pack.
- **2.x product line (H1):** [PLAN-0037](../PLAN-0037-governance-skill-extraction.md) **Active** — extract verified principles into a reusable skill.

## Guarantee Levels

Generation 2 progressively makes governance guarantee levels explicit:

```text
L0 — Guidance
     Agent-readable instruction

L1 — Repository Mechanical
     Repository checker can independently verify

L2 — Workflow Blocking
     CI / Git / release workflow can block progression

L3 — Runtime Interception
     Agent runtime can intercept the action before execution
```

No governance capability should be described merely as "supported / not supported"; its guarantee level must be explicit.

## Research Direction

The project will evaluate not only "how many features were implemented", but also whether governance mechanisms actually work.

Key research questions include:

### Zero-Attention Governance

If the agent completely forgets the governance rules:

> Which guarantees still hold?

Any capability called a mechanical guarantee should be able to answer this question.

### Static Prompt vs Dynamic Policy Injection

Research the impact of:

```text
static in-context rules
vs
dynamic injection at decision points
```

on the following metrics:

- attention failure
- token burden
- compliance
- task quality

### Full Validation vs Impact-Driven Validation

Compare:

```text
full suite
vs
dispatcher-selected controls
```

across:

- runtime
- detection rate
- false negative
- developer latency

### Enforcement Strength

Study the actual guarantee strength provided by different boundaries:

```text
Prompt
Hook
CI
Release
Runtime
```

in real agent workflows.

### Governance Operating Cost

Governance maturity must be measured together with cost.

Long-term metrics include:

```text
Runtime cost
Token burden
Human review cost
Maintenance cost
False positive rate
False negative rate
Attention failure rate
```

## Non-goals

Generation 2 explicitly does not pursue:

- solving every governance problem by adding unlimited Markdown policy
- creating a new permanent checker for every incident
- forcing every judgment rule to be mechanized
- assuming a green gate equals semantic correctness
- making all agent runtimes identical
- writing tool-specific runtime capabilities into the portable core
- adding mechanisms of no practical value for formal symmetry of directories, rules or abstractions
- measuring maturity by test count, checker count or rule count
- making growth in the governance framework's own complexity the default direction
- maintaining two architectures long-term just to stay Generation-1 compatible
- marking a closed migration Phase complete with a formal Release (ADR-0014 historical discipline; Mode has EXITED)
- treating the flat ADR-0024 `later` list as construction order (order authority = ADR-0025)
- skipping Stage A–D to emit a one-shot portable skill
- promoting this repo’s directory names / CTRL ids / Phase scripts to L1

## Success Criteria

Generation 2 success is not primarily measured by "how many capabilities were added". The 2.0 gate is already met at `v2.0.0`. The long-term criteria below are **not** the gate for every 2.x tag; each 2.x acceptance face is written by the Active Plan of the day, and by default does not bind H3 / CONTROL-X / full PLAN-0037 ([ADR-0025](../../design-decisions/ADR-0025-gen2x-product-path.md) decision 8).

What matters more:

```text
Policy can be mechanically located.
Applicability can be systematically resolved.
Execution can be dispatched without relying on Agent memory.
Evidence can be independently inspected.
Enforcement strength can be explicitly stated.
Critical controls have negative oracles.
Repo and Skill governance ownership is explicit.
Validation cost scales with change impact.
Runtime-specific enforcement remains outside the portable core.
```

The long-term goal is:

> Stronger, more explainable and more verifiable governance guarantees, with less agent attention, fewer governance mechanisms and clearer enforcement boundaries.

## Roadmap's Relationship with Other Knowledge Objects

The Roadmap expresses only the long-term direction; it does not carry detailed issue records or execution plans.

```text
Research
   ↓ provides model

Findings
   ↓ identify observed gaps

ADR
   ↓ records architectural decisions

Roadmap
   ↓ defines long-term direction

Plan
   ↓ executes a bounded phase

Implementation
   ↓

Measurement / Regression
```

Specific issues go into:

```text
docs/findings/
```

System models, experiments and evaluation frameworks go into:

```text
docs/research/
```

Long-term design decisions go into:

```text
docs/design-decisions/
```

Concrete execution work goes into:

```text
docs/plans/
```

Completed execution plans go into:

```text
docs/plans/archive/
```

## Roadmap Maintenance Rules

The Roadmap is a statement of the current long-term direction, not an immutable commitment.

Re-evaluate it when any of the following happens:

- an architecture generation transition
- a major architecture finding
- a major phase completion
- research evidence overturns an existing assumption
- the target architecture changes substantially

Ordinary patches, bug fixes or releases do not require automatically re-baselining the Roadmap.

Major direction changes must be traceable to:

```text
Finding
Research
ADR
```

The Roadmap does not keep detailed historical execution records, and is not used as a CHANGELOG.

If an old direction still has research value, preserve it through Git history or an explicit roadmap history snapshot, rather than letting the current Roadmap accumulate "completed items" without bound.

## Current Long-term Direction

```text
Generation 1 — Document-Centric Governance
        ↓
  Generation 2 migration (ADR-0018 Phase 0–8)
        ↓
P0–P7  checkpoints EXITED
         P6 = PLAN-0042 (oracle inventory + routing negatives + seed CTRLs)
         P7 = PLAN-0043 (three review kinds; Impl must-ship)
P8     Rebuild mandatory gates — EXITED (PLAN-0044)
        ↓
v2.0.0 skill-release — **shipped** (2026-09-12)
        ↓
H0     Documentation and lifecycle truth — EXITED / Archived (PLAN-0045)
        ↓
H1     PLAN-0037 cross-project portable extract — **current / Active**
        ↓
H2     Control-plane completion (ADR-0024 later mechanical debt)
        ↓
H3     Runtime and research (L3 / measurement; does not block 2.1)
        ↓
Generation 2 — Policy-Driven Governance Control Plane + reusable method
```
