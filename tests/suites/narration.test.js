// suite: changelog narration advisory — repo-tools/check-changelog-narration.js
const { spawnSync } = require("child_process");
const fs = require("fs");
const path = require("path");

const NARRATION = path.join(SKILL_ROOT, "repo-tools", "check-changelog-narration.js");

function runNarration(content) {
  const dir = tmp("narration");
  const cl = path.join(dir, "CHANGELOG.md");
  fs.writeFileSync(cl, content);
  const r = spawnSync(process.execPath, [NARRATION, "--file", cl], { encoding: "utf8" });
  return { status: r.status, out: (r.stdout || "") + (r.stderr || "") };
}

const BASE = "## [Unreleased]\n\n### Fixed\n\n- **A fix** — the thing changed for the user.\n\n## [0.14.1] - 2026-09-06\n";

const entries = {
  "mutation-verified": "## [Unreleased]\n\n### Fixed\n\n- **A fix** — Mutation-verified: injecting pipefail turns the test red.\n\n## [0.14.1] - 2026-09-06\n",
  "verified by INIT": "## [Unreleased]\n\n### Fixed\n\n- **A fix** — verified by INIT a governed project.\n\n## [0.14.1] - 2026-09-06\n",
  "turns the test red": "## [Unreleased]\n\n### Fixed\n\n- **A fix** — changing the regress line turns the test red.\n\n## [0.14.1] - 2026-09-06\n",
  "exit 1": "## [Unreleased]\n\n### Fixed\n\n- **A fix** — gate exits with exit 1 on breach.\n\n## [0.14.1] - 2026-09-06\n",
};

module.exports = function register(test) {
  test("narration advisory: clean [Unreleased] reports nothing", () => {
    const r = runNarration(BASE);
    return r.status === 0 && !r.out.includes("^") && r.out.includes("clean");
  });

  for (const [label, content] of Object.entries(entries)) {
    test("narration advisory: flags " + label, () => {
      const r = runNarration(content);
      return r.status === 0 && r.out.includes(label.split(" ")[0]);
    });
  }

  test("narration advisory: exit 1 = is excluded (behavioural description)", () => {
    const r = runNarration("## [Unreleased]\n\n### Fixed\n\n- **A fix** — exit 1 = another agent holds a lock.\n\n## [0.14.1] - 2026-09-06\n");
    return r.status === 0 && r.out.includes("clean");
  });

  test("narration advisory: normal change with no narration stays silent", () => {
    const r = runNarration(BASE);
    return r.status === 0 && !r.out.includes("\n  ");
  });

  test("narration advisory: history section is never scanned", () => {
    const hist = "## [Unreleased]\n\n### Fixed\n\n- **A fix** — clean.\n\n## [0.14.1] - 2026-09-06\n\n### Fixed\n\n- **Old** — mutation-verified in history.\n";
    const r = runNarration(hist);
    return r.status === 0 && r.out.includes("clean") && !r.out.includes("mutation-verified");
  });

  test("narration advisory: missing [Unreleased] is a no-op", () => {
    const r = runNarration("## [0.14.1] - 2026-09-06\n\n### Fixed\n- **x**\n");
    return r.status === 0 && r.out.includes("clean");
  });

  test("narration advisory: exits 0 always, even with findings", () => {
    const r = runNarration(entries["mutation-verified"]);
    return r.status === 0;
  });

  test("narration advisory: --file with no arg prints an error", () => {
    const r = spawnSync(process.execPath, [NARRATION, "--file"], { encoding: "utf8" });
    return r.status === 0 && (r.stdout + r.stderr).includes("requires a path");
  });

  test("narration advisory: --file pointing to a dir prints an error", () => {
    const dir = tmp("narration-dir");
    const r = spawnSync(process.execPath, [NARRATION, "--file", dir], { encoding: "utf8" });
    return r.status === 0 && (r.stdout + r.stderr).includes("cannot read");
  });
};