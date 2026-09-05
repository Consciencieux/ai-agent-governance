// tests/suites/release.test.js — batch-1 migration from tests/run-tests.js (anti-patch plan §3).
// Verbatim region move (marker-to-marker); helper consolidation into tests/support/ is batch 2.


const { spawnSync } = require("child_process");
const fs = require("fs");
const path = require("path");

module.exports = (test) => {


test("release plan: README-scale doc changes recommend patch", () => {
  const r = planChanges("1.2.3", [{ type: "docs", description: "rewrite README" }]);
  if (r.status !== 0) return false;
  const out = JSON.parse(r.stdout);
  return out.releaseType === "patch" && out.recommended === "1.2.4" && out.needsClarification === false &&
    out.riskLevel === "low" && out.reviewRecommendation === "none" && out.reviewStatus === "not-required";
});

test("release plan: large internal refactor recommends patch", () => {
  const r = planChanges("1.2.3", [{ type: "refactor", description: "restructure modules" }]);
  if (r.status !== 0) return false;
  const out = JSON.parse(r.stdout);
  return out.releaseType === "patch" && out.recommended === "1.2.4" &&
    out.riskLevel === "medium" && out.reviewRecommendation === "suggested";
});

test("release plan: new CLI command recommends minor", () => {
  const r = planChanges("1.2.3", [{ type: "feature", description: "add CLI command" }]);
  if (r.status !== 0) return false;
  const out = JSON.parse(r.stdout);
  return out.releaseType === "minor" && out.recommended === "1.3.0" &&
    out.riskLevel === "medium" && out.reviewRecommendation === "suggested";
});

test("release plan: deleted public API recommends major", () => {
  const r = planChanges("1.2.3", [{ type: "breaking", description: "remove public API" }]);
  if (r.status !== 0) return false;
  const out = JSON.parse(r.stdout);
  return out.releaseType === "major" && out.recommended === "2.0.0" &&
    out.riskLevel === "high" && out.reviewRecommendation === "required" && out.reviewStatus === "required";
});

test("release plan: uncertain breaking change requests clarification (exit 2)", () => {
  const r = planChanges("1.2.3", [
    { type: "breaking", description: "maybe external impact?", uncertain: true },
  ]);
  if (r.status !== 2) return false;
  const out = JSON.parse(r.stdout);
  return out.needsClarification === true && out.releaseType === "unknown" &&
    out.riskLevel === "high" && out.reviewRecommendation === "required";
});

test("release plan: --file reads JSON input from a file", () => {
  const dir = tmp("rel-file");
  const inputPath = path.join(dir, "input.json");
  write(inputPath, JSON.stringify({ current: "1.2.3", changes: [{ type: "feature", description: "new CLI command" }] }));
  const r = runRelease(dir, ["plan", "--file", inputPath]);
  if (r.status !== 0) return false;
  const out = JSON.parse(r.stdout);
  return out.releaseType === "minor" && out.recommended === "1.3.0" &&
    out.riskLevel === "medium" && out.reviewRecommendation === "suggested";
});

test("release plan: null input is rejected cleanly", () => {
  const r = runRelease(TMP_ROOT, ["plan", "--json", "null"]);
  return r.status === 1 && /input must be a JSON object/.test(r.stderr) && !/TypeError/.test(r.stderr);
});

test("release execute: unapproved release creates no tag", () => {
  const dir = tmp("rel-noapprove");
  gitInit(dir);
  const head = gitHead(dir);
  const proposal = {
    current: "1.0.0",
    recommended: "1.0.1",
    releaseType: "patch",
    headSha: head,
    summary: "test patch",
    riskLevel: "low",
    reviewRecommendation: "none",
    reviewStatus: "not-required",
  };
  const proposalPath = path.join(dir, ".governance", "release-proposal.json");
  write(proposalPath, JSON.stringify(proposal));
  const r = runRelease(dir, ["execute", "--proposal", proposalPath]);
  return r.status !== 0 && gitTags(dir) === "";
});

test("release execute: approved release creates annotated tag", () => {
  const dir = tmp("rel-approved");
  gitInit(dir);
  const head = gitHead(dir);
  const proposal = {
    current: "1.0.0",
    recommended: "1.0.1",
    releaseType: "patch",
    headSha: head,
    summary: "test patch",
    riskLevel: "low",
    reviewRecommendation: "none",
    reviewStatus: "not-required",
  };
  const proposalPath = path.join(dir, ".governance", "release-proposal.json");
  write(proposalPath, JSON.stringify(proposal));
  const r = runRelease(dir, ["execute", "--proposal", proposalPath, "--yes"]);
  if (r.status !== 0) return false;
  const type = spawnSync("git", ["cat-file", "-t", "v1.0.1"], { cwd: dir, encoding: "utf8" });
  return gitTags(dir) === "v1.0.1" && String(type.stdout).trim() === "tag";
});

test("release execute: proposal without headSha is rejected (identity binding)", () => {
  // A hand-written proposal that never recorded headSha must not bypass the HEAD check;
  // the release is scoped to a specific commit, so its absence is a hard rejection.
  const dir = tmp("rel-nohead");
  gitInit(dir);
  const proposal = {
    current: "1.0.0",
    recommended: "1.0.1",
    releaseType: "patch",
    summary: "no headSha",
    riskLevel: "low",
    reviewRecommendation: "none",
    reviewStatus: "not-required",
  };
  const proposalPath = path.join(dir, ".governance", "release-proposal.json");
  write(proposalPath, JSON.stringify(proposal));
  const r = runRelease(dir, ["execute", "--proposal", proposalPath, "--yes"]);
  return r.status !== 0 && gitTags(dir) === "" && /headSha/.test(r.stdout + r.stderr);
});

test("release execute: high-risk proposal requires review evidence", () => {
  const dir = tmp("rel-high-risk");
  gitInit(dir);
  const head = gitHead(dir);
  const proposal = {
    current: "1.0.0",
    recommended: "1.0.1",
    releaseType: "patch",
    headSha: head,
    summary: "security fix",
    riskLevel: "high",
    reviewRecommendation: "required",
    reviewStatus: "required",
  };
  const proposalPath = path.join(dir, ".governance", "release-proposal.json");
  write(proposalPath, JSON.stringify(proposal));
  const blocked = runRelease(dir, ["execute", "--proposal", proposalPath, "--yes"]);
  if (blocked.status !== 4 || gitTags(dir) !== "" || !/requires completed review/.test(blocked.stderr)) return false;
  proposal.reviewStatus = "completed";
  write(proposalPath, JSON.stringify(proposal));
  const allowed = runRelease(dir, ["execute", "--proposal", proposalPath, "--yes"]);
  return allowed.status === 0 && gitTags(dir) === "v1.0.1";
});

test("release execute: null proposal is rejected cleanly", () => {
  const dir = tmp("rel-null-proposal");
  gitInit(dir);
  const proposalPath = path.join(dir, ".governance", "release-proposal.json");
  write(proposalPath, "null");
  const r = runRelease(dir, ["execute", "--proposal", proposalPath, "--yes"]);
  return r.status === 3 && /proposal must be a JSON object/.test(r.stderr) && !/TypeError/.test(r.stderr) && gitTags(dir) === "";
});

// T5.5 (repository-boundary-split plan §5): skill-release.md is self-contained. The SemVer
// judging rules, tiered review table and transactionality clauses live inline; the only
// sanctioned mention of the governed-project release.md is a usage-boundary pointer — a
// line that names the governed-project audience. A rule citation ("…见 release.md §…")
// reintroduces the pre-split dependency and must fail. Self-mutation-verified: the
// reintroduced citation appended below MUST be flagged, or the guard itself is broken.
function releaseMdRuleCitations(body) {
  const offenders = [];
  body.split(/\r?\n/).forEach((line, i) => {
    if (!line.includes("references/workflows/release.md")) return;
    if (/被治理项目|目标项目|governed project/i.test(line)) return; // usage-boundary pointer
    offenders.push(`line ${i + 1}: ${line.trim()}`);
  });
  return offenders;
}

test("skill-release.md: release.md mentions stay usage-boundary pointers, not rule citations", () => {
  const body = fs.readFileSync(path.join(SKILL_ROOT, "repo-workflows", "skill-release.md"), "utf8");
  const offenders = releaseMdRuleCitations(body);
  if (offenders.length) {
    console.error("  rule citations of release.md found in skill-release.md: " + offenders.join(" | "));
    return false;
  }
  // mutation check: the L53/L57-style dependency (rule text citing release.md, no audience
  // marker) must be caught — otherwise this test proves nothing
  const mutated = body + "\n事务性条款见 `references/workflows/release.md`。\n";
  return releaseMdRuleCitations(mutated).length > 0;
});

};
