// Stage 4E+/R10: doc-consistency gate cluster (EXTRACT from run.js).
// INSTALLED with siblings listed in references/init-spec.json — keep require graph closed.
"use strict";
function runPrinciplesIndex(ctx) {
  const {
    fs, path,
    ROOT,
    readFile,
    gateIssues,
  } = ctx;

  // ---- 9. principles-index pointers (gate class) ----
  // Index is pointers-only by design; a moved/renamed source silently becomes a false claim.
  // Prefer REPO-ONLY principles-index.md when present; fall back to AGENTS.md (legacy).
  // Governed projects typically have neither heading → skip.
  // Scope: only the 4-column principles index table (Principle | Source | Scope).
  const candidates = [
    path.join(ROOT, "repo-workflows", "principles-index.md"),
    path.join(ROOT, "AGENTS.md"),
  ];
  let indexDoc = null;
  let indexLabel = null;
  for (const candidate of candidates) {
    const doc = readFile(candidate);
    if (doc && /Governance principles index/i.test(doc)) {
      indexDoc = doc;
      indexLabel = path.relative(ROOT, candidate).split(path.sep).join("/");
      break;
    }
  }
  if (!indexDoc) return;

  const bt = String.fromCharCode(96);
  const fileRe = new RegExp(bt + "([^" + bt + "]+)" + bt, "g");
  const VALID_SCOPES = ["payload", "both", "repo"];
  for (const line of indexDoc.split("\n")) {
    if (!line.startsWith("| ") || line.startsWith("| ---") || line.startsWith("| Principle")) continue;
    const cells = line.split("|").map((s) => s.trim());
    const scope = (cells[3] || "").toLowerCase();
    if (!VALID_SCOPES.includes(scope)) continue;
    const source = cells[2] || "";
    let fm;
    fileRe.lastIndex = 0;
    while ((fm = fileRe.exec(source))) {
      const target = fm[1].trim();
      if (!/[/.]/.test(target)) continue;
      if (!fs.existsSync(path.join(ROOT, target))) {
        gateIssues.push({ kind: "principles_index", item: `${indexLabel} index points at missing ${target}` });
      }
    }
  }
}

module.exports = { runPrinciplesIndex };
