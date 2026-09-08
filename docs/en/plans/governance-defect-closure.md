# Governance Defect Closure — Sibling Instances and Control-Plane Audit (TASK plan)

[English](governance-defect-closure.md) · [简体中文](../../zh-CN/plans/governance-defect-closure.md) · [繁體中文](../../zh-TW/plans/governance-defect-closure.md)

> **Status: design plan, not implemented.** This plan addresses a gap left by the existing root-cause repair protocol: repairing the reported instance does not yet require closing the same defect class or auditing the rule, template, generator, gate, test, and release chain that allowed it.

**Target: both** — `payload` changes the repair protocol that governed-project agents receive; `repo-infra` updates the skill execution pointer, generated-agent summary, target-chain tests, CHANGELOG, and this trilingual plan/roadmap index. The two domains are listed separately under Affected Files.

## Task Purpose

Make a confirmed governance defect close at the level of its defect family, not only at the file or line where it was reported. The repair must cover both dimensions:

1. **Horizontal closure** — enumerate and resolve sibling instances of the same defect signature.
2. **Control-plane closure** — inspect the chain that produced, propagated, or failed to detect the defect.

The plan is specifically for governance behavior, rules, templates, generators, gates, tests, release records, and generated outputs. It does not turn ordinary typo fixes into repository-wide audits.

## Applicability and Domain Symmetry

This is a two-domain protocol. It applies both to this skill repository (`repo-infra`) and to governed projects receiving the payload; implementing it in only one domain is incomplete.

- A defect first found in `repo-infra` must inspect the corresponding payload rule, template, generator, gate, test, and target-project projection.
- A defect first found in a governed project must inspect the corresponding source and delivery path in this repository.
- For this repository, `AGENTS.md` and the skill execution instructions must direct the agent to perform the closure; for governed projects, the distributed lifecycle policy, `SKILL.md`, and generated `AGENTS.md` must do so.
- The reverse check is mandatory: source-to-output and output-to-consumer paths are both inspected, including generated artifacts and release packaging.

The completion claim is invalid if the reported instance is fixed in one domain while the corresponding domain is only assumed to be correct.

## Current Problem

The existing root-cause protocol requires reproduction, a repair session, a failure budget, and regression verification. It does not explicitly require the agent to:

- search for all instances of the same defect pattern after one instance is found;
- inspect the authoritative rule, template, generator, gate, test, and target-project projection together;
- distinguish a broken output from a broken rule, propagation path, enforcement path, or evidence path;
- re-inject the original defect to prove that a gate which should catch it actually turns red.

This creates a recurring local-repair shape:

```text
reported instance → patch that instance → green command → declare complete
```

The required shape is:

```text
reported instance → defect signature → sibling enumeration
→ control-plane audit → repair all applicable surfaces
→ negative/mutation evidence → target-environment verification
```

## Proposed Solution

### 1. Repair trigger and defect signature

Extend the root-cause repair protocol with a **closure trigger**. It applies when the confirmed defect involves a rule, template, generator, gate, test, release format, generated artifact, shared enumeration, or a repeated change batch. A plain isolated wording typo remains out of scope unless it reveals a broader rule or projection problem.

At the start of closure, the agent records a short `defect signature` containing:

- the observable failure;
- the violated invariant or contract;
- the pattern that could produce another instance;
- the affected audience and execution environment;
- the search surfaces that must be enumerated.

The signature is bound to the existing `repairSessionId`; it is not a second session or a new registry.

### 2. Horizontal closure: sibling instances

The agent must enumerate the same signature across the surfaces that can carry the contract:

- same directory, script, branch, and hardcoded enumeration;
- source rule, template, generator, generated projection, and compatibility layer;
- payload and repo-infra counterparts;
- language projections and synchronized documents;
- lifecycle phases and execution environments;
- related files changed in the same batch.

Every enumerated instance receives one explicit result:

```text
fixed
already correct (with evidence)
not applicable (with reason)
blocked (with missing prerequisite)
```

“No other matches found” is not sufficient by itself; the report must state the search surface and the command or enumeration used.

### 3. Vertical closure: control-plane audit

For a governance defect, inspect the full control-plane chain:

```text
authoritative rule
→ template/generator
→ implementation or generated output
→ gate/checker
→ test oracle
→ release/archive workflow
→ target execution environment
```

For each layer, determine whether it is:

- the source of the defect;
- a propagation path that copied the defect;
- an enforcement gap that should have caught it;
- an evidence gap that allowed a vacuous green result;
- already correct and therefore unchanged.

Example: a CHANGELOG format defect is not closed by editing CHANGELOG alone. The repair must check the format rule, generated AGENTS guidance, structure checker, relevant test oracle, release flow, and the generated governed-project shape.

### 4. Evidence and mutation requirement

Existing evidence tiers remain authoritative. Closure reports must label each conclusion as mechanical, human-attested, or unverified.

When a gate, test, or checker should have detected the defect, the repair must include a bounded negative check:

```text
reintroduce the defect in an isolated fixture → expected check fails
restore the corrected form → expected check passes
```

This requirement applies to decidable gate behavior, not to every semantic judgement. It does not require a full mutation-testing framework or a mutation run for ordinary source changes.

### 5. Scope and stop conditions

The closure scan is required only for the trigger conditions above. It must stop when:

- the defect signature has been enumerated across the declared surfaces;
- every applicable instance has a result;
- each failed enforcement layer has either been repaired or explicitly marked blocked;
- the target environment has been checked for payload changes;
- the original regression and relevant gates pass after the negative check.

The agent must not add a generic similarity engine, a universal audit registry, or a new gate merely to record the checklist. If a future defect class is frequent and mechanically decidable, it may receive a separate narrowly scoped gate under a new plan.

## Interaction with Existing Protocols

- The existing `repairSessionId`, reproduction-first fields, and failure budget remain the session and escalation mechanism.
- The closure requirement supplements, rather than replaces, impact-face search and change-hygiene reconciliation.
- Review-manager escalation still applies after the existing failure budget; closure does not bypass developer decisions or consent boundaries.
- A green gate is still only evidence at its declared tier. Closure must not upgrade mechanical evidence into a semantic correctness claim.

## Affected Files

**payload:**

- `references/policies/lifecycle.policy.md` — add the closure trigger, defect signature, horizontal sibling closure, vertical control-plane audit, and bounded negative-check requirements to the root-cause repair protocol
- `SKILL.md` — point the AUDIT and repair orchestration at the closure protocol so the skill executor does not stop at the reported instance
- `references/templates/agents-md.template.md` — carry the governed-project-facing repair summary if the generated AGENTS contract needs an operational pointer

**repo-infra:**

- `tests/suites/payload.test.js` — verify the closure clauses reach a clean generated Phase C project when the payload contract is changed
- `AGENTS.md` — add a pointers-only principle entry if the implemented rule becomes a durable governance principle for this repository
- `CHANGELOG.md` — record the payload behavior change at the release boundary
- `docs/{en,zh-CN,zh-TW}/plans/governance-defect-closure.md` — this plan
- `docs/{en,zh-CN,zh-TW}/roadmap.md` — link the active plan from the appropriate horizon

No new generic defect registry, similarity engine, or universal gate is part of this plan.

## Risks and Decisions

- **False scope expansion:** a defect signature could be written too broadly. Mitigation: require named search surfaces and trigger conditions; ordinary doc-only edits stay out of scope.
- **Ceremonial closure reports:** an agent could list surfaces without checking them. Mitigation: require real command output or explicit human-attested/unverified labels, plus negative checks for gates that claim to detect the defect.
- **Over-testing:** running every possible mutation would recreate the problem of excessive machinery. Mitigation: use one bounded negative fixture per affected enforcement contract.
- **Payload drift:** changing the protocol without checking a generated project would reproduce the authoring-vs-execution error. Mitigation: run the tarball → INIT → target closure chain for payload changes.
- **Unresolved ownership:** if a control-plane layer belongs to a separate plan or owner, mark it `blocked` with the prerequisite; do not silently omit it.

## Validation Method

1. Run the trilingual parity and plan-status gates.
2. For the implementation, prove the closure trigger is present in the skill executor and generated governed-project guidance.
3. Use a CHANGELOG-format fixture to verify the report distinguishes the output defect from rule, template, gate, and test layers.
4. Mutation-check one representative sibling defect and one representative control-plane defect: the relevant check must fail when the defect is reintroduced and pass after restoration.
5. For payload edits, package the skill, INIT a throwaway Phase C project, and verify the generated rules and AGENTS guidance contain the closure protocol without repo-only paths.
6. Run the applicable full repository gates and record evidence tiers; do not claim that the new protocol mechanically proves semantic correctness.
7. Run one repo-infra fixture and one clean Phase C governed-project fixture, and demonstrate the same defect signature is either closed or explicitly marked not applicable/blocked in both domains.

## Completion Conditions

- The protocol requires both horizontal sibling closure and vertical control-plane closure for triggered governance defects.
- The same triggered defect has an explicit result in both `repo-infra` and the governed-project domain; fixing only the reported side does not satisfy completion.
- The protocol has explicit scope and stop conditions.
- At least one target-project fixture proves the rule reaches the payload correctly.
- At least one bounded negative check proves a relevant enforcement layer is not vacuous.
- No generic similarity engine, universal registry, or broad new gate was added without a separate decision.
