# 本仓 Agent 约定（REPO-ONLY）

按需加载。语言政策权威仍在 `references/policies/runtime-invariants.policy.md` § 语言政策 + CONTRIBUTING；本文件只列本仓施工习惯。

- Language / glossary: CONTRIBUTING + `references/policies/runtime-invariants.policy.md` § 语言政策（product/roadmap ×3; plans/findings/ADR = 简体中文）.
- Commits: Conventional Commits, English.
- After moves: re-check hardcoded dir lists (`SCAN_DIRS`, role lists, roots).
- Prompt-sync: sub-skill / check-script → `commands.md` (+ CHANGELOG if behavioral).
- Releases: governed → `references/workflows/release.md`; this repo → `repo-workflows/skill-release.md`.
- Roadmap = index; update it in the same change as plan lifecycle events.
- Release scratch: `repo-tools/.release/proposal.json` (gitignored).
