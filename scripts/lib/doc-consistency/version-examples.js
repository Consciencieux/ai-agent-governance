// PLAN-0055 Stage 4E+/R10: doc-consistency gate cluster (EXTRACT from run.js).
// INSTALLED with siblings listed in references/init-spec.json — keep require graph closed.
"use strict";
function runVersionExamples(ctx) {
  const {
    fs, path, spawnSync,
    createMdLinkFacts, evaluateBrokenLinks, classifyPlanStatus, isPlanMarkdown, evaluateAdrUnreleasedClaims,
    ROOT, DOCS, CONSENT_SYNC_GROUPS, CONSENT_MARKERS, consentBasename, CLAIMS_PROTECTED_LIST,
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
      // agree (`tag` = `"v" + version`). The v1.0.0 release kept `"tag": "v0.15.0"`
      // beside `"version": "1.0.0"` in the manifest examples (SKILL.md S3.2, release.md
      // S5) and shipped green — version_examples only compared against the current
      // version, never the adjacent tag. Match only INSIDE `{ ... }` object blocks with
      // `"version"` and `"tag"` as neighbouring slots: a narrative HISTORY quote
      // (release.md S2 "v1.0.0 曾保留 …" describes the bug, it does not assert it) lives
      // in prose without an object block and must never be paired — first run of this
      // checker matched that prose across 200 lines and failed the current tree.
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
      // match (its "version" alternative requires literal double quotes). SKILL.md's
      // frontmatter is one of this repo's five release sync points, so it was the only one
      // with no mechanical backstop — a release could ship a stale skill version and pass
      // every gate (audit 2026-09-05). Gate class: a version sync point must not drift.
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
    // CHANGELOG top version section is the fourth release sync point (skill-release.md
    // Phase 4 step 2 renames [Unreleased] -> [X.Y.Z] during version sync). It has no
    // mechanical backstop either: the v0.13.1 release shipped with 40 entries still under
    // [Unreleased] and every gate green, because changelog_coverage only asks "is the
    // change recorded", never "has the version section advanced". The newest versioned
    // section (first `## [X.Y.Z]` heading, [Unreleased] skipped) must equal the current
    // version. No versioned section yet (fresh project) or no CHANGELOG → no-op.
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
    // The two generator sync points live OUTSIDE .md files, which mdFiles() cannot see:
    // `references/init-spec.json` `inputs.governance_version.default` (stamped into every
    // new governed project's manifest) and `scripts/generate-governance.js`'s fallback
    // sentinel. Both are skill-release.md Phase 4 step 2 sync points — a release that
    // bumps them silently changes the version stamped into future INITs. Gate class:
    // a version sync point must not drift. No-op when either file is absent (a governed
    // project does not have references/init-spec.json — it is SKILL-INTERNAL).
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
    const genPath = path.join(ROOT, "scripts", "generate-governance.js");
    if (fs.existsSync(genPath)) {
      const gen = readFile(genPath);
      if (gen) {
        // The sentinel is the else-branch of a ternary (`? fallback : "X.Y.Z"`), not a
        // `fallback:` property. The old pattern (`fallback\s*:\s*"..."`) could never match
        // it, so this sync point's "mechanical backstop" was vacuous from the day it was
        // added — v0.15.0 found it while the release itself was in flight (audit
        // 2026-09-07). Anchor on the ternary that returns it, so an unrelated `: "1.2.3"`
        // elsewhere in the file cannot be mistaken for the sentinel.
        const sv = /\?\s*fallback\s*:\s*"(\d+\.\d+\.\d+)"|fallback\s*:\s*"(\d+\.\d+\.\d+)"/.exec(gen);
        const svVal = sv && (sv[1] || sv[2]);
        if (svVal && svVal !== version) {
          const item = `scripts/generate-governance.js: fallback sentinel ${svVal} != ${version} (release sync point — last-resort default when package.json is unavailable)`;
          issues.version_examples.push(item);
          if (anyGate) gateIssues.push({ kind: "version_examples", item });
        }
      }
    }
  }

}

module.exports = { runVersionExamples };
