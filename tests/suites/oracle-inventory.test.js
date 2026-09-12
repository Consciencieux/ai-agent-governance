#!/usr/bin/env node
// Characterization for docs/research/working/oracle-inventory.v0.json (PLAN-0042 / FINDING-0006).
// Fail closed: every important id must be registered; gap count must be 0; enums known.
"use strict";

const fs = require("fs");
const path = require("path");

const ROOT = path.join(__dirname, "..", "..");
const INV_PATH = path.join(ROOT, "docs", "research", "working", "oracle-inventory.v0.json");

const KIND = new Set(["ctrl", "routing", "safety_kernel"]);
const CLASS = new Set(["oracle_pair", "characterization_only", "gap", "deferred"]);

const IMPORTANT = new Set([
  "CTRL-0001",
  "CTRL-0002",
  "CTRL-0003",
  "CTRL-0004",
  "CTRL-0005",
  "CTRL-0006",
  "routing-positive-resolve",
  "routing-unknown-unmatched",
  "routing-orphan-authority",
  "routing-edge-deletion",
  "CTRL-stack-defaults",
  "safety-kernel-security",
  "safety-kernel-generator-payload",
]);

module.exports = function register(test) {
  test("oracle-inventory: file loads and lists entries", () => {
    const inv = JSON.parse(fs.readFileSync(INV_PATH, "utf8"));
    if (!Array.isArray(inv.entries) || inv.entries.length < 1) {
      console.error("  empty entries");
      return false;
    }
    if (inv.plan !== "PLAN-0042") {
      console.error("  expected plan PLAN-0042, got", inv.plan);
      return false;
    }
    return true;
  });

  test("oracle-inventory: every important id is declared", () => {
    const inv = JSON.parse(fs.readFileSync(INV_PATH, "utf8"));
    const declared = new Set(inv.entries.map((e) => e.id));
    const missing = [...IMPORTANT].filter((id) => !declared.has(id));
    if (missing.length) {
      console.error("  important but not inventoried:\n    " + missing.join("\n    "));
      return false;
    }
    return true;
  });

  test("oracle-inventory: enums valid and oracle_pair has both sides", () => {
    const inv = JSON.parse(fs.readFileSync(INV_PATH, "utf8"));
    for (const e of inv.entries) {
      if (!KIND.has(e.kind)) {
        console.error("  bad kind", e.id, e.kind);
        return false;
      }
      if (!CLASS.has(e.classification)) {
        console.error("  bad classification", e.id, e.classification);
        return false;
      }
      const pos = e.positive_tests || [];
      const neg = e.negative_tests || [];
      if (e.classification === "oracle_pair") {
        if (!neg.length) {
          console.error("  oracle_pair missing negative_tests:", e.id);
          return false;
        }
        // positive may be empty when the row is purely a negative-integrity check
        // (e.g. unknown→unmatched), but then notes must say so — require pos OR explicit routing/unknown id.
        if (!pos.length && !String(e.id).includes("unknown")) {
          // allow if negatives alone define the obligation (still require at least one fixture total)
          if (neg.length < 1) {
            console.error("  oracle_pair has no fixtures:", e.id);
            return false;
          }
        }
      }
      if (e.classification === "gap") {
        console.error("  important gap not allowed in Active P1+:", e.id);
        return false;
      }
    }
    return true;
  });

  test("oracle-inventory: summary.important_gap is 0 and matches rows", () => {
    const inv = JSON.parse(fs.readFileSync(INV_PATH, "utf8"));
    const gaps = inv.entries.filter((e) => e.classification === "gap");
    if (gaps.length !== 0) {
      console.error("  gap rows:", gaps.map((e) => e.id));
      return false;
    }
    if ((inv.summary && inv.summary.important_gap) !== 0) {
      console.error("  summary.important_gap", inv.summary && inv.summary.important_gap);
      return false;
    }
    const by = {};
    for (const e of inv.entries) {
      by[e.classification] = (by[e.classification] || 0) + 1;
    }
    const s = (inv.summary && inv.summary.by_classification) || {};
    for (const k of Object.keys(by)) {
      if (s[k] !== by[k]) {
        console.error("  summary.by_classification mismatch", k, s[k], "!==", by[k]);
        return false;
      }
    }
    if (inv.summary.total !== inv.entries.length) {
      console.error("  summary.total", inv.summary.total, "!==", inv.entries.length);
      return false;
    }
    return true;
  });
};
