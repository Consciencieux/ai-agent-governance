// REPO-ONLY — export-installed-scripts.js characterization (paper fixtures helper).
"use strict";

const { spawnSync } = require("child_process");
const fs = require("fs");
const path = require("path");
const os = require("os");

const ROOT = path.join(__dirname, "..", "..");
const EXPORT = path.join(ROOT, "repo-tools", "export-installed-scripts.js");
const PAPER_PIN = "v2.2.0";

function resolveExportRef() {
  const r = spawnSync("git", ["rev-parse", `${PAPER_PIN}^{commit}`], {
    cwd: ROOT,
    encoding: "utf8",
  });
  if (r.status === 0 && String(r.stdout || "").trim()) return PAPER_PIN;
  // Pin tag does not exist until release; still exercise --ref plumbing.
  return "HEAD";
}

module.exports = (test) => {
  test("export-installed: paper profile writes renamed verify + closure deps", () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), "export-paper-"));
    const r = spawnSync(process.execPath, [EXPORT, "--out", dir, "--profile", "paper"], {
      cwd: ROOT,
      encoding: "utf8",
    });
    if (r.status !== 0) {
      console.error(r.stderr || r.stdout);
      return false;
    }
    const need = [
      "verify-governance.js",
      "check-secrets.js",
      "check-sync.js",
      "check-sibling-closure.js",
      "lib/secret-scan-facts.js",
      "evaluators/ctrl-0001-secret-protection.js",
      "EXPORT-MANIFEST.json",
    ];
    for (const rel of need) {
      if (!fs.existsSync(path.join(dir, rel))) {
        console.error("  missing", rel);
        return false;
      }
    }
    if (fs.existsSync(path.join(dir, "verify_governance.js"))) {
      console.error("  must rename verify_governance → verify-governance");
      return false;
    }
    const man = JSON.parse(fs.readFileSync(path.join(dir, "EXPORT-MANIFEST.json"), "utf8"));
    if (man.profile !== "paper" || man.cited_product_version !== "2.2.0") {
      console.error("  bad manifest", man);
      return false;
    }
    return true;
  });

  test("export-installed: --ref fills ref_commit (paper pin when tagged)", () => {
    const ref = resolveExportRef();
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), "export-ref-"));
    const r = spawnSync(
      process.execPath,
      [EXPORT, "--out", dir, "--profile", "paper", "--ref", ref],
      { cwd: ROOT, encoding: "utf8" }
    );
    if (r.status !== 0) {
      console.error(r.stderr || r.stdout);
      return false;
    }
    const man = JSON.parse(fs.readFileSync(path.join(dir, "EXPORT-MANIFEST.json"), "utf8"));
    if (man.ref !== ref || !/^[0-9a-f]{40}$/.test(man.ref_commit || "")) {
      console.error("  expected pinned ref_commit", man);
      return false;
    }
    if (man.cited_product_version !== "2.2.0") {
      console.error("  cited_product_version must stay 2.2.0", man);
      return false;
    }
    return true;
  });
};
