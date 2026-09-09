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

## Current State: Generation 1

The current stable version is **Generation-1 Document-Centric Governance**.

It already provides a fairly complete set of governance capabilities, including:

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

## Generation 2 Development Phases

The authoritative phase order is ADR-0018; this Roadmap indexes it and does not restate the ADR's rulings. Each phase executes as a `PLAN-xxxx` under Accepted ADR constraints.

| Phase | Name (ADR-0018) | One-line outcome |
| --- | --- | --- |
| 0 | Architecture Migration Mode | safe-but-unblocked Gen1→Gen2 refactor environment (gates observational, Safety Kernel blocking) |
| 1 | Producer / Product Separation | repo vs skill ownership boundary known; `scope = both` eliminated |
| 2 | Research / Findings / Traceability | system model → observed gaps → traceability loop |
| 3 | Governance Core / Rule Model | shared semantics, separate profiles |
| 4 | Checker / Primitive restructuring | mature checkers → reusable primitives + evidence |
| 5 | Dispatcher | context detection → applicability → mechanical / heuristic / review |
| 6 | Invariant-based Testing | positive + negative oracle per control |
| 7 | Review System redesign | Implementation / System / Research review |
| 8 | Rebuild mandatory gates | blocking authority rebuilt on the new control plane |

Authority: ADR-0018 (`docs/design-decisions/ADR-0018-generation-2-dev-path.md`).


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

## Success Criteria

Generation 2 success is not primarily measured by "how many capabilities were added".

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
P0 Architecture Migration Mode
P1 Producer / Product Separation
P2 Research / Findings / Traceability
P3 Governance Core / Rule Model
P4 Checker / Primitive restructuring
P5 Dispatcher
P6 Invariant-based Testing
P7 Review System redesign
P8 Rebuild mandatory gates
        ↓
Generation 2 — Policy-Driven Governance Control Plane
```
