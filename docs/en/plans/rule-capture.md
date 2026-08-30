# Rule Capture (TASK Plan)

[English](rule-capture.md) · [简体中文](../../zh-CN/plans/rule-capture.md) · [繁體中文](../../zh-TW/plans/rule-capture.md)

> **Status: implemented (2026-08-30, pending Release archive).** This plan is delivered in the current worktree; archive it under the repository release rules.
>
> **Target: both** — `payload` is delivered to governed projects (`references/`, `scripts/`); `repo-infra` maintains this repository's `AGENTS.md`, tests and developer documentation. The two delivery domains are separated under Affected Files.
>
> **Target version: v0.11.0 (provisional).** If the implementation is reduced to internal mechanism fixes, the Release Proposal reclassifies it under SemVer; implementation does not directly change versions or create a release.

### Task Purpose

Make **developer-confirmed persistent requirements** part of the governed project's durable runtime contract instead of leaving them in one conversation. Confirmed rules must land in the target project's `AGENTS.md` or `docs/rules/**`, so a new agent can read them after a developer, machine or session changes.

This plan does not treat unconfirmed candidates as persistent rules: `activity.jsonl` is an audit trail, while current pending candidates live in `state.json` for same-task recovery. Only content confirmed and written to a rule file is an official governance contract. Uncommitted local state is not promised to survive a machine change.

### Current Problem

- Agents obey developer requirements in the current session, but the lifecycle does not define how to classify, confirm and write “developer requirement” into a rule file.
- The existing activity audit records agent actions only; it has no structured fields for rule candidates, adjudication results or pending candidates.
- `activity.jsonl` is an ignored runtime output and cannot provide cross-machine persistence by itself; current state belongs in tracked `state.json`.
- The original draft mentions “5 requirements from this session” and “two missed rules” without their source text, provenance or scope. They are **not an implicit back-fill deliverable** in this plan; if back-filling remains wanted, list each candidate ID, source/auditable summary, scope and target section before implementation and obtain explicit developer confirmation.

### Delivery Boundary and Non-goals

**Scope:** development tasks executed in governed projects through generated `AGENTS.md`, `docs/rules/**` and `.governance/generated/skills/`. This repository only gains equivalent contributor-facing operating guidance; a rule from a governed project is never written back into this repository automatically.

**Collect only persistent behavioral requirements from the developer:**

- Collect explicit general constraints, corrections to agent behavior, and persistence signals such as “from now on”, “always” or “never again”.
- Do not collect system/platform instructions, questions or suggestions, task-only acceptance criteria, instructions bound to a specific file or commit, temporary workarounds, secrets or credentials.
- Repetition may raise a candidate's priority, but cannot by itself promote a one-off instruction to a persistent rule.

**Non-goals:** do not automatically write candidates into rule files; do not automatically upgrade existing projects to new templates; do not change existing rule semantics to “merge similar items”; do not treat rule adjudication as Git commit/push authorization.

### Proposed Solution

#### 1. Collect candidates during the task

From task start through Phase 3, the agent creates candidates for developer requirements within scope. Each candidate has a unique ID (suggested `rc-<task_id>-<sequence>`). Before writing, search existing `AGENTS.md` and `docs/rules/**`; update the existing single source of truth rather than creating a synonymous duplicate.

The minimum candidate shape is below. `text` is an auditable normalized statement, not a verbatim copy of an entire conversation and never includes secrets:

```json
{
  "id": "rc-t-123-01",
  "text": "All governance-file changes must state a reason and run validation",
  "scope": "governed-project",
  "classification": "persistent|one-off|unclear",
  "reason": "General behavioral constraint for future tasks",
  "target": "docs/rules/lifecycle.md#governance-file-changes",
  "status": "proposed|confirmed|reclassified|discarded|pending"
}
```

Classification rules:

| Signal | Initial classification | Agent behavior |
| --- | --- | --- |
| General imperative (“from now on”, “always”, “never again”); constrains a behavior pattern; explicitly requested as a project rule | `persistent` | Put it in the adjudication list; never write first |
| Bound to a concrete object or this task; contains “first”, “for now” or “just this once”; expires on completion | `one-off` | Report the classification and reason; do not write or count as pending |
| Evidence is insufficient or signals conflict | `unclear` | Put it in the adjudication list; default to no write |

Candidates involving permissions, security, deletion protection, validation gates or Git policy are always treated as high-risk governance changes; even a `persistent` classification requires explicit developer confirmation for that item.

#### 2. Put rule capture in a Phase 5 synchronization subflow

The rule must not be written only after the final report, because that leaves no validation loop. The sequence is:

1. **After Phase 4**, the agent builds the Rule Capture list. It includes `persistent`, `one-off` and `unclear` items, with conclusions and reasons for the first two; classification is not phrased as an open-ended question.
2. **Phase 5a adjudication gate:** the developer adjudicates by candidate ID in one reply. For example: `confirm rc-t-123-01; reclassify rc-t-123-02 as one-off; defer rc-t-123-03`. An omitted candidate is unresolved and is never implicitly accepted; “confirm all persistent items” is valid as an explicit batch reply.
3. **Phase 5b write and synchronize:** only explicitly confirmed candidates may be written to the target rule files. Follow governance-file protection, update CHANGELOG when required, and reconcile the AGENTS summary/`@` reference, rule file and sync groups.
4. **Phase 5c re-validate:** if a protected file was written, rerun the affected governance validation, secret scan and sync-group checks. A governed project runs its `verify-governance.js`; this repository runs `npm run check`. The skill repository's default validator must not be presented as validation of a governed project.
5. **Phase 6 final report:** report final status, captured rules, one-off requirements, pending candidates and validation evidence. Phase 6 does not trigger a new rule write.

If adjudication is incomplete, mark the task `blocked` in `state.json`, retain the candidates and state the blocker in the report. The next run reads the candidates, obtains adjudication and resumes at Phase 5b. Rule adjudication authorizes content only; it does not replace the repository's pre-commit Git command echo or commit confirmation.

#### 3. Current state and audit trail

Add an optional `rule_capture` object to `state.json` for interruption recovery and current pending state. Older projects without the field are compatible as `status: none`:

```json
{
  "rule_capture": {
    "status": "none|collecting|awaiting_adjudication|resolved",
    "task_id": "t-123",
    "candidates": []
  }
}
```

`activity.jsonl` remains append-only and ignored. Append one line at each task-execution end point; a resumed execution with the same `task_id` may append a new line but never rewrites an old line, and candidate IDs link the records. Each task execution record may add the following optional fields; old records without them are treated as empty arrays:

```json
{
  "rules_captured": ["rc-t-123-01"],
  "rules_pending": ["rc-t-123-03"],
  "rules_resolved": [
    {"id": "rc-t-123-02", "decision": "one-off"}
  ]
}
```

`rules_pending` contains only unresolved `persistent`/`unclear` candidates, not confidently one-off requirements. Candidate IDs link records across recovery; drift-check uses current pending candidates in `state.json` and uses activity records for history and final decisions, so resolved historical candidates are not counted again. All new fields follow the existing log-redaction rules; when necessary record only a category and summary.

#### 4. Rule placement

- General, short entry rules that every session must see immediately go in `AGENTS.md`; detailed content belongs in the corresponding rule file and is referenced with `@`.
- Lifecycle, Git, security and testing topics update their existing `docs/rules/<topic>.md` single source of truth.
- For a new topic, search for an existing rule first; create `docs/rules/<topic>.md` only when none exists, then add a pointer in `AGENTS.md` instead of copying the body.
- A contributor rule scoped to this repository goes only in this repository's `AGENTS.md`; a governed-project rule never flows back into this repository.

#### 5. Migration for existing projects

New projects receive the new state field and sub-skill content from the generator. Existing projects do not update automatically when source templates change because the generator skips existing files; when the developer explicitly requests an upgrade, use MIGRATE:

- Update the target project's `docs/rules/lifecycle.md`, `AGENTS.md` summary, `state-manager` and `drift-check` sub-skills; merge existing content without overwriting it.
- Lazily initialize `rule_capture` when an existing `state.json` lacks it; do not rewrite every old state file in one operation.
- Verify old `activity.jsonl` records, candidate-field redaction and governance version; update manifest `governance_version` and run the target project's validator.
- Never automatically migrate or adjudicate requirements from old conversations.

### Affected Files

#### Payload (delivered to governed projects)

- `references/policies/lifecycle.policy.md` — add the Phase 5a/5b/5c rule-capture subflow, blocking/resume conditions, Phase 6 final-report fields and confirmation boundary
- `references/templates/agents-md.template.md` — add the rule-capture summary, rule-placement guidance and a pointer that adjudication is not Git authorization
- `references/templates/sub-skills.md` — have state-manager manage `state.json.rule_capture` and activity fields; have drift-check aggregate current pending items by candidate ID
- `scripts/generate-governance.js` — generate the compatible initial `rule_capture` state for new projects while preserving existing-file skip behavior
- `references/init-spec.json` — update the `state.json` artifact description/contract

#### Repo-infra (maintained in this repository)

- `AGENTS.md` — add this repository's rule-capture operating pointer; do not back-fill the unspecified “two missed rules” without source text and scope
- `tests/run-tests.js` — test state/activity fields, redaction, old-record compatibility, candidate resolution/counting, generated output and interruption recovery
- `docs/en/commands.md`, `docs/zh-CN/commands.md`, `docs/zh-TW/commands.md` — sync user-visible state-manager/drift-check responsibilities
- `CHANGELOG.md` — record an Added item under `[Unreleased]`; do not turn every business-task rule write into a separate version entry
- `docs/en/roadmap.md`, `docs/zh-CN/roadmap.md`, `docs/zh-TW/roadmap.md` — move the Near-term item to Done and re-baseline at release; update during implementation only if the content requires it

At the release boundary, follow the Release flow to synchronize `package.json`, the `SKILL.md` frontmatter, CHANGELOG and tag; this plan does not authorize automatic version operations. On completion, archive the plan as `docs/archive/rule-capture.md` according to the repository rules, preserve the three design copies and pass the plan-delivery gate first.

### Risks and Mitigations

- **Lifecycle blocking:** no adjudication means no completion claim; `state.json.rule_capture` preserves the checkpoint and the next run resumes at Phase 5b.
- **Misclassification or accidental writes:** use explicit IDs, default unresolved items to no write, bias ambiguity toward `unclear` and search existing rules first.
- **Confirmation confusion:** content adjudication, governance-file protection confirmation and Git commit confirmation are labeled separately; a generic “done” cannot replace them.
- **Log leakage:** do not record entire raw conversations; candidate text and new fields use redaction, and secrets/credentials are represented only by category.
- **Pending pile-up:** count only candidates currently pending in `state.json`; drift-check reports the count and IDs but does not make the report itself a new hard gate.
- **Template version drift:** update existing projects only through explicit MIGRATE; verify old state and activity records before and after migration.
- **Multi-agent races:** follow the existing lock check; candidate IDs include `task_id`, and writes to the same rule file cannot run in parallel.

### Acceptance and Validation Method

#### Automated/contract tests

- A newly generated project's `state.json` contains the optional initial `rule_capture` structure; old `state.json` and old activity records without new fields remain readable.
- Activity records accept valid new arrays/objects and remain append-only; candidate IDs link `pending → resolved/captured`, and resolved items are not counted twice.
- Secret-like candidate text is not written to `state.json` or `activity.jsonl`; one-off candidates never enter `rules_pending`.
- Generated state-manager/drift-check sub-skills contain the state, confirmation, recovery and reporting contract; `activity-report` distinguishes current pending items from historically resolved ones.
- Interruption fixture: before adjudication the task is `blocked`; the next run reads candidates and, after adjudication, completes writing, re-validation and the final report.

#### Agent behavior acceptance (dogfood)

Construct one clearly persistent, one clearly one-off and one unclear requirement, then verify:

1. The Phase 5a list has all three with IDs, classifications, reasons and target sections; the one-off item is not in the pending count.
2. No `AGENTS.md`/`docs/rules/**` rule write occurs before developer confirmation.
3. After ID-based confirmation/reclassification, only confirmed persistent items are written; an unclear item deferred leaves the task `blocked`, while one reclassified as one-off is not written.
4. After a rule write, rerun the target validator, `check-secrets` and `check-sync`; the final Phase 6 report lists real commands and results.
5. Repeating the run creates no duplicate rule; drift-check reports current pending count rather than historical total.

#### Repository gates and migration acceptance

- Run `npm test` and `npm run check` in this repository; do not run or fabricate a passing result from this repository's default `scripts/verify_governance.js`.
- After changing `references/`, scripts or trilingual docs, run the corresponding `docs:parity`, `docs:layout` and consistency gates; record real output in the task report.
- Pass one target-project MIGRATE fixture: existing files are not overwritten, explicit upgrade enables the new behavior, and old state/activity records remain readable.
- The two rules mentioned in the originating session but lacking source text are not automated acceptance items; only after their candidate records are supplied and explicitly confirmed may corresponding document assertions be added.

---
