// tests/suites/plan-delivery.test.js — split from tests/suites/consistency.test.js (2026-09-08).
// plan-delivery reconciliation tests moved out of the consistency monolith (check-plan-delivery.js).


const { spawnSync } = require("child_process");
const fs = require("fs");
const path = require("path");

module.exports = (test) => {
// Anchor semantics: a plan declaring an EXISTING file must be able to prove the change
// landed. Existence alone used to satisfy the gate before the plan was even written
// (the vacuous case: removal-hygiene declared two landing points, neither received the
// rule, gate reported 28 plans verified). The anchor clause closes it.
test("check-plan-delivery: an anchor on an existing file verifies content, not just existence", () => {
  const dir = tmp("plandel-anchor");
  fs.mkdirSync(path.join(dir, "docs/archive"), { recursive: true });
  fs.mkdirSync(path.join(dir, "scripts"), { recursive: true });
  // the file exists but the promised rule never landed
  write(path.join(dir, "AGENTS.md"), "# Agents\nnothing promised\n", "utf8");
  write(path.join(dir, "docs/archive/p.md"), [
    "# P", "", "> **Status: implemented.**", "", "**Target: repo-infra**", "",
    "### Affected Files", "", "- `AGENTS.md` — anchor: `deletion means deletion`"
  ].join("\n"));
  const bad = spawnSync(process.execPath, [PLAN_DELIVERY, "--gate"], { cwd: dir, encoding: "utf8" });
  write(path.join(dir, "AGENTS.md"), "# Agents\ndeletion means deletion\n", "utf8");
  const good = spawnSync(process.execPath, [PLAN_DELIVERY, "--gate"], { cwd: dir, encoding: "utf8" });
  return bad.status === 1 && good.status === 0;
});


test("check-plan-delivery: an entry without an anchor keeps existence semantics (back-compat)", () => {
  const dir = tmp("plandel-noanchor");
  fs.mkdirSync(path.join(dir, "docs/archive"), { recursive: true });
  write(path.join(dir, "AGENTS.md"), "# Agents\nwhatever\n", "utf8");
  write(path.join(dir, "docs/archive/p.md"), [
    "# P", "", "> **Status: implemented.**", "", "**Target: repo-infra**", "",
    "### Affected Files", "", "- `AGENTS.md` — receives the rule"
  ].join("\n"));
  const r = spawnSync(process.execPath, [PLAN_DELIVERY, "--gate"], { cwd: dir, encoding: "utf8" });
  return r.status === 0;
});


test("check-plan-delivery: archived plan declaring a missing file exits 1 in gate mode", () => {
  const dir = tmp("plandel-missing");
  buildPlanRepo(dir, "# P\n\n### Affected Files\n\n- `references/templates/never-created.md` — new\n");
  const r = spawnSync(process.execPath, [PLAN_DELIVERY, "--gate"], { cwd: dir, encoding: "utf8" });
  return r.status === 1 && r.stdout.includes("never-created.md");
});


test("check-plan-delivery: delivered declaration exits 0", () => {
  const dir = tmp("plandel-ok");
  buildPlanRepo(dir, "# P\n\n### Affected Files\n\n- `references/templates/real.md` — new\n");
  fs.writeFileSync(path.join(dir, "references/templates/real.md"), "x", "utf8");
  const r = spawnSync(process.execPath, [PLAN_DELIVERY, "--gate"], { cwd: dir, encoding: "utf8" });
  return r.status === 0;
});


test("check-plan-delivery: design-only plan is skipped", () => {
  const dir = tmp("plandel-design");
  fs.mkdirSync(path.join(dir, "docs/en/plans"), { recursive: true });
  fs.writeFileSync(path.join(dir, "docs/en/plans/future.md"), "# F\n\n> **Status: design plan, not implemented.**\n\n### Affected Files\n\n- `references/templates/not-yet.md` — new\n", "utf8");
  const r = spawnSync(process.execPath, [PLAN_DELIVERY, "--gate"], { cwd: dir, encoding: "utf8" });
  return r.status === 0;
});


// The four plan-status classifiers diverged: a Status line whose colon sits OUTSIDE the
// bold (`**Status:** design…` vs `**Status: design…**`) was design-only here and
// "unknown" in the payload classifier, and the same plan got different verdicts per
// script. The canonical form is `> **Status: <keyword>**` (colon inside the bold);
// anything else is NOT the canonical status line and must not be read as a verdict
// (audit 2026-09-07). A plan with the off-canonical spelling must be AUDITED, not
// silently skipped as design-only.
test("check-plan-delivery: a non-canonical Status line is NOT treated as design-only", () => {
  const dir = tmp("plandel-noncanon");
  fs.mkdirSync(path.join(dir, "docs/en/plans"), { recursive: true });
  // colon outside the bold + no blockquote: the loose old regex matched this; the
  // canonical regex must not
  fs.writeFileSync(path.join(dir, "docs/en/plans/future.md"), "# F\n\n> Status: **design plan, not implemented**\n\n### Affected Files\n\n- `references/templates/not-yet.md` — new\n", "utf8");
  const r = spawnSync(process.execPath, [PLAN_DELIVERY, "--gate"], { cwd: dir, encoding: "utf8" });
  // The plan is not design-only, so the undelivered declaration must be reported
  return r.status === 1 && /not found|undelivered/.test(r.stdout);
});


test("check-plan-delivery: behavioural declaration is verified (writes: X in Y)", () => {
  const dir = tmp("plandel-behaviour");
  fs.mkdirSync(path.join(dir, "docs/archive"), { recursive: true });
  fs.mkdirSync(path.join(dir, "scripts"), { recursive: true });
  write(path.join(dir, "docs/archive/p.md"), "# P\n\n### Affected Files\n\n- writes: `report.json` in `scripts/x.js`\n");
  write(path.join(dir, "scripts/x.js"), "// nothing");
  const bad = spawnSync(process.execPath, [PLAN_DELIVERY, "--gate"], { cwd: dir, encoding: "utf8" });
  write(path.join(dir, "scripts/x.js"), "fs.writeFileSync(\"report.json\", d)");
  const good = spawnSync(process.execPath, [PLAN_DELIVERY, "--gate"], { cwd: dir, encoding: "utf8" });
  return bad.status === 1 && /behaviour/.test(bad.stdout) && good.status === 0;
});


test("check-plan-delivery: --plan on a missing file errors, not silent pass", () => {
  const dir = tmp("plandel-planmissing");
  fs.mkdirSync(path.join(dir, "docs/en/plans"), { recursive: true });
  const r = spawnSync(process.execPath, [PLAN_DELIVERY, "--plan", "docs/en/plans/absent.md"], { cwd: dir, encoding: "utf8" });
  return r.status === 1 && r.stdout.includes("plan not found");
});


test("check-plan-delivery: a bare bashname matches its runtime artifact (normalisation)", () => {
  // A plan citing the bare "git-policy.json" resolves to the .governance/git-policy.json
  // runtime artifact — must NOT be a vacuous substring pass of an unrelated fragment.
  const dir = tmp("plandel-basename");
  fs.mkdirSync(path.join(dir, "docs/archive"), { recursive: true });
  fs.mkdirSync(path.join(dir, "references/templates"), { recursive: true });
  fs.mkdirSync(path.join(dir, "scripts"), { recursive: true });
  fs.writeFileSync(path.join(dir, "references/templates/git-policy.template.md"), "x git-policy.json x", "utf8");
  fs.writeFileSync(path.join(dir, "scripts/verify_governance.js"), "// governance git-policy.json", "utf8");
  // A plan declaring "git-policy.json" must resolve (its generating logic exists), and the
  // identifier corpus must be able to find it WITHOUT the checker's own source counting.
  fs.writeFileSync(path.join(dir, "docs/archive/p.md"),
    "# P\n\n### Affected Files\n\n- `git-policy.json` — runtime artifact\n");
  const r = spawnSync(process.execPath, [PLAN_DELIVERY, "--gate"], { cwd: dir, encoding: "utf8" });
  return r.status === 0;
});


test("check-plan-delivery: ## Affected Files is extracted (template heading level)", () => {
  // C1: the section anchor was the literal "###", which matches inside "####" but never
  // inside "##" — so a plan written with `## Affected Files` extracted nothing and the
  // script still printed "every declared path delivered". That is the heading level the
  // SHIPPED plan template uses (references/templates/sub-skills.md), so every plan written
  // to this skill's own template was unverifiable in a governed project (audit 2026-09-05).
  const dir = tmp("plandel-h2");
  buildPlanRepo(dir, "# P\n\n## Affected Files\n\n- `references/templates/never-created-h2.md` — new\n");
  const r = spawnSync(process.execPath, [PLAN_DELIVERY, "--gate"], { cwd: dir, encoding: "utf8" });
  return r.status === 1 && r.stdout.includes("never-created-h2.md");
});


test("check-plan-delivery: every Affected Files section is scanned, not just the first", () => {
  // Review finding: returning the first matching heading level discarded the others, so a
  // plan with BOTH `## Affected Files` and a later `### Affected Files` had its H2
  // declarations silently dropped — the same vacuous-pass class the H2 fix was closing.
  const dir = tmp("plandel-multi-section");
  buildPlanRepo(dir, "# P\n\n## Affected Files\n\n- `scripts/ghost-in-h2.js` — new\n\n### Affected Files\n\n- `scripts/x.js` — new\n");
  fs.writeFileSync(path.join(dir, "scripts/x.js"), "x", "utf8");
  const r = spawnSync(process.execPath, [PLAN_DELIVERY, "--gate"], { cwd: dir, encoding: "utf8" });
  return r.status === 1 && r.stdout.includes("ghost-in-h2.js");
});


test("check-plan-delivery: a second same-level Affected Files section is also scanned", () => {
  const dir = tmp("plandel-two-sections");
  buildPlanRepo(dir, "# P\n\n## Affected Files\n\n- `scripts/x.js` — new\n\n## Notes\n\ntext\n\n## Affected Files\n\n- `scripts/ghost-second.js` — new\n");
  fs.writeFileSync(path.join(dir, "scripts/x.js"), "x", "utf8");
  const r = spawnSync(process.execPath, [PLAN_DELIVERY, "--gate"], { cwd: dir, encoding: "utf8" });
  return r.status === 1 && r.stdout.includes("ghost-second.js");
});


test("check-plan-delivery: #### subsection declarations are verified (extraction regression)", () => {
  // The section regex used to stop at the `\n###` prefix of `####` subsection lines, so an
  // Affected Files section written with #### subsections extracted as empty and its
  // declarations were never verified (vacuous pass). A missing file inside a ####
  // subsection must now exit 1.
  const dir = tmp("plandel-subsec-missing");
  buildPlanRepo(dir, "# P\n\n### Affected Files\n\n#### Payload\n\n- `references/templates/never-created.md` — new\n\n#### Repo-infra\n\n- `scripts/x.js` — new\n");
  fs.writeFileSync(path.join(dir, "scripts/x.js"), "x", "utf8");
  const r = spawnSync(process.execPath, [PLAN_DELIVERY, "--gate"], { cwd: dir, encoding: "utf8" });
  return r.status === 1 && r.stdout.includes("never-created.md");
});


test("check-plan-delivery: #### content is in scope but the next ### section is not", () => {
  // The section must include #### subsections but stop at the next ### (#3-level) heading;
  // an example path in a later validation section (src/a.ts) must NOT be treated as a
  // declaration, or the gate would flag a fixture example as undelivered.
  const dir = tmp("plandel-subsec-boundary");
  fs.mkdirSync(path.join(dir, "docs/archive"), { recursive: true });
  fs.mkdirSync(path.join(dir, "references/templates"), { recursive: true });
  write(path.join(dir, "docs/archive/p.md"),
    "# P\n\n### Affected Files\n\n- `references/templates/real.md` — new\n\n#### Payload\n\n- `references/templates/real2.md` — new\n\n### Validation Method\n\n- Fixture: change `src/a.ts` -> exit 1\n");
  fs.writeFileSync(path.join(dir, "references/templates/real.md"), "x", "utf8");
  fs.writeFileSync(path.join(dir, "references/templates/real2.md"), "x", "utf8");
  const r = spawnSync(process.execPath, [PLAN_DELIVERY, "--gate"], { cwd: dir, encoding: "utf8" });
  return r.status === 0;
});


test("check-plan-delivery: a directory artifact still matches its descendants", () => {
  const dir = tmp("plandel-dirfrag");
  fs.mkdirSync(path.join(dir, "docs/en/plans"), { recursive: true });
  write(path.join(dir, "docs/en/plans/x.md"),
    "# X\n\n> **Status: implemented**\n\n> **Target: payload**\n\n### Affected Files\n\n- `.governance/generated/skills/review-manager/SKILL.md` — generated skill\n");
  fs.mkdirSync(path.join(dir, "references/templates"), { recursive: true });
  write(path.join(dir, "references/templates/sub-skills.md"), "## 1. review-manager\n\n.governance/generated/skills\n");
  const r = spawnSync(process.execPath, [PLAN_DELIVERY, "--gate", "--json"], { cwd: dir, encoding: "utf8" });
  const out = JSON.parse(r.stdout);
  return r.status === 0 && out.undelivered === 0;
});
};
