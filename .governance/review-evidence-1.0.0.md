# v1.0.0 Review Evidence

Whole-project read-only review, 6 domains in parallel (scripts/, repo-tools/, references/,
tests/, docs+CHANGELOG, CI+config). 75 raw findings reported; every High was re-verified
against the execution environment rather than accepted from the report.

## High findings — verification outcome

| # | Claim | Verification | Outcome |
| --- | --- | --- | --- |
| H1 | verify-governance.js naming breaks 39 references in governed projects | INIT'd a throwaway project with the real generator; installed file IS verify-governance.js; `node scripts/verify-governance.js --json` exits 0 with valid JSON, no MODULE_NOT_FOUND | false positive |
| H2 | protected list omits 3 INSTALLED scripts | all three appear literally in governance-files.policy.md | false positive |
| H3 | .trim() corrupts porcelain filenames | git quotes names with spaces (`?? "bad .md "`); the trimmed path matches no real file and no allowlist entry; trailing-space names cannot be created on Windows | theoretical, not a defect |
| H4 | check-doc-parity walk() crashes without try/catch | sole call site L82 is guarded by `if (!fs.existsSync(dir)) return null;` at L80 | false positive |

## Medium findings — sampled verification

| # | Claim | Verification | Outcome |
| --- | --- | --- | --- |
| M18 | CHANGELOG v0.13.1 cites scripts introduced later | `git log --diff-filter=A` puts all three in f21d370; `git tag --contains` = v0.13.1; "seven files" = 6 repo-tools + 1 repo-workflows | false positive |
| M9 | .env credentials go undetected | regression tests exist: force-added .env is scanned; real key in .env.example still caught | already covered |
| M7 | drift-report.json concurrent clobber | confirmed: 3 writers, read-then-write not atomic | real, low impact (gates run serially) |
| M15 | CI runs only `check` | confirmed: freshness/delivery/narration validated only at release | real, non-blocking |

## Interface surface frozen at 1.0.0

- 38 trigger words across 8 sub-skills — verified present in all three commands.md trees (0 missing)
- 9 INSTALLED script CLIs and their flags
- init-spec contract: 15 inputs, 38 artifacts (A 15 / B 16 / C 7)
- 6 docs/rules/ paths in governed projects
- .governance/ runtime contract: manifest/state/preflight/git-policy/sync-rules + generated/skills/

## Gate evidence (mechanical)

- `npm run check:all` — exit 0
- 306/307 tests passed, 1 honest skip
- role completeness: INSTALLED 24 / SKILL-INTERNAL 3 / undecided 0 — distribution contract closed
- plan delivery: 28 plans scanned, every declared path and identifier delivered
- target-chain: generator INIT on a clean project, installed scripts execute

## Residual, deliberately deferred to post-1.0.0 SemVer evolution

- M15 CI gate completeness (CI runs `check`, not `check:all`)
- M7 drift-report write atomicity

Reviewer: repository maintainer (human-in-the-loop, Approval Gate).
