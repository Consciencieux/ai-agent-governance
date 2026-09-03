# Skill Lifecycle Management (TASK plan)

[English](skill-lifecycle-management.md) · [简体中文](../../zh-CN/plans/skill-lifecycle-management.md) · [繁體中文](../../zh-TW/plans/skill-lifecycle-management.md)

> **Status: design plan, not implemented.** Deferred design; revisit when the version-sync step proves insufficient (roadmap Near-term entry).

### Task Purpose

Govern the lifecycle of agent capabilities themselves — **INSTALL → UPDATE → ROLLBACK** — so a skill (including `ai-agent-governance` itself) becomes checkable, updatable and rollback-safe instead of a one-time installation. The governance object extends from agent behavior to agent capability.

Layer distinction:

```
ai-agent-governance
        |
        ├── manages target project governance state (.governance/)
        |
        └── is itself an installed skill (.agents/skills/ai-agent-governance/)
```

Skill updates operate on the **installation layer** (`~/.agents/skills/...`), not on `project/.governance`.

### Current Problem

- The lifecycle `INIT → Runtime → AUDIT → RELEASE` has no `UPDATE` stage
- Agent platforms (Claude Code / Codex / opencode) do not proactively check skill updates, scan versions, or maintain skill lifecycle
- Technically feasible (read local skill files, run git, query GitHub releases, modify local files) — but there is no mechanism for *when* to act
- Local vs remote version drift goes unnoticed (`local 0.3.1` vs `remote 0.3.2` is never compared)

### Proposed Solution

A dedicated **Skill Manager** at the installation layer. Do NOT implement it as `.governance/generated/skills/update-manager` — that layer manages the target project's governance sub-skills; skill self-updates live at a different level.

Architecture:

```
             Skill Registry (GitHub releases)
                      |
                      v
              .agents/skills
                      |
                      v
               Skill Manager
                  ├── check update
                  ├── install
                  └── rollback
                      |
                      v
      ai-agent-governance → Project Governance (.governance/)
```

#### 1. Version metadata

Add `version` to the SKILL.md frontmatter:

```yaml
---
name: ai-agent-governance
version: 0.5.0
---
```

Agents can then compare: `local: 0.5.0` vs `remote: 0.6.0` → update available.

#### 2. Capabilities

| Capability | Behavior |
| --- | --- |
| CHECK | current version · latest release · changelog |
| UPDATE | download new version → replace skill → verify |
| ROLLBACK | restore the previous version |

#### 3. Integration options

- **(a) Standalone skill** — `.agents/skills/skill-manager/` (recommended; installation-layer responsibility). Existing seed: [`ai-skill-manager`](https://github.com/Consciencieux/ai-skill-manager) (Issue #1).
- **(b) UPDATE mode inside `ai-agent-governance`** — `/update-skill ai-agent-governance`; operates on `~/.agents/skills/ai-agent-governance`, NOT on `project/.governance`.

#### 4. Update flow

```
Inspect (read local version from SKILL.md frontmatter)
→ Query upstream release
→ Compare versions
→ Backup current skill
→ Update
→ Verify
```

#### 5. Version roadmap

- **v0.3.x** — not implemented (stabilize governance model / release / CI first)
- **Deferred (long-term)** — revisit when the v0.5.2 version-sync step proves insufficient; no version target yet

### Affected Files

Planned (implementation phase):

- `SKILL.md` — frontmatter gains `version` (kept in sync with releases); option (b) additionally adds an UPDATE mode
- Standalone implementation lives in the separate `ai-skill-manager` repository (existing, Issue #1) — this repo's changes stay minimal
- `docs/en/roadmap.md` / `docs/en/architecture.md` — status and architecture updates
- `references/` — unchanged unless option (b) is chosen (new mode would reference the update flow)

### Risks

- Interrupted/corrupted update → pre-installed backup + rollback path required
- Automatic updates may introduce breaking changes → read changelog + user confirmation before update
- Concurrent updates when multiple agents share `.agents/skills` → serialization/locking
- Update may be incompatible with previously generated artifacts (`.governance` output, `references/` structure) → version compatibility statement + migration notes
- Rollback may desync from already-governed projects → document reconciliation steps

### Validation Method

- CHECK correctly reports local vs remote version differences (test with a simulated remote version)
- UPDATE full flow: download → backup → replace → verify (sandbox test)
- ROLLBACK restores the backed-up version
- Interrupted update (simulated) leaves no half-broken state
- SKILL.md frontmatter `version` matches the release tag (version consistency check)

---
