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
};
