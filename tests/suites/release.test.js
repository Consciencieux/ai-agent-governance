// tests/suites/release.test.js — batch-1 migration from tests/run-tests.js (anti-patch plan §3).
// Verbatim region move (marker-to-marker); helper consolidation into tests/support/ is batch 2.


const { spawnSync } = require("child_process");
const fs = require("fs");
const path = require("path");

// `execute` refuses a proposal that `plan` did not produce (provenance binding, audit
// 2026-09-07). Tests that construct a proposal to exercise execute's OTHER guards must
// therefore stamp the same value. This mirrors release-manager.js provenanceOf() — the
// duplication is deliberate: if the derivation changes without this being updated, these
// tests fail, which is the signal we want.
function stampProvenance(p) {
  const material = [
    "ai-agent-governance/release-proposal/v1",
    String(p.current || ""),
    String(p.recommended || ""),
    String(p.releaseType || ""),
    String(p.riskLevel || ""),
    String(p.reviewRecommendation || ""),
    String(p.reviewStatus || ""),
    String(p.headSha || ""),
  ].join("\n");
  p.provenance = require("crypto").createHash("sha256").update(material).digest("hex");
  return p;
}

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
  write(proposalPath, JSON.stringify(stampProvenance(proposal)));
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
  write(proposalPath, JSON.stringify(stampProvenance(proposal)));
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
  write(proposalPath, JSON.stringify(stampProvenance(proposal)));
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
  write(proposalPath, JSON.stringify(stampProvenance(proposal)));
  const blocked = runRelease(dir, ["execute", "--proposal", proposalPath, "--yes"]);
  if (blocked.status !== 4 || gitTags(dir) !== "" || !/requires completed review/.test(blocked.stderr)) return false;
  // C6: setting reviewStatus to "completed" is NOT enough — without a reviewDigest
  // the review evidence is unbound (a review that never ran is not a review), so
  // execute must refuse and create no tag.
  proposal.reviewStatus = "completed";
  write(proposalPath, JSON.stringify(stampProvenance(proposal)));
  const c6blocked = runRelease(dir, ["execute", "--proposal", proposalPath, "--yes"]);
  return c6blocked.status !== 0 && /reviewDigest/i.test(c6blocked.stderr + c6blocked.stdout) && gitTags(dir) === "";
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


// ---------------------------------------------------------------------------
// C6: review-evidence binding. The old "reviewStatus: completed" was a self-attested
// string - the tag implied a review happened without a verifiable artifact behind it.
// plan --review-evidence now binds a SHA-256 of the review artifact into the proposal;
// execute refuses "completed" without that digest. The "explicitly-approved" path stays
// digest-free by design: a human explicitly owns the risk, headSha still binds approval
// to a specific commit.
// ---------------------------------------------------------------------------

test("release plan: --review-evidence binds a digest into the proposal", () => {
  const dir = tmp("c6-plan");
  const evidence = path.join(dir, "review-report.json");
  write(evidence, JSON.stringify({ findings: [{ severity: "general", evidence: "x" }], verdict: "fix" }));
  const r = spawnSync(process.execPath, [RELEASE_TOOL, "plan", "--json", JSON.stringify({ current: "0.9.9", changes: [{ type: "fix", description: "c6" }] }), "--review-evidence", evidence], { cwd: SKILL_ROOT, encoding: "utf8" });
  if (r.status !== 0) return false;
  const j = JSON.parse(r.stdout);
  if (!/^[0-9a-f]{64}$/.test(j.reviewDigest || "")) { console.error("  no valid reviewDigest in proposal"); return false; }
  return true;
});

test("release plan: --review-evidence on a missing file fails cleanly", () => {
  const r = spawnSync(process.execPath, [RELEASE_TOOL, "plan", "--json", JSON.stringify({ current: "0.9.9", changes: [{ type: "fix", description: "x" }] }), "--review-evidence", "zzz-missing.json"], { cwd: SKILL_ROOT, encoding: "utf8" });
  return r.status === 1;
});

test("release execute: completed review without a digest is rejected (C6)", () => {
  const dir = tmp("c6-no-digest");
  gitInit(dir);
  write(path.join(dir, "seed.txt"), "seed\n");
  spawnSync("git", ["add", "-A"], { cwd: dir, encoding: "utf8" });
  spawnSync("git", ["commit", "-q", "-m", "seed"], { cwd: dir, encoding: "utf8" });
  const head = gitHead(dir);
  const proposal = { current: "1.0.0", recommended: "1.0.1", releaseType: "patch", headSha: head, summary: "x",
    riskLevel: "high", reviewRecommendation: "required", reviewStatus: "completed" };
  const p = path.join(dir, ".governance", "release-proposal.json");
  write(p, JSON.stringify(stampProvenance(proposal)));
  const r = spawnSync(process.execPath, [RELEASE_TOOL, "execute", "--proposal", p, "--yes"], { cwd: dir, encoding: "utf8" });
  return r.status !== 0 && /reviewDigest/i.test(String(r.stderr || "") + String(r.stdout || ""));
});

test("release execute: completed review WITH digest passes C6", () => {
  const dir = tmp("c6-with-digest");
  gitInit(dir);
  const evidence = path.join(dir, "review.json");
  write(evidence, JSON.stringify({ verdict: "ok" }));
  const plan = spawnSync(process.execPath, [RELEASE_TOOL, "plan", "--json", JSON.stringify({ current: "1.0.0", changes: [{ type: "fix", description: "x" }] }), "--review-evidence", evidence], { cwd: SKILL_ROOT, encoding: "utf8" });
  const proposal = JSON.parse(plan.stdout);
  // seed FIRST so HEAD is stable, THEN capture headSha and write the proposal
  const gitignore = path.join(dir, ".gitignore");
  write(gitignore, ".governance/\n");
  write(path.join(dir, "seed.txt"), "seed\n");
  spawnSync("git", ["add", "-A"], { cwd: dir, encoding: "utf8" });
  spawnSync("git", ["commit", "-q", "-m", "seed"], { cwd: dir, encoding: "utf8" });
  proposal.headSha = gitHead(dir);
  proposal.reviewStatus = "completed";
  const p = path.join(dir, ".governance", "release-proposal.json");
  write(p, JSON.stringify(stampProvenance(proposal)));
  const r = spawnSync(process.execPath, [RELEASE_TOOL, "execute", "--proposal", p, "--yes"], { cwd: dir, encoding: "utf8" });
  if (r.status !== 0) { console.error("  execute failed: " + String(r.stderr || "").trim().slice(0, 200)); return false; }
  return true;
});

test("release execute: explicitly-approved without digest still allowed (human owns risk)", () => {
  const dir = tmp("c6-explicit");
  gitInit(dir);
  write(path.join(dir, "seed.txt"), "seed\n");
  spawnSync("git", ["add", "-A"], { cwd: dir, encoding: "utf8" });
  spawnSync("git", ["commit", "-q", "-m", "seed"], { cwd: dir, encoding: "utf8" });
  const head = gitHead(dir);
  const proposal = { current: "1.0.0", recommended: "1.0.1", releaseType: "patch", headSha: head, summary: "x",
    riskLevel: "high", reviewRecommendation: "required", reviewStatus: "explicitly-approved" };
  const p = path.join(dir, ".governance", "release-proposal.json");
  write(p, JSON.stringify(stampProvenance(proposal)));
  const r = spawnSync(process.execPath, [RELEASE_TOOL, "execute", "--proposal", p, "--yes"], { cwd: dir, encoding: "utf8" });
  return r.status === 0;
});
};
