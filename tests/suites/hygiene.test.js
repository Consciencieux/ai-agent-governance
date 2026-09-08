// tests/suites/hygiene.test.js — check-coding-hygiene.js behavior (anti-patch plan §5).
const { spawnSync } = require("child_process");
const path = require("path");
const fs = require("fs");

const HYGIENE = path.join(__dirname, "..", "..", "repo-tools", "check-coding-hygiene.js");
const repo = path.join(__dirname, "..", "..");

// fixture text is assembled so the checker's own advisory scan never reads it as debt
const marker = ["// TO", "DO: figure out ordering"].join("");
const suiteFile = (name) => "module.exports = (test) => {\n  test(\"" + name + "\", () => true);\n};\n";

module.exports = (test) => {
  // The residue scan must cover every source tree the repo maintains. When the boundary
  // split moved six gates from scripts/ to repo-tools/, the scan list still named the old
  // directory, so those files — the gates themselves — silently left the check: a marker
  // planted in repo-tools/ was invisible while the identical marker in scripts/ was caught.
  // Nothing failed, because no test pinned the scanned set. This does.
  test("coding hygiene: the residue scan covers every maintained source tree", () => {
    const src = fs.readFileSync(HYGIENE, "utf8");
    const m = /const SCAN_DIRS = \[([^\]]+)\]/.exec(src);
    if (!m) { console.error("  SCAN_DIRS not found"); return false; }
    const scanned = m[1].split(",").map((s) => s.trim().replace(/^["']|["']$/g, "")).filter(Boolean);
    // every top-level directory holding first-party source the repo maintains — five trees
    // since the boundary split added repo-tools/ and repo-workflows/. Pinning only four left
    // repo-workflows/ unpinned.
    const expected = ["scripts", "repo-tools", "repo-workflows", "references", "tests"];
    const missing = expected.filter((d) => !scanned.includes(d));
    if (missing.length) { console.error("  unscanned source trees: " + missing.join(", ")); return false; }
    return true;
  });

  // Behavioural counterpart: prove the coverage on a real fixture rather than on the
  // constant alone, so renaming the constant cannot make the test above vacuous.
  test("coding hygiene: a marker inside repo-tools/ is reported like one inside scripts/", () => {
    const dir = tmp("hygiene-repo-tools");
    fs.mkdirSync(path.join(dir, "tests", "suites"), { recursive: true });
    fs.mkdirSync(path.join(dir, "repo-tools"), { recursive: true });
    fs.mkdirSync(path.join(dir, "scripts"), { recursive: true });
    fs.writeFileSync(path.join(dir, "tests", "run-tests.js"), "require('./suites/a.test.js');\n", "utf8");
    fs.writeFileSync(path.join(dir, "tests", "suites", "a.test.js"), suiteFile("x"), "utf8");
    fs.writeFileSync(path.join(dir, "repo-tools", "tool.js"), marker + "\n", "utf8");
    const r = spawnSync(process.execPath, [HYGIENE, "--json"], { cwd: dir, encoding: "utf8" });
    let j;
    try { j = JSON.parse(r.stdout); } catch { return false; }
    // Assert the CATEGORY and the path, not just "the string appears somewhere in the
    // JSON": a weak contains() would pass if the file showed up in any unrelated field.
    const unresolved = ((j.issues || {}).unresolved_marker || []);
    const found = unresolved.some((i) => /repo-tools\/tool\.js/.test(String(i)));
    if (!found) console.error("  a marker in repo-tools/ went unreported: " + JSON.stringify(j).slice(0, 220));
    return found;
  });

  test("coding hygiene: current repo passes the mechanical gate", () => {
    const r = spawnSync(process.execPath, [HYGIENE, "--gate", "--json"], { cwd: repo, encoding: "utf8" });
    if (r.status !== 0) return false;
    const o = JSON.parse(r.stdout);
    return o.gatePass === true && o.issues.monolith_registration.length === 0 && o.issues.empty_suite.length === 0;
  });

  test("coding hygiene: monolith registration fails the gate in ANY quote style", () => {
    // single quotes must not slip past the anti-monolith check (review finding)
    const dir = tmp("hygiene-mono");
    fs.mkdirSync(path.join(dir, "tests", "suites"), { recursive: true });
    write(path.join(dir, "tests", "run-tests.js"), "#!x\n\nfunction test(n, f) {}\n\ntest('stray registration', () => true);\n");
    write(path.join(dir, "tests", "suites", "a.test.js"), suiteFile("ok"));
    const r = spawnSync(process.execPath, [HYGIENE, "--gate", "--json"], { cwd: dir, encoding: "utf8" });
    if (r.status !== 1) return false;
    return JSON.parse(r.stdout).gateIssues.some((g) => g.kind === "monolith_registration");
  });

  test("coding hygiene: an empty suite fails the gate (tests lost on migration)", () => {
    const dir = tmp("hygiene-empty");
    fs.mkdirSync(path.join(dir, "tests", "suites"), { recursive: true });
    write(path.join(dir, "tests", "run-tests.js"), "#!x\n\nconst tests = [];\nfunction test(n, f) { tests.push({ n, f }); }\n");
    write(path.join(dir, "tests", "suites", "ghost.test.js"), "module.exports = (test) => {\n};\n");
    const r = spawnSync(process.execPath, [HYGIENE, "--gate", "--json"], { cwd: dir, encoding: "utf8" });
    if (r.status !== 1) return false;
    return JSON.parse(r.stdout).gateIssues.some((g) => g.kind === "empty_suite" && g.item.includes("ghost.test.js"));
  });

  test("coding hygiene: non-suite files in tests/suites/ are not mistaken for empty suites", () => {
    // a README or fixture JSON beside the suites must not fail the gate (review finding)
    const dir = tmp("hygiene-nonsuite");
    fs.mkdirSync(path.join(dir, "tests", "suites"), { recursive: true });
    write(path.join(dir, "tests", "run-tests.js"), "#!x\n\nconst tests = [];\nfunction test(n, f) { tests.push({ n, f }); }\n");
    write(path.join(dir, "tests", "suites", "a.test.js"), suiteFile("ok"));
    write(path.join(dir, "tests", "suites", "README.md"), "# suites\n");
    write(path.join(dir, "tests", "suites", "fixture.json"), "{}\n");
    const r = spawnSync(process.execPath, [HYGIENE, "--gate", "--json"], { cwd: dir, encoding: "utf8" });
    const o = JSON.parse(r.stdout);
    return r.status === 0 && o.gatePass === true && o.issues.empty_suite.length === 0;
  });

  test("coding hygiene: ownerless marker is advisory, owner form is exempt", () => {
    const dir = tmp("hygiene-marker");
    fs.mkdirSync(path.join(dir, "tests", "suites"), { recursive: true });
    fs.mkdirSync(path.join(dir, "scripts"), { recursive: true });
    write(path.join(dir, "tests", "run-tests.js"), "#!x\n\nconst tests = [];\nfunction test(n, f) { tests.push({ n, f }); }\n");
    write(path.join(dir, "tests", "suites", "a.test.js"), suiteFile("ok"));
    write(path.join(dir, "scripts", "ownerless.js"), marker + "\n");
    write(path.join(dir, "scripts", "owned.js"), ["// TO", "DO(alice@corp.com): scoped and owned"].join("") + "\n");
    const r = spawnSync(process.execPath, [HYGIENE, "--gate", "--json"], { cwd: dir, encoding: "utf8" });
    const o = JSON.parse(r.stdout);
    // exactly one advisory hit (the ownerless one), gate still green
    return r.status === 0 && o.gatePass === true && o.unresolvedMarkerCount === 1 &&
      o.issues.unresolved_marker[0].includes("ownerless.js");
  });

  test("coding hygiene: advisory default mode never fails on markers alone", () => {
    const dir = tmp("hygiene-advisory");
    fs.mkdirSync(path.join(dir, "tests", "suites"), { recursive: true });
    fs.mkdirSync(path.join(dir, "scripts"), { recursive: true });
    write(path.join(dir, "tests", "run-tests.js"), "#!x\n\nconst tests = [];\nfunction test(n, f) { tests.push({ n, f }); }\n");
    write(path.join(dir, "tests", "suites", "a.test.js"), suiteFile("ok"));
    write(path.join(dir, "scripts", "x.js"), marker + "\n");
    const plain = spawnSync(process.execPath, [HYGIENE], { cwd: dir, encoding: "utf8" });
    return plain.status === 0 && /advisory/.test(plain.stdout);
  });

  test("coding hygiene: a missing run-tests.js is a gate failure", () => {
    const dir = tmp("hygiene-noentry");
    fs.mkdirSync(path.join(dir, "tests", "suites"), { recursive: true });
    write(path.join(dir, "tests", "suites", "a.test.js"), suiteFile("ok"));
    const r = spawnSync(process.execPath, [HYGIENE, "--gate", "--json"], { cwd: dir, encoding: "utf8" });
    return r.status === 1 && JSON.parse(r.stdout).gateIssues.some((g) => g.kind === "monolith_registration");
  });

  test("coding hygiene: a governed project without the suite layout is not applicable", () => {
    // the script ships in the payload tarball but INIT never installs it; if it is ever
    // run inside a governed project it must no-op, not invent a violation
    const dir = tmp("hygiene-governed");
    fs.mkdirSync(path.join(dir, "scripts"), { recursive: true });
    write(path.join(dir, "scripts", "verify-governance.js"), "// governed project shape\n");
    const r = spawnSync(process.execPath, [HYGIENE, "--gate", "--json"], { cwd: dir, encoding: "utf8" });
    const o = JSON.parse(r.stdout);
    return r.status === 0 && o.applicable === false && o.gatePass === true;
  });

  // A truncated action SHA is accepted by YAML and by every local gate, but GitHub
  // rejects it at workflow start ("the provided ref is the shortened version of a
  // commit SHA"). v0.14.1+ shipped a 39-char upload-artifact pin and CI failed on the
  // first run after the push. Full-length (40 hex) is the decidable invariant.
  test("ci workflow: every pinned action SHA is full length (40 hex)", () => {
    const wf = path.join(repo, ".github", "workflows", "ci.yml");
    if (!fs.existsSync(wf)) return "skip: no .github/workflows/ci.yml in this repo";
    const lines = fs.readFileSync(wf, "utf8").split(/\r?\n/);
    let pinned = 0;
    for (const line of lines) {
      const m = line.match(/uses:\s*[\w.\-]+\/[\w.\-]+@([0-9a-f]+)/i);
      if (!m) continue;
      pinned++;
      if (m[1].length !== 40) {
        console.error("  truncated SHA (" + m[1].length + " chars, need 40): " + line.trim());
        return false;
      }
    }
    // liveness: the repo pins actions by SHA, so a passing run must have seen some
    return pinned >= 3;
  });

  // mutation-probe.js is the assurance tool for the ASSERTIONS themselves, so it is exactly
  // the file where a silent failure is most costly: a probe that reports "all killed" while
  // actually failing to run would certify a broken suite. Its own defects must be loud.
  const PROBE = path.join(repo, "repo-tools", "mutation-probe.js");

  test("mutation-probe: resolves the repo from CWD, not from its own location", () => {
    // Deriving ROOT from __filename broke the moment the file was copied elsewhere (the
    // clone source became the temp dir and every mutation reported a clone failure). The
    // probe must locate the repo via git/CWD so a copy still targets the real repository.
    const src = fs.readFileSync(PROBE, "utf8");
    if (/const ROOT = path\.dirname\(path\.dirname\(__filename\)\);/.test(src)) {
      console.error("  ROOT is derived from __filename — a copied probe targets the wrong tree");
      return false;
    }
    return /rev-parse["']?,\s*["']--show-toplevel/.test(src) && /tests["'],\s*["']run-tests\.js/.test(src);
  });

  test("mutation-probe: an unanchored mutation fails instead of counting as a pass", () => {
    // A mutation whose target moved must be reported, never silently skipped: a matrix that
    // matches nothing would otherwise report a perfect score against code it never touched.
    // Scope the search to the unanchored BRANCH (up to its `continue;`) — a fixed-size
    // window reaches the later `if (!killed) exitCode = 1;` and passes even when this
    // branch's own exit is removed (that vacuous form was caught by mutating it).
    const src = fs.readFileSync(PROBE, "utf8");
    const at = src.indexOf('status: "unanchored"');
    if (at < 0) {
      console.error("  no unanchored result branch found");
      return false;
    }
    const stop = src.indexOf("continue;", at);
    if (stop < 0) {
      console.error("  unanchored branch has no continue — cannot scope the assertion");
      return false;
    }
    return /exitCode = 1;/.test(src.slice(at, stop));
  });

  test("mutation-probe: every mutation is reverted and the revert is verified", () => {
    // A probe that leaves a mutated clone behind would poison every later result in the
    // same run. The restore must be in a finally block AND byte-verified.
    const src = fs.readFileSync(PROBE, "utf8");
    const hasFinally = /finally\s*\{[\s\S]{0,400}?writeFileSync\(target, orig\)/.test(src);
    const verifies = /restore verification failed/.test(src);
    return hasFinally && verifies;
  });

  test("mutation-probe: refuses to report results when the baseline is not green", () => {
    // Mutation results are meaningless against a already-failing suite: every mutation
    // would look "killed" by the pre-existing failures.
    const src = fs.readFileSync(PROBE, "utf8");
    return /baseline is not green/.test(src) && /base\.exit !== 0/.test(src);
  });

  test("mutation-probe: --only with no label errors instead of running everything", () => {
    const r = spawnSync(process.execPath, [PROBE, "--only"], { cwd: repo, encoding: "utf8", timeout: 60000 });
    return r.status === 1 && /--only requires a label prefix/.test(String(r.stderr || ""));
  });

};
