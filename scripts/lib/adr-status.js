"use strict";
// ADR status heuristic ( / ).
// Only Status *fields* count — body mentions of CHANGELOG `[Unreleased]` must not trip.

const { parseFrontmatterField } = require("./plan-status");

function adrStatusFieldClaimsUnreleased(content) {
  const fm = parseFrontmatterField(content, "status");
  if (fm && /^(?:Unreleased|未发布|未發佈)$/i.test(fm)) return true;

  const head = String(content || "").split(/\r?\n/).slice(0, 40).join("\n");
  // Explicit status lines near the top (not CHANGELOG section titles in the body).
  if (/^(?:-\s*)?(?:\*\*)?(?:Status|状态|狀態)(?:\*\*)?\s*[:：]\s*(?:Unreleased|未发布|未發佈)\b/im.test(head)) {
    return true;
  }
  return false;
}

function evaluateAdrUnreleasedClaims({ adrBodies, releasedVersions }) {
  const hits = [];
  if (!releasedVersions || releasedVersions.length === 0) return hits;
  for (const { path: rel, content } of adrBodies || []) {
    if (adrStatusFieldClaimsUnreleased(content)) {
      hits.push(`${rel}: marked Unreleased but releases exist`);
    }
  }
  return hits;
}

module.exports = {
  adrStatusFieldClaimsUnreleased,
  evaluateAdrUnreleasedClaims,
};
