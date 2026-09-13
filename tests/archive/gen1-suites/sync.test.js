// tests/suites/sync.test.js — split from tests/suites/consistency.test.js (2026-09-08).
// sync-group and lock tests moved out of the consistency monolith (check-sync.js, check-lock.js).


const { spawnSync } = require("child_process");
const fs = require("fs");
const path = require("path");

module.exports = (test) => {
test("check-sync: changed src without ARCHITECTURE.md exits 1", () => {
  const dir = tmp("sync-unsynced");
  gitInit(dir);
  fs.mkdirSync(path.join(dir, "src"), { recursive: true });

  write(path.join(dir, "src", "a.ts"), "x");
  spawnSync("git", ["add", "src/a.ts"], { cwd: dir });
  write(
    path.join(dir, ".governance", "sync-rules.json"),
    JSON.stringify({ syncGroups: [{ name: "api-architecture", watch: ["src/**"], require: ["docs/ARCHITECTURE.md"] }] })
  );
  write(path.join(dir, ".governance", "state.json"), JSON.stringify({ task_start_sha: "" }));
  fs.mkdirSync(path.join(dir, "scripts"), { recursive: true });
  fs.copyFileSync(SYNC_CHECK, path.join(dir, "scripts/check-sync.js"));
  const r = spawnSync(process.execPath, [SYNC_CHECK], { cwd: dir, encoding: "utf8" });
  return r.status === 1 && r.stderr.includes("api-architecture");
});


test("check-sync: changed src AND ARCHITECTURE.md exits 0", () => {
  const dir = tmp("sync-ok");
  gitInit(dir);
  fs.mkdirSync(path.join(dir, "src"), { recursive: true });
  fs.mkdirSync(path.join(dir, "docs"), { recursive: true });
  write(path.join(dir, "src", "a.ts"), "x");
  write(path.join(dir, "docs", "ARCHITECTURE.md"), "y");
  spawnSync("git", ["add", "src/a.ts", "docs/ARCHITECTURE.md"], { cwd: dir });
  write(
    path.join(dir, ".governance", "sync-rules.json"),
    JSON.stringify({ syncGroups: [{ name: "api-architecture", watch: ["src/**"], require: ["docs/ARCHITECTURE.md"] }] })
  );
  write(path.join(dir, ".governance", "state.json"), JSON.stringify({ task_start_sha: "" }));
  fs.mkdirSync(path.join(dir, "scripts"), { recursive: true });
  fs.copyFileSync(SYNC_CHECK, path.join(dir, "scripts/check-sync.js"));
  const r = spawnSync(process.execPath, [SYNC_CHECK], { cwd: dir, encoding: "utf8" });
  return r.status === 0;
});


test("check-sync: existing task_start_sha is honoured (resume, not recomputed)", () => {
  const dir = tmp("sync-resume");
  gitInit(dir);
  const firstSha = gitHead(dir);
  // a second commit happens mid-task: the recorded task_start_sha must still be the first
  fs.mkdirSync(path.join(dir, "src"), { recursive: true });
  write(path.join(dir, "src", "a.ts"), "x");
  spawnSync("git", ["add", "src/a.ts"], { cwd: dir });
  spawnSync("git", ["commit", "-q", "-m", "mid-task commit"], { cwd: dir });
  write(path.join(dir, ".governance", "sync-rules.json"),
    JSON.stringify({ syncGroups: [{ name: "api-architecture", watch: ["src/**"], require: ["docs/ARCHITECTURE.md"] }] }));
  write(path.join(dir, ".governance", "state.json"), JSON.stringify({ task_start_sha: firstSha }));
  const r = spawnSync(process.execPath, [SYNC_CHECK, "--json"], { cwd: dir, encoding: "utf8" });
  const out = JSON.parse(r.stdout);
  // base must equal the recorded SHA (resume), and the committed src change must be detected
  return out.base === firstSha && r.status === 1 && out.unsynced.some((u) => u.group === "api-architecture");
});


test("check-sync: writes the sync section into drift-report.json", () => {
  const dir = tmp("sync-drift");
  gitInit(dir);
  fs.mkdirSync(path.join(dir, "src"), { recursive: true });
  write(path.join(dir, "src", "a.ts"), "x");
  spawnSync("git", ["add", "src/a.ts"], { cwd: dir });
  write(path.join(dir, ".governance", "sync-rules.json"),
    JSON.stringify({ syncGroups: [{ name: "api-architecture", watch: ["src/**"], require: ["docs/ARCHITECTURE.md"] }] }));
  write(path.join(dir, ".governance", "state.json"), JSON.stringify({ task_start_sha: "" }));
  spawnSync(process.execPath, [SYNC_CHECK], { cwd: dir, encoding: "utf8" });
  const dr = path.join(dir, ".governance", "drift-report.json");
  if (!fs.existsSync(dr)) return false;
  const j = JSON.parse(fs.readFileSync(dr, "utf8"));
  return j.sync && j.sync.clean === false && j.sync.unsynced.includes("api-architecture");
});


test("check-sync: NUL status parsing preserves untracked unicode/space paths", () => {
  const dir = tmp("sync-untracked-paths");
  gitInit(dir);
  write(path.join(dir, "src", "new file 中文.ts"), "x");
  write(path.join(dir, "docs", "ARCHITECTURE.md"), "architecture");
  write(path.join(dir, ".governance", "sync-rules.json"),
    JSON.stringify({ syncGroups: [{ name: "api-architecture", watch: ["src/**"], require: ["docs/ARCHITECTURE.md"] }] }));
  write(path.join(dir, ".governance", "state.json"), JSON.stringify({ task_start_sha: "" }));
  const r = spawnSync(process.execPath, [SYNC_CHECK, "--json"], { cwd: dir, encoding: "utf8" });
  if (r.status !== 0) return false;
  const out = JSON.parse(r.stdout);
  return out.clean === true && out.unsynced.length === 0;
});


test("check-sync: --advisory reports unsynced groups but exits 0", () => {
  const dir = tmp("sync-advisory");
  gitInit(dir);
  fs.mkdirSync(path.join(dir, "src"), { recursive: true });
  write(path.join(dir, "src", "a.ts"), "x");
  spawnSync("git", ["add", "src/a.ts"], { cwd: dir });
  write(path.join(dir, ".governance", "sync-rules.json"),
    JSON.stringify({ syncGroups: [{ name: "api-architecture", watch: ["src/**"], require: ["docs/ARCHITECTURE.md"] }] }));
  write(path.join(dir, ".governance", "state.json"), JSON.stringify({ task_start_sha: "" }));
  const r = spawnSync(process.execPath, [SYNC_CHECK, "--advisory", "--json"], { cwd: dir, encoding: "utf8" });
  if (r.status !== 0) return false;
  const out = JSON.parse(r.stdout);
  return out.clean === false && out.unsynced.some((u) => u.group === "api-architecture");
});


test("check-sync: rename matching uses the destination path", () => {
  const dir = tmp("sync-rename-path");
  gitInit(dir);
  write(path.join(dir, "legacy", "old name 中文.ts"), "x");
  spawnSync("git", ["add", "legacy"], { cwd: dir });
  spawnSync("git", ["commit", "-q", "-m", "add legacy file"], { cwd: dir });
  fs.mkdirSync(path.join(dir, "src"), { recursive: true });
  fs.renameSync(path.join(dir, "legacy", "old name 中文.ts"), path.join(dir, "src", "new name 中文.ts"));
  spawnSync("git", ["add", "-A"], { cwd: dir });
  write(path.join(dir, ".governance", "sync-rules.json"),
    JSON.stringify({ syncGroups: [
      { name: "new-path", watch: ["src/**"], require: ["docs/ARCHITECTURE.md"] },
      { name: "old-path", watch: ["legacy/**"], require: ["docs/ARCHITECTURE.md"] },
    ] }));
  write(path.join(dir, ".governance", "state.json"), JSON.stringify({ task_start_sha: "" }));
  const r = spawnSync(process.execPath, [SYNC_CHECK, "--json"], { cwd: dir, encoding: "utf8" });
  if (r.status !== 1) return false;
  const out = JSON.parse(r.stdout);
  return out.unsynced.some((u) => u.group === "new-path") && !out.unsynced.some((u) => u.group === "old-path");
});


test("check-sync: malformed policy and state exit 1 (fail-closed)", () => {
  const badPolicy = tmp("sync-bad-policy");
  gitInit(badPolicy);
  write(path.join(badPolicy, ".governance/sync-rules.json"), "{ not valid json");
  const p = spawnSync(process.execPath, [SYNC_CHECK], { cwd: badPolicy, encoding: "utf8" });
  const badState = tmp("sync-bad-state");
  gitInit(badState);
  write(path.join(badState, ".governance/sync-rules.json"), JSON.stringify({ syncGroups: [] }));
  write(path.join(badState, ".governance/state.json"), "{ not valid json");
  const s = spawnSync(process.execPath, [SYNC_CHECK], { cwd: badState, encoding: "utf8" });
  return p.status === 1 && s.status === 1 && /refusing to proceed/.test(p.stderr) && /refusing to proceed/.test(s.stderr);
});


// C2: the template documents a trailing-slash directory form and the DEFAULT shipped
// sync-rules uses it (feature-registry's `require: ["docs/features/"]`), but globMatch
// never implemented it — so that group was permanently unsatisfiable in every INITed
// project, producing a false BLOCK (audit 2026-09-05).
test("check-sync: a trailing-slash require pattern matches files under it", () => {
  const dir = tmp("sync-trailing-slash");
  gitInit(dir);
  write(path.join(dir, "seed.txt"), "seed");
  spawnSync("git", ["add", "-A"], { cwd: dir });
  spawnSync("git", ["commit", "-q", "-m", "seed"], { cwd: dir });
  const base = String(spawnSync("git", ["rev-parse", "HEAD"], { cwd: dir, encoding: "utf8" }).stdout).trim();
  write(path.join(dir, ".governance/sync-rules.json"), JSON.stringify({
    syncGroups: [{ name: "feature-registry", watch: ["src/**"], require: ["docs/features/"] }],
  }));
  write(path.join(dir, "src/a.ts"), "x");
  write(path.join(dir, "docs/features/login.md"), "y");
  spawnSync("git", ["add", "-A"], { cwd: dir });
  const r = spawnSync(process.execPath, [SYNC_CHECK, "--json", "--base", base], { cwd: dir, encoding: "utf8" });
  const out = JSON.parse(r.stdout);
  return r.status === 0 && out.clean === true;
});


// A wildcard-segment pattern silently matched nothing, so a project believed it had a rule
// that could never fire. Unsupported forms now fail loudly instead of passing green.
test("check-sync: an unsupported wildcard-segment pattern blocks instead of silently missing", () => {
  const dir = tmp("sync-bad-pattern");
  gitInit(dir);
  write(path.join(dir, "seed.txt"), "seed");
  spawnSync("git", ["add", "-A"], { cwd: dir });
  spawnSync("git", ["commit", "-q", "-m", "seed"], { cwd: dir });
  const base = String(spawnSync("git", ["rev-parse", "HEAD"], { cwd: dir, encoding: "utf8" }).stdout).trim();
  write(path.join(dir, ".governance/sync-rules.json"), JSON.stringify({
    syncGroups: [{ name: "g", watch: ["packages/*/src/**"], require: ["docs/x.md"] }],
  }));
  write(path.join(dir, "packages/a/src/i.ts"), "x");
  spawnSync("git", ["add", "-A"], { cwd: dir });
  const r = spawnSync(process.execPath, [SYNC_CHECK, "--json", "--base", base], { cwd: dir, encoding: "utf8" });
  if (r.status !== 1) return false;
  const out = JSON.parse(r.stdout);
  return (out.unsupportedPatterns || []).some((b) => b.pattern === "packages/*/src/**");
});


test("check-lock: control characters in state fields cannot repaint the terminal", () => {
  const dir = tmp("lock-ansi");
  fs.mkdirSync(path.join(dir, ".governance"), { recursive: true });
  write(path.join(dir, ".governance/state.json"), JSON.stringify({
    locked: "holder",
    agent_id: "\u001b[31mFAKE\u001b[0m NO LOCK HELD",
    task_id: "t\u0000x",
  }));
  const r = spawnSync(process.execPath, [LOCK_CHECK], { cwd: dir, encoding: "utf8" });
  return r.status === 1 && !r.stderr.includes("\u001b") && !r.stderr.includes("\u0000");
});
};
