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

### Phase 0 — Architecture Migration Mode

Purpose:

> Establish a development environment for the Generation-1 → Generation-2 architecture migration that is safe without over-blocking the refactor.

During migration:

- most Generation-1 gates are demoted to observational evidence
- the legacy checker / policy system is no longer extended, except for security, data-loss or release-corruption issues
- targeted validation and architecture checkpoints are used
- a minimal Refactor Safety Kernel is kept
- publishing an incomplete 2.0 architecture is forbidden
- `main` stays a stable 1.x baseline
- breaking refactors proceed on `migration/2.0-governance-architecture`

Exit conditions:

- the new control architecture has an executable baseline
- critical Generation-1 regressions have been migrated
- the new release path can independently prove completeness

### Phase 1 — Producer / Product Governance Separation

This is the first core architectural task of Generation 2.

Goal:

```text
Governance Core
      │
 ┌────┴────┐
 ▼         ▼
Repo       Skill
Profile    Profile
```

Focus areas:

- repo governance vs skill governance ownership
- eliminating the ambiguous `scope = both`
- separating shared semantics from concrete implementation
- making shared controls' consumers explicit
- keeping repo-only and skill-only controls independent
- cross-profile contract tests

Principle:

> Shared semantics does not imply shared implementation.

Product code can be a test target, but this repository's critical governance must not fully depend on the working-tree product implementation that is itself being modified.

### Phase 2 — Governance Core

Build a neutral Governance Core.

The Core owns:

- control identity
- control schema
- evaluator contracts
- evidence semantics
- decision semantics
- shared primitives
- profile contracts

The Core does not itself decide whether a rule belongs to repo or skill.

The Profile decides:

- applicability
- implementation
- enforcement boundary
- runtime adapter
- profile-specific policy

### Phase 3 — Rule / Control Registry

Extract governance execution semantics out of Markdown into machine-readable controls.

The minimal control model must explicitly distinguish:

```text
Applicability
Evaluator Type
Mechanism
Effect
Enforcement Boundary
```

Evaluator types include:

```text
mechanical
heuristic
review
guidance
```

Decision effects include:

```text
allow
deny
warn
require-review
observe
```

The two must not be conflated into a single dimension.

Markdown keeps doing:

- rationale
- explanation
- examples
- human-readable policy

but is no longer the only source of execution truth.

### Phase 4 — Checker Primitives and Evidence Model

Do not delete mature checkers; reposition them instead.

The stable, reliable capabilities in existing checkers should gradually be abstracted into reusable primitives, for example:

```text
required-file
forbidden-pattern
structured-value
cross-file-equality
projection-sync
command-result
negative-oracle
package-boundary
```

Every execution result should produce structured Evidence, instead of only:

```text
exit 0
exit 1
```

Evidence should be able to answer:

- which control was executed
- why it applied
- which mechanism was used
- which object was checked
- what result was obtained
- which boundary consumed the result

### Phase 5 — Context Detector and Dispatcher

This is the core execution layer of the Generation 2 control plane.

Goal:

```text
Event / Change Context
        ↓
Context Detector
        ↓
Applicable Controls
        ↓
Dispatcher
        ↓
Minimal Required Mechanisms
```

The system should gradually move from:

```text
Agent chooses npm command
```

to:

```text
System resolves required controls
```

The Dispatcher should support:

- file / path impact
- control ownership
- profile
- lifecycle event
- release context
- explicit task context

and aim for minimal sufficient validation rather than full execution by default.

### Phase 6 — Invariant-Centric Testing

The test system shifts from suite counts to control protection.

Important mechanical controls should have:

```text
positive oracle
+
negative oracle
```

Core metrics gradually shift toward:

- declared control count
- executable carrier coverage
- negative oracle coverage
- trigger coverage
- blocking boundary coverage
- false positive rate
- false negative rate

Test counts themselves are no longer a proxy for governance maturity.

### Phase 7 — Review Architecture

The existing review-manager is kept and repositioned as:

**Implementation Review**, focusing on:

- logic bugs
- test weakness
- security
- regression
- fixture realism
- checker correctness
- documentation inconsistency

Also added:

**System Review**, focusing on:

- responsibility boundaries
- control topology
- duplication
- architecture coherence
- trigger / enforcement gaps
- governance complexity
- producer / product coupling

And:

**Research Review**, focusing on:

- hypotheses
- measurements
- experimental validity
- false positive / false negative
- attention dependence
- long-term effectiveness

Systematic review defaults to:

```text
Find
→ Collect Evidence
→ Classify
→ Search Siblings
→ Determine Root Cause
→ THEN Remediate
```

to avoid degrading every problem into a local patch.

### Phase 8 — Runtime Adapters

Repository-level governance core must stay tool-neutral.

Runtime hard enforcement is implemented through an adapter layer:

```text
Portable Governance Core
        ↓
Adapter Protocol
        ↓
Codex
Claude Code
Cursor
opencode
Other runtimes
```

Possible hooks:

```text
before_write
before_shell
before_commit
before_release
```

But runtime-specific enforcement must not pollute the portable core.

Different runtimes may provide different guarantee levels.

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
Generation 1
Document-Centric Governance
        ↓
Architecture Migration
        ↓
Producer / Product Separation
        ↓
Governance Core
        ↓
Control Registry
        ↓
Evidence + Primitives
        ↓
Context Detector + Dispatcher
        ↓
Invariant-Centric Validation
        ↓
Review Architecture
        ↓
Runtime Adapters
        ↓
Generation 2
Policy-Driven Governance Control Plane
```
