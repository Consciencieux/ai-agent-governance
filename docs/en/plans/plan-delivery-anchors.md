# Plan Delivery Anchors (TASK Plan)

[English](plan-delivery-anchors.md) · [简体中文](../../zh-CN/plans/plan-delivery-anchors.md) · [繁體中文](../../zh-TW/plans/plan-delivery-anchors.md)

> **Status: design plan, not implemented.** Delivery verification (`repo-tools/check-plan-delivery.js`) skips design-only plans; this line is what marks it.

**Target: repo-infra** — the delivery gate and its tests are repo infrastructure; the declaration convention lands in `AGENTS.md`. Nothing here ships to governed projects.

### Objective

Make the delivery gate verify that declared content actually landed in the declared file. A plan that names a landing point must name what lands there, and the gate must find it.

### Current Problem

- The gate verifies a declared path by file existence. For a file that already exists in the tree, existence is satisfied before the plan is written, so the check reports success no matter what the plan promised.
- Real case, this session: `removal-hygiene` declared two landing points, `AGENTS.md` and `SKILL.md`. Neither file received the rule. The gate reported 28 plans verified, exit 0. The gap surfaced through a manual read, which is the assurance the gate exists to replace.
- Behavioural declarations (`writes:` / `wires:`) do verify content, but a plan only gets that verification by opting into the syntax. The plans most likely to skip it are ordinary prose plans naming ordinary files.
- Coverage is therefore inverted: plans creating new files are checked strictly, plans amending existing governance files are checked vacuously — and amending existing governance files is what most plans in this repo do.

### Proposed Solution

- **Anchor requirement.** An Affected Files entry naming a path that predates the plan carries an anchor: a short quoted string the change introduces into that file. `AGENTS.md` — anchor: `删除即删净`. The gate searches the target for the anchor and fails when absent.
- **Predates detection.** Compare the commit that added the declared path against the commit that added the plan document (`git log --diff-filter=A -1`). Path added earlier, or plan still uncommitted, means the path predates the plan and an anchor is required. Path introduced by the plan keeps existence as valid evidence.
- **Baseline grandfathering.** Plans written before this rule are recorded in a frozen list inside the gate script; the requirement applies to plans outside it. A test asserts the list is not extended, so new plans cannot join it.
- **Git-absent fallback.** Without git metadata the gate treats existing paths as predating and reports the anchor requirement advisorily rather than failing, keeping the check usable in export copies of the repo.
- **Convention documentation.** The AGENTS.md rule on plan declarations gains the anchor requirement alongside the existing Target field rule.

### Affected Files

- repo-tools/check-plan-delivery.js — anchor parsing, predates detection, frozen baseline
- tests/run-tests.js — regression coverage for the cases below
- AGENTS.md — anchor requirement in the plan-declaration convention
- CHANGELOG.md — gate behaviour change

### Risks

- **Migration volume.** Archived plans declare existing files throughout; the baseline exists to absorb them. Measure the count before choosing the cutoff, because a large frozen list weakens the rule from the day it ships.
- **Anchor drift.** Wording that later gets rephrased turns the anchor stale and the gate red on a healthy tree. Prefer anchors on stable terms, and treat a stale anchor as a plan correction rather than a gate exemption.
- **Git dependency.** Predates detection reads repository history; the fallback keeps the gate advisory where history is unavailable, which is weaker verification in exactly the environments that copy plans around.

### Validation Method

- Reproduce the `removal-hygiene` case: a plan declaring an existing file without an anchor turns the gate red and names the plan.
- Anchor present in the target passes; anchor absent from the target fails and names the anchor.
- A path created by the plan itself still passes on existence alone, confirming no false positive against `references/templates/githooks-template.md`.
- The frozen baseline test fails when an entry is appended.
- `npm run check` and `npm run check:all` exit 0 with the test count raised.

---
