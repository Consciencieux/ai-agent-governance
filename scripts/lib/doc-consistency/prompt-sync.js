// Stage 4E+/R10: doc-consistency gate cluster (EXTRACT from run.js).
// INSTALLED with siblings listed in references/init-spec.json — keep require graph closed.
"use strict";
function runPromptSync(ctx) {
  const {
    fs, path, spawnSync,
    createMdLinkFacts, evaluateBrokenLinks, classifyPlanStatus, isPlanMarkdown, evaluateAdrUnreleasedClaims,
    ROOT, DOCS, CONSENT_SYNC_GROUPS, CONSENT_MARKERS, consentBasename, CLAIMS_PROTECTED_LIST,
    walk, readFile, currentVersion, changedPaths, changelogCoverage, mdFiles,
    issues, gateIssues, anyGate, releaseGate, version, planStatuses,
  } = ctx;

  // ---- 6. prompt sync (gate class; sub-skill triggers <-> commands.md) ----
  // : the trigger inventory in commands.md is a DELIBERATE, controlled copy (users
  // discover sub-skills from the manual), with sub-skills.md staying the authority. Because
  // the copy is mandated, BOTH directions are defects: a trigger missing from a language
  // tree hides a skill from users, and a trigger left behind after removal advertises one
  // that no longer exists. Previously this cluster was advisory and one-directional, so
  // AGENTS.md's "enforces" claim was not backed by anything.
  const subSkills = readFile(path.join(ROOT, "references", "instruction", "sub-skills.md")) || "";
  const triggers = new Set();
  for (const line of subSkills.split("\n")) {
    if (!line.includes("Triggers on")) continue;
    const rest = line.split("Triggers on ")[1] || "";
    const quoted = rest.match(/"([^"]+)"/g) || [];
    for (const q of quoted) triggers.add(q.slice(1, -1));
  }
  if (triggers.size > 0) {
    for (const lang of ["en", "zh-CN", "zh-TW"]) {
      // Stage 4: this skill repo keeps commands.md under docs/product/{lang}/;
      // governed projects / fixtures still use docs/{lang}/commands.md. Prefer product.
      const cmdCandidates = [
        path.join(DOCS, "product", lang, "commands.md"),
        path.join(DOCS, lang, "commands.md"),
      ];
      const cmdPath = cmdCandidates.find((p) => fs.existsSync(p));
      const cmd = cmdPath ? (readFile(cmdPath) || "") : "";
      if (!cmd) continue;
      for (const t of triggers) {
        if (!cmd.includes("`" + t + "`")) {
          const item = `${lang}/commands.md missing trigger \`${t}\``;
          issues.prompt_sync.push(item);
          if (anyGate) gateIssues.push({ kind: "prompt_sync", item });
        }
      }
      // Reverse direction: a trigger the manual advertises that NO source declares is a
      // stale advertisement (renamed or removed). Two authorities exist and both are
      // legitimate: sub-skills.md owns generated sub-skill triggers, SKILL.md owns the
      // main skill's mode triggers (INIT / AUDIT / drift). Judging against sub-skills.md
      // alone reported every main-skill trigger as stale on first run. Scope to the
      // inventory table rows so prose and code samples are never judged.
      const skillEntry = readFile(path.join(ROOT, "SKILL.md")) || "";
      for (const row of cmd.match(/^\|[^\n]*\|/gm) || []) {
        for (const bt of row.match(/`([^`]+)`/g) || []) {
          const t = bt.slice(1, -1).trim();
          // Only trigger-shaped tokens: natural-language phrases or /slash commands.
          if (!/^[a-z0-9][a-z0-9 /*-]*$/i.test(t)) continue;
          if (/[./\\]/.test(t) && !t.startsWith("/")) continue;
          if (triggers.has(t)) continue;
          // Declared anywhere in either authority (quoted or plain) → not stale.
          if (subSkills.includes(t) || skillEntry.includes(t)) continue;
          const item = `${lang}/commands.md advertises \`${t}\` which no skill source declares (removed or renamed trigger)`;
          issues.prompt_sync.push(item);
          if (anyGate) gateIssues.push({ kind: "prompt_sync", item });
        }
      }
    }
  }

}

module.exports = { runPromptSync };
