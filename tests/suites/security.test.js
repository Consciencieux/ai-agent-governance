// PLAN-0055 Stage 4Q rebuild — minimum fail-closed for must_ship / product_cli security surface.
// Gen1 suite archive deleted; extend from current gate obligations only.
"use strict";

const { spawnSync } = require("child_process");
const fs = require("fs");
const path = require("path");

module.exports = (test) => {
  test("check-lock: held lock exits 1 (fail-closed)", () => {
    const dir = tmp("lock-held");
    write(path.join(dir, ".governance/state.json"), JSON.stringify({ locked: "agent-2", agent_id: "agent-2", task_id: "t-9" }));
    const r = spawnSync(process.execPath, [LOCK_CHECK], { cwd: dir, encoding: "utf8" });
    return r.status === 1 && /LOCK HELD/i.test(r.stderr);
  });

  test("check-lock: malformed state exits 1 (fail-closed)", () => {
    const dir = tmp("lock-corrupt");
    write(path.join(dir, ".governance/state.json"), "{ not valid json");
    const r = spawnSync(process.execPath, [LOCK_CHECK], { cwd: dir, encoding: "utf8" });
    return r.status === 1 && /refusing to proceed/i.test(r.stderr);
  });

  test("check-git-policy: protected branch with directPush=false exits 1", () => {
    const dir = tmp("gitpolicy-blocked");
    gitInit(dir);
    write(
      path.join(dir, ".governance/git-policy.json"),
      JSON.stringify({ protectedBranches: ["main", "master"], directPush: false, requireReview: true, allowForcePush: false })
    );
    const r = spawnSync(process.execPath, [GIT_POLICY_CHECK], { cwd: dir, encoding: "utf8" });
    return r.status === 1 && /BLOCKED/i.test(r.stderr);
  });

  test("check-git-policy: feature branch exits 0", () => {
    const dir = tmp("gitpolicy-ok");
    gitInit(dir);
    spawnSync("git", ["checkout", "-q", "-b", `feature/agent-${Date.now()}-rebuild`], { cwd: dir });
    write(
      path.join(dir, ".governance/git-policy.json"),
      JSON.stringify({ protectedBranches: ["main", "master"], directPush: false, requireReview: true, allowForcePush: false })
    );
    write(
      path.join(dir, ".gitignore"),
      [".env", ".env.*", "!.env.example", "*.key", "*.pem", "*.p12", "*.pfx", "credentials.json", "secrets.*"].join("\n")
    );
    const r = spawnSync(process.execPath, [GIT_POLICY_CHECK], { cwd: dir, encoding: "utf8" });
    return r.status === 0;
  });

  test("check-secrets: staged fake secret exits 1 without leaking the token", () => {
    const dir = tmp("secrets-hit");
    gitInit(dir);
    const value = assemble("AKIA", "IOSFODNN7EXAMPLE");
    write(path.join(dir, "app.js"), assemble("const apiKey = '", value, "';"));
    spawnSync("git", ["add", "app.js"], { cwd: dir });
    const r = spawnSync(process.execPath, [SECRET_CHECK], { cwd: dir, encoding: "utf8" });
    const err = String(r.stderr || "") + String(r.stdout || "");
    return r.status === 1 && /aws-access-key|secret/i.test(err) && !err.includes(value);
  });

  test("check-secrets: clean staged diff exits 0", () => {
    const dir = tmp("secrets-clean");
    gitInit(dir);
    write(path.join(dir, "app.js"), "const greeting = 'hello';");
    spawnSync("git", ["add", "app.js"], { cwd: dir });
    const r = spawnSync(process.execPath, [SECRET_CHECK], { cwd: dir, encoding: "utf8" });
    return r.status === 0;
  });
};
