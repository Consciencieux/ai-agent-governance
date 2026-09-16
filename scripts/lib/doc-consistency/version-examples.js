// Stage 4E+/R10: doc-consistency gate cluster (EXTRACT from run.js).
// INSTALLED with siblings listed in references/init-spec.json — keep require graph closed.
"use strict";
function runVersionExamples(ctx) {
  const {
    fs, path, spawnSync,
    createMdLinkFacts, evaluateBrokenLinks, classifyPlanStatus, isPlanMarkdown,
    ROOT, DOCS, CLAIMS_PROTECTED_LIST,
    walk, readFile, currentVersion, changedPaths, changelogCoverage, mdFiles,
    issues, gateIssues, anyGate, releaseGate, version, planStatuses,
  } = ctx;

  // ---- 1. version-example sync ----
  if (version) {
    const files = mdFiles().filter((f) => !f.startsWith("CHANGELOG") && !f.startsWith("docs/archive/"));
    for (const f of files) {
      const c = readFile(path.join(ROOT, f));
      if (!c) continue;
      const re = /\{[^{}]*?(?:governance_version|"version")["']?\s*[:=]\s*["']?(\d+\.\d+\.\d+)[^{}]*\}/g;
      let m;
      while ((m = re.exec(c))) {
        if (m[1] !== version) issues.version_examples.push(`${f}:${m[1]} != ${version}`);
      }
      // tag-version pairing: a `version` value paired with an adjacent `tag` value must
      // agree (`tag` = `"v" + version`). Match only INSIDE `{... }` object blocks with
      // `"version"` and `"tag"` as neighbouring slots: a narrative HISTORY quote
      // in prose without an object block must never be paired.
      const pairRe =
        /\{[^{}]*"version"\s*:\s*"(\d+\.\d+\.\d+)"[^{}]*?\n?[^{}]*?"tag"\s*:\s*"(v\d+\.\d+\.\d+)"[^{}]*\}/g;
      let pm;
      while ((pm = pairRe.exec(c))) {
        const ver = pm[1];
        const tag = pm[2];
        if (tag !== "v" + ver) {
          const item = `${f}: release example pairs version ${ver} with tag ${tag} (tag must match the adjacent version)`;
          issues.version_examples.push(item);
          if (anyGate) gateIssues.push({ kind: "version_examples", item });
        }
      }
      // YAML frontmatter carries an UNQUOTED `version: X.Y.Z`, which the regex above cannot
      // match (its "version" alternative requires literal double quotes). SKILL.md frontmatter
      // is a version sync point and must not drift without a mechanical backstop.
      const fm = /^---\r?\n([\s\S]*?)\r?\n---/.exec(c);
      if (fm) {
        const fv = /^version:\s*["']?(\d+\.\d+\.\d+)["']?\s*$/m.exec(fm[1]);
        if (fv && fv[1] !== version) {
          const item = `${f}: frontmatter version ${fv[1]} != ${version} (release sync point)`;
          issues.version_examples.push(item);
          if (anyGate) gateIssues.push({ kind: "version_examples", item });
        }
      }
    }
    // CHANGELOG top version section is a release sync point. Without this check, a
    // release can ship with entries still under [Unreleased] and every gate green,
    // because changelog_coverage only asks "is the change recorded", never "has the
    // version section advanced". The newest versioned section (first `## [X.Y.Z]`
    // heading, [Unreleased] skipped) must equal the current version. No versioned
    // section yet (fresh project) or no CHANGELOG → no-op.
    const cl = readFile(path.join(ROOT, "CHANGELOG.md"));
    if (cl) {
      const heads = cl.match(/^##\s+\[(\d+\.\d+\.\d+)\]/gm) || [];
      const top = /^##\s+\[(\d+\.\d+\.\d+)\]/.exec(heads[0] || "");
      if (top && top[1] !== version) {
        const item = `CHANGELOG.md: newest version section [${top[1]}] != current version ${version} (release sync point — version sync must rename [Unreleased] to the new version)`;
        issues.version_examples.push(item);
        if (anyGate) gateIssues.push({ kind: "version_examples", item });
      }
    }
    // The two generator sync points live OUTSIDE.md files, which mdFiles cannot see:
    // `references/init-spec.json` `inputs.governance_version.default` (stamped into every
    // new governed project's manifest) and `scripts/lib/generate/run.js`'s fallback
    // sentinel. Both are skill-package version sync points — a release that bumps them
    // silently changes the version stamped into future INITs. Gate class: a version sync
    // point must not drift. No-op when either file is absent (a governed project does not
    // have references/init-spec.json — it is SKILL-INTERNAL).
    const specPath = path.join(ROOT, "references", "init-spec.json");
    if (fs.existsSync(specPath)) {
      const spec = readFile(specPath);
      if (spec) {
        const dv = /"governance_version"[^}]*?"default"\s*:\s*"(\d+\.\d+\.\d+)"/.exec(spec);
        if (dv && dv[1] !== version) {
          const item = `references/init-spec.json: inputs.governance_version.default ${dv[1]} != ${version} (release sync point — INIT stamps this into every new governed project)`;
          issues.version_examples.push(item);
          if (anyGate) gateIssues.push({ kind: "version_examples", item });
        }
      }
    }
    const genPath = path.join(ROOT, "scripts", "lib", "generate", "run.js");
    if (fs.existsSync(genPath)) {
      const gen = readFile(genPath);
      if (gen) {
        // Sentinel lives in defaultGovernanceVersion's ternary else-branch
        // (`? fallback : "X.Y.Z"`). Thin CLI scripts/generate-governance.js has no
        // literal — scanning it is vacuous after. Anchor on the ternary.
        const sv = /\?\s*fallback\s*:\s*"(\d+\.\d+\.\d+)"|fallback\s*:\s*"(\d+\.\d+\.\d+)"/.exec(gen);
        const svVal = sv && (sv[1] || sv[2]);
        if (svVal && svVal !== version) {
          const item = `scripts/lib/generate/run.js: fallback sentinel ${svVal} != ${version} (release sync point — last-resort default when package.json is unavailable)`;
          issues.version_examples.push(item);
          if (anyGate) gateIssues.push({ kind: "version_examples", item });
        }
      }
    }
  }

}

module.exports = { runVersionExamples };
