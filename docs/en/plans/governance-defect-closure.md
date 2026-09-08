# Governance defect closure — sibling instances and control-plane follow-up (TASK plan)

[English](governance-defect-closure.md) · [简体中文](../../zh-CN/plans/governance-defect-closure.md) · [繁體中文](../../zh-TW/plans/governance-defect-closure.md)

> **Status: implemented.** (Implemented, pending release archival.) Sibling-instance closure and control-plane tracing are now in the root-cause repair protocol and have been verified reaching a clean target project through the distribution chain.

**Target: both** — `payload` modifies the repair protocol received by governed projects; `repo-infra` updates the skill execution pointer, generated guidance, target-chain tests, CHANGELOG, and this plan/roadmap index.

## Original problems this plan must solve

### Problem 1 — local repair without sibling closure

After finding one defective rule, template, script, gate, test, release entry, generated artifact, or synchronized document, an agent often repairs only that line. It does not search the same defect pattern across the other instances that share the contract.

The plan must require an explicit, bounded search of the relevant sibling surfaces. “No other issue found” is not evidence unless the search surface and command or enumeration are stated.

### Problem 2 — output repair without control-plane closure

An agent may fix only the visible output or projection of a defect without checking the rule, template, generator, gate, test oracle, release flow, or target projection that produced or failed to catch it. The visible fix can therefore recur or be overwritten.

The plan must require inspection of the relevant control-plane chain, including both the source-to-output path and the output-to-consumer path.

These are one failure family: local repair stops before the defect's impact surface and production chain have been checked.

## Engineering-restraint boundary

The plan deliberately does not add a generic similarity engine, a universal audit registry, a mandatory five-layer table, a new gate, or a new status taxonomy. The existing `repairSessionId`, impact-face search, change-hygiene reconciliation, and `mutation-probe.js` remain the available mechanisms.

## Proposed solution

### 1. Two-domain symmetry (into `lifecycle.policy.md` root-cause repair protocol)

A governance defect usually lives in two domains at once — the side that authors the rule and the side that executes it. Fixing only the reported side and assuming the other is correct is a repeatedly-proven miss pattern.

- Defect in the project's own rules/scripts/gates → check its source and projection: the template or generator that produced the file, the corresponding checker, and whether the rule text itself carries the same error.
- Defect in a generated or distributed artifact → check the source file and the distribution chain; fixing only the artifact is undone by the next generation.
- When the corresponding domain does not exist or does not apply, the concrete reason must be stated; never assume correctness, never skip silently.

### 2. Sibling-instance closure

When the defect is a governance contract rather than an isolated wording typo, the agent must enumerate the relevant sibling surfaces before declaring completion. The search is bounded by the defect's observed contract and may include:

- the same directory, script family, hardcoded enumeration, or synchronized document set;
- source rules, templates, generators, generated projections, and compatibility layers;
- the repo-infra and governed-project counterparts;
- related files changed in the same batch.

Each surface must receive a concise result: fixed, already correct with evidence, not applicable with a reason, or blocked with the missing prerequisite. The existing `repairSessionId` records the result; no new registry is introduced.

### 3. Control-plane follow-up

The agent must inspect the relevant production and enforcement chain for the defect, not blindly run an unrelated checklist. For a format or output defect, this normally includes:

```text
authoritative rule → template/generator → output
→ checker/gate → test oracle → release or target consumer
```

For a payload defect, the chain must also include tarball → INIT → clean target project. For a repo-only defect, the target consumer may be the repository's release or development workflow. Each relevant layer is either repaired, shown correct with evidence, or explicitly blocked/not applicable.

No visible output defect is closed by editing the output alone. The applicable authoritative rule, production path, enforcement path, evidence path, and release or target-consumer boundary must be identified and checked; layers that do not apply must be explicitly justified.

### 4. Bounded negative verification

When a gate/checker claims to intercept the defect, prove it is not idling with one bounded negative check: reinject the defect into an isolated fixture → the check must fail; restore the correct form → it must pass. Required only for decidable gate behaviour, never for semantic judgement.

`mutation-probe.js` already carries this; no new mechanism.

### 5. Scope and stop conditions

Applies only to governance rules, templates, generators, gates, tests, generated artifacts, synchronized governance documents, and release flow; ordinary business code and isolated wording errors do not trigger it.

The agent may stop when the relevant sibling surfaces have an evidenced result, the relevant control-plane layers have been checked, the corresponding domain has been checked, and applicable regression/gate evidence is recorded.

### 6. Explicitly not added this round

- Generic similarity engine
- Universal audit registry
- Mandatory five-layer review table
- New gate or audit script solely for this protocol

## Relationship to existing protocols

- The existing `repairSessionId`, reproduce-first fields and failure budget remain the session and escalation mechanism.
- The closure requirement supplements, rather than replaces, impact-face search and change-hygiene reconciliation.
- It requires sibling and control-plane conclusions to be recorded in the existing repair session; it adds no new registry or escalation step.
- `mutation-probe.js` is an existing tool; this clause only adds a trigger condition for using it.

## Affected files

**payload:**
- `references/policies/lifecycle.policy.md` — add sibling-instance and control-plane closure requirements to the root-cause repair protocol
- `SKILL.md` — point audit and repair execution at the closure requirements
- `references/templates/agents-md.template.md` — carry the operational summary if generated guidance needs it

**repo-infra:**
- `AGENTS.md` — one pointer row in the principles index
- `tests/suites/payload.test.js` — verify the closure requirements reach a clean target project
- `CHANGELOG.md` — `Added` section record
- `docs/{en,zh-CN,zh-TW}/plans/governance-defect-closure.md` — this plan
- `docs/{en,zh-CN,zh-TW}/roadmap.md` — link the active plan

## Verification method

1. Trilingual parity and plan-status gates pass.
2. A fixture demonstrates that a defect in one sibling instance causes the sibling search to report the other relevant instance; no new similarity engine is used.
3. An output/projection fixture demonstrates that the report checks the applicable authoritative rule, production path, enforcement path, evidence path, and release/target-consumer boundary rather than only the output.
4. Payload changes are validated through tarball → INIT → clean target project.
5. Where a gate claims to catch the defect, `mutation-probe.js` or an equivalent bounded existing check fails on reinjection and passes after restoration.
6. `npm run check` is fully green.

## Completion conditions

- `lifecycle.policy.md` root-cause repair protocol requires sibling-instance and relevant control-plane closure.
- The same requirements are reachable in both repo-infra and governed-project execution paths.
- A triggered defect cannot be declared complete after only the reported output or only one domain is repaired.
- The AGENTS.md principle pointer resolves to that file.
- `npm run check` exit 0.
