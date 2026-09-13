// PLAN-0037 Stage D — portable principles pack characterization on a clean target.
// Proves: principles ship in the skill tarball; INIT does not install them; L1
// contract suppresses the five extraction failure modes without copying docs/.

const { spawnSync } = require("child_process");
const fs = require("fs");
const path = require("path");

const PRINCIPLE_FILES = [
  "references/principles/entry.md",
  "references/principles/instruction-architecture.md",
  "references/principles/document-model.md",
  "references/principles/metadata-policy.md",
  "references/principles/capability-model.md",
  "references/principles/decision-records.md",
  "references/principles/migration-method.md",
];

const L1_MARKERS = [
  "Metadata budget",
  "Document type boundary",
  "Canonical ownership",
  "Entry point size",
  "Routing requirement",
  "Mechanical control shape",
  "Discovery disposition",
];

const ANTI_PATTERNS = [
  { name: "metadata inflation", re: /metadata 膨胀|Metadata budget|封闭 schema/ },
  { name: "entry becomes encyclopedia", re: /入口变百科|Entry point size|薄入口/ },
  { name: "type confusion", re: /跨类型混用|Document type boundary|类型单责/ },
  { name: "rule full-text duplication", re: /规则全文多处复制|Canonical ownership|规则多处复制/ },
  { name: "boot-time full tree load", re: /全量加载治理树|通读全部规则树|按需加载/ },
];

function walkFiles(root) {
  const out = [];
  function walk(d) {
    for (const e of fs.readdirSync(d, { withFileTypes: true })) {
      const p = path.join(d, e.name);
      if (e.isDirectory()) walk(p);
      else out.push(path.relative(root, p).replace(/\\/g, "/"));
    }
  }
  walk(root);
  return out;
}

module.exports = (test) => {
  test("principles: topic files declare Hard Rules / Recommended / Customization", () => {
    for (const rel of PRINCIPLE_FILES) {
      const p = path.join(SKILL_ROOT, rel);
      if (!fs.existsSync(p)) {
        console.error("  missing " + rel);
        return false;
      }
      if (rel.endsWith("entry.md")) continue;
      const body = fs.readFileSync(p, "utf8");
      if (!/## Hard Rules/.test(body)) {
        console.error("  missing Hard Rules in " + rel);
        return false;
      }
      if (!/## Recommended Patterns/.test(body)) {
        console.error("  missing Recommended Patterns in " + rel);
        return false;
      }
      if (!/## Project Customization/.test(body)) {
        console.error("  missing Project Customization in " + rel);
        return false;
      }
    }
    return true;
  });

  test("principles: entry enumerates ADR-0020 L1 seven; no repo CTRL/Phase as L1", () => {
    const entry = fs.readFileSync(path.join(SKILL_ROOT, "references/principles/entry.md"), "utf8");
    for (const m of L1_MARKERS) {
      if (!entry.includes(m)) {
        console.error("  entry missing L1 marker: " + m);
        return false;
      }
    }
    if (/CTRL-\d{4}/.test(entry) || /Phase\s*0/.test(entry)) {
      console.error("  entry embeds repo-instance CTRL/Phase");
      return false;
    }
    const all = PRINCIPLE_FILES.map((r) => fs.readFileSync(path.join(SKILL_ROOT, r), "utf8")).join("\n");
    if (/必须使用\s*`?docs\/plans\//.test(all) || /L1.*docs\/plans\//.test(all)) {
      console.error("  principles hard-require docs/plans/ path");
      return false;
    }
    return true;
  });

  test("principles: skillInternal + tarball ships them; INIT clean target does not", () => {
    const spec = JSON.parse(fs.readFileSync(path.join(SKILL_ROOT, "references/init-spec.json"), "utf8"));
    const internal = new Set(spec.distribution.skillInternal || []);
    for (const rel of PRINCIPLE_FILES) {
      if (!internal.has(rel)) {
        console.error("  not skillInternal: " + rel);
        return false;
      }
    }
    const sources = new Set();
    for (const a of spec.artifacts || []) {
      if (a.source) sources.add(String(a.source).replace(/\\/g, "/"));
    }
    for (const rel of PRINCIPLE_FILES) {
      if (sources.has(rel)) {
        console.error("  principles must not be INIT sources: " + rel);
        return false;
      }
    }

    const sh = findBashShell();
    if (!sh) return "skip: no bash for package-skill.sh";
    const pack = spawnSync(sh, ["repo-tools/package-skill.sh", "0.0.0-principles"], {
      cwd: SKILL_ROOT,
      encoding: "utf8",
    });
    if (pack.status !== 0) {
      console.error("  package failed: " + (pack.stderr || pack.stdout || "").slice(0, 500));
      return false;
    }
    const tarPath = path.join(SKILL_ROOT, "dist", "ai-agent-governance-skill.tar.gz");
    const listing = spawnSync("tar", ["-tzf", tarPath], { encoding: "utf8" });
    if (listing.status !== 0) {
      console.error("  tar list failed");
      return false;
    }
    const members = new Set(listing.stdout.split(/\r?\n/).filter(Boolean).map((m) => m.replace(/^\.\//, "")));
    for (const rel of PRINCIPLE_FILES) {
      if (!members.has(rel)) {
        console.error("  tarball missing " + rel);
        return false;
      }
    }

    const dir = tmp("principles-clean-init");
    const g = spawnSync(
      process.execPath,
      [GENERATOR, "--target", dir, "--project-name", "CleanPrinciples", "--phase", "C"],
      { encoding: "utf8" }
    );
    if (g.status !== 0) {
      console.error("  INIT failed: " + (g.stderr || g.stdout || "").slice(0, 500));
      return false;
    }
    const installed = walkFiles(dir);
    if (installed.some((f) => f.includes("/principles/") || f.startsWith("principles/"))) {
      console.error("  INIT installed principles/");
      return false;
    }
    for (const rel of PRINCIPLE_FILES) {
      const base = path.basename(rel);
      if (base === "entry.md") continue;
      if (installed.some((f) => f.endsWith("/" + base) || f === base)) {
        console.error("  INIT leaked " + base);
        return false;
      }
    }
    return true;
  });

  test("principles: Stage D anti-pattern suppression + extraction protocol", () => {
    const corpus = PRINCIPLE_FILES.map((r) => fs.readFileSync(path.join(SKILL_ROOT, r), "utf8")).join("\n\n");
    for (const ap of ANTI_PATTERNS) {
      if (!ap.re.test(corpus)) {
        console.error("  anti-pattern not constrained: " + ap.name);
        return false;
      }
    }
    if (!/Facts\s*→\s*Rationale|禁止一次跳转|Facts → Rationale → Reusable Pattern/.test(corpus)) {
      console.error("  extraction protocol missing");
      return false;
    }
    return true;
  });
};
