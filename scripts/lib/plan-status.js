"use strict";
// Shared plan-status classification ( / parser migration).
// Frontmatter `status:` is authoritative when present; legacy `> **Status:` lines remain
// a compatibility fallback. Callers must not invent a third vocabulary.

const PLAN_STATUS_LINE = /^>\s*\*\*\s*(?:Status|状态|狀態)\s*[:：]\s*([^*\n]+)/im;
// Prefix match (no $): Status values often carry dates / pending-archive notes.
const PLAN_STATUS_KEYWORDS = [
  { status: "design", re: /^(?:design(?:\s+plan(?:,\s*not\s+implemented)?)?|设计计划|設計計劃)/i },
  { status: "active", re: /^active\b/i },
  { status: "implemented", re: /^(?:implemented|已实现|已實作)/i },
  { status: "completed", re: /^(?:completed|已完成)/i },
  { status: "archived", re: /^(?:archived|已归档|已歸檔)/i },
];

function parseFrontmatterField(content, field) {
  if (!content || !content.startsWith("---")) return null;
  const end = content.indexOf("\n---", 3);
  if (end < 0) return null;
  const block = content.slice(3, end);
  const re = new RegExp("^" + field + ":\\s*(\\S+)", "im");
  const m = block.match(re);
  return m ? m[1].trim() : null;
}

function normalizeStatusValue(value) {
  return String(value || "")
    .trim()
    .replace(/\s*\*\*\s*$/, "")
    .replace(/[。．.]+$/, "")
    .trim();
}

function matchStatusKeyword(value) {
  const v = normalizeStatusValue(value);
  for (const k of PLAN_STATUS_KEYWORDS) if (k.re.test(v)) return k.status;
  return null;
}

function classifyPlanStatus(content) {
  const fm = parseFrontmatterField(content, "status");
  if (fm) {
    const hit = matchStatusKeyword(fm);
    if (hit) return hit;
  }
  const head = String(content || "").split(/\r?\n/).slice(0, 40).join("\n");
  const m = head.match(PLAN_STATUS_LINE);
  if (!m) return "unknown";
  return matchStatusKeyword(m[1]) || "unknown";
}

/** Any plan-like markdown under a plans/ tree (excludes README / DEVELOPMENT_PLAN). */
function isPlanMarkdown(relPath) {
  const base = String(relPath || "").split("/").pop() || "";
  if (!/\.md$/i.test(base)) return false;
  if (/^README\.md$/i.test(base)) return false;
  if (/^DEVELOPMENT_PLAN\.md$/i.test(base)) return false;
  return true;
}

/** Gen2 construction plans only (PLAN-NNNN-*.md) — used by roadmap sync. */
function isConstructionPlanMarkdown(relPath) {
  const base = String(relPath || "").split("/").pop() || "";
  return /^PLAN-\d+/i.test(base);
}

module.exports = {
  classifyPlanStatus,
  parseFrontmatterField,
  isPlanMarkdown,
  isConstructionPlanMarkdown,
  PLAN_STATUS_KEYWORDS,
};
